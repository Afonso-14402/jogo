'use strict';
// =====================================================================
//  ANDARES ESPECIAIS E O DUENDE DOURADO
//  - Andar do Tesouro: muitos baús a mais... mas alguns são mímicos
//  - Andar Gelado: o chão escorrega (o herói desliza ao andar)
//  - (o Andar Escuro já existia nos eventos)
//  - Duende Dourado: às vezes aparece um duende dourado que não ataca e foge
//    de ti. Se o apanhares antes de ele fugir, larga um tesouro.
// =====================================================================

// Andar do Tesouro: 6 a 9 baús espalhados (um terço podem ser mímicos)
function andarDoTesouro() {
  const salas = mapa.salas.filter(s => s !== mapa.salaInicio);
  const n = randInt(6, 9);
  for (let k = 0; k < n && salas.length; k++) {
    const p = pontoLivreNaSala(mapa, escolher(salas), 16, 1);
    baus.push({ x: p.x, y: p.y, tipo: Math.random() < 0.3 ? 'ouro' : 'madeira', t: 0, mimicoExtra: 0.33 });
  }
}

// Andar Gelado: a velocidade do herói muda devagar (desliza)
function deslizarNoGelo(vx, vy, dt) {
  if (!mapa || mapa.evento !== 'gelado' || J.dashT > 0) { J.gx = vx; J.gy = vy; return [vx, vy]; }
  const k = Math.min(1, dt * 2.2);
  J.gx = (J.gx || 0) + (vx - (J.gx || 0)) * k;
  J.gy = (J.gy || 0) + (vy - (J.gy || 0)) * k;
  return [J.gx, J.gy];
}
function efeitosGelo() {
  if (mapa.evento !== 'gelado' || Math.random() > 0.35) return;
  particulas.push({ x: J.x + rand(-260, 260), y: J.y - rand(120, 220), vx: rand(-15, 15), vy: rand(40, 70), t: 3, cor: 'rgba(230,245,255,0.8)', tam: 3 });
  if (J.andando && Math.random() < 0.5) particulas.push({ x: J.x + rand(-6, 6), y: J.y + 12, vx: rand(-10, 10), vy: -10, t: 0.4, cor: 'rgba(200,235,255,0.7)', tam: 3 });
}

// ---------------------------------------------------------------------
//  Duende Dourado
// ---------------------------------------------------------------------
const TEMPO_DUENDE = 25; // segundos até fugir (depois de te ver)

function talvezDuendeDourado() {
  if (!J || J.modo === 'torre' || J.modo === 'bossrush' || andar < 3 || mapa.eBoss || mapa.provacao || naCidade() || Math.random() > 0.12) return;
  const salas = mapa.salas.filter(s => s !== mapa.salaInicio);
  if (!salas.length) return;
  const p = pontoLivreNaSala(mapa, escolher(salas), 16, 1);
  const e = criarInimigo('goblin', p.x, p.y);
  e.dourado = true;
  e.nome = 'Duende Dourado';
  e.hp = e.maxHp = Math.round(e.maxHp * 4);
  e.vel = 150;
  e.dano = 0;
  e.xp *= 6;
  e.tinta = '#ffcf3a';
  e.aura = '#ffd23f';
  e.roubou = 0;
  inimigos.push(e);
  avisar('Um Duende Dourado anda por aqui!', 'Apanha-o antes que fuja: larga um tesouro', '#ffd23f');
}

// Movimento: anda à toa até te ver; depois foge e, passado um tempo, desaparece
function movimentoDourado(e, dt, d, ux, uy) {
  if (Math.random() < 0.25) particulas.push({ x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), vx: 0, vy: -25, t: 0.5, cor: '#ffe680', tam: 3 });
  if (!e.viu && d < 260) { e.viu = true; e.fugaT = TEMPO_DUENDE; texto(e.x, e.y - 30, 'Hihi!', '#ffd23f', 15); }
  if (!e.viu) return { vx: Math.cos(e.t) * 30, vy: Math.sin(e.t * 0.7) * 30 };
  e.fugaT -= dt;
  if (e.fugaT <= 0 && d > 200) {
    e.morto = true;
    explosao(e.x, e.y, '#ffd23f', 24, 200, 4);
    mostrarBanner('O Duende Dourado fugiu!', 'Para a próxima sê mais rápido', '#ffd23f');
    return { vx: 0, vy: 0 };
  }
  // foge de ti, e às vezes dá um salto para o lado
  const lado = Math.sin(e.t * 2) > 0 ? 1 : -1;
  const f = d < 220 ? 1 : 0.4;
  return { vx: (-ux + -uy * lado * 0.5) * e.vel * f, vy: (-uy + ux * lado * 0.5) * e.vel * f };
}

function premioDourado(e) {
  soltarOuro(e.x, e.y, Math.round(40 + andar * 15), 10);
  baus.push({ x: e.x, y: e.y + 24, tipo: 'ouro', t: 0, semMimico: true });
  meta.almas += 5 + Math.floor(andar / 4); salvarMeta();
  mostrarBanner('Apanhaste o Duende Dourado!', `Tesouro, um Baú Dourado e ${5 + Math.floor(andar / 4)} almas`, '#ffd23f');
  colunaDeLuz(e.x, e.y, '#ffd23f', 1);
  fanfarra([659, 784, 988, 1318], 0.05);
  contar('duendes');
}
