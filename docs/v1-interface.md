# Radar de Prospecção Criativa: interface v1

Primeira versão funcional da ferramenta interna do Studio Nuff, usada por Alex e Juliana. Responde a três perguntas:
1. Qual oportunidade vale atenção hoje?
2. Qual evidência sustenta essa leitura?
3. Que conversa o Nuff pode abrir?

## Como rodar

```bash
npm install
```
```bash
npm run dev
```

Abra http://localhost:3000. Para a versão de produção local:

```bash
npm run build
```
```bash
npm start
```

## Como inserir a próxima rodada

1. Monte um arquivo `.json` no formato abaixo. O arquivo `public/exemplos/rodada-exemplo.json` serve de modelo; no app, ele também pode ser baixado pelo link "Baixar o exemplo".
2. No app, clique em **Importar rodada**, escolha o arquivo (ou cole o conteúdo) e clique em **Validar e importar**.
3. Se houver erro, o app mostra o registro e o campo a corrigir, e nada é gravado.

A importação fica salva **neste navegador** (localStorage). Para valer para todo mundo e em qualquer navegador, coloque o arquivo em `data/reports/AAAA-MM-DD.json` e faça o deploy: as rodadas do repositório são lidas no build.

## Formato de importação

Pode ser uma rodada (objeto) ou várias (lista de objetos).

| Campo da rodada | Obrigatório | Valores |
|---|---|---|
| `date` | sim | `AAAA-MM-DD` |
| `origin` | não (padrão `manual`) | `manual` ou `automática` |
| `summary` | não | texto |
| `marketNotes` | não | lista de `{ "market", "note" }` |
| `opportunities` | sim, pelo menos 1 | lista na **ordem editorial** |
| `discarded` | não | lista de `{ "name", "reason", "url" }` |
| `searches` | não | lista de textos |
| `generatedAt`, `model` | não | texto |

| Campo da oportunidade | Obrigatório | Valores |
|---|---|---|
| `company` | sim | texto; identifica a oportunidade dentro da rodada |
| `market` | não | `EUA`, `Zona do euro`, `Reino Unido` |
| `classification` | não | `Demanda explícita`, `Oportunidade inferida` |
| `case` | não | `OMNIA`, `N1`, `N1 × Goleiro de Aluguel` |
| `niche` | não | texto livre, ex. "Beleza (cuidados labiais de luxo)" |
| `nicheCategory` | não | `Beleza`, `Wellness`, `Esporte`, `Lifestyle`, `Moda`, `Música`, `Agência` (se ausente, é deduzido de `niche`) |
| `whatHappened` | não | resumo do sinal |
| `evidenceQuote` | não | trecho literal da fonte |
| `eventDate` | não | `AAAA-MM-DD` |
| `sourceUrl`, `website`, `contactSourceUrl` | não | links `http(s)://` |
| `extraSourceUrls` | não | lista de links |
| `sourceVerified` | não | `true`, `false` ou ausente |
| `country`, `service`, `serviceWhy`, `contactName`, `contactRole`, `caseWhy`, `opener`, `openerLanguage` | não | texto |

Campos ausentes aparecem como **"Não informado"**.

**Regras de importação:**
- **Mesma rodada:** é a combinação de `date` + `origin`. Reimportar atualiza as oportunidades com o mesmo `company`, sem duplicar. Empresas novas entram no fim, sem mudar a ordem das que já existiam.
- **A mesma empresa duas vezes no mesmo arquivo** é um erro.
- **Arquivo inválido** não grava nada; os dados existentes continuam iguais.

## Divergências encontradas (especificação × código anterior) e como foram tratadas

