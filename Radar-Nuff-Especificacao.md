# Radar Nuff: especificação do produto

Documento de passagem para a próxima etapa, o desenho da interface do app. Ele descreve o radar como existe hoje e preserva a lógica que já foi definida.

**Data:** 10/11/2026
**Fontes deste documento:** a conversa de definição do radar e os arquivos do repositório `alexanderfilho00-prog/radar-nuff` (branch `claude/radar-prospeccao-criativa-m9w1we`).

**Como ler as marcações:**
- ✅ **Decisão confirmada:** pedida ou aprovada pelo usuário.
- 🛠️ **Implementado por proposta técnica:** construído pelo Claude sem objeção do usuário, mas também sem aprovação explícita.
- 💬 **Ideia discutida:** levantada, ainda sem decisão.
- ⏳ **Pendência:** algo que falta decidir ou fazer.
- ⚠️ **Lacuna:** informação que não existe ou que não estava acessível.

> **Nome:** a conversa usou "Radar de Prospecção Criativa" como nome da tarefa e do site. "Radar de Oportunidades do Studio Nuff" e "Studio Nuff" aparecem só no pedido deste documento. ⏳ Falta definir o nome que vai na interface.

---

## 1. Objetivo do produto

### O que resolve
O Studio Nuff vende quatro serviços criativos:
- branding;
- posicionamento;
- expansão de comunidade (clubes, programas de embaixadores);
- edição e finalização de filmes de campanha.

O radar substitui a garimpagem manual de clientes. Todo dia útil ele procura **sinais públicos recentes** de que uma marca ou agência pode precisar desses serviços. Em seguida, entrega uma lista curta de oportunidades já qualificadas, cada uma com uma abertura de conversa pronta para revisar. ✅

### Quem usa
- ✅ A pessoa responsável pela prospecção do Studio Nuff, que é a dona da conta. Ela lê o relatório, decide quem abordar e envia as mensagens por conta própria.
- ⚠️ Não foi definido se outras pessoas da equipe vão usar o app, nem se haverá papéis diferentes.

### Decisões que o radar ajuda a tomar
1. **Quem abordar hoje:** no máximo 5 oportunidades, das mais fortes para as mais fracas.
2. **Por que agora:** qual é o sinal real, quando aconteceu e qual a fonte.
3. **O que oferecer:** o serviço que faz sentido neste momento.
4. **Com qual case abrir a conversa:** OMNIA, N1 ou N1 × Goleiro de Aluguel.
5. **Com quem falar:** nome e cargo quando forem verificáveis; senão, só o cargo.
6. **O que dizer:** uma abertura de até 3 linhas, no idioma do contato.

### Regra inegociável
✅ **O radar nunca envia mensagens.** Ele gera relatório e rascunhos para revisão humana.

---

## 2. Como o radar funciona

### 2.1 Fluxo de ponta a ponta

```
[Agendamento: dias úteis, 8h34 de Brasília]
        │
        ▼
1. DESCOBERTA: busca na web, em inglês e português, nos três mercados
        │
        ▼
2. VERIFICAÇÃO: abre as páginas dos candidatos para confirmar data,
   pedido, contato e site oficial
        │
        ▼
3. FILTRO: janela de 14 dias, nicho, mercado, empresas já reportadas
        │
        ▼
4. QUALIFICAÇÃO E PRIORIZAÇÃO: explícita antes de inferida; até 5 no total
        │
        ▼
5. ENRIQUECIMENTO: serviço, quem abordar, case, abertura
        │
        ▼
6. ESTRUTURAÇÃO: as notas viram JSON validado por um schema
        │
        ▼
7. CONFERÊNCIA DE FONTES: cada link citado é comparado com as páginas
   que o radar realmente viu; se não bater, a oportunidade é marcada
        │
        ▼
8. PUBLICAÇÃO: o JSON do dia é salvo no repositório e o site é publicado de novo
        │
        ▼
[Oportunidade acionável: revisar → copiar a abertura → enviar fora do app]
```

🛠️ **Arquitetura técnica:**
- O GitHub Actions roda `npm run radar`.
- O script chama a API do Claude, modelo `claude-opus-5-5`, com as ferramentas `web_search` e `web_fetch`.
- O resultado vai para `data/reports/AAAA-MM-DD.json` e é salvo com commit.
- A Vercel republica o site (Next.js) a cada commit.

