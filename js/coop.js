'use strict';
// =====================================================================
//  JOGAR A 2 (co-op em dois telemóveis)
//  Quem cria a sala corre o jogo no seu telemóvel e envia a imagem e o
//  som ao outro; o convidado envia os toques e controla o 2.º herói.
//  A ligação é direta entre os dois aparelhos (WebRTC, com a biblioteca
//  PeerJS): o jogo não precisa de servidor próprio.
//  - os monstros atacam o herói mais perto
//  - a câmara segue os dois (não se podem afastar demasiado)
//  - a XP é partilhada; cada baú dá também um prémio ao parceiro
//  - quem cai pode ser reanimado pelo outro; só perdem se caírem os dois
// =====================================================================

const coop = {
  papel: null,        // 'anfitriao' | 'convidado' | null
  ecra: 'menu',       // ecrã da sala: menu | criar | entrar | classe | ligando
  codigo: '',
  msg: null,          // mensagem de erro ou de estado na sala
  peer: null, conn: null, stream: null, video: null,
  p2: null,           // o herói do convidado (só no anfitrião)
  escolhaP2: null,    // { classe, raca, skin } que o convidado escolheu
  entrada: { mx: 0, my: 0, forca: 1, atk: false },
  acoes: [],          // botões carregados pelo convidado (esquiva, poção...)
  oferta: null,       // melhorias à espera que o convidado escolha
  principal: null,    // o herói de quem criou a sala (enquanto se joga com o outro)
  partilhando: false,
  hudT: 0, envioT: 0, ultimaEntrada: '', imagemT: 0,
  classeConvidado: 'aventureiro',
};
const PREFIXO_SALA = 'masmorra-do-destino-';
const LETRAS_SALA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CLASSES_CONVIDADO = ORDEM_CLASSES.filter(c => c !== 'sombras'); // as sombras são só do herói principal
const DIST_REANIMAR = 56, TEMPO_REANIMAR = 2.5;

// ---------------------------------------------------------------------
//  Trocar de herói: o código do jogo usa sempre J e S, por isso para
//  mexer no parceiro trocamo-los por um bocadinho
// ---------------------------------------------------------------------
function comHeroi(h, fn) {
  if (!h || h === J) return fn();
  const J0 = J, S0 = S;
  if (J0 && !J0.remoto) coop.principal = J0;
  J = h;
  S = h.remoto ? (h._S || stats()) : stats();
  try { return fn(); } finally { h._S = S; J = J0; S = S0; }
}
const heroiPrincipal = () => (J && J.remoto ? coop.principal : J);
const parceiroAtivo = () => (coop.p2 && coop.conn && coop.p2.mapa === mapa && coop.p2.dono === heroiPrincipal() ? coop.p2 : null);

// Os heróis de pé (os monstros, as flechas e as armadilhas só lhes acertam a eles)
function heroisVivos() {
  const P1 = heroiPrincipal(), p2 = parceiroAtivo();
  if (!p2) return [P1];
  const l = [];
  if (!P1.caido) l.push(P1);
  if (!p2.caido) l.push(p2);
  return l.length ? l : [P1];
}

// Cada monstro persegue o herói mais perto
function alvoDe(e) {
  const l = heroisVivos();
  if (l.length < 2) return l[0];
  return Math.hypot(l[0].x - e.x, l[0].y - e.y) <= Math.hypot(l[1].x - e.x, l[1].y - e.y) ? l[0] : l[1];
}

function focoCamara() {
  const p2 = parceiroAtivo();
  return p2 ? { x: (J.x + p2.x) / 2, y: (J.y + p2.y) / 2 } : J;
}

// ---------------------------------------------------------------------
//  O herói do convidado (criado ao nível do teu, com equipamento do andar)
// ---------------------------------------------------------------------
const ATRIBUTO_CLASSE = { aventureiro: 'for', espada: 'agi', fogo: 'int', besta: 'for', titan: 'vit', cura: 'int', vento: 'agi' };
function distribuirPontos() {
  const a = ATRIBUTO_CLASSE[J.classe] || 'for';
  if (!J.atributos) J.atributos = {};
  while (J.pontos > 0) {
    const id = (J.atributos[a] || 0) <= (J.atributos.vit || 0) * 2 ? a : 'vit';
    J.atributos[id] = (J.atributos[id] || 0) + 1;
    J.pontos--;
  }
}
function perkAleatorio() {
  const l = PERKS.filter(p => nPerk(p.id) < p.max && !p.unica);
  if (!l.length) return;
  const p = escolher(l);
  J.perks[p.id] = nPerk(p.id) + 1;
}

function criarParceiro() {
  const P1 = J, E = coop.escolhaP2;
  const h = criarJogador();
  Object.assign(h, {
    raca: RACAS[E.raca] ? E.raca : 'humano', skin: SKINS[E.skin] ? E.skin : 'azul', classe: CLASSES_CONVIDADO.includes(E.classe) ? E.classe : 'aventureiro',
    dificuldade: P1.dificuldade, pacto: Object.assign({}, P1.pacto || {}), modo: P1.modo, remoto: true, dono: P1, mapa: null, reviver: 0,
  });
  if (h.skin === P1.skin) h.skin = Object.keys(SKINS).find(k => k !== P1.skin && !SKINS[k].recorde && !SKINS[k].conquista) || h.skin; // para não serem iguais
  comHeroi(h, () => {
    aplicarClasseInicial();
    while (J.nivel < P1.nivel) { // apanha o nível do parceiro
      J.nivel++;
      J.hpBase += 10; J.atkBase += 2; J.defBase += 1;
      J.pontos += PONTOS_POR_NIVEL;
      perkAleatorio();
    }
    distribuirPontos();
    if (andar > 1) { // equipamento à altura do andar
      const base = ITENS.find(i => i.nome === J.arma.nomeBase);
      if (base) J.arma = criarItem(base, andar, true);
      const r = P1.armadura ? P1.armadura.r : 'comum';
      const ars = ITENS.filter(i => i.tipo === 'armadura' && i.r === r && !i.inicial);
      if (ars.length) J.armadura = criarItem(escolher(ars), andar, true);
    }
    S = stats();
    J.hp = S.maxHp;
    J.mana = S.maxMana;
  });
  coop.p2 = h;
  return h;
}

