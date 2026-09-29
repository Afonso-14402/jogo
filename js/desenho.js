'use strict';
// =====================================================================
//  DESENHO
//  O mundo é desenhado num buffer com metade da resolução (480x320) e
//  depois ampliado 2x sem suavização: é isso que dá o aspeto pixel art.
//  O HUD e os textos são desenhados por cima, à resolução normal.
// =====================================================================

const FONTE = '"Tiny5", "Segoe UI", "Trebuchet MS", Arial, sans-serif';
const fonte = (tam, peso = 'bold') => `${peso} ${tam}px ${FONTE}`;
try { if (document.fonts) { document.fonts.load(fonte(16)); document.fonts.load(fonte(16, 'normal')); } } catch (e) { /* ignora */ }

const LB = LARGURA / ESCALA, AB = ALTURA / ESCALA;
const bufMundo = document.createElement('canvas');
bufMundo.width = LB; bufMundo.height = AB;
const ctxMundo = bufMundo.getContext('2d');
const bufLuz = document.createElement('canvas');
bufLuz.width = LB; bufLuz.height = AB;
const ctxLuz = bufLuz.getContext('2d');
const vista = { x: 0, y: 0 }; // canto superior esquerdo da câmara (com tremor), em pixels do mundo

const NOME_TIPO = { arma: 'Arma', armadura: 'Armadura', amuleto: 'Amuleto' };

// ---------------------------------------------------------------------
//  Texto e painéis (ecrã)
// ---------------------------------------------------------------------
function textoCentro(txt, x, y, tam, cor, contorno = true) {
  ctx.font = fonte(tam);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (contorno) {
    ctx.lineWidth = Math.max(3, tam / 5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(txt, x, y);
  }
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
}

function textoCentroAjustado(txt, x, y, tamMax, cor, larguraMax, contorno = true) {
  let tam = tamMax;
  ctx.font = fonte(tam);
  while (tam > 9 && ctx.measureText(txt).width > larguraMax) { tam--; ctx.font = fonte(tam); }
  textoCentro(txt, x, y, tam, cor, contorno);
}

function textoEsq(txt, x, y, tam, cor, peso = 'bold') {
  ctx.font = fonte(tam, peso);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
}

function textoDir(txt, x, y, tam, cor, peso = 'bold') {
  ctx.font = fonte(tam, peso);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
}

// Painel com moldura "pixel": borda dura de 2px e sombra por fora
function painel(x, y, w, h, cor = 'rgba(14,11,22,0.9)', borda = '#5a4d74') {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = borda;
  ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x, y, 2, h); ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x + 2, y + 2, w - 4, 2);
}

function barra(x, y, w, h, frac, cor, fundo = '#2a2030') {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#000000';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = fundo;
  ctx.fillRect(x, y, w, h);
  const fw = Math.round(w * clamp(frac, 0, 1));
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, fw, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y, fw, Math.max(2, Math.floor(h / 4)));
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x, y + h - 2, fw, 2);
}

// Desenha um sprite ampliado num número inteiro de vezes (ecrã)
function sprEcra(c, x, y, escala, centro = true) {
  const w = c.width * escala, h = c.height * escala;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, Math.round(centro ? x - w / 2 : x), Math.round(centro ? y - h / 2 : y), w, h);
}

function desenharIcone(item, x, y, tam) {
  const esc = Math.max(1, Math.round(tam / 16));
  const ordem = RARIDADES[item.r].ordem;
  if (ordem >= 4) { ctx.save(); ctx.shadowColor = RARIDADES[item.r].cor; ctx.shadowBlur = 14; }
  sprEcra(iconeItem(item), x, y, esc);
  if (ordem >= 4) ctx.restore();
}

function iconePerk(p, x, y, r) {
  const raio = r <= 12 ? 6 : 12;
  const bola = bolaPerk(p.cor, raio);
  const esc = Math.max(1, Math.round((r * 2 + 2) / bola.width));
  sprEcra(bola, x, y, esc);
  if (p.unica) {
    ctx.fillStyle = '#ffe14d';
    ctx.fillRect(Math.round(x + r - 4), Math.round(y - r), 4, 4);
  }
  ctx.font = fonte(Math.round(r * 1.1));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#15101e';
  ctx.fillText(p.letra, x, y + 1);
}

function linhasItem(it) {
  const pct = v => `${Math.round(v * 100)}%`;
  const l = [];
  if (it.tipo === 'arma') {
    l.push(`Dano: ${it.dano}`, `Velocidade: ${it.vel}x`, `Alcance: ${it.alcance}`, `Crítico: +${pct(it.crit)}`);
  } else if (it.tipo === 'armadura') {
    l.push(`Defesa: ${it.def}`, `Vida: ${it.hp >= 0 ? '+' : ''}${it.hp}`);
  } else {
    if (it.crit) l.push(`Crítico: +${pct(it.crit)}`);
    if (it.velMov) l.push(`Velocidade: ${it.velMov > 0 ? '+' : ''}${pct(it.velMov)}`);
    if (it.roubo) l.push(`Roubo de vida: ${pct(it.roubo)}`);
    if (it.regen) l.push(`Regeneração: ${it.regen}/s`);
    if (it.danoPct) l.push(`Dano: +${pct(it.danoPct)}`);
    if (!l.length) l.push('Não faz absolutamente nada.');
  }
  return l;
}

// ---------------------------------------------------------------------
//  Mundo (tudo isto é desenhado no buffer de pixel art)
// ---------------------------------------------------------------------
const alinhar = v => Math.round(v / ESCALA) * ESCALA;

