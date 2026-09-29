// Teste de telemóvel: ecrã cheio, toques nos botões, monstros a atacar durante o tutorial.
// Como correr:  npm install playwright  &&  npx playwright install chromium  &&  node testes/telemovel.js
// (ou define CHROMIUM=/caminho/para/o/chrome para usar um browser já instalado)
const { chromium } = require('playwright');
const path = require('path');
const JOGO = 'file://' + path.resolve(__dirname, '..', 'index.html');
const IMAGENS = path.resolve(__dirname, 'imagens');
require('fs').mkdirSync(IMAGENS, { recursive: true });
const APARELHOS = [
  { nome: 'iPhone 12 deitado', w: 844, h: 390 },
  { nome: 'Android grande deitado', w: 915, h: 412 },
  { nome: 'iPhone SE deitado', w: 667, h: 375 },
  { nome: 'Tablet deitado', w: 1180, h: 820 },
];
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  let falhas = 0;
  const ok = (cond, msg) => { console.log(`  ${cond ? 'OK ' : 'FALHOU'} ${msg}`); if (!cond) falhas++; };
  for (const A of APARELHOS) {
    console.log(`\n== ${A.nome} (${A.w}x${A.h}) ==`);
    const c = await b.newContext({ viewport: { width: A.w, height: A.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await c.addInitScript(() => localStorage.clear());
    const p = await c.newPage();
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.goto(JOGO);
    await p.waitForTimeout(700);
    const cdp = await c.newCDPSession(p);
    const geo = await p.evaluate(() => { const r = canvas.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, TELA_W, MARGEM_X, ZOOM }; });
    const ocupa = Math.min(geo.w / A.w, geo.h / A.h);
    ok(geo.w >= A.w - 2 || geo.h >= A.h - 2, `canvas ocupa o ecrã: ${Math.round(geo.w)}x${Math.round(geo.h)} de ${A.w}x${A.h} (largura ${Math.round(geo.w / A.w * 100)}%, altura ${Math.round(geo.h / A.h * 100)}%)`);
    // coordenadas do interface (960x640 ao centro) -> página
    const P = (x, y) => ({ x: geo.x + (x + geo.MARGEM_X) * geo.w / geo.TELA_W, y: geo.y + y * geo.h / 640 });
    const tap = async (x, y) => { const q = P(x, y); await p.touchscreen.tap(q.x, q.y); await p.waitForTimeout(200); };
    const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ ...P(x, y), id: i })) });
    await p.screenshot({ path: `${IMAGENS}/t3_${A.w}_titulo.png` });
    const b0 = await p.evaluate(() => botoesTitulo()[0]);
    await tap(b0.x + 100, b0.y + 20);
    ok(await p.evaluate(() => estado) === 'criar', 'tocar em Começar abre a criação de personagem');
    await tap(820, 606);
    await p.waitForTimeout(3300);
    ok(await p.evaluate(() => estado) === 'jogo', 'tocar em Começar inicia o jogo');
    ok(await p.evaluate(() => !!tutorial), 'o tutorial aparece');
    await p.screenshot({ path: `${IMAGENS}/t3_${A.w}_jogo.png` });
    // botões encostados às bordas verdadeiras do ecrã
    const bt = await p.evaluate(() => { const a = botoesToque().find(x => x.id === 'atacar'); return { x: a.x + MARGEM_X, r: a.r, W: TELA_W }; });
    ok(bt.W - bt.x < 130, `botão de ataque junto à borda direita (a ${Math.round(bt.W - bt.x)} px)`);
    // monstro perto: tem de vir atacar mesmo com o tutorial ativo
    await p.evaluate(() => { J.hpBase = 5000; J.hp = 5000; J.invuln = 0; let q = null; // um ponto do chão livre, à vista e a que o monstro consegue chegar
      for (let k = 0; k < 50 && !q; k++) { const c = pontoPerto(J.x, J.y, 110, 170, 16); if (c && distCampo(mapa, c.x, c.y) >= 0) q = c; }
      q = q || { x: J.x + 150, y: J.y }; const e = criarInimigo('orc', q.x, q.y); e.acordado = true; window._parede = colideCirculo(mapa, J.x + 150, J.y, 14); inimigos.push(e); window._m = e; });
    const d0 = await p.evaluate(() => Math.hypot(_m.x - J.x, _m.y - J.y));
    const hp0 = await p.evaluate(() => J.hp);
    await p.waitForTimeout(2500);
    const d1 = await p.evaluate(() => Math.hypot(_m.x - J.x, _m.y - J.y));
    const hp1 = await p.evaluate(() => J.hp);
    ok(d1 < d0 - 40 || hp1 < hp0, `o monstro aproxima-se (${Math.round(d0)} -> ${Math.round(d1)} px) e ataca (vida ${Math.round(hp0)} -> ${Math.round(hp1)})`);
    ok(hp1 < hp0, 'o monstro tira vida ao jogador');
    // joystick move o jogador
    // arrasta o joystick para o lado com mais espaço livre (o mapa é aleatório)
    const dir = await p.evaluate(() => {
      let melhor = [1, 0], md = -1;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let d = 0; while (d < 200 && !colideCirculo(mapa, J.x + dx * d, J.y + dy * d, J.r)) d += 8;
        if (d > md) { md = d; melhor = [dx, dy]; }
      }
      return melhor;
    });
    const p0 = await p.evaluate(() => ({ x: J.x, y: J.y }));
    const c0 = await p.evaluate(() => centroJoystick());
    await toque('touchStart', [[c0.x, c0.y]]);
    await toque('touchMove', [[c0.x + dir[0] * 50, c0.y + dir[1] * 50]]);
    await p.waitForTimeout(700);
    await toque('touchEnd', []);
    const p1 = await p.evaluate(() => ({ x: J.x, y: J.y }));
    ok(Math.hypot(p1.x - p0.x, p1.y - p0.y) > 30, 'o joystick mexe o jogador');
    // botão de ataque acerta no monstro
    await p.evaluate(() => { // o monstro fica mesmo ao lado, num sítio livre
      const q = pontoPerto(J.x, J.y, 30, 44, 14) || { x: J.x + 40, y: J.y };
      _m.x = q.x; _m.y = q.y; _m.hp = _m.maxHp = 99999; _m.vel = 0;
      for (const o of inimigos) if (o !== _m) o.morto = true;
    });
    const hpm = await p.evaluate(() => _m.hp);
    const a = await p.evaluate(() => { const a = botoesToque().find(x => x.id === 'atacar'); return [a.x, a.y]; });
    await toque('touchStart', [a]); await p.waitForTimeout(600); await toque('touchEnd', []);
    ok(await p.evaluate(() => _m.hp) < hpm, 'o botão de ataque acerta no monstro');
    // o tutorial acaba sozinho mesmo sem fazer nada
    await p.evaluate(() => { if (tutorial) tutorial.t = 999; });
    await p.waitForTimeout(100);
    for (let k = 0; k < 6; k++) { await p.evaluate(() => { if (tutorial) tutorial.t = 999; }); await p.waitForTimeout(60); }
    ok(await p.evaluate(() => !tutorial), 'o tutorial não fica preso');
    // pausa pelo botão
    const pz = await p.evaluate(() => { const a = botoesToque().find(x => x.id === 'pausa'); return [a.x, a.y]; });
    await tap(pz[0], pz[1]);
    ok(await p.evaluate(() => estado) === 'pausa', 'o botão de pausa funciona');
    await p.screenshot({ path: `${IMAGENS}/t3_${A.w}_pausa.png` });
    await tap(250, 172);
    ok(await p.evaluate(() => estado) === 'jogo', 'Continuar volta ao jogo');
    ok(!erros.length, 'sem erros de JavaScript' + (erros.length ? ': ' + erros[0] : ''));
    await c.close();
  }
  // telemóvel ao alto: aviso para rodar
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await c.newPage(); await p.goto(JOGO); await p.waitForTimeout(600);
  await p.screenshot({ path: `${IMAGENS}/t3_alto.png` });
  console.log('\n== ao alto: TELA_W', await p.evaluate(() => TELA_W));
  console.log(`\n${falhas ? falhas + ' FALHAS' : 'TUDO OK'}`);
  await b.close();
  process.exitCode = falhas ? 1 : 0;
})();