// Põe o parceiro ao teu lado (ao mudar de andar, entrar num portal, na cidade...)
function juntarParceiro(p2) {
  p2.mapa = mapa;
  p2.caido = false; p2.reviver = 0;
  p2.kbx = p2.kby = 0; p2.dashT = 0; p2.golpe = null;
  for (const [ox, oy] of [[30, 0], [-30, 0], [0, 30], [0, -30], [24, 24], [-24, 24]]) {
    if (!colideCirculo(mapa, J.x + ox, J.y + oy, p2.r)) { p2.x = J.x + ox; p2.y = J.y + oy; return; }
  }
  p2.x = J.x; p2.y = J.y;
}

// ---------------------------------------------------------------------
//  Atualização do parceiro (chamada pelo atualizar() com J = o teu herói)
// ---------------------------------------------------------------------
function atualizarCoop(dt) {
  if (coop.papel !== 'anfitriao' || !coop.conn || !coop.escolhaP2 || !mapa) return;
  const P1 = J;
  if (!coop.p2 || coop.p2.dono !== P1) { criarParceiro(); enviarCoop({ t: 'aviso', titulo: 'Entraste no jogo!', sub: 'Luta ao lado do teu parceiro', cor: '#5dff7a' }); }
  const p2 = coop.p2;
  if (p2.mapa !== mapa) juntarParceiro(p2);

  // o que o convidado carregou desde a última vez
  const A = coop.acoes; coop.acoes = [];
  const R = Object.assign({}, coop.entrada, { dash: A.includes('dash'), pocao: A.includes('pocao') });
  comHeroi(p2, () => {
    S = stats();
    atualizarJogador(dt, R);
    if (!J.caido) {
      atualizarClasse(dt);
      atualizarCacador(dt);
      atualizarVeneno(dt);
      if (J.dorT > 0) J.dorT -= dt;
      if (J.bebeuT > 0) J.bebeuT -= dt;
      for (const a of A) {
        if (a === 'classe') usarHabilidadeClasse();
        else if (a[0] === 'h') usarHabilidade(+a.slice(1));
        else if (a[0] === 'f') { const id = feiticosJ()[+a.slice(1)]; if (id && J.feiticos[id]) lancarFeitico(id); }
      }
      revelar(mapa, J.x, J.y, 7);
      apanharDrops(P1);
    }
  });

  // não se podem afastar demasiado: o teu herói puxa o do parceiro
  const lx = vistaW() - 110, ly = vistaH() - 110;
  const dx = p2.x - P1.x, dy = p2.y - P1.y;
  if (Math.abs(dx) > lx * 1.5 || Math.abs(dy) > ly * 1.5) juntarParceiro(p2);
  else if (Math.abs(dx) > lx || Math.abs(dy) > ly) {
    const ex = Math.abs(dx) > lx ? dx - Math.sign(dx) * lx : 0, ey = Math.abs(dy) > ly ? dy - Math.sign(dy) * ly : 0;
    moverEntidade(mapa, p2, -ex, -ey);
  }

  // reanimar: fica perto de quem caiu
  for (const [H, O] of [[P1, p2], [p2, P1]]) {
    if (!H.caido) continue;
    if (!O.caido && Math.hypot(H.x - O.x, H.y - O.y) < DIST_REANIMAR) {
      H.reviver += dt;
      if (H.reviver >= TEMPO_REANIMAR) levantarHeroi(H);
    } else H.reviver = Math.max(0, H.reviver - dt * 0.5);
  }

  // melhorias ao subir de nível: o convidado escolhe no telemóvel dele
  if (coop.oferta) {
    coop.oferta.t += dt;
    if (coop.oferta.t > 25) aplicarPerkParceiro(0); // demorou muito: fica com a primeira
  } else if (p2.escolhasPendentes > 0) {
    comHeroi(p2, () => {
      const disp = PERKS.filter(p => nPerk(p.id) < p.max), ids = [];
      while (ids.length < 3 && ids.length < disp.length) ids.push(escolher(disp.filter(p => !ids.includes(p.id))).id);
      if (!ids.length) { J.escolhasPendentes = 0; return; }
      coop.oferta = { ids, t: 0 };
      enviarCoop({ t: 'perks', ids, perks: J.perks, nivel: J.nivel });
    });
  }
}

