'use strict';
// =====================================================================
//  GERAÇÃO DA MASMORRA + COLISÕES
// =====================================================================

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const escolher = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Escolhe uma chave de um objeto {chave: peso}
function escolherPeso(pesos) {
  let total = 0;
  for (const k in pesos) total += pesos[k];
  let r = Math.random() * total;
  let ultima = null;
  for (const k in pesos) {
    ultima = k;
    r -= pesos[k];
    if (r < 0) return k;
  }
  return ultima;
}

function centroSala(s) {
  return { x: Math.floor(s.x + s.w / 2), y: Math.floor(s.y + s.h / 2) };
}

function gerarMapa(andar) {
  const eBoss = andar % 5 === 0;
  return eBoss ? gerarArenaBoss() : gerarMasmorra();
}

function criarBaseMapa(W, H) {
  return {
    W, H,
    tiles: new Uint8Array(W * H), // 0 = parede, 1 = chão
    explorado: new Uint8Array(W * H),
    salas: [],
  };
}

function cavar(m, x, y) {
  if (x > 0 && y > 0 && x < m.W - 1 && y < m.H - 1) m.tiles[y * m.W + x] = 1;
}

function gerarMasmorra() {
  const m = criarBaseMapa(60, 44);
  m.eBoss = false;

  for (let t = 0; t < 300 && m.salas.length < 14; t++) {
    const w = randInt(6, 12), h = randInt(5, 9);
    const x = randInt(2, m.W - w - 3), y = randInt(2, m.H - h - 3);
    const sobrepoe = m.salas.some(o =>
      x < o.x + o.w + 2 && x + w + 2 > o.x && y < o.y + o.h + 2 && y + h + 2 > o.y);
    if (sobrepoe) continue;
    m.salas.push({ x, y, w, h });
  }

  for (const s of m.salas)
    for (let y = s.y; y < s.y + s.h; y++)
      for (let x = s.x; x < s.x + s.w; x++) cavar(m, x, y);

  // Liga cada sala à sala anterior mais próxima (árvore) + alguns atalhos
  for (let i = 1; i < m.salas.length; i++) {
    let melhor = 0, md = Infinity;
    const ci = centroSala(m.salas[i]);
    for (let j = 0; j < i; j++) {
      const cj = centroSala(m.salas[j]);
      const d = Math.abs(ci.x - cj.x) + Math.abs(ci.y - cj.y);
      if (d < md) { md = d; melhor = j; }
    }
    corredor(m, ci, centroSala(m.salas[melhor]));
  }
  for (let k = 0; k < 2 && m.salas.length > 3; k++) {
    corredor(m, centroSala(escolher(m.salas)), centroSala(escolher(m.salas)));
  }

  // Início na primeira sala, escada na sala mais longe
  const c0 = centroSala(m.salas[0]);
  let longe = m.salas[0], ld = -1;
  for (const s of m.salas) {
    const c = centroSala(s);
    const d = Math.hypot(c.x - c0.x, c.y - c0.y);
    if (d > ld) { ld = d; longe = s; }
  }
  const ce = centroSala(longe);
  m.salaInicio = m.salas[0];
  m.salaEscada = longe;
  m.inicio = { x: (c0.x + 0.5) * TILE, y: (c0.y + 0.5) * TILE };
  m.escada = { x: (ce.x + 0.5) * TILE, y: (ce.y + 0.5) * TILE, ativa: true };
  return m;
}

function corredor(m, a, b) {
  const cavarH = (x1, x2, y) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { cavar(m, x, y); cavar(m, x, y + 1); }
  };
  const cavarV = (y1, y2, x) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2) + 1; y++) { cavar(m, x, y); cavar(m, x + 1, y); }
  };
  if (Math.random() < 0.5) { cavarH(a.x, b.x, a.y); cavarV(a.y, b.y, b.x); }
  else { cavarV(a.y, b.y, a.x); cavarH(a.x, b.x, b.y); }
}

