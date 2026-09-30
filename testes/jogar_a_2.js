// Teste do Jogar a 2: liga dois browsers (quem cria a sala no PC, o convidado
// num "telemóvel") através de um servidor PeerJS local e joga um bocado.
// O convidado desenha o jogo sozinho a partir do estado que recebe e mexe o
// seu herói sem esperar pela rede.
//   npm install playwright peer
//   node testes/jogar_a_2.js          (teste completo)
//   node testes/jogar_a_2.js rapido   (sem a volta pelos 60 andares)
const { chromium } = require('playwright');
const { PeerServer } = require('peer');
const path = require('path');
const fs = require('fs');
const DIR = path.join(__dirname, 'imagens', 'coop');
fs.mkdirSync(DIR, { recursive: true });
const RAPIDO = process.argv.includes('rapido');

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
  const esperar = async (p, fn, ms = 8000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(80); } return false; };
  // posição no ecrã (px) de um ponto do interface (960x640) no convidado
  const noEcra = (C, x, y) => C.evaluate(([x, y]) => { const b = canvas.getBoundingClientRect(); return { x: b.left + (x + MARGEM_X) * b.width / TELA_W, y: b.top + y * b.height / ALTURA }; }, [x, y]);

  const A = await abrir('anfitrião', false), C = await abrir('convidado', true);

  // ---- a sala ----
  await A.evaluate(() => abrirCoop());
  await A.waitForTimeout(200);
  await A.screenshot({ path: `${DIR}/01_sala_menu.png` });
  await A.evaluate(() => criarSala());
  ok(await esperar(A, () => coop.codigo.length === 4), 'sala criada');
  const cod = await A.evaluate(() => coop.codigo);
  await A.screenshot({ path: `${DIR}/02_sala_codigo.png` });
  await C.evaluate(() => { abrirCoop(); coop.ecra = 'entrar'; coop.codigo = ''; });
  for (const L of cod) {
    const r = await C.evaluate(L => { const r = retLetraSala(LETRAS_SALA.indexOf(L)); return [r.x + r.w / 2, r.y + r.h / 2]; }, L);
    const q = await noEcra(C, r[0], r[1]);
    await C.touchscreen.tap(q.x, q.y);
    await C.waitForTimeout(80);
  }
  ok(await C.evaluate(c => coop.codigo === c, cod), `código escrito no ecrã tátil (${cod})`);
  await C.screenshot({ path: `${DIR}/03_convidado_codigo.png` });
  await C.evaluate(() => { coop.ecra = 'classe'; coop.classeConvidado = 'fogo'; });
  await C.waitForTimeout(150);
  await C.screenshot({ path: `${DIR}/04_convidado_classe.png` });

  // ---- entrar e ver o jogo ----
  await A.evaluate(() => { escolhaClasse = 'espada'; novoJogo(); tutorial = null; estado = 'jogo'; });
  await C.evaluate(() => entrarSala());
  ok(await esperar(C, () => estado === 'convidado'), 'convidado entrou na sala');
  ok(await esperar(A, () => !!(coop.p2 && coop.p2._S)), 'o herói do parceiro apareceu');
  ok(await esperar(C, () => convidadoPronto(), 10000), 'o telemóvel do convidado desenha o jogo sozinho');
  const somaA = await A.evaluate(() => somaMapa(mapa));
  ok(await C.evaluate(s => somaMapa(mapa) === s, somaA), 'o mapa do convidado é igual ao teu');
  ok(await C.evaluate(() => J.classe === 'fogo' && !!J.arma && S.maxHp > 0 && coop.p2.classe === 'espada'), 'o convidado conhece os dois heróis (o dele e o teu)');
  ok(await esperar(C, () => !!coop.connEst && coop.connEst.open), 'canal rápido aberto');

  // ---- mexer: o herói do convidado responde logo ----
  await esperar(A, () => coop.posRep && coop.posRep.tp === coop.p2.tp);
  const [xc0, xa0] = [await C.evaluate(() => J.x), await A.evaluate(() => coop.p2.x)];
  await C.evaluate(() => { teclas['d'] = true; });
  await C.waitForTimeout(60);
  const xc1 = await C.evaluate(() => J.x);
  ok(xc1 > xc0 + 2, `o herói mexe-se logo no telemóvel do convidado (${Math.round(xc0)} -> ${Math.round(xc1)} em 60 ms)`);
  await C.waitForTimeout(600);
  await C.evaluate(() => { teclas['d'] = false; });
  await A.waitForTimeout(300);
  const [xc2, xa2] = [await C.evaluate(() => J.x), await A.evaluate(() => coop.p2.x)];
  ok(xa2 - xa0 > 30 && Math.abs(xa2 - xc2) < 12, `o teu jogo segue a posição dele (${Math.round(xa2)} vs ${Math.round(xc2)})`);

  // ---- atacar ----
  await A.evaluate(() => { for (const e of inimigos) e.morto = true; inimigos = []; const p2 = coop.p2, e = criarInimigo('slime', p2.x + 34, p2.y); e.acordado = true; e.hp = e.maxHp = 5000; e.dano = 0; inimigos.push(e); window._alvo = e; });
  ok(await esperar(C, () => inimigos.some(e => e.tipo === 'slime')), 'o convidado vê os monstros');
  await C.evaluate(() => { teclas[' '] = true; });
  await C.waitForTimeout(250);
  ok(await C.evaluate(() => !!J.golpe || J.cdAtaque > 0), 'o golpe do convidado vê-se logo');
  await C.waitForTimeout(700);
  await C.evaluate(() => { teclas[' '] = false; });
  ok(await A.evaluate(() => window._alvo.hp < 5000), 'o ataque do convidado faz dano');
  ok(await esperar(C, () => inimigos.some(e => e.tipo === 'slime' && e.hp < 5000)), 'o convidado vê a vida do monstro a baixar');
  ok(await A.evaluate(() => alvoDe(window._alvo) === coop.p2), 'o monstro persegue o herói mais perto (o parceiro)');
  // empurrão: acontece no telemóvel dele
  await A.evaluate(() => { const p2 = coop.p2; p2.invuln = 0; p2.dashT = 0; comHeroi(p2, () => danoJogador(1, p2.x - 40, p2.y)); });
  ok(await esperar(C, () => Math.abs(J.kbx || 0) > 5 || Math.abs(J.kby || 0) > 5, 3000), 'o empurrão de um golpe chega ao convidado');
  await A.evaluate(() => { window._alvo.morto = true; });
  ok(await esperar(C, () => restos.length > 0 || !inimigos.some(e => e.tipo === 'slime'), 3000), 'o monstro morto desaparece no convidado');

  // ---- habilidade e som ----
  await A.evaluate(() => { coop.p2.mana = 999; coop.p2.cdClasse = 0; });
  await C.evaluate(() => { window._sons = 0; const s0 = som; som = (...a) => { window._sons++; return s0(...a); }; premidas['f'] = true; });
  ok(await esperar(A, () => coop.p2.cdClasse > 0), 'o botão ★ usa a habilidade do caçador do parceiro');
  ok(await esperar(C, () => window._sons > 0, 3000), 'os sons do jogo tocam no telemóvel do convidado');

  // ---- XP e melhoria escolhida com um toque ----
  const nv0 = await A.evaluate(() => coop.p2.nivel);
  await A.evaluate(() => ganharXp(xpProximo(J.nivel) + 5));
  ok(await A.evaluate(n => coop.p2.nivel > n, nv0), 'a XP é partilhada (o parceiro também sobe de nível)');
  ok(await esperar(C, () => coop.menu === 'nivel' && escolha && escolha.opcoes.length > 0), 'o convidado vê as melhorias no telemóvel dele');
  await C.waitForTimeout(700);
  await C.screenshot({ path: `${DIR}/05_convidado_melhoria.png` });
  const perks0 = await A.evaluate(() => JSON.stringify(coop.p2.perks));
  const rc = await C.evaluate(() => { const r = retCartaPerk(1, escolha.opcoes.length); return [r.x + r.w / 2, r.y + r.h / 2]; });
  const pc = await noEcra(C, rc[0], rc[1]);
  await C.touchscreen.tap(pc.x, pc.y);
  ok(await esperar(A, p => JSON.stringify(coop.p2.perks) !== p, 3000, perks0), 'tocar na carta escolhe a melhoria');
  await A.evaluate(() => { J.escolhasPendentes = 0; coop.p2.escolhasPendentes = 0; escolha = null; estado = 'jogo'; });
  await esperar(C, () => coop.menu === 'jogo');

  // ---- baús ----
  await A.evaluate(() => { const bb = { x: J.x, y: J.y, tipo: 'ouro', semMimico: true, t: 0 }; baus.push(bb); abrirBau(bb); roleta.t = roleta.dur; roleta.fim = true; estado = 'jogo'; roleta = null; });
  ok(await esperar(C, () => avisos.some(a => /equipamento|Vendeste|mochila/.test(a.titulo))), 'o teu baú também dá um prémio ao parceiro');
  await A.evaluate(() => { baus.length = 0; const p2 = coop.p2; baus.push({ x: p2.x + 10, y: p2.y, tipo: 'ouro', semMimico: true, t: 0 }); window._moc0 = J.mochila.length; });
  await esperar(C, () => !!J.bauPerto);
  await C.evaluate(() => { premidas['e'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'bau'), 'o convidado abre um baú (USAR)');
  ok(await A.evaluate(() => estado === 'jogo'), 'a roleta dele não aparece no teu ecrã');
  ok(await esperar(C, () => coop.menu === 'bau' && roleta && roleta.faixa.length > 10), 'a roleta aparece no telemóvel do convidado');
  await C.waitForTimeout(1500);
  ok(await C.evaluate(() => roleta.pos > 5), 'a roleta gira no telemóvel do convidado');
  await C.screenshot({ path: `${DIR}/06_convidado_roleta.png` });
  await C.evaluate(() => { premidas['e'] = true; });
  await esperar(C, () => roleta && roleta.fim, 3000);
  await C.waitForTimeout(400);
  await C.evaluate(() => { premidas['e'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'jogo'), 'o convidado fecha a roleta (equipa o prémio)');
  ok(await A.evaluate(() => J.mochila.length > window._moc0 || avisos.some(a => /abriu um baú/.test(a.titulo))), 'o baú do parceiro também te dá um prémio');

  // ---- loja, mochila e estado do convidado ----
  await A.evaluate(() => { const p2 = coop.p2; J.ouro = 500; objetos.push({ tipo: 'mercador', x: p2.x + 20, y: p2.y, stock: null }); window._poc0 = p2.pocoes; });
  await esperar(C, () => !!J.objPerto);
  await C.evaluate(() => { premidas['e'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'loja'), 'o convidado abre a loja');
  await esperar(C, () => coop.menu === 'loja' && !!loja);
  await C.waitForTimeout(600);
  await C.screenshot({ path: `${DIR}/07_convidado_loja.png` });
  await C.evaluate(() => { premidas['1'] = true; });
  ok(await esperar(A, () => coop.p2.pocoes > window._poc0), 'o convidado compra uma poção');
  ok(await A.evaluate(() => J.ouro < 500), 'o ouro gasto é o da equipa');
  await C.evaluate(() => { premidas['escape'] = true; });
  ok(await esperar(A, () => coop.ctxP2.estado === 'jogo'), 'o convidado fecha a loja');
  await A.evaluate(() => { objetos = objetos.filter(o => o.tipo !== 'mercador'); });
  await esperar(C, () => coop.menu === 'jogo');
  await C.evaluate(() => { premidas['i'] = true; });
  ok(await esperar(C, () => coop.menu === 'mochila'), 'o convidado abre a mochila dele');
  await C.waitForTimeout(400);
  await C.screenshot({ path: `${DIR}/08_convidado_mochila.png` });
  await C.evaluate(() => { premidas['escape'] = true; });
  ok(await esperar(C, () => coop.menu === 'jogo'), 'o convidado fecha a mochila');
  await C.evaluate(() => { premidas['u'] = true; });
  ok(await esperar(C, () => coop.menu === 'status' && !!menuMeta), 'o convidado abre a Janela de Estado dele');
  await C.waitForTimeout(300);
  await C.evaluate(() => { premidas['escape'] = true; });
  await esperar(C, () => coop.menu === 'jogo');

  // ---- o mundo não para nos menus; a pausa para ----
  await A.evaluate(() => { abrirMochila(); window._x2 = coop.p2.x; });
  await C.evaluate(() => { teclas['a'] = true; });
  await A.waitForTimeout(700);
  await C.evaluate(() => { teclas['a'] = false; });
  ok(await esperar(A, () => estado === 'mochila' && Math.abs(coop.p2.x - window._x2) > 20), 'com a tua mochila aberta, o parceiro continua a jogar');
  await A.evaluate(() => { const e = criarInimigo('orc', J.x + 20, J.y); e.acordado = true; inimigos.push(e); window._hp1 = J.hp; });
  await A.waitForTimeout(1200);
  ok(await A.evaluate(() => J.hp === window._hp1), 'num menu não levas dano');
  await C.screenshot({ path: `${DIR}/09_convidado_enquanto_mochila.png` });
  await A.evaluate(() => { estado = 'jogo'; mochilaUI = null; for (const e of inimigos) e.morto = true; });
  await A.evaluate(() => { estado = 'pausa'; window._x2 = coop.p2.x; });
  ok(await esperar(C, () => coop.pausa), 'o convidado sabe que está em pausa');
  await C.evaluate(() => { teclas['d'] = true; });
  await A.waitForTimeout(500);
  await C.evaluate(() => { teclas['d'] = false; });
  ok(await A.evaluate(() => coop.p2.x === window._x2), 'a pausa para os dois');
  await C.screenshot({ path: `${DIR}/10_convidado_pausa.png` });
  await A.evaluate(() => { estado = 'jogo'; });

  // ---- fotos dos dois ecrãs ----
  await A.evaluate(() => {
    const p2 = coop.p2; J.x = p2.x - 50; J.y = p2.y;
    for (let k = 0; k < 3; k++) { const e = criarInimigo(['esqueleto', 'orc', 'goblin'][k], J.x + 150 + k * 30, J.y - 60 + k * 40); e.acordado = true; inimigos.push(e); }
  });
  await A.waitForTimeout(1200);
  await A.screenshot({ path: `${DIR}/11_anfitriao_jogo.png` });
  await C.screenshot({ path: `${DIR}/12_convidado_jogo.png` });

  // ---- quanta internet gasta (com o ecrã cheio de monstros) ----
  await A.evaluate(() => {
    for (let k = 0; k < 25; k++) { const e = criarInimigo(['esqueleto', 'orc', 'goblin', 'slime', 'morcego'][k % 5], J.x + (Math.random() - 0.5) * 500, J.y + (Math.random() - 0.5) * 300); if (!colideCirculo(mapa, e.x, e.y, e.r)) { e.acordado = true; e.dano = 0; inimigos.push(e); } }
    window._bytes = 0;
    for (const n of ['enviarRapido', 'enviarCoop']) { const f = window[n] || eval(n); const g = m => { window._bytes += JSON.stringify(m).length; return f(m); }; eval(`${n} = g`); }
  });
  await A.waitForTimeout(3000);
  const kbs = await A.evaluate(() => Math.round(window._bytes / 3 / 1024));
  ok(kbs < 300, `gasta ${kbs} KB/s com ${await A.evaluate(() => inimigos.length)} monstros (${Math.round(kbs * 3.6)} MB por hora)`);
  await C.screenshot({ path: `${DIR}/15_convidado_muitos_monstros.png` });
  await A.evaluate(() => { for (const e of inimigos) e.morto = true; });

  // ---- o botão de pausa do convidado pergunta se quer sair ----
  await C.evaluate(() => { premidas['p'] = true; });
  ok(await esperar(C, () => coop.confirmarSair), 'a pausa do convidado pergunta se quer sair');
  await C.screenshot({ path: `${DIR}/16_convidado_sair.png` });
  await C.evaluate(() => { premidas['p'] = true; });
  ok(await esperar(C, () => !coop.confirmarSair && estado === 'convidado'), 'e pode continuar a jogar');

  // ---- cair e reanimar ----
  await A.evaluate(() => { for (const e of inimigos) e.morto = true; const p2 = coop.p2; p2.invuln = 0; p2.dashT = 0; comHeroi(p2, () => danoJogador(99999)); });
  ok(await A.evaluate(() => coop.p2.caido && estado === 'jogo'), 'o parceiro cai (não é o fim do jogo)');
  ok(await esperar(C, () => J.caido), 'o convidado sabe que caiu');
  await A.evaluate(() => { const p2 = coop.p2; J.x = p2.x + 20; J.y = p2.y; });
  await A.waitForTimeout(600);
  await C.screenshot({ path: `${DIR}/13_reanimar.png` });
  ok(await esperar(A, () => !coop.p2.caido, 5000), 'ficar ao lado reanima o parceiro');
  await A.evaluate(() => { J.invuln = 0; J.dashT = 0; J.vidasExtra = 0; danoJogador(99999); });
  ok(await A.evaluate(() => J.caido && estado === 'jogo'), 'tu cais e o parceiro pode reanimar-te');
  await A.evaluate(() => { const p2 = coop.p2; p2.invuln = 0; p2.dashT = 0; comHeroi(p2, () => danoJogador(99999)); });
  ok(await A.evaluate(() => estado === 'morto'), 'se caírem os dois, acaba o jogo');
  ok(await esperar(C, () => coop.espera && coop.fim), 'o convidado vê que o jogo acabou');

  // ---- novo jogo e andar seguinte ----
  await A.evaluate(() => { escolhaClasse = 'titan'; novoJogo(); tutorial = null; estado = 'jogo'; });
  ok(await esperar(A, () => coop.p2 && coop.p2.dono === J && !coop.p2.caido), 'novo jogo: o parceiro entra outra vez');
  const s1 = await A.evaluate(() => somaMapa(mapa));
  ok(await esperar(C, s => convidadoPronto() && !coop.espera && somaMapa(mapa) === s, 6000, s1), 'o convidado recebe o mapa novo');
  await A.evaluate(() => { proximoAndar(); estado = 'jogo'; });
  const s2 = await A.evaluate(() => somaMapa(mapa));
  ok(await esperar(C, s => somaMapa(mapa) === s, 6000, s2), 'no andar seguinte o convidado recebe o mapa novo');
  ok(await esperar(A, () => coop.p2.mapa === mapa && Math.hypot(coop.p2.x - J.x, coop.p2.y - J.y) < 80), 'e o parceiro aparece ao teu lado');
  ok(await esperar(C, () => Math.hypot(J.x - coop.p2.x, J.y - coop.p2.y) < 100, 4000), 'no telemóvel dele também');

  // ---- sala cheia, sair, código errado ----
  const T = await abrir('terceiro', false);
  await T.evaluate(c => { abrirCoop(); coop.codigo = c; coop.classeConvidado = 'cura'; entrarSala(); }, cod);
  ok(await esperar(T, () => coop.msg && /2 jogadores/.test(coop.msg.txt)), 'um terceiro não consegue entrar (sala cheia)');
  await C.evaluate(() => sairConvidado());
  ok(await esperar(A, () => !coop.conn), 'o anfitrião sabe que o parceiro saiu');
  ok(await A.evaluate(() => !parceiroAtivo() && estado === 'jogo'), 'o jogo continua sozinho');
  ok(await C.evaluate(() => estado === 'titulo' && JSON.stringify(meta.melhorias) === JSON.stringify(JSON.parse(localStorage.getItem('masmorra_meta') || '{"melhorias":{}}').melhorias || {})), 'o convidado voltou ao menu com as suas almas');
  await C.evaluate(() => { abrirCoop(); coop.codigo = 'ZZZZ'; coop.classeConvidado = 'vento'; entrarSala(); });
  ok(await esperar(C, () => coop.msg && /não encontrada/.test(coop.msg.txt)), 'código errado: "Sala não encontrada"');

  // ---- o convidado como Caçador das Sombras ----
  await A.evaluate(() => { estado = 'titulo'; escolhaClasse = 'sombras'; novoJogo(); tutorial = null; estado = 'jogo'; });
  await C.evaluate(c => { abrirCoop(); coop.codigo = c; coop.classeConvidado = 'sombras'; entrarSala(); }, cod);
  ok(await esperar(A, () => coop.p2 && coop.p2.classe === 'sombras' && coop.p2.mapa === mapa, 10000), 'o convidado entra como Caçador das Sombras');
  await esperar(C, () => convidadoPronto());
  await A.evaluate(() => { const p2 = coop.p2; for (let k = 0; k < 3; k++) cadaveres.push({ tipo: 'esqueleto', x: p2.x + 20 + k * 10, y: p2.y, t: 20 }); p2.mana = 999; window._s1 = sombras.length; });
  await C.waitForTimeout(300);
  await C.evaluate(() => { premidas['5'] = true; });
  ok(await esperar(A, () => (coop.p2.sombrasMundo || []).length >= 3), 'o convidado ergue o seu exército de sombras');
  ok(await A.evaluate(() => sombras.length === window._s1), 'as sombras dele não se misturam com as tuas');
  ok(await esperar(C, () => sombras.length >= 3), 'o convidado vê as suas sombras');
  await C.waitForTimeout(400);
  await C.screenshot({ path: `${DIR}/14_convidado_sombras.png` });

  // ---- volta pelos 60 andares com o convidado ligado (procura erros de desenho) ----
  if (!RAPIDO) {
    const zonas = [];
    for (let a = 1; a <= 60; a++) {
      await A.evaluate(a => {
        andar = a - 1; J.hpBase = 1e6; S = stats(); J.hp = S.maxHp; coop.p2.hpBase = 1e6;
        proximoAndar(); estado = 'jogo'; J.escolhasPendentes = 0; coop.p2.escolhasPendentes = 0; roleta = null; escolha = null;
        for (const e of inimigos) if (!e.boss) { e.x = J.x + (Math.random() - 0.5) * 300; e.y = J.y + (Math.random() - 0.5) * 200; if (colideCirculo(mapa, e.x, e.y, e.r)) { e.x = J.x; e.y = J.y; } }
        if (boss) { boss.x = J.x + 120; boss.y = J.y; boss.acordado = true; }
      }, a);
      await C.waitForTimeout(a % 5 === 0 ? 900 : 350);
      if (a % 5 === 0 || a === 1 || a === 12 || a === 51) await C.screenshot({ path: `${DIR}/andar_${String(a).padStart(2, '0')}_convidado.png` });
      await A.evaluate(() => { if (estado !== 'jogo') { roleta = null; escolha = null; J.escolhasPendentes = 0; estado = 'jogo'; } });
      zonas.push(a);
    }
    ok(erros.filter(e => e.startsWith('convidado')).length === 0, `60 andares com o convidado ligado sem erros (${zonas.length} andares)`);
  }

  console.log('ERROS:', erros.length ? '\n  ' + erros.slice(0, 20).join('\n  ') : 'nenhum');
  await b.close();
  srv.close && srv.close();
  process.exit(0);
})();
