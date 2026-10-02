'use strict';
// =====================================================================
//  ARMADILHAS NOVAS
//  - Chão que cai (andar 4+): o chão rachado desfaz-se pouco depois de lhe
//    tocares; quem estiver em cima cai, leva dano e volta ao último sítio seguro.
//  - Paredes com lanças (andar 6+): de vez em quando saem lanças da parede
//    (antes brilham as pontas, para dar tempo de fugir).
//  - Sala de gás (andar 8+): uma sala enche-se de gás venenoso aos ciclos.
// =====================================================================

const TEMPO_RACHAR = 0.7, TEMPO_BURACO = 5;
const CICLO_LANCAS = 2.8, CICLO_GAS = 7;

// Chamado no fim do popularAndar (salas e sítios livres já escolhidos)
function criarArmadilhasNovas(salasArm, livres) {
  if (!salasArm.length) return;
  const ocupado = (tx, ty) => armadilhas.some(a => a.tx === tx && a.ty === ty);
  // chão que cai: grupos de 2x2 a 3x2 nas salas
  if (andar >= 4) {
    const n = Math.min(5, 1 + Math.floor((andar - 4) / 6));
    for (let i = 0; i < n; i++) {
      const s = escolher(salasArm);
      const tx0 = randInt(s.x + 1, s.x + s.w - 3), ty0 = randInt(s.y + 1, s.y + s.h - 3), gw = randInt(2, 3);
      for (let ty = ty0; ty < ty0 + 2; ty++) for (let tx = tx0; tx < tx0 + gw; tx++) {
        const p = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
        if (solido(mapa, tx, ty) || !longeDe(p, livres, 64) || ocupado(tx, ty)) continue;
        armadilhas.push({ tipo: 'chao', tx, ty, x: p.x, y: p.y, estado: 0, t: 0 });
      }
    }
  }
  // paredes com lanças: numa parede com corredor livre à frente
  if (andar >= 6) {
    const n = Math.min(6, 1 + Math.floor((andar - 6) / 5));
    let feitas = 0;
    for (let k = 0; k < 400 && feitas < n; k++) {
      const tx = randInt(1, mapa.W - 2), ty = randInt(1, mapa.H - 2);
      if (!solido(mapa, tx, ty) || ocupado(tx, ty)) continue;
      const [dx, dy] = escolher([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      if (solido(mapa, tx + dx, ty + dy) || solido(mapa, tx + dx * 2, ty + dy * 2)) continue;
      const x = (tx + 0.5) * TILE, y = (ty + 0.5) * TILE;
      if (Math.hypot(x - mapa.inicio.x, y - mapa.inicio.y) < 300) continue;
      armadilhas.push({ tipo: 'lancas', tx, ty, dx, dy, x, y, fase: rand(0, CICLO_LANCAS), estado: 0 });
      feitas++;
    }
  }
  // sala de gás: uma sala grande (às vezes)
  if (andar >= 8 && Math.random() < 0.4) {
    const grandes = salasArm.filter(s => s.w * s.h >= 30 && !s.tipo);
    if (grandes.length) {
      const s = escolher(grandes);
      armadilhas.push({ tipo: 'gas', tx: -1, ty: -1, sx: s.x, sy: s.y, sw: s.w, sh: s.h, x: (s.x + s.w / 2) * TILE, y: (s.y + s.h / 2) * TILE, fase: rand(0, CICLO_GAS), estado: 0 });
    }
  }
}

const noTile = (a, H) => a.tx === Math.floor(H.x / TILE) && a.ty === Math.floor(H.y / TILE);
const naSalaGas = (a, H) => H.x >= a.sx * TILE && H.x < (a.sx + a.sw) * TILE && H.y >= a.sy * TILE && H.y < (a.sy + a.sh) * TILE;

// Cada herói lembra-se do último sítio seguro (para voltar lá se cair)
function lembrarSitioSeguro() {
  for (const H of heroisVivos()) {
    if (!armadilhas.some(a => a.tipo === 'chao' && noTile(a, H))) H.seguro = { x: H.x, y: H.y };
  }
}

function cairNoBuraco(H, a) {
  comHeroi(H, () => {
    if (J.dashT > 0) return; // a esquiva passa por cima do buraco
    const hp0 = J.hp;
    J.invuln = 0;
    danoJogador(Math.round(danoArmadilha() * 1.5 + S.maxHp * 0.08), null, null);
    if (J.hp < hp0 || J.hp <= 0) texto(J.x, J.y - 30, 'Caíste!', '#ff8080', 16);
    const s = J.seguro || mapa.inicio;
    J.x = s.x; J.y = s.y; J.kbx = J.kby = 0;
    desencravar(mapa, J);
    J.invuln = Math.max(J.invuln, 1);
  });
}

// Chamado pelo atualizarArmadilhas para os tipos novos
function atualizarArmadilhaNova(a, dt) {
  if (a.tipo === 'chao') {
    if (a.estado === 0) {
      if (heroisVivos().some(H => noTile(a, H))) { a.estado = 1; a.t = TEMPO_RACHAR; som(180, 0.25, 'sawtooth', 0.03, -60); }
    } else {
      a.t -= dt;
      if (a.estado === 1 && a.t <= 0) {
        a.estado = 2; a.t = TEMPO_BURACO;
        for (let k = 0; k < 8; k++) particulas.push({ x: a.x + rand(-14, 14), y: a.y + rand(-14, 14), vx: rand(-30, 30), vy: rand(-60, -10), t: 0.6, cor: '#6a6070', tam: 4 });
      } else if (a.estado === 2 && a.t <= 0) a.estado = 0;
      if (a.estado === 2) for (const H of heroisVivos()) if (noTile(a, H)) cairNoBuraco(H, a);
    }
    return;
  }
  if (a.tipo === 'lancas') {
    const t = (tempoJogo + a.fase) % CICLO_LANCAS, antes = a.estado;
    a.estado = t < 1.9 ? 0 : t < 2.4 ? 1 : 2; // 0 escondidas, 1 aviso, 2 de fora
    if (a.estado === 2 && antes !== 2) { a.atingidos = []; if (Math.hypot(a.x - J.x, a.y - J.y) < 300) som(900, 0.06, 'square', 0.02, -500); }
    if (a.estado === 2) for (const H of heroisVivos()) {
      if (a.atingidos.includes(H)) continue;
      for (let k = 1; k <= 2; k++) if (Math.floor(H.x / TILE) === a.tx + a.dx * k && Math.floor(H.y / TILE) === a.ty + a.dy * k) {
        a.atingidos.push(H);
        comHeroi(H, () => danoJogador(Math.round(danoArmadilha() * 1.3), a.x, a.y));
      }
    }
    return;
  }
  if (a.tipo === 'gas') {
    const t = (tempoJogo + a.fase) % CICLO_GAS;
    a.estado = t < 3 ? 0 : t < 3.8 ? 1 : 2; // 0 limpo, 1 aviso (sai fumo das grelhas), 2 sala cheia de gás
    if (a.estado === 2) for (const H of heroisVivos()) if (naSalaGas(a, H)) comHeroi(H, () => aplicarVeneno(Math.max(2, danoArmadilha() * 0.5), 1.5));
  }
}

// Dicas da primeira vez
function dicasArmadilhas() {
  for (const a of armadilhas) {
    if (a.tipo === 'chao' && Math.hypot(a.x - J.x, a.y - J.y) < 120) { dica('chao'); return; }
    if (a.tipo === 'lancas' && Math.hypot(a.x - J.x, a.y - J.y) < 150 && a.estado) { dica('lancas'); return; }
    if (a.tipo === 'gas' && a.estado && naSalaGas(a, J)) { dica('gas'); return; }
  }
}

// ---------------------------------------------------------------------
//  Desenho
// ---------------------------------------------------------------------
function desenharArmadilhaNova(a, t) {
  if (a.tipo === 'chao') {
    if (!explorado(a.x, a.y)) return;
    const x = a.tx * TILE, y = a.ty * TILE;
    if (a.estado === 2) { // buraco
      ctx.fillStyle = '#050307'; ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = 'rgba(80,70,100,0.6)'; ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
      return;
    }
    const tremer = a.estado === 1 ? Math.sin(t * 60) * 2 : 0;
    ctx.strokeStyle = a.estado === 1 ? 'rgba(255,200,150,0.8)' : 'rgba(10,8,14,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6 + tremer, y + 8); ctx.lineTo(x + 14 + tremer, y + 16); ctx.lineTo(x + 10 + tremer, y + 26);
    ctx.moveTo(x + 14 + tremer, y + 16); ctx.lineTo(x + 26 + tremer, y + 12);
    ctx.moveTo(x + 20 + tremer, y + 22); ctx.lineTo(x + 28 + tremer, y + 28);
    ctx.stroke();
    return;
  }
  if (a.tipo === 'lancas') {
    if (!mapa.explorado[(a.ty + a.dy) * mapa.W + a.tx + a.dx]) return;
    const cx = a.x + a.dx * TILE * 0.5, cy = a.y + a.dy * TILE * 0.5; // na face da parede
    ctx.fillStyle = '#3a3448';
    for (const k of [-8, 0, 8]) ctx.fillRect(alinhar(cx + a.dy * k - 3), alinhar(cy + a.dx * k - 3), 6, 6);
    if (a.estado === 1) { // as pontas brilham
      ctx.fillStyle = Math.sin(t * 30) > 0 ? '#ffffff' : '#c0c8d8';
      for (const k of [-8, 0, 8]) ctx.fillRect(alinhar(cx + a.dy * k + a.dx * 3 - 2), alinhar(cy + a.dx * k + a.dy * 3 - 2), 4, 4);
    } else if (a.estado === 2) { // lanças de fora (2 tiles)
      const L = TILE * 2;
      for (const k of [-8, 0, 8]) {
        const x0 = cx + a.dy * k, y0 = cy + a.dx * k;
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + a.dx * L, y0 + a.dy * L); ctx.stroke();
        ctx.fillStyle = '#d8dce8';
        ctx.beginPath();
        ctx.moveTo(x0 + a.dx * (L + 8), y0 + a.dy * (L + 8));
        ctx.lineTo(x0 + a.dx * L - a.dy * 4, y0 + a.dy * L - a.dx * 4);
        ctx.lineTo(x0 + a.dx * L + a.dy * 4, y0 + a.dy * L + a.dx * 4);
        ctx.closePath(); ctx.fill();
      }
    }
    return;
  }
  if (a.tipo === 'gas') {
    if (!explorado(a.x, a.y)) return;
    // grelhas nos cantos
    const cantos = [[a.sx + 1, a.sy + 1], [a.sx + a.sw - 2, a.sy + 1], [a.sx + 1, a.sy + a.sh - 2], [a.sx + a.sw - 2, a.sy + a.sh - 2]];
    for (const [gx, gy] of cantos) {
      const x = gx * TILE + 6, y = gy * TILE + 6;
      ctx.fillStyle = '#2a3a24'; ctx.fillRect(x, y, TILE - 12, TILE - 12);
      ctx.fillStyle = '#4a6a3a'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 2, y + 3 + k * 6, TILE - 16, 2);
      if (a.estado === 1 && Math.random() < 0.3) particulas.push({ x: x + 10, y: y + 10, vx: rand(-20, 20), vy: rand(-40, -10), t: 0.8, cor: 'rgba(125,255,90,0.6)', tam: 6 });
    }
    if (a.estado === 2) { // nuvem verde por cima da sala
      const x0 = a.sx * TILE, y0 = a.sy * TILE, w = a.sw * TILE, h = a.sh * TILE;
      ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 2);
      ctx.fillStyle = '#5dff5a'; ctx.fillRect(x0, y0, w, h);
      ctx.globalAlpha = 0.22;
      for (let k = 0; k < 10; k++) {
        const px = x0 + ((k * 97 + t * 20 * (k % 2 ? 1 : -1)) % w + w) % w, py = y0 + ((k * 53) % h);
        circulo(px, py, 26 + (k % 3) * 8, '#8dff6a');
      }
      ctx.globalAlpha = 1;
    }
  }
}
