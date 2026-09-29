'use strict';
// =====================================================================
//  CONTROLOS DE TOQUE (telemóvel / tablet)
//  Só ficam ativos em aparelhos com ecrã tátil como controlo principal,
//  ou a partir do momento em que alguém toca no ecrã.
//  No computador com rato e teclado nunca aparecem.
// =====================================================================

let modoToque = false;
try {
  modoToque = matchMedia('(pointer: coarse)').matches && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
} catch (e) { /* sem matchMedia */ }

const toque = {
  joy: null,     // { id, cx, cy, x, y } enquanto o dedo está no joystick
  botoes: {},    // identificador do toque -> botão carregado
  atacar: false, // botão de ataque a ser segurado
};

const RAIO_JOYSTICK = 56;

// Botões do ecrã durante o jogo (coordenadas do canvas 960x640)
function botoesToque() {
  return [
    { id: 'atacar', x: 862, y: 536, r: 58, segurar: true },
    { id: 'dash', x: 746, y: 596, r: 34, tecla: 'shift' },
    { id: 'pocao', x: 752, y: 486, r: 32, tecla: 'q' },
    { id: 'usar', x: 872, y: 418, r: 32, tecla: 'e' },
    { id: 'f1', x: 436, y: 598, r: 28, tecla: '1', feitico: 'fogo' },
    { id: 'f2', x: 502, y: 598, r: 28, tecla: '2', feitico: 'raio' },
    { id: 'f3', x: 568, y: 598, r: 28, tecla: '3', feitico: 'gelo' },
    { id: 'f4', x: 634, y: 598, r: 28, tecla: '4', feitico: 'cura' },
    { id: 'pausa', x: 926, y: 214, r: 22, tecla: 'p' },
    { id: 'personagem', x: 926, y: 264, r: 22, tecla: 'c' },
    { id: 'mochila', x: 926, y: 314, r: 22, tecla: 'i' },
  ];
}

function posToque(t) {
  const b = canvas.getBoundingClientRect();
  return { x: (t.clientX - b.left) * LARGURA / b.width, y: (t.clientY - b.top) * ALTURA / b.height };
}

const botaoEm = p => botoesToque().find(b => Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 10);

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  modoToque = true;
  for (const t of e.changedTouches) {
    const p = posToque(t);
    rato.x = p.x; rato.y = p.y;
    if (estado === 'jogo') {
      const b = botaoEm(p);
      if (b) {
        toque.botoes[t.identifier] = b;
        if (b.segurar) toque.atacar = true;
        else premidas[b.tecla] = true;
        continue;
      }
      if (p.x < LARGURA * 0.55 && !toque.joy) {
        toque.joy = { id: t.identifier, cx: p.x, cy: p.y, x: p.x, y: p.y };
      }
      continue;
    }
    premidas['rato'] = true; // nos menus um toque é um clique
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const p = posToque(t);
    if (toque.joy && t.identifier === toque.joy.id) {
      let dx = p.x - toque.joy.cx, dy = p.y - toque.joy.cy;
      const d = Math.hypot(dx, dy);
      if (d > RAIO_JOYSTICK) { dx = dx / d * RAIO_JOYSTICK; dy = dy / d * RAIO_JOYSTICK; }
      toque.joy.x = toque.joy.cx + dx;
      toque.joy.y = toque.joy.cy + dy;
    } else if (estado !== 'jogo') {
      rato.x = p.x; rato.y = p.y;
    }
  }
}, { passive: false });

function largarToque(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (toque.joy && t.identifier === toque.joy.id) toque.joy = null;
    const b = toque.botoes[t.identifier];
    if (b) {
      if (b.segurar) toque.atacar = false;
      delete toque.botoes[t.identifier];
    }
  }
}
canvas.addEventListener('touchend', largarToque, { passive: false });
canvas.addEventListener('touchcancel', largarToque, { passive: false });
