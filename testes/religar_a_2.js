// Teste do Jogar a 2: a ligação cai e o convidado volta sozinho ao mesmo herói;
// e as conquistas de equipa chegam aos dois telemóveis.
//   npm install playwright peer
//   node testes/religar_a_2.js
const { chromium } = require('playwright');
const path = require('path');
const { PeerServer } = require('peer');
(async () => {
  const srv = PeerServer({ port: 9124, host: '127.0.0.1', path: '/sala' });
  await new Promise(r => setTimeout(r, 500));
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const erros = [];
  const abrir = async (nome) => {
    const c = await b.newContext();
    await c.addInitScript(() => { localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true })); localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false }));
      window.OPCOES_PEER = { host: '127.0.0.1', port: 9124, path: '/sala', secure: false, config: { iceServers: [] } }; });
    const p = await c.newPage(); p.on('pageerror', e => erros.push(nome + ': ' + e.stack));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.waitForTimeout(500); return p;
  };
  const ok = (c, t) => console.log(`${c ? 'OK  ' : 'FALHA'} ${t}`);
  const esperar = async (p, fn, ms = 10000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn)) return true; await p.waitForTimeout(100); } return false; };
  const A = await abrir('A'), C = await abrir('C');
  await A.evaluate(() => { abrirCoop(); criarSala(); });
  await esperar(A, () => coop.codigo.length === 4);
  const cod = await A.evaluate(() => coop.codigo);
  await A.evaluate(() => { escolhaClasse = 'espada'; novoJogo(); tutorial = null; estado = 'jogo'; });
  await C.evaluate(c => { abrirCoop(); coop.codigo = c; coop.classeConvidado = 'arqueiro'; entrarSala(); }, cod);
  ok(await esperar(C, () => convidadoPronto()), 'convidado entrou');
  await A.evaluate(() => { coop.p2.xp = 77; coop.p2.ouroMarca = 1; window._p2 = coop.p2; });
  ok(await esperar(C, () => !!meta.conquistas.coopJuntos), 'conquista de equipa "Juntos na Masmorra" chegou ao convidado');
  await A.evaluate(() => { const e = criarInimigo('slime', J.x + 40, J.y); e.boss = true; inimigos.push(e); matarInimigo(e); });
  ok(await esperar(C, () => !!meta.conquistas.coopBoss && JSON.parse(localStorage.getItem('masmorra_meta')).conquistas.coopBoss), 'boss a 2: a conquista fica guardada no convidado');
  ok(await A.evaluate(() => !!meta.conquistas.coopBoss), '...e no anfitrião');
  // 1) cai do lado do convidado e o anfitrião nota
  await C.evaluate(() => { coop.conn.close(); });
  ok(await esperar(C, () => !!coop.religar), 'o convidado começa a voltar a ligar sozinho');
  ok(await esperar(C, () => estado === 'convidado' && convidadoPronto(), 20000), 'o convidado voltou ao jogo');
  ok(await A.evaluate(() => coop.p2 === window._p2), 'o anfitrião manteve o mesmo herói do parceiro');
  ok(await C.evaluate(() => J.classe === 'arqueiro'), 'o convidado continua Arqueira');
  // 2) o anfitrião não repara que caiu (a ligação antiga ainda parece aberta)
  await A.evaluate(() => { window._saiu = saiuConvidado; saiuConvidado = () => {}; });
  await C.evaluate(() => { coop.conn.close(); });
  await A.waitForTimeout(500);
  ok(await esperar(C, () => estado === 'convidado' && convidadoPronto(), 25000), 'volta mesmo com a ligação antiga "aberta" no anfitrião');
  ok(await A.evaluate(() => coop.p2 === window._p2), 'e continua o mesmo herói');
  await C.waitForTimeout(1500);
  ok(await A.evaluate(() => !!(coop.connEst && coop.connEst.open)), 'canal rápido de novo aberto');
  // 2b) a ligação antiga continua mesmo aberta nos dois lados (rede do telemóvel mudou)
  await C.evaluate(() => { window._velha = [coop.peer, coop.conn, coop.connEst]; coop.peer = coop.conn = coop.connEst = null; perdeuLigacao(); });
  ok(await A.evaluate(() => coop.conn && coop.conn.open), '(a ligação antiga ainda está aberta no anfitrião)');
  ok(await esperar(C, () => estado === 'convidado' && convidadoPronto(), 25000), 'volta com a senha e troca a ligação antiga');
  ok(await A.evaluate(() => coop.p2 === window._p2 && coop.conn.peer !== undefined), 'mesmo herói depois da troca');
  await C.waitForTimeout(1500);
  ok(await A.evaluate(() => !!(coop.connEst && coop.connEst.open && coop.connEst.peer === coop.conn.peer)), 'canal rápido novo ligado');
  // 3) outra pessoa sem senha é recusada
  await A.evaluate(() => { saiuConvidado = window._saiu; });
  const D = await abrir('D');
  await D.evaluate(c => { abrirCoop(); coop.codigo = c; entrarSala(); }, cod);
  ok(await esperar(D, () => coop.msg && /2 jogadores/.test(coop.msg.txt)), 'um terceiro jogador vê "sala cheia"');
  // 4) sair a sério: não volta a ligar
  await C.evaluate(() => sairConvidado());
  await C.waitForTimeout(1500);
  ok(await C.evaluate(() => !coop.religar && estado === 'titulo'), 'sair de propósito não volta a ligar');
  console.log('ERROS:', erros.length ? erros : 'nenhum');
  await b.close(); srv.close && srv.close(); process.exit(0);
})();
