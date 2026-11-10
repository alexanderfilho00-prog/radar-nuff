/**
 * Modelo de dados da interface (v1).
 *
 * É mais tolerante que o schema da automação (lib/schema.ts): só `company` é
 * obrigatório em cada oportunidade, para que rodadas manuais incompletas possam
 * ser importadas. Campos ausentes aparecem como "Não informado" na interface.
 */

export const MARKETS = ["EUA", "Zona do euro", "Reino Unido"] as const;
export const CLASSIFICATIONS = ["Demanda explícita", "Oportunidade inferida"] as const;
export const CASES = ["OMNIA", "N1", "N1 × Goleiro de Aluguel"] as const;
/** Valores de nicho da especificação. O campo `niche` é texto livre; ver niche.ts. */
export const NICHE_CATEGORIES = ["Beleza", "Wellness", "Esporte", "Lifestyle", "Moda", "Música", "Agência"] as const;
export const ORIGINS = ["manual", "automática"] as const;

export type Market = (typeof MARKETS)[number];
export type Classification = (typeof CLASSIFICATIONS)[number];
export type CaseName = (typeof CASES)[number];
export type NicheCategory = (typeof NICHE_CATEGORIES)[number] | "Outro";
export type Origin = (typeof ORIGINS)[number];

/** Limite da especificação: no máximo 5 oportunidades exibidas por rodada diária. */
export const MAX_VISIBLE_PER_ROUND = 5;

/**
 * Vínculo documentado entre case e tipo de serviço. É o único detalhe de case que
 * existe nos materiais: não há descrição nem links de portfólio.
 */
export const CASE_PURPOSE: Record<CaseName, string> = {
  OMNIA: "Branding e lançamento",
  N1: "Filmes de campanha",
  "N1 × Goleiro de Aluguel": "Comunidade",
};

export interface Opportunity {
  /** Identificador estável dentro da rodada (derivado do nome da empresa). */
  id: string;
  company: string;
  niche?: string | null;
  /** Opcional no arquivo; se ausente, é inferido de `niche`. */
  nicheCategory?: NicheCategory | null;
  market?: Market | null;
  country?: string | null;
  website?: string | null;
  whatHappened?: string | null;
  /** Trecho literal da fonte, quando foi registrado. */
  evidenceQuote?: string | null;
  eventDate?: string | null;
  sourceUrl?: string | null;
  extraSourceUrls?: string[];
  classification?: Classification | null;
  service?: string | null;
  serviceWhy?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  contactSourceUrl?: string | null;
  case?: CaseName | null;
  caseWhy?: string | null;
  opener?: string | null;
  openerLanguage?: string | null;
  /**
   * true: o link apareceu nos resultados conferidos.
   * false: a fonte não foi confirmada.
   * ausente: o registro não informa.
   */
  sourceVerified?: boolean | null;
}

export interface Round {
  date: string;
  origin: Origin;
  generatedAt?: string | null;
  model?: string | null;
  summary?: string | null;
  marketNotes?: { market: Market; note: string }[];
  /** Na ordem editorial do arquivo. A interface nunca reordena. */
  opportunities: Opportunity[];
  discarded?: { name: string; reason: string; url?: string | null }[];
  searches?: string[];
}

/** De onde a rodada veio para esta interface. */
export type RoundProvenance = "repositório" | "importada neste navegador";

export interface LoadedRound extends Round {
  key: string;
  provenance: RoundProvenance;
  importedAt?: string;
}

export function roundKey(r: Pick<Round, "date" | "origin">): string {
  return `${r.date}::${r.origin}`;
}

export function opportunityId(company: string): string {
  return company
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