function gerarArenaBoss() {
  const m = criarBaseMapa(36, 26);
  m.eBoss = true;
  const sala = { x: 2, y: 2, w: 32, h: 22 };
  m.salas.push(sala);
  for (let y = sala.y; y < sala.y + sala.h; y++)
    for (let x = sala.x; x < sala.x + sala.w; x++) cavar(m, x, y);
  // Pilares para te esconderes
  const pilares = [[8, 7], [26, 7], [8, 17], [26, 17]];
  for (const [px, py] of pilares)
    for (let y = py; y < py + 2; y++)
      for (let x = px; x < px + 2; x++) m.tiles[y * m.W + x] = 0;
  m.salaInicio = sala;
  m.salaEscada = sala;
  m.inicio = { x: 18 * TILE, y: 21 * TILE };
  m.posBoss = { x: 18 * TILE, y: 8 * TILE };
  m.escada = { x: 18 * TILE, y: 13 * TILE, ativa: false };
  m.explorado.fill(1);
  return m;
}

// ---------------------------------------------------------------------
//  Colisões
// ---------------------------------------------------------------------
function solido(m, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= m.W || ty >= m.H) return true;
  return m.tiles[ty * m.W + tx] === 0;
}

function colideCirculo(m, x, y, r) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!solido(m, tx, ty)) continue;
      const cx = clamp(x, tx * TILE, tx * TILE + TILE);
      const cy = clamp(y, ty * TILE, ty * TILE + TILE);
      if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
    }
  }
  return false;
}

// Move uma entidade respeitando paredes. Devolve true se bateu.
function moverEntidade(m, e, dx, dy) {
  let bateu = false;
  if (dx) {
    if (!colideCirculo(m, e.x + dx, e.y, e.r)) e.x += dx; else bateu = true;
  }
  if (dy) {
    if (!colideCirculo(m, e.x, e.y + dy, e.r)) e.y += dy; else bateu = true;
  }
  return bateu;
}

function pontoLivreNaSala(m, s, r, margem = 1) {
  for (let t = 0; t < 40; t++) {
    const x = (randInt(s.x + margem, s.x + s.w - 1 - margem) + 0.5) * TILE;
    const y = (randInt(s.y + margem, s.y + s.h - 1 - margem) + 0.5) * TILE;
    if (!colideCirculo(m, x, y, r)) return { x, y };
  }
  const c = centroSala(s);
  return { x: (c.x + 0.5) * TILE, y: (c.y + 0.5) * TILE };
}

function revelar(m, px, py, raio) {
  const cx = Math.floor(px / TILE), cy = Math.floor(py / TILE);
  for (let y = cy - raio; y <= cy + raio; y++) {
    for (let x = cx - raio; x <= cx + raio; x++) {
      if (x < 0 || y < 0 || x >= m.W || y >= m.H) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= raio * raio) m.explorado[y * m.W + x] = 1;
    }
  }
}

// Pré-desenha o mapa num canvas escondido com os ladrilhos de pixel art
// (16 pixels por tile; no ecrã cada pixel vale 2)
function renderizarMapa(m, andar) {
  const L = ladrilhosZona(andar);
  const T = TILE / ESCALA;
  const c = document.createElement('canvas');
  c.width = m.W * T; c.height = m.H * T;
  const g = c.getContext('2d');
  g.fillStyle = '#07060a';
  g.fillRect(0, 0, c.width, c.height);
  m.tochas = [];
  for (let y = 0; y < m.H; y++) {
    for (let x = 0; x < m.W; x++) {
      const px = x * T, py = y * T;
      const h = (x * 73856093) ^ (y * 19349663);
      if (!solido(m, x, y)) {
        const v = Math.abs(h) % 17;
        g.drawImage(L.chaos[v === 0 ? 1 : v === 1 ? 2 : v === 2 ? 3 : 0], px, py);
        if (solido(m, x, y - 1)) { // sombra da parede de cima
          g.fillStyle = 'rgba(0,0,0,0.35)';
          g.fillRect(px, py, T, 3);
        }
        if (solido(m, x - 1, y)) {
          g.fillStyle = 'rgba(0,0,0,0.2)';
          g.fillRect(px, py, 2, T);
        }
        continue;
      }
      let vizinhoChao = false;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (!solido(m, x + dx, y + dy)) vizinhoChao = true;
      if (!vizinhoChao) continue;
      if (!solido(m, x, y + 1)) {
        g.drawImage(L.face, px, py);
        if (!m.eBoss && Math.abs(h) % 19 === 0) m.tochas.push({ x: (x + 0.5) * TILE, y: y * TILE + 12 });
      } else g.drawImage(L.topo, px, py);
    }
  }
  if (m.eBoss) for (const tx of [6, 12, 23, 29]) m.tochas.push({ x: (tx + 0.5) * TILE, y: TILE + 12 });
  return c;
}

