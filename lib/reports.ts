import fs from "node:fs";
import path from "node:path";
import type { Report } from "./schema";

const REPORTS_DIR = path.join(process.cwd(), "data", "reports");
const FILE_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;

/** Datas dos relatórios disponíveis, da mais recente para a mais antiga. */
export function listReportDates(): string[] {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  return fs
    .readdirSync(REPORTS_DIR)
    .map((f) => FILE_RE.exec(f)?.[1])
    .filter((d): d is string => Boolean(d))
    .sort()
    .reverse();
}

export function getReport(date: string): Report | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const file = path.join(REPORTS_DIR, `${date}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Report;
}

export function getLatestReport(): Report | null {
  const [latest] = listReportDates();
  return latest ? getReport(latest) : null;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
