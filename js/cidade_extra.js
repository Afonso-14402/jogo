'use strict';
// =====================================================================
//  CIDADE: MAIS COISAS
//  - Casa decorável: móveis comprados com almas (Loja do Altar das Almas);
//    cada móvel dá +1% de XP para sempre. Na Casa: "Ver a tua casa por dentro"
//  - Arena da cidade: 3 ondas de monstros que dão almas (uma vez por visita;
//    se perderes, voltas à cidade sem morrer)
//  - Minijogos: pesca no Porto Gelado e corrida de sapos na Aldeia das Palafitas
// =====================================================================

// ---------------------------------------------------------------------
//  Móveis
// ---------------------------------------------------------------------
const MOVEIS = [
  { id: 'cama', nome: 'Cama Quentinha', preco: 40, cor: '#c84a4a' },
  { id: 'tapete', nome: 'Tapete Real', preco: 30, cor: '#b44dff' },
  { id: 'planta', nome: 'Vaso com Planta', preco: 20, cor: '#5dff7a' },
  { id: 'estante', nome: 'Estante de Livros', preco: 50, cor: '#a07040' },
  { id: 'lareira', nome: 'Lareira', preco: 60, cor: '#ff7b25' },
  { id: 'armas', nome: 'Suporte de Armas', preco: 70, cor: '#c0c8d8' },
  { id: 'quadro', nome: 'Quadro do Herói', preco: 50, cor: '#ffd23f' },
  { id: 'aquario', nome: 'Aquário', preco: 80, cor: '#4dc3ff' },
];
for (const M of MOVEIS) LOJA_ALMAS.push({ id: 'movel_' + M.id, tipo: 'movel', nome: `Móvel: ${M.nome}`, desc: '+1% XP para sempre (fica na tua casa)', preco: M.preco, cor: M.cor, movel: M.id });
const moveisComprados = () => MOVEIS.filter(M => comprado('movel_' + M.id));
const bonusMoveis = () => 0.01 * moveisComprados().length;

// Interior da casa (no painel da Casa)
function desenharInteriorCasa(t) {
  const X = 120, Y = 226, W = 720, H = 300, chao = Y + 130;
  // parede de tábuas e rodapé
  for (let x = 0; x < W; x += 24) { px(X + x, Y, 24, 130, (x / 24) % 2 ? '#6a4c32' : '#5e4430'); px(X + x, Y, 2, 130, '#4a3424'); }
  for (let y = 18; y < 130; y += 36) for (let x = 0; x < W; x += 24) px(X + x + 10, Y + y, 4, 4, '#4a3424');
  px(X, chao - 10, W, 10, '#3a2618');
  // chão de madeira
  for (let y = chao; y < Y + H; y += 14) for (let x = -(y % 28); x < W; x += 56) px(X + Math.max(0, x), y, Math.min(56, W - Math.max(0, x)) - 2, 12, ((x + y) / 14) % 2 ? '#9a7048' : '#8a6440');
  // janela com cortinas e noite lá fora
  px(X + 290, Y + 24, 92, 70, '#1a2a4a'); px(X + 290, Y + 24, 92, 6, '#0a0810');
  for (let k = 0; k < 6; k++) px(X + 300 + (k * 13) % 76, Y + 36 + (k * 9) % 40, 3, 3, '#fff6c8');
  px(X + 334, Y + 24, 4, 70, '#5e4430'); px(X + 290, Y + 56, 92, 4, '#5e4430');
  px(X + 280, Y + 18, 112, 8, '#3a2618');
  px(X + 278, Y + 24, 16, 76, '#a02828'); px(X + 378, Y + 24, 16, 76, '#a02828');
  // prateleira dos troféus
  px(X + 430, Y + 92, 260, 8, '#3a2618'); px(X + 440, Y + 100, 8, 14, '#3a2618'); px(X + 672, Y + 100, 8, 14, '#3a2618');
  BOSSES.slice(0, 8).forEach((b, i) => {
    const c = SPR[b.id] && SPR[b.id][0];
    if (c && meta.trofeus && meta.trofeus[b.id]) sprEcra(c, X + 456 + i * 31, Y + 76, Math.max(1, Math.floor(26 / Math.max(c.width, c.height))));
  });
  const M = ART.moveis, tem = id => comprado('movel_' + id);
  if (tem('quadro')) sprEcra(M.quadro, X + 150, Y + 60, 4);
  if (tem('estante')) sprEcra(M.estante, X + 220, chao - 44, 4);
  if (tem('lareira')) sprEcra(M.lareira[Math.floor(t * 6) % 2], X + 530, chao - 30, 4);
  if (tem('armas')) sprEcra(M.armas, X + 650, chao - 30, 4);
  if (tem('tapete')) sprEcra(M.tapete, X + 380, chao + 70, 4);
  if (tem('cama')) sprEcra(M.cama, X + 110, chao + 70, 4);
  if (tem('planta')) sprEcra(M.planta, X + 44, chao + 6, 4);
  if (tem('aquario')) sprEcra(M.aquario, X + 620, chao + 100, 4);
  // o herói em casa
  sprEcra(framesHeroi(J.raca, J.skin)[Math.floor(t * 2) % 2 ? 0 : 1], X + 380, chao + 40, 4);
  const n = moveisComprados().length;
  if (!n) { painel(X + 160, Y + H - 40, 400, 30, 'rgba(14,11,22,0.9)', '#ffe680'); textoCentro('A casa está vazia. Compra móveis na Loja do Altar das Almas!', X + W / 2, Y + H - 25, 13, '#ffe680'); }
  else { painel(X + 230, Y + H - 34, 260, 26, 'rgba(14,11,22,0.9)', '#ffe680'); textoCentro(`${n}/${MOVEIS.length} móveis · +${n}% XP para sempre`, X + W / 2, Y + H - 21, 13, '#ffe680'); }
}