// sprite centrado em (x, y), em coordenadas do mundo
function spr(c, x, y, flip = false) {
  const w = c.width * ESCALA, h = c.height * ESCALA;
  const dx = alinhar(x - w / 2), dy = alinhar(y - h / 2);
  if (flip) {
    ctx.save();
    ctx.translate(dx + w, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(c, 0, 0, w, h);
    ctx.restore();
  } else ctx.drawImage(c, dx, dy, w, h);
}

function sprCor(c, x, y, flip, cor, alpha) {
  ctx.globalAlpha = alpha;
  spr(silhueta(c, cor), x, y, flip);
  ctx.globalAlpha = 1;
}

function sombra(x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(alinhar(x), alinhar(y), Math.max(4, r), Math.max(2, r * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
}

function circulo(x, y, r, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(alinhar(x), alinhar(y), Math.max(2, r), 0, Math.PI * 2);
  ctx.fill();
}

function aro(x, y, r, cor, largura = 4) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.beginPath();
  ctx.arc(alinhar(x), alinhar(y), r, 0, Math.PI * 2);
  ctx.stroke();
}

function barraMundo(x, y, w, frac, cor) {
  x = alinhar(x); y = alinhar(y);
  ctx.fillStyle = '#000000';
  ctx.fillRect(x - 2, y - 2, w + 4, 8);
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, alinhar(w * clamp(frac, 0, 1)), 4);
}

function desenhar(t) {
  ctxTela.imageSmoothingEnabled = false;
  ctxTela.fillStyle = '#07060a';
  ctxTela.fillRect(0, 0, LARGURA, ALTURA);
  ctx = ctxTela;
  if (estado === 'titulo') { desenharTitulo(t); return; }

  const sx = tremor > 0 ? rand(-tremor, tremor) : 0;
  const sy = tremor > 0 ? rand(-tremor, tremor) : 0;
  vista.x = alinhar(cam.x - sx);
  vista.y = alinhar(cam.y - sy);

  ctx = ctxMundo;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, 0, LB, AB);
  ctx.setTransform(1 / ESCALA, 0, 0, 1 / ESCALA, -vista.x / ESCALA, -vista.y / ESCALA);
  desenharMundo(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  desenharLuz(t);

  ctx = ctxTela;
  ctx.drawImage(bufMundo, 0, 0, LARGURA, ALTURA);
  desenharTextosMundo();
  desenharHUD(t);

  if (estado === 'bau') desenharRoleta(t);
  else if (estado === 'nivel') desenharEscolha(t);
  else if (estado === 'loja') desenharLoja(t);
  else if (estado === 'personagem') desenharPersonagem();
  else if (estado === 'pausa') desenharPausa();
  else if (estado === 'morto') desenharMorte();
}

function desenharMundo(t) {
  ctx.drawImage(mapaImg, 0, 0, mapa.W * TILE, mapa.H * TILE);
  desenharSalas();
  for (const a of armadilhas) desenharArmadilha(a);
  desenharEscada(t);
  for (const p of perigos) desenharPerigo(p);
  for (const d of drops) desenharDrop(d);
  for (const tc of mapa.tochas) spr(SPR.tocha[Math.floor(t * 6 + tc.x) % 2], tc.x, tc.y);

  // tudo o que tem "altura" é ordenado pela posição vertical
  const lista = [];
  for (const b of baus) lista.push({ y: b.y, f: () => desenharBau(b) });
  for (const o of objetos) lista.push({ y: o.y, f: () => desenharObjeto(o, t) });
  for (const e of inimigos) if (!e.morto) lista.push({ y: e.y, f: () => desenharInimigo(e, t) });
  if (estado !== 'morto') lista.push({ y: J.y, f: () => desenharJogador(t) });
  lista.sort((a, b) => a.y - b.y);
  for (const it of lista) it.f();

  for (const p of projeteis) desenharProjetil(p, t);
  for (const r of raios) {
    ctx.strokeStyle = `rgba(255,240,120,${Math.min(1, r.t * 4)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    for (let k = 1; k < 6; k++) {
      const f = k / 6;
      ctx.lineTo(alinhar(r.x1 + (r.x2 - r.x1) * f + rand(-8, 8)), alinhar(r.y1 + (r.y2 - r.y1) * f + rand(-8, 8)));
    }
    ctx.lineTo(r.x2, r.y2);
    ctx.stroke();
  }
  for (const p of particulas) {
    ctx.globalAlpha = clamp(p.t * 2, 0, 1);
    ctx.fillStyle = p.cor;
    const tam = Math.max(2, alinhar(p.tam));
    ctx.fillRect(alinhar(p.x - tam / 2), alinhar(p.y - tam / 2), tam, tam);
  }
  ctx.globalAlpha = 1;
  desenharNevoa();
}

// Escuridão com "furos" de luz: a tua tocha, as tochas nas paredes e alguns objetos
function desenharLuz(t) {
  const L = ctxLuz;
  L.globalCompositeOperation = 'source-over';
  L.clearRect(0, 0, LB, AB);
  L.fillStyle = `rgba(3,2,8,${mapa.eBoss ? 0.55 : 0.88})`;
  L.fillRect(0, 0, LB, AB);
  L.globalCompositeOperation = 'destination-out';
  const luz = (x, y, r, forca) => {
    const bx = (x - vista.x) / ESCALA, by = (y - vista.y) / ESCALA, br = r / ESCALA;
    if (bx < -br || by < -br || bx > LB + br || by > AB + br) return;
    const g = L.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, `rgba(0,0,0,${forca})`);
    g.addColorStop(0.5, `rgba(0,0,0,${forca * 0.8})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    L.fillStyle = g;
    L.fillRect(bx - br, by - br, br * 2, br * 2);
  };
  luz(J.x, J.y, 330 + Math.sin(t * 7) * 6, 1);
  for (const tc of mapa.tochas) luz(tc.x, tc.y + 20, 150 + Math.sin(t * 9 + tc.x) * 8, 0.85);
  for (const o of objetos) {
    if (o.tipo === 'cristal') luz(o.x, o.y, 110, o.fase === 'feito' ? 0.3 : 0.8);
    else if (o.tipo === 'altar' && !o.usado) luz(o.x, o.y, 110, 0.7);
    else if (o.tipo === 'mercador') luz(o.x, o.y, 130, 0.8);
  }
  for (const b of baus) if (b.tipo === 'ouro') luz(b.x, b.y, 90, 0.7);
  for (const p of projeteis) if (p.tipo === 'fogo' || p.dono === 'jogador') luz(p.x, p.y, 50, 0.5);
  if (mapa.escada.ativa) luz(mapa.escada.x, mapa.escada.y, 80, 0.5);
  L.globalCompositeOperation = 'source-over';
  ctxMundo.drawImage(bufLuz, 0, 0);

  // brilho quente das tochas
  ctxMundo.globalCompositeOperation = 'lighter';
  for (const tc of mapa.tochas) {
    const bx = (tc.x - vista.x) / ESCALA, by = (tc.y + 10 - vista.y) / ESCALA;
    if (bx < -40 || by < -40 || bx > LB + 40 || by > AB + 40) continue;
    const g = ctxMundo.createRadialGradient(bx, by, 0, bx, by, 34);
    g.addColorStop(0, 'rgba(255,140,40,0.16)');
    g.addColorStop(1, 'rgba(255,140,40,0)');
    ctxMundo.fillStyle = g;
    ctxMundo.fillRect(bx - 34, by - 34, 68, 68);
  }
  ctxMundo.globalCompositeOperation = 'source-over';
}

function desenharNevoa() {
  const x0 = Math.max(0, Math.floor(vista.x / TILE) - 1), y0 = Math.max(0, Math.floor(vista.y / TILE) - 1);
  const x1 = Math.min(mapa.W - 1, x0 + Math.ceil(LARGURA / TILE) + 2), y1 = Math.min(mapa.H - 1, y0 + Math.ceil(ALTURA / TILE) + 2);
  ctx.fillStyle = '#07060a';
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (!mapa.explorado[y * mapa.W + x]) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
}

function desenharSalas() {
  for (const s of mapa.salas) {
    if (!s.tipo) continue;
    const cor = SALAS_ESPECIAIS[s.tipo].cor;
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = cor;
    ctx.fillRect(s.x * TILE, s.y * TILE, s.w * TILE, s.h * TILE);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(s.x * TILE, s.y * TILE, s.w * TILE, 2);
    ctx.fillRect(s.x * TILE, (s.y + s.h) * TILE - 2, s.w * TILE, 2);
    ctx.fillRect(s.x * TILE, s.y * TILE, 2, s.h * TILE);
    ctx.fillRect((s.x + s.w) * TILE - 2, s.y * TILE, 2, s.h * TILE);
    ctx.globalAlpha = 1;
  }
}

function desenharArmadilha(a) {
  if (a.tipo === 'espinhos') {
    ctx.drawImage(SPR.espinhos[a.estado], a.tx * TILE, a.ty * TILE, TILE, TILE);
    return;
  }
  if (!mapa.explorado[(a.ty + a.dy) * mapa.W + a.tx + a.dx]) return;
  const x = a.tx * TILE, y = a.ty * TILE;
  let rx, ry, rw, rh;
  if (a.dx === 1) { rx = x + TILE - 8; ry = y + 10; rw = 8; rh = 12; }
  else if (a.dx === -1) { rx = x; ry = y + 10; rw = 8; rh = 12; }
  else if (a.dy === 1) { rx = x + 10; ry = y + TILE - 8; rw = 12; rh = 8; }
  else { rx = x + 10; ry = y; rw = 12; rh = 8; }
  ctx.fillStyle = '#8a93a8';
  ctx.fillRect(rx - 2, ry - 2, rw + 4, rh + 4);
  ctx.fillStyle = '#07060a';
  ctx.fillRect(rx, ry, rw, rh);
}

function desenharEscada(t) {
  const e = mapa.escada;
  if (!mapa.explorado[Math.floor(e.y / TILE) * mapa.W + Math.floor(e.x / TILE)]) return;
  if (!e.ativa) {
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
    aro(e.x, e.y, 22, '#ff3c3c', 4);
    aro(e.x, e.y, 12, '#ff3c3c', 2);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.drawImage(SPR.escada, e.x - TILE / 2 - 6, e.y - TILE / 2 - 6, TILE + 12, TILE + 12);
  ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
  ctx.strokeStyle = '#ffe680';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - TILE / 2 - 6, e.y - TILE / 2 - 6, TILE + 12, TILE + 12);
  ctx.globalAlpha = 1;
}

function desenharPerigo(p) {
  const f = 1 - p.t / p.dur;
  const cor = p.cor || '#ff5a28';
  ctx.globalAlpha = 0.18 + f * 0.25;
  circulo(p.x, p.y, alinhar(p.r * f), cor);
  ctx.globalAlpha = 0.9;
  aro(p.x, p.y, p.r, cor, 2);
  ctx.globalAlpha = 1;
  if (f > 0.4 && cor !== '#ff3b3b') { // algo a cair do teto
    const q = (f - 0.4) / 0.6;
    const y = p.y - (1 - q) * 160;
    circulo(p.x, y, 10, cor === '#a89f91' ? '#6d665c' : '#ff9b45');
    circulo(p.x - 2, y - 2, 5, cor === '#a89f91' ? '#a89f91' : '#ffe14d');
  }
}

function desenharDrop(d) {
  const bob = Math.sin(d.t * 4) * 3;
  if (d.tipo === 'pocao') { sombra(d.x, d.y + 10, 7); spr(SPR.pocao, d.x, d.y + bob); return; }
  const n = d.valor >= 10 ? 3 : d.valor >= 4 ? 2 : 1;
  for (let i = 0; i < n; i++) spr(SPR.moeda, d.x + (i - (n - 1) / 2) * 8, d.y - i * 4 + bob);
}

function desenharBau(b) {
  const y = b.y + Math.sin(b.t * 2) * 1.5;
  sombra(b.x, b.y + 12, 14);
  spr(SPR.bau[b.tipo], b.x, y);
  if (b.tipo === 'ouro' && Math.floor(b.t * 3) % 4 === 0) {
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(alinhar(b.x + 10), alinhar(y - 14), 2, 6);
    ctx.fillRect(alinhar(b.x + 8), alinhar(y - 12), 6, 2);
  }
}

function desenharObjeto(o, t) {
  if (o.tipo === 'mercador') {
    sombra(o.x, o.y + 16, 12);
    spr(SPR.mercador, o.x, o.y - 2);
    spr(SPR.moeda, o.x, o.y - 38 + Math.sin(t * 3) * 3);
  } else if (o.tipo === 'altar') {
    spr(o.usado ? SPR.altarUsado : SPR.altar, o.x, o.y);
    if (!o.usado && Math.floor(t * 8) % 2) {
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(alinhar(o.x - 30), alinhar(o.y - 16), 2, 2);
      ctx.fillRect(alinhar(o.x + 28), alinhar(o.y - 16), 2, 2);
    }
  } else if (o.tipo === 'cristal') {
    const bob = o.fase === 'feito' ? 0 : Math.sin(t * 2) * 3;
    spr(SPR.cristal[o.fase], o.x, o.y - 8 + bob);
    if (o.fase === 'ativo') sprCor(SPR.cristal.ativo, o.x, o.y - 8 + bob, false, '#ffffff', 0.25 + Math.sin(t * 10) * 0.2);
  }
}

function desenharJogador(t) {
  const piscar = J.invuln > 0 && Math.floor(J.invuln * 20) % 2 === 0;
  sombra(J.x, J.y + 12, 10);
  let ang = J.angArma;
  if (J.golpe) {
    const p = 1 - J.golpe.t / J.golpe.dur;
    const volta = J.golpe.giro ? Math.PI * 2 : 2.4;
    const inicio = J.golpe.giro ? J.golpe.ang : J.golpe.ang - 1.2;
    ang = inicio + p * volta;
    ctx.strokeStyle = J.golpe.giro ? '#ffae00' : RARIDADES[J.arma.r].cor;
    ctx.globalAlpha = 0.5 * (1 - p) + 0.15;
    ctx.lineWidth = J.golpe.giro ? 12 : 8;
    ctx.beginPath();
    ctx.arc(alinhar(J.x), alinhar(J.y), alinhar(J.golpe.alcance - 6), inicio, ang);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const olhaEsq = J.golpe ? Math.cos(ang) < 0 : J.dirX < -0.1;
  const frame = J.andando ? [0, 1, 0, 2][Math.floor(tempoJogo * 8) % 4] : 0;
  const armaAtras = Math.sin(ang) < -0.3;
  if (armaAtras) desenharArma(ang);
  if (piscar) ctx.globalAlpha = 0.4;
  const c = SPR.heroi[frame];
  spr(c, J.x, J.y - 4, olhaEsq);
  if (J.armadura) sprCor(c, J.x, J.y - 4, olhaEsq, RARIDADES[J.armadura.r].cor, 0.18);
  if (J.lentoT > 0) sprCor(c, J.x, J.y - 4, olhaEsq, '#ffffff', 0.4);
  ctx.globalAlpha = 1;
  if (J.amuleto) {
    ctx.fillStyle = RARIDADES[J.amuleto.r].cor;
    ctx.fillRect(alinhar(J.x - 2), alinhar(J.y + 2), 4, 4);
  }
  if (!armaAtras) desenharArma(ang);
  if (nPerk('escudo') > 0 && J.escudoCd <= 0) {
    ctx.globalAlpha = 0.45 + Math.sin(t * 5) * 0.2;
    aro(J.x, J.y - 2, 22, '#fff0a0', 2);
    ctx.globalAlpha = 1;
  }
}

function desenharArma(ang) {
  const icon = iconeItem(J.arma);
  ctx.save();
  ctx.translate(alinhar(J.x + Math.cos(ang) * 8), alinhar(J.y + 2 + Math.sin(ang) * 6));
  ctx.rotate(ang + Math.PI / 4);
  ctx.drawImage(icon, -6, -26, 32, 32);
  ctx.restore();
}

function spriteInimigo(e, t) {
  switch (e.tipo) {
    case 'slime': {
      const pulo = e.acordado && e.t % 1.1 < 0.45;
      return { c: SPR.slime[pulo ? 0 : 1], y: pulo ? -Math.sin((e.t % 1.1) / 0.45 * Math.PI) * 10 : 0 };
    }
    case 'morcego': return { c: SPR.morcego[Math.floor(e.t * 10) % 2], y: -10 + Math.sin(e.t * 6) * 3, voa: true };
    case 'esqueleto': return { c: SPR.esqueleto[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 9)) * 3 : 0, flip: J.x < e.x };
    case 'orc': return { c: SPR.orc[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 8)) * 3 : 0 };
    case 'fantasma': return { c: SPR.fantasma[Math.floor(e.t * 2.5) % 2], y: -6 + Math.sin(e.t * 2) * 4, alpha: 0.75, voa: true };
    case 'aranha': return { c: SPR.aranha[Math.floor(e.t * 10) % 2], y: 0 };
    case 'mimico': return { c: SPR.mimico[Math.floor(e.t * 8) % 2], y: 0 };
    case 'reiSlime': return { c: SPR.reiSlime[e.salto > 0 ? 0 : Math.floor(t * 1.5) % 2], y: -e.z };
    case 'lich': return { c: SPR.lich[0], y: Math.sin(t * 2) * 4 };
    case 'dragao': return { c: SPR.dragao[0], y: 0 };
    case 'golem': return { c: SPR.golem[e.pisao > 0 ? 1 : 0], y: 0 };
    case 'rainha': return { c: SPR.rainha[Math.floor(e.t * 6) % 2], y: -e.z };
    case 'demonio': return { c: SPR.demonio[0], y: Math.sin(t * 3) * 3 };
  }
  return { c: SPR.slime[0], y: 0 };
}