// O parceiro também apanha ouro (vai para a equipa) e poções (para ele)
function apanharDrops(P1) {
  for (const d of drops) {
    if (d.morto) continue;
    const dd = Math.hypot(d.x - J.x, d.y - J.y);
    if (d.tipo === 'ouro' && dd < 120 && dd > 1) { d.x += (J.x - d.x) / dd * 380 * (1 / 60); d.y += (J.y - d.y) / dd * 380 * (1 / 60); }
    if (dd >= J.r + 12) continue;
    if (d.tipo === 'ouro') {
      d.morto = true;
      const v = Math.max(1, Math.round(d.valor * S.ouroMult));
      P1.ouro += v;
      texto(d.x, d.y - 10, `+${v} ouro`, '#ffd23f', 13);
      som(1300, 0.05, 'square', 0.02, 300);
    } else if (d.tipo === 'pocao') {
      d.morto = true;
      J.pocoes++;
      texto(d.x, d.y - 10, '+1 Poção', '#ff6b8a', 15);
      som(660, 0.12, 'triangle', 0.05, 200);
    }
  }
}

function levantarHeroi(H) {
  comHeroi(H, () => {
    J.caido = false; J.reviver = 0;
    J.hp = Math.round(S.maxHp * 0.4);
    J.invuln = 2;
    texto(J.x, J.y - 34, 'DE PÉ!', '#5dff7a', 22);
    explosao(J.x, J.y, '#5dff7a', 30, 200, 5);
    fanfarra([523, 659, 784], 0.04);
  });
  if (H.remoto) enviarCoop({ t: 'aviso', titulo: 'De pé!', sub: 'O teu parceiro reanimou-te', cor: '#5dff7a' });
}

// Chamado pelo danoJogador quando um herói fica sem vida. Devolve true se
// ele só caiu (o outro ainda está de pé e pode reanimá-lo).
function caiuCoop() {
  const p2 = parceiroAtivo();
  if (!p2) return false;
  const P1 = heroiPrincipal(), outro = J === p2 ? P1 : p2;
  if (outro.caido) { // caíram os dois: acabou
    if (J.remoto) { J.caido = false; comHeroi(P1, () => { J.caido = false; morrer(); }); return true; }
    p2.caido = false;
    return false;
  }
  J.caido = true; J.reviver = 0; J.hp = 1;
  J.golpe = null; J.dashT = 0; J.veneno = 0;
  texto(J.x, J.y - 30, 'CAÍDO!', '#ff6060', 20);
  som(120, 0.5, 'sawtooth', 0.05, -60);
  if (J.remoto) enviarCoop({ t: 'aviso', titulo: 'Caíste!', sub: 'Fica quieto: o teu parceiro pode reanimar-te', cor: '#ff6060' });
  else mostrarBanner('CAÍSTE!', 'O teu parceiro pode reanimar-te: tem de ficar ao teu lado', '#ff6060');
  return true;
}

// A XP é de todos: o que um ganha, o outro também ganha
function partilharXp(q) {
  if (coop.partilhando || !parceiroAtivo()) return;
  coop.partilhando = true;
  try { comHeroi(J.remoto ? coop.principal : coop.p2, () => ganharXp(q)); } finally { coop.partilhando = false; }
}

// Subir de nível do parceiro: os pontos vão sozinhos para os atributos da classe
function subirNivelParceiro() {
  J.pontos = (J.pontos || 0) + PONTOS_POR_NIVEL;
  distribuirPontos();
  const h = habsJ().find(x => x.nivel === J.nivel);
  if (h) enviarCoop({ t: 'aviso', titulo: `[Sistema] Nova habilidade: ${h.nome}`, sub: h.desc, cor: '#4dc3ff' });
}

function aplicarPerkParceiro(i) {
  const of = coop.oferta, p2 = coop.p2;
  coop.oferta = null;
  if (!of || !p2) return;
  const p = PERKS.find(x => x.id === of.ids[clamp(i, 0, of.ids.length - 1)]);
  if (!p) return;
  comHeroi(p2, () => {
    J.perks[p.id] = nPerk(p.id) + 1;
    if (p.id === 'vitalidade') J.hp += 30;
    if (p.id === 'pocoes') J.pocoes += 2;
    J.escolhasPendentes = Math.max(0, J.escolhasPendentes - 1);
    S = stats();
    texto(J.x, J.y - 30, p.nome + '!', p.cor, 18);
    explosao(J.x, J.y, p.cor, 20, 180, 4);
  });
}

// Cada baú aberto dá também um prémio ao parceiro (se não for melhor, vende-o)
function presenteParceiro(tipoBau) {
  const p2 = parceiroAtivo();
  if (!p2) return;
  const P1 = heroiPrincipal();
  comHeroi(p2, () => {
    const it = sortearItem(tipoBau);
    if (!it || !['arma', 'armadura', 'amuleto'].includes(it.tipo)) return;
    const velho = J[it.tipo], antes = poderJogador();
    J[it.tipo] = it; S = stats();
    const depois = poderJogador();
    J[it.tipo] = velho; S = stats();
    if (depois > antes && !it.maldicao) {
      equipar(it);
      texto(J.x, J.y - 34, it.nome, RARIDADES[it.r].cor, 15);
      enviarCoop({ t: 'aviso', titulo: `Novo equipamento: ${traduzir(it.nome)}`, sub: `${traduzir(RARIDADES[it.r].nome)} · ${idioma === 'en' ? 'Power' : 'Poder'} +${depois - antes}`, cor: RARIDADES[it.r].cor });
    } else {
      const v = valorVenda(it);
      P1.ouro += v;
      enviarCoop({ t: 'aviso', titulo: `Vendeste ${traduzir(it.nome)}`, sub: `+${v} ouro para a equipa`, cor: '#ffd23f' });
    }
  });
}