// ---------------------------------------------------------------------
//  Arena da cidade
// ---------------------------------------------------------------------
const ONDAS_ARENA = 3;
const almasOndaArena = () => 2 + Math.floor(andar / 6);

function entrarArena() {
  if (J.remoto) { texto(J.x, J.y - 30, 'Só quem criou a sala pode abrir a arena', '#aaaaaa', 13); return; }
  if (J.visitaCidade && J.visitaCidade.arena) { texto(J.x, J.y - 30, 'Já lutaste na arena nesta visita', '#aaaaaa', 14); return; }
  if (J.visitaCidade) J.visitaCidade.arena = true;
  guardaAndar = { mapa, mapaImg, inimigos, baus, drops, objetos, armadilhas, x: J.x, y: J.y, arena: true };
  mapa = gerarArenaBoss();
  mapa.eBoss = false;
  mapa.escada = { x: -9999, y: -9999, ativa: false };
  mapa.arena = { onda: 0, espera: 1.5, feito: false, almas: 0 };
  mapaImg = renderizarMapa(mapa, andar + 1);
  inimigos = []; projeteis = []; baus = []; drops = []; perigos = []; objetos = []; armadilhas = []; ondas = []; raios = [];
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = mapa.inicio.x; J.y = mapa.inicio.y; J.invuln = 1.5;
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  levantarExercito();
  criarPetEntidade();
  mostrarBanner('ARENA DA CIDADE', `Sobrevive a ${ONDAS_ARENA} ondas · cada onda dá ${almasOndaArena()} almas`, '#ff8080');
  fanfarra([392, 523, 659], 0.04);
}