function desenharInimigo(e, t) {
  const s = spriteInimigo(e, t);
  const h = s.c.height * ESCALA;
  sombra(e.x, e.y + (e.boss ? h * 0.4 : e.r * 0.8), e.boss ? e.r * 0.9 : e.r * (s.voa ? 0.6 : 0.9));
  const x = e.x, y = e.y + s.y;
  const flip = !!s.flip;

  // avisos dos bosses
  if (e.tipo === 'reiSlime' && e.salto > 0) {
    const f = 1 - e.salto / e.duracaoSalto;
    aro(e.x + e.svx * e.salto, e.y + e.svy * e.salto, e.r * (0.4 + f * 0.6), 'rgba(255,60,60,0.8)', 2);
  }
  if (e.tipo === 'golem' && e.pisao > 0) {
    ctx.globalAlpha = 0.25 + (1 - e.pisao / 0.8) * 0.35;
    circulo(e.x, e.y, 150, '#ff3c3c');
    ctx.globalAlpha = 1;
  }
  if (e.tipo === 'orc' && e.preparar > 0) sprCor(s.c, x, y, flip, '#ff3c3c', 0.6);

  if (e.elite) {
    const cor = ELITES[e.elite].cor;
    ctx.globalAlpha = 0.55 + Math.sin(t * 6) * 0.25;
    const sil = silhueta(s.c, cor);
    for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) spr(sil, x + ox, y + oy, flip);
    ctx.globalAlpha = 1;
  }
  if (s.alpha) ctx.globalAlpha = s.alpha;
  spr(s.c, x, y, flip);
  ctx.globalAlpha = 1;
  if (e.tipo === 'dragao' && e.investida > 0) sprCor(s.c, x, y, flip, '#ff7b25', 0.35);
  if (e.tipo === 'demonio' && e.aparecer > 0) sprCor(s.c, x, y, flip, '#ffffff', 0.5);
  if (e.flash > 0) sprCor(s.c, x, y, flip, '#ffffff', 0.85);
  else if (e.lento > 0) sprCor(s.c, x, y, flip, '#7fd8ff', 0.4);
  else if (e.queima > 0) sprCor(s.c, x, y, flip, '#ff7b25', 0.3);

  if (e.tipo === 'dragao' && e.sopro > 0) {
    const ang = Math.atan2(J.y - e.y, J.x - e.x);
    circulo(e.x + Math.cos(ang) * 30, e.y - 20 + Math.sin(ang) * 30, 8 + Math.random() * 4, '#ff9b45');
  }
  if (!e.boss && (e.hp < e.maxHp || e.elite)) {
    barraMundo(e.x - 16, y - h / 2 - 10, 32, e.hp / e.maxHp, e.elite ? ELITES[e.elite].cor : '#ff4d4d');
  }
}