// ---------------------------------------------------------------------
//  Desenho (no anfitrião)
// ---------------------------------------------------------------------
function desenharParceiro(t) {
  const p2 = parceiroAtivo();
  if (!p2) return;
  if (!p2.caido) { // um anel da cor do caçador aos pés, para se distinguir
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = (CLASSES[p2.classe] || CLASSES.aventureiro).cor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(alinhar(p2.x), alinhar(p2.y + 13), 14, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  comHeroi(p2, () => desenharJogador(t));
}

// Um herói caído: deitado, a piscar, com o círculo de reanimar
function desenharCaido(t) {
  const c = framesHeroi(J.raca, J.skin)[0];
  sombra(J.x, J.y + 8, 12);
  ctx.save();
  ctx.translate(alinhar(J.x), alinhar(J.y + 4));
  ctx.rotate(Math.PI / 2);
  ctx.globalAlpha = 0.75;
  spr(c, 0, 0);
  sprCor(c, 0, 0, false, '#6a6a80', 0.5);
  ctx.restore();
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6);
  aro(J.x, J.y, DIST_REANIMAR - 10, '#ff6060', 2);
  ctx.globalAlpha = 1;
  if (J.reviver > 0) {
    ctx.strokeStyle = '#5dff7a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(alinhar(J.x), alinhar(J.y), 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(J.reviver / TEMPO_REANIMAR, 0, 1));
    ctx.stroke();
  }
}

// Nome por cima do parceiro e "Ajuda!" por cima de quem caiu
function desenharEtiquetasCoop(t) {
  const p2 = parceiroAtivo();
  if (!p2 || estado === 'morto') return;
  const cor = CLASSES[p2.classe] ? CLASSES[p2.classe].cor : '#fff';
  textoCentro('J2', ecraX(p2.x), ecraY(p2.y) - 40, 12, cor);
  for (const H of [J, p2]) if (H.caido) textoCentro(Math.floor(t * 2) % 2 ? 'AJUDA!' : 'Reanima-me!', ecraX(H.x), ecraY(H.y) - 44, 13, '#ff8080');
}

// Painel do parceiro, por baixo do teu (no canto esquerdo)
function desenharHudParceiro(y, t) {
  if (coop.papel !== 'anfitriao') return;
  const p2 = parceiroAtivo();
  if (!p2) {
    painel(10, y, 250, 30);
    textoEsq(coop.conn ? 'O parceiro está a entrar...' : `À espera do parceiro · sala ${coop.codigo}`, 20, y + 15, 12, '#9fdcff', 'normal');
    return;
  }
  const S2 = p2._S || S, C = CLASSES[p2.classe] || CLASSES.aventureiro;
  painel(10, y, 250, 52);
  textoEsq(`J2 · Nv ${p2.nivel}`, 20, y + 14, 13, '#ffe14d');
  textoEsq(C.nome, 106, y + 14, 11, C.cor, 'normal');
  barra(20, y + 26, 230, 12, p2.caido ? 0 : p2.hp / S2.maxHp, p2.caido ? '#555' : p2.hp / S2.maxHp < 0.3 ? '#ff2d2d' : '#e0413e');
  textoCentro(p2.caido ? 'CAÍDO' : `${Math.ceil(p2.hp)} / ${S2.maxHp}`, 135, y + 32, 11, '#fff');
  barra(20, y + 41, 230, 5, p2.mana / S2.maxMana, '#8a4dff', '#1e1438');
}

// A luz do parceiro
function luzParceiro(luz, t) {
  const p2 = parceiroAtivo();
  if (p2) luz(p2.x, p2.y, 300 + Math.sin(t * 7 + 1) * 6, 1);
}

// ---------------------------------------------------------------------
//  Rede (PeerJS)
// ---------------------------------------------------------------------
function carregarPeer() {
  if (window.Peer) return Promise.resolve();
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'js/lib/peerjs.min.js';
    s.onload = () => (window.Peer ? ok() : falha(new Error('peerjs')));
    s.onerror = () => falha(new Error('peerjs'));
    document.head.appendChild(s);
  });
}
const opcoesPeer = () => Object.assign({ debug: 0 }, window.OPCOES_PEER || {});
function enviarCoop(m) {
  if (!coop.conn || !coop.conn.open) return;
  try { coop.conn.send(m); } catch (e) { /* ligação a fechar */ }
}
function erroRede(err) {
  const tipo = err && err.type;
  if (tipo === 'peer-unavailable') return 'Sala não encontrada. Confirma o código.';
  if (tipo === 'browser-incompatible') return 'Este browser não consegue jogar a 2.';
  return 'Sem ligação. Jogar a 2 precisa de internet.';
}
function fecharRede() {
  try { if (coop.conn) coop.conn.close(); } catch (e) { /* ignora */ }
  try { if (coop.peer) coop.peer.destroy(); } catch (e) { /* ignora */ }
  coop.conn = null; coop.peer = null;
}

// --- quem cria a sala ---
function novoCodigo() {
  let c = '';
  for (let i = 0; i < 4; i++) c += LETRAS_SALA[Math.floor(Math.random() * LETRAS_SALA.length)];
  return c;
}
function criarSala(tentativa = 0) {
  coop.papel = 'anfitriao';
  coop.ecra = 'criar';
  coop.codigo = '';
  coop.msg = { txt: 'A criar a sala...', cor: '#aaa' };
  carregarPeer().then(() => {
    const cod = novoCodigo();
    const peer = new Peer(PREFIXO_SALA + cod, opcoesPeer());
    coop.peer = peer;
    peer.on('open', () => { coop.codigo = cod; coop.msg = null; });
    peer.on('connection', c => receberLigacao(c));
    peer.on('error', err => {
      if (err && err.type === 'unavailable-id' && tentativa < 5) { peer.destroy(); criarSala(tentativa + 1); return; }
      if (err && err.type === 'peer-unavailable') return; // o convidado saiu antes de receber a imagem
      coop.msg = { txt: erroRede(err), cor: '#ff6060' };
    });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* ignora */ } }); // o servidor de ligação caiu: a sala continua
  }).catch(() => { coop.msg = { txt: 'Jogar a 2 só funciona no site do jogo (com internet).', cor: '#ff6060' }; });
}