function atualizarArena(dt) {
  if (!mapa || !mapa.arena || mapa.arena.feito) return;
  const A = mapa.arena;
  if (inimigos.some(e => !e.morto)) return;
  if (A.onda > 0 && !A.pago) { // acabou uma onda
    A.pago = true;
    const q = almasOndaArena();
    meta.almas += q; A.almas += q; salvarMeta();
    texto(J.x, J.y - 40, `+${q} almas`, '#b48cff', 18);
  }
  A.espera -= dt;
  if (A.espera > 0) return;
  if (A.onda >= ONDAS_ARENA) { // venceste
    A.feito = true;
    const ouro = Math.round(30 + andar * 8);
    soltarOuro(J.x, J.y - 30, ouro, 8);
    objetos.push({ tipo: 'saidaArena', x: mapa.inicio.x, y: mapa.inicio.y - 60, t: 0 });
    mostrarBanner('VENCESTE A ARENA!', `${A.almas} almas e ouro · usa o portal para voltar à cidade`, '#ffe14d');
    fanfarra([523, 659, 784, 1046, 1318], 0.05);
    contar('arenas');
    return;
  }
  A.onda++; A.pago = false; A.espera = 1.8;
  const pesos = pesosInimigos(), n = 4 + A.onda * 3;
  for (let k = 0; k < n; k++) {
    let p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
    for (let t = 0; t < 6 && Math.hypot(p.x - J.x, p.y - J.y) < 200; t++) p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
    const e = criarInimigo(escolherPeso(pesos), p.x, p.y);
    aplicarNivel(e, A.onda === ONDAS_ARENA && k === 0 ? 3 : sortearNivel());
    e.acordado = true; e.xp = Math.round(e.xp * 0.5); // na arena dá menos XP (o prémio são as almas)
    inimigos.push(e);
    explosao(p.x, p.y, '#ff8080', 8, 100);
  }
  mostrarBanner(`ONDA ${A.onda}/${ONDAS_ARENA}`, '', '#ff8080');
}

// Se o herói cair na arena, volta à cidade com pouca vida (chamado pelo danoJogador)
function perdeuNaArena() {
  if (!mapa || !mapa.arena) return false;
  J.hp = Math.max(1, Math.round(S.maxHp * 0.2));
  J.invuln = 2;
  sairArena();
  mostrarBanner('Perdeste na arena', 'Voltas à cidade (podes descansar na tua casa)', '#ff8080');
  return true;
}

function sairArena() {
  const g = guardaAndar;
  if (!g || !g.arena) return;
  mapa = g.mapa; mapaImg = g.mapaImg; inimigos = g.inimigos; baus = g.baus; drops = g.drops; objetos = g.objetos; armadilhas = g.armadilhas;
  projeteis = []; perigos = []; ondas = []; raios = [];
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = g.x; J.y = g.y + 30; J.invuln = Math.max(J.invuln, 1);
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  levantarExercito();
  criarPetEntidade();
  guardaAndar = null;
}

function desenharArena(o, t) {
  sombra(o.x, o.y + 18, 36);
  spr(ART.arena, o.x, o.y - 10);
  if (Math.random() < 0.04) particulas.push({ x: o.x + rand(-20, 20), y: o.y - 30, vx: 0, vy: -20, t: 0.6, cor: '#ff8080', tam: 2 });
}
function desenharSaidaArena(o, t) { desenharPortal(Object.assign({}, o, { tipo: 'saidaPortal' }), t); } // igual à saída dos portais

// ---------------------------------------------------------------------
//  Minijogos
// ---------------------------------------------------------------------
let minijogo = null;
const PEIXES = [
  { nome: 'Peixe Prateado', cor: '#c0c8d8', peso: 5, premio: () => { const q = 10 + andar * 3; J.ouro += q; return `+${q} ouro`; } },
  { nome: 'Peixe Dourado', cor: '#ffd23f', peso: 2, premio: () => { meta.almas += 4; salvarMeta(); return '+4 almas'; } },
  { nome: 'Garrafa com Poção', cor: '#ff6b8a', peso: 2, premio: () => { J.pocoes++; return '+1 poção'; } },
  { nome: 'Bota Velha', cor: '#8a6a4a', peso: 3, premio: () => 'Nada... é só uma bota' },
];
const SAPOS = [
  { nome: 'Sapo Verde', cor: '#5dff7a', paga: 2, chance: 0.5 },
  { nome: 'Sapo Azul', cor: '#4dc3ff', paga: 3, chance: 0.33 },
  { nome: 'Sapo Dourado', cor: '#ffd23f', paga: 5, chance: 0.17 },
];
const apostaSapos = () => 20 + andar * 3;
const BOTAO_SAIR_MINIJOGO = { x: 380, y: 530, w: 200, h: 40 };
const retSapo = i => ({ x: 150 + i * 226, y: 362, w: 210, h: 64 });