### 2.2 Agendamento
- ✅ Dias úteis.
- ✅ O usuário pediu **9h**. Por recomendação técnica (horários "redondos" atrasam por excesso de tráfego), o horário ficou em **8h34**. O usuário foi avisado e não pediu para voltar a 9h.
- 🛠️ No GitHub Actions: `cron: "34 11 * * 1-5"` (UTC). Também dá para rodar manualmente, inclusive para uma data específica.
- ⏳ Existe uma **segunda execução em paralelo**: uma tarefa agendada do Claude, com o mesmo nome e no mesmo horário, criada antes do app. Ela entrega o relatório no chat da sessão, não no app. Falta decidir se ela deve ser desativada quando o app estiver rodando.

### 2.3 Fontes
✅ Tipos de fonte:
- sites oficiais;
- páginas públicas de vagas;
- comunicados de imprensa;
- imprensa do setor;
- posts públicos que o radar consiga abrir.

✅ Idiomas: inglês e português.

✅ Fontes nomeadas no briefing (`config/perfil.md`):

| Tipo | Fontes |
|---|---|
| Vagas | Páginas de carreiras, LinkedIn Jobs (público), Workable, Greenhouse, Lever, Ashby, Indeed, Behance, Working Not Working, The Dots, Mandy, ProductionHUB, Carga de Trabalhos (Portugal) |
| Imprensa do setor | BeautyMatter, Diary Directory, FashionNetwork, The Drum, Campaign, Marketeer, Meios & Publicidade |

💬 **O que funcionou melhor na primeira rodada manual:**
- O feed de contas novas e vagas da **Diary Directory** foi a fonte mais rica para o Reino Unido.
- O **Carga de Trabalhos** foi o melhor para Portugal, mas trouxe só vagas fora do nicho.

⚠️ **Restrição de rede:**
- Na sessão manual do Claude, a rede só abria uma lista fixa de sites. Foram liberados 29 domínios, e sites novos continuam bloqueados.
- ⏳ A recomendação é liberar acesso irrestrito no ambiente da tarefa agendada. Isso não afeta o app no GitHub Actions, que usa a busca e a leitura de páginas da própria API do Claude.

### 2.4 Filtros

| Filtro | Regra | Status |
|---|---|---|
| **Janela de tempo** | Só sinais dos **últimos 14 dias**, com data verificável. Sem data verificável, descarta. | ✅ |
| **Mercados, por prioridade** | 1. **EUA** · 2. **Zona do euro, começando por Portugal** (depois Espanha, França, Alemanha, Itália, Países Baixos, Irlanda etc.) · 3. **Reino Unido**, em seção **separada** por ser mercado em libra (GBP) | ✅ |
| **Nichos** | Marcas **independentes** de **beleza, wellness, esporte, lifestyle, moda e música**, e **agências boutique** de branding, social e produção | ✅ Moda e música foram incluídas depois e valem a partir da segunda versão |
| **Moda inclui** | Marcas independentes de roupa, calçado e acessórios; estúdios e agências de moda | ✅ |
| **Música inclui** | Artistas independentes e seus managements, gravadoras e selos independentes, festivais, casas de show, marcas ligadas à música | ✅ |
| **Sem repetição** | Não repetir empresas dos relatórios anteriores (o app lê os últimos 15), a menos que haja um sinal novo | 🛠️ |
| **Só fontes abertas** | Só usar o que o radar conseguiu abrir e conferir | ✅ |

💬 **Critérios de descarte aplicados na prática (primeira rodada):**
- vaga fora do nicho, como filmes de casamento ou técnicos de auditório;
- marca grande ou não independente, como Primavera Sound, rhode e Peter Millar;
- varejista com várias marcas, como Thirteen Lune;
- país fora dos mercados, como Kleanr, do Canadá;
- página que não abriu, como Glassworks London;
- sinal válido, porém mais fraco que outro do mesmo nicho (fica como reserva).

### 2.5 Qualificação: tipos de sinal

✅ **Duas classes**, nesta ordem de prioridade:

**A. Demanda explícita.** Alguém pede publicamente editor de vídeo, finalizador, parceiro criativo, estúdio ou freelancer. Exemplos de termos de busca:
- "freelance video editor", "seeking creative partner"
- "music video editor", "fashion film editor"
- "editor freelancer", "procuramos videomaker/editor"

**B. Oportunidade inferida.** Sinais de que vai surgir uma necessidade:

| Categoria | Sinais |
|---|---|
| Geral | Lançamentos de marca ou produto, rebranding, entrada em novos mercados, expansão de clubes de corrida ou comunidade, programas de embaixadores, agências anunciando novas contas |
| Moda | Novas coleções, drops, collabs, aberturas de loja, desfiles e lookbooks |
| Música | Anúncio de álbum ou EP, turnês, festivais novos ou novas edições, selos contratando artistas, rebranding de festival ou casa de show, collabs entre artista e marca |

### 2.6 Prioridade e pontuação

✅ **Regras de prioridade:**
1. Demanda explícita vem antes de oportunidade inferida.
2. Dentro de cada classe, a ordem é pela força do sinal.
3. Os mercados seguem a prioridade EUA → zona do euro (Portugal primeiro) → Reino Unido.
4. Quando a força dos sinais for parecida, equilibrar os nichos.

✅ **Limite:** **até 5 oportunidades no total** por dia. Se houver poucas fortes, entrega menos. Se não houver nenhuma, diz isso claramente. Qualidade vem antes de quantidade.

⚠️ **Não existe pontuação numérica.** Nenhum peso, nota ou escala foi definido. "Força do sinal" é um julgamento do modelo, sem critério formal. ⏳ Uma escala de pontuação, se desejada, ainda precisa ser definida.

⚠️ **Conflito a resolver:** a regra "explícita primeiro" e a regra "mercado primeiro" podem se chocar. Uma demanda explícita no Reino Unido vence uma inferida nos EUA? Na primeira rodada, a ordem do resumo seguiu a força do sinal, e as seções da página seguiram a ordem dos mercados. ⏳ Falta decidir a regra.

### 2.7 Enriquecimento: regras para cada oportunidade

| Regra | Status |
|---|---|
| Nome e cargo do contato **só se verificáveis numa fonte pública aberta**, com o link; senão, só o cargo | ✅ |
| **Nunca inventar** contatos, nomes, cargos, e-mails, orçamento, valores ou **moeda de contratação**. O que não for verificável aparece como "não verificado" | ✅ |
| **Case de abertura:** OMNIA → branding e lançamento · N1 → filmes de campanha · N1 × Goleiro de Aluguel → comunidade | ✅ |
| **Abertura:** no máximo **3 linhas**, **no idioma do contato** (inglês para EUA e Reino Unido; português para Portugal; idioma local ou inglês para o resto da zona do euro), ligada ao sinal real | ✅ |

⚠️ **Lacuna sobre os cases:** o radar não tem descrição dos cases OMNIA, N1 e Goleiro de Aluguel (o que são, resultados, links do portfólio). Ele só sabe para que tipo de serviço cada um serve. As aberturas citam os cases pelo nome, sem detalhes.

### 2.8 Conferência automática de fontes
🛠️ Depois da pesquisa, o app compara cada `sourceUrl` com todas as URLs que apareceram nos resultados de busca e nas páginas lidas. Se não houver correspondência, a oportunidade recebe `sourceVerified: false`, e o site mostra **"fonte não confirmada, revisar"**. É uma proteção contra links inventados.

🛠️ Se o modelo principal recusar o pedido por filtro de segurança, a API refaz automaticamente a mesma chamada em outro modelo.

---

## 3. O que aparece em cada oportunidade

### 3.1 Campos pedidos pelo usuário ✅
1. Empresa, país e site.
2. O que aconteceu, quando, e link para a fonte original.
3. Classificação: demanda explícita ou oportunidade inferida.
4. Serviço que faz sentido oferecer agora e por quê.
5. Quem abordar: nome e cargo se verificáveis, ou só o cargo.
6. Melhor case para abrir a conversa.
7. Abertura de até 3 linhas no idioma do contato.

Com a inclusão de moda e música, também foi pedido o **nicho** de cada oportunidade, e a "empresa" pode ser **empresa, artista ou selo**.

### 3.2 Estrutura de dados implementada 🛠️
Fonte: `lib/schema.ts`.

