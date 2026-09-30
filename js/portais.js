'use strict';
// =====================================================================
//  PORTAIS (Gates): dentro das masmorras aparecem portais de rank
//  E, D, C, B, A, S, SS ou SSS. Entras, derrotas as ondas de monstros e o
//  boss do portal e ganhas prémios melhores quanto maior o rank.
//  Um Portal Maldito fecha-se atrás de ti: só sais depois de matar o boss.
// =====================================================================

const RANKS_PORTAL = [
  { letra: 'E',   cor: '#9a9aa8', boss: 'reiSlime' },
  { letra: 'D',   cor: '#5dff7a', boss: 'lich' },
  { letra: 'C',   cor: '#4dc3ff', boss: 'dragao' },
  { letra: 'B',   cor: '#b48cff', boss: 'golem' },
  { letra: 'A',   cor: '#ffae00', boss: 'rainha' },
  { letra: 'S',   cor: '#ff3b3b', boss: 'demonio' },
  { letra: 'SS',  cor: '#ff4dff', boss: 'guardiao' },
  { letra: 'SSS', cor: '#ffe14d', boss: 'senhorVazio' },
];

// Índice do rank "normal" para o andar (E=0 ... S=5)
const rankIndiceAndar = a => Math.min(5, RANKS.findIndex(r => a <= r.ate));

// O rank não depende do andar: um portal SSS pode abrir logo no andar 1.
// Entras em qualquer um... e se morreres, morreste.
function sortearRankPortal() {
  return Number(escolherPeso({ 0: 18, 1: 17, 2: 16, 3: 14, 4: 12, 5: 10, 6: 7, 7: 6 }));
}

// Força dos monstros do portal em relação ao andar
const multPortal = gi => Math.max(0.6, Math.pow(1.4, gi - rankIndiceAndar(andar)));
// Tempo até à Rutura do Portal se ninguém o fechar
const TEMPO_RUTURA = 180;

// Em todos os andares abre pelo menos um portal (às vezes dois)
function criarPortalNoAndar(salas) {
  const livres = salas.filter(s => !s.tipo && s !== mapa.salaEscada && !s.oculto);
  const n = Math.random() < 0.25 ? 2 : 1;
  for (let k = 0; k < n && livres.length; k++) {
    const s = livres.splice(randInt(0, livres.length - 1), 1)[0];
    const p = pontoLivreNaSala(mapa, s, 24, 1);
    const gi = sortearRankPortal();
    objetos.push({ tipo: 'portal', gi, vermelho: gi >= 3 && Math.random() < 0.18, x: p.x, y: p.y, t: 0, rutura: TEMPO_RUTURA + k * 60 });
  }
  const ps = objetos.filter(o => o.tipo === 'portal');
  if (ps.length) {
    mapa.avisoPortal = `Sentes ${ps.length > 1 ? 'portais' : 'um portal'}: Rank ${ps.map(o => RANKS_PORTAL[o.gi].letra).join(' e ')} (vê o minimapa)`;
  }
}

// Rutura do Portal: se não entrares a tempo, os monstros saem para a masmorra
function romperPortal(o) {
  objetos = objetos.filter(x => x !== o);
  const mult = multPortal(o.gi), pesos = pesosInimigos();
  for (let k = 0; k < 3 + o.gi; k++) {
    const a = k / (3 + o.gi) * Math.PI * 2;
    let x = o.x + Math.cos(a) * 40, y = o.y + Math.sin(a) * 40;
    if (colideCirculo(mapa, x, y, 14)) { x = o.x; y = o.y; }
    const e = criarInimigo(escolherPeso(pesos), x, y);
    aplicarNivel(e, Math.min(3, 1 + Math.floor(o.gi / 3)));
    e.hp = e.maxHp = Math.round(e.maxHp * mult);
    e.dano = Math.round(e.dano * Math.pow(mult, 0.7));
    e.acordado = true;
    if (o.gi >= 4) tornarElite(e);
    inimigos.push(e);
  }
  explosao(o.x, o.y, RANKS_PORTAL[o.gi].cor, 50, 300, 6);
  mostrarBanner('RUTURA DO PORTAL!', `Os monstros do portal Rank ${RANKS_PORTAL[o.gi].letra} saíram para a masmorra`, '#ff3b3b');
  tremor = 18;
  som(50, 1.2, 'sawtooth', 0.07, -20);
}

// ---------------------------------------------------------------------
//  Entrar e sair
// ---------------------------------------------------------------------
let guardaAndar = null;