function desenharProjetil(p, t) {
  const x = p.x, y = p.y;
  if (p.tipo === 'flecha') {
    const a = Math.atan2(p.vy, p.vx);
    ctx.strokeStyle = '#d8c9a3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(alinhar(x - Math.cos(a) * 12), alinhar(y - Math.sin(a) * 12));
    ctx.lineTo(alinhar(x + Math.cos(a) * 6), alinhar(y + Math.sin(a) * 6));
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(alinhar(x + Math.cos(a) * 6) - 2, alinhar(y + Math.sin(a) * 6) - 2, 4, 4);
  } else if (p.tipo === 'lamina') {
    const a = p.vida * 25;
    ctx.fillStyle = p.cor;
    for (let k = 0; k < 3; k++) {
      const b = a + k * Math.PI * 2 / 3;
      ctx.fillRect(alinhar(x + Math.cos(b) * 6) - 2, alinhar(y + Math.sin(b) * 6) - 2, 4, 4);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(alinhar(x) - 2, alinhar(y) - 2, 4, 4);
  } else if (p.tipo === 'teia') {
    ctx.strokeStyle = '#e8e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 4 + t * 3;
      ctx.moveTo(alinhar(x - Math.cos(a) * 9), alinhar(y - Math.sin(a) * 9));
      ctx.lineTo(alinhar(x + Math.cos(a) * 9), alinhar(y + Math.sin(a) * 9));
    }
    ctx.stroke();
  } else if (p.tipo === 'rocha') {
    circulo(x, y, p.r + 2, CONTORNO);
    circulo(x, y, p.r, p.cor);
    circulo(x - p.r / 3, y - p.r / 3, p.r / 3, clarear(p.cor, 0.3));
  } else if (p.tipo === 'fogo') {
    circulo(x, y, p.r + (Math.random() < 0.5 ? 2 : 0), '#ff5a1a');
    circulo(x, y, p.r * 0.5, '#ffe14d');
  } else {
    circulo(x, y, p.r + 2, escurecer(p.cor.startsWith('#') ? p.cor : '#ffffff', 0.5));
    circulo(x, y, p.r, p.cor);
    circulo(x, y, Math.max(2, p.r * 0.4), '#ffffff');
  }
}

function desenharTextosMundo() {
  for (const tx of textos) {
    ctx.globalAlpha = clamp(tx.t * 2, 0, 1);
    textoCentro(tx.txt, tx.x - vista.x, tx.y - vista.y, tx.tam, tx.cor);
  }
  ctx.globalAlpha = 1;
  // nomes dos inimigos de elite
  for (const e of inimigos) {
    if (!e.elite || e.morto) continue;
    const sx = e.x - vista.x, sy = e.y - vista.y - 44;
    if (sx < -50 || sy < -20 || sx > LARGURA + 50 || sy > ALTURA + 20) continue;
    textoCentro(`Elite ${ELITES[e.elite].nome}`, sx, sy, 12, ELITES[e.elite].cor);
  }
}

// ---------------------------------------------------------------------
//  HUD
// ---------------------------------------------------------------------
function desenharHUD(t) {
  painel(10, 10, 280, 96);
  textoEsq(`Nv ${J.nivel}`, 22, 28, 20, '#ffe14d');
  textoEsq(`ATK ${S.dano}  DEF ${S.def}  CRIT ${Math.round(S.crit * 100)}%`, 84, 28, 13, '#cfc6e0');
  barra(22, 44, 256, 18, J.hp / S.maxHp, J.hp / S.maxHp < 0.3 ? '#ff2d2d' : '#e0413e');
  textoCentro(`${Math.ceil(J.hp)} / ${S.maxHp}`, 150, 53, 13, '#fff');
  barra(22, 72, 256, 8, J.xp / xpProximo(J.nivel), '#3d9bff');
  textoEsq(`XP ${J.xp}/${xpProximo(J.nivel)}`, 22, 94, 12, '#9fc8ff', 'normal');
  sprEcra(SPR.moeda, 200, 94, 3);
  textoEsq(`${J.ouro}`, 214, 94, 15, '#ffd23f');

  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  obtidas.forEach((p, i) => {
    const x = 26 + (i % 10) * 28, y = 126 + Math.floor(i / 10) * 28;
    iconePerk(p, x, y, 12);
    if (nPerk(p.id) > 1) textoCentro(`${nPerk(p.id)}`, x + 10, y + 9, 11, '#fff');
  });

  desenharMinimapa();

  // equipamento
  const slots = [['arma', 'Arma'], ['armadura', 'Armadura'], ['amuleto', 'Amuleto']];
  const by = ALTURA - 84;
  painel(10, by - 10, 350, 86);
  slots.forEach(([k, nome], i) => {
    const x = 20 + i * 66;
    const it = J[k];
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, by, 58, 58);
    ctx.fillStyle = it ? RARIDADES[it.r].cor : 'rgba(255,255,255,0.2)';
    ctx.fillRect(x, by, 58, 2); ctx.fillRect(x, by + 56, 58, 2); ctx.fillRect(x, by, 2, 58); ctx.fillRect(x + 56, by, 2, 58);
    if (it) desenharIcone(it, x + 29, by + 29, 48);
    else textoCentro('—', x + 29, by + 27, 16, '#666', false);
    textoCentro(nome, x + 29, by + 68, 11, '#aaa', false);
  });
  const px = 20 + 3 * 66;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(px, by, 58, 58);
  sprEcra(SPR.pocao, px + 29, by + 28, 4);
  textoCentro(`x${J.pocoes}`, px + 44, by + 48, 14, '#fff');
  textoCentro('[Q] Poção', px + 29, by + 68, 11, '#aaa', false);
  const dx = 20 + 4 * 66;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(dx, by, 58, 58);
  const pronto = J.cdDash <= 0;
  if (!pronto) {
    ctx.fillStyle = 'rgba(120,170,255,0.25)';
    const f = clamp(J.cdDash / S.cdDash, 0, 1);
    ctx.fillRect(dx, by + Math.round(58 * (1 - f)), 58, Math.round(58 * f));
  }
  textoCentro('»»', dx + 29, by + 28, 24, pronto ? '#78aaff' : '#556');
  textoCentro('[Shift] Dash', dx + 29, by + 68, 11, '#aaa', false);

  slots.forEach(([k], i) => {
    const x = 20 + i * 66;
    if (J[k] && rato.x > x && rato.x < x + 58 && rato.y > by && rato.y < by + 58) desenharCartaItem(J[k], x, by - 200, 'Equipado');
  });

  if (boss && !boss.morto) {
    const w = 340, x = (LARGURA - w) / 2;
    painel(x - 10, 12, w + 20, 52, 'rgba(30,4,8,0.88)', '#8a2a2a');
    textoCentro(boss.nome + (boss.fase2 ? ' (Enfurecido)' : ''), LARGURA / 2, 28, 16, '#ff8080');
    barra(x, 42, w, 12, boss.hp / boss.maxHp, '#c0392b', '#300');
  }

  if (estado === 'jogo') {
    if (J.bauPerto) desenharInfoBau(J.bauPerto);
    else if (J.objPerto) desenharInfoObjeto(J.objPerto);
    else if (J.escadaPerto) {
      const sx = mapa.escada.x - vista.x, sy = mapa.escada.y - vista.y - 40;
      if (mapa.escada.ativa) textoCentro('[E] Descer', sx, sy, 16, '#ffe680');
      else textoCentro('Derrota o boss para abrir', sx, sy, 14, '#ff8080');
    }
  }

  if (banner && estado === 'jogo') {
    const a = clamp(Math.min(banner.t, 3 - banner.t) * 2, 0, 1);
    ctx.globalAlpha = a;
    textoCentro(banner.titulo, LARGURA / 2, 170, 40, banner.cor);
    if (banner.sub) textoCentro(banner.sub, LARGURA / 2, 210, 18, '#ddd');
    ctx.globalAlpha = 1;
  }

  textoDir(`[C] Personagem   [M] Som: ${somLigado ? 'ligado' : 'desligado'}`, LARGURA - 16, ALTURA - 14, 12, 'rgba(255,255,255,0.45)', 'normal');
}

