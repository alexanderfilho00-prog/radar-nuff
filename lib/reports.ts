import fs from "node:fs";
import path from "node:path";
import { parseRoundsJson } from "./radar/import";
import type { Round } from "./radar/types";

const REPORTS_DIR = path.join(process.cwd(), "data", "reports");
const FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

/**
 * Rodadas guardadas no repositório (data/reports), lidas no build.
 * Arquivos sem `origin` herdam a origem pelo campo `model`: "manual…" vira manual,
 * o resto vira automática (é o que o script da automação grava).
 */
export function loadRepositoryRounds(): { rounds: Round[]; problems: string[] } {
  if (!fs.existsSync(REPORTS_DIR)) return { rounds: [], problems: [] };
  const rounds: Round[] = [];
  const problems: string[] = [];
  for (const file of fs.readdirSync(REPORTS_DIR).filter((f) => FILE_RE.test(f)).sort()) {
    const text = fs.readFileSync(path.join(REPORTS_DIR, file), "utf8");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      problems.push(`${file}: JSON inválido`);
      continue;
    }
    if (!data.origin) {
      data.origin = String(data.model ?? "").toLowerCase().startsWith("manual") ? "manual" : "automática";
    }
    const parsed = parseRoundsJson(JSON.stringify(data));
    if (parsed.ok) rounds.push(...parsed.rounds);
    else problems.push(...parsed.issues.map((i) => `${file}: ${i.where}: ${i.message}`));
  }
  return { rounds, problems };
}
