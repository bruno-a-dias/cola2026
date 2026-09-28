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

export function buscarCandidatos(
  porUf: Record<string, CandidatoTSE[]>,
  cargo: Cargo,
  uf: string,
  termo: string
): CandidatoTSE[] {
  const ufBusca = cargo === "PRESIDENTE" ? "BR" : uf;
  const lista = porUf[ufBusca] ?? [];
  const alvo = termo.trim().toUpperCase();
  if (!alvo) return [];
  const doCargo = lista.filter((c) => c.cargo === cargo);
  const porNumero = /^\d+$/.test(alvo);
  const filtrados = porNumero
    ? doCargo.filter((c) => c.numero.startsWith(alvo))
    : doCargo.filter((c) => c.nomeUrna.toUpperCase().includes(alvo));
  return filtrados.slice(0, 6);
}
