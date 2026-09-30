// Teste do Jogar a 2: liga dois browsers (quem cria a sala no PC, o convidado
// num "telemóvel") através de um servidor PeerJS local e joga um bocado.
//   npm install playwright peer
//   node testes/jogar_a_2.js
const { chromium } = require('playwright');
const { PeerServer } = require('peer');
const path = require('path');
const fs = require('fs');
const DIR = path.join(__dirname, 'imagens', 'coop');
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const srv = PeerServer({ port: 9123, host: '127.0.0.1', path: '/sala' });
  await new Promise(r => setTimeout(r, 500));
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
    args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--autoplay-policy=no-user-gesture-required'] });
  const erros = [];
  const abrir = async (nome, tel) => {
    const c = await b.newContext(tel ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } : { viewport: { width: 960, height: 640 } });
    await c.addInitScript(() => {
      localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true }));
      window.OPCOES_PEER = { host: '127.0.0.1', port: 9123, path: '/sala', secure: false, config: { iceServers: [] } };
    });
    const p = await c.newPage();
    p.on('pageerror', e => erros.push(`${nome}: ${e.message} ${(e.stack || '').split('\n')[1] || ''}`));
    p.on('console', m => { if (m.type() === 'error') erros.push(`${nome} consola: ${m.text()}`); });
    await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await p.waitForTimeout(500);
    if (tel) await p.evaluate(() => { modoToque = true; ajustarTela(); });
    return p;
  };
  const ok = (c, t) => console.log(`${c ? 'OK  ' : 'FALHA'} ${t}`);
  const esperar = async (p, fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn)) return true; await p.waitForTimeout(100); } return false; };

  const A = await abrir('anfitrião', false), C = await abrir('convidado', true);

  // ecrãs da sala
  await A.evaluate(() => abrirCoop());
  await A.waitForTimeout(200);
  await A.screenshot({ path: `${DIR}/01_sala_menu.png` });
  await A.evaluate(() => criarSala());
  ok(await esperar(A, () => coop.codigo.length === 4), 'sala criada');
  const cod = await A.evaluate(() => coop.codigo);
  await A.waitForTimeout(200);
  await A.screenshot({ path: `${DIR}/02_sala_codigo.png` });

  await C.evaluate(() => abrirCoop());
  await C.evaluate(() => { coop.ecra = 'entrar'; coop.codigo = ''; });
  // escreve o código tocando nas letras
  for (const L of cod) {
    const r = await C.evaluate(L => { const i = LETRAS_SALA.indexOf(L), r = retLetraSala(i), b = canvas.getBoundingClientRect(); return { x: b.left + (r.x + r.w / 2 + MARGEM_X) * b.width / TELA_W, y: b.top + (r.y + r.h / 2) * b.height / ALTURA }; }, L);
    await C.touchscreen.tap(r.x, r.y);
    await C.waitForTimeout(80);
  }
  ok(await C.evaluate(c => coop.codigo === c, cod), `código escrito no ecrã tátil (${cod})`);
  await C.screenshot({ path: `${DIR}/03_convidado_codigo.png` });
  await C.evaluate(() => { coop.ecra = 'classe'; coop.classeConvidado = 'fogo'; });
  await C.waitForTimeout(150);
  await C.screenshot({ path: `${DIR}/04_convidado_classe.png` });

  // o anfitrião começa a jogar
  await A.evaluate(() => { escolhaClasse = 'espada'; novoJogo(); tutorial = null; estado = 'jogo'; });
  await C.evaluate(() => entrarSala());
  ok(await esperar(C, () => estado === 'convidado'), 'convidado entrou na sala');
  ok(await esperar(A, () => !!(coop.p2 && coop.p2._S)), 'o herói do parceiro apareceu');
  ok(await esperar(C, () => coop.video && coop.video.videoWidth > 0, 15000), 'o convidado recebe a imagem do jogo');
  ok(await esperar(C, () => J && J.classe === 'fogo' && J.arma), 'o convidado recebe o estado do herói (botões)');
  ok(await A.evaluate(() => coop.stream.getAudioTracks().length === 1), 'o som também vai no envio');

  // mexer
  const x0 = await A.evaluate(() => coop.p2.x);
  await C.evaluate(() => { teclas['d'] = true; });
  await A.waitForTimeout(700);
  await C.evaluate(() => { teclas['d'] = false; });
  await A.waitForTimeout(200);
  const x1 = await A.evaluate(() => coop.p2.x);
  ok(Math.abs(x1 - x0) > 20, `o convidado mexe o seu herói (${Math.round(x0)} -> ${Math.round(x1)})`);

  // atacar: um monstro ao lado do parceiro
  await A.evaluate(() => {
    for (const e of inimigos) e.morto = true;
    const p2 = coop.p2, e = criarInimigo('slime', p2.x + 30, p2.y); e.acordado = true; e.hp = e.maxHp = 5000; inimigos.push(e); window._alvo = e;
  });
  await C.evaluate(() => { teclas[' '] = true; });
  await A.waitForTimeout(900);
  await C.evaluate(() => { teclas[' '] = false; });
  ok(await A.evaluate(() => window._alvo.hp < 5000), 'o convidado ataca');
  // os monstros vão ao herói mais perto
  ok(await A.evaluate(() => alvoDe(window._alvo) === coop.p2), 'o monstro persegue o herói mais perto (o parceiro)');
  await A.evaluate(() => { window._alvo.morto = true; });

  // habilidade única e esquiva
  await A.evaluate(() => { coop.p2.mana = 999; coop.p2.cdClasse = 0; });
  await C.evaluate(() => { premidas['f'] = true; });
  await A.waitForTimeout(400);
  ok(await A.evaluate(() => coop.p2.cdClasse > 0), 'o botão ★ usa a habilidade do caçador do parceiro');

  // XP partilhada e melhoria escolhida no telemóvel do convidado (tocando na carta)
  const nv0 = await A.evaluate(() => coop.p2.nivel);
  await A.evaluate(() => ganharXp(xpProximo(J.nivel) + 5));
  ok(await A.evaluate(n => coop.p2.nivel > n, nv0), 'a XP é partilhada (o parceiro também sobe de nível)');
  ok(await esperar(C, () => coop.menu === 'nivel'), 'o convidado vê as 3 melhorias no telemóvel dele');
  ok(await A.evaluate(() => estado !== 'nivel' || J.escolhasPendentes > 0), 'as melhorias do parceiro não aparecem no teu ecrã');
  await C.waitForTimeout(700);
  await C.screenshot({ path: `${DIR}/05_convidado_melhoria.png` });
  const perks0 = await A.evaluate(() => JSON.stringify(coop.p2.perks));
  // toca na 2.ª carta: posição da carta no ecrã do anfitrião -> posição no ecrã do convidado
  const carta = await A.evaluate(() => { const r = retCartaPerk(1, coop.ctxP2.escolha.opcoes.length); return { u: (r.x + r.w / 2 + MARGEM_X) / TELA_W, v: (r.y + r.h / 2) / ALTURA }; });
  const ponto = await C.evaluate(c => { const R = coop.rectVideo, b = canvas.getBoundingClientRect(); return { x: b.left + (R.x + c.u * R.w) * b.width / TELA_W, y: b.top + (R.y + c.v * R.h) * b.height / ALTURA }; }, carta);
  await C.touchscreen.tap(ponto.x, ponto.y);
  await A.waitForTimeout(800);
  ok(await A.evaluate(p => JSON.stringify(coop.p2.perks) !== p, perks0), 'tocar na carta no telemóvel do convidado escolhe a melhoria');
  await A.evaluate(() => { J.escolhasPendentes = 0; coop.p2.escolhasPendentes = 0; escolha = null; estado = 'jogo'; });
  await esperar(C, () => coop.menu === 'jogo');

  // baú aberto por ti: prémio também para o parceiro
  await A.evaluate(() => { const bb = { x: J.x, y: J.y, tipo: 'ouro', semMimico: true, t: 0 }; baus.push(bb); abrirBau(bb); roleta.t = roleta.dur; roleta.fim = true; estado = 'jogo'; roleta = null; });
  ok(await esperar(C, () => avisos.some(a => /equipamento|Vendeste|mochila/.test(a.titulo))), 'o teu baú também dá um prémio ao parceiro');

  // o convidado abre um baú: a roleta aparece no telemóvel dele e o jogo continua para ti
  await A.evaluate(() => { for (const b of baus.slice()) baus.splice(baus.indexOf(b), 1); const p2 = coop.p2; baus.push({ x: p2.x + 10, y: p2.y, tipo: 'ouro', semMimico: true, t: 0 }); window._arma0 = coop.p2.arma; window._moc0 = J.mochila.length; });
  await C.evaluate(() => { premidas['e'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'bau'), 'o convidado abre um baú (USAR)');
  ok(await A.evaluate(() => estado === 'jogo'), 'a roleta dele não aparece no teu ecrã');
  ok(await esperar(C, () => coop.menu === 'bau'), 'a roleta aparece no telemóvel do convidado');
  await C.waitForTimeout(1500);
  await C.screenshot({ path: `${DIR}/06_convidado_roleta.png` });
  await C.evaluate(() => { premidas['e'] = true; });
  await C.waitForTimeout(400);
  await C.evaluate(() => { premidas['e'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'jogo'), 'o convidado fecha a roleta (equipa o prémio)');
  ok(await A.evaluate(() => J.mochila.length > window._moc0 || avisos.some(a => /abriu um baú/.test(a.titulo))), 'o baú do parceiro também te dá um prémio');

  // loja no telemóvel do convidado, com o ouro da equipa
  await A.evaluate(() => { const p2 = coop.p2; J.ouro = 500; objetos.push({ tipo: 'mercador', x: p2.x + 20, y: p2.y, stock: null }); window._poc0 = p2.pocoes; });
  await C.evaluate(() => { premidas['e'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'loja'), 'o convidado abre a loja');
  await esperar(C, () => coop.menu === 'loja');
  await C.waitForTimeout(700);
  await C.screenshot({ path: `${DIR}/07_convidado_loja.png` });
  await C.evaluate(() => { premidas['1'] = true; });
  ok(await esperar(A, () => coop.p2.pocoes > window._poc0), 'o convidado compra uma poção');
  ok(await A.evaluate(() => J.ouro < 500), 'o ouro gasto é o da equipa');
  await C.evaluate(() => { premidas['escape'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'jogo'), 'o convidado fecha a loja');
  await A.evaluate(() => { objetos = objetos.filter(o => o.tipo !== 'mercador'); });

  // mochila e janela de estado do convidado
  await C.evaluate(() => { premidas['i'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'mochila'), 'o convidado abre a mochila dele');
  await esperar(C, () => coop.menu === 'mochila');
  await C.waitForTimeout(500);
  await C.screenshot({ path: `${DIR}/08_convidado_mochila.png` });
  await C.evaluate(() => { premidas['escape'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'jogo'), 'o convidado fecha a mochila');
  await esperar(C, () => coop.menu === 'jogo');
  await C.evaluate(() => { premidas['u'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'status'), 'o convidado abre a Janela de Estado dele');
  await C.evaluate(() => { premidas['escape'] = true; });
  await esperar(A, () => coop.ctxP2.estado === 'jogo');

  // o mundo não para: abres a mochila e o convidado continua a mexer-se
  await A.evaluate(() => { abrirMochila(); window._x2 = coop.p2.x; });
  await esperar(C, () => coop.menu === 'jogo' && !coop.espera);
  await C.evaluate(() => { teclas['a'] = true; });
  await A.waitForTimeout(700);
  await C.evaluate(() => { teclas['a'] = false; });
  ok(await A.evaluate(() => estado === 'mochila' && Math.abs(coop.p2.x - window._x2) > 20), 'com a tua mochila aberta, o parceiro continua a jogar');
  await A.evaluate(() => { const e = criarInimigo('orc', J.x + 20, J.y); e.acordado = true; inimigos.push(e); window._hp1 = J.hp; });
  await A.waitForTimeout(1200);
  ok(await A.evaluate(() => J.hp === window._hp1), 'num menu não levas dano');
  await A.screenshot({ path: `${DIR}/09_anfitriao_mochila.png` });
  await C.screenshot({ path: `${DIR}/10_convidado_enquanto_mochila.png` });
  await A.evaluate(() => { estado = 'jogo'; mochilaUI = null; for (const e of inimigos) e.morto = true; });
  // a pausa para os dois
  await A.evaluate(() => { estado = 'pausa'; window._x2 = coop.p2.x; });
  await C.evaluate(() => { teclas['d'] = true; });
  await A.waitForTimeout(600);
  await C.evaluate(() => { teclas['d'] = false; });
  ok(await A.evaluate(() => coop.p2.x === window._x2), 'a pausa para os dois');
  ok(await esperar(C, () => coop.pausa), 'o convidado sabe que está em pausa');
  await A.evaluate(() => { estado = 'jogo'; });
  ok(await C.evaluate(() => coop.video.videoWidth > 300), 'a imagem do convidado tem boa resolução');

  // screenshots do jogo a 2
  await A.evaluate(() => {
    const p2 = coop.p2; p2.x = J.x + 60; p2.y = J.y;
    for (let k = 0; k < 3; k++) { const e = criarInimigo(['esqueleto', 'orc', 'goblin'][k], J.x + 120 + k * 30, J.y - 60 + k * 40); e.acordado = true; inimigos.push(e); }
  });
  await A.waitForTimeout(1200);
  await A.screenshot({ path: `${DIR}/11_anfitriao_jogo.png` });
  await C.waitForTimeout(600);
  await C.screenshot({ path: `${DIR}/12_convidado_jogo.png` });

  // cair e reanimar
  await A.evaluate(() => { for (const e of inimigos) e.morto = true; const p2 = coop.p2; p2.invuln = 0; p2.dashT = 0; J.x = p2.x + 300; comHeroi(p2, () => danoJogador(99999)); });
  ok(await A.evaluate(() => coop.p2.caido && estado === 'jogo'), 'o parceiro cai (não é o fim do jogo)');
  ok(await esperar(C, () => J.caido), 'o convidado sabe que caiu');
  await A.evaluate(() => { const p2 = coop.p2; J.x = p2.x + 20; J.y = p2.y; });
  await A.waitForTimeout(600);
  await A.screenshot({ path: `${DIR}/13_reanimar.png` });
  ok(await esperar(A, () => !coop.p2.caido, 5000), 'ficar ao lado reanima o parceiro');
  // tu cais: o parceiro reanima-te
  await A.evaluate(() => { J.invuln = 0; J.dashT = 0; J.vidasExtra = 0; danoJogador(99999); });
  ok(await A.evaluate(() => J.caido && estado === 'jogo'), 'tu cais e o parceiro pode reanimar-te');
  // os dois caídos: acabou
  await A.evaluate(() => { const p2 = coop.p2; p2.invuln = 0; p2.dashT = 0; comHeroi(p2, () => danoJogador(99999)); });
  ok(await A.evaluate(() => estado === 'morto'), 'se caírem os dois, acaba o jogo');

  // o anfitrião continua / novo jogo: o parceiro volta a entrar
  await A.evaluate(() => { escolhaClasse = 'titan'; novoJogo(); tutorial = null; estado = 'jogo'; });
  ok(await esperar(A, () => coop.p2 && coop.p2.dono === J && !coop.p2.caido), 'novo jogo: o parceiro entra outra vez');

  // mudar de andar: o parceiro vem junto
  await A.evaluate(() => { proximoAndar(); estado = 'jogo'; });
  ok(await esperar(A, () => coop.p2.mapa === mapa && Math.hypot(coop.p2.x - J.x, coop.p2.y - J.y) < 80), 'no andar seguinte o parceiro aparece ao teu lado');

  // a sala está cheia para um terceiro
  const T = await abrir('terceiro', false);
  await T.evaluate(c => { abrirCoop(); coop.codigo = c; coop.classeConvidado = 'cura'; entrarSala(); }, cod);
  ok(await esperar(T, () => coop.msg && /2 jogadores/.test(coop.msg.txt)), 'um terceiro não consegue entrar (sala cheia)');

  // o convidado sai
  await C.evaluate(() => sairConvidado());
  ok(await esperar(A, () => !coop.conn), 'o anfitrião sabe que o parceiro saiu');
  ok(await A.evaluate(() => !parceiroAtivo() && estado === 'jogo'), 'o jogo continua sozinho');
  ok(await C.evaluate(() => estado === 'titulo'), 'o convidado voltou ao menu');
  await A.evaluate(() => { estado = 'titulo'; });
  await A.waitForTimeout(200);
  await A.screenshot({ path: `${DIR}/14_titulo.png` });

  // código errado
  await C.evaluate(() => { abrirCoop(); coop.codigo = 'ZZZZ'; coop.classeConvidado = 'vento'; entrarSala(); });
  ok(await esperar(C, () => coop.msg && /não encontrada/.test(coop.msg.txt)), 'código errado: "Sala não encontrada"');

  // o convidado também pode ser Caçador das Sombras (o exército é só dele)
  await A.evaluate(() => { estado = 'titulo'; escolhaClasse = 'sombras'; novoJogo(); tutorial = null; estado = 'jogo'; });
  await C.evaluate(c => { abrirCoop(); coop.codigo = c; coop.classeConvidado = 'sombras'; entrarSala(); }, cod);
  ok(await esperar(A, () => coop.p2 && coop.p2.classe === 'sombras' && coop.p2.mapa === mapa, 10000), 'o convidado entra como Caçador das Sombras');
  await A.evaluate(() => { const p2 = coop.p2; for (let k = 0; k < 3; k++) cadaveres.push({ tipo: 'esqueleto', x: p2.x + 20 + k * 10, y: p2.y, t: 20 }); p2.mana = 999; window._s1 = sombras.length; });
  await C.evaluate(() => { premidas['5'] = true; });
  ok(await esperar(A, () => (coop.p2.sombrasMundo || []).length >= 3), 'o convidado ergue o seu exército de sombras');
  ok(await A.evaluate(() => sombras.length === window._s1), 'as sombras dele não se misturam com as tuas');
  await A.waitForTimeout(500);
  await A.screenshot({ path: `${DIR}/15_sombras_convidado.png` });

  console.log('ERROS:', erros.length ? '\n  ' + erros.join('\n  ') : 'nenhum');
  await b.close();
  srv.close && srv.close();
  process.exit(0);
})();
