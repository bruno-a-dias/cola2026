export type Cargo =
  | "PRESIDENTE"
  | "GOVERNADOR"
  | "SENADOR"
  | "DEPUTADO FEDERAL"
  | "DEPUTADO ESTADUAL";

export const CARGOS: Cargo[] = [
  "PRESIDENTE",
  "GOVERNADOR",
  "SENADOR",
  "DEPUTADO FEDERAL",
  "DEPUTADO ESTADUAL",
];

// Dígitos oficiais do número de urna por cargo (TSE).
export const DIGITOS_POR_CARGO: Record<Cargo, number> = {
  PRESIDENTE: 2,
  GOVERNADOR: 2,
  SENADOR: 2,
  "DEPUTADO FEDERAL": 4,
  "DEPUTADO ESTADUAL": 5,
};

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
export type Uf = (typeof UFS)[number];

export function capitalizar(texto: string): string {
  return texto
    .toLowerCase()
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Candidato conforme vem do dataset oficial (consulta_cand_2026 do TSE).
export type CandidatoTSE = {
  cargo: Cargo;
  numero: string;
  nomeUrna: string;
  nomeCompleto: string;
  partido: string;
  sqCandidato: string;
};

// Entrada salva pelo usuário na cola.
export type Candidato = {
  id: string;
  cargo: Cargo;
  nome: string;
  numero: string;
  partido: string;
  uf: string; // "BR" para presidente
  sqCandidato?: string; // presente quando veio do dataset oficial (permite foto)
};

export function ordenarPorCargo(lista: Candidato[]): Candidato[] {
  return [...lista].sort(
    (a, b) => CARGOS.indexOf(a.cargo) - CARGOS.indexOf(b.cargo)
  );
}

// Dado oficial: sqCandidato + uf identificam a foto no sistema do TSE.
export function fotoUrl(uf: string, sqCandidato: string): string {
  return `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/${sqCandidato}/${uf}`;
}

function ufDoCargo(cargo: Cargo, uf: string): string {
  return cargo === "PRESIDENTE" ? "BR" : uf;
}

function candidatosDoCargo(
  porUf: Record<string, CandidatoTSE[]>,
  cargo: Cargo,
  uf: string
): CandidatoTSE[] {
  const lista = porUf[ufDoCargo(cargo, uf)] ?? [];
  return lista.filter((c) => c.cargo === cargo);
}

export type Filtros = {
  numero?: string;
  nome?: string;
  partido?: string;
};

export function filtrarCandidatos(
  porUf: Record<string, CandidatoTSE[]>,
  cargo: Cargo,
  uf: string,
  filtros: Filtros
): CandidatoTSE[] {
  const numero = filtros.numero?.trim() ?? "";
  const nome = filtros.nome?.trim().toUpperCase() ?? "";
  return candidatosDoCargo(porUf, cargo, uf)
    .filter(
      (c) =>
        (!numero || c.numero.startsWith(numero)) &&
        (!nome || c.nomeUrna.toUpperCase().includes(nome)) &&
        (!filtros.partido || c.partido === filtros.partido)
    )
    .sort((a, b) => Number(a.numero) - Number(b.numero));
}

export function partidosDisponiveis(
  porUf: Record<string, CandidatoTSE[]>,
  cargo: Cargo,
  uf: string
): string[] {
  const partidos = new Set(candidatosDoCargo(porUf, cargo, uf).map((c) => c.partido));
  return [...partidos].sort();
}

// Garante uma linha por cargo (mesmo sem candidato escolhido), para a folha
// impressa/compartilhada não deixar de fora quem ainda está indeciso.
export function preencherCargosFaltantes(candidatos: Candidato[]): Candidato[] {
  const completa = CARGOS.map((cargo) => {
    const existente = candidatos.find((c) => c.cargo === cargo);
    return (
      existente ?? {
        id: `vazio-${cargo}`,
        cargo,
        nome: "",
        numero: "",
        partido: "",
        uf: "",
      }
    );
  });
  return completa;
}

// Cores oficiais (aproximadas) de alguns dos maiores partidos, usadas só
// como destaque visual de fundo. Partido sem cor cadastrada cai no tema
// padrão do app.
export const CORES_PARTIDO: Record<string, string[]> = {
  PT: ["#8B0000", "#C8102E"],
  PL: ["#009C3B", "#FFDF00"],
  "MISSÃO": ["#FFD400", "#FFB800"],
  MDB: ["#00A651", "#00753A"],
  PSDB: ["#003DA5", "#0072CE"],
  PSD: ["#0F4C91", "#00AEEF"],
  PP: ["#003DA5", "#7BA4DB"],
  PDT: ["#C8102E", "#0033A0"],
  PSB: ["#FFD400", "#C8102E"],
  PSOL: ["#FFD400", "#1A1A1A"],
  REPUBLICANOS: ["#002D72", "#7BA4DB"],
  PODE: ["#F7931E", "#FFB25B"],
  NOVO: ["#FF7A00", "#FFA352"],
  REDE: ["#00A550", "#6FCF97"],
  "UNIÃO": ["#0057B7", "#7BA4DB"],
  CIDADANIA: ["#EC008C", "#FF6EC7"],
  AVANTE: ["#F58220", "#FFB25B"],
  PCDOB: ["#C8102E", "#8B0000"],
  PV: ["#007A33", "#6FCF97"],
};

export function corDeFundo(partido: string | undefined): string[] {
  if (!partido) return [];
  return CORES_PARTIDO[partido] ?? [];
}