| Campo | Tipo | Significado |
|---|---|---|
| `company` | texto | Empresa, artista, selo ou agência |
| `niche` | texto | Nicho: beleza, wellness, esporte, lifestyle, moda, música ou agência, com detalhe livre |
| `market` | `EUA` \| `Zona do euro` \| `Reino Unido` | Mercado. Define a seção onde a oportunidade aparece |
| `country` | texto | País, em português, com ressalvas quando houver incerteza |
| `website` | texto ou nulo | Site oficial; nulo se não verificado |
| `whatHappened` | texto | O sinal, em 1 a 3 frases |
| `eventDate` | AAAA-MM-DD | Data do sinal |
| `sourceUrl` | URL | Fonte principal |
| `extraSourceUrls` | lista de URLs | Fontes complementares |
| `classification` | `Demanda explícita` \| `Oportunidade inferida` | Classe do sinal |
| `service` | texto | Serviço sugerido |
| `serviceWhy` | texto | Por que esse serviço agora |
| `contactName` | texto ou nulo | Nome, só se verificado |
| `contactRole` | texto | Cargo de quem abordar (sempre presente) |
| `contactSourceUrl` | URL ou nulo | Fonte que verifica o nome |
| `case` | `OMNIA` \| `N1` \| `N1 × Goleiro de Aluguel` | Case de abertura |
| `caseWhy` | texto | Por que esse case |
| `opener` | texto, até 3 linhas | Rascunho da abertura |
| `openerLanguage` | código (`en`, `pt`, `es`, `fr`, `de`…) | Idioma da abertura |
| `sourceVerified` | booleano | Calculado pelo app: a fonte apareceu nos resultados reais do radar? |

**Campos do relatório diário** (acima das oportunidades):

| Campo | Significado |
|---|---|
| `date` | Data do relatório (fuso de Brasília) |
| `generatedAt` | Momento em que foi gerado |
| `model` | Modelo usado |
| `summary` | Resumo do dia em 2 a 4 frases |
| `marketNotes[]` | Observação por mercado sem oportunidade forte (ex.: "nada em Portugal") |
| `opportunities[]` | Até 5 oportunidades |
| `discarded[]` | Sinais descartados: nome, motivo, URL |
| `searches[]` | Principais buscas feitas |

### 3.3 Exemplo completo (real, da rodada de 10/11/2026)

```json
{
  "company": "Sophie & Songest",
  "niche": "Beleza (cuidados labiais de luxo)",
  "market": "Reino Unido",
  "country": "Reino Unido",
  "website": "https://sophieandsongest.com",
  "whatHappened": "Marca nova de cuidados labiais com potes recarregáveis contratou a Nicki Petitt PR para liderar o lançamento na mídia e os anúncios de novos produtos ao longo de 2027.",
  "eventDate": "2026-11-05",
  "sourceUrl": "https://www.diarydirectory.com/newsarticle/lip-care-brand-sophie-songest-appoints-nicki-petitt-pr/76199",
  "extraSourceUrls": ["https://sophieandsongest.com"],
  "classification": "Oportunidade inferida",
  "service": "Branding e posicionamento de lançamento, e o filme de lançamento",
  "serviceWhy": "A PR entra agora e a marca vai precisar de narrativa e peças visuais coerentes para a imprensa de 2027.",
  "contactName": "Emma Sutherland e Louise Turk",
  "contactRole": "Cofundadoras",
  "contactSourceUrl": "https://www.diarydirectory.com/newsarticle/lip-care-brand-sophie-songest-appoints-nicki-petitt-pr/76199",
  "case": "OMNIA",
  "caseWhy": "O momento é de branding e lançamento.",
  "opener": "Hi Emma and Louise, congratulations on bringing Nicki Petitt PR on board for the Sophie & Songest launch.\nAs 2027 press ramps up, a sharp brand story and launch film can carry Day Drench and Dream Seal much further.\nCould I share how we did it for OMNIA?",
  "openerLanguage": "en",
  "sourceVerified": true
}
```

**Exemplo de demanda explícita, para contraste** (real, mesma rodada):
- **CCD PR & Digital**, agência de Londres.
- Vaga de criador de conteúdo freelancer (filmagem e edição de vídeos curtos), publicada em 29/10, válida até 30/11.
- Case N1. Contato só por cargo.

O relatório completo de 10/11/2026 está em `data/reports/2026-11-10.json` (5 oportunidades) e em `relatorios/2026-11-10.md` (versão em texto).

---

## 4. Fluxos de uso e ações