function abrirMinijogo(tipo) {
  if (J.remoto) { texto(J.x, J.y - 30, 'Só quem criou a sala pode jogar aqui', '#aaaaaa', 13); return; }
  const V = J.visitaCidade || (J.visitaCidade = {});
  if (tipo === 'pesca') {
    if (V.pesca) { texto(J.x, J.y - 30, 'Já pescaste nesta visita', '#aaaaaa', 14); return; }
    V.pesca = true;
    minijogo = { tipo, t: 0, pos: 0, dir: 1, vel: 0.9, zona: rand(0.2, 0.8), larg: 0.16, tentativas: 3, msg: null, apanhados: [] };
  } else {
    if ((V.sapos || 0) >= 3) { texto(J.x, J.y - 30, 'Já fizeste 3 corridas nesta visita', '#aaaaaa', 14); return; }
    minijogo = { tipo, t: 0, fase: 'aposta', pos: [0, 0, 0], escolha: -1, vencedor: -1, msg: null };
  }
  estado = 'minijogo';
  som(600, 0.1, 'triangle', 0.03, 200);
}

function atualizarMinijogo(dt) {
  const M = minijogo;
  M.t += dt;
  if (M.msg) { M.msg.t -= dt; if (M.msg.t <= 0) M.msg = null; }
  if (M.ultimoT > 0) M.ultimoT -= dt;
  const sair = () => { estado = 'jogo'; minijogo = null; rato.baixo = false; };
  if (M.t < 0.2) return;
  if (premiu('escape') || clicou(BOTAO_SAIR_MINIJOGO)) { if (M.tipo !== 'sapos' || M.fase !== 'corrida') sair(); return; }
  if (M.tipo === 'pesca') {
    if (M.tentativas > 0) {
      M.pos += M.dir * M.vel * dt;
      if (M.pos > 1) { M.pos = 1; M.dir = -1; } else if (M.pos < 0) { M.pos = 0; M.dir = 1; }
    }
    if (premiu('e', ' ', 'enter', 'rato') && M.tentativas > 0) {
      M.tentativas--;
      if (Math.abs(M.pos - M.zona) < M.larg / 2) {
        const P = PEIXES[escolherPeso(Object.fromEntries(PEIXES.map((p, i) => [i, p.peso])))];
        const r = P.premio();
        M.apanhados.push(P);
        M.ultimo = P; M.ultimoT = 1.6;
        M.msg = { txt: `${traduzir(P.nome)}! ${traduzir(r)}`, cor: P.cor, t: 2.5 };
        fanfarra([659, 784, 988], 0.04);
      } else { M.msg = { txt: 'Fugiu! Carrega quando a marca estiver na zona verde', cor: '#ff8080', t: 2.5 }; som(200, 0.2, 'square', 0.03); }
      M.zona = rand(0.2, 0.8); M.vel += 0.25; M.larg = Math.max(0.08, M.larg - 0.02);
    }
    return;
  }
  // corrida de sapos
  if (M.fase === 'aposta') {
    let i = -1;
    SAPOS.forEach((s, k) => { if (premiu(String(k + 1)) || clicou(retSapo(k))) i = k; });
    if (i < 0) return;
    const a = apostaSapos();
    if (J.ouro < a) { M.msg = { txt: `Precisas de ${a} ouro para apostar`, cor: '#ff8080', t: 2.5 }; som(140, 0.2, 'square', 0.04); return; }
    J.ouro -= a;
    J.visitaCidade.sapos = (J.visitaCidade.sapos || 0) + 1;
    M.escolha = i; M.fase = 'corrida'; M.pos = [0, 0, 0];
    const r = Math.random();
    M.vencedor = r < SAPOS[0].chance ? 0 : r < SAPOS[0].chance + SAPOS[1].chance ? 1 : 2;
    som(500, 0.1, 'triangle', 0.03, 300);
  } else if (M.fase === 'corrida') {
    for (let k = 0; k < 3; k++) {
      const salto = (Math.sin(M.t * 9 + k * 2) > 0.6 ? 1 : 0) * dt * (k === M.vencedor ? 0.42 : 0.36 + 0.03 * Math.sin(M.t + k));
      M.pos[k] = Math.min(1, M.pos[k] + salto + dt * 0.04);
    }
    if (M.pos[M.vencedor] >= 1) {
      M.fase = 'fim';
      if (M.vencedor === M.escolha) {
        const g = apostaSapos() * SAPOS[M.escolha].paga;
        J.ouro += g;
        M.msg = { txt: `O teu sapo ganhou! +${g} ouro`, cor: '#5dff7a', t: 99 };
        fanfarra([523, 659, 784, 1046], 0.05);
      } else { M.msg = { txt: `Ganhou o ${traduzir(SAPOS[M.vencedor].nome)}. Fica para a próxima!`, cor: '#ff8080', t: 99 }; som(180, 0.3, 'sawtooth', 0.03, -40); }
    }
  } else if (premiu('e', ' ', 'enter', 'rato')) {
    if ((J.visitaCidade.sapos || 0) >= 3) sair();
    else { M.fase = 'aposta'; M.msg = null; }
  }
}