function receberLigacao(c) {
  if (coop.conn && coop.conn.open) { // já há um parceiro
    c.on('open', () => { try { c.send({ t: 'cheia' }); } catch (e) { /* ignora */ } setTimeout(() => c.close(), 500); });
    return;
  }
  coop.conn = c;
  c.on('data', m => receberNoAnfitriao(m, c));
  c.on('close', () => saiuConvidado(c));
  c.on('error', () => saiuConvidado(c));
}

function receberNoAnfitriao(m, c) {
  if (!m || c !== coop.conn) return;
  if (m.t === 'ola') {
    const mesma = coop.escolhaP2 && coop.escolhaP2.classe === m.classe;
    coop.escolhaP2 = { classe: m.classe, raca: m.raca, skin: m.skin };
    if (!mesma) coop.p2 = null; // mudou de caçador: herói novo
    enviarCoop({ t: 'bemvindo', codigo: coop.codigo });
    avisar('O teu parceiro entrou!', `${traduzir((CLASSES[m.classe] || CLASSES.aventureiro).nome)} · joga no telemóvel dele`, '#5dff7a');
    ligarImagem(c.peer);
  } else if (m.t === 'in') {
    coop.entrada = { mx: clamp(+m.mx || 0, -1, 1), my: clamp(+m.my || 0, -1, 1), forca: clamp(+m.forca || 1, 0.3, 1), atk: !!m.atk };
  } else if (m.t === 'acao') {
    if (coop.acoes.length < 20 && typeof m.a === 'string') coop.acoes.push(m.a);
  } else if (m.t === 'perk') {
    aplicarPerkParceiro(+m.i || 0);
  }
}

// Envia a imagem do jogo (e o som) ao convidado
function streamJogo() {
  if (coop.stream) return coop.stream;
  const s = canvas.captureStream(30);
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const d = actx.createMediaStreamDestination();
    saidaSom().connect(d);
    const pista = d.stream.getAudioTracks()[0];
    if (pista) s.addTrack(pista);
  } catch (e) { /* sem som: só a imagem */ }
  coop.stream = s;
  return s;
}
function ligarImagem(id) {
  try { coop.peer.call(id, streamJogo()); } catch (e) { avisar('Não foi possível enviar a imagem', 'Tentem outra vez', '#ff6060'); }
}

function saiuConvidado(c) {
  if (c !== coop.conn) return;
  coop.conn = null;
  coop.entrada = { mx: 0, my: 0, forca: 1, atk: false };
  coop.oferta = null;
  const P1 = heroiPrincipal();
  if (P1 && P1.caido) { P1.caido = false; P1.hp = Math.max(1, Math.round((S ? S.maxHp : 100) * 0.3)); P1.invuln = 2; }
  avisar('O teu parceiro saiu', `A sala continua aberta (código ${coop.codigo})`, '#ffae00');
}

function fecharSala() {
  fecharRede();
  if (coop.stream) { for (const tr of coop.stream.getTracks()) tr.stop(); coop.stream = null; }
  coop.papel = null; coop.p2 = null; coop.escolhaP2 = null; coop.codigo = ''; coop.oferta = null;
}

// Envia ao convidado o que ele precisa para desenhar os botões (10 vezes por segundo)
function atualizarRedeCoop(dt) {
  if (coop.papel !== 'anfitriao' || !coop.conn) return;
  coop.hudT -= dt;
  if (coop.hudT > 0) return;
  coop.hudT = 0.1;
  const p2 = coop.p2;
  if (!p2 || !p2._S) { enviarCoop({ t: 'hud', espera: true }); return; }
  enviarCoop({ t: 'hud', classe: p2.classe, evoluido: !!p2.evoluido, nivel: p2.nivel, feiticos: p2.feiticos, cdFeitico: p2.cdFeitico,
    cdHab: p2.cdHab, cdClasse: p2.cdClasse || 0, mana: p2.mana, maxMana: p2._S.maxMana, pocoes: p2.pocoes, arma: p2.arma,
    cdDash: p2.cdDash, dashT: p2.dashT, cdDashMax: p2._S.cdDash, raca: p2.raca, skin: p2.skin, hp: p2.hp, maxHp: p2._S.maxHp,
    caido: !!p2.caido, jogo: estado === 'jogo' && parceiroAtivo() === p2 });
}

