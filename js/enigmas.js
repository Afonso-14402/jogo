'use strict';
// =====================================================================
//  SALA DO ENIGMA (andar 3+)
//  Um Baú Dourado preso numa jaula no meio da sala. Para a abrir:
//  - Placas: pisa todas as placas antes que o tempo acabe
//  - Alavancas: cada alavanca muda-se a si e às do lado; acende todas
//  - Estátuas: roda as estátuas até todas olharem para a jaula
// =====================================================================

SALAS_ESPECIAIS.enigma = { nome: 'Sala do Enigma', desc: 'Resolve o enigma para abrir a jaula do tesouro', cor: '#4dc3ff' };
const TEMPO_PLACAS = 9;
const DIRS4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // cima, direita, baixo, esquerda

function criarSalaEnigma(marcar) {
  if (andar < 3 || Math.random() > 0.3) return;
  const s = marcar('enigma');
  if (!s) return;
  if (s.w < 7 || s.h < 6) { s.tipo = null; return; } // sala pequena demais
  const c = centroPx(s);
  const variante = escolher(['placas', 'alavancas', 'estatuas']);
  const jaula = { tipo: 'jaulaEnigma', sala: s, x: c.x, y: c.y, variante, resolvido: false };
  objetos.push(jaula);
  const pos = (dx, dy) => { const x = c.x + dx * TILE, y = c.y + dy * TILE; return colideCirculo(mapa, x, y, 12) ? null : { x, y }; };
  if (variante === 'placas') {
    const sitios = [[-3, -2], [3, -2], [-3, 2], [3, 2], [0, -2], [0, 2]].map(([a, b]) => pos(a, b)).filter(Boolean).slice(0, 4);
    for (const p of sitios) objetos.push({ tipo: 'placa', sala: s, x: p.x, y: p.y, acesa: false });
    jaula.tempo = 0;
  } else if (variante === 'alavancas') {
    const sitios = [-3, -1.5, 0, 1.5, 3].map(a => pos(a, -2)).filter(Boolean);
    sitios.forEach((p, i) => objetos.push({ tipo: 'alavanca', sala: s, x: p.x, y: p.y, i, ligada: false }));
    // começa baralhado mas com solução (carregar em alavancas ao calhas a partir de "tudo ligado")
    const L = objetos.filter(o => o.tipo === 'alavanca' && o.sala === s);
    L.forEach(o => { o.ligada = true; });
    for (let k = 0; k < 3; k++) puxarAlavanca(L[randInt(0, L.length - 1)], true);
    if (L.every(o => o.ligada)) puxarAlavanca(L[0], true);
  } else {
    const sitios = [[-3, 0], [3, 0], [0, -2], [0, 2]].map(([a, b]) => pos(a, b)).filter(Boolean).slice(0, 3);
    for (const p of sitios) {
      // a direção certa é a que aponta para a jaula
      const dx = c.x - p.x, dy = c.y - p.y;
      const certa = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
      let dir = randInt(0, 3); if (dir === certa) dir = (dir + 1 + randInt(0, 2)) % 4;
      objetos.push({ tipo: 'estatuaRodar', sala: s, x: p.x, y: p.y, dir, certa });
    }
  }
}

// (compara as salas pela posição: depois de guardar e carregar o jogo já não são o mesmo objeto)
const mesmaSala = (a, b) => !!(a && b && a.x === b.x && a.y === b.y);
const pecasEnigma = j => objetos.filter(o => mesmaSala(o.sala, j.sala) && ['placa', 'alavanca', 'estatuaRodar'].includes(o.tipo));

function puxarAlavanca(o, silencio = false) {
  const L = objetos.filter(x => x.tipo === 'alavanca' && mesmaSala(x.sala, o.sala));
  for (const x of L) if (Math.abs(x.i - o.i) <= 1) x.ligada = !x.ligada;
  if (!silencio) som(320, 0.1, 'square', 0.04, 80);
}

// E nas alavancas e estátuas (chamado pelo usarObjeto)
function usarPecaEnigma(o) {
  const j = objetos.find(x => x.tipo === 'jaulaEnigma' && mesmaSala(x.sala, o.sala));
  if (!j || j.resolvido) return;
  if (o.tipo === 'alavanca') puxarAlavanca(o);
  else if (o.tipo === 'estatuaRodar') { o.dir = (o.dir + 1) % 4; som(160, 0.15, 'triangle', 0.04, 40); }
  verificarEnigma(j);
}

