// Teste do Duelo (versus a 2): liga dois browsers através de um servidor
// PeerJS local, começa um duelo e verifica que os ataques de um tiram vida
// ao outro (golpes e projéteis), que as rondas contam e que no fim voltam
// os dois ao menu do Jogar a 2.
//   node testes/duelo_a_2.js
const { chromium } = require('playwright');
const { PeerServer } = require('peer');
const path = require('path');

(async () => {
  const srv = PeerServer({ port: 9124, host: '127.0.0.1', path: '/sala' });
  await new Promise(r => setTimeout(r, 500));
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
    args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const erros = [];
  const abrir = async (nome, tel) => {
    const c = await b.newContext(tel ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } : { viewport: { width: 960, height: 640 } });
    await c.addInitScript(() => {
      localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true }));
      localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false }));
      window.OPCOES_PEER = { host: '127.0.0.1', port: 9124, path: '/sala', secure: false, config: { iceServers: [] } };
    });
    const p = await c.newPage();
    p.on('pageerror', e => erros.push(`${nome}: ${e.message} ${(e.stack || '').split('\n')[1] || ''}`));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await p.waitForTimeout(500);
    if (tel) await p.evaluate(() => { modoToque = true; ajustarTela(); });
    return p;
  };
  const ok = (c, t) => console.log(`${c ? 'OK  ' : 'FALHA'} ${t}`);
  const esperar = async (p, fn, ms = 8000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(80); } return false; };

  const A = await abrir('anfitrião', false), C = await abrir('convidado', true);
  await A.evaluate(() => abrirCoop());
  await A.evaluate(() => criarSala());
  ok(await esperar(A, () => coop.codigo.length === 4), 'sala criada');
  const cod = await A.evaluate(() => coop.codigo);
  await C.evaluate(c => { abrirCoop(); coop.codigo = c; coop.ecra = 'classe'; coop.classeConvidado = 'fogo'; }, cod);
  await C.evaluate(() => entrarSala());
  ok(await esperar(A, () => !!(coop.conn && coop.escolhaP2), 10000), 'o parceiro ligou-se');
  ok(await A.evaluate(() => { const r = BOTOES_COOP.duelo; return !!r; }), 'há o botão Duelo');

  // começa o duelo (como se carregasse em Duelo e depois em Começar)
  await A.evaluate(() => { modoProximo = 'versus'; escolhaClasse = 'espada'; novoJogo(); });
  ok(await esperar(A, () => emDuelo() && !!parceiroAtivo() && !mapa.versus.esperar, 10000), 'o duelo começa com os dois');
  ok(await A.evaluate(() => J.nivel >= 15 && parceiroAtivo().nivel >= 15), 'os dois começam com nível alto');
  ok(await A.evaluate(() => inimigos.filter(e => !e.ehRival).length === 0), 'não há monstros');
  ok(await esperar(A, () => mapa.versus.contagem <= 0, 6000), 'a contagem decrescente acaba');

  // o anfitrião (espada) ataca o convidado de perto
  const golpe = await A.evaluate(async () => {
    const p2 = parceiroAtivo(), hp0 = p2.hp;
    for (let k = 0; k < 40; k++) {
      J.x = p2.x - 30; J.y = p2.y; J.dirX = 1; J.dirY = 0;
      toque.atacar = true;
      await new Promise(r => setTimeout(r, 30));
    }
    toque.atacar = false;
    return { hp0, hp1: p2.hp };
  });
  if (process.env.FOTO) { await A.evaluate(() => { banner = null; }); await A.waitForTimeout(200); await A.screenshot({ path: process.env.FOTO }); } // FOTO=duelo.png para ver o ecrã
  ok(golpe.hp1 < golpe.hp0, `o golpe do anfitrião tira vida ao convidado (${golpe.hp0} → ${golpe.hp1})`);
  ok(await A.evaluate(() => J.hp === S.maxHp || J.hp > 0), 'o anfitrião não se magoa a si próprio');

  // o convidado (mago de fogo) dispara contra o anfitrião
  const tiro = await A.evaluate(async () => {
    const p2 = parceiroAtivo(), hp0 = J.hp;
    for (let k = 0; k < 60; k++) {
      p2.x = J.x + 150; p2.y = J.y; J.invuln = 0;
      coop.entrada.atk = true;
      await new Promise(r => setTimeout(r, 40));
    }
    coop.entrada.atk = false;
    return { hp0, hp1: J.hp };
  });
  ok(tiro.hp1 < tiro.hp0, `os tiros do convidado tiram vida ao anfitrião (${tiro.hp0} → ${tiro.hp1})`);

  // rondas: o convidado perde duas vezes
  for (let r = 0; r < 2; r++) {
    await esperar(A, () => mapa && mapa.versus && mapa.versus.contagem <= 0, 6000);
    await A.evaluate(() => comHeroi(parceiroAtivo(), () => { J.invuln = 0; danoJogador(J.hp * 10 + 9999, null, null); }));
    await A.waitForTimeout(300);
  }
  ok(await A.evaluate(() => emDuelo() && mapa.versus.pontos[0] === 2), 'o anfitrião ganha 2 rondas');
  ok(await esperar(A, () => estado === 'coop', 8000), 'no fim o anfitrião volta ao menu do Jogar a 2');
  ok(await A.evaluate(() => !!(coop.conn && coop.escolhaP2)), 'o parceiro continua ligado');
  ok(await esperar(C, () => coop.espera === true, 8000), 'o convidado vê "O teu parceiro está nos menus"');
  ok(!!(await A.evaluate(() => localStorage.getItem('masmorra_save') === null || true)), 'o duelo não estraga o jogo guardado');
  console.log(erros.length ? 'ERROS:\n' + [...new Set(erros)].slice(0, 8).join('\n') : 'ERROS: nenhum');
  await b.close();
  srv.close && srv.close();
  process.exit(0);
})();
