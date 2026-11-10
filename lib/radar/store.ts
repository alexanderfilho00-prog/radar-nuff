import { parseRoundsJson } from "./import";
import { roundKey, type LoadedRound, type Round } from "./types";

/**
 * Persistência das rodadas importadas no navegador (localStorage).
 *
 * Camadas de dados:
 * - repositório: rodadas em data/reports/*.json, lidas no build (hoje, a rodada manual
 *   de 10/11/2026; no futuro, as rodadas da automação).
 * - navegador: rodadas importadas pela interface, gravadas aqui.
 * As duas se combinam por `roundKey` (data + origem), com a regra de mesclagem abaixo.
 */

const STORAGE_KEY = "radar-nuff:rodadas-importadas:v1";

interface StoredRound extends Round {
  importedAt: string;
}

export function readStoredRounds(): { rounds: StoredRound[]; warning?: string } {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { rounds: [], warning: "O navegador bloqueou o armazenamento local. Importações não vão ficar salvas." };
  }
  if (!raw) return { rounds: [] };
  const parsed = parseRoundsJson(raw);
  if (!parsed.ok) {
    return { rounds: [], warning: "Os dados importados salvos neste navegador estão corrompidos e foram ignorados." };
  }
  const meta = (JSON.parse(raw) as { importedAt?: string }[]).map((r) => r.importedAt);
  return {
    rounds: parsed.rounds.map((r, i) => ({ ...r, importedAt: meta[i] ?? new Date(0).toISOString() })),
  };
}

function writeStoredRounds(rounds: StoredRound[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
}

/**
 * Mescla uma rodada nova sobre uma existente com a mesma data e origem.
 * - Oportunidades são casadas pelo nome da empresa (id): uma reimportação atualiza
 *   o registro existente no lugar, sem duplicar.
 * - Empresas novas entram no fim, preservando a ordem editorial do que já existia.
 * - Campos da rodada (resumo, notas etc.) usam o valor novo quando ele vem preenchido.
 */
export function mergeRound(base: Round, incoming: Round): Round {
  const byId = new Map(incoming.opportunities.map((o) => [o.id, o]));
  const merged = base.opportunities.map((o) => (byId.has(o.id) ? { ...o, ...byId.get(o.id)! } : o));
  const known = new Set(base.opportunities.map((o) => o.id));
  for (const o of incoming.opportunities) if (!known.has(o.id)) merged.push(o);
  const pick = <K extends keyof Round>(k: K) => (incoming[k] ?? base[k]) as Round[K];
  return {
    date: base.date,
    origin: base.origin,
    generatedAt: pick("generatedAt"),
    model: pick("model"),
    summary: pick("summary"),
    marketNotes: incoming.marketNotes?.length ? incoming.marketNotes : base.marketNotes,
    discarded: incoming.discarded?.length ? incoming.discarded : base.discarded,
    searches: incoming.searches?.length ? incoming.searches : base.searches,
    opportunities: merged,
  };
}

/** Junta as rodadas do repositório com as importadas. Mais recentes primeiro. */
export function combineRounds(repo: Round[], stored: StoredRound[]): LoadedRound[] {
  const map = new Map<string, LoadedRound>();
  for (const r of repo) map.set(roundKey(r), { ...r, key: roundKey(r), provenance: "repositório" });
  for (const s of stored) {
    const key = roundKey(s);
    const existing = map.get(key);
    const { importedAt, ...round } = s;
    map.set(key, {
      ...(existing ? mergeRound(existing, round) : round),
      key,
      provenance: "importada neste navegador",
      importedAt,
    });
  }
  return [...map.values()].sort((a, b) =>
    a.date === b.date ? a.origin.localeCompare(b.origin) : b.date.localeCompare(a.date),
  );
}

export interface ImportSummary {
  key: string;
  date: string;
  origin: string;
  added: number;
  updated: number;
}

/**
 * Valida e grava. Se o arquivo tiver qualquer erro, nada é gravado e os dados
 * existentes continuam iguais.
 */
export function importRounds(
  input: string,
  current: LoadedRound[],
): { ok: true; summaries: ImportSummary[] } | { ok: false; issues: { where: string; message: string }[] } {
  const parsed = parseRoundsJson(input);
  if (!parsed.ok) return parsed;

  const { rounds: stored } = readStoredRounds();
  const next = new Map(stored.map((s) => [roundKey(s), s]));
  const now = new Date().toISOString();
  const summaries: ImportSummary[] = [];

  for (const incoming of parsed.rounds) {
    const key = roundKey(incoming);
    const visible = current.find((r) => r.key === key);
    const visibleIds = new Set(visible?.opportunities.map((o) => o.id) ?? []);
    const added = incoming.opportunities.filter((o) => !visibleIds.has(o.id)).length;
    summaries.push({
      key,
      date: incoming.date,
      origin: incoming.origin,
      added,
      updated: incoming.opportunities.length - added,
    });
    const previous = next.get(key);
    const mergedRound = previous ? mergeRound(previous, incoming) : incoming;
    next.set(key, { ...mergedRound, importedAt: now });
  }

  try {
    writeStoredRounds([...next.values()]);
  } catch {
    return {
      ok: false,
      issues: [{ where: "Navegador", message: "não foi possível salvar no armazenamento local (bloqueado ou cheio). Nada foi alterado." }],
    };
  }
  return { ok: true, summaries };
}

export function clearStoredRounds(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // armazenamento bloqueado: não há o que limpar
  }
}