function verificarEnigma(j) {
  const P = pecasEnigma(j);
  const ok = j.variante === 'placas' ? P.every(o => o.acesa) : j.variante === 'alavancas' ? P.every(o => o.ligada) : P.every(o => o.dir === o.certa);
  if (!ok || j.resolvido) return;
  j.resolvido = true;
  baus.push({ x: j.x, y: j.y, tipo: 'ouro', t: 0, semMimico: true });
  colunaDeLuz(j.x, j.y, '#4dc3ff', 1);
  mostrarBanner('ENIGMA RESOLVIDO!', 'A jaula abriu-se: o Baú Dourado é teu', '#4dc3ff');
  fanfarra([523, 659, 784, 1046, 1318], 0.05);
  ganharXp(Math.round(10 * (1 + andar * 0.3)));
  contar('enigmas');
}

// Placas: acendem-se quando um herói passa por cima; se o tempo acabar, apagam-se todas
function atualizarEnigmas(dt) {
  for (const j of objetos) {
    if (j.tipo !== 'jaulaEnigma' || j.resolvido || j.variante !== 'placas') continue;
    const P = pecasEnigma(j);
    for (const o of P) if (!o.acesa && heroisVivos().some(H => Math.hypot(H.x - o.x, H.y - o.y) < 18)) {
      o.acesa = true;
      if (j.tempo <= 0) j.tempo = TEMPO_PLACAS;
      som(500 + P.filter(x => x.acesa).length * 120, 0.12, 'triangle', 0.04);
      verificarEnigma(j);
    }
    if (j.tempo > 0 && !j.resolvido) {
      j.tempo -= dt;
      if (j.tempo <= 0) { for (const o of P) o.acesa = false; som(150, 0.3, 'sawtooth', 0.04, -60); texto(j.x, j.y - 40, 'Demasiado lento!', '#ff8080', 15); }
    }
  }
}

// ---------------------------------------------------------------------
//  Desenho
// ---------------------------------------------------------------------
function desenharPecaEnigma(o, t) {
  if (o.tipo === 'jaulaEnigma') {
    if (o.resolvido) return true;
    sombra(o.x, o.y + 14, 20);
    spr(ART.jaula, o.x, o.y - 4);
    if (Math.random() < 0.04) particulas.push({ x: o.x + rand(-8, 8), y: o.y - 2, vx: 0, vy: -20, t: 0.6, cor: '#ffe680', tam: 2 });
    if (o.variante === 'placas' && o.tempo > 0) { // o tempo a acabar: um anel que encolhe
      ctx.globalAlpha = 0.8; aro(o.x, o.y - 4, 18 + 22 * (o.tempo / TEMPO_PLACAS), '#4dc3ff', 3); ctx.globalAlpha = 1;
    }
    return true;
  }
  if (o.tipo === 'placa') {
    spr(ART.placa[o.acesa ? 1 : 0], o.x, o.y);
    if (o.acesa) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6); circulo(o.x, o.y, 16, '#9fdcff'); ctx.globalAlpha = 1; }
    return true;
  }
  if (o.tipo === 'alavanca') {
    sombra(o.x, o.y + 10, 10);
    spr(ART.alavanca[o.ligada ? 1 : 0], o.x, o.y - 2);
    return true;
  }
  if (o.tipo === 'estatuaRodar') {
    sombra(o.x, o.y + 12, 12);
    const E = ART.estatua[o.dir === o.certa ? 1 : 0];
    const c = o.dir === 0 ? E.costas : o.dir === 2 ? E.frente : E.lado;
    spr(c, o.x, o.y - 6, o.dir === 3);
    return true;
  }
  return false;
}

function desenharInfoEnigma(o, sx, sy) {
  const usar = modoToque ? 'Usar' : '[E]';
  if (o.tipo === 'jaulaEnigma') {
    if (o.resolvido) return false;
    const dica = { placas: `Pisa todas as placas em ${TEMPO_PLACAS} segundos`, alavancas: 'Acende todas as alavancas (cada uma muda as do lado)', estatuas: 'Roda as estátuas até olharem todas para a jaula' }[o.variante];
    textoCentro('Jaula do tesouro', sx, sy - 18, 15, '#4dc3ff');
    textoCentro(dica, sx, sy, 12, '#ddd');
    return true;
  }
  if (o.tipo === 'alavanca') { textoCentro(`${usar}: Puxar a alavanca`, sx, sy, 14, '#ffe680'); return true; }
  if (o.tipo === 'estatuaRodar') { textoCentro(`${usar}: Rodar a estátua`, sx, sy, 14, '#ffe680'); return true; }
  if (o.tipo === 'placa') return true; // sem texto
  return false;
}