function entrarPortal(o) {
  const R = RANKS_PORTAL[o.gi];
  guardaAndar = { mapa, mapaImg, inimigos, baus, drops, objetos, armadilhas, x: J.x, y: J.y, portal: o };
  objetos = objetos.filter(x => x !== o); // o portal fecha-se depois de entrares
  guardaAndar.objetos = objetos;
  mapa = gerarArenaBoss();
  mapa.escada = { x: -9999, y: -9999, ativa: false };
  mapa.portal = { gi: o.gi, vermelho: o.vermelho, onda: 0, fase: 'ondas', mult: multPortal(o.gi) };
  mapaImg = renderizarMapa(mapa, andar);
  inimigos = []; projeteis = []; baus = []; drops = []; perigos = []; objetos = []; armadilhas = []; ondas = []; raios = [];
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = mapa.inicio.x; J.y = mapa.inicio.y; J.invuln = 1.5;
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  levantarExercito();
  criarPetEntidade();
  if (!o.vermelho) objetos.push({ tipo: 'saidaPortal', x: J.x + 70, y: J.y, t: 0 });
  mostrarBanner(`PORTAL RANK ${R.letra}`, o.vermelho ? 'PORTAL MALDITO! Não há saída até matares o boss' : 'Derrota as ondas e o boss do portal', o.vermelho ? '#ff3b3b' : R.cor);
  tremor = 10;
  som(60, 1, 'sawtooth', 0.06, 200);
  lancarOndaPortal();
  registar('portal');
}

function sairPortal() {
  const g = guardaAndar;
  if (!g) return;
  mapa = g.mapa; mapaImg = g.mapaImg; inimigos = g.inimigos; baus = g.baus; drops = g.drops; objetos = g.objetos; armadilhas = g.armadilhas;
  projeteis = []; perigos = []; ondas = []; raios = [];
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = g.x; J.y = g.y; J.invuln = 1;
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  levantarExercito();
  criarPetEntidade();
  guardaAndar = null;
  mostrarBanner(`ANDAR ${andar}`, 'Voltaste à masmorra', '#ffffff');
  som(300, 0.4, 'triangle', 0.05, -150);
}

// ---------------------------------------------------------------------
//  Ondas e boss do portal
// ---------------------------------------------------------------------
function lancarOndaPortal() {
  const P = mapa.portal;
  P.onda++;
  const pesos = pesosInimigos();
  const n = 4 + P.gi + P.onda * 2;
  for (let k = 0; k < n; k++) {
    let p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
    if (Math.hypot(p.x - J.x, p.y - J.y) < 120) p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
    const e = criarInimigo(escolherPeso(pesos), p.x, p.y);
    aplicarNivel(e, Math.min(3, 1 + Math.floor((P.gi + P.onda) / 3)));
    e.hp = e.maxHp = Math.round(e.maxHp * P.mult);
    e.dano = Math.round(e.dano * Math.pow(P.mult, 0.7));
    e.acordado = true;
    if (P.gi >= 4 && Math.random() < 0.2) tornarElite(e);
    inimigos.push(e);
    explosao(p.x, p.y, RANKS_PORTAL[P.gi].cor, 10, 120);
  }
  mostrarBanner(`ONDA ${P.onda}/3`, 'Derrota todos os monstros', RANKS_PORTAL[P.gi].cor);
}

function atualizarPortal(dt) {
  for (const o of objetos) if (o.tipo === 'portal' || o.tipo === 'saidaPortal') o.t += dt;
  const aRomper = objetos.find(o => o.tipo === 'portal' && (o.rutura -= dt) <= 0);
  if (aRomper) romperPortal(aRomper);
  const P = mapa.portal;
  if (!P || P.fase === 'feito') return;
  if (inimigos.some(e => !e.morto)) return;
  if (P.fase === 'ondas') {
    if (P.onda < 3) lancarOndaPortal();
    else { // chega o boss do portal
      P.fase = 'boss';
      boss = criarBoss(RANKS_PORTAL[P.gi].boss, P.mult);
      inimigos.push(boss);
      viuMonstro(boss.tipo);
      mostrarBanner(`BOSS DO PORTAL ${RANKS_PORTAL[P.gi].letra}`, boss.nome, '#ff4d4d');
      som(80, 1.2, 'sawtooth', 0.06, -30);
    }
  }
}