function desenharMinimapa() {
  const esc = 3;
  const w = mapa.W * esc, h = mapa.H * esc;
  const x0 = LARGURA - w - 16, y0 = 40;
  painel(x0 - 6, 10, w + 12, h + 40);
  textoCentro(`ANDAR ${andar}`, x0 + w / 2, 25, 15, '#ffe14d');
  for (let y = 0; y < mapa.H; y++) {
    for (let x = 0; x < mapa.W; x++) {
      if (!mapa.explorado[y * mapa.W + x] || !mapa.tiles[y * mapa.W + x]) continue;
      ctx.fillStyle = 'rgba(200,190,230,0.35)';
      ctx.fillRect(x0 + x * esc, y0 + y * esc, esc, esc);
    }
  }
  for (const s of mapa.salas) {
    if (!s.tipo || !mapa.explorado[(s.y + 1) * mapa.W + s.x + 1]) continue;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = SALAS_ESPECIAIS[s.tipo].cor;
    ctx.fillRect(x0 + s.x * esc, y0 + s.y * esc, s.w * esc, s.h * esc);
    ctx.globalAlpha = 1;
  }
  const vis = (px, py) => mapa.explorado[Math.floor(py / TILE) * mapa.W + Math.floor(px / TILE)];
  const ponto = (px, py, cor, tam) => { ctx.fillStyle = cor; ctx.fillRect(Math.round(x0 + px / TILE * esc - tam / 2), Math.round(y0 + py / TILE * esc - tam / 2), tam, tam); };
  if (vis(mapa.escada.x, mapa.escada.y)) ponto(mapa.escada.x, mapa.escada.y, mapa.escada.ativa ? '#ffe680' : '#ff5050', 6);
  for (const b of baus) if (vis(b.x, b.y)) ponto(b.x, b.y, b.tipo === 'ouro' ? '#ffd23f' : '#c98a4a', 4);
  for (const o of objetos) if (vis(o.x, o.y)) ponto(o.x, o.y, o.tipo === 'mercador' ? '#3ddc84' : o.tipo === 'altar' ? '#ff3b3b' : '#b44dff', 6);
  ponto(J.x, J.y, '#5da8ff', 6);
  if (boss) ponto(boss.x, boss.y, '#ff4040', 8);
}

function tabelaChances(tipoBau, x, y, largura) {
  const tb = TIPOS_BAU[tipoBau];
  const chances = chancesBau(tipoBau);
  let yy = y;
  for (const r of ORDEM_RARIDADES) {
    const info = RARIDADES[r];
    const v = chances[r];
    const pct = Math.abs(v - Math.round(v)) < 0.05 ? Math.round(v) : v.toFixed(1);
    ctx.fillStyle = info.cor;
    ctx.fillRect(x, yy - 5, 10, 10);
    textoEsq(info.nome, x + 16, yy, 13, info.cor);
    textoDir(`${pct}%`, x + largura, yy, 13, '#fff');
    yy += 19;
  }
  if (tb.mimico > 0) {
    ctx.fillStyle = '#ff6060';
    ctx.fillRect(x, yy - 5, 10, 10);
    textoEsq('Mímico', x + 16, yy, 13, '#ff6060');
    textoDir(`${Math.round(tb.mimico * 100)}%`, x + largura, yy, 13, '#fff');
    yy += 19;
  }
  return yy;
}

function desenharInfoBau(b) {
  const tb = TIPOS_BAU[b.tipo];
  let x = b.x - vista.x + 34, y = b.y - vista.y - 90;
  const w = 190, h = (tb.mimico > 0 ? 184 : 165) + (S.sorte > 0 ? 16 : 0);
  x = clamp(x, 10, LARGURA - w - 10);
  y = clamp(y, 110, ALTURA - h - 100);
  painel(x, y, w, h);
  textoCentro(tb.nome, x + w / 2, y + 16, 14, tb.aro);
  let y0 = y + 40;
  if (S.sorte > 0) { textoCentro(`Sorte +${S.sorte} aplicada`, x + w / 2, y + 33, 11, '#3ddc84', false); y0 += 14; }
  const fim = tabelaChances(b.tipo, x + 14, y0, w - 28);
  textoCentro('[E] Abrir', x + w / 2, fim + 4, 15, '#ffe680');
}

function desenharInfoObjeto(o) {
  const sx = o.x - vista.x, sy = o.y - vista.y - 58;
  if (o.tipo === 'mercador') {
    textoCentro('Mercador', sx, sy - 18, 14, '#3ddc84');
    textoCentro('[E] Ver a loja', sx, sy, 15, '#ffe680');
  } else if (o.tipo === 'altar') {
    if (o.usado) textoCentro('O altar já foi usado', sx, sy, 14, '#aaa');
    else {
      textoCentro(`[E] Sacrificar ${Math.round(S.maxHp * 0.35)} de vida`, sx, sy - 18, 15, '#ff8080');
      textoCentro('e receber um Baú Dourado', sx, sy, 13, '#ffd23f');
    }
  } else if (o.tipo === 'cristal') {
    if (o.fase === 'inativo') {
      textoCentro('[E] Começar o desafio', sx, sy - 18, 15, '#ffe680');
      textoCentro('3 ondas de inimigos · prémio: Baú Dourado', sx, sy, 12, '#d9a6ff');
    } else if (o.fase === 'ativo') textoCentro(`Onda ${o.onda}/3`, sx, sy, 15, '#ff6080');
    else textoCentro('Desafio concluído', sx, sy, 14, '#aaa');
  }
}

