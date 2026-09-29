// Checagem rápida da normalização do JSON de apuração do TSE, contra um
// exemplo real publicado (fixtures/apuracao-exemplo.json). Roda com:
//   node scripts/check-apuracao.js
// Reimplementa só as funções puras de parsing (mesma lógica de apuracao.ts)
// pra não depender de toolchain TS/ESM neste script.
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

function semAcento(s) {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}
function paraNumero(s) {
  if (s === null || s === undefined || s === "") return 0;
  const n = Number(String(s).replace(/\./g, ""));
  return Number.isNaN(n) ? 0 : n;
}
function paraPct(s) {
  if (s === null || s === undefined || s === "") return 0;
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}
function partidoDe(cc, sgp) {
  const texto = String(cc ?? "").split(" - ")[0].trim();
  return texto || String(sgp ?? "");
}
function normalizarResultado(raw) {
  const candidatos = [...(raw.cand ?? [])]
    .sort((a, b) => paraNumero(b.vap) - paraNumero(a.vap))
    .map((c, i) => ({
      posicao: i + 1,
      nome: String(c.nm ?? ""),
      numero: String(c.n ?? ""),
      partido: partidoDe(c.cc, c.sgp),
      votos: paraNumero(c.vap),
      pct: paraPct(c.pvap),
      situacao: String(c.st ?? ""),
      eleito: semAcento(String(c.st ?? "")).toLowerCase().startsWith("eleit"),
    }));
  return {
    atualizadoEm: `${raw.dg ?? ""} ${raw.hg ?? ""}`.trim(),
    apuradoPct: paraPct(raw.pst),
    totais: { eleitorado: paraNumero(raw.e), comparecimento: paraNumero(raw.c) },
    candidatos,
  };
}

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "fixtures", "apuracao-exemplo.json"), "utf-8")
);
const r = normalizarResultado(raw);

assert.strictEqual(r.candidatos.length, 2);
assert.strictEqual(r.candidatos[0].nome, "TARCÍSIO");
assert.strictEqual(r.candidatos[0].votos, 13480643);
assert.strictEqual(r.candidatos[0].pct, 55.27);
assert.strictEqual(r.candidatos[0].partido, "REPUBLICANOS");
assert.strictEqual(r.candidatos[0].eleito, true);
assert.strictEqual(r.candidatos[1].nome, "FERNANDO HADDAD");
assert.strictEqual(r.candidatos[1].eleito, false);
assert.strictEqual(r.apuradoPct, 100);
assert.strictEqual(r.totais.eleitorado, 34642067);
assert.strictEqual(r.atualizadoEm, "30/10/2022 22:19:56");

function formatarNumero(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
assert.strictEqual(formatarNumero(13480643), "13.480.643");
assert.strictEqual(formatarNumero(999), "999");

console.log("OK: normalização da apuração bate com o exemplo real do TSE.");
