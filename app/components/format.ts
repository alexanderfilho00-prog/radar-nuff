export const MISSING = "Não informado";

export function hasText(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!hasText(iso)) return MISSING;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "inglês",
  pt: "português",
  es: "espanhol",
  fr: "francês",
  de: "alemão",
  it: "italiano",
  nl: "holandês",
};

export function languageName(code: string | null | undefined): string {
  if (!hasText(code)) return MISSING;
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}