// --- quem entra na sala ---
function entrarSala() {
  coop.papel = 'convidado';
  coop.ecra = 'ligando';
  coop.msg = { txt: `A ligar à sala ${coop.codigo}...`, cor: '#aaa' };
  carregarPeer().then(() => {
    const peer = new Peer(opcoesPeer());
    coop.peer = peer;
    peer.on('open', () => {
      const c = peer.connect(PREFIXO_SALA + coop.codigo, { reliable: true });
      coop.conn = c;
      c.on('open', () => c.send({ t: 'ola', classe: coop.classeConvidado, raca: escolhaRaca, skin: escolhaSkin }));
      c.on('data', m => receberNoConvidado(m));
      c.on('close', () => perdeuLigacao());
      c.on('error', () => perdeuLigacao());
    });
    peer.on('call', ch => {
      ch.answer();
      ch.on('stream', s => mostrarImagem(s));
    });
    peer.on('error', err => {
      if (estado === 'convidado') { perdeuLigacao(); return; }
      coop.ecra = 'entrar';
      coop.msg = { txt: erroRede(err), cor: '#ff6060' };
      fecharRede();
    });
  }).catch(() => { coop.ecra = 'entrar'; coop.msg = { txt: 'Jogar a 2 só funciona no site do jogo (com internet).', cor: '#ff6060' }; });
}

function mostrarImagem(s) {
  if (!coop.video) {
    const v = document.createElement('video');
    v.setAttribute('playsinline', ''); v.setAttribute('autoplay', '');
    v.muted = true; // o som liga-se ao primeiro toque (regras dos browsers)
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none';
    document.body.appendChild(v);
    coop.video = v;
  }
  coop.video.srcObject = s;
  coop.video.play().catch(() => {});
}
function ligarSomConvidado() {
  const v = coop.video;
  if (v && v.muted && somLigado) { v.muted = false; v.play().catch(() => {}); }
}
addEventListener('touchstart', ligarSomConvidado, { capture: true, passive: true });
addEventListener('mousedown', ligarSomConvidado, { capture: true });

function receberNoConvidado(m) {
  if (!m) return;
  if (m.t === 'bemvindo') {
    estado = 'convidado';
    coop.imagemT = 0;
    J = Object.assign(criarJogador(), { classe: coop.classeConvidado });
    S = { cdDash: 0.9, maxMana: 50 };
  } else if (m.t === 'cheia') {
    coop.papel = null; // assim o fecho da ligação não troca esta mensagem
    coop.ecra = 'entrar';
    coop.msg = { txt: 'Esta sala já tem 2 jogadores.', cor: '#ff6060' };
    fecharRede();
  } else if (m.t === 'hud' && J) {
    coop.espera = !!m.espera || !m.jogo;
    if (m.espera) return;
    for (const k of ['classe', 'evoluido', 'nivel', 'feiticos', 'cdFeitico', 'cdHab', 'cdClasse', 'mana', 'pocoes', 'arma', 'cdDash', 'dashT', 'raca', 'skin', 'hp', 'caido']) J[k] = m[k];
    S = { cdDash: m.cdDashMax || 0.9, maxMana: m.maxMana || 50, maxHp: m.maxHp || 100 };
  } else if (m.t === 'perks' && J) {
    const ops = (m.ids || []).map(id => PERKS.find(p => p.id === id)).filter(Boolean);
    if (!ops.length) return;
    J.perks = m.perks || {};
    J.nivel = m.nivel || J.nivel;
    escolha = { opcoes: ops, t: 0 };
    fanfarra([523, 659, 784, 1046], 0.04);
  } else if (m.t === 'aviso') {
    avisar(m.titulo, m.sub, m.cor);
  } else if (m.t === 'vib') {
    vibrar(m.p);
  }
}

function perdeuLigacao() {
  if (coop.papel !== 'convidado') return;
  const noJogo = estado === 'convidado';
  fecharRede();
  if (coop.video) { coop.video.srcObject = null; }
  escolha = null;
  estado = 'coop';
  coop.ecra = 'entrar';
  coop.msg = { txt: noJogo ? 'A ligação caiu. Podes voltar a entrar com o mesmo código.' : 'Não foi possível entrar na sala.', cor: '#ff6060' };
  J = null;
}

function sairConvidado() {
  fecharRede();
  if (coop.video) { coop.video.srcObject = null; }
  coop.papel = null;
  escolha = null;
  J = null;
  estado = 'titulo';
}

// O convidado: lê os comandos (toque ou teclado) e envia-os
const BOTAO_SAIR_COOP = { x: LARGURA / 2 - 75, y: 6, w: 150, h: 30 };
function atualizarConvidado(dt) {
  coop.imagemT += dt;
  if (clicou(BOTAO_SAIR_COOP) && !escolha) { sairConvidado(); return; }
  if (escolha) { // melhoria a escolher
    escolha.t += dt;
    if (escolha.t < 0.35) return;
    let i = -1;
    if (premiu('1')) i = 0; else if (premiu('2')) i = 1; else if (premiu('3')) i = 2;
    if (premiu('rato')) escolha.opcoes.forEach((_, k) => { if (dentro(retCartaPerk(k, escolha.opcoes.length))) i = k; });
    if (i >= 0 && i < escolha.opcoes.length) { enviarCoop({ t: 'perk', i }); escolha = null; som(660, 0.2, 'triangle', 0.05, 300); }
    return;
  }
  let mx = 0, my = 0, forca = 1;
  if (teclas['w'] || teclas['arrowup']) my -= 1;
  if (teclas['s'] || teclas['arrowdown']) my += 1;
  if (teclas['a'] || teclas['arrowleft']) mx -= 1;
  if (teclas['d'] || teclas['arrowright']) mx += 1;
  const js = lerJoystick();
  if (js) { mx = js.x; my = js.y; forca = js.forca; }
  const atk = !!(toque.atacar || teclas[' '] || teclas['j']);
  const e = { t: 'in', mx: Math.round(mx * 100) / 100, my: Math.round(my * 100) / 100, forca: Math.round(forca * 100) / 100, atk };
  const chave = `${e.mx},${e.my},${e.forca},${e.atk}`;
  coop.envioT -= dt;
  if (chave !== coop.ultimaEntrada || coop.envioT <= 0) { enviarCoop(e); coop.ultimaEntrada = chave; coop.envioT = 0.25; }
  const acao = a => enviarCoop({ t: 'acao', a });
  if (premiu('shift')) acao('dash');
  if (premiu('q')) acao('pocao');
  if (premiu('f')) acao('classe');
  for (let i = 0; i < 4; i++) if (premiu(String(1 + i))) acao('f' + i);
  for (let i = 0; i < 4; i++) if (premiu(String(5 + i))) acao('h' + i);
}

