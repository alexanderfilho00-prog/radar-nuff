import { NICHE_CATEGORIES, type NicheCategory, type Opportunity } from "./types";

/**
 * Decisão da v1: o campo `niche` é texto livre ("Beleza (escovas de cabelo)").
 * Para o filtro, a categoria vem de `nicheCategory`, quando o arquivo traz,
 * ou da primeira palavra-chave reconhecida no início do texto.
 */
const KEYWORDS: [RegExp, NicheCategory][] = [
  [/^ag[eê]ncia/i, "Agência"],
  [/^beleza|^beauty|^skincare|^cosm[eé]tic/i, "Beleza"],
  [/^wellness|^bem-estar/i, "Wellness"],
  [/^esporte|^sport|^running|^corrida/i, "Esporte"],
  [/^lifestyle/i, "Lifestyle"],
  [/^moda|^fashion/i, "Moda"],
  [/^m[uú]sica|^music/i, "Música"],
];

export function nicheCategoryOf(o: Pick<Opportunity, "niche" | "nicheCategory">): NicheCategory {
  if (o.nicheCategory && (NICHE_CATEGORIES as readonly string[]).includes(o.nicheCategory)) {
    return o.nicheCategory;
  }
  const text = (o.niche ?? "").trim();
  for (const [re, cat] of KEYWORDS) if (re.test(text)) return cat;
  return "Outro";
}