### 4.1 O que já foi definido
| Fluxo ou ação | Status |
|---|---|
| Receber o relatório do dia automaticamente, em dias úteis | ✅ |
| Ler as oportunidades com todos os campos da seção 3 | ✅ |
| Abrir a fonte original de cada oportunidade | ✅ |
| Copiar a abertura para enviar fora do app | 🛠️ (botão "Copiar abertura") |
| Consultar relatórios anteriores (página "Histórico") | 🛠️ |
| Ver sinais descartados e buscas feitas, recolhidos por padrão | 🛠️ |
| Gerar o radar fora do horário: no GitHub, Actions → "Radar diário" → **Run workflow**, com data opcional | 🛠️ (fora da interface do app) |
| Mudar nichos, mercados, cases e regras editando `config/perfil.md` | 🛠️ (fora da interface do app) |
| Proteger o site com senha (`SITE_PASSWORD`) | 🛠️ (opcional) |
| Ser avisado quando o relatório ficar pronto | ✅ Só na tarefa agendada do Claude, que manda notificação no celular. ⚠️ O app não tem notificação |
| Enviar mensagens pelo app | ✅ **Proibido.** O envio é sempre manual e externo |

### 4.2 Status, filtros e ações aprovados
⚠️ **Nenhum status, filtro ou ação de acompanhamento foi definido ou aprovado na conversa.** Não há nomes aprovados para preservar.

As únicas categorias fixas da lógica, que podem servir de base para filtros, são:
- **Mercado:** `EUA` · `Zona do euro` · `Reino Unido`
- **Classificação:** `Demanda explícita` · `Oportunidade inferida`
- **Case:** `OMNIA` · `N1` · `N1 × Goleiro de Aluguel`
- **Nicho:** beleza · wellness · esporte · lifestyle · moda · música · agência. ⚠️ Hoje é texto livre, não uma lista fechada.
- **Fonte:** confirmada / não confirmada

⏳ Pendências para a próxima etapa:
- Status de acompanhamento de cada oportunidade (por exemplo, se foi abordada, respondida ou descartada) e os nomes desses status.
- Filtros interativos. Hoje a página só agrupa por mercado.
- Ações como editar a abertura, marcar como descartada ou pedir uma nova abertura.
- Se esses dados ficam guardados (o app hoje não tem banco de dados; ver seção 5).

---

## 5. Escopo e estado atual

### 5.1 Já implementado
Tudo no repositório `alexanderfilho00-prog/radar-nuff`, branch `claude/radar-prospeccao-criativa-m9w1we`.

| Item | Arquivo |
|---|---|
| Briefing editável (perfil, nichos, mercados, cases, regras) | `config/perfil.md` |
| Rotina de pesquisa (busca → leitura → JSON → conferência de fontes) | `scripts/radar.ts` |
| Estrutura de dados validada | `lib/schema.ts` |
| Leitura dos relatórios | `lib/reports.ts` |
| Página do relatório do dia | `app/page.tsx` + `app/components/ReportView.tsx` |
| Botão de copiar abertura | `app/components/CopyButton.tsx` |
| Histórico e relatório por data | `app/relatorios/page.tsx`, `app/relatorios/[data]/page.tsx` |
| Estilos (claro e escuro) | `app/globals.css` |
| Senha opcional | `proxy.ts` |
| Agendamento e salvamento | `.github/workflows/radar.yml` |
| Instruções de configuração | `README.md` |
| Primeiro relatório (manual, 10/11/2026) | `data/reports/2026-11-10.json`, `relatorios/2026-11-10.md` |
| Tarefa agendada no Claude (paralela ao app) | "Radar de Prospecção Criativa", dias úteis às 8h34 de Brasília; entrega no chat e notifica no celular |

Stack: Next.js 16, React 19, TypeScript, Zod 4, SDK `@anthropic-ai/sdk` 1.7. O site é estático e gerado no build a partir dos JSONs.

### 5.2 Definido, mas ainda não ativo
- ⏳ Levar o branch para o principal (`main`). O agendamento do GitHub e o deploy de produção na Vercel dependem disso.
- ⏳ Criar o secret `ANTHROPIC_API_KEY` no GitHub e dar permissão de escrita ao workflow.
- ⏳ Importar o repositório na Vercel.
- ⏳ **A rotina automática (`npm run radar`) nunca rodou de ponta a ponta**, porque faltava a chave da API. O primeiro relatório foi feito manualmente pelo Claude.
- ⏳ Decidir se a tarefa agendada do Claude é desativada para não duplicar o trabalho.

### 5.3 Para depois, ou ainda não discutido
- Status, filtros e ações de acompanhamento (seção 4.2).
- Pontuação numérica de oportunidades (seção 2.6).
- Notificação no app quando o relatório fica pronto.
- Descrição dos cases OMNIA, N1 e Goleiro de Aluguel para enriquecer as aberturas.
- Identidade visual (seção 6.3).
- 💬 Alternativa técnica considerada e não adotada: rodar o radar dentro da Vercel (Vercel Cron + armazenamento). Foi preterida por causa do limite de tempo das funções.

