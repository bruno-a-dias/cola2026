// Script único (build-time) que converte o CSV oficial do TSE em JSON por UF.
// Rodar: node scripts/build-candidatos.js
// Fonte: https://dadosabertos.tse.jus.br/dataset/candidatos-2026 (consulta_cand_2026.zip)
const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "..", "tse_raw");
const OUT_FILE = path.join(__dirname, "..", "assets", "candidatos.json");

const CARGOS_ACEITOS = new Set([
  "PRESIDENTE",
  "GOVERNADOR",
  "SENADOR",
  "DEPUTADO FEDERAL",
  "DEPUTADO ESTADUAL",
  "DEPUTADO DISTRITAL", // DF usa esse nome no lugar de Deputado Estadual
]);

function normalizarCargo(dsCargo) {
  return dsCargo === "DEPUTADO DISTRITAL" ? "DEPUTADO ESTADUAL" : dsCargo;
}

// Parser simples de linha CSV com campos entre aspas separados por ';'.
function parseLinhaCsv(linha) {
  const campos = [];
  let atual = "";
  let dentroAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      dentroAspas = !dentroAspas;
    } else if (ch === ";" && !dentroAspas) {
      campos.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }
  campos.push(atual);
  return campos;
}

function lerCsv(caminho) {
  const texto = fs.readFileSync(caminho, "latin1");
  const linhas = texto.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  const header = parseLinhaCsv(linhas[0]);
  const idx = Object.fromEntries(header.map((nome, i) => [nome, i]));
  return linhas.slice(1).map((linha) => {
    const campos = parseLinhaCsv(linha);
    return {
      cargo: normalizarCargo(campos[idx.DS_CARGO]),
      numero: campos[idx.NR_CANDIDATO],
      nomeUrna: campos[idx.NM_URNA_CANDIDATO],
      nomeCompleto: campos[idx.NM_CANDIDATO],
      partido: campos[idx.SG_PARTIDO],
      sqCandidato: campos[idx.SQ_CANDIDATO],
    };
  });
}

const arquivos = fs
  .readdirSync(RAW_DIR)
  .filter((f) => /^consulta_cand_2026_[A-Z]{2}\.csv$/.test(f) && f !== "consulta_cand_2026_BRASIL.csv");

let totalCandidatos = 0;
const geradoEm = new Date().toISOString().slice(0, 10);
const porUf = {};

for (const arquivo of arquivos) {
  const registros = lerCsv(path.join(RAW_DIR, arquivo)).filter((r) =>
    CARGOS_ACEITOS.has(r.cargo)
  );
  const uf = arquivo.match(/_([A-Z]{2})\.csv$/)[1];
  porUf[uf] = registros;
  totalCandidatos += registros.length;
  console.log(`${uf}: ${registros.length} candidatos`);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify({ geradoEm, porUf }));

console.log(`\nTotal: ${totalCandidatos} candidatos em ${arquivos.length} UFs.`);
console.log(`Gerado em: ${OUT_FILE}`);