// ---------------------------------------------------------------------
//  Pathfinding: mapa de distâncias (BFS) a partir do tile do jogador.
//  Os inimigos descem este "campo" para contornar paredes.
// ---------------------------------------------------------------------
let campo = null, campoTile = -1, campoFila = null;

function reiniciarCampo() { campo = null; campoTile = -1; }

function atualizarCampo(m, px, py) {
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  const origem = ty * m.W + tx;
  if (campo && origem === campoTile) return;
  const n = m.W * m.H;
  if (!campo || campo.length !== n) { campo = new Int16Array(n); campoFila = new Int32Array(n); }
  campo.fill(-1);
  campoTile = origem;
  if (solido(m, tx, ty)) return;
  let ini = 0, fim = 0;
  campo[origem] = 0;
  campoFila[fim++] = origem;
  while (ini < fim) {
    const i = campoFila[ini++];
    const x = i % m.W, y = (i - x) / m.W, d = campo[i] + 1;
    if (x > 0 && m.tiles[i - 1] && campo[i - 1] < 0) { campo[i - 1] = d; campoFila[fim++] = i - 1; }
    if (x < m.W - 1 && m.tiles[i + 1] && campo[i + 1] < 0) { campo[i + 1] = d; campoFila[fim++] = i + 1; }
    if (y > 0 && m.tiles[i - m.W] && campo[i - m.W] < 0) { campo[i - m.W] = d; campoFila[fim++] = i - m.W; }
    if (y < m.H - 1 && m.tiles[i + m.W] && campo[i + m.W] < 0) { campo[i + m.W] = d; campoFila[fim++] = i + m.W; }
  }
}

function distCampo(m, x, y) {
  if (!campo) return -1;
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= m.W || ty >= m.H) return -1;
  return campo[ty * m.W + tx];
}

// Há caminho reto (com a largura do corpo) entre dois pontos?
function linhaDeVista(m, x0, y0, x1, y1, r) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const passos = Math.ceil(d / 10);
  for (let i = 1; i < passos; i++) {
    const f = i / passos;
    if (colideCirculo(m, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, r * 0.9)) return false;
  }
  return true;
}

// Direção (vetor unitário) que a entidade deve seguir para chegar ao jogador
function rumo(m, e, alvoX, alvoY) {
  const dx = alvoX - e.x, dy = alvoY - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const direto = { x: dx / d, y: dy / d };
  const d0 = distCampo(m, e.x, e.y);
  if (d0 < 0 || d0 <= 1 || linhaDeVista(m, e.x, e.y, alvoX, alvoY, e.r)) return direto;
  const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
  let melhor = null, mv = d0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (!ox && !oy) continue;
      const nx = tx + ox, ny = ty + oy;
      if (solido(m, nx, ny)) continue;
      if (ox && oy && (solido(m, tx + ox, ty) || solido(m, tx, ty + oy))) continue; // não corta cantos
      const v = campo[ny * m.W + nx];
      if (v >= 0 && (v < mv || (v === mv && melhor && ox * oy === 0))) { mv = v; melhor = { nx, ny }; }
    }
  }
  if (!melhor) return direto;
  const cx = (melhor.nx + 0.5) * TILE - e.x, cy = (melhor.ny + 0.5) * TILE - e.y;
  const l = Math.hypot(cx, cy) || 1;
  return { x: cx / l, y: cy / l };
}
