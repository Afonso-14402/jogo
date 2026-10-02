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
// desenho pequeno de cada móvel (ícone da loja e dentro da casa)
function desenharMovel(id, x, y, k = 1) {
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a * k, y + b * k, w * k, h * k); };
  switch (id) {
    case 'cama': R(-18, -6, 36, 14, '#7a4a2a'); R(-16, -10, 32, 8, '#c84a4a'); R(-16, -12, 10, 6, '#f0e8d0'); R(-18, 8, 4, 4, '#5a3a1a'); R(14, 8, 4, 4, '#5a3a1a'); break;
    case 'tapete': R(-22, -6, 44, 14, '#b44dff'); R(-18, -3, 36, 8, '#ffcf3a'); R(-14, -1, 28, 4, '#b44dff'); break;
    case 'planta': R(-6, 0, 12, 10, '#a0603a'); R(-8, -10, 6, 10, '#3f8a34'); R(-1, -16, 6, 16, '#5dbb4a'); R(4, -8, 6, 8, '#3f8a34'); break;
    case 'estante': R(-14, -22, 28, 34, '#7a5230'); for (let i = 0; i < 3; i++) { R(-12, -20 + i * 11, 24, 2, '#5a3a1a'); for (let j = 0; j < 5; j++) R(-11 + j * 5, -18 + i * 11, 3, 7, ['#c84a4a', '#4dc3ff', '#5dff7a', '#ffd23f', '#b44dff'][(i + j) % 5]); } break;
    case 'lareira': R(-16, -18, 32, 30, '#6a6478'); R(-10, -6, 20, 18, '#1a1014'); R(-6, 0, 12, 10, Math.sin(tempoJogo * 9) > 0 ? '#ff7b25' : '#ffd23f'); R(-18, -20, 36, 4, '#8a8498'); break;
    case 'armas': R(-16, -18, 32, 4, '#5a3a1a'); R(-12, -16, 3, 28, '#c0c8d8'); R(-2, -16, 3, 28, '#c0c8d8'); R(8, -16, 3, 28, '#c0c8d8'); R(-14, -2, 7, 3, '#8a6a4a'); R(-4, -2, 7, 3, '#8a6a4a'); R(6, -2, 7, 3, '#8a6a4a'); break;
    case 'quadro': R(-14, -14, 28, 24, '#c99a2e'); R(-11, -11, 22, 18, '#2a3a5a'); R(-3, -7, 6, 8, '#f1c8a0'); R(-5, 1, 10, 6, '#3d7bd8'); break;
    case 'aquario': R(-16, -12, 32, 22, '#9fdcff'); R(-16, -12, 32, 3, '#e0f4ff'); R(-8, -4, 6, 4, '#ff9b45'); R(4, 2, 6, 4, '#ffd23f'); R(-16, 10, 32, 3, '#5a5468'); break;
  }
}
for (const M of MOVEIS) LOJA_ALMAS.push({ id: 'movel_' + M.id, tipo: 'movel', nome: `Móvel: ${M.nome}`, desc: '+1% XP para sempre (fica na tua casa)', preco: M.preco, cor: M.cor, movel: M.id });
const moveisComprados = () => MOVEIS.filter(M => comprado('movel_' + M.id));
const bonusMoveis = () => 0.01 * moveisComprados().length;