function desenharCartaItem(it, x, y, cabecalho) {
  const info = RARIDADES[it.r];
  const linhas = linhasItem(it);
  const w = 230, h = 128 + linhas.length * 18 + (it.afixo ? 22 : 0);
  x = clamp(x, 10, LARGURA - w - 10);
  y = clamp(y, 10, ALTURA - h - 10);
  painel(x, y, w, h, 'rgba(12,10,20,0.96)', info.cor);
  if (cabecalho) textoCentro(cabecalho, x + w / 2, y + 14, 11, '#999', false);
  desenharIcone(it, x + w / 2, y + 48, 48);
  textoCentroAjustado(it.nome, x + w / 2, y + 88, 15, info.cor, w - 16);
  textoCentro(`${info.nome} · ${NOME_TIPO[it.tipo]}`, x + w / 2, y + 106, 11, '#bbb', false);
  linhas.forEach((l, i) => textoCentro(l, x + w / 2, y + 126 + i * 18, 13, '#eee', false));
  if (it.afixo) textoCentroAjustado(`+ ${it.afixo.desc}`, x + w / 2, y + 130 + linhas.length * 18, 13, it.afixo.cor, w - 16, false);
  return h;
}

// ---------------------------------------------------------------------
//  Roleta do baú
// ---------------------------------------------------------------------
function desenharRoleta(t) {
  const R = roleta;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  const tb = TIPOS_BAU[R.tipoBau];
  sprEcra(SPR.bau[R.tipoBau], LARGURA / 2 - 190, 44, 3);
  textoCentro(`A abrir: ${tb.nome}`, LARGURA / 2, 44, 26, tb.aro);

  const L = 116, cy = 170, H = 124;
  const cx = LARGURA / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(40, cy - H / 2 - 6, LARGURA - 80, H + 12);
  ctx.clip();
  ctx.fillStyle = '#120e1a';
  ctx.fillRect(40, cy - H / 2 - 6, LARGURA - 80, H + 12);
  for (let i = 0; i < R.faixa.length; i++) {
    const x = Math.round(cx + (i - R.pos) * L);
    if (x < -L || x > LARGURA + L) continue;
    const it = R.faixa[i];
    const info = RARIDADES[it.r];
    ctx.fillStyle = R.fim && i === R.idx ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(x + 3, cy - H / 2, L - 6, H);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = info.cor;
    ctx.fillRect(x + 3, cy + 10, L - 6, H / 2 - 10);
    ctx.globalAlpha = 1;
    ctx.fillStyle = info.cor;
    ctx.fillRect(x + 3, cy + H / 2 - 8, L - 6, 8);
    desenharIcone(it, x + L / 2, cy - 16, 48);
    const nb = it.nomeBase || it.nome;
    textoCentroAjustado(nb, x + L / 2, cy + 30, 12, info.cor, L - 12, false);
    if (it.afixo) textoCentroAjustado(it.afixo.nome, x + L / 2, cy + 45, 11, it.afixo.cor, L - 12, false);
  }
  ctx.restore();
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - H / 2 - 16); ctx.lineTo(cx + 12, cy - H / 2 - 16); ctx.lineTo(cx, cy - H / 2 + 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 12, cy + H / 2 + 16); ctx.lineTo(cx + 12, cy + H / 2 + 16); ctx.lineTo(cx, cy + H / 2 - 2); ctx.fill();
  ctx.fillRect(cx - 2, cy - H / 2, 4, H);

  if (!R.fim) {
    const w = 230, x = (LARGURA - w) / 2, y = 272;
    painel(x, y, w, tb.mimico > 0 ? 190 : 170);
    textoCentro(S.sorte > 0 ? `Probabilidades (Sorte +${S.sorte})` : 'Probabilidades', x + w / 2, y + 18, 14, S.sorte > 0 ? '#3ddc84' : '#ddd');
    tabelaChances(R.tipoBau, x + 18, y + 44, w - 36);
    textoCentro('[E] Saltar animação', LARGURA / 2, ALTURA - 40, 14, '#888', false);
    return;
  }

  const info = RARIDADES[R.premio.r];
  const ordem = info.ordem;
  const msg = ['Que azar... isto é LIXO!', '', '', 'Épico!', 'LENDÁRIO!', 'MÍTICO!!! O MELHOR DO JOGO!'][ordem];
  if (msg) {
    const pulso = 1 + Math.sin(R.brilho * 6) * 0.05;
    ctx.save();
    ctx.translate(LARGURA / 2, 266);
    ctx.scale(pulso, pulso);
    textoCentro(msg, 0, 0, ordem >= 4 ? 30 : 22, info.cor);
    ctx.restore();
  }
  if (ordem >= 4) {
    ctx.save();
    ctx.translate(LARGURA / 2 + 145, 410);
    ctx.rotate(R.brilho);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = info.cor;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, -220); ctx.lineTo(18, -220); ctx.fill();
    }
    ctx.restore();
  }
  const atual = J[R.premio.tipo];
  if (atual) desenharCartaItem(atual, LARGURA / 2 - 260, 296, 'EQUIPADO AGORA');
  else {
    painel(LARGURA / 2 - 260, 296, 230, 150);
    textoCentro('Nada equipado', LARGURA / 2 - 145, 371, 15, '#777', false);
  }
  textoCentro('>', LARGURA / 2, 376, 34, '#fff');
  desenharCartaItem(R.premio, LARGURA / 2 + 30, 296, 'NOVO');
  const xp = info.xpReciclar * andar;
  textoCentro(`[E] Equipar          [X] Vender (+${valorVenda(R.premio)} ouro, +${xp} XP)`, LARGURA / 2, ALTURA - 30, 18, '#ffe680');
}

// ---------------------------------------------------------------------
//  Escolha de melhoria
// ---------------------------------------------------------------------
function desenharEscolha(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  const deLoja = escolha.voltar === 'loja';
  textoCentro(deLoja ? 'PERGAMINHO DE PODER' : 'SUBISTE DE NÍVEL!', LARGURA / 2, 90, 40, '#ffe14d');
  textoCentro(deLoja ? 'Escolhe uma melhoria' : `Nível ${J.nivel} · Escolhe uma melhoria`, LARGURA / 2, 135, 18, '#ddd', false);
  const n = escolha.opcoes.length;
  escolha.opcoes.forEach((p, i) => {
    const r = retCartaPerk(i, n);
    const sobre = rato.x > r.x && rato.x < r.x + r.w && rato.y > r.y && rato.y < r.y + r.h;
    const entrada = clamp(escolha.t * 4 - i * 0.3, 0, 1);
    const y = r.y + (1 - entrada) * 40 - (sobre ? 6 : 0);
    ctx.globalAlpha = entrada;
    painel(r.x, y, r.w, r.h, 'rgba(18,14,28,0.97)', sobre ? '#ffffff' : p.cor);
    textoCentro(`${i + 1}`, r.x + 22, y + 22, 18, '#888', false);
    if (p.unica) textoCentro('ÚNICA', r.x + r.w - 34, y + 22, 12, '#ffe14d', false);
    iconePerk(p, r.x + r.w / 2, y + 82, 36);
    textoCentroAjustado(p.nome, r.x + r.w / 2, y + 148, 20, p.cor, r.w - 20);
    ctx.font = fonte(14, 'normal');
    const linhas = [];
    let linha = '';
    for (const w of p.desc.split(' ')) {
      const tentativa = linha ? linha + ' ' + w : w;
      if (ctx.measureText(tentativa).width > r.w - 30 && linha) { linhas.push(linha); linha = w; } else linha = tentativa;
    }
    if (linha) linhas.push(linha);
    linhas.forEach((l, k) => textoCentro(l, r.x + r.w / 2, y + 182 + k * 20, 14, '#e6e0f0', false));
    if (p.max > 1) textoCentro(`${nPerk(p.id)} / ${p.max}`, r.x + r.w / 2, y + r.h - 24, 13, '#999', false);
    ctx.globalAlpha = 1;
  });
  textoCentro('Carrega 1, 2 ou 3 (ou clica numa carta)', LARGURA / 2, 520, 16, '#aaa', false);
}

