// Testes de fluxo da interface (Playwright). Com o app rodando: node tests/fluxos.cjs
// Os arquivos em tests/fixtures são FICTÍCIOS, só para teste.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const F = process.argv[2] || require('path').join(process.cwd(), 'tests/fixtures');
const BASE = process.env.RADAR_URL || 'http://localhost:3000/';
const results = [];
const check = (name, cond, extra='') => { results.push(`${cond ? 'PASSOU' : 'FALHOU'}  ${name}${extra ? '  ['+extra+']' : ''}`); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type()==='error' && errors.push(m.text()));
  await p.goto(BASE); await p.waitForLoadState('networkidle');

  // 1. Abrir a rodada
  const bar = await p.locator('.round-bar').innerText();
  check('Cabeçalho mostra data, origem e contagem', /10 de novembro de 2026/.test(bar) && /Rodada manual/i.test(bar) && /5 oportunidades/.test(bar));
  check('Lista tem 5 oportunidades na ordem do arquivo', (await p.locator('.opp-company').allInnerTexts()).join('|') === 'CCD PR & Digital|Sophie & Songest|MUSE Communications|Wrap London|Original HEIR');

  // 2. Selecionar Sophie & Songest
  await p.getByRole('button', { name: /Sophie & Songest/ }).click();
  check('Detalhe abre Sophie & Songest', (await p.locator('#detail-title').innerText()) === 'Sophie & Songest');
  check('Item selecionado marcado (aria-current)', await p.locator('.opp[aria-current="true"]').innerText().then(t => t.includes('Sophie')));
  // 3. Evidência
  const obs = await p.locator('.panel-observed').innerText();
  check('Evidência: trecho literal da fonte', obs.includes('Nicki Petitt PR has been appointed to manage the PR for new British luxury lip care brand Sophie & Songest.'));
  check('Evidência: data 05/11/2026 e fonte conferida', obs.includes('05/11/2026') && obs.includes('Fonte conferida'));
  const href = await p.getByRole('link', { name: 'Abrir fonte original' }).getAttribute('href');
  check('Abrir fonte original aponta para a Diary Directory', href === 'https://www.diarydirectory.com/newsarticle/lip-care-brand-sophie-songest-appoints-nicki-petitt-pr/76199');
  // 4. Case
  const nuff = await p.locator('.panel-nuff').innerText();
  check('Case OMNIA com vínculo documentado', nuff.includes('OMNIA') && nuff.includes('Branding e lançamento') && nuff.includes('Portfólio do case: Não informado'));
  check('Contato verificado com fonte', nuff.includes('Emma Sutherland e Louise Turk') && nuff.includes('Nome conferido em'));
  // 5. Copiar gancho
  await p.getByRole('button', { name: 'Copiar gancho' }).click();
  await p.waitForTimeout(200);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  check('Copiar gancho copia o texto exato', clip.startsWith('Hi Emma and Louise') && clip.endsWith('how we did it for OMNIA?'));
  check('Confirmação de cópia visível', (await p.locator('.toast').innerText()).includes('Gancho copiado') && await p.getByRole('button', { name: 'Gancho copiado' }).isVisible());

  // Filtros
  const names = async () => (await p.locator('.opp-company').allInnerTexts()).join('|');
  await p.selectOption('#f-market', 'EUA'); check('Filtro mercado EUA', await names() === 'Original HEIR');
  await p.click('.btn-clear'); await p.selectOption('#f-class', 'Demanda explícita'); check('Filtro classificação explícita', await names() === 'CCD PR & Digital');
  await p.click('.btn-clear'); await p.selectOption('#f-case', 'N1'); check('Filtro case N1', await names() === 'CCD PR & Digital|MUSE Communications|Wrap London');
  await p.click('.btn-clear'); await p.selectOption('#f-niche', 'Moda'); check('Filtro nicho Moda', await names() === 'Wrap London');
  await p.click('.btn-clear'); await p.selectOption('#f-niche', 'Agência'); check('Filtro nicho Agência', await names() === 'CCD PR & Digital|MUSE Communications');
  await p.click('.btn-clear'); await p.selectOption('#f-verify', 'nao-confirmada');
  check('Estado sem resultados', await p.locator('.empty-filter').isVisible() && (await p.locator('.detail-empty').isVisible()));
  await p.locator('.empty-filter .btn').click(); check('Limpar filtros restaura as 5', (await p.locator('.opp').count()) === 5);
  await p.selectOption('#f-market', 'Reino Unido'); await p.selectOption('#f-case', 'OMNIA');
  check('Filtros combinados (Reino Unido + OMNIA)', await names() === 'Sophie & Songest');
  check('Contagem de resultados anunciada', (await p.locator('.result-count').innerText()).includes('1 de 5'));
  await p.click('.btn-clear');

  // Teclado
  await p.locator('.opp').first().focus();
  await p.keyboard.press('ArrowDown');
  check('Seta para baixo move foco e seleção', (await p.evaluate(() => document.activeElement.innerText)).includes('Sophie') && (await p.locator('#detail-title').innerText()) === 'Sophie & Songest');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  check('Enter seleciona item focado', (await p.locator('#detail-title').innerText()) === 'MUSE Communications');
  const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check('Foco visível no item', outline === 'solid', outline);
  await p.goto(BASE); await p.waitForLoadState('networkidle');
  await p.keyboard.press('Tab'); check('Primeiro Tab leva ao link de pular para a lista', (await p.evaluate(() => document.activeElement.textContent)).includes('Pular'));

  // Importação válida (1 oportunidade)
  await p.getByRole('button', { name: 'Importar rodada' }).first().click();
  await p.setInputFiles('#import-file', `${F}/uma.json`);
  await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Validar e importar' }).click();
  check('Importação válida mostra resumo', (await p.locator('.feedback-success').innerText()).includes('11/11/2026 (manual): 1 nova, 0 atualizadas'));
  await p.getByRole('button', { name: 'Fechar' }).click();
  check('Rodada importada aparece selecionada com 1 oportunidade', (await p.locator('.round-bar').innerText()).includes('1 oportunidade') && (await p.locator('.opp').count()) === 1);
  check('Rodada de uma oportunidade: detalhe com fonte não confirmada', (await p.locator('.panel-observed').innerText()).includes('Fonte não confirmada'));
  check('Campos ausentes mostram "Não informado"', (await p.locator('.panel-observed').innerText()).includes('Não informado'));
  const storedBefore = await p.evaluate(() => localStorage.getItem('radar-nuff:rodadas-importadas:v1'));

  // Importação inválida preserva dados
  await p.getByRole('button', { name: 'Importar rodada' }).first().click();
  await p.setInputFiles('#import-file', `${F}/invalida.json`); await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Validar e importar' }).click();
  const err = await p.locator('.feedback-error').innerText();
  check('Erro indica registro e campo (market)', err.includes('Oportunidade 1 (Marca Inválida) › market'), err.split('\n').slice(0,3).join(' / '));
  check('Erro indica campo eventDate', err.includes('Oportunidade 1 (Marca Inválida) › eventDate'));
  check('Inválida não altera dados salvos', storedBefore === await p.evaluate(() => localStorage.getItem('radar-nuff:rodadas-importadas:v1')));
  await p.fill('#import-text', '{ isto não é json');
  await p.getByRole('button', { name: 'Validar e importar' }).click();
  check('JSON malformado gera erro claro', (await p.locator('.feedback-error').innerText()).includes('não é um JSON válido'));

  // Reimportar a mesma rodada não duplica
  await p.setInputFiles('#import-file', `${F}/uma.json`); await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Validar e importar' }).click();
  check('Reimportação: 0 novas, 1 atualizada', (await p.locator('.feedback-success').innerText()).includes('0 novas, 1 atualizada'));
  // Exemplo oficial sobre a rodada do repositório
  const example = fs.readFileSync(require('path').join(process.cwd(), 'public/exemplos/rodada-exemplo.json'), 'utf8');
  await p.fill('#import-text', example);
  await p.getByRole('button', { name: 'Validar e importar' }).click();
  check('Exemplo oficial: 0 novas, 5 atualizadas', (await p.locator('.feedback-success').innerText()).includes('10/11/2026 (manual): 0 novas, 5 atualizadas'));
  // Mais de 5
  await p.setInputFiles('#import-file', `${F}/sete.json`); await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Validar e importar' }).click();
  await p.getByRole('button', { name: 'Fechar' }).click();
  check('Rodada com 7: mostra 5', (await p.locator('.opp').count()) === 5 && (await p.locator('.round-bar').innerText()).includes('5 oportunidades (7 no arquivo)'));
  check('Rodada com 7: avisa 2 de fora', (await p.locator('.limit-note summary').innerText()).includes('2 entradas ficaram de fora'));

  // Persistência
  await p.reload(); await p.waitForLoadState('networkidle');
  const options = await p.locator('#round-select option').allInnerTexts();
  check('Após recarregar: rodadas importadas continuam', options.join('|') === '13/11/2026, manual|11/11/2026, manual|10/11/2026, manual', options.join('|'));
  await p.selectOption('#round-select', '2026-11-10::manual');
  check('Após recarregar: rodada de 10/11 sem duplicatas', (await p.locator('.opp').count()) === 5);
  await p.selectOption('#round-select', '2026-11-11::manual');
  check('Após recarregar: rodada de 11/11 com 1 oportunidade', (await p.locator('.opp').count()) === 1);
  // Limpar importações
  await p.getByRole('button', { name: 'Importar rodada' }).first().click();
  await p.getByRole('button', { name: 'Apagar importações deste navegador' }).click();
  await p.getByRole('button', { name: 'Apagar importações' }).click();
  check('Apagar importações volta à rodada do repositório', (await p.locator('#round-select option').count()) === 1);

  // Celular
  const m = await b.newPage({ ...devices['iPhone 13'] });
  await m.goto(BASE); await m.waitForLoadState('networkidle');
  check('Celular: detalhe oculto na lista', !(await m.locator('.detail-pane').isVisible()));
  await m.getByRole('button', { name: 'Filtros' }).click();
  check('Celular: filtros abrem', await m.locator('#f-market').isVisible());
  await m.getByRole('button', { name: /Filtros/ }).click();
  await m.getByRole('button', { name: /Sophie & Songest/ }).click();
  check('Celular: detalhe em vista própria', await m.locator('#detail-title').isVisible() && !(await m.locator('.list-pane').isVisible()));
  check('Celular: foco vai ao título do detalhe', await m.evaluate(() => document.activeElement.id) === 'detail-title');
  await m.getByRole('button', { name: 'Voltar à lista' }).click(); await m.waitForTimeout(200);
  check('Celular: Voltar à lista retorna', await m.locator('.list-pane').isVisible() && !(await m.locator('.detail-pane').isVisible()));
  check('Celular: foco volta ao item', (await m.evaluate(() => document.activeElement.innerText || '')).includes('Sophie'));
  await m.getByRole('button', { name: /Wrap London/ }).click();
  await m.goBack(); await m.waitForTimeout(200);
  check('Celular: botão voltar do navegador fecha o detalhe', await m.locator('.list-pane').isVisible());
  check('Celular: sem rolagem horizontal', !(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)));

  // Movimento reduzido
  const r = await b.newPage({ reducedMotion: 'reduce' });
  await r.goto(BASE); await r.waitForLoadState('networkidle');
  check('Movimento reduzido desliga a animação', (await r.locator('.detail').evaluate(e => getComputedStyle(e).animationName)) === 'none');

  check('Sem erros no console', errors.length === 0, errors.join(' | '));
  console.log(results.join('\n'));
  console.log(`\n${results.filter(r=>r.startsWith('PASSOU')).length}/${results.length} passaram`);
  await b.close();
})();