| # | Divergência | Decisão na v1 |
|---|---|---|
| 1 | A especificação pede que a rodada seja identificada como manual. O JSON não tinha campo de origem, só `model: "manual (sessão Claude Code)"`. | Novo campo `origin` (`manual` / `automática`). Arquivos antigos sem ele herdam a origem pelo `model`. A rodada de 10/11/2026 foi marcada `manual`, e o script da automação grava `automática`. |
| 2 | O pedido separa "o que foi observado" de "o que o Nuff interpretou". O registro só tinha o resumo `whatHappened`, escrito pelo Claude, sem a redação da fonte. | Novo campo opcional `evidenceQuote`. Para as 5 oportunidades de 10/11 ele traz o trecho **literal** das páginas abertas naquela rodada. O texto original de `whatHappened`, os links e as aberturas não foram alterados. A automação passou a pedir esse trecho. |
| 3 | A especificação lista "nicho" como filtro, mas o campo é texto livre. | Filtro pelas categorias da especificação, deduzidas da primeira palavra do nicho, ou de `nicheCategory` quando vier no arquivo. O que não casa vira "Outro". |
| 4 | O código anterior agrupava por mercado. A especificação deixa em aberto a precedência entre classificação e mercado. | A v1 **não reordena nem pontua**: mostra a ordem do arquivo (editorial). A decisão continua pendente; ver `MAX_VISIBLE_PER_ROUND` e o comentário em `app/components/RadarApp.tsx`. |
| 5 | O visual anterior era neutro, escolhido sem aprovação. | Substituído pela direção Studio Nuff (cartaz impresso). |
| 6 | A página "Histórico" (`/relatorios`) era uma rota separada. | Virou o seletor **Rodada** no cabeçalho. As rotas antigas foram removidas. |
| 7 | A especificação não define status, filtros nem ações. | Filtros e ações desta versão são **decisões de implementação**, não aprovações (ver abaixo). |
| 8 | `relatorios/2026-11-10.md` (texto) e `data/reports/2026-11-10.json` têm redações um pouco diferentes do mesmo sinal. | O JSON é o registro de dados e foi preservado como está. O Markdown fica como histórico. |

## Decisões desta implementação (não aprovadas antes)

- **Filtros:** Mercado, Classificação, Case, Nicho e Fonte (Conferida / Não confirmada / Não informada). Os filtros funcionam sobre as até 5 oportunidades exibidas, e cada opção mostra a contagem. Há botão "Limpar filtros" e estado sem resultados.
- **Ações:** Abrir fonte original (quando há link), Copiar gancho (quando há texto, com confirmação), Importar rodada e Apagar importações deste navegador.
- **Limite de 5:** a interface mostra as 5 primeiras entradas na ordem do arquivo. Se houver mais, o cabeçalho mostra "5 oportunidades (N no arquivo)", e a lista termina com um aviso que nomeia as que ficaram de fora.
- **Vocabulário:** "gancho" (no código, `opener`) é a abertura de até 3 linhas.
- **Cases:** só o vínculo documentado (OMNIA → branding e lançamento; N1 → filmes de campanha; N1 × Goleiro de Aluguel → comunidade). O portfólio aparece como "Não informado".

## Camadas de dados

- `lib/radar/types.ts`: modelo da interface e constantes da especificação.
- `lib/radar/import.ts`: validação do formato de importação, com mensagens por campo.
- `lib/radar/store.ts`: persistência no navegador e regra de mesclagem.
- `lib/reports.ts`: rodadas do repositório (`data/reports`), lidas no build. É aqui que a automação se integra: cada JSON gravado pelo `scripts/radar.ts` vira uma rodada `automática` no próximo deploy, sem mudar a interface.

## Direção visual

O objetivo é a energia de um cartaz impresso com a legibilidade de uma ferramenta de trabalho.

**Cores:**
- Amarelo cartaz `#FFD324` na abertura, na seleção e no gancho.
- Preto tinta `#171717` como base.
- Verde impressão `#216C42` na moldura de "O que o Nuff interpretou" e no rótulo "Fonte conferida".
- Vermelho carimbo `#C4382B` só no selo "Rodada manual", no asterisco da assinatura e em "Fonte não confirmada".
- Branco quebrado `#F7F6F2` para leitura sobre o preto.

**Tipografia:**
- Big Shoulders Display (condensada, de letreiro) no título, na numeração editorial e nos nomes.
- Archivo no texto.
- As duas vêm empacotadas via `@fontsource`, sem depender do Google Fonts.

**Gestos e acessibilidade:**
- Sem cantos arredondados, sombras suaves ou gradientes.
- Classificação, seleção e verificação têm rótulo em texto, além da cor.
- O único movimento é a troca de oportunidade e o aviso de cópia, e os dois são desligados quando o sistema pede movimento reduzido.

## O que falta (precisa de informação externa)

- **Portfólio dos cases** OMNIA, N1 e Goleiro de Aluguel: descrição e links.
- **Identidade Studio Nuff:** logo e fontes oficiais. A paleta veio do pedido; a tipografia foi escolha desta versão.
- **Precedência** entre classificação e mercado (e se haverá pontuação).
- **Status de acompanhamento** (abordada, respondida etc.) e onde guardá-los para Alex e Juliana compartilharem. Hoje as importações ficam só no navegador de quem importou.
- **Automação:** chave da API no GitHub e merge no branch principal, para que as rodadas `automática` comecem a chegar.