// Pixels grandes no ecrã (para os cenários dos minijogos e da casa)
const px = (x, y, w, h, cor) => { ctx.fillStyle = cor; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

function cenarioPesca(t, M) {
  const X = 130, Y = 200, W = 700;
  // céu e montanhas de gelo
  px(X, Y, W, 60, '#2a3a6a'); px(X, Y + 20, W, 40, '#34487a');
  for (let k = 0; k < 7; k++) { const mx = X + 40 + k * 100, mh = 26 + (k * 17) % 22; for (let r = 0; r < mh; r += 3) px(mx - r, Y + 60 - mh + r, r * 2 + 6, 3, r < 6 ? '#e8f4ff' : '#9ab0d8'); }
  // água com ondas
  for (let r = 0; r < 110; r += 6) px(X, Y + 60 + r, W, 6, r % 12 ? '#1e4a7a' : '#22568a');
  for (let k = 0; k < 14; k++) { const wx = X + ((k * 83 + t * (20 + k % 3 * 8)) % W); px(wx, Y + 74 + (k % 5) * 18, 18, 3, '#6ab0e0'); }
  // cais e o herói a pescar
  sprEcra(ART.cais, X + 110, Y + 92, 4);
  const h = framesHeroi(J.raca, J.skin)[0];
  sprEcra(h, X + 92, Y + 58, 4);
  // linha e bóia (afunda quando o peixe está na zona verde)
  const naZona = Math.abs(M.pos - M.zona) < M.larg / 2 && M.tentativas > 0;
  const bx = X + 300, by = Y + 92 + (naZona ? 8 : Math.sin(t * 3) * 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X + 200, Y + 20); ctx.quadraticCurveTo(X + 260, Y + 34, bx, by); ctx.stroke();
  px(bx - 6, by - 6, 12, 6, '#ffffff'); px(bx - 6, by, 12, 6, '#ff4040');
  if (naZona) { ctx.globalAlpha = 0.6; aro(bx, by + 4, 14 + Math.sin(t * 12) * 3, '#bfe6ff', 2); ctx.globalAlpha = 1; }
  // peixe apanhado: salta da água
  if (M.ultimo && M.ultimoT > 0) {
    const k = 1 - M.ultimoT / 1.6, fy = Y + 80 - Math.sin(k * Math.PI) * 90;
    sprEcra(ART.peixes[M.ultimo.nome], X + 320, fy, 5);
  }
}

function desenharMinijogo(t) {
  const M = minijogo;
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  const cor = M.tipo === 'pesca' ? '#9fdcff' : '#5dff7a';
  painel(100, 96, 760, 490, 'rgba(14,11,22,0.97)', cor);
  if (M.tipo === 'pesca') {
    textoCentro('PESCA NO PORTO GELADO', LARGURA / 2, 132, 28, '#9fdcff');
    textoCentro('Carrega quando o peixe estiver na zona verde', LARGURA / 2, 168, 14, '#ccc', false);
    cenarioPesca(t, M);
    // barra: o peixe nada de um lado para o outro
    const bx = 170, by = 396, bw = 620;
    px(bx - 6, by - 6, bw + 12, 38, '#0a0810'); px(bx - 3, by - 3, bw + 6, 32, '#3a3150');
    px(bx, by, bw, 26, '#1a2a4a');
    for (let k = 0; k < bw; k += 20) px(bx + k, by + 11, 10, 3, '#24406a');
    const zx = bx + (M.zona - M.larg / 2) * bw, zw = M.larg * bw;
    px(zx, by, zw, 26, '#2a9a5a'); px(zx, by, zw, 6, '#5dff9a'); px(zx, by + 20, zw, 6, '#1f7a44');
    if (M.tentativas > 0) sprEcra(ART.peixes['Peixe Prateado'], bx + M.pos * bw, by + 13, 3, true);
    // iscos que faltam e peixes apanhados
    textoEsq('Iscos:', 170, 458, 15, '#ffe680');
    for (let k = 0; k < 3; k++) { const ok = k < M.tentativas; px(240 + k * 26, 450, 14, 14, ok ? '#ff8fa0' : '#3a3150'); px(244 + k * 26, 446, 6, 6, ok ? '#ff5a7a' : '#2a2438'); }
    textoEsq('Apanhados:', 360, 458, 15, '#9fdcff');
    M.apanhados.forEach((P, i) => sprEcra(ART.peixes[P.nome], 490 + i * 56, 458, 3));
    if (M.tentativas <= 0 && !M.msg) textoCentro('Acabou! Volta na próxima cidade.', LARGURA / 2, 496, 15, '#aaa');
  } else {
    textoCentro('CORRIDA DE SAPOS', LARGURA / 2, 132, 28, '#5dff7a');
    textoCentro(M.fase === 'aposta' ? `Escolhe o teu sapo · aposta: ${apostaSapos()} ouro (tens ${J.ouro})` : M.fase === 'corrida' ? 'Força, sapinho!' : (modoToque ? 'Toca para continuar' : 'E: continuar'), LARGURA / 2, 168, 14, '#ccc', false);
    // pista: 3 pistas de relva, partida e meta aos quadrados
    const X = 140, Y = 190, W = 680;
    for (let k = 0; k < 3; k++) {
      const y = Y + k * 52;
      px(X, y, W, 48, k % 2 ? '#3e6a2c' : '#4a7a34');
      for (let q = 0; q < W; q += 24) px(X + q + (k * 7) % 12, y + 8 + (q % 3) * 10, 4, 6, '#5aaa3a');
      px(X + 30, y, 4, 48, '#e8e2cf');
      for (let q = 0; q < 6; q++) for (let r = 0; r < 2; r++) px(X + W - 40 + r * 8, y + q * 8, 8, 8, (q + r) % 2 ? '#ffffff' : '#1a1424');
      textoCentro(`${k + 1}`, X + 14, y + 24, 16, '#e8e2cf');
      const fx = X + 50 + M.pos[k] * (W - 110), pulo = M.fase === 'corrida' ? Math.abs(Math.sin(M.t * 9 + k * 2)) * 10 : 0;
      sprEcra(ART.sapos[k][M.fase === 'corrida' && pulo > 5 ? 1 : 0], fx, y + 26 - pulo, 3);
      if (M.escolha === k) { textoCentro('A tua aposta', fx, y + 4 - pulo, 11, '#ffe680'); }
    }
    sprEcra(ART.bandeira, X + W - 20, Y - 6, 3);
    SAPOS.forEach((sp, k) => {
      const r = retSapo(k), sel = M.escolha === k, sobre = M.fase === 'aposta' && dentro(r);
      painel(r.x, r.y, r.w, r.h, sel ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sobre ? '#ffffff' : sp.cor);
      sprEcra(ART.sapos[k][0], r.x + 30, r.y + r.h / 2, 3);
      textoEsqAjustado(`${k + 1}. ${traduzir(sp.nome)}`, r.x + 60, r.y + 20, 14, sp.cor, r.w - 66);
      textoEsq(`paga x${sp.paga}`, r.x + 60, r.y + 42, 12, '#ccc', 'normal');
    });
    textoCentro(`Corridas nesta visita: ${J.visitaCidade.sapos || 0}/3`, LARGURA / 2, 470, 12, '#888', false);
  }
  if (M.msg) textoCentroAjustado(M.msg.txt, LARGURA / 2, 500, 17, M.msg.cor, 700);
  if (!(M.tipo === 'sapos' && M.fase === 'corrida')) botao(BOTAO_SAIR_MINIJOGO, 'Sair', '#ff8080');
}

// objetos da cidade (arena e minijogos) e desenho
function objetosCidadeExtra(m) {
  const l = [{ tipo: 'arena', x: 38.5 * TILE, y: 15.5 * TILE, t: 0 }];
  if (m.tema && m.tema.minijogo) l.push({ tipo: m.tema.minijogo, x: 9.5 * TILE, y: 20.5 * TILE, t: 0 });
  return l;
}
function desenharObjetoCidadeExtra(o, t) {
  if (o.tipo === 'arena') { desenharArena(o, t); return true; }
  if (o.tipo === 'saidaArena') { desenharSaidaArena(o, t); return true; }
  if (o.tipo === 'pesca') { // cais com cana de pesca e a bóia a balançar
    spr(ART.lago, o.x + 8, o.y + 12);
    spr(ART.cais, o.x, o.y - 4);
    const bx = o.x + 22, by = o.y + 14 + Math.sin(t * 3) * 2;
    ctx.fillStyle = '#e8f4ff'; // a linha da cana até à bóia
    for (let k = 0; k <= 1; k += 1 / 14) ctx.fillRect(alinhar(o.x + 17 + (bx - o.x - 17) * k), alinhar(o.y - 18 + (by - 4 - o.y + 18) * k), 2, 2);
    ctx.fillStyle = '#ff5050'; ctx.fillRect(alinhar(bx - 2), alinhar(by - 2), 4, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(alinhar(bx - 2), alinhar(by - 4), 4, 2);
    return true;
  }
  if (o.tipo === 'sapos') { // placa da corrida e a pista
    sombra(o.x, o.y + 14, 28);
    spr(ART.pistaSapos, o.x, o.y - 6);
    spr(ART.sapos[0][Math.floor(t * 3) % 2], o.x - 10 + Math.round(Math.abs(Math.sin(t * 1.5)) * 10), o.y + 4);
    return true;
  }
  return false;
}
function desenharInfoCidadeExtra(o, sx, sy) {
  const usar = modoToque ? 'Usar' : '[E]';
  if (o.tipo === 'arena') { textoCentro('Arena da Cidade', sx, sy - 18, 15, '#ff8080'); textoCentro(`${usar}: Lutar (${ONDAS_ARENA} ondas, dá almas)`, sx, sy, 14, '#ffe680'); return true; }
  if (o.tipo === 'saidaArena') { textoCentro(`${usar}: Voltar à cidade`, sx, sy, 15, '#4dc3ff'); return true; }
  if (o.tipo === 'pesca') { textoCentro('Cais de pesca', sx, sy - 18, 15, '#9fdcff'); textoCentro(`${usar}: Pescar`, sx, sy, 14, '#ffe680'); return true; }
  if (o.tipo === 'sapos') { textoCentro('Corrida de sapos', sx, sy - 18, 15, '#5dff7a'); textoCentro(`${usar}: Apostar ouro`, sx, sy, 14, '#ffe680'); return true; }
  return false;
}
function usarObjetoCidadeExtra(o) {
  if (o.tipo === 'arena') { entrarArena(); return true; }
  if (o.tipo === 'saidaArena') { sairArena(); return true; }
  if (o.tipo === 'pesca' || o.tipo === 'sapos') { abrirMinijogo(o.tipo); return true; }
  return false;
}