// Interior da casa (no painel da Casa)
function desenharInteriorCasa(t) {
  const x0 = 120, y0 = 226, w = 720, h = 300;
  ctx.fillStyle = '#5a4430'; ctx.fillRect(x0, y0, w, h * 0.45); // parede
  for (let i = 0; i < w; i += 40) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0 + i, y0, 2, h * 0.45); }
  ctx.fillStyle = '#8a6a48'; ctx.fillRect(x0, y0 + h * 0.45, w, h * 0.55); // chão
  for (let j = y0 + h * 0.45; j < y0 + h; j += 18) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, j, w, 2); }
  // janela
  ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x0 + 300, y0 + 30, 70, 56); ctx.fillStyle = '#5a4430'; ctx.fillRect(x0 + 333, y0 + 30, 4, 56); ctx.fillRect(x0 + 300, y0 + 56, 70, 4);
  // troféus dos bosses numa prateleira
  ctx.fillStyle = '#4a3020'; ctx.fillRect(x0 + 420, y0 + 92, 280, 6);
  BOSSES.slice(0, 8).forEach((b, i) => {
    const c = SPR[b.id] && SPR[b.id][0];
    if (c && meta.trofeus && meta.trofeus[b.id]) sprEcra(c, x0 + 440 + i * 34, y0 + 76, Math.max(1, Math.floor(26 / Math.max(c.width, c.height))));
  });
  const sitio = { cama: [120, 230], tapete: [360, 250], planta: [40, 200], estante: [220, 150], lareira: [520, 165], armas: [640, 160], quadro: [130, 80], aquario: [600, 255] };
  const tem = moveisComprados();
  for (const M of tem) { const [a, b] = sitio[M.id]; desenharMovel(M.id, x0 + a, y0 + b, 2); }
  if (!tem.length) textoCentro('A casa está vazia. Compra móveis na Loja do Altar das Almas!', x0 + w / 2, y0 + h - 30, 14, '#ffe680');
  else textoCentro(`${tem.length}/${MOVEIS.length} móveis · +${tem.length}% XP para sempre`, x0 + w / 2, y0 + h - 18, 13, '#ffe680');
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

function desenharArena(o, t) { // portão do coliseu
  const x = o.x, y = o.y;
  sombra(x, y + 18, 34);
  ctx.fillStyle = '#7a7068'; ctx.fillRect(x - 34, y - 46, 14, 62); ctx.fillRect(x + 20, y - 46, 14, 62);
  ctx.fillStyle = '#8a8078'; ctx.fillRect(x - 38, y - 54, 76, 12);
  ctx.fillStyle = '#1a1014'; ctx.fillRect(x - 20, y - 40, 40, 56);
  ctx.fillStyle = '#5a5468'; for (let k = -16; k <= 16; k += 8) ctx.fillRect(x + k - 1, y - 38, 3, 54);
  ctx.fillStyle = '#c03030'; ctx.fillRect(x - 32, y - 40, 10, 22); ctx.fillRect(x + 22, y - 40, 10, 22);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 29, y - 34, 4, 4); ctx.fillRect(x + 25, y - 34, 4, 4);
}
function desenharSaidaArena(o, t) {
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
  circulo(o.x, o.y, 26, '#4dc3ff');
  ctx.globalAlpha = 1;
  aro(o.x, o.y, 26 + Math.sin(t * 3) * 3, '#bfe6ff', 3);
}

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
const BOTAO_SAIR_MINIJOGO = { x: 380, y: 520, w: 200, h: 40 };
const retSapo = i => ({ x: 170 + i * 220, y: 380, w: 180, h: 60 });

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