// O boss do portal morreu: prémios conforme o rank
function bossPortalMorto(e) {
  const P = mapa.portal;
  P.fase = 'feito';
  registar('portalFeito');
  for (const o of inimigos) if (!o.morto && o !== e) { o.morto = true; explosao(o.x, o.y, o.cor, 10); }
  projeteis = []; perigos = [];
  const R = RANKS_PORTAL[P.gi], cx = mapa.posBoss.x, cy = mapa.posBoss.y + 60;
  const acima = P.gi - rankIndiceAndar(andar);
  const nBaus = 1 + (acima >= 1 ? 1 : 0) + (P.vermelho ? 1 : 0);
  for (let k = 0; k < nBaus; k++) baus.push({ x: cx + (k - (nBaus - 1) / 2) * 70, y: cy, tipo: acima >= 0 || P.gi >= 5 ? 'ouro' : 'madeira', semMimico: true, t: 0 });
  soltarOuro(cx, cy + 50, Math.round(30 * (1 + P.gi) * (1 + (andar - 1) * 0.25)), 8);
  if (acima >= 1 || P.gi >= 5 || P.vermelho) soltarReliquia(cx, cy + 100);
  const almas = Math.round((3 + P.gi * 4) * (1 + calorAtual() * 0.1));
  meta.almas += almas;
  salvarMeta();
  J.pocoes++;
  objetos.push({ tipo: 'saidaPortal', x: cx, y: cy - 130, t: 0 });
  mostrarBanner(`PORTAL ${R.letra} CONQUISTADO!`, `+${almas} almas · abre os baús e sai pelo portal`, R.cor);
  fanfarra([392, 523, 659, 784, 1046, 1318], 0.05);
  tremor = 16;
  if (P.gi >= 5) desbloquear('portalS');
  if (P.gi >= 7) desbloquear('portalSSS');
  if (P.vermelho) desbloquear('portalVermelho');
}

// ---------------------------------------------------------------------
//  Desenho do portal
// ---------------------------------------------------------------------
function desenharPortal(o, t) {
  const R = RANKS_PORTAL[o.gi != null ? o.gi : 0];
  const cor = o.tipo === 'saidaPortal' ? '#4dc3ff' : o.vermelho ? '#ff2a2a' : R.cor;
  const tam = o.tipo === 'saidaPortal' ? 1 : 0.8 + (o.gi || 0) * 0.07;
  const rx = 22 * tam, ry = 34 * tam;
  sombra(o.x, o.y + ry, rx);
  for (let k = 4; k >= 0; k--) { // espiral de energia
    ctx.globalAlpha = 0.18 + k * 0.12;
    ctx.fillStyle = k % 2 ? cor : '#07060a';
    ctx.beginPath();
    ctx.ellipse(alinhar(o.x), alinhar(o.y), rx * (0.3 + k * 0.17) + Math.sin(t * 4 + k) * 2, ry * (0.3 + k * 0.17), Math.sin(t + k) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = cor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(alinhar(o.x), alinhar(o.y), rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (Math.random() < 0.3) particulas.push({ x: o.x + rand(-rx, rx), y: o.y + rand(-ry, ry), vx: 0, vy: -40, t: 0.5, cor, tam: 3 });
}

function desenharInfoPortal(o, sx, sy) {
  const usar = modoToque ? 'Usar' : '[E]';
  if (o.tipo === 'saidaPortal') {
    textoCentro(`${usar}: Sair do portal`, sx, sy - 8, 15, '#4dc3ff');
    return;
  }
  const R = RANKS_PORTAL[o.gi], mult = multPortal(o.gi);
  const perigo = mult >= 4 ? 'MORTAL' : mult >= 1.8 ? 'MUITO PERIGOSO' : mult >= 1.3 ? 'Perigoso' : mult <= 0.8 ? 'Fácil' : 'Normal';
  textoCentro(`${o.vermelho ? 'PORTAL MALDITO' : 'Portal'} Rank ${R.letra}`, sx, sy - 40, 18, o.vermelho ? '#ff3b3b' : R.cor);
  textoCentro(`${perigo} · monstros x${mult.toFixed(1)} · boss: ${BOSSES.find(b => b.id === R.boss).nome}`, sx, sy - 20, 12, '#ddd');
  textoCentro(`${usar}: Entrar   ·   Rutura em ${relogioPortal(o.rutura)}`, sx, sy, 15, '#ffe680');
}

const relogioPortal = t => `${Math.floor(Math.max(0, t) / 60)}:${String(Math.floor(Math.max(0, t) % 60)).padStart(2, '0')}`;

// O rank e o tempo até à rutura aparecem por cima do portal
function desenharLetraPortal(o) {
  if (o.tipo !== 'portal' || !explorado(o.x, o.y) || (J.objPerto === o && estado === 'jogo')) return; // ao pé dele já se vê a informação toda
  const R = RANKS_PORTAL[o.gi], y = ecraY(o.y) - 58 * (0.8 + o.gi * 0.07) * ZOOM;
  textoCentro(R.letra, ecraX(o.x), y, 18, o.vermelho ? '#ff3b3b' : R.cor);
  textoCentro(relogioPortal(o.rutura), ecraX(o.x), y - 18, 11, o.rutura < 30 ? '#ff4d4d' : '#ddd');
}