// ---------------------------------------------------------------------
//  Loja
// ---------------------------------------------------------------------
function iconeOferta(of, x, y) {
  if (of.id === 'pocao' || of.id === 'cura') {
    sprEcra(SPR.pocao, x, y, 4);
    if (of.id === 'cura') textoCentro('+', x + 14, y - 14, 18, '#5dff7a');
  } else if (of.id === 'madeira' || of.id === 'ouro') sprEcra(SPR.bau[of.id], x, y, 3);
  else if (of.id === 'item') desenharIcone(of.item, x, y, 48);
  else iconePerk({ cor: '#ffae00', letra: '?', unica: false }, x, y, 18);
}

function desenharLoja(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  sprEcra(SPR.mercador, 80, 60, 3);
  textoEsq('Loja do Mercador', 120, 50, 28, '#3ddc84');
  textoEsq('"Tudo tem um preço, aventureiro..."', 120, 80, 14, '#aaa', 'normal');
  sprEcra(SPR.moeda, LARGURA - 190, 58, 5);
  textoEsq(`${J.ouro} ouro`, LARGURA - 168, 58, 24, '#ffd23f');

  const stock = loja.obj.stock;
  stock.forEach((of, i) => {
    const r = retLinhaLoja(i);
    const sel = loja.sel === i;
    const esgotado = of.qtd <= 0;
    const caro = J.ouro < of.preco;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffe680' : '#4a4060');
    textoCentro(`${i + 1}`, r.x + 18, r.y + r.h / 2, 16, '#777', false);
    ctx.globalAlpha = esgotado ? 0.35 : 1;
    iconeOferta(of, r.x + 62, r.y + r.h / 2);
    const cor = of.id === 'item' ? RARIDADES[of.item.r].cor : '#ffffff';
    textoEsq(of.nome.length > 30 ? of.nome.slice(0, 29) + '…' : of.nome, r.x + 100, r.y + 22, 16, cor);
    textoEsq(of.id === 'pocao' ? `Cura ${Math.round(S.curaPocao * 100)}% da vida` : of.desc, r.x + 100, r.y + 42, 12, '#aaa', 'normal');
    ctx.globalAlpha = 1;
    if (esgotado) textoDir('ESGOTADO', r.x + r.w - 14, r.y + r.h / 2, 14, '#777');
    else {
      sprEcra(SPR.moeda, r.x + r.w - 90, r.y + r.h / 2, 3);
      textoDir(`${of.preco}`, r.x + r.w - 14, r.y + r.h / 2, 18, caro ? '#ff6060' : '#ffd23f');
    }
  });

  // detalhe à direita
  const of = stock[loja.sel];
  const dx = 580;
  if (of && of.id === 'item') {
    desenharCartaItem(of.item, dx, 110, 'À VENDA');
    const atual = J[of.item.tipo];
    if (atual) desenharCartaItem(atual, dx, 350, 'EQUIPADO AGORA');
  } else if (of) {
    painel(dx, 110, 340, 200);
    iconeOferta(of, dx + 170, 170);
    textoCentro(of.nome, dx + 170, 232, 20, '#fff');
    textoCentro(of.id === 'pocao' ? `Cura ${Math.round(S.curaPocao * 100)}% da vida máxima` : of.desc, dx + 170, 262, 14, '#bbb', false);
    if (of.id === 'madeira' || of.id === 'ouro') {
      painel(dx, 330, 340, 150);
      textoCentro('Probabilidades', dx + 170, 348, 14, '#ddd');
      const antes = TIPOS_BAU[of.id].mimico;
      TIPOS_BAU[of.id].mimico = 0; // da loja nunca vem um Mímico
      tabelaChances(of.id, dx + 30, 372, 280);
      TIPOS_BAU[of.id].mimico = antes;
    }
  }
  if (loja.msg) textoCentro(loja.msg.txt, LARGURA / 2, 572, 18, loja.msg.cor);
  textoCentro('1-6 ou clique: comprar    ·    E / Esc: sair', LARGURA / 2, ALTURA - 26, 15, '#aaa', false);
}

// ---------------------------------------------------------------------
//  Ecrã de personagem
// ---------------------------------------------------------------------
function desenharPersonagem() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  textoCentro('PERSONAGEM', LARGURA / 2, 34, 30, '#ffe14d');

  // coluna de stats
  painel(20, 64, 300, 540);
  sprEcra(SPR.heroi[0], 62, 112, 4);
  textoEsq(`Nível ${J.nivel}`, 110, 94, 22, '#ffe14d');
  textoEsq(`XP ${J.xp} / ${xpProximo(J.nivel)}`, 110, 118, 13, '#9fc8ff', 'normal');
  sprEcra(SPR.moeda, 116, 140, 3);
  textoEsq(`${J.ouro} ouro`, 130, 140, 14, '#ffd23f');
  const pct = v => `${Math.round(v * 100)}%`;
  const reducao = 1 - 60 / (60 + S.def * 5);
  const linhas = [
    ['Vida', `${Math.ceil(J.hp)} / ${S.maxHp}`],
    ['Dano', `${Math.round(S.dano * (1 + S.danoPct))}`],
    ['Crítico', `${pct(Math.min(1, S.crit))} (dano x2)`],
    ['Ataques/segundo', (1 / S.cdAtaque).toFixed(2)],
    ['Alcance', `${S.alcance}`],
    ['Defesa', `${S.def} (-${pct(reducao)} dano)`],
    ['Velocidade', `${Math.round(S.vel)}`],
    ['Roubo de vida', pct(S.roubo)],
    ['Regeneração', `${S.regen.toFixed(1)}/s`],
    ['Bónus de XP', `+${pct(S.xpMult - 1)}`],
    ['Sorte nos baús', `+${S.sorte}`],
    ['Espinhos', pct(S.espinhos)],
    ['Cura das poções', `${pct(S.curaPocao)} (x${J.pocoes})`],
    ['Recarga do dash', `${S.cdDash.toFixed(2)}s`],
  ];
  linhas.forEach(([k, v], i) => {
    const y = 176 + i * 22;
    if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(28, y - 10, 284, 21); }
    textoEsq(k, 36, y, 14, '#bdb4d0', 'normal');
    textoDir(v, 304, y, 14, '#ffffff');
  });
  const seg = Math.floor(tempoJogo);
  const est = [`Andar ${andar}`, `Inimigos: ${J.kills}`, `Baús: ${J.bausAbertos}`, `Tempo: ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`];
  est.forEach((l, i) => textoEsq(l, 36 + (i % 2) * 140, 504 + Math.floor(i / 2) * 22, 13, '#888', 'normal'));
  if (J.melhorItem) {
    textoEsq('Melhor item:', 36, 562, 13, '#888', 'normal');
    textoEsq(J.melhorItem.nome.length > 26 ? J.melhorItem.nome.slice(0, 25) + '…' : J.melhorItem.nome, 36, 582, 14, RARIDADES[J.melhorItem.r].cor);
  }

  // equipamento
  const slots = ['arma', 'armadura', 'amuleto'];
  slots.forEach((k, i) => {
    const x = 340 + i * 204, y = 64, w = 194, h = 270;
    const it = J[k];
    painel(x, y, w, h, 'rgba(14,11,22,0.95)', it ? RARIDADES[it.r].cor : '#4a4060');
    textoCentro(NOME_TIPO[k].toUpperCase(), x + w / 2, y + 16, 12, '#999', false);
    if (!it) { textoCentro('Nada equipado', x + w / 2, y + h / 2, 14, '#666', false); return; }
    desenharIcone(it, x + w / 2, y + 60, 48);
    textoCentroAjustado(it.nome, x + w / 2, y + 102, 15, RARIDADES[it.r].cor, w - 14);
    textoCentro(RARIDADES[it.r].nome, x + w / 2, y + 120, 11, '#bbb', false);
    const li = linhasItem(it);
    li.forEach((l, j) => textoCentro(l, x + w / 2, y + 142 + j * 18, 13, '#eee', false));
    if (it.afixo) {
      const ya = Math.max(y + h - 40, y + 142 + li.length * 18 + 8);
      textoCentroAjustado(`${it.afixo.nome[0].toUpperCase()}${it.afixo.nome.slice(1)}`, x + w / 2, ya, 13, it.afixo.cor, w - 14, false);
      textoCentroAjustado(it.afixo.desc, x + w / 2, ya + 17, 12, it.afixo.cor, w - 14, false);
    }
  });

  // melhorias
  painel(340, 350, 600, 254);
  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  textoEsq(obtidas.length ? 'Melhorias' : 'Melhorias: ainda nenhuma. Sobe de nível!', 356, 370, 16, '#ffe14d');
  obtidas.forEach((p, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = 356 + col * 292, y = 402 + lin * 28;
    if (lin > 6) return;
    iconePerk(p, x + 12, y, 12);
    textoEsq(`${p.nome}${p.max > 1 ? ` ${nPerk(p.id)}/${p.max}` : ''}`, x + 32, y - 7, 13, p.cor);
    textoEsq(p.desc, x + 32, y + 9, 11, '#bbb', 'normal');
  });
  textoCentro('C / Esc para voltar', LARGURA / 2, ALTURA - 18, 13, '#888', false);
}

