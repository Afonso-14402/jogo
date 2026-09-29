'use strict';
// =====================================================================
//  DESENHO (tudo é desenhado com formas — sem imagens externas)
// =====================================================================

const FONTE = '"Segoe UI", "Trebuchet MS", Arial, sans-serif';
const fonte = (tam, peso = 'bold') => `${peso} ${tam}px ${FONTE}`;

function textoCentro(txt, x, y, tam, cor, contorno = true) {
  ctx.font = fonte(tam);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (contorno) {
    ctx.lineWidth = Math.max(3, tam / 6);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(txt, x, y);
  }
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
}

function textoCentroAjustado(txt, x, y, tamMax, cor, larguraMax) {
  let tam = tamMax;
  ctx.font = fonte(tam);
  while (tam > 9 && ctx.measureText(txt).width > larguraMax) { tam--; ctx.font = fonte(tam); }
  textoCentro(txt, x, y, tam, cor);
}

function textoEsq(txt, x, y, tam, cor, peso = 'bold') {
  ctx.font = fonte(tam, peso);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
}

function retArredondado(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function painel(x, y, w, h, cor = 'rgba(10,8,16,0.78)', borda = 'rgba(255,255,255,0.15)') {
  retArredondado(x, y, w, h, 8);
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.strokeStyle = borda;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function barra(x, y, w, h, frac, cor, fundo = '#2a2030') {
  ctx.fillStyle = fundo;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function sombra(x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.8, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------
//  Ícones de itens
// ---------------------------------------------------------------------
function desenharIcone(item, x, y, tam) {
  const cor = RARIDADES[item.r].cor;
  const ordem = RARIDADES[item.r].ordem;
  ctx.save();
  ctx.translate(x, y);
  const s = tam / 40;
  ctx.scale(s, s);
  if (ordem >= 4) { ctx.shadowColor = cor; ctx.shadowBlur = 14; }
  ctx.lineJoin = 'round';
  if (item.tipo === 'arma') {
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = cor;
    ctx.beginPath(); // lâmina
    ctx.moveTo(-3, 6); ctx.lineTo(-3, -14); ctx.lineTo(0, -19); ctx.lineTo(3, -14); ctx.lineTo(3, 6);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(-9, 6, 18, 4); // guarda
    ctx.fillRect(-2, 10, 4, 8); // cabo
    ctx.fillStyle = cor;
    ctx.beginPath(); ctx.arc(0, 19, 3, 0, Math.PI * 2); ctx.fill();
  } else if (item.tipo === 'armadura') {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(-14, -12); ctx.lineTo(-6, -15); ctx.lineTo(0, -10); ctx.lineTo(6, -15); ctx.lineTo(14, -12);
    ctx.lineTo(17, -2); ctx.lineTo(11, 0); ctx.lineTo(11, 15); ctx.lineTo(-11, 15); ctx.lineTo(-11, 0);
    ctx.lineTo(-17, -2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 15); ctx.stroke();
  } else {
    ctx.strokeStyle = cor; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 2, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = cor;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(6, -9); ctx.lineTo(0, -3); ctx.lineTo(-6, -9); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
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

const NOME_TIPO = { arma: 'Arma', armadura: 'Armadura', amuleto: 'Amuleto' };

// ---------------------------------------------------------------------
//  Mundo
// ---------------------------------------------------------------------
function desenhar(t) {
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  if (estado === 'titulo') { desenharTitulo(t); return; }

  ctx.save();
  const sx = tremor > 0 ? rand(-tremor, tremor) : 0;
  const sy = tremor > 0 ? rand(-tremor, tremor) : 0;
  ctx.translate(Math.round(-cam.x + sx), Math.round(-cam.y + sy));
  ctx.drawImage(mapaImg, 0, 0);

  desenharEscada(t);
  for (const p of perigos) desenharPerigo(p);
  for (const d of drops) desenharPocao(d.x, d.y + Math.sin(d.t * 4) * 3, 1);
  for (const b of baus) desenharBau(b, t);

  const ents = inimigos.filter(e => !e.morto).concat(estado === 'morto' ? [] : [J]);
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) {
    if (e === J) desenharJogador(t);
    else desenharInimigo(e, t);
  }

  for (const p of projeteis) desenharProjetil(p);
  for (const r of raios) {
    ctx.strokeStyle = `rgba(255,240,120,${r.t * 4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    for (let k = 1; k < 6; k++) {
      const f = k / 6;
      ctx.lineTo(r.x1 + (r.x2 - r.x1) * f + rand(-8, 8), r.y1 + (r.y2 - r.y1) * f + rand(-8, 8));
    }
    ctx.lineTo(r.x2, r.y2);
    ctx.stroke();
  }
  for (const p of particulas) {
    ctx.globalAlpha = clamp(p.t * 2, 0, 1);
    ctx.fillStyle = p.cor;
    ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;

  desenharNevoa();

  for (const tx of textos) {
    ctx.globalAlpha = clamp(tx.t * 2, 0, 1);
    textoCentro(tx.txt, tx.x, tx.y, tx.tam, tx.cor);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  desenharEscuridao();
  desenharHUD(t);

  if (estado === 'bau') desenharRoleta(t);
  else if (estado === 'nivel') desenharEscolha(t);
  else if (estado === 'pausa') desenharPausa();
  else if (estado === 'morto') desenharMorte();
}

function desenharNevoa() {
  // Tapa as zonas não exploradas
  const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1), y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const x1 = Math.min(mapa.W - 1, x0 + Math.ceil(LARGURA / TILE) + 2), y1 = Math.min(mapa.H - 1, y0 + Math.ceil(ALTURA / TILE) + 2);
  ctx.fillStyle = '#07060a';
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (!mapa.explorado[y * mapa.W + x]) ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);
}

function desenharEscuridao() {
  const px = J.x - cam.x, py = J.y - cam.y;
  const forte = mapa.eBoss ? 0.45 : 0.82;
  const g = ctx.createRadialGradient(px, py, 140, px, py, 520);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${forte})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
}

function desenharEscada(t) {
  const e = mapa.escada;
  if (!mapa.explorado[Math.floor(e.y / TILE) * mapa.W + Math.floor(e.x / TILE)]) return;
  if (!e.ativa) {
    // selo mágico fechado
    ctx.strokeStyle = `rgba(255,60,60,${0.4 + Math.sin(t * 3) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, 22, 0, Math.PI * 2); ctx.stroke();
    return;
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(e.x - 22, e.y - 22, 44, 44);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgb(${110 - i * 22},${95 - i * 20},${80 - i * 18})`;
    ctx.fillRect(e.x - 20 + i * 3, e.y - 20 + i * 10, 40 - i * 6, 8);
  }
  ctx.strokeStyle = `rgba(255,230,120,${0.5 + Math.sin(t * 4) * 0.3})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 22, e.y - 22, 44, 44);
}

function desenharBau(b, t) {
  const tipo = TIPOS_BAU[b.tipo];
  const y = b.y + Math.sin(b.t * 2) * 1.5;
  sombra(b.x, b.y, 14);
  if (b.tipo === 'ouro') {
    const g = ctx.createRadialGradient(b.x, y, 4, b.x, y, 40);
    g.addColorStop(0, 'rgba(255,220,80,0.45)');
    g.addColorStop(1, 'rgba(255,220,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 40, y - 40, 80, 80);
  }
  ctx.fillStyle = tipo.corpo;
  ctx.fillRect(b.x - 15, y - 8, 30, 18);
  ctx.fillStyle = shade(tipo.corpo, 20);
  ctx.fillRect(b.x - 15, y - 16, 30, 9);
  ctx.fillStyle = tipo.aro;
  ctx.fillRect(b.x - 15, y - 8, 30, 3);
  ctx.fillRect(b.x - 12, y - 16, 3, 26);
  ctx.fillRect(b.x + 9, y - 16, 3, 26);
  ctx.fillStyle = '#222';
  ctx.fillRect(b.x - 3, y - 8, 6, 7);
  ctx.fillStyle = tipo.aro;
  ctx.fillRect(b.x - 2, y - 6, 4, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b.x - 15, y - 16, 30, 26);
}

function shade(hex, v) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + v, 0, 255), g = clamp(((n >> 8) & 255) + v, 0, 255), bl = clamp((n & 255) + v, 0, 255);
  return `rgb(${r},${g},${bl})`;
}

function desenharPocao(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#ff3d6b';
  ctx.beginPath(); ctx.arc(0, 3, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ddd';
  ctx.fillRect(-2.5, -8, 5, 6);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(-3, -10, 6, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(-4, 0, 2, 3);
  ctx.restore();
}

function desenharPerigo(p) {
  const f = 1 - p.t / p.dur;
  ctx.fillStyle = `rgba(255,60,20,${0.15 + f * 0.25})`;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r * f, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,90,40,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
}

function desenharProjetil(p) {
  ctx.save();
  if (p.tipo === 'lamina') {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.vida * 25);
    ctx.fillStyle = p.cor;
    ctx.shadowColor = p.cor; ctx.shadowBlur = 10;
    for (let k = 0; k < 3; k++) {
      ctx.rotate(Math.PI * 2 / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -3); ctx.lineTo(8, 3); ctx.fill();
    }
  } else if (p.tipo === 'flecha') {
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.strokeStyle = '#d8c9a3'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.fill();
  } else {
    ctx.shadowColor = p.cor; ctx.shadowBlur = 12;
    ctx.fillStyle = p.cor;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function desenharJogador(t) {
  if (J.invuln > 0 && Math.floor(J.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  sombra(J.x, J.y, J.r);
  const cor = RARIDADES[J.arma.r].cor;

  // arma
  let ang = J.angArma;
  if (J.golpe) {
    const p = 1 - J.golpe.t / J.golpe.dur;
    const volta = J.golpe.giro ? Math.PI * 2 : 2.4;
    const inicio = J.golpe.giro ? J.golpe.ang : J.golpe.ang - 1.2;
    ang = inicio + p * volta;
    ctx.strokeStyle = J.golpe.giro ? '#ffae00' : cor;
    ctx.globalAlpha *= 0.35 * (1 - p) + 0.1;
    ctx.lineWidth = J.golpe.giro ? 14 : 10;
    ctx.beginPath();
    ctx.arc(J.x, J.y, J.golpe.alcance - 6, inicio, ang);
    ctx.stroke();
    ctx.globalAlpha = J.invuln > 0 && Math.floor(J.invuln * 20) % 2 === 0 ? 0.45 : 1;
  }
  const comp = Math.min(52, S.alcance * 0.7);
  ctx.save();
  ctx.translate(J.x, J.y);
  ctx.rotate(ang);
  ctx.fillStyle = '#6b4a2a';
  ctx.fillRect(8, -2, 8, 4);
  ctx.fillRect(15, -6, 3, 12);
  ctx.fillStyle = cor;
  if (RARIDADES[J.arma.r].ordem >= 4) { ctx.shadowColor = cor; ctx.shadowBlur = 10; }
  ctx.beginPath();
  ctx.moveTo(18, -2.5); ctx.lineTo(18 + comp, -2.5); ctx.lineTo(22 + comp, 0); ctx.lineTo(18 + comp, 2.5); ctx.lineTo(18, 2.5);
  ctx.fill();
  ctx.restore();

  if (nPerk('escudo') > 0 && J.escudoCd <= 0) {
    ctx.strokeStyle = `rgba(255,240,160,${0.45 + Math.sin(t * 5) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(J.x, J.y, J.r + 7, 0, Math.PI * 2); ctx.stroke();
  }

  // corpo
  ctx.fillStyle = '#3a6ad4';
  ctx.beginPath(); ctx.arc(J.x, J.y, J.r, 0, Math.PI * 2); ctx.fill();
  if (J.armadura) {
    ctx.strokeStyle = RARIDADES[J.armadura.r].cor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // cabeça/olhos virados para a direção
  ctx.fillStyle = '#f1c8a0';
  ctx.beginPath(); ctx.arc(J.x + J.dirX * 3, J.y + J.dirY * 3 - 2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  const px = -J.dirY, py = J.dirX;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(J.x + J.dirX * 7 + px * 3 * s, J.y + J.dirY * 7 + py * 3 * s - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (J.amuleto) {
    ctx.fillStyle = RARIDADES[J.amuleto.r].cor;
    ctx.beginPath(); ctx.arc(J.x, J.y + 8, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function olhos(x, y, sep, r, cor = '#111', dx = 0, dy = 0) {
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.arc(x - sep + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + sep + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
}

function desenharInimigo(e, t) {
  const cor = e.flash > 0 ? '#ffffff' : e.cor;
  const lx = clamp((J.x - e.x) / 60, -2, 2), ly = clamp((J.y - e.y) / 60, -2, 2);
  sombra(e.x, e.y, e.r);
  ctx.save();
  switch (e.tipo) {
    case 'slime': {
      const sq = e.acordado && e.t % 1.1 < 0.45 ? Math.sin((e.t % 1.1) / 0.45 * Math.PI) : 0;
      const w = e.r * (1 + sq * 0.2), h = e.r * (1 - sq * 0.25);
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.ellipse(e.x, e.y - sq * 6, w, h, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(e.x - 4, e.y - 5 - sq * 6, 3, 2, -0.5, 0, Math.PI * 2); ctx.fill();
      olhos(e.x, e.y - 2 - sq * 6, 4, 2, '#111', lx, ly);
      break;
    }
    case 'morcego': {
      const asa = Math.sin(e.t * 18) * 6;
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.moveTo(e.x - 4, e.y); ctx.lineTo(e.x - 18, e.y - 6 + asa); ctx.lineTo(e.x - 10, e.y + 4);
      ctx.moveTo(e.x + 4, e.y); ctx.lineTo(e.x + 18, e.y - 6 + asa); ctx.lineTo(e.x + 10, e.y + 4);
      ctx.fill();
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.7, 0, Math.PI * 2); ctx.fill();
      olhos(e.x, e.y - 1, 3, 1.6, '#ff3b3b');
      break;
    }
    case 'esqueleto': {
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.arc(e.x, e.y - 3, e.r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(e.x - 5, e.y + 4, 10, 8);
      olhos(e.x, e.y - 4, 4, 2.6, '#1a1a1a', lx * 0.5, ly * 0.5);
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x + 12, e.y, 10, -1.2, 1.2); ctx.stroke();
      break;
    }
    case 'orc': {
      if (e.preparar > 0) { ctx.fillStyle = 'rgba(255,60,60,0.4)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a6318';
      ctx.fillRect(e.x - e.r, e.y + 2, e.r * 2, 4);
      olhos(e.x, e.y - 4, 5, 2.2, '#ff2', lx, ly);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(e.x - 6, e.y + 6); ctx.lineTo(e.x - 4, e.y); ctx.lineTo(e.x - 2, e.y + 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(e.x + 6, e.y + 6); ctx.lineTo(e.x + 4, e.y); ctx.lineTo(e.x + 2, e.y + 6); ctx.fill();
      break;
    }
    case 'fantasma': {
      ctx.globalAlpha = 0.55 + Math.sin(e.t * 3) * 0.2;
      ctx.fillStyle = cor;
      const y = e.y + Math.sin(e.t * 2) * 3;
      ctx.beginPath();
      ctx.arc(e.x, y - 2, e.r, Math.PI, 0);
      for (let i = 0; i <= 4; i++) ctx.lineTo(e.x + e.r - i * e.r / 2, y + e.r - (i % 2) * 5);
      ctx.fill();
      olhos(e.x, y - 3, 4, 2.4, '#223', lx, ly);
      break;
    }
    case 'mimico': {
      const boca = Math.abs(Math.sin(e.t * 10)) * 8;
      ctx.fillStyle = cor;
      ctx.fillRect(e.x - 16, e.y - 4, 32, 16);
      ctx.fillStyle = '#300';
      ctx.fillRect(e.x - 14, e.y - 4 - boca, 28, boca);
      ctx.fillStyle = shade('#8b5a2b', 20);
      ctx.fillRect(e.x - 16, e.y - 14 - boca, 32, 10);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(e.x - 13 + i * 6, e.y - 4 - boca); ctx.lineTo(e.x - 10 + i * 6, e.y - boca + 1); ctx.lineTo(e.x - 7 + i * 6, e.y - 4 - boca); ctx.fill();
      }
      olhos(e.x, e.y - 9 - boca, 6, 2, '#ff2');
      break;
    }
    case 'reiSlime': desenharReiSlime(e, cor, lx, ly, t); break;
    case 'lich': desenharLich(e, cor, lx, ly, t); break;
    case 'dragao': desenharDragao(e, cor, lx, ly, t); break;
  }
  ctx.restore();

  if (e.lento > 0) {
    ctx.fillStyle = 'rgba(127,216,255,0.28)';
    ctx.beginPath(); ctx.arc(e.x, e.y - (e.z || 0), e.r + 3, 0, Math.PI * 2); ctx.fill();
  }
  if (e.queima > 0) {
    ctx.fillStyle = 'rgba(255,123,37,0.22)';
    ctx.beginPath(); ctx.arc(e.x, e.y - (e.z || 0), e.r + 2, 0, Math.PI * 2); ctx.fill();
  }
  if (!e.boss && e.hp < e.maxHp) {
    barra(e.x - 16, e.y - e.r - 12, 32, 4, e.hp / e.maxHp, '#ff4d4d', '#300');
  }
}

function desenharReiSlime(e, cor, lx, ly, t) {
  const y = e.y - e.z;
  const puls = Math.sin(t * 4) * 0.05;
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.ellipse(e.x, y, e.r * (1 + puls), e.r * (0.85 - puls), 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.ellipse(e.x - 14, y - 16, 10, 6, -0.5, 0, Math.PI * 2); ctx.fill();
  olhos(e.x, y - 4, 12, 5, '#111', lx * 2, ly * 2);
  // coroa
  ctx.fillStyle = '#ffd23f';
  const cy = y - e.r * 0.85;
  ctx.beginPath();
  ctx.moveTo(e.x - 18, cy + 6); ctx.lineTo(e.x - 18, cy - 8); ctx.lineTo(e.x - 9, cy); ctx.lineTo(e.x, cy - 12);
  ctx.lineTo(e.x + 9, cy); ctx.lineTo(e.x + 18, cy - 8); ctx.lineTo(e.x + 18, cy + 6);
  ctx.fill();
  ctx.fillStyle = '#ff3355';
  ctx.beginPath(); ctx.arc(e.x, cy, 3, 0, Math.PI * 2); ctx.fill();
  if (e.salto > 0) { // alvo do salto
    ctx.strokeStyle = 'rgba(255,60,60,0.6)'; ctx.lineWidth = 2;
    const f = 1 - e.salto / e.duracaoSalto;
    const ax = e.x + e.svx * e.salto, ay = e.y + e.svy * e.salto;
    ctx.beginPath(); ctx.arc(ax, ay, e.r * (0.4 + f * 0.6), 0, Math.PI * 2); ctx.stroke();
  }
}

function desenharLich(e, cor, lx, ly, t) {
  const y = e.y + Math.sin(t * 2) * 4;
  const g = ctx.createRadialGradient(e.x, y, 4, e.x, y, 60);
  g.addColorStop(0, 'rgba(180,90,255,0.35)');
  g.addColorStop(1, 'rgba(180,90,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(e.x - 60, y - 60, 120, 120);
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(e.x, y - e.r - 8);
  ctx.lineTo(e.x + e.r, y + e.r);
  ctx.lineTo(e.x - e.r, y + e.r);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a0f2a';
  ctx.beginPath(); ctx.arc(e.x, y - 6, 11, 0, Math.PI * 2); ctx.fill();
  olhos(e.x, y - 7, 4, 2.4, '#4dffea', lx, ly);
  // cajado
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(e.x + e.r + 4, y - 26); ctx.lineTo(e.x + e.r + 4, y + e.r); ctx.stroke();
  ctx.fillStyle = '#4dffea'; ctx.shadowColor = '#4dffea'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(e.x + e.r + 4, y - 28, 5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function desenharDragao(e, cor, lx, ly, t) {
  const asa = Math.sin(t * 5) * 10;
  const ang = Math.atan2(J.y - e.y, J.x - e.x);
  ctx.fillStyle = shade(e.cor, -40);
  ctx.beginPath(); // asas
  ctx.moveTo(e.x - 10, e.y - 6); ctx.lineTo(e.x - e.r - 34, e.y - 30 + asa); ctx.lineTo(e.x - e.r - 10, e.y + 16);
  ctx.moveTo(e.x + 10, e.y - 6); ctx.lineTo(e.x + e.r + 34, e.y - 30 + asa); ctx.lineTo(e.x + e.r + 10, e.y + 16);
  ctx.fill();
  if (e.investida > 0) { ctx.shadowColor = '#ff5a28'; ctx.shadowBlur = 25; }
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = shade(e.cor, 30);
  ctx.beginPath(); ctx.ellipse(e.x, e.y + 10, e.r * 0.55, e.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  // cabeça virada para o jogador
  const hx = e.x + Math.cos(ang) * e.r * 0.75, hy = e.y + Math.sin(ang) * e.r * 0.75;
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.arc(hx, hy, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5e6c8';
  ctx.beginPath(); ctx.moveTo(hx - 12, hy - 10); ctx.lineTo(hx - 18, hy - 28); ctx.lineTo(hx - 5, hy - 14); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx + 12, hy - 10); ctx.lineTo(hx + 18, hy - 28); ctx.lineTo(hx + 5, hy - 14); ctx.fill();
  olhos(hx, hy - 3, 7, 3, '#ffe14d', lx, ly);
  if (e.sopro > 0) {
    ctx.fillStyle = 'rgba(255,140,40,0.5)';
    ctx.beginPath(); ctx.arc(hx + Math.cos(ang) * 14, hy + Math.sin(ang) * 14, 9 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------------
//  HUD
// ---------------------------------------------------------------------
function desenharHUD(t) {
  // Vida / XP
  painel(10, 10, 270, 92);
  textoEsq(`Nv ${J.nivel}`, 22, 28, 18, '#ffe14d');
  textoEsq(`ATK ${S.dano}  DEF ${S.def}  CRIT ${Math.round(S.crit * 100)}%`, 80, 28, 13, '#cfc6e0');
  barra(22, 44, 246, 20, J.hp / S.maxHp, J.hp / S.maxHp < 0.3 ? '#ff2d2d' : '#e0413e');
  textoCentro(`${Math.ceil(J.hp)} / ${S.maxHp}`, 145, 54, 13, '#fff');
  barra(22, 72, 246, 10, J.xp / xpProximo(J.nivel), '#3d9bff');
  textoEsq(`XP ${J.xp}/${xpProximo(J.nivel)}`, 22, 92, 11, '#9fc8ff', 'normal');

  // Melhorias obtidas
  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  obtidas.forEach((p, i) => {
    const x = 24 + (i % 10) * 26, y = 118 + Math.floor(i / 10) * 26;
    iconePerk(p, x, y, 11);
    if (nPerk(p.id) > 1) textoCentro(`${nPerk(p.id)}`, x + 9, y + 8, 10, '#fff');
  });

  // Andar + minimapa
  desenharMinimapa();

  // Equipamento
  const slots = [['arma', 'Arma'], ['armadura', 'Armadura'], ['amuleto', 'Amuleto']];
  const by = ALTURA - 84;
  painel(10, by - 10, 348, 84);
  slots.forEach(([k, nome], i) => {
    const x = 20 + i * 66;
    const it = J[k];
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, by, 58, 58);
    ctx.strokeStyle = it ? RARIDADES[it.r].cor : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, by, 58, 58);
    if (it) desenharIcone(it, x + 29, by + 27, 34);
    else textoCentro('—', x + 29, by + 27, 16, '#666', false);
    textoCentro(nome, x + 29, by + 66, 10, '#aaa', false);
  });
  // poção
  const px = 20 + 3 * 66;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(px, by, 58, 58);
  ctx.strokeStyle = 'rgba(255,61,107,0.6)';
  ctx.strokeRect(px, by, 58, 58);
  desenharPocao(px + 29, by + 28, 1.8);
  textoCentro(`x${J.pocoes}`, px + 44, by + 46, 13, '#fff');
  textoCentro('[Q] Poção', px + 29, by + 66, 10, '#aaa', false);
  // dash
  const dx = 20 + 4 * 66;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(dx, by, 58, 58);
  const pronto = J.cdDash <= 0;
  ctx.strokeStyle = pronto ? '#78aaff' : 'rgba(255,255,255,0.2)';
  ctx.strokeRect(dx, by, 58, 58);
  if (!pronto) {
    ctx.fillStyle = 'rgba(120,170,255,0.25)';
    const f = clamp(J.cdDash / 0.9, 0, 1);
    ctx.fillRect(dx, by + 58 * (1 - f), 58, 58 * f);
  }
  textoCentro('»»', dx + 29, by + 28, 22, pronto ? '#78aaff' : '#556');
  textoCentro('[Shift] Dash', dx + 29, by + 66, 10, '#aaa', false);

  // Nome do item equipado ao passar o rato por cima
  slots.forEach(([k], i) => {
    const x = 20 + i * 66;
    if (J[k] && rato.x > x && rato.x < x + 58 && rato.y > by && rato.y < by + 58) desenharCartaItem(J[k], x, by - 180, 'Equipado');
  });

  // Barra do boss
  if (boss && !boss.morto) {
    const w = 340, x = (LARGURA - w) / 2;
    painel(x - 10, 12, w + 20, 50, 'rgba(20,0,0,0.75)', 'rgba(255,80,80,0.4)');
    textoCentro(boss.nome + (boss.fase2 ? ' (Enfurecido)' : ''), LARGURA / 2, 27, 15, '#ff8080');
    barra(x, 38, w, 14, boss.hp / boss.maxHp, '#c0392b', '#300');
  }

  // Dicas de interação
  if (estado === 'jogo') {
    if (J.bauPerto) desenharInfoBau(J.bauPerto);
    else if (J.escadaPerto) {
      const sx = mapa.escada.x - cam.x, sy = mapa.escada.y - cam.y - 40;
      if (mapa.escada.ativa) textoCentro('[E] Descer', sx, sy, 16, '#ffe680');
      else textoCentro('Derrota o boss para abrir', sx, sy, 14, '#ff8080');
    }
  }

  // Banner
  if (banner && (estado === 'jogo' || estado === 'pausa')) {
    const a = clamp(Math.min(banner.t, 3 - banner.t) * 2, 0, 1);
    ctx.globalAlpha = a;
    textoCentro(banner.titulo, LARGURA / 2, 170, 40, banner.cor);
    if (banner.sub) textoCentro(banner.sub, LARGURA / 2, 210, 18, '#ddd');
    ctx.globalAlpha = 1;
  }

  textoEsq(somLigado ? '[M] Som: ligado' : '[M] Som: desligado', LARGURA - 130, ALTURA - 14, 11, 'rgba(255,255,255,0.4)', 'normal');
}

function desenharMinimapa() {
  const esc = mapa.eBoss ? 3 : 3;
  const w = mapa.W * esc, h = mapa.H * esc;
  const x0 = LARGURA - w - 16, y0 = 40;
  painel(x0 - 6, 10, w + 12, h + 40);
  textoCentro(`ANDAR ${andar}`, x0 + w / 2, 25, 15, '#ffe14d');
  ctx.fillStyle = 'rgba(200,190,230,0.35)';
  for (let y = 0; y < mapa.H; y++)
    for (let x = 0; x < mapa.W; x++)
      if (mapa.explorado[y * mapa.W + x] && mapa.tiles[y * mapa.W + x]) ctx.fillRect(x0 + x * esc, y0 + y * esc, esc, esc);
  const vis = (px, py) => mapa.explorado[Math.floor(py / TILE) * mapa.W + Math.floor(px / TILE)];
  if (vis(mapa.escada.x, mapa.escada.y)) {
    ctx.fillStyle = mapa.escada.ativa ? '#ffe680' : '#ff5050';
    ctx.fillRect(x0 + mapa.escada.x / TILE * esc - 3, y0 + mapa.escada.y / TILE * esc - 3, 6, 6);
  }
  for (const b of baus) if (vis(b.x, b.y)) {
    ctx.fillStyle = b.tipo === 'ouro' ? '#ffd23f' : '#c98a4a';
    ctx.fillRect(x0 + b.x / TILE * esc - 2, y0 + b.y / TILE * esc - 2, 4, 4);
  }
  ctx.fillStyle = '#5da8ff';
  ctx.beginPath(); ctx.arc(x0 + J.x / TILE * esc, y0 + J.y / TILE * esc, 3, 0, Math.PI * 2); ctx.fill();
  if (boss) {
    ctx.fillStyle = '#ff4040';
    ctx.beginPath(); ctx.arc(x0 + boss.x / TILE * esc, y0 + boss.y / TILE * esc, 4, 0, Math.PI * 2); ctx.fill();
  }
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
    ctx.font = fonte(13);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${pct}%`, x + largura, yy);
    yy += 19;
  }
  if (tb.mimico > 0) {
    textoEsq('Mímico', x + 16, yy, 13, '#ff6060');
    ctx.fillStyle = '#ff6060';
    ctx.fillRect(x, yy - 5, 10, 10);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(tb.mimico * 100)}%`, x + largura, yy);
    yy += 19;
  }
  return yy;
}

function desenharInfoBau(b) {
  const tb = TIPOS_BAU[b.tipo];
  let x = b.x - cam.x + 34, y = b.y - cam.y - 90;
  const w = 180, h = (tb.mimico > 0 ? 184 : 165) + (S.sorte > 0 ? 16 : 0);
  x = clamp(x, 10, LARGURA - w - 10);
  y = clamp(y, 110, ALTURA - h - 100);
  painel(x, y, w, h);
  textoCentro(tb.nome, x + w / 2, y + 16, 14, tb.aro);
  let y0 = y + 40;
  if (S.sorte > 0) { textoCentro(`Sorte +${S.sorte} aplicada`, x + w / 2, y + 33, 11, '#3ddc84', false); y0 += 14; }
  const fim = tabelaChances(b.tipo, x + 14, y0, w - 28);
  textoCentro('[E] Abrir', x + w / 2, fim + 4, 15, '#ffe680');
}

function desenharCartaItem(it, x, y, cabecalho) {
  const info = RARIDADES[it.r];
  const linhas = linhasItem(it);
  const w = 220, h = 118 + linhas.length * 18 + (it.afixo ? 22 : 0);
  x = clamp(x, 10, LARGURA - w - 10);
  y = clamp(y, 10, ALTURA - h - 10);
  painel(x, y, w, h, 'rgba(12,10,20,0.95)', info.cor);
  if (cabecalho) textoCentro(cabecalho, x + w / 2, y + 14, 11, '#999', false);
  desenharIcone(it, x + w / 2, y + 44, 40);
  textoCentroAjustado(it.nome, x + w / 2, y + 78, 15, info.cor, w - 16);
  textoCentro(`${info.nome} · ${NOME_TIPO[it.tipo]}`, x + w / 2, y + 96, 11, '#bbb', false);
  linhas.forEach((l, i) => textoCentro(l, x + w / 2, y + 116 + i * 18, 13, '#eee', false));
  if (it.afixo) textoCentroAjustado(`+ ${it.afixo.desc}`, x + w / 2, y + 120 + linhas.length * 18, 13, it.afixo.cor, w - 16);
  return h;
}

// ---------------------------------------------------------------------
//  Roleta do baú
// ---------------------------------------------------------------------
function desenharRoleta(t) {
  const R = roleta;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  const tb = TIPOS_BAU[R.tipoBau];
  textoCentro(`A abrir: ${tb.nome}`, LARGURA / 2, 44, 26, tb.aro);

  // faixa
  const L = 116, cy = 170, H = 120;
  const cx = LARGURA / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(40, cy - H / 2 - 6, LARGURA - 80, H + 12);
  ctx.clip();
  ctx.fillStyle = '#120e1a';
  ctx.fillRect(40, cy - H / 2 - 6, LARGURA - 80, H + 12);
  for (let i = 0; i < R.faixa.length; i++) {
    const x = cx + (i - R.pos) * L;
    if (x < -L || x > LARGURA + L) continue;
    const it = R.faixa[i];
    const info = RARIDADES[it.r];
    const vencedor = R.fim && i === R.idx;
    ctx.fillStyle = vencedor ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(x + 3, cy - H / 2, L - 6, H);
    ctx.fillStyle = info.cor;
    ctx.fillRect(x + 3, cy + H / 2 - 8, L - 6, 8);
    const g = ctx.createLinearGradient(0, cy - H / 2, 0, cy + H / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, info.cor + '33');
    ctx.fillStyle = g;
    ctx.fillRect(x + 3, cy - H / 2, L - 6, H);
    desenharIcone(it, x + L / 2, cy - 14, 46);
    ctx.font = fonte(11);
    ctx.textAlign = 'center';
    ctx.fillStyle = info.cor;
    const nb = it.nomeBase || it.nome;
    ctx.fillText(nb.length > 17 ? nb.slice(0, 16) + '…' : nb, x + L / 2, cy + 32);
    if (it.afixo) {
      ctx.fillStyle = it.afixo.cor;
      ctx.font = fonte(10);
      ctx.fillText(it.afixo.nome, x + L / 2, cy + 46);
    }
  }
  ctx.restore();
  // marcador central
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - H / 2 - 16); ctx.lineTo(cx + 12, cy - H / 2 - 16); ctx.lineTo(cx, cy - H / 2 + 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 12, cy + H / 2 + 16); ctx.lineTo(cx + 12, cy + H / 2 + 16); ctx.lineTo(cx, cy + H / 2 - 2); ctx.fill();
  ctx.fillRect(cx - 1.5, cy - H / 2, 3, H);

  if (!R.fim) {
    // tabela de chances enquanto roda
    const w = 220, x = (LARGURA - w) / 2, y = 270;
    painel(x, y, w, tb.mimico > 0 ? 190 : 170);
    textoCentro(S.sorte > 0 ? `Probabilidades (Sorte +${S.sorte})` : 'Probabilidades', x + w / 2, y + 18, 14, S.sorte > 0 ? '#3ddc84' : '#ddd');
    tabelaChances(R.tipoBau, x + 18, y + 44, w - 36);
    textoCentro('[E] Saltar animação', LARGURA / 2, ALTURA - 40, 14, '#888', false);
    return;
  }

  // resultado
  const info = RARIDADES[R.premio.r];
  const ordem = info.ordem;
  let msg = '';
  if (ordem === 0) msg = 'Que azar... isto é LIXO!';
  else if (ordem === 5) msg = 'MÍTICO!!! O MELHOR DO JOGO!';
  else if (ordem === 4) msg = 'LENDÁRIO!';
  else if (ordem === 3) msg = 'Épico!';
  const pulso = 1 + Math.sin(R.brilho * 6) * 0.05;
  if (msg) {
    ctx.save();
    ctx.translate(LARGURA / 2, 262);
    ctx.scale(pulso, pulso);
    textoCentro(msg, 0, 0, ordem >= 4 ? 30 : 22, info.cor);
    ctx.restore();
  }
  if (ordem >= 4) { // raios de luz
    ctx.save();
    ctx.translate(LARGURA / 2 + 130, 400);
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
  if (atual) desenharCartaItem(atual, LARGURA / 2 - 250, 300, 'EQUIPADO AGORA');
  else {
    painel(LARGURA / 2 - 250, 300, 220, 150);
    textoCentro('Nada equipado', LARGURA / 2 - 140, 375, 15, '#777', false);
  }
  textoCentro('➜', LARGURA / 2, 380, 34, '#fff');
  desenharCartaItem(R.premio, LARGURA / 2 + 30, 300, 'NOVO');

  const xp = info.xpReciclar * andar;
  textoCentro(`[E] Equipar          [X] Reciclar (+${xp} XP)`, LARGURA / 2, ALTURA - 34, 18, '#ffe680');
}

// ---------------------------------------------------------------------
//  Ecrãs
// ---------------------------------------------------------------------
const estrelasTitulo = Array.from({ length: 80 }, () => ({ x: Math.random() * LARGURA, y: Math.random() * ALTURA, v: rand(8, 30), s: rand(1, 3) }));

function desenharTitulo(t) {
  for (const e of estrelasTitulo) {
    e.y -= e.v / 60;
    if (e.y < 0) { e.y = ALTURA; e.x = Math.random() * LARGURA; }
    ctx.fillStyle = `rgba(255,${150 + e.s * 30},80,${0.3 + e.s * 0.15})`;
    ctx.fillRect(e.x, e.y, e.s, e.s);
  }
  const f = 1 + Math.sin(t * 2) * 0.03;
  ctx.save();
  ctx.translate(LARGURA / 2, 130);
  ctx.scale(f, f);
  textoCentro('MASMORRA DO DESTINO', 0, 0, 54, '#ffae00');
  ctx.restore();
  textoCentro('Um RPG de masmorras, bosses e baús da sorte', LARGURA / 2, 188, 18, '#ccc', false);

  // raridades de exemplo
  const exemplos = [ITENS.find(i => i.nome === 'Colher Enferrujada'), ITENS.find(i => i.nome === 'Espada do Infinito')];
  painel(LARGURA / 2 - 300, 222, 600, 110);
  desenharIcone(exemplos[0], LARGURA / 2 - 230, 262, 44);
  textoCentro('Colher Enferrujada', LARGURA / 2 - 230, 300, 13, RARIDADES.lixo.cor);
  textoCentro('O pior item (30%)', LARGURA / 2 - 230, 318, 11, '#999', false);
  desenharIcone(exemplos[1], LARGURA / 2 + 230, 262, 44);
  textoCentro('Espada do Infinito', LARGURA / 2 + 230, 300, 13, RARIDADES.mitico.cor);
  textoCentro('O melhor item (1%)', LARGURA / 2 + 230, 318, 11, '#999', false);
  textoCentro('Cada baú pode dar', LARGURA / 2, 260, 16, '#fff', false);
  textoCentro('o PIOR ou o MELHOR item do jogo!', LARGURA / 2, 284, 16, '#fff', false);

  const controlos = [
    ['WASD / Setas', 'Mover'],
    ['Clique / Espaço', 'Atacar'],
    ['Shift', 'Dash (esquiva)'],
    ['E', 'Abrir baú / Descer escada'],
    ['Q', 'Beber poção'],
    ['P / Esc', 'Pausa'],
  ];
  painel(LARGURA / 2 - 220, 352, 440, 150);
  controlos.forEach(([k, d], i) => {
    textoEsq(k, LARGURA / 2 - 196, 372 + i * 22, 14, '#ffe680');
    textoEsq(d, LARGURA / 2 - 20, 372 + i * 22, 14, '#ddd', 'normal');
  });
  textoCentro('Boss a cada 5 andares · Sobe de nível ao derrotar inimigos', LARGURA / 2, 526, 14, '#aaa', false);
  if (recorde > 0) textoCentro(`Recorde: Andar ${recorde}`, LARGURA / 2, 552, 15, '#7ec8ff');
  if (Math.floor(t * 2) % 2 === 0) textoCentro('Carrega ENTER para começar', LARGURA / 2, 594, 24, '#fff');
}

function iconePerk(p, x, y, r) {
  ctx.fillStyle = p.cor;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.unica ? '#ffe14d' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = p.unica ? 2 : 1.5;
  ctx.stroke();
  ctx.font = fonte(Math.round(r * 1.1));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#15101e';
  ctx.fillText(p.letra, x, y + 1);
}

function desenharEscolha(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  textoCentro('SUBISTE DE NÍVEL!', LARGURA / 2, 90, 40, '#ffe14d');
  textoCentro(`Nível ${J.nivel} · Escolhe uma melhoria`, LARGURA / 2, 135, 18, '#ddd', false);
  const n = escolha.opcoes.length;
  escolha.opcoes.forEach((p, i) => {
    const r = retCartaPerk(i, n);
    const sobre = rato.x > r.x && rato.x < r.x + r.w && rato.y > r.y && rato.y < r.y + r.h;
    const entrada = clamp(escolha.t * 4 - i * 0.3, 0, 1);
    const y = r.y + (1 - entrada) * 40 - (sobre ? 6 : 0);
    ctx.globalAlpha = entrada;
    painel(r.x, y, r.w, r.h, 'rgba(18,14,28,0.96)', sobre ? '#ffffff' : p.cor);
    textoCentro(`${i + 1}`, r.x + 22, y + 22, 18, '#888', false);
    if (p.unica) textoCentro('ÚNICA', r.x + r.w - 34, y + 22, 11, '#ffe14d', false);
    iconePerk(p, r.x + r.w / 2, y + 80, 34);
    textoCentroAjustado(p.nome, r.x + r.w / 2, y + 145, 20, p.cor, r.w - 20);
    // descrição com quebra de linha
    ctx.font = fonte(14, 'normal');
    const palavras = p.desc.split(' ');
    const linhas = [];
    let linha = '';
    for (const w of palavras) {
      const tentativa = linha ? linha + ' ' + w : w;
      if (ctx.measureText(tentativa).width > r.w - 30 && linha) { linhas.push(linha); linha = w; } else linha = tentativa;
    }
    if (linha) linhas.push(linha);
    linhas.forEach((l, k) => textoCentro(l, r.x + r.w / 2, y + 180 + k * 20, 14, '#e6e0f0', false));
    const atual = nPerk(p.id);
    if (p.max > 1) textoCentro(`${atual} / ${p.max}`, r.x + r.w / 2, y + r.h - 24, 13, '#999', false);
    ctx.globalAlpha = 1;
  });
  textoCentro('Carrega 1, 2 ou 3 (ou clica numa carta)', LARGURA / 2, 520, 16, '#aaa', false);
}

function desenharPausa() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  textoCentro('PAUSA', LARGURA / 2, 110, 48, '#fff');
  textoCentro('P / Esc para continuar', LARGURA / 2, 155, 18, '#bbb', false);
  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  textoCentro(obtidas.length ? 'As tuas melhorias' : 'Ainda não tens melhorias. Sobe de nível!', LARGURA / 2, 215, 18, '#ffe14d');
  obtidas.forEach((p, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = LARGURA / 2 - 330 + col * 340, y = 255 + lin * 36;
    iconePerk(p, x + 14, y, 13);
    textoEsq(`${p.nome}${p.max > 1 ? ` (${nPerk(p.id)}/${p.max})` : ''}`, x + 36, y - 7, 14, p.cor);
    textoEsq(p.desc, x + 36, y + 9, 12, '#ccc', 'normal');
  });
}

function desenharMorte() {
  ctx.fillStyle = 'rgba(40,0,0,0.72)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  textoCentro('MORRESTE', LARGURA / 2, 150, 60, '#ff4040');
  const linhas = [
    `Andar alcançado: ${andar}`,
    `Nível: ${J.nivel}`,
    `Inimigos derrotados: ${J.kills}`,
    `Baús abertos: ${J.bausAbertos}`,
  ];
  linhas.forEach((l, i) => textoCentro(l, LARGURA / 2, 230 + i * 30, 20, '#eee', false));
  if (J.melhorItem) {
    textoCentro('Melhor item encontrado:', LARGURA / 2, 360, 16, '#aaa', false);
    textoCentro(J.melhorItem.nome, LARGURA / 2, 386, 22, RARIDADES[J.melhorItem.r].cor);
  }
  if (J.novoRecorde) textoCentro('NOVO RECORDE!', LARGURA / 2, 440, 26, '#ffe14d');
  else textoCentro(`Recorde: Andar ${recorde}`, LARGURA / 2, 440, 18, '#7ec8ff');
  textoCentro('Carrega ENTER para tentar outra vez', LARGURA / 2, 520, 22, '#fff');
}
