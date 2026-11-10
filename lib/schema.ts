import { z } from "zod";

export const MARKETS = ["EUA", "Zona do euro", "Reino Unido"] as const;
export const CLASSIFICATIONS = ["Demanda explícita", "Oportunidade inferida"] as const;
export const CASES = ["OMNIA", "N1", "N1 × Goleiro de Aluguel"] as const;

export const OpportunitySchema = z.object({
  company: z.string().describe("Empresa, artista, selo ou agência"),
  niche: z.string().describe("Nicho: beleza, wellness, esporte, lifestyle, moda, música ou agência"),
  market: z.enum(MARKETS),
  country: z.string().describe("País, em português"),
  website: z.string().nullable().describe("Site oficial, ou null se não verificado"),
  whatHappened: z.string().describe("O que aconteceu, em português, 1 a 3 frases"),
  eventDate: z.string().describe("Data do sinal no formato AAAA-MM-DD"),
  sourceUrl: z.string().describe("Link para a fonte original"),
  extraSourceUrls: z.array(z.string()).describe("Outras fontes usadas, se houver"),
  classification: z.enum(CLASSIFICATIONS),
  service: z.string().describe("Serviço que faz sentido oferecer agora"),
  serviceWhy: z.string().describe("Por que esse serviço agora"),
  contactName: z.string().nullable().describe("Nome do contato, só se verificado numa fonte"),
  contactRole: z.string().describe("Cargo de quem abordar"),
  contactSourceUrl: z.string().nullable().describe("Fonte que verifica o nome do contato"),
  case: z.enum(CASES),
  caseWhy: z.string(),
  opener: z.string().describe("Abertura de até 3 linhas, no idioma do contato"),
  openerLanguage: z.string().describe("Código do idioma da abertura, ex.: en, pt, es, fr, de"),
});

export const DiscardedSchema = z.object({
  name: z.string(),
  reason: z.string(),
  url: z.string().nullable(),
});

export const ReportSchema = z.object({
  summary: z.string().describe("Resumo do dia em 2 a 4 frases, em português"),
  marketNotes: z
    .array(z.object({ market: z.enum(MARKETS), note: z.string() }))
    .describe("Observação por mercado quando não houve oportunidade forte"),
  opportunities: z.array(OpportunitySchema),
  discarded: z.array(DiscardedSchema),
  searches: z.array(z.string()).describe("Principais consultas feitas"),
});

export type Opportunity = z.infer<typeof OpportunitySchema> & {
  /** true quando o link da fonte apareceu nos resultados de busca ou leitura do radar */
  sourceVerified: boolean;
};

export type Report = Omit<z.infer<typeof ReportSchema>, "opportunities"> & {
  date: string;
  generatedAt: string;
  model: string;
  opportunities: Opportunity[];
};