function desenharConvidado(t) {
  ctx = ctxTela;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, 0, TELA_W, ALTURA);
  const v = coop.video;
  if (v && v.readyState >= 2 && v.videoWidth) {
    const k = Math.min(TELA_W / v.videoWidth, ALTURA / v.videoHeight), w = v.videoWidth * k, h = v.videoHeight * k;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(v, (TELA_W - w) / 2, (ALTURA - h) / 2, w, h);
    ctx.imageSmoothingEnabled = false;
  }
  ctx.setTransform(1, 0, 0, 1, MARGEM_X, 0);
  if (!v || !v.videoWidth) {
    textoCentro('A receber a imagem do teu parceiro...', LARGURA / 2, ALTURA / 2 - 10, 20, '#ddd');
    if (coop.imagemT > 12) textoCentro('Está a demorar: tentem os dois estar no mesmo Wi-Fi', LARGURA / 2, ALTURA / 2 + 24, 14, '#ffae00', false);
  }
  if (J && J.arma && !coop.espera) {
    if (modoToque) desenharControlosToque(t);
    else textoCentro('WASD mover · Espaço atacar · Shift esquiva · Q poção · F ★ · 1-4 magias · 5-8 habilidades', LARGURA / 2, ALTURA - 14, 12, '#ccc', false);
  }
  if (coop.espera && v && v.videoWidth) textoCentro('O teu parceiro está nos menus...', LARGURA / 2, 60, 14, '#ffe680');
  if (J && J.caido && Math.floor(t * 2) % 2) textoCentro('CAÍSTE! O teu parceiro pode reanimar-te', LARGURA / 2, 110, 18, '#ff6060');
  botao(BOTAO_SAIR_COOP, 'Sair da sala', '#ff8080', 'rgba(18,14,28,0.85)', 'fechar');
  if (escolha) desenharEscolha(t);
}

// ---------------------------------------------------------------------
//  Sala (menu "Jogar a 2")
// ---------------------------------------------------------------------
const BOTOES_COOP = {
  criar: { x: 300, y: 340, w: 360, h: 48 },
  entrar: { x: 300, y: 402, w: 360, h: 48 },
  novo: { x: 250, y: 470, w: 220, h: 44 },
  continuar: { x: 490, y: 470, w: 220, h: 44 },
  fechar: { x: 370, y: 530, w: 220, h: 40 },
  apagar: { x: 250, y: 560, w: 200, h: 44 },
  seguinte: { x: 510, y: 560, w: 200, h: 44 },
  entrarJogo: { x: 360, y: 560, w: 240, h: 44 },
};
const retLetraSala = i => ({ x: 176 + (i % 8) * 78, y: 290 + Math.floor(i / 8) * 64, w: 70, h: 56 });
const retClasseCoop = i => ({ x: 30 + (i % 4) * 228, y: 170 + Math.floor(i / 4) * 124, w: 220, h: 110 });

function abrirCoop() {
  estado = 'coop';
  if (coop.papel === 'anfitriao') coop.ecra = 'criar';
  else { coop.ecra = 'menu'; coop.msg = null; }
  rato.baixo = false;
}

function atualizarLobby(dt) {
  const E = coop.ecra;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) {
    if (E === 'classe') coop.ecra = 'entrar';
    else if (E === 'entrar' || E === 'ligando') { if (E === 'ligando') fecharRede(); coop.papel = null; coop.ecra = 'menu'; coop.msg = null; }
    else estado = 'titulo';
    return;
  }
  if (E === 'menu') {
    if (clicou(BOTOES_COOP.criar)) criarSala();
    else if (clicou(BOTOES_COOP.entrar)) { coop.ecra = 'entrar'; coop.codigo = ''; coop.msg = null; }
  } else if (E === 'criar') {
    if (clicou(BOTOES_COOP.novo) && coop.codigo) { modoProximo = null; abrirCriacao(); }
    else if (saveInfo && coop.codigo && clicou(BOTOES_COOP.continuar)) continuarJogo();
    else if (clicou(BOTOES_COOP.fechar)) { fecharSala(); coop.ecra = 'menu'; coop.msg = null; }
  } else if (E === 'entrar') {
    for (let i = 0; i < LETRAS_SALA.length; i++) {
      const L = LETRAS_SALA[i];
      if ((clicou(retLetraSala(i)) || premiu(L.toLowerCase())) && coop.codigo.length < 4) { coop.codigo += L; coop.msg = null; }
    }
    if ((clicou(BOTOES_COOP.apagar) || premiu('backspace')) && coop.codigo.length) coop.codigo = coop.codigo.slice(0, -1);
    if (coop.codigo.length === 4 && (clicou(BOTOES_COOP.seguinte) || premiu('enter'))) {
      coop.ecra = 'classe';
      if (!CLASSES_CONVIDADO.includes(coop.classeConvidado)) coop.classeConvidado = CLASSES_CONVIDADO.includes(escolhaClasse) ? escolhaClasse : 'aventureiro';
    }
  } else if (E === 'classe') {
    CLASSES_CONVIDADO.forEach((id, i) => { if (clicou(retClasseCoop(i))) coop.classeConvidado = id; });
    if (clicou(BOTOES_COOP.entrarJogo) || premiu('enter')) entrarSala();
  }
}

