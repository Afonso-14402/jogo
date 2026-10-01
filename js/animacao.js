'use strict';
// =====================================================================
//  ANIMAÇÕES: pequenos efeitos que dão vida ao jogo
//  - o herói salta um pouco a cada passo e levanta pó
//  - faíscas na direção do golpe (e um anel nos críticos)
//  - as moedas saltam para fora e quicam no chão
//  - colunas de luz ao abrir um baú e ao subir de nível
//  - os números de dano "saltam" quando aparecem
//  - o ecrã escurece e clareia ao mudar de andar
//  - o herói cai e a alma sobe quando morres
// =====================================================================

let brilhos = []; // colunas de luz e anéis (no mundo)
let transicaoAndar = 0; // segundos que faltam do clarear ao entrar num andar

// ---------------------------------------------------------------------
//  Herói: passos
// ---------------------------------------------------------------------
// Devolve o salto e o "amassar" do passo (somado à pose do herói)
function passoHeroi() {
  if (!J.andando || J.dashT > 0) { J.passoAnt = 0; return { oy: 0, sx: 1, sy: 1 }; }
  const f = tempoJogo * 13, s = Math.sin(f);
  // pó nos pés quando o pé bate no chão
  const lado = s >= 0 ? 1 : -1;
  if (J.passoAnt && lado !== J.passoAnt && !J.remoto) {
    for (let k = 0; k < 2; k++) particulas.push({ x: J.x - J.dirX * 6 + rand(-4, 4), y: J.y + 12, vx: -J.dirX * rand(10, 30) + rand(-12, 12), vy: rand(-18, -6), t: 0.35, cor: 'rgba(200,190,170,0.55)', tam: 3 });
  }
  J.passoAnt = lado;
  const a = Math.abs(s);
  return { oy: -a * 2.5, sx: 1 + (1 - a) * 0.05, sy: 1 - (1 - a) * 0.06 };
}

// ---------------------------------------------------------------------
//  Golpes: faíscas
// ---------------------------------------------------------------------
function faiscasGolpe(e, crit, fx, fy) {
  const l = Math.hypot(fx, fy);
  const ux = l > 0.01 ? fx / l : (e.x - J.x) / (Math.hypot(e.x - J.x, e.y - J.y) || 1);
  const uy = l > 0.01 ? fy / l : (e.y - J.y) / (Math.hypot(e.x - J.x, e.y - J.y) || 1);
  const n = crit ? 7 : 4;
  for (let k = 0; k < n; k++) {
    const a = Math.atan2(uy, ux) + rand(-0.7, 0.7), v = rand(160, crit ? 360 : 260);
    particulas.push({ x: e.x - ux * e.r * 0.5, y: e.y - uy * e.r * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.18, cor: crit ? '#ffe680' : '#ffffff', tam: crit ? 4 : 3 });
  }
  if (crit) brilhos.push({ tipo: 'anel', x: e.x, y: e.y, cor: '#ffe14d', t: 0.22, dur: 0.22, r: e.r + 18 });
}

// ---------------------------------------------------------------------
//  Moedas que saltam
// ---------------------------------------------------------------------
function lancarMoeda(d) {
  d.z = 2; d.vz = rand(140, 220);
  const a = Math.random() * Math.PI * 2, v = rand(20, 70);
  d.svx = Math.cos(a) * v; d.svy = Math.sin(a) * v;
}
function animarDrop(d, dt) {
  if (d.vz == null) return;
  d.vz -= 700 * dt;
  d.z += d.vz * dt;
  if (d.svx) { const nx = d.x + d.svx * dt, ny = d.y + d.svy * dt; if (!colideCirculo(mapa, nx, ny, 4)) { d.x = nx; d.y = ny; } }
  if (d.z <= 0) {
    d.z = 0;
    if (d.vz < -60) { d.vz = -d.vz * 0.4; d.svx *= 0.5; d.svy *= 0.5; } // quica
    else { d.vz = null; d.svx = d.svy = 0; }
  }
}
const alturaDrop = d => d.z || 0;

// ---------------------------------------------------------------------
//  Colunas de luz (baús e subir de nível)
// ---------------------------------------------------------------------
function colunaDeLuz(x, y, cor, dur = 0.7) {
  brilhos.push({ tipo: 'coluna', x, y, cor, t: dur, dur });
  brilhos.push({ tipo: 'anel', x, y: y + 8, cor, t: dur * 0.6, dur: dur * 0.6, r: 40 });
  for (let k = 0; k < 14; k++) particulas.push({ x: x + rand(-14, 14), y: y + rand(-4, 10), vx: rand(-10, 10), vy: rand(-180, -80), t: rand(0.4, 0.8), cor, tam: 3 });
}
function atualizarBrilhos(dt) {
  for (const b of brilhos) b.t -= dt;
  brilhos = brilhos.filter(b => b.t > 0);
  if (transicaoAndar > 0) transicaoAndar -= dt;
}
function desenharBrilhos() {
  for (const b of brilhos) {
    const k = b.t / b.dur;
    if (b.tipo === 'coluna') {
      const w = 26 * (0.4 + 0.6 * k), h = 150;
      const g = ctx.createLinearGradient(0, b.y - h, 0, b.y + 10);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, b.cor);
      ctx.globalAlpha = 0.55 * k;
      ctx.fillStyle = g;
      ctx.fillRect(alinhar(b.x - w / 2), alinhar(b.y - h), alinhar(w), h + 10);
      ctx.globalAlpha = 0.8 * k;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(alinhar(b.x - w / 6), alinhar(b.y - h * 0.8), alinhar(Math.max(2, w / 3)), h * 0.8 + 10);
    } else if (b.tipo === 'anel') {
      ctx.globalAlpha = 0.9 * k;
      aro(b.x, b.y, alinhar(b.r * (1.2 - 0.6 * k)), b.cor, 3);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Números de dano que saltam
// ---------------------------------------------------------------------
const VIDA_TEXTO = 0.9;
function escalaTexto(tx) {
  const idade = VIDA_TEXTO - tx.t;
  return idade < 0.1 ? 1 + 0.55 * (1 - idade / 0.1) : 1;
}

// ---------------------------------------------------------------------
//  Entre andares: o ecrã clareia a partir do preto
// ---------------------------------------------------------------------
function comecarTransicaoAndar() { transicaoAndar = 0.45; }
function desenharTransicaoAndar() {
  if (transicaoAndar <= 0 || !['jogo', 'convidado'].includes(estado)) return;
  ctx.globalAlpha = clamp(transicaoAndar / 0.45, 0, 1);
  ctx.fillStyle = '#000';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Morte do herói: cai, pisca e a alma sobe
// ---------------------------------------------------------------------
function animarMorteHeroi() {
  try {
    const c = framesHeroi(J.raca, J.skin)[0];
    restos.push({ c, x: J.x, y: J.y - 4, flip: J.dirX < 0, t: 1.4, dur: 1.4, boss: false, cor: '#ff5050' });
  } catch (e) { /* sem sprite */ }
  for (let k = 0; k < 18; k++) particulas.push({ x: J.x + rand(-6, 6), y: J.y - 4, vx: rand(-20, 20), vy: rand(-120, -50), t: rand(0.8, 1.4), cor: k % 3 ? 'rgba(180,220,255,0.8)' : '#ffffff', tam: k % 4 ? 3 : 5 });
}
