'use strict';
// =====================================================================
//  COMANDOS (gamepad): Xbox, PlayStation, comandos Bluetooth no telemóvel
//  No jogo:
//   stick esquerdo: andar · stick direito: apontar (sem ele, aponta sozinho)
//   A / ✕: atacar · B / ◯: esquiva · X / ▢: usar · Y / △: poção
//   LB: poder único (★) · RB: 1.ª magia · LT / RT: 1.ª e 2.ª habilidade
//   cruz: 2.ª e 3.ª magia (cima/direita), 3.ª e 4.ª habilidade (baixo/esquerda)
//   Back: mochila · Start: pausa · L3: personagem · R3: mapa
//  Nos menus o stick esquerdo (ou a cruz) mexe um cursor e o A carrega;
//  o B volta atrás.
// =====================================================================

const comando = { ativo: false, ant: [], mov: null, mira: null, miraT: 0, atacar: false };
const ZONA_MORTA = 0.25;
const BOTOES_NO_JOGO = { 1: 'shift', 2: 'e', 3: 'q', 4: 'f', 5: '1', 6: '5', 7: '6', 8: 'i', 9: 'p', 10: 'c', 11: 'tab', 12: '2', 13: '7', 14: '8', 15: '3' };
const BOTOES_NOS_MENUS = { 1: 'escape', 9: 'escape', 12: 'arrowup', 13: 'arrowdown', 14: 'arrowleft', 15: 'arrowright' };

function comandoLigado() {
  const l = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const g of l) if (g && g.connected && g.mapping === 'standard') return g;
  for (const g of l) if (g && g.connected) return g;
  return null;
}
addEventListener('gamepadconnected', () => avisar('Comando ligado', 'Stick esquerdo: andar · A: atacar · B: esquiva', '#5dff7a'));

// Lê o comando uma vez por frame (no início do loop) e transforma-o em teclas
function lerComando(dt) {
  const g = comandoLigado();
  if (!g) { comando.mov = null; comando.atacar = false; return; }
  const b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
  const ax = i => (Math.abs(g.axes[i] || 0) > ZONA_MORTA ? g.axes[i] : 0);
  const lx = ax(0), ly = ax(1), rx = ax(2), ry = ax(3);
  const algo = g.buttons.some(x => x && x.pressed) || lx || ly || rx || ry;
  if (algo && !comando.ativo) { comando.ativo = true; if (typeof toque !== 'undefined') toque.joy = null; }
  if (!comando.ativo) return;
  const noJogo = estado === 'jogo' || (estado === 'convidado' && coop.menu === 'jogo' && !coop.confirmarSair);
  const tabela = noJogo ? BOTOES_NO_JOGO : BOTOES_NOS_MENUS;
  // botões → teclas (premidas só no momento em que se carrega)
  for (let i = 0; i < g.buttons.length; i++) {
    const agora = b(i), antes = !!comando.ant[i];
    const k = tabela[i];
    if (k) { if (agora && !antes) premidas[k] = true; if (agora !== antes) teclas[k] = agora; }
    comando.ant[i] = agora;
  }
  if (noJogo) {
    comando.atacar = b(0);
    const f = Math.min(1, Math.hypot(lx, ly));
    comando.mov = f ? { x: lx / f, y: ly / f, forca: clamp((f - ZONA_MORTA) / 0.6, 0.4, 1) } : null;
    if (Math.hypot(rx, ry) > 0.4) { const l = Math.hypot(rx, ry); comando.mira = [rx / l, ry / l]; comando.miraT = performance.now(); }
  } else {
    comando.mov = null; comando.atacar = false;
    // cursor: stick esquerdo ou direito; A carrega
    const cx = lx || rx, cy = ly || ry;
    if (cx || cy) {
      rato.x = clamp(rato.x + cx * 760 * dt, -MARGEM_X, LARGURA + MARGEM_X - 1);
      rato.y = clamp(rato.y + cy * 760 * dt, 0, ALTURA - 1);
      rato.movido = performance.now();
    }
    if (b(0) && !comando.antA) { premidas.rato = true; rato.baixo = true; }
    if (!b(0) && comando.antA) rato.baixo = false;
  }
  comando.antA = b(0);
}

// Para onde aponta o comando (stick direito há menos de 1 s); null se não estiver a apontar
const miraComando = () => (comando.ativo && comando.mira && performance.now() - comando.miraT < 1000 ? comando.mira : null);

// Vibração do comando (quando o jogo vibra o telemóvel)
function vibrarComando(ms) {
  const g = comando.ativo && comandoLigado();
  const v = g && g.vibrationActuator;
  if (!v || !v.playEffect) return;
  const d = Array.isArray(ms) ? ms.reduce((a, x, i) => (i % 2 ? a : a + x), 0) : ms;
  try { v.playEffect('dual-rumble', { duration: Math.min(600, d || 80), strongMagnitude: 0.6, weakMagnitude: 0.4 }); } catch (e) { /* sem vibração */ }
}

// Cursor nos menus quando se joga com comando
function desenharCursorComando() {
  if (!comando.ativo || estado === 'jogo' || (estado === 'convidado' && coop.menu === 'jogo')) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, MARGEM_X + rato.x, rato.y);
  ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#15101e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(11, 26); ctx.lineTo(15, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 15); ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.restore();
}