function desenharLobby(t) {
  botao(BOTAO_VOLTAR, '< Voltar', '#ddd');
  textoCentro('JOGAR A 2', LARGURA / 2, 60, 36, '#ffe14d');
  const E = coop.ecra;
  if (E === 'menu') {
    painel(170, 110, 620, 210);
    textoCentro('Dois telemóveis, a mesma masmorra', LARGURA / 2, 140, 18, '#9fdcff');
    [
      'Quem cria a sala joga no seu telemóvel.',
      'O outro vê o jogo no telemóvel dele e controla o 2.º herói.',
      'Os monstros atacam o herói mais perto e a XP é dos dois.',
      'Se um cair, o outro reanima-o ficando ao lado dele.',
      'Precisam os dois de internet.',
    ].forEach((l, i) => textoCentro(l, LARGURA / 2, 178 + i * 26, 14, '#ddd', false));
    botao(BOTOES_COOP.criar, 'Criar sala', '#ffe14d', undefined, 'novo');
    botao(BOTOES_COOP.entrar, 'Entrar numa sala', '#5dff7a', undefined, 'jogar');
  } else if (E === 'criar') {
    painel(170, 110, 620, 330);
    if (coop.codigo) {
      textoCentro('Código da sala', LARGURA / 2, 146, 18, '#ccc', false);
      coop.codigo.split('').forEach((L, i) => {
        const x = LARGURA / 2 - 150 + i * 80 + 30;
        painel(x - 32, 170, 64, 76, 'rgba(10,8,18,0.95)', '#ffe14d');
        textoCentro(L, x, 210, 44, '#ffe14d');
      });
      textoCentro('Diz este código ao teu amigo.', LARGURA / 2, 282, 15, '#ddd', false);
      textoCentro('No telemóvel dele: Jogar a 2 → Entrar numa sala.', LARGURA / 2, 306, 15, '#ddd', false);
      const p = coop.conn ? (coop.escolhaP2 ? `Parceiro ligado: ${traduzir((CLASSES[coop.escolhaP2.classe] || CLASSES.aventureiro).nome)}` : 'O parceiro está a entrar...') : `À espera do parceiro${'.'.repeat(Math.floor(t * 2) % 4)}`;
      textoCentro(p, LARGURA / 2, 350, 17, coop.conn ? '#5dff7a' : '#ffae00');
      textoCentro('Podes começar já: ele entra quando quiser.', LARGURA / 2, 390, 13, '#999', false);
      botao(BOTOES_COOP.novo, 'Novo jogo', '#ffe14d', undefined, 'novo');
      if (saveInfo) botao(BOTOES_COOP.continuar, 'Continuar', '#5dff7a', undefined, 'jogar');
    }
    if (coop.msg) textoCentro(coop.msg.txt, LARGURA / 2, coop.codigo ? 430 : 260, 16, coop.msg.cor, false);
    botao(BOTOES_COOP.fechar, 'Fechar sala', '#ff8080', undefined, 'fechar');
  } else if (E === 'entrar' || E === 'ligando') {
    textoCentro('Escreve o código da sala', LARGURA / 2, 110, 18, '#ccc', false);
    for (let i = 0; i < 4; i++) {
      const x = LARGURA / 2 - 150 + i * 80 + 30, L = coop.codigo[i];
      painel(x - 32, 136, 64, 76, 'rgba(10,8,18,0.95)', L ? '#5dff7a' : i === coop.codigo.length && Math.floor(t * 2) % 2 ? '#ffffff' : '#3a3150');
      if (L) textoCentro(L, x, 176, 44, '#5dff7a');
    }
    if (coop.msg) textoCentro(coop.msg.txt, LARGURA / 2, 250, 16, coop.msg.cor, false);
    if (E === 'entrar') {
      for (let i = 0; i < LETRAS_SALA.length; i++) {
        const r = retLetraSala(i);
        painel(r.x, r.y, r.w, r.h, dentro(r) ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', dentro(r) ? '#ffffff' : '#3a3150');
        textoCentro(LETRAS_SALA[i], r.x + r.w / 2, r.y + r.h / 2, 24, '#eee');
      }
      botao(BOTOES_COOP.apagar, 'Apagar', '#ddd', undefined, 'voltar');
      botao(BOTOES_COOP.seguinte, 'Seguinte', coop.codigo.length === 4 ? '#5dff7a' : '#555', undefined, 'jogar');
    }
  } else if (E === 'classe') {
    textoCentro(`Escolhe o teu caçador (sala ${coop.codigo})`, LARGURA / 2, 110, 18, '#ccc', false);
    textoCentro('(o Caçador das Sombras é só para quem cria a sala)', LARGURA / 2, 138, 12, '#888', false);
    CLASSES_CONVIDADO.forEach((id, i) => desenharCartaoClasse(retClasseCoop(i), id, coop.classeConvidado === id));
    botao(BOTOES_COOP.entrarJogo, 'Entrar no jogo', '#5dff7a', undefined, 'jogar');
  }
}
