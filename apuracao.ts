import { Cargo } from "./lib";

// Cliente da divulgação oficial de resultados do TSE (resultados.tse.jus.br).
// Sem chave, sem cadastro: são arquivos JSON públicos. Os códigos de eleição
// mudam a cada pleito e só aparecem no config oficial perto do dia da
// votação — por isso tudo aqui é resolvido em tempo real, nunca fixo.
const BASE_URL = "https://resultados.tse.jus.br/oficial";
const CONFIG_URL = `${BASE_URL}/comum/config/ele-c.json`;

// Códigos oficiais de cargo do TSE (mesmos usados no CD_CARGO do dataset de candidatos).
const CODIGO_CARGO: Record<Cargo, number> = {
  PRESIDENTE: 1,
  GOVERNADOR: 3,
  SENADOR: 5,
  "DEPUTADO FEDERAL": 6,
  "DEPUTADO ESTADUAL": 7,
};

export class ApuracaoIndisponivel extends Error {}

export type CandidatoApurado = {
  posicao: number;
  nome: string;
  numero: string;
  partido: string;
  votos: number;
  pct: number;
  situacao: string;
  eleito: boolean;
};

export type ResultadoApuracao = {
  atualizadoEm: string;
  apuradoPct: number;
  matematicamenteDefinido: boolean;
  totais: {
    eleitorado: number;
    comparecimento: number;
    comparecimentoPct: number;
    abstencaoPct: number;
    votosValidos: number;
    brancos: number;
    nulos: number;
  };
  candidatos: CandidatoApurado[];
};

function semAcento(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function paraNumero(s: unknown): number {
  if (s === null || s === undefined || s === "") return 0;
  const n = Number(String(s).replace(/\./g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export function paraPct(s: unknown): number {
  if (s === null || s === undefined || s === "") return 0;
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

export function partidoDe(cc: unknown, sgp: unknown): string {
  const texto = String(cc ?? "").split(" - ")[0].trim();
  return texto || String(sgp ?? "");
}

// Normaliza o JSON bruto do TSE (dados-simplificados) pro formato do app.
export function normalizarResultado(raw: any): ResultadoApuracao {
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
    matematicamenteDefinido: raw.md === "S",
    totais: {
      eleitorado: paraNumero(raw.e),
      comparecimento: paraNumero(raw.c),
      comparecimentoPct: paraPct(raw.pc),
      abstencaoPct: paraPct(raw.pa),
      votosValidos: paraNumero(raw.vv),
      brancos: paraNumero(raw.vb),
      nulos: paraNumero(raw.tvn),
    },
    candidatos,
  };
}

type Eleicao = { ciclo: string; codigo: string; nome: string; data: string };

let cacheConfig: { dados: any; buscadoEm: number } | null = null;
const TTL_CONFIG_MS = 5 * 60 * 1000;

async function buscarConfig(): Promise<any> {
  if (cacheConfig && Date.now() - cacheConfig.buscadoEm < TTL_CONFIG_MS) {
    return cacheConfig.dados;
  }
  let resp: Response;
  try {
    resp = await fetch(CONFIG_URL);
  } catch {
    throw new ApuracaoIndisponivel(
      "Não consegui falar com o TSE agora. Confira sua internet e tente de novo."
    );
  }
  if (!resp.ok) {
    throw new ApuracaoIndisponivel("Não consegui falar com o TSE agora. Tente de novo em instantes.");
  }
  const dados = await resp.json();
  cacheConfig = { dados, buscadoEm: Date.now() };
  return dados;
}

function parseDataBr(s: string): number {
  const [dia, mes, ano] = s.split("/").map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1).getTime();
}

async function resolverEleicao(cargoCd: number, uf: string, turno: number): Promise<Eleicao> {
  const cfg = await buscarConfig();
  const candidatas: { dist: number; el: Eleicao }[] = [];
  const agora = Date.now();

  for (const pleito of cfg.pl ?? []) {
    for (const e of pleito.e ?? []) {
      if (!semAcento(String(e.nm ?? "")).toLowerCase().includes("ordin")) continue;
      if (String(e.t) !== String(turno)) continue;
      for (const abr of e.abr ?? []) {
        const abrangencia = String(abr.cd ?? "").toLowerCase();
        const cargos: number[] = (abr.cp ?? []).map((c: any) => Number(c.cd));
        if (!cargos.includes(cargoCd)) continue;
        if (abrangencia !== "br" && abrangencia !== uf) continue;
        const data = e.dt || pleito.dt || "01/01/1970";
        const ano = Number(String(data).slice(-4));
        candidatas.push({
          dist: Math.abs(parseDataBr(data) - agora),
          el: {
            ciclo: `ele${ano}`,
            codigo: String(e.cd),
            nome: String(e.nm ?? "").replace(/&#186;/g, "º"),
            data,
          },
        });
      }
    }
  }

  candidatas.sort((a, b) => a.dist - b.dist);
  if (candidatas.length === 0) {
    throw new ApuracaoIndisponivel(
      "O TSE ainda não publicou a apuração das Eleições 2026. A divulgação de " +
        "resultados começa no dia da votação, a partir do fechamento das urnas."
    );
  }
  return candidatas[0].el;
}

function urlResultado(el: Eleicao, cargoCd: number, uf: string): string {
  const codigoNum = parseInt(el.codigo, 10);
  const cargoStr = String(cargoCd).padStart(4, "0");
  const eleicaoStr = String(codigoNum).padStart(6, "0");
  return `${BASE_URL}/${el.ciclo}/${el.codigo}/dados-simplificados/${uf}/${uf}-c${cargoStr}-e${eleicaoStr}-r.json`;
}

export async function buscarApuracao(
  cargo: Cargo,
  ufSelecionada: string,
  turno: 1 | 2 = 1
): Promise<ResultadoApuracao> {
  const cargoCd = CODIGO_CARGO[cargo];
  const uf = cargo === "PRESIDENTE" ? "br" : ufSelecionada.toLowerCase();
  const el = await resolverEleicao(cargoCd, uf, turno);
  const url = urlResultado(el, cargoCd, uf);

  let resp: Response;
  try {
    resp = await fetch(url);
  } catch {
    throw new ApuracaoIndisponivel(
      "Não consegui falar com o TSE agora. Confira sua internet e tente de novo."
    );
  }
  if (resp.status === 404) {
    throw new ApuracaoIndisponivel(
      "O TSE ainda não publicou a apuração para esse cargo/estado. Tente de novo mais perto do fechamento das urnas."
    );
  }
  if (!resp.ok) {
    throw new ApuracaoIndisponivel("Não consegui falar com o TSE agora. Tente de novo em instantes.");
  }
  return normalizarResultado(await resp.json());
}