function desenharMinijogo(t) {
  const M = minijogo;
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  painel(100, 110, 760, 470, 'rgba(14,11,22,0.97)', M.tipo === 'pesca' ? '#9fdcff' : '#5dff7a');
  if (M.tipo === 'pesca') {
    textoCentro('PESCA NO PORTO GELADO', LARGURA / 2, 150, 28, '#9fdcff');
    textoCentro('Carrega quando a marca estiver na zona verde', LARGURA / 2, 186, 14, '#ccc', false);
    // água
    ctx.fillStyle = '#1a3a5a'; ctx.fillRect(140, 220, 680, 120);
    for (let k = 0; k < 8; k++) { ctx.fillStyle = 'rgba(160,220,255,0.25)'; ctx.fillRect(150 + ((k * 97 + t * 40) % 660), 240 + (k % 3) * 30, 30, 3); }
    // barra
    const bx = 160, by = 370, bw = 640;
    ctx.fillStyle = '#2a2438'; ctx.fillRect(bx, by, bw, 26);
    ctx.fillStyle = '#3ddc84'; ctx.fillRect(bx + (M.zona - M.larg / 2) * bw, by, M.larg * bw, 26);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + M.pos * bw - 3, by - 8, 6, 42);
    textoCentro(`Tentativas: ${M.tentativas}`, LARGURA / 2, 432, 16, '#ffe680');
    M.apanhados.forEach((P, i) => { ctx.fillStyle = P.cor; ctx.fillRect(LARGURA / 2 - 60 + i * 44, 456, 30, 14); });
    if (M.tentativas <= 0 && !M.msg) textoCentro('Acabou! Volta na próxima cidade.', LARGURA / 2, 490, 15, '#aaa');
  } else {
    textoCentro('CORRIDA DE SAPOS', LARGURA / 2, 150, 28, '#5dff7a');
    textoCentro(M.fase === 'aposta' ? `Escolhe o teu sapo · aposta: ${apostaSapos()} ouro (tens ${J.ouro})` : M.fase === 'corrida' ? 'Força, sapinho!' : (modoToque ? 'Toca para continuar' : 'E: continuar'), LARGURA / 2, 186, 14, '#ccc', false);
    // pista
    for (let k = 0; k < 3; k++) {
      const y = 230 + k * 46;
      ctx.fillStyle = k % 2 ? '#3a5a2a' : '#44682f'; ctx.fillRect(140, y - 18, 680, 40);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(800, y - 18, 4, 40);
      const x = 160 + M.pos[k] * 630, salta = M.fase === 'corrida' ? Math.abs(Math.sin(M.t * 9 + k * 2)) * 8 : 0;
      ctx.fillStyle = SAPOS[k].cor; ctx.fillRect(x - 10, y - 8 - salta, 20, 14);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 6, y - 12 - salta, 4, 4); ctx.fillRect(x + 2, y - 12 - salta, 4, 4);
      if (M.escolha === k) textoEsq('(o teu)', 146, y + 2, 11, '#ffe680');
    }
    SAPOS.forEach((s, k) => {
      const r = retSapo(k);
      painel(r.x, r.y, r.w, r.h, M.escolha === k ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', M.fase === 'aposta' && dentro(r) ? '#ffffff' : s.cor);
      textoCentro(`${k + 1}. ${traduzir(s.nome)}`, r.x + r.w / 2, r.y + 20, 14, s.cor);
      textoCentro(`paga x${s.paga}`, r.x + r.w / 2, r.y + 42, 12, '#ccc', false);
    });
    textoCentro(`Corridas nesta visita: ${J.visitaCidade.sapos || 0}/3`, LARGURA / 2, 470, 12, '#888', false);
  }
  if (M.msg) textoCentroAjustado(M.msg.txt, LARGURA / 2, 494, 17, M.msg.cor, 700);
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
  if (o.tipo === 'pesca') { // cais com cana de pesca
    sombra(o.x, o.y + 14, 26);
    ctx.fillStyle = '#7a5230'; ctx.fillRect(o.x - 26, o.y - 4, 52, 14);
    ctx.fillStyle = '#5a3a1a'; for (let k = -22; k <= 22; k += 11) ctx.fillRect(o.x + k, o.y - 4, 2, 14);
    ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x - 10, o.y - 4); ctx.lineTo(o.x + 14, o.y - 34); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(o.x + 14, o.y - 34); ctx.lineTo(o.x + 18, o.y - 6 + Math.sin(t * 3) * 2); ctx.stroke();
    return true;
  }
  if (o.tipo === 'sapos') { // pista com bandeirinhas
    sombra(o.x, o.y + 14, 28);
    ctx.fillStyle = '#44682f'; ctx.fillRect(o.x - 30, o.y - 6, 60, 18);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x + 22, o.y - 6, 3, 18);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(o.x - 32, o.y - 30, 3, 36); ctx.fillRect(o.x + 30, o.y - 30, 3, 36);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#ff5050', '#ffd23f', '#4dc3ff'][k % 3]; ctx.fillRect(o.x - 30 + k * 10, o.y - 30 + (k % 2) * 2, 8, 6); }
    ctx.fillStyle = '#5dff7a'; ctx.fillRect(o.x - 12 + Math.abs(Math.sin(t * 3)) * 6, o.y - 2, 10, 7);
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