### 5.4 Referências visuais
- ⚠️ Não há protótipo, arquivo do Figma ou referência visual do usuário.
- ⚠️ A conta do Canva não tem nenhum brand kit.
- A única referência é o site atual, montado sem identidade de marca. As capturas de tela feitas durante o desenvolvimento não ficaram salvas no repositório.

---

## 6. O que a interface precisa representar

### 6.1 Informações que precisam aparecer juntas
1. **Cabeçalho do dia:** data, total de oportunidades, resumo, contagem de demandas explícitas e contagem por mercado.
2. **Cartão de oportunidade, como bloco único:**
   - **Identidade:** empresa, nicho, país, site.
   - **Rótulos:** classificação e case.
   - **Sinal:** o que aconteceu, data, fonte (e fontes extras) e aviso de fonte não confirmada.
   - **Proposta:** serviço e por quê; case e por quê.
   - **Contato:** nome e cargo com link de verificação, ou cargo com "nome não verificado".
   - **Abertura:** texto, idioma e ação de copiar.
3. **Agrupamento por mercado**, com o **Reino Unido visualmente separado** e identificado como GBP. ✅
4. **Observações de mercado sem oportunidade** (ex.: "nada em Portugal hoje") na seção do mercado, para não parecer que o mercado foi esquecido.
5. **Transparência do processo**, em segundo plano: sinais descartados com motivo, buscas feitas, momento da geração e modelo.

### 6.2 Dependências e estados visíveis
| Estado | Como deve aparecer |
|---|---|
| Demanda explícita × inferida | Diferença visual clara; explícita tem mais peso. ✅ prioridade |
| Contato verificado × não verificado | Com nome e link de verificação × só o cargo, com a marcação "não verificado". **Nunca exibir um nome sem verificação.** ✅ |
| Fonte confirmada × não confirmada | Aviso de revisão quando `sourceVerified = false` |
| Site oficial ausente | O campo some, sem placeholder inventado |
| País incerto | Mostrar a ressalva (ex.: "EUA (provável…)") |
| Dia sem oportunidades | Mensagem clara de "nenhuma oportunidade forte hoje" ✅ |
| Dia com menos de 5 | Normal, não é erro ✅ |
| Mercado sem oportunidade | Nota do mercado no lugar dos cartões |
| Nenhum relatório ainda | Instrução de como gerar o primeiro |
| Idioma da abertura | Sempre visível (EN, PT…), porque varia por contato |

**Dependências entre ações:**
- A ação de copiar depende de existir uma abertura.
- A confiança na abordagem depende de a fonte estar confirmada e de o contato estar verificado. A interface deve deixar isso visível antes da ação de copiar.

### 6.3 Preferências visuais
- ⚠️ **O usuário ainda não definiu nenhuma preferência visual.**
- ⚠️ A interface atual não usou nenhuma skill de design. O usuário perguntou sobre isso, e a resposta foi que não.
- **Situação dos recursos de design:**
  - A conta tem a skill **frontend-design** ativa.
  - O Figma está conectado, mas não há arquivo indicado.
  - O Canva está conectado, sem brand kit.
- 🛠️ **Decisões do Claude no site atual, sem aprovação do usuário:**
  - Visual neutro, com fundo off-white e destaque laranja.
  - Modo escuro automático.
  - Cartões com rótulos coloridos para classificação e case.
  - Funciona no celular, sem rolagem horizontal.
  - Interface em português; aberturas no idioma do contato.

### 6.4 Decisões de interface em aberto
1. ⏳ **Identidade visual:** existe uma do Studio Nuff, da N1 ou da OMNIA? Há link do Figma, cores, fontes ou logo?
2. ⏳ **Clima, se não houver identidade:** as opções apresentadas foram editorial e de moda, esportivo e enérgico, ou minimalista de estúdio.
3. ⏳ **Nome exibido no app:** "Radar de Prospecção" (atual) ou "Radar de Oportunidades" / "Radar Nuff"?
4. ⏳ **Ordem dos cartões:** por mercado (atual) ou por força do sinal (explícitas primeiro)? Ver o conflito na seção 2.6.
5. ⏳ **Status, filtros e ações de acompanhamento**, e se precisam de armazenamento.
6. ⏳ **Prioridade de uso:** o app vai ser usado mais no celular ou no computador?
7. ⏳ **Notificação** de relatório pronto dentro do app ou por e-mail.
