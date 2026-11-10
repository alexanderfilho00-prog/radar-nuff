/**
 * Radar de Prospecção Criativa: roda a pesquisa diária e salva
 * data/reports/AAAA-MM-DD.json.
 *
 * Etapa 1: o Claude pesquisa na web (web_search + web_fetch) e escreve as notas.
 * Etapa 2: o Claude converte as notas em JSON validado pelo schema.
 * Etapa 3: cada fonte citada é conferida contra as URLs que o radar realmente viu.
 *
 * Uso: ANTHROPIC_API_KEY=... npm run radar
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import fs from "node:fs";
import path from "node:path";
import { ReportSchema, type Report } from "../lib/schema";

const MODEL = process.env.RADAR_MODEL ?? "claude-opus-5-5";
const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, "data", "reports");
const PROFILE_PATH = path.join(ROOT, "config", "perfil.md");
const MAX_CONTINUATIONS = 8;
// Fallback do servidor: se um classificador de segurança recusar o pedido,
// a API refaz a mesma chamada em outro modelo automaticamente.
const BETAS = ["server-side-fallback-2026-07-01"];

const client = new Anthropic();

function todayInBrasilia(): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function shiftDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Empresas já reportadas nos últimos relatórios, para não repetir. */
function previouslyReported(limit = 15): string[] {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse()
    .slice(0, limit);
  const names = new Set<string>();
  for (const f of files) {
    try {
      const r = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), "utf8")) as Report;
      for (const o of r.opportunities) names.add(`${o.company} (${f.slice(0, 10)})`);
    } catch {
      // arquivo inválido: ignora
    }
  }
  return [...names];
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u.trim());
    url.hash = "";
    for (const p of [...url.searchParams.keys()]) if (p.startsWith("utm_")) url.searchParams.delete(p);
    return `${url.host.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}${url.search}`.toLowerCase();
  } catch {
    return u.trim().toLowerCase();
  }
}

/** Junta todas as URLs que apareceram em resultados de busca ou páginas lidas. */
function collectSeenUrls(content: Anthropic.Beta.BetaContentBlock[]): Set<string> {
  const seen = new Set<string>();
  for (const block of content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) seen.add(normalizeUrl(r.url));
    } else if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result") {
      seen.add(normalizeUrl(block.content.url));
    }
  }
  return seen;
}

async function research(today: string, profile: string, already: string[]) {
  const since = shiftDate(today, -14);
  const system = `Você é o "Radar de Prospecção Criativa", um pesquisador de oportunidades comerciais.
Você usa as ferramentas web_search e web_fetch para encontrar sinais públicos e abre as páginas para conferir datas e detalhes.
Só reporte o que conseguiu conferir numa fonte. Nunca invente contatos, valores ou moeda de contratação.

${profile}`;

  const user = `Hoje é ${today} (horário de Brasília). Procure sinais publicados entre ${since} e ${today}.

${
  already.length
    ? `Já reportadas em relatórios anteriores (não repita, a menos que haja um sinal novo):\n${already.map((n) => `- ${n}`).join("\n")}`
    : "Este é o primeiro relatório."
}

Como trabalhar:
1. Busque pedidos explícitos primeiro, depois sinais inferidos, nos três mercados e em inglês e português.
2. Abra (web_fetch) a página de cada candidato forte para confirmar a data, o que foi pedido e, se houver, o nome do contato. Abra também o site oficial da empresa quando puder.
3. Escolha até 5 oportunidades no total.

Ao terminar, escreva suas notas finais em português com, para cada oportunidade: empresa, nicho, mercado (EUA, Zona do euro ou Reino Unido), país, site, o que aconteceu, data (AAAA-MM-DD), URL exata da fonte (copiada dos resultados), outras fontes, classificação (Demanda explícita ou Oportunidade inferida), serviço e por quê, contato (nome só se verificado, com a URL que o verifica; senão, só o cargo), case (OMNIA, N1 ou N1 × Goleiro de Aluguel) e por quê, e uma abertura de até 3 linhas no idioma do contato.
Inclua também: resumo do dia, observação por mercado sem oportunidade forte, sinais descartados (com motivo e URL) e as principais buscas feitas.`;

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: user }];
  let assistantContent: Anthropic.Beta.BetaContentBlock[] = [];

  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: BETAS,
      fallbacks: "default",
      output_config: { effort: "high" },
      system,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 30 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 40, max_content_tokens: 20000 },
      ],
      messages:
        assistantContent.length > 0
          ? [...messages, { role: "assistant", content: assistantContent as Anthropic.Beta.BetaContentBlockParam[] }]
          : messages,
    });
    const msg = await stream.finalMessage();
    assistantContent = [...assistantContent, ...msg.content];
    console.log(`[radar] etapa 1, rodada ${i + 1}: stop_reason=${msg.stop_reason}, saída=${msg.usage.output_tokens} tokens`);

    if (msg.stop_reason === "pause_turn") continue; // o servidor retoma de onde parou
    if (msg.stop_reason === "refusal") {
      throw new Error(`Pedido recusado: ${msg.stop_details?.category ?? "sem categoria"}`);
    }
    if (msg.stop_reason === "max_tokens") console.warn("[radar] atenção: a resposta atingiu max_tokens");
    break;
  }

  const notes = assistantContent
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!notes) throw new Error("A etapa de pesquisa terminou sem notas.");
  return { notes, seenUrls: collectSeenUrls(assistantContent) };
}

async function structure(today: string, notes: string) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(ReportSchema) },
    messages: [
      {
        role: "user",
        content: `Converta as notas de pesquisa abaixo, de ${today}, no formato pedido.
Use só o que está nas notas: não acrescente empresas, contatos, links ou fatos. Mantenha as URLs exatamente como estão.
Se um campo não estiver nas notas, use null (nos campos que aceitam null) ou escreva "não verificado".

<notas>
${notes}
</notas>`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Conversão recusada.");
  if (!response.parsed_output) throw new Error("Não foi possível converter as notas em JSON.");
  return response.parsed_output;
}

async function main() {
  const today = process.env.RADAR_DATE ?? todayInBrasilia();
  const profile = fs.readFileSync(PROFILE_PATH, "utf8");
  const already = previouslyReported();

  console.log(`[radar] ${today}: pesquisando com ${MODEL}...`);
  const { notes, seenUrls } = await research(today, profile, already);
  console.log(`[radar] ${seenUrls.size} URLs vistas nas buscas e leituras. Estruturando...`);
  const parsed = await structure(today, notes);

  const report: Report = {
    ...parsed,
    date: today,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    opportunities: parsed.opportunities.slice(0, 5).map((o) => ({
      ...o,
      sourceVerified: seenUrls.has(normalizeUrl(o.sourceUrl)),
    })),
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const out = path.join(REPORTS_DIR, `${today}.json`);
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  const unverified = report.opportunities.filter((o) => !o.sourceVerified).length;
  console.log(`[radar] ${report.opportunities.length} oportunidades salvas em ${path.relative(ROOT, out)}`);
  if (unverified) console.warn(`[radar] ${unverified} com fonte não encontrada nos resultados: revisar.`);
}

main().catch((err) => {
  if (err instanceof Anthropic.AuthenticationError) {
    console.error("[radar] ANTHROPIC_API_KEY ausente ou inválida.");
  } else if (err instanceof Anthropic.RateLimitError) {
    console.error("[radar] Limite de requisições da API atingido. Tente de novo mais tarde.");
  } else if (err instanceof Anthropic.APIError) {
    console.error(`[radar] Erro da API (${err.status}): ${err.message}`);
  } else {
    console.error("[radar]", err);
  }
  process.exit(1);
});
