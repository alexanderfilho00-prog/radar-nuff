import { z } from "zod";
import {
  CASES,
  CLASSIFICATIONS,
  MARKETS,
  NICHE_CATEGORIES,
  ORIGINS,
  opportunityId,
  type Round,
} from "./types";

/**
 * Formato de importação de rodadas (JSON). É o mesmo formato que a automação grava
 * em data/reports/, com dois campos a mais: `origin` e `evidenceQuote`.
 * Exemplo completo: public/exemplos/rodada-exemplo.json
 */

const text = z.string().trim().min(1, "não pode ficar vazio");
const optionalText = z.string().nullish();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use o formato AAAA-MM-DD");
const url = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\/\S+$/i.test(v), "precisa ser um link começando com http:// ou https://");
const optionalUrl = url.nullish();

const oneOf = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: () => `use um destes valores: ${values.join(", ")}` });

const OpportunityInput = z.object({
  company: text,
  niche: optionalText,
  nicheCategory: oneOf(NICHE_CATEGORIES).nullish(),
  market: oneOf(MARKETS).nullish(),
  country: optionalText,
  website: optionalUrl,
  whatHappened: optionalText,
  evidenceQuote: optionalText,
  eventDate: isoDate.nullish(),
  sourceUrl: optionalUrl,
  extraSourceUrls: z.array(url).optional(),
  classification: oneOf(CLASSIFICATIONS).nullish(),
  service: optionalText,
  serviceWhy: optionalText,
  contactName: optionalText,
  contactRole: optionalText,
  contactSourceUrl: optionalUrl,
  case: oneOf(CASES).nullish(),
  caseWhy: optionalText,
  opener: optionalText,
  openerLanguage: optionalText,
  sourceVerified: z.boolean({ error: "use true ou false" }).nullish(),
});

const RoundInput = z.object({
  date: isoDate,
  origin: oneOf(ORIGINS).default("manual"),
  generatedAt: optionalText,
  model: optionalText,
  summary: optionalText,
  marketNotes: z.array(z.object({ market: oneOf(MARKETS), note: text })).optional(),
  opportunities: z.array(OpportunityInput).min(1, "a rodada precisa ter pelo menos uma oportunidade"),
  discarded: z.array(z.object({ name: text, reason: text, url: optionalUrl })).optional(),
  searches: z.array(z.string()).optional(),
});

export interface ImportIssue {
  /** Onde corrigir, em linguagem de pessoa: "Oportunidade 2 (Wrap London) › market". */
  where: string;
  message: string;
}

export type ImportResult = { ok: true; rounds: Round[] } | { ok: false; issues: ImportIssue[] };

function describePath(path: PropertyKey[], raw: unknown, roundIndex: number | null): string {
  const parts: string[] = [];
  if (roundIndex !== null) parts.push(`Rodada ${roundIndex + 1}`);
  let node: unknown = roundIndex !== null && Array.isArray(raw) ? raw[roundIndex] : raw;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (key === "opportunities" && typeof path[i + 1] === "number") {
      const idx = path[i + 1] as number;
      const item = (node as { opportunities?: { company?: unknown }[] })?.opportunities?.[idx];
      const name = typeof item?.company === "string" && item.company.trim() ? ` (${item.company.trim()})` : "";
      parts.push(`Oportunidade ${idx + 1}${name}`);
      node = item;
      i++;
      continue;
    }
    if (typeof key === "number") {
      parts.push(`item ${key + 1}`);
    } else {
      parts.push(String(key));
    }
    node = (node as Record<string, unknown> | undefined)?.[key as string];
  }
  return parts.length ? parts.join(" › ") : "Arquivo";
}

/**
 * Lê o texto de um arquivo de rodada. Aceita uma rodada (objeto) ou várias (lista).
 * Não altera nada: quem chama decide se grava.
 */
export function parseRoundsJson(input: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch (err) {
    const detail = err instanceof SyntaxError ? err.message : "conteúdo ilegível";
    return { ok: false, issues: [{ where: "Arquivo", message: `não é um JSON válido (${detail})` }] };
  }

  const list = Array.isArray(raw) ? raw : [raw];
  if (list.length === 0) return { ok: false, issues: [{ where: "Arquivo", message: "a lista de rodadas está vazia" }] };

  const issues: ImportIssue[] = [];
  const rounds: Round[] = [];
  list.forEach((item, index) => {
    const parsed = RoundInput.safeParse(item);
    const roundIndex = Array.isArray(raw) ? index : null;
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({ where: describePath(issue.path, raw, roundIndex), message: issue.message });
      }
      return;
    }
    // Mesma empresa duas vezes na mesma rodada é erro: não há como saber qual vale.
    const seen = new Map<string, number>();
    parsed.data.opportunities.forEach((o, i) => {
      const id = opportunityId(o.company);
      if (seen.has(id)) {
        issues.push({
          where: describePath(["opportunities", i, "company"], raw, roundIndex),
          message: `"${o.company}" já aparece na oportunidade ${seen.get(id)! + 1} desta rodada`,
        });
      } else {
        seen.set(id, i);
      }
    });
    rounds.push({
      ...parsed.data,
      opportunities: parsed.data.opportunities.map((o) => ({
        ...o,
        id: opportunityId(o.company),
        extraSourceUrls: o.extraSourceUrls ?? [],
      })),
    });
  });

  return issues.length ? { ok: false, issues } : { ok: true, rounds };
}
