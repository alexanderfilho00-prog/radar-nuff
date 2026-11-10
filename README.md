# Radar de Prospecção Criativa

Busca, todo dia útil, sinais públicos dos últimos 14 dias de que marcas independentes (beleza, wellness, esporte, lifestyle, moda e música) e agências boutique podem precisar de **branding, posicionamento, comunidade ou edição de filmes de campanha**. Os mercados são EUA, zona do euro (Portugal primeiro) e Reino Unido.

Ele traz até 5 oportunidades, cada uma com fonte, serviço sugerido, quem abordar, o case certo (OMNIA, N1 ou N1 × Goleiro de Aluguel) e uma abertura pronta para revisar. **Nada é enviado automaticamente.**

## Como funciona

```
GitHub Actions (dias úteis, 8h34 de Brasília)
  └─ npm run radar
       1. Claude pesquisa na web (busca + leitura das páginas)
       2. Claude converte as notas em JSON validado
       3. cada fonte é conferida contra as páginas que o radar realmente viu
  └─ commit de data/reports/AAAA-MM-DD.json
        └─ Vercel publica o site de novo com o relatório do dia
```

- `config/perfil.md`: o briefing (nichos, mercados, cases, regras). **Edite aqui** para mudar o que o radar procura.
- `scripts/radar.ts`: a rotina de pesquisa.
- `data/reports/`: um JSON por dia. É o histórico, e o radar o usa para não repetir empresas.
- `app/`: o site (Next.js).

Uma oportunidade cuja fonte não apareceu nos resultados da pesquisa ganha o aviso **"fonte não confirmada, revisar"** no site.

## Configuração

### 1. GitHub
1. Em **Settings → Secrets and variables → Actions**, crie o secret `ANTHROPIC_API_KEY` com uma chave da API do Claude (console.anthropic.com).
2. Em **Settings → Actions → General → Workflow permissions**, marque **Read and write permissions** para o workflow poder salvar o relatório.
3. Para testar na hora: **Actions → Radar diário → Run workflow**.

### 2. Vercel
1. **Add New → Project** e importe este repositório. O framework (Next.js) é detectado sozinho. Não precisa de chave de API na Vercel.
2. Opcional, para proteger o site com senha: em **Settings → Environment Variables**, crie `SITE_PASSWORD` (e `SITE_USER`, se quiser; o padrão é `radar`).
3. Cada commit do radar dispara um novo deploy com o relatório do dia.

### Rodar localmente
```bash
npm install
```
```bash
ANTHROPIC_API_KEY=sk-ant-... npm run radar
```
```bash
npm run dev
```

## Ajustes comuns
- **Horário:** linha `cron` em `.github/workflows/radar.yml` (em UTC; Brasília é UTC−3).
- **Modelo:** variável `RADAR_MODEL` (padrão `claude-opus-5-5`).
- **Profundidade da busca:** `max_uses` das ferramentas e `effort` em `scripts/radar.ts`.

## Custo
Cada execução faz dezenas de buscas e leituras de páginas e usa o modelo mais capaz, então o custo por dia não é desprezível. Acompanhe no console da Anthropic nas primeiras semanas. Para reduzir, diminua os `max_uses` ou o `effort` em `scripts/radar.ts`.