// ---------------------------------------------------------------------
//  Ecrãs
// ---------------------------------------------------------------------
const estrelasTitulo = Array.from({ length: 70 }, () => ({ x: Math.random() * LARGURA, y: Math.random() * ALTURA, v: rand(8, 30), s: Math.random() < 0.5 ? 2 : 4 }));

function desenharTitulo(t) {
  for (const e of estrelasTitulo) {
    e.y -= e.v / 60;
    if (e.y < 0) { e.y = ALTURA; e.x = Math.random() * LARGURA; }
    ctx.fillStyle = e.s > 2 ? 'rgba(255,190,90,0.6)' : 'rgba(255,150,80,0.4)';
    ctx.fillRect(Math.round(e.x / 2) * 2, Math.round(e.y / 2) * 2, e.s, e.s);
  }
  // desfile de personagens
  const chao = 150;
  ctx.fillStyle = '#1a1522';
  ctx.fillRect(0, chao + 34, LARGURA, 4);
  sprEcra(SPR.dragao[0], 866, chao - 16, 3);
  sprEcra(SPR.heroi[Math.floor(t * 8) % 3], 150, chao, 4);
  sprEcra(SPR.slime[Math.floor(t * 3) % 2], 260, chao + 8, 3);
  sprEcra(SPR.esqueleto[0], 340, chao, 3);
  sprEcra(SPR.bau.ouro, 620, chao + 12, 3);
  sprEcra(SPR.morcego[Math.floor(t * 10) % 2], 700, chao - 40 + Math.sin(t * 3) * 8, 3);

  const f = 1 + Math.sin(t * 2) * 0.02;
  ctx.save();
  ctx.translate(LARGURA / 2, 70);
  ctx.scale(f, f);
  textoCentro('MASMORRA DO DESTINO', 0, 0, 52, '#ffae00');
  ctx.restore();
  textoCentro('Um RPG de masmorras, bosses e baús da sorte', LARGURA / 2, 118, 17, '#ccc', false);

  painel(LARGURA / 2 - 300, 212, 600, 96);
  desenharIcone(ITENS.find(i => i.nome === 'Colher Enferrujada'), LARGURA / 2 - 235, 244, 48);
  textoCentro('Colher Enferrujada', LARGURA / 2 - 235, 280, 13, RARIDADES.lixo.cor);
  textoCentro('O pior item (30%)', LARGURA / 2 - 235, 296, 11, '#999', false);
  desenharIcone(ITENS.find(i => i.nome === 'Espada do Infinito'), LARGURA / 2 + 235, 244, 48);
  textoCentro('Espada do Infinito', LARGURA / 2 + 235, 280, 13, RARIDADES.mitico.cor);
  textoCentro('O melhor item (1%)', LARGURA / 2 + 235, 296, 11, '#999', false);
  textoCentro('Cada baú pode dar', LARGURA / 2, 246, 16, '#fff', false);
  textoCentro('o PIOR ou o MELHOR item do jogo!', LARGURA / 2, 270, 16, '#fff', false);

  const controlos = [
    ['WASD / Setas', 'Mover'],
    ['Clique / Espaço', 'Atacar'],
    ['Shift', 'Dash (esquiva)'],
    ['E', 'Abrir / Usar / Descer'],
    ['Q', 'Beber poção'],
    ['C', 'Personagem'],
    ['P / Esc', 'Pausa (G para guardar e sair)'],
  ];
  painel(LARGURA / 2 - 240, 324, 480, 170);
  controlos.forEach(([k, d], i) => {
    textoEsq(k, LARGURA / 2 - 214, 344 + i * 22, 14, '#ffe680');
    textoEsq(d, LARGURA / 2 - 50, 344 + i * 22, 14, '#ddd', 'normal');
  });
  textoCentro('Boss a cada 5 andares · Lojas, altares, desafios e armadilhas', LARGURA / 2, 514, 14, '#aaa', false);
  if (recorde > 0) textoCentro(`Recorde: Andar ${recorde}`, LARGURA / 2, 536, 14, '#7ec8ff', false);
  const piscar = Math.floor(t * 2) % 2 === 0;
  if (saveInfo) {
    if (piscar) textoCentro(`ENTER: Continuar (Andar ${saveInfo.andar} · Nível ${saveInfo.J.nivel})`, LARGURA / 2, 574, 22, '#ffffff');
    textoCentro('N: Novo jogo (apaga a partida guardada)', LARGURA / 2, 606, 14, '#aaa', false);
  } else if (piscar) textoCentro('Carrega ENTER para começar', LARGURA / 2, 584, 24, '#fff');
}

function desenharPausa() {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  textoCentro('PAUSA', LARGURA / 2, 110, 48, '#fff');
  textoCentro('P / Esc para continuar', LARGURA / 2, 155, 18, '#bbb', false);
  textoCentro('G para guardar e voltar ao menu', LARGURA / 2, 182, 15, '#ffe680', false);
  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  textoCentro(obtidas.length ? 'As tuas melhorias' : 'Ainda não tens melhorias. Sobe de nível!', LARGURA / 2, 232, 18, '#ffe14d');
  obtidas.forEach((p, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = LARGURA / 2 - 330 + col * 340, y = 272 + lin * 36;
    iconePerk(p, x + 14, y, 12);
    textoEsq(`${p.nome}${p.max > 1 ? ` (${nPerk(p.id)}/${p.max})` : ''}`, x + 36, y - 7, 14, p.cor);
    textoEsq(p.desc, x + 36, y + 9, 12, '#ccc', 'normal');
  });
  textoCentro('O jogo guarda sozinho ao entrar em cada andar', LARGURA / 2, ALTURA - 30, 13, '#888', false);
}

function desenharMorte() {
  ctx.fillStyle = 'rgba(40,0,0,0.75)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  textoCentro('MORRESTE', LARGURA / 2, 140, 60, '#ff4040');
  const linhas = [
    `Andar alcançado: ${andar}`,
    `Nível: ${J.nivel}`,
    `Inimigos derrotados: ${J.kills}`,
    `Baús abertos: ${J.bausAbertos}`,
  ];
  linhas.forEach((l, i) => textoCentro(l, LARGURA / 2, 220 + i * 30, 20, '#eee', false));
  if (J.melhorItem) {
    textoCentro('Melhor item encontrado:', LARGURA / 2, 350, 16, '#aaa', false);
    desenharIcone(J.melhorItem, LARGURA / 2, 392, 48);
    textoCentro(J.melhorItem.nome, LARGURA / 2, 432, 20, RARIDADES[J.melhorItem.r].cor);
  }
  if (J.novoRecorde) textoCentro('NOVO RECORDE!', LARGURA / 2, 480, 26, '#ffe14d');
  else textoCentro(`Recorde: Andar ${recorde}`, LARGURA / 2, 480, 18, '#7ec8ff');
  textoCentro('ENTER: tentar outra vez    ·    Esc: menu', LARGURA / 2, 540, 20, '#fff');
}
