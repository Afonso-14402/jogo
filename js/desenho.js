'use strict';
// =====================================================================
//  DESENHO
//  O mundo é desenhado num buffer com metade da resolução (480x320) e
//  depois ampliado 2x sem suavização: é isso que dá o aspeto pixel art.
//  O HUD e os textos são desenhados por cima, à resolução normal.
// =====================================================================

const FONTE = '"Tiny5", "Segoe UI", "Trebuchet MS", Arial, sans-serif';
// no telemóvel as letras muito pequenas ficam um pouco maiores
// No telemóvel o interface fica encolhido: as letras pequenas crescem (ver ajustarTela
// e a opção "Tamanho da letra"); as grandes (títulos) ficam como estão.
let escalaLetra = 1, alargarLetra = 1.18;
const tamLetra = tam => (escalaLetra === 1 || tam >= 24 ? tam : Math.min(Math.round(tam * escalaLetra), Math.max(tam, 24)));
const fonte = (tam, peso = 'bold') => `${peso} ${tamLetra(tam)}px ${FONTE}`;
// Quanto a letra pode alargar (as letras crescem mais em altura do que em largura, para caberem nos painéis)
const apertoLetra = tam => Math.min(1, alargarLetra * tam / tamLetra(tam));
function escreverApertado(txt, x, y, tam, f) {
  const sx = apertoLetra(tam);
  if (sx >= 0.999) { f(txt, x, y); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1); f(txt, 0, 0); ctx.restore();
}
try { if (document.fonts) { document.fonts.load(fonte(16)); document.fonts.load(fonte(16, 'normal')); } } catch (e) { /* ignora */ }

let LB = LARGURA / ESCALA, AB = ALTURA / ESCALA;
const bufMundo = document.createElement('canvas');
bufMundo.width = LB; bufMundo.height = AB;
const ctxMundo = bufMundo.getContext('2d');
// a luz é suave: calcula-se a metade da resolução (muito mais rápido)
const RES_LUZ = 2;
const bufLuz = document.createElement('canvas');
bufLuz.width = Math.ceil(LB / RES_LUZ); bufLuz.height = Math.ceil(AB / RES_LUZ);
const ctxLuz = bufLuz.getContext('2d');

// Tamanho dos buffers do mundo (muda quando o ecrã do telemóvel muda)
function ajustarBuffers() {
  LB = Math.ceil(vistaW() / ESCALA); AB = Math.ceil(vistaH() / ESCALA);
  if (bufMundo.width !== LB || bufMundo.height !== AB) {
    bufMundo.width = LB; bufMundo.height = AB;
    bufLuz.width = Math.ceil(LB / RES_LUZ); bufLuz.height = Math.ceil(AB / RES_LUZ);
  }
}
// Posição no ecrã (dentro do interface) de um ponto do mundo
const ecraX = x => (x - vista.x) * ZOOM - MARGEM_X;
const ecraY = y => (y - vista.y) * ZOOM;
const vista = { x: 0, y: 0 }; // canto superior esquerdo da câmara (com tremor), em pixels do mundo

const NOME_TIPO = { arma: 'Arma', armadura: 'Armadura', amuleto: 'Amuleto' };

// ---------------------------------------------------------------------
//  Texto e painéis (ecrã)
// ---------------------------------------------------------------------
function textoCentro(txt, x, y, tam, cor, contorno = true) {
  txt = traduzir(txt);
  ctx.font = fonte(tam);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (contorno) {
    ctx.lineWidth = Math.max(3, tamLetra(tam) / 5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    escreverApertado(txt, x, y, tam, (a, b, c) => ctx.strokeText(a, b, c));
  }
  ctx.fillStyle = cor;
  escreverApertado(txt, x, y, tam, (a, b, c) => ctx.fillText(a, b, c));
}

function textoCentroAjustado(txt, x, y, tamMax, cor, larguraMax, contorno = true) {
  txt = traduzir(txt);
  let tam = tamMax;
  ctx.font = fonte(tam);
  while (tam > 9 && ctx.measureText(txt).width * apertoLetra(tam) > larguraMax) { tam--; ctx.font = fonte(tam); }
  // com a letra grande, se nem no tamanho mínimo cabe, aperta só na largura
  const larg = ctx.measureText(txt).width * apertoLetra(tam);
  if (larg <= larguraMax) { textoCentro(txt, x, y, tam, cor, contorno); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(larguraMax / larg, 1);
  textoCentro(txt, 0, 0, tam, cor, contorno);
  ctx.restore();
}

function textoEsq(txt, x, y, tam, cor, peso = 'bold') {
  txt = traduzir(txt);
  ctx.font = fonte(tam, peso);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cor;
  escreverApertado(txt, x, y, tam, (a, b, c) => ctx.fillText(a, b, c));
}

// Texto à esquerda que encolhe (e, no limite, aperta na largura) para caber em larguraMax
function textoEsqAjustado(txt, x, y, tamMax, cor, larguraMax, peso = 'bold') {
  txt = traduzir(txt);
  let tam = tamMax;
  ctx.font = fonte(tam, peso);
  while (tam > 8 && ctx.measureText(txt).width * apertoLetra(tam) > larguraMax) { tam--; ctx.font = fonte(tam, peso); }
  const larg = ctx.measureText(txt).width * apertoLetra(tam);
  if (larg <= larguraMax) { textoEsq(txt, x, y, tam, cor, peso); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(larguraMax / larg, 1);
  textoEsq(txt, 0, 0, tam, cor, peso);
  ctx.restore();
}

function textoDir(txt, x, y, tam, cor, peso = 'bold') {
  txt = traduzir(txt);
  ctx.font = fonte(tam, peso);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cor;
  escreverApertado(txt, x, y, tam, (a, b, c) => ctx.fillText(a, b, c));
}

// Painel com moldura "pixel": borda dura de 2px e sombra por fora
function painel(x, y, w, h, cor = 'rgba(14,11,22,0.9)', borda = '#5a4d74') {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.035)'; // luz suave na metade de cima
  ctx.fillRect(x + 2, y + 2, w - 4, Math.round(h / 2) - 2);
  ctx.fillStyle = borda;
  ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x, y, 2, h); ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; // linha escura por dentro da moldura
  ctx.fillRect(x + 2, y + h - 3, w - 4, 1); ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + 2, 1, h - 4);
  if (w > 40 && h > 24) { // cantos decorados
    ctx.fillStyle = borda;
    for (const [cx, cy] of [[x - 1, y - 1], [x + w - 3, y - 1], [x - 1, y + h - 3], [x + w - 3, y + h - 3]]) ctx.fillRect(cx, cy, 4, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const [cx, cy] of [[x, y], [x + w - 2, y], [x, y + h - 2], [x + w - 2, y + h - 2]]) ctx.fillRect(cx, cy, 2, 2);
  }
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

function botaoIdioma() {
  const b = BOTAO_IDIOMA, sobre = dentro(b);
  painel(b.x, b.y, b.w, b.h, sobre ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sobre ? '#ffffff' : '#5a4d74');
  const meio = b.x + b.w / 2;
  ctx.fillStyle = idioma === 'pt' ? '#ffe14d' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(b.x + 4, b.y + 4, b.w / 2 - 6, b.h - 8);
  ctx.fillStyle = idioma === 'en' ? '#ffe14d' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(meio + 2, b.y + 4, b.w / 2 - 6, b.h - 8);
  ctx.font = fonte(16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = idioma === 'pt' ? '#15101e' : '#aaa';
  ctx.fillText('PT', b.x + b.w / 4 + 1, b.y + b.h / 2 + 1);
  ctx.fillStyle = idioma === 'en' ? '#15101e' : '#aaa';
  ctx.fillText('EN', meio + b.w / 4 - 1, b.y + b.h / 2 + 1);
}

// Botões extra só para ecrãs táteis: Opções, Instalar e Ecrã inteiro
function botoesMenuToque(comInstalar) {
  if (!modoToque) return;
  botao(BOTAO_OPCOES, 'Opções', '#ddd');
  if (comInstalar && mostrarInstalar()) botao(BOTAO_INSTALAR, 'Instalar app', '#5dff7a');
  if (!mostrarBotaoEcra()) return;
  const b = BOTAO_ECRA, sobre = dentro(b);
  painel(b.x, b.y, b.w, b.h, sobre ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sobre ? '#ffffff' : '#5a4d74');
  // quatro cantos: para fora = entrar, para dentro = sair do ecrã inteiro
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, d = 9, l = 6, dentroE = emEcraInteiro() ? -1 : 1;
  ctx.fillStyle = '#ffe680';
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = cx + sx * d, y = cy + sy * d;
    ctx.fillRect(Math.min(x, x - sx * l * dentroE), y - 1, l, 3);
    ctx.fillRect(x - 1, Math.min(y, y - sy * l * dentroE), 3, l);
  }
}

function botao(r, txt, cor, fundo = 'rgba(18,14,28,0.95)', icone = null) {
  const sobre = rato.x > r.x && rato.x < r.x + r.w && rato.y > r.y && rato.y < r.y + r.h;
  if (!icone && typeof BOTAO_VOLTAR !== 'undefined' && r === BOTAO_VOLTAR) { icone = 'voltar'; txt = traduzir(String(txt)).replace(/^<\s*/, ''); } // (traduz antes de tirar o "<")
  if (!icone && typeof BOTAO_FECHAR !== 'undefined' && r === BOTAO_FECHAR) icone = 'fechar';
  painel(r.x, r.y, r.w, r.h, sobre ? 'rgba(50,42,72,0.97)' : fundo, sobre ? '#ffffff' : cor);
  if (icone && typeof iconeUI === 'function' && r.w > 70) {
    iconeUI(icone, r.x + 18, r.y + r.h / 2, cor, r.h < 36 ? 1.5 : 2);
    textoCentroAjustado(txt, r.x + r.w / 2 + 10, r.y + r.h / 2 + 1, 16, cor, r.w - 44);
    return;
  }
  textoCentro(txt, r.x + r.w / 2, r.y + r.h / 2 + 1, 16, cor);
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
    l.push(`Tipo: ${CLASSES_ARMA[classeArma(it)].nome}`);
    l.push(`Dano: ${it.dano}`, `Velocidade: ${it.vel}x`, `Alcance: ${it.alcance}`, `Crítico: +${pct(it.crit)}`);
    if (it.magia) l.push(`Poder mágico: +${pct(it.magia)}`);
  } else if (it.tipo === 'armadura') {
    l.push(`Defesa: ${it.def}`, `Vida: ${it.hp >= 0 ? '+' : ''}${it.hp}`);
    if (it.mana) l.push(`Mana: +${it.mana}`);
  } else {
    if (it.crit) l.push(`Crítico: +${pct(it.crit)}`);
    if (it.velMov) l.push(`Velocidade: ${it.velMov > 0 ? '+' : ''}${pct(it.velMov)}`);
    if (it.roubo) l.push(`Roubo de vida: ${pct(it.roubo)}`);
    if (it.regen) l.push(`Regeneração: ${(+it.regen).toFixed(1)}/s`);
    if (it.danoPct) l.push(`Dano: +${pct(it.danoPct)}`);
    if (it.magia) l.push(`Poder mágico: +${pct(it.magia)}`);
    if (it.mana) l.push(`Mana: +${it.mana}`);
    if (!l.length) l.push('Não faz absolutamente nada.');
  }
  l.push(...linhasConjunto(it));
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
  ctxTela.fillRect(0, 0, TELA_W, ALTURA);
  ctx = ctxTela;
  ctx.setTransform(1, 0, 0, 1, MARGEM_X, 0); // o interface fica centrado
  if (estado === 'convidado' && !convidadoPronto()) { desenharConvidado(t); desenharAvisos(); desenharAvisoRodar(); return; } // a jogar a 2: à espera do jogo do parceiro
  if (estado === 'titulo' || estado === 'coop' || estado === 'criar' || estado === 'almas' || estado === 'colecao' || estado === 'conquistas' ||
      estado === 'pacto' || estado === 'registo' || estado === 'diario' || estado === 'transferir' ||
      (estado === 'opcoes' && opcoesVoltar !== 'pausa')) {
    if (estado === 'titulo') desenharTitulo(t);
    else if (estado === 'criar') desenharCriacao(t);
    else if (estado === 'opcoes') desenharOpcoes(t);
    else if (estado === 'pacto') desenharPacto(t);
    else if (estado === 'registo') desenharRegisto(t);
    else if (estado === 'diario') desenharDiario(t);
    else if (estado === 'transferir') desenharTransferir();
    else if (estado === 'coop') desenharLobby(t);
    else desenharMenuMeta(t);
    desenharAvisos();
    desenharAvisoRodar();
    return;
  }

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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(bufMundo, 0, 0, LB * ESCALA * ZOOM, AB * ESCALA * ZOOM);
  ctx.setTransform(1, 0, 0, 1, MARGEM_X, 0);
  desenharTextosMundo();
  desenharEtiquetasCoop(t);
  if (!['pausa', 'opcoes', 'status', 'cidade', 'mapa', 'fim'].includes(estado) && !(estado === 'convidado' && ['status', 'cidade', 'mapa'].includes(coop.menu))) desenharHUD(t);
  desenharTutorial(t);
  desenharDica();
  desenharFalas();

  if (estado === 'bau') desenharRoleta(t);
  else if (estado === 'nivel') desenharEscolha(t);
  else if (estado === 'loja') desenharLoja(t);
  else if (estado === 'encantar') desenharMesa(t);
  else if (estado === 'personagem') desenharPersonagem();
  else if (estado === 'mochila') desenharMochila();
  else if (estado === 'pausa') desenharPausa();
  else if (estado === 'opcoes') desenharOpcoes(t);
  else if (estado === 'status') desenharStatus(t);
  else if (estado === 'cidade') desenharPainelCidade(t);
  else if (estado === 'mapa') desenharMapaGrande();
  else if (estado === 'fim') desenharFim(t);
  else if (estado === 'morto') desenharMorte();
  else if (estado === 'convidado') desenharExtrasConvidado(t); // a jogar a 2: os menus do convidado
  desenharClarao();
  desenharAvisos();
  desenharAvisoRodar();
}

function desenharMundo(t) {
  ctx.drawImage(mapaImg, 0, 0, mapa.W * TILE, mapa.H * TILE);
  desenharSalas();
  for (const a of armadilhas) desenharArmadilha(a);
  desenharPocas(t);
  desenharAnimados(t);
  desenharCadaveres(t);
  desenharEscada(t);
  for (const p of perigos) desenharPerigo(p);
  for (const d of drops) desenharDrop(d);
  const tochas = SPR.tochaZona[zonaAtual()];
  for (const tc of mapa.tochas) spr(tochas[Math.floor(t * 6 + tc.x) % 2], tc.x, tc.y);
  desenharEstatuaTemplo(t);
  desenharCidadeMundo(t);

  // tudo o que tem "altura" é ordenado pela posição vertical
  const lista = [];
  for (const b of baus) lista.push({ y: b.y, f: () => desenharBau(b) });
  for (const o of objetos) lista.push({ y: o.y, f: () => desenharObjeto(o, t) });
  for (const r of restos) lista.push({ y: r.y, f: () => desenharResto(r) });
  entidadesCidade(lista);
  if (pet && estado !== 'morto') lista.push({ y: pet.y, f: () => desenharPet(t) });
  for (const s of sombras) lista.push({ y: s.y, f: () => desenharSombra(s, t) });
  for (const s of sombrasParceiro()) lista.push({ y: s.y, f: () => desenharSombra(s, t) }); // a jogar a 2
  for (const e of inimigos) if (!e.morto) lista.push({ y: e.y, f: () => desenharInimigo(e, t) });
  if (estado !== 'morto') lista.push({ y: J.y, f: () => desenharJogador(t) });
  if (estado !== 'morto' && parceiroAtivo()) lista.push({ y: coop.p2.y, f: () => desenharParceiro(t) });
  lista.sort((a, b) => a.y - b.y);
  for (const it of lista) it.f();

  for (const o of ondas) {
    const f = 1 - o.t / o.dur;
    ctx.globalAlpha = 0.8 * (1 - f);
    aro(o.x, o.y, alinhar(o.r * (0.3 + f * 0.7)), o.cor, 6);
    ctx.globalAlpha = 0.15 * (1 - f);
    circulo(o.x, o.y, alinhar(o.r * (0.3 + f * 0.7)), o.cor);
    ctx.globalAlpha = 1;
  }
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
  desenharAmbiente();
  desenharNevoa();
}

// Escuridão com "furos" de luz: a tua tocha, as tochas nas paredes e alguns objetos
function desenharLuz(t) {
  const L = ctxLuz;
  L.globalCompositeOperation = 'source-over';
  const LW = bufLuz.width, LH = bufLuz.height, E2 = ESCALA * RES_LUZ;
  L.clearRect(0, 0, LW, LH);
  L.fillStyle = `rgba(3,2,8,${naCidade() ? 0.12 : escuridaoEvento() || (mapa.eBoss ? 0.55 : bioma().escuro)})`;
  L.fillRect(0, 0, LW, LH);
  L.globalCompositeOperation = 'destination-out';
  let luzesTiros = 0;
  const luz = (x, y, r, forca) => {
    const bx = (x - vista.x) / E2, by = (y - vista.y) / E2, br = r / E2;
    if (bx < -br || by < -br || bx > LW + br || by > LH + br) return;
    L.globalAlpha = forca;
    L.drawImage(manchaLuz(), bx - br, by - br, br * 2, br * 2);
    L.globalAlpha = 1;
  };
  luz(J.x, J.y, 330 + Math.sin(t * 7) * 6, 1);
  luzParceiro(luz, t);
  if (pet && J.pet && J.pet.tipo !== 'lobo') luz(pet.x, pet.y, 70, 0.6);
  for (const tc of mapa.tochas) luz(tc.x, tc.y + 20, 150 + tremorTocha(t, tc.x), 0.85);
  for (const o of objetos) {
    if (o.tipo === 'cristal') luz(o.x, o.y, 110, o.fase === 'feito' ? 0.3 : 0.8);
    else if (o.tipo === 'altar' && !o.usado) luz(o.x, o.y, 110, 0.7);
    else if (o.tipo === 'mercador') luz(o.x, o.y, 130, 0.8);
    else if (o.tipo === 'mesa') luz(o.x, o.y, 120, 0.8);
  }
  for (const b of baus) if (b.tipo === 'ouro') luz(b.x, b.y, 90, 0.7);
  for (const p of projeteis) if ((p.tipo === 'fogo' || p.dono === 'jogador') && luzesTiros++ < 14) luz(p.x, p.y, p.explode ? 110 : 50, p.explode ? 0.8 : 0.5);
  for (const o of ondas) luz(o.x, o.y, o.r * 1.4, 0.6 * (o.t / o.dur));
  for (const o of objetos) if (o.tipo === 'portal' || o.tipo === 'saidaPortal') luz(o.x, o.y, 120, 0.8);
  for (const d of drops) if (d.tipo === 'livro' || d.tipo === 'reliquia') luz(d.x, d.y, 70, 0.6);
  for (const e of inimigos) if (e.lasersB && e.lasersB.fase === 'fogo') for (const a0 of e.lasersB.angs) for (let k = 0; k < 500; k += 80) luz(e.x + Math.cos(e.lasersB.base + a0) * k, e.y + Math.sin(e.lasersB.base + a0) * k, 60, 0.6);
  if (mapa.escada.ativa) luz(mapa.escada.x, mapa.escada.y, 80, 0.5);
  for (const l of mapa.luzes || []) luz(l.x, l.y, 70 + Math.sin(t * 2 + l.x) * 6, 0.55);
  for (const p of pocas) if (p.tipo !== 'gosma') luz(p.x, p.y, 60, 0.4);
  for (const e of inimigos) if (e.laser && e.laser.fase === 'fogo') for (let k = 0; k < e.laser.comp; k += 60) luz(e.x + Math.cos(e.laser.ang) * k, e.y + Math.sin(e.laser.ang) * k, 60, 0.7);
  L.globalCompositeOperation = 'source-over';
  ctxMundo.imageSmoothingEnabled = true; // esticar a luz com suavidade
  ctxMundo.drawImage(bufLuz, 0, 0, LW * RES_LUZ, LH * RES_LUZ);
  ctxMundo.imageSmoothingEnabled = false;

  // brilho das tochas (da cor da zona) e da decoração que brilha
  ctxMundo.globalCompositeOperation = 'lighter';
  const brilho = (x, y, raio, rgb, forca) => {
    const bx = (x - vista.x) / ESCALA, by = (y - vista.y) / ESCALA;
    if (bx < -40 || by < -40 || bx > LB + 40 || by > AB + 40) return;
    ctxMundo.globalAlpha = forca;
    ctxMundo.drawImage(manchaLuz(rgb), bx - raio, by - raio, raio * 2, raio * 2);
    ctxMundo.globalAlpha = 1;
  };
  for (const tc of mapa.tochas) if (explorado(tc.x, tc.y + TILE)) {
    const tr = tremorTocha(t, tc.x);
    brilho(tc.x, tc.y + 10, 34 + tr * 0.4, bioma().brilho, 0.16);
    brilho(tc.x, tc.y + 46, 50 + tr, bioma().brilho, 0.07 + tr * 0.003); // luz a tremer no chão
  }
  for (const l of mapa.luzes || []) if (explorado(l.x, l.y)) brilho(l.x, l.y, 22 + tremorTocha(t, l.x) * 0.3, hexRgb(l.cor).join(','), 0.22);
  ctxMundo.globalCompositeOperation = 'source-over';
}

// Já estiveste perto deste sítio? (o que não foi explorado fica às escuras)
const explorado = (x, y) => !!mapa.explorado[Math.floor(y / TILE) * mapa.W + Math.floor(x / TILE)];

function desenharNevoa() {
  const x0 = Math.max(0, Math.floor(vista.x / TILE) - 1), y0 = Math.max(0, Math.floor(vista.y / TILE) - 1);
  const x1 = Math.min(mapa.W - 1, x0 + Math.ceil(vistaW() / TILE) + 2), y1 = Math.min(mapa.H - 1, y0 + Math.ceil(vistaH() / TILE) + 2);
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
  if (f > 0.4 && cor !== '#ff3b3b' && !p.semQueda) { // algo a cair do teto
    const q = (f - 0.4) / 0.6;
    const y = p.y - (1 - q) * 160;
    circulo(p.x, y, 10, cor === '#a89f91' ? '#6d665c' : '#ff9b45');
    circulo(p.x - 2, y - 2, 5, cor === '#a89f91' ? '#a89f91' : '#ffe14d');
  }
}

function desenharDrop(d) {
  const bob = Math.sin(d.t * 4) * 3;
  if (d.tipo === 'pocao') { sombra(d.x, d.y + 10, 7); spr(SPR.pocao, d.x, d.y + bob); return; }
  if (d.tipo === 'livro') {
    sombra(d.x, d.y + 14, 9);
    spr(SPR.livro[d.feitico], d.x, d.y + bob * 1.5 - 4);
    if (Math.floor(d.t * 4) % 2) { ctx.fillStyle = FEITICOS[d.feitico].cor; ctx.fillRect(alinhar(d.x + 12), alinhar(d.y - 18 + bob), 4, 4); }
    return;
  }
  if (d.tipo === 'reliquia') {
    const R = RELIQUIAS[d.id];
    sombra(d.x, d.y + 14, 9);
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(d.t * 5);
    circulo(d.x, d.y + bob - 4, 20, R.cor);
    ctx.globalAlpha = 1;
    spr(iconeReliquia(d.id), d.x, d.y + bob * 1.5 - 4);
    return;
  }
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
  if (o.tipo === 'portal' || o.tipo === 'saidaPortal') { desenharPortal(o, t); return; }
  if (o.tipo === 'portaDupla') { desenharPortaDupla(o, t); return; }
  if (o.tipo === 'escadaCidade' || o.tipo === 'escadaMasmorra') { desenharEscadaCidade(o, t); return; }
  if (o.tipo === 'edificio') return; // a porta já está desenhada no edifício
  if (desenharObjetoExtra(o, t)) return;
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
  } else if (o.tipo === 'gaiola') {
    sombra(o.x, o.y + 18, 16);
    const frames = SPR.pet[o.pet];
    spr(frames[Math.floor(t * 3) % frames.length], o.x, o.y + 4 + Math.sin(t * 3 + o.x) * 2, Math.sin(t + o.x) > 0);
    spr(SPR.gaiola, o.x, o.y);
  } else if (o.tipo === 'mesa') {
    sombra(o.x, o.y + 14, 16);
    spr(SPR.mesa, o.x, o.y);
    ctx.fillStyle = ['#d9a6ff', '#b44dff', '#ffffff'][Math.floor(t * 5) % 3];
    ctx.fillRect(alinhar(o.x - 4 + Math.sin(t * 3) * 8), alinhar(o.y - 24 - (t * 20) % 16), 2, 2);
  } else if (o.tipo === 'cristal') {
    const bob = o.fase === 'feito' ? 0 : Math.sin(t * 2) * 3;
    spr(SPR.cristal[o.fase], o.x, o.y - 8 + bob);
    if (o.fase === 'ativo') sprCor(SPR.cristal.ativo, o.x, o.y - 8 + bob, false, '#ffffff', 0.25 + Math.sin(t * 10) * 0.2);
  }
}

function desenharJogador(t) {
  if (J.caido) { desenharCaido(t); return; } // a jogar a 2: espera que o parceiro o reanime
  if (!J.remoto) desenharRastos();
  const piscar = J.invuln > 0 && Math.floor(J.invuln * 20) % 2 === 0;
  sombra(J.x, J.y + 12, 10);
  let ang = J.angArma;
  if (J.golpe && !J.golpe.giro && (J.golpe.estilo === 'lanca' || J.golpe.estilo === 'martelo')) {
    // lança: estocada em linha; martelo: pancada à volta (desenhada com uma onda)
    const p = 1 - J.golpe.t / J.golpe.dur;
    if (J.golpe.estilo === 'lanca') {
      const a = J.golpe.ang, alc = J.golpe.alcance * (0.4 + 0.6 * Math.sin(p * Math.PI));
      ctx.strokeStyle = RARIDADES[J.arma.r].cor;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(alinhar(J.x), alinhar(J.y));
      ctx.lineTo(alinhar(J.x + Math.cos(a) * alc), alinhar(J.y + Math.sin(a) * alc));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ang = J.golpe.ang;
  } else if (J.golpe) {
    const p = 1 - J.golpe.t / J.golpe.dur;
    const largo = { adaga: 1.8, machado: 3.2, foice: 4.8 }[J.golpe.estilo] || 2.4;
    const volta = J.golpe.giro ? Math.PI * 2 : largo;
    const inicio = J.golpe.giro ? J.golpe.ang : J.golpe.ang - largo / 2;
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
  if (J.furtivo > 0) ctx.globalAlpha = 0.3 + 0.1 * Math.sin(t * 8);
  const c = framesHeroi(J.raca, J.skin)[frame];
  const P = poseHeroi(t); // estocada, dor e respiração
  ctx.save();
  ctx.translate(J.x + P.ox, J.y + 12 + P.oy); ctx.scale(P.sx, P.sy); ctx.translate(-J.x, -J.y - 12);
  spr(c, J.x, J.y - 4, olhaEsq);
  if (J.armadura) sprCor(c, J.x, J.y - 4, olhaEsq, RARIDADES[J.armadura.r].cor, 0.18);
  if (J.lentoT > 0) sprCor(c, J.x, J.y - 4, olhaEsq, '#ffffff', 0.4);
  if (J.veneno > 0) sprCor(c, J.x, J.y - 4, olhaEsq, '#5dff3a', 0.3 + Math.sin(t * 8) * 0.1);
  if (J.formaBestial > 0) sprCor(c, J.x, J.y - 4, olhaEsq, '#ffffff', 0.45 + Math.sin(t * 10) * 0.15);
  if (J.dorT > 0) sprCor(c, J.x, J.y - 4, olhaEsq, '#ff3030', 0.55);
  ctx.restore();
  if (J.bebeuT > 0) { ctx.globalAlpha = J.bebeuT; aro(J.x, J.y - 2, 26 - J.bebeuT * 10, '#5dff7a', 3); ctx.globalAlpha = 1; }
  if (J.escudoTitan > 0) { ctx.globalAlpha = 0.5; aro(J.x, J.y - 2, 24, '#c0a060', 3); ctx.globalAlpha = 1; }
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
  const novo = spriteBioma(e, t) || spriteConteudo(e, t) || spriteFinais(e, t);
  if (novo) return novo;
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
    case 'zumbi': return { c: SPR.zumbi[0], y: e.caido > 0 ? 8 : e.acordado ? -Math.abs(Math.sin(e.t * 5)) * 2 : 0, alpha: e.caido > 0 ? 0.5 : 0, flip: Math.sin(e.t * 2.5) > 0 };
    case 'diabrete': return { c: SPR.diabrete[0], y: -8 + Math.sin(e.t * 7) * 3, voa: true, flip: J.x < e.x };
    case 'slimeLava': {
      const pulo = e.acordado && e.t % 1.0 < 0.45;
      return { c: SPR.slimeLava[pulo ? 0 : 1], y: pulo ? -Math.sin((e.t % 1.0) / 0.45 * Math.PI) * 10 : 0 };
    }
    case 'loboGelo': return { c: SPR.loboGelo[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 12)) * 3 : 0, flip: J.x < e.x };
    case 'elementalGelo': return { c: SPR.elementalGelo[0], y: -10 + Math.sin(e.t * 3) * 4, voa: true };
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
  if (e.enterrado > 0) { // escorpião debaixo da areia: só se vê o monte a andar
    circulo(e.x, e.y + 6, 12, '#8a6a3a');
    circulo(e.x - 2, e.y + 4, 8, '#c8a060');
    return;
  }
  if (e.mini) { // os pequenos que nascem ao dividir
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(0.65, 0.65);
    ctx.translate(-e.x, -e.y);
  }
  desenharAvisosInimigo(e, t);
  const s = spriteInimigo(e, t);
  const h = s.c.height * ESCALA;
  sombra(e.x, e.y + (e.boss ? h * 0.4 : e.r * 0.8), e.boss ? e.r * 0.9 : e.r * (s.voa ? 0.6 : 0.9));
  const x = e.x, y = e.y + s.y;
  const flip = !!s.flip;
  const alfaBase = e.alfa ?? 1;

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
  if ((e.tipo === 'orc' && e.preparar > 0) || e.prepInv > 0) sprCor(s.c, x, y, flip, '#ff3c3c', 0.6);
  if (e.buffT > 0) { ctx.globalAlpha = 0.5 * alfaBase; aro(e.x, e.y + e.r * 0.8, e.r + 4, '#ff6060', 2); ctx.globalAlpha = 1; }

  // animação: respirar, inclinar ao andar, amassar ao levar um golpe, crescer ao atacar e ao aparecer
  const pe = y + h / 2 - 2;
  let PA = null;
  ctx.save();
  {
    const resp = Math.sin(t * 3 + e.x * 0.05);
    let sx = 1 - 0.02 * resp, sy = 1 + 0.035 * resp;
    const mov = e.x - (e.ultX ?? e.x);
    e.ultX = e.x;
    e.incl = (e.incl || 0) * 0.85 + clamp(mov * 0.05, -0.16, 0.16) * 0.15;
    if (e.flash > 0) { sx *= 1.16; sy *= 0.86; }
    if (e.preparar > 0 || e.prepInv > 0 || e.golpeT > 0 || e.ceifaT > 0 || (e.boss && e.investida > 0)) { sx *= 1.08; sy *= 1.08; }
    const idade = tempoJogo - (e.nasceu ?? -9);
    if (idade >= 0 && idade < 0.35) { const k = 0.2 + 0.8 * idade / 0.35; sx *= k; sy *= k; }
    PA = poseAtaque(e); // prepara-se antes de atacar e golpeia
    sx *= PA.sx; sy *= PA.sy;
    ctx.translate(x + PA.ox, pe + PA.oy);
    ctx.rotate((e.boss ? e.incl * 0.4 : e.incl) + PA.rot);
    ctx.scale(sx, sy);
    ctx.translate(-x, -pe);
  }
  if (e.boss) { // brilho à volta dos bosses
    ctx.globalAlpha = (0.18 + Math.sin(t * 4) * 0.08) * alfaBase;
    const sil = silhueta(s.c, e.aura || e.cor);
    for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) spr(sil, x + ox, y + oy, flip);
    ctx.globalAlpha = 1;
  }
  if (e.elite) {
    const cor = ELITES[e.elite].cor;
    ctx.globalAlpha = (0.55 + Math.sin(t * 6) * 0.25) * alfaBase;
    const sil = silhueta(s.c, cor);
    for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) spr(sil, x + ox, y + oy, flip);
    ctx.globalAlpha = 1;
  }
  if (e.aura) { ctx.globalAlpha = 0.22 + 0.12 * Math.sin(t * 3); circulo(e.x, e.y, e.r * 1.8, e.aura); ctx.globalAlpha = 1; }
  ctx.globalAlpha = (s.alpha || 1) * alfaBase;
  spr(s.c, x, y, flip);
  if (e.tinta) sprCor(s.c, x, y, flip, e.tinta, 0.45);
  ctx.globalAlpha = 1;
  if (alfaBase < 0.5) { ctx.restore(); if (e.mini) ctx.restore(); return; } // invisível: nem barra de vida
  if (e.enfurecido) sprCor(s.c, x, y, flip, '#ff2020', 0.25 + Math.sin(t * 10) * 0.1);
  if (e.tipo === 'dragao' && e.investida > 0) sprCor(s.c, x, y, flip, '#ff7b25', 0.35);
  if (e.tipo === 'demonio' && e.aparecer > 0) sprCor(s.c, x, y, flip, '#ffffff', 0.5);
  if (e.flash > 0) sprCor(s.c, x, y, flip, '#ffffff', 0.85);
  else if (e.congelado > 0) sprCor(s.c, x, y, flip, '#bfe6ff', 0.65);
  else if (e.parado > 0) sprCor(s.c, x, y, flip, '#7df9ff', 0.45 + 0.1 * Math.sin(t * 6));
  else if (e.lento > 0) sprCor(s.c, x, y, flip, '#7fd8ff', 0.4);
  else if (e.queima > 0) sprCor(s.c, x, y, flip, '#ff7b25', 0.3);
  ctx.restore();
  if (PA) desenharEfeitoAtaque(e, PA, t);

  if (e.tipo === 'dragao' && e.sopro > 0) {
    const ang = Math.atan2(J.y - e.y, J.x - e.x);
    circulo(e.x + Math.cos(ang) * 30, e.y - 20 + Math.sin(ang) * 30, 8 + Math.random() * 4, '#ff9b45');
  }
  if (!e.boss && (e.hp < e.maxHp || e.elite)) {
    barraMundo(e.x - 16, y - h / 2 - 10, 32, e.hp / e.maxHp, e.elite ? ELITES[e.elite].cor : '#ff4d4d');
  }
  if (!e.boss) desenharNivelInimigo(e, y - h / 2 - (e.hp < e.maxHp || e.elite ? 20 : 10));
  if (e.mini) ctx.restore();
}

function desenharProjetil(p, t) {
  if (p.caindo) { // alvo no chão e a coisa a cair do céu
    ctx.globalAlpha = 0.6;
    aro(p.x, p.y, p.explode * 0.6, p.cor, 2);
    ctx.globalAlpha = 1;
    const y = p.y - Math.min(1, p.vida) * 260;
    if (p.tipo === 'fogo') { circulo(p.x, y, 9, '#ff5a1a'); circulo(p.x, y, 5, '#ffe14d'); }
    else { ctx.strokeStyle = p.cor; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(alinhar(p.x), alinhar(y - 16)); ctx.lineTo(alinhar(p.x), alinhar(y)); ctx.stroke(); }
    return;
  }
  if (desenharProjetilBioma(p, t)) return;
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
    textoCentro(tx.txt, ecraX(tx.x), ecraY(tx.y), tx.tam, tx.cor);
  }
  ctx.globalAlpha = 1;
  if (pet && J.pet && estado !== 'morto') {
    textoCentro(`${nomePet()} Nv ${J.pet.nivel}`, ecraX(pet.x), ecraY(pet.y) - (petEvoluido() ? 34 : 26), 11, PETS[J.pet.tipo].cor);
  }
  for (const o of objetos) desenharLetraPortal(o);
  desenharNomesSombras();
  if (mapa.templo) desenharInfoTemplo();
  desenharNomesCidade();
  // nomes dos inimigos de elite
  for (const e of inimigos) {
    if (!e.elite || e.morto || !explorado(e.x, e.y) || (e.alfa ?? 1) < 0.5 || e.enterrado > 0) continue;
    const sx = ecraX(e.x), sy = ecraY(e.y) - 44;
    if (sx < -50 - MARGEM_X || sy < -20 || sx > LARGURA + MARGEM_X + 50 || sy > ALTURA + 20) continue;
    textoCentro(`Elite ${ELITES[e.elite].nome}`, sx, sy, 12, ELITES[e.elite].cor);
  }
}

// ---------------------------------------------------------------------
//  HUD
// ---------------------------------------------------------------------
function desenharHUD(t) {
  ctx.save();
  ctx.translate(-MARGEM_X, 0); // painel da vida no canto esquerdo do ecrã
  painel(10, 10, 280, 112);
  textoEsq(`Nv ${J.nivel}`, 22, 28, 20, '#ffe14d');
  const rk = rankJogador();
  textoEsq(`PODER ${formatarPoder(poderJogador())}`, 84, 28, 13, corPoder());
  textoEsq(rk.letra === 'Nacional' ? 'NAC' : rk.letra, 196, 28, 15, rk.cor);
  if (J.pontos > 0 && Math.floor(t * 3) % 2) textoEsq(`+${J.pontos}`, 240, 28, 13, '#ffe14d');
  barra(22, 44, 256, 18, J.hp / S.maxHp, J.veneno > 0 ? '#5dbf3a' : J.hp / S.maxHp < 0.3 ? '#ff2d2d' : '#e0413e');
  textoCentro(`${Math.ceil(J.hp)} / ${S.maxHp}`, 150, 53, 13, '#fff');
  barra(22, 70, 256, 12, J.mana / S.maxMana, '#8a4dff', '#1e1438');
  textoCentro(`${Math.floor(J.mana)} / ${S.maxMana}`, 150, 76, 11, '#e8dcff');
  barra(22, 90, 256, 6, J.xp / xpProximo(J.nivel), '#3d9bff');
  textoEsq(`XP ${J.xp}/${xpProximo(J.nivel)}`, 22, 110, 12, '#9fc8ff', 'normal');
  sprEcra(SPR.moeda, 200, 110, 3);
  textoEsq(`${J.ouro}`, 214, 110, 15, '#ffd23f');

  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  obtidas.forEach((p, i) => {
    const x = 26 + (i % 10) * 28, y = 142 + Math.floor(i / 10) * 28;
    iconePerk(p, x, y, 12);
    if (nPerk(p.id) > 1) textoCentro(`${nPerk(p.id)}`, x + 10, y + 9, 11, '#fff');
  });
  const yRel = 142 + Math.ceil(obtidas.length / 10) * 28;
  (J.reliquias || []).forEach((id, i) => sprEcra(iconeReliquia(id), 26 + (i % 10) * 28, yRel + Math.floor(i / 10) * 28, 2));
  desenharHudParceiro(yRel + Math.ceil((J.reliquias || []).length / 10) * 28 + 4, t); // a jogar a 2

  ctx.restore();
  desenharMinimapa();

  if (modoToque) { desenharHUDFinal(t); desenharControlosToque(t); return; }

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

  // feitiços
  const fx0 = 378;
  const FJ = feiticosJ(); // só as magias do teu caçador
  if (FJ.length) painel(fx0 - 10, by - 10, FJ.length * 66 + 12, 86);
  FJ.forEach((id, i) => {
    const x = fx0 + i * 66, f = FEITICOS[id], nv = J.feiticos[id] || 0;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, by, 58, 58);
    if (!nv) {
      ctx.globalAlpha = 0.25;
      sprEcra(silhueta(SPR.feitico[id], '#888888'), x + 29, by + 29, 3);
      ctx.globalAlpha = 1;
      textoCentro('?', x + 29, by + 29, 18, '#777', false);
    } else {
      const semMana = J.mana < custoMana(id);
      if (semMana) ctx.globalAlpha = 0.4;
      sprEcra(SPR.feitico[id], x + 29, by + 29, 3);
      ctx.globalAlpha = 1;
      const cd = J.cdFeitico[id] || 0;
      if (cd > 0) {
        const fr = clamp(cd / f.cd, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, by + Math.round(58 * (1 - fr)), 58, Math.round(58 * fr));
      }
      ctx.fillStyle = f.cor;
      ctx.fillRect(x, by, 58, 2); ctx.fillRect(x, by + 56, 58, 2); ctx.fillRect(x, by, 2, 58); ctx.fillRect(x + 56, by, 2, 58);
      textoCentro(`${custoMana(id)}`, x + 46, by + 49, 11, semMana ? '#ff8080' : '#c9b0ff');
      if (nv > 1) textoCentro('I'.repeat(nv), x + 10, by + 49, 11, f.cor);
    }
    textoCentro(`${i + 1}`, x + 8, by + 9, 12, '#fff');
    textoCentro(f.nome, x + 29, by + 68, 10, nv ? '#aaa' : '#555', false);
  });

  // habilidades de caçador (teclas 5 a 8)
  const hx0 = fx0 + FJ.length * 66 + (FJ.length ? 16 : 0);
  const CL = classeJ(), HJ = habsJ();
  painel(hx0 - 10, by - 10, (HJ.length + 1) * 46 + 12, 86);
  { // habilidade única do caçador (tecla F)
    const x = hx0, cd = J.cdClasse || 0;
    ctx.fillStyle = 'rgba(255,230,128,0.08)';
    ctx.fillRect(x, by + 6, 42, 44);
    ctx.globalAlpha = CL.hab ? (J.mana < CL.mana ? 0.45 : 1) : 0.25;
    circuloEcra(x + 21, by + 28, 16, 'rgba(30,24,10,0.9)', CL.cor, 3);
    textoCentro('★', x + 21, by + 29, 14, CL.cor);
    ctx.globalAlpha = 1;
    if (cd > 0 && CL.hab) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; const fr = clamp(cd / CL.cd, 0, 1); ctx.fillRect(x, by + 6 + Math.round(44 * (1 - fr)), 42, Math.round(44 * fr)); }
    textoCentro('F', x + 6, by + 12, 11, '#fff');
    textoCentro(CL.hab ? `${CL.mana}` : '—', x + 21, by + 60, 10, '#ffe680', false);
  }
  HJ.forEach((h, i) => {
    const x = hx0 + (i + 1) * 46, tem = temHabilidade(h), cd = (J.cdHab || {})[h.id] || 0;
    ctx.fillStyle = 'rgba(77,195,255,0.08)';
    ctx.fillRect(x, by + 6, 42, 44);
    ctx.globalAlpha = tem ? (J.mana < h.mana ? 0.45 : 1) : 0.25;
    circuloEcra(x + 21, by + 28, 16, 'rgba(6,20,40,0.9)', h.cor, 3);
    textoCentro(h.nome[0], x + 21, by + 29, 14, h.cor);
    ctx.globalAlpha = 1;
    if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; const fr = clamp(cd / h.cd, 0, 1); ctx.fillRect(x, by + 6 + Math.round(44 * (1 - fr)), 42, Math.round(44 * fr)); }
    textoCentro(`${5 + i}`, x + 6, by + 12, 11, '#fff');
    textoCentro(tem ? `${h.mana}` : `Nv${h.nivel}`, x + 22, by + 60, 10, tem ? '#9fdcff' : '#667', false);
  });
  if (estado === 'jogo' && CL.hab && rato.x > hx0 && rato.x < hx0 + 42 && rato.y > by && rato.y < by + 58) {
    const px = clamp(hx0 - 110, 10, LARGURA - 250);
    painel(px, by - 104, 240, 90, 'rgba(24,18,8,0.96)', CL.cor);
    textoCentro(`${CL.habNome} (F)`, px + 120, by - 86, 14, CL.cor);
    textoCentroAjustado(CL.habDesc, px + 120, by - 64, 11, '#ddd', 224, false);
    textoCentro(`Mana ${CL.mana} · Recarga ${CL.cd}s`, px + 120, by - 42, 12, '#ffe680', false);
  }
  if (estado === 'jogo') HJ.forEach((h, i) => {
    const x = hx0 + (i + 1) * 46;
    if (!(rato.x > x && rato.x < x + 44 && rato.y > by && rato.y < by + 58)) return;
    const px = clamp(x - 110, 10, LARGURA - 250);
    painel(px, by - 104, 240, 90, 'rgba(6,20,40,0.96)', h.cor);
    textoCentro(`${h.nome}${temHabilidade(h) ? '' : ` (nível ${h.nivel})`}`, px + 120, by - 86, 14, h.cor);
    textoCentroAjustado(h.desc, px + 120, by - 64, 11, '#ddd', 224, false);
    textoCentro(`Mana ${h.mana} · Recarga ${h.cd}s · tecla ${5 + i}`, px + 120, by - 42, 12, '#9fdcff', false);
  });

  if (estado === 'jogo') slots.forEach(([k], i) => {
    const x = 20 + i * 66;
    if (J[k] && rato.x > x && rato.x < x + 58 && rato.y > by && rato.y < by + 58) desenharCartaItem(J[k], x, by - 200, 'Equipado');
  });
  if (estado === 'jogo') FJ.forEach((id, i) => {
    const x = fx0 + i * 66;
    if (!(rato.x > x && rato.x < x + 58 && rato.y > by && rato.y < by + 58)) return;
    const f = FEITICOS[id], nv = J.feiticos[id] || 0;
    const px = clamp(x - 90, 10, LARGURA - 250);
    painel(px, by - 104, 240, 90, 'rgba(12,10,20,0.96)', f.cor);
    textoCentro(nv ? `${f.nome} (nível ${nv})` : `${f.nome} (por aprender)`, px + 120, by - 86, 14, f.cor);
    textoCentroAjustado(f.desc, px + 120, by - 64, 12, '#ddd', 224, false);
    textoCentro(nv ? `Mana ${custoMana(id)} · Recarga ${f.cd}s` : 'Encontra um Livro de Feitiço', px + 120, by - 42, 12, '#aaa', false);
  });

  desenharHUDFinal(t);
  textoDir(`[C] Personagem   [U] Estado   [I] Mochila   [M] Som: ${nomeSom()}`, LARGURA - 70, ALTURA - 96, 12, 'rgba(255,255,255,0.45)', 'normal');
  if (estado === 'jogo') {
    const b = BOTAO_PAUSA, sobre = dentro(b);
    painel(b.x, b.y, b.w, b.h, sobre ? 'rgba(50,42,72,0.97)' : 'rgba(14,11,22,0.85)', sobre ? '#ffffff' : '#5a4d74');
    ctx.fillStyle = sobre ? '#ffffff' : '#cfc6e0';
    ctx.fillRect(b.x + 13, b.y + 10, 5, 16);
    ctx.fillRect(b.x + 22, b.y + 10, 5, 16);
  }
}

// Partes do HUD comuns ao teclado e ao toque
function desenharHUDFinal(t) {
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
      const sx = ecraX(mapa.escada.x), sy = ecraY(mapa.escada.y) - 40;
      if (mapa.escada.ativa) textoCentro(modoToque ? 'Usar: Descer' : '[E] Descer', sx, sy, 16, '#ffe680');
      else textoCentro('Derrota o boss para abrir', sx, sy, 14, '#ff8080');
    }
  }

  if (banner && estado === 'jogo') {
    const a = clamp(Math.min(banner.t, 3 - banner.t) * 2, 0, 1);
    ctx.globalAlpha = a;
    textoCentro(banner.titulo, LARGURA / 2, 170, 40, banner.cor);
    if (banner.sub) textoCentro(banner.sub, LARGURA / 2, 210, 18, '#ddd');
    if (banner.extra) textoCentro(banner.extra, LARGURA / 2, 238, 14, banner.corExtra || '#9fdcff');
    if (banner.extra2) textoCentro(banner.extra2, LARGURA / 2, 260, 14, '#ff4dff');
    ctx.globalAlpha = 1;
  }
}

const cacheMinimapa = { c: null, mapa: null, t: 0 };
function desenharMinimapa() {
  const esc = 3;
  const w = mapa.W * esc, h = mapa.H * esc;
  const x0 = LARGURA + MARGEM_X - w - 16, y0 = 40; // no canto direito do ecrã
  painel(x0 - 6, 10, w + 12, h + 40);
  textoCentro(naCidade() ? 'CIDADE' : J.modo === 'torre' ? `TORRE ${andar}/100` : `ANDAR ${andar}`, x0 + w / 2, 25, 15, '#ffe14d');
  // o chão explorado muda devagar: desenha-se numa imagem que só se refaz 4 vezes por segundo
  const agoraMs = performance.now();
  if (!cacheMinimapa.c || cacheMinimapa.mapa !== mapa || agoraMs - cacheMinimapa.t > 250) {
    const c = cacheMinimapa.c || (cacheMinimapa.c = document.createElement('canvas'));
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(200,190,230,0.35)';
    for (let y = 0; y < mapa.H; y++) for (let x = 0; x < mapa.W; x++) if (mapa.explorado[y * mapa.W + x] && mapa.tiles[y * mapa.W + x]) g.fillRect(x * esc, y * esc, esc, esc);
    cacheMinimapa.mapa = mapa; cacheMinimapa.t = agoraMs;
  }
  ctx.drawImage(cacheMinimapa.c, x0, y0);
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
  const corObj = { portal: '#ff4dff', saidaPortal: '#4dc3ff', mercador: '#3ddc84', altar: '#ff3b3b', cristal: '#b44dff', mesa: '#9b5cff', gaiola: '#ff9ff3', portaDupla: '#e8e2cf', escadaCidade: '#4dc3ff', escadaMasmorra: '#ffae00', edificio: '#ffe14d', pedestal: '#fff0a0', estatua: '#ff8080' };
  for (const o of objetos) {
    if (o.tipo === 'portal') { // os portais sentem-se de longe: aparecem sempre e a piscar
      ponto(o.x, o.y, Math.floor(performance.now() / 300) % 2 ? (o.vermelho ? '#ff2a2a' : RANKS_PORTAL[o.gi].cor) : '#ffffff', 8);
    } else if (vis(o.x, o.y)) ponto(o.x, o.y, corObj[o.tipo], 6);
  }
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
    const pct = v < 0.095 ? v.toFixed(2) : Math.abs(v - Math.round(v)) < 0.05 ? Math.round(v) : v.toFixed(1);
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
  let x = ecraX(b.x) + 34, y = ecraY(b.y) - 90;
  const w = 190, h = (tb.mimico > 0 ? 184 : 165) + (S.sorte > 0 ? 16 : 0) + (tb.maldito ? 30 : 0);
  x = clamp(x, 10, LARGURA - w - 10);
  y = clamp(y, 110, ALTURA - h - 100);
  painel(x, y, w, h);
  textoCentro(tb.nome, x + w / 2, y + 16, 14, tb.aro);
  let y0 = y + 40;
  if (S.sorte > 0) { textoCentro(`Sorte +${S.sorte} aplicada`, x + w / 2, y + 33, 11, '#3ddc84', false); y0 += 14; }
  let fim = tabelaChances(b.tipo, x + 14, y0, w - 28);
  if (tb.maldito) {
    textoCentro('Todos os itens trazem', x + w / 2, fim - 2, 11, '#d9a6ff', false);
    textoCentro('uma maldição!', x + w / 2, fim + 12, 11, '#d9a6ff', false);
    fim += 30;
  }
  textoCentro(modoToque ? 'Usar: Abrir' : '[E] Abrir', x + w / 2, fim + 4, 15, '#ffe680');
}

function desenharInfoObjeto(o) {
  const sx = ecraX(o.x), sy = ecraY(o.y) - 58;
  if (o.tipo === 'portal' || o.tipo === 'saidaPortal') { desenharInfoPortal(o, sx, sy); return; }
  if (o.tipo === 'portaDupla') { desenharInfoPortaDupla(o, sx, sy); return; }
  if (desenharInfoCidade(o, sx, sy)) return;
  if (desenharInfoExtra(o, sx, sy)) return;
  const E = modoToque ? 'Usar:' : '[E]';
  if (o.tipo === 'mercador') {
    textoCentro('Mercador', sx, sy - 18, 14, '#3ddc84');
    textoCentro(`${E} Ver a loja`, sx, sy, 15, '#ffe680');
  } else if (o.tipo === 'altar') {
    if (o.usado) textoCentro('O altar já foi usado', sx, sy, 14, '#aaa');
    else {
      textoCentro(`${E} Sacrificar ${Math.round(S.maxHp * 0.35)} de vida`, sx, sy - 18, 15, '#ff8080');
      textoCentro('e receber um Baú Dourado', sx, sy, 13, '#ffd23f');
    }
  } else if (o.tipo === 'gaiola') {
    const P = PETS[o.pet];
    textoCentro(`${modoToque ? 'Usar' : '[E]'}: Libertar ${P.nome}`, sx, sy - 18, 15, P.cor);
    textoCentro(P.desc, sx, sy, 12, '#ddd');
  } else if (o.tipo === 'mesa') {
    textoCentro('Mesa de Encantamentos', sx, sy - 18, 14, '#d9a6ff');
    textoCentro(`${E} Encantar equipamento`, sx, sy, 15, '#ffe680');
  } else if (o.tipo === 'cristal') {
    if (o.fase === 'inativo') {
      textoCentro(`${E} Começar o desafio`, sx, sy - 18, 15, '#ffe680');
      textoCentro('3 ondas de inimigos · prémio: Baú Dourado', sx, sy, 12, '#d9a6ff');
    } else if (o.fase === 'ativo') textoCentro(`Onda ${o.onda}/3`, sx, sy, 15, '#ff6080');
    else textoCentro('Desafio concluído', sx, sy, 14, '#aaa');
  }
}

function desenharCartaItem(it, x, y, cabecalho) {
  const info = RARIDADES[it.r];
  const linhas = linhasItem(it);
  let comp = J && ['NOVO', 'À VENDA', 'NA MOCHILA'].includes(cabecalho) ? compararItens(it, J[it.tipo]) : [];
  if (cabecalho === 'NOVO') comp = comp.slice(0, 1); // na roleta só cabe o resumo (Poder)
  const w = 230, h = 128 + linhas.length * 18 + (it.afixo ? 22 : 0) + (it.maldicao ? 36 : 0) + (comp.length ? comp.length * 17 + 12 : 0);
  x = clamp(x, 10, LARGURA - w - 10);
  y = clamp(y, 10, ALTURA - h - 10);
  painel(x, y, w, h, 'rgba(12,10,20,0.96)', info.cor);
  if (cabecalho) textoCentro(cabecalho, x + w / 2, y + 14, 11, '#999', false);
  desenharIcone(it, x + w / 2, y + 48, 48);
  textoCentroAjustado(it.nome, x + w / 2, y + 88, 15, info.cor, w - 16);
  textoCentro(`${info.nome} · ${NOME_TIPO[it.tipo]}`, x + w / 2, y + 106, 11, '#bbb', false);
  linhas.forEach((l, i) => textoCentro(l, x + w / 2, y + 126 + i * 18, 13, '#eee', false));
  if (it.afixo) textoCentroAjustado(`+ ${it.afixo.desc}`, x + w / 2, y + 130 + linhas.length * 18, 13, it.afixo.cor, w - 16, false);
  if (it.maldicao) {
    const ym = y + 130 + linhas.length * 18 + (it.afixo ? 22 : 0);
    textoCentro(`Maldição: ${it.maldicao.nome}`, x + w / 2, ym + 2, 13, '#ff5ce0', false);
    textoCentroAjustado(it.maldicao.desc, x + w / 2, ym + 19, 12, '#d98ad0', w - 16, false);
  }
  if (comp.length) { // comparação com o que tens equipado
    const yc = y + h - comp.length * 17 - 4;
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 10, yc - 12, w - 20, 1);
    comp.forEach((l, i) => textoCentro(l.txt, x + w / 2, yc + i * 17, l.grande ? 14 : 12, l.cor, !!l.grande));
  }
  return h;
}

// ---------------------------------------------------------------------
//  Roleta do baú
// ---------------------------------------------------------------------
function desenharRoleta(t) {
  const R = roleta;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
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
    if (tb.maldito) textoCentro('Todos os itens deste baú trazem uma maldição!', LARGURA / 2, 250, 14, '#d9a6ff');
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
  if (R.brilho < 0.25) return;
  const xp = info.xpReciclar * andar;
  const B = BOTOES_ROLETA, cheia = J.mochila.length >= TAMANHO_MOCHILA;
  botao(B.equipar, modoToque ? 'Equipar' : '[E] Equipar', '#5dff7a');
  botao(B.mochila, cheia ? 'Mochila cheia' : `${modoToque ? '' : '[M] '}Mochila (${J.mochila.length}/${TAMANHO_MOCHILA})`, cheia ? '#777' : '#7ec8ff');
  botao(B.vender, `${modoToque ? '' : '[X] '}Vender +${valorVenda(R.premio)}`, '#ffd23f');
  textoCentro(`Vender também dá +${xp} XP · ao equipar, o item antigo vai para a mochila`, LARGURA / 2, 572, 11, '#999', false);
}

// ---------------------------------------------------------------------
//  Escolha de melhoria
// ---------------------------------------------------------------------
function desenharEscolha(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
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
    for (const w of traduzir(p.desc).split(' ')) {
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
  else if (of.id === 'livro') sprEcra(SPR.livro[of.feitico], x, y, 3);
  else if (of.id === 'reliquia') sprEcra(iconeReliquia(of.rel), x, y, 3);
  else iconePerk({ cor: '#ffae00', letra: '?', unica: false }, x, y, 18);
}

function desenharLoja(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
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
    textoEsq(of.nome.length > 30 ? of.nome.slice(0, 29) + '…' : of.nome, r.x + 100, r.y + 20, 16, of.id === 'livro' ? FEITICOS[of.feitico].cor : cor);
    textoEsq(of.id === 'pocao' ? `Cura ${Math.round(S.curaPocao * 100)}% da vida e 40% da mana` : of.desc, r.x + 100, r.y + 40, 12, '#aaa', 'normal');
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
  if (loja.msg) textoCentro(loja.msg.txt, 460, 590, 16, loja.msg.cor);
  botao(BOTAO_FECHAR, 'Sair', '#ff8080');
  textoCentro(modoToque ? 'Toca num artigo para o comprar' : `1-${stock.length} ou clique: comprar    ·    E / Esc: sair`, LARGURA / 2, ALTURA - 20, 15, '#aaa', false);
}

// ---------------------------------------------------------------------
//  Ecrã de personagem
// ---------------------------------------------------------------------
function desenharPersonagem() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  textoCentro('PERSONAGEM', LARGURA / 2, 34, 30, '#ffe14d');
  botao(BOTAO_STATUS, J.pontos > 0 ? `Estado (+${J.pontos})` : 'Estado (U)', J.pontos > 0 ? '#ffe14d' : '#4dc3ff');

  // coluna de stats
  painel(20, 64, 300, 540);
  sprEcra(framesHeroi(J.raca, J.skin)[0], 62, 112, 4);
  textoEsq(`Nível ${J.nivel}`, 110, 90, 22, '#ffe14d');
  textoEsq(RACAS[J.raca].nome, 210, 90, 16, RACAS[J.raca].cor);
  textoDir(dif().nome, 308, 118, 12, dif().cor);
  textoEsq(`XP ${J.xp} / ${xpProximo(J.nivel)}`, 110, 118, 13, '#9fc8ff', 'normal');
  sprEcra(SPR.moeda, 116, 140, 3);
  textoEsq(`${J.ouro} ouro`, 130, 140, 14, '#ffd23f');
  const pct = v => `${Math.round(v * 100)}%`;
  const reducao = reducaoDefesa();
  const linhas = [
    ['Vida', `${Math.ceil(J.hp)} / ${S.maxHp}`],
    ['Mana', `${Math.floor(J.mana)} / ${S.maxMana} (+${S.manaRegen}/s)`],
    ['Dano', `${Math.round(S.dano * (1 + S.danoPct))}`],
    ['Poder mágico', `${S.poder} (${S.magia >= 0 ? '+' : ''}${pct(S.magia)})`],
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
    const y = 170 + i * 20;
    if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(28, y - 10, 284, 19); }
    textoEsq(k, 36, y, 14, '#bdb4d0', 'normal');
    textoDir(v, 304, y, 14, '#ffffff');
  });
  const seg = Math.floor(tempoJogo);
  const est = [`Andar ${andar}`, `Inimigos: ${J.kills}`, `Baús: ${J.bausAbertos}`, `Tempo: ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`];
  est.forEach((l, i) => textoEsq(l, 36 + (i % 2) * 140, 510 + Math.floor(i / 2) * 20, 13, '#888', 'normal'));
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
  const extraP = [];
  if (J.pet) extraP.push(`${nomePet()} Nv ${J.pet.nivel}`);
  if (J.vidasExtra > 0) extraP.push('Segunda Vida pronta');
  if (extraP.length) textoDir(extraP.join('  ·  '), 924, 370, 13, '#ff9ff3');
  obtidas.forEach((p, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = 356 + col * 292, y = 402 + lin * 28;
    if (lin > 6) return;
    iconePerk(p, x + 12, y, 12);
    textoEsq(`${p.nome}${p.max > 1 ? ` ${nPerk(p.id)}/${p.max}` : ''}`, x + 32, y - 7, 13, p.cor);
    textoEsq(p.desc, x + 32, y + 9, 11, '#bbb', 'normal');
  });
  // feitiços
  if (!feiticosJ().length) textoEsq('O teu caçador não usa magias: usa as habilidades (5 a 8)', 356, 578, 12, '#889', 'normal');
  feiticosJ().forEach((id, i) => {
    const nv = J.feiticos[id] || 0, x = 356 + i * 146, y = 578;
    ctx.globalAlpha = nv ? 1 : 0.3;
    sprEcra(SPR.feitico[id], x + 12, y, 2);
    textoEsq(nv ? `${FEITICOS[id].nome} ${'I'.repeat(nv)}` : '???', x + 30, y, 12, nv ? FEITICOS[id].cor : '#777');
    ctx.globalAlpha = 1;
  });
  textoCentro(modoToque ? 'Toca no ecrã para voltar' : 'C / Esc para voltar', LARGURA / 2, ALTURA - 18, 13, '#888', false);
}

// ---------------------------------------------------------------------
//  Mesa de Encantamentos
// ---------------------------------------------------------------------
function desenharMesa(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  sprEcra(SPR.mesa, 70, 56, 3);
  textoEsq('Mesa de Encantamentos', 118, 46, 28, '#d9a6ff');
  textoEsq('Reforça um item (+1 até +5) ou dá-lhe um encantamento novo', 118, 76, 13, '#aaa', 'normal');
  sprEcra(SPR.moeda, LARGURA - 190, 58, 5);
  textoEsq(`${J.ouro} ouro`, LARGURA - 168, 58, 24, '#ffd23f');

  SLOTS_EQUIP.forEach((k, i) => {
    const r = retSlotMesa(i), it = J[k];
    const sel = mesa.slot === k;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,30,62,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#d9a6ff' : '#4a4060');
    textoCentro(`${i + 1}`, r.x + 18, r.y + r.h / 2, 16, '#777', false);
    if (!it) { textoEsq(`${NOME_TIPO[k]}: nada equipado`, r.x + 44, r.y + r.h / 2, 14, '#666'); return; }
    desenharIcone(it, r.x + 70, r.y + r.h / 2, 48);
    textoEsq(it.nome.length > 32 ? it.nome.slice(0, 31) + '…' : it.nome, r.x + 108, r.y + 28, 15, RARIDADES[it.r].cor);
    const nv = it.enc || 0;
    for (let s2 = 0; s2 < 5; s2++) {
      ctx.fillStyle = s2 < nv ? '#d9a6ff' : '#2e2640';
      ctx.fillRect(r.x + 108 + s2 * 16, r.y + 46, 12, 12);
    }
    textoEsq(it.afixo ? `${it.afixo.nome}: ${it.afixo.desc}` : 'Sem encantamento', r.x + 196, r.y + 52, 12, it.afixo ? it.afixo.cor : '#777', 'normal');
  });

  const it = J[mesa.slot];
  if (it) {
    const nv = it.enc || 0;
    const r1 = BOTAO_REFORCAR, r2 = BOTAO_ENCANTO;
    const podeReforcar = nv < 5;
    painel(r1.x, r1.y, r1.w, r1.h, dentro(r1) ? 'rgba(40,30,62,0.97)' : 'rgba(18,14,28,0.95)', podeReforcar ? '#5dff7a' : '#444');
    textoEsq(podeReforcar ? `[E] Reforçar para +${nv + 1}` : 'Reforço máximo (+5)', r1.x + 16, r1.y + 22, 17, podeReforcar ? '#5dff7a' : '#777');
    if (podeReforcar) {
      textoEsq(`Chance de sucesso: ${Math.round(CHANCE_REFORCO[nv] * 100)}%  ·  Se falhar perdes o ouro`, r1.x + 16, r1.y + 44, 12, '#bbb', 'normal');
      sprEcra(SPR.moeda, r1.x + r1.w - 80, r1.y + r1.h / 2, 3);
      textoDir(`${custoReforco(it)}`, r1.x + r1.w - 14, r1.y + r1.h / 2, 18, J.ouro < custoReforco(it) ? '#ff6060' : '#ffd23f');
    }
    painel(r2.x, r2.y, r2.w, r2.h, dentro(r2) ? 'rgba(40,30,62,0.97)' : 'rgba(18,14,28,0.95)', '#b44dff');
    textoEsq(it.afixo ? '[R] Trocar o encantamento' : '[R] Encantar (afixo aleatório)', r2.x + 16, r2.y + 22, 17, '#d9a6ff');
    textoEsq('Ex.: de Fogo, do Trovão, de Espinhos, Arcano...', r2.x + 16, r2.y + 44, 12, '#bbb', 'normal');
    sprEcra(SPR.moeda, r2.x + r2.w - 80, r2.y + r2.h / 2, 3);
    textoDir(`${custoEncanto(it)}`, r2.x + r2.w - 14, r2.y + r2.h / 2, 18, J.ouro < custoEncanto(it) ? '#ff6060' : '#ffd23f');

    if (mesa.brilho) {
      ctx.save();
      ctx.globalAlpha = mesa.brilho * 0.5;
      ctx.shadowColor = '#d9a6ff'; ctx.shadowBlur = 40;
      ctx.fillStyle = '#d9a6ff';
      ctx.fillRect(560, 100, 260, 300);
      ctx.restore();
    }
    desenharCartaItem(it, 570, 110, nv ? `ENCANTADO +${nv}` : 'ITEM');
    if (it.maldicao) {
      const r3 = BOTAO_PURIFICAR;
      painel(r3.x, r3.y, r3.w, r3.h, dentro(r3) ? 'rgba(40,30,62,0.97)' : 'rgba(18,14,28,0.95)', '#fff0a0');
      textoEsq(`${modoToque ? '' : '[P] '}Purificar (tira a maldição ${it.maldicao.nome})`, r3.x + 16, r3.y + r3.h / 2, 14, '#fff0a0');
      sprEcra(SPR.moeda, r3.x + r3.w - 80, r3.y + r3.h / 2, 3);
      textoDir(`${custoPurificar(it)}`, r3.x + r3.w - 14, r3.y + r3.h / 2, 18, J.ouro < custoPurificar(it) ? '#ff6060' : '#ffd23f');
    }
  }
  if (mesa.msg) textoCentro(mesa.msg.txt, 460, 600, 15, mesa.msg.cor);
  textoCentro(modoToque ? 'Toca num item e depois no que queres fazer' : '1-3: item  ·  E: reforçar  ·  R: encantar  ·  P: purificar  ·  Esc: sair', 400, ALTURA - 16, 12, '#888', false);
  botao(BOTAO_FECHAR, 'Sair', '#ff8080');
}

// ---------------------------------------------------------------------
//  Criação de personagem
// ---------------------------------------------------------------------
function desenharCriacao(t) {
  textoCentro(modoProximo === 'torre' ? 'TORRE: CRIA A TUA PERSONAGEM' : modoProximo === 'bossrush' ? 'BOSS RUSH: CRIA A TUA PERSONAGEM' : 'CRIA A TUA PERSONAGEM', LARGURA / 2 + 60, 30, 26, modoProximo ? '#ff8080' : '#ffae00');
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  // separadores Caçador / Raça
  ABAS_CRIACAO.forEach((a, i) => {
    const r = retAbaCriacao(i), sel = criacao.aba === a;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffe14d' : dentro(r) ? '#ffffff' : '#3a3150');
    textoCentro(a === 'classe' ? 'Caçador' : 'Raça', r.x + r.w / 2, r.y + r.h / 2 + 1, 14, sel ? '#ffe14d' : '#aaa');
  });
  if (criacao.aba === 'classe') ORDEM_CLASSES.forEach((id, i) => desenharCartaoClasse(retClasse(i), id, escolhaClasse === id));
  // raças
  if (criacao.aba === 'raca') ORDEM_RACAS.forEach((id, i) => {
    const r = retRaca(i), R = RACAS[id], sel = escolhaRaca === id;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? R.cor : dentro(r) ? '#ffffff' : '#3a3150');
    sprEcra(framesHeroi(id, escolhaSkin)[0], r.x + 36, r.y + r.h / 2, 3);
    textoEsq(R.nome, r.x + 70, r.y + 22, 16, R.cor);
    textoEsq(R.bonus[0], r.x + 70, r.y + 48, 11, '#7dff9a', 'normal');
    if (R.bonus[1]) textoEsq(R.bonus[1], r.x + 70, r.y + 66, 11, '#7dff9a', 'normal');
    if (R.contra.length) textoEsq(R.contra[0], r.x + 70, r.y + 88, 11, '#ff8080', 'normal');
  });
  // pré-visualização
  const R = RACAS[escolhaRaca];
  painel(500, 84, 440, 262, 'rgba(14,11,22,0.95)', R.cor);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(520, 104, 150, 222);
  const frames = framesHeroi(escolhaRaca, escolhaSkin);
  sprEcra(frames[[0, 1, 0, 2][Math.floor(t * 6) % 4]], 595, 200, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(555, 270, 80, 8);
  textoEsq(R.nome, 690, 112, 26, R.cor);
  textoEsq(SKINS[escolhaSkin].nome, 690, 140, 14, '#ccc', 'normal');
  R.bonus.forEach((b, i) => textoEsq(`+ ${traduzir(b).replace(/^\+/, '')}`, 690, 172 + i * 22, 14, '#7dff9a'));
  R.contra.forEach((c, i) => textoEsq(`- ${traduzir(c).replace(/^-/, '')}`, 690, 172 + (R.bonus.length + i) * 22, 14, '#ff8080'));
  const CL = CLASSES[escolhaClasse];
  textoEsq(`Caçador: ${CL.nome}`, 690, 262, 13, CL.cor);
  textoEsq(CL.hab ? `F: ${CL.habNome}` : 'Sem habilidade única', 690, 280, 11, CL.hab ? '#ffe680' : '#8a7fa8', 'normal');
  if (CL.hab) textoCentroAjustado(CL.habDesc, 720, 298, 10, '#ddd', 424, false);
  const mags = CL.feit.map(f => traduzir(FEITICOS[f].nome)).join(', ');
  textoCentroAjustado(`Magias: ${mags || 'nenhuma'}`, 720, 318, 11, CL.feit.length ? '#c9b0ff' : '#888', 424, false);
  textoCentroAjustado(`Habilidades: ${CL.habs.map(h => traduzir(TODAS_HABILIDADES[h].nome)).join(', ')}`, 720, 336, 11, '#9fdcff', 424, false);
  // skins
  textoEsq('Skin', 506, 360, 16, '#ffe14d');
  ORDEM_SKINS.forEach((id, i) => {
    const r = retSkin(i), livre = skinLivre(id), sel = escolhaSkin === id;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffe680' : '#3a3150');
    const c = framesHeroi(escolhaRaca, id)[0];
    if (livre) sprEcra(c, r.x + r.w / 2, r.y + 38, 3);
    else {
      sprEcra(silhueta(c, '#2a2438'), r.x + r.w / 2, r.y + 38, 3);
      textoCentroAjustado(SKINS[id].conquista ? 'Conquista' : `Andar ${SKINS[id].recorde}`, r.x + r.w / 2, r.y + 40, 11, '#ff8080', r.w - 6);
    }
    textoCentroAjustado(SKINS[id].nome, r.x + r.w / 2, r.y + r.h - 12, 11, livre ? '#ddd' : '#666', r.w - 6, false);
  });
  if (criacao.msg) textoCentro(criacao.msg.txt, 720, 360, 13, criacao.msg.cor);
  // dificuldade
  ORDEM_DIFICULDADES.forEach((id, i) => {
    const r = retDificuldade(i), D = DIFICULDADES[id], sel = escolhaDificuldade === id, livre = difLivre(id);
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? D.cor : dentro(r) ? '#ffffff' : '#3a3150');
    textoCentroAjustado(livre ? D.nome : `${D.nome} (bloq.)`, r.x + r.w / 2, r.y + r.h / 2 + 1, 13, sel ? D.cor : livre ? '#888' : '#553', r.w - 8);
  });
  const Dsel = DIFICULDADES[escolhaDificuldade];
  textoEsq(`Dificuldade: ${Dsel.desc}`, 30, 610, 12, Dsel.cor, 'normal');
  const b = BOTAO_COMECAR;
  painel(b.x, b.y, b.w, b.h, dentro(b) ? 'rgba(60,50,20,0.97)' : 'rgba(40,34,20,0.95)', '#ffae00');
  textoCentro(modoToque ? 'Começar' : 'ENTER: Começar', b.x + b.w / 2, b.y + b.h / 2, 18, '#ffe14d');
  textoEsq(modoToque ? 'Escolhe um caçador, uma raça, uma skin e a dificuldade' : 'Tab: caçador/raça   W/S: escolher   A/D: skin   1-5: dificuldade   Esc: voltar', 30, 630, 11, '#777', 'normal');
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
  sprEcra(framesHeroi(escolhaRaca, escolhaSkin)[Math.floor(t * 8) % 3], 150, chao, 4);
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

  // botões do menu
  botoesTitulo().forEach((b, i) => {
    const cor = b.fechado ? '#5a5468' : ['continuar', 'novo'].includes(b.id) && i === 0 ? '#ffe14d' : b.id === 'almas' ? '#b48cff' : b.id === 'diario' ? '#ffae00' : b.id === 'torre' || b.id === 'bossrush' ? '#ff8080' : b.id === 'transferir' ? '#4dc3ff' : b.id === 'coop' ? '#5dff7a' : '#ddd';
    botao(b, b.txt, cor, undefined, { continuar: 'jogar', novo: 'novo' }[b.id] || b.id);
  });
  if (saveInfo) {
    const rs = (RACAS[saveInfo.J.raca] ? RACAS[saveInfo.J.raca].nome : '') + (DIFICULDADES[saveInfo.J.dificuldade] ? ` · ${DIFICULDADES[saveInfo.J.dificuldade].nome}` : '');
    textoEsq(`Andar ${saveInfo.andar} · Nível ${saveInfo.J.nivel} · ${rs}`, 74, 194, 11, '#999', 'normal');
  }

  // como jogar
  painel(440, 212, 460, 286);
  textoCentro('Como jogar', 670, 232, 16, '#ffe14d');
  const controlos = modoToque ? [
    [opcoes.canhoto ? 'Joystick (direita)' : 'Joystick (esquerda)', 'Mover'],
    ['Botão grande', 'Atacar o inimigo mais perto'],
    ['»»', 'Esquiva'],
    ['Usar', 'Abrir baús, lojas, escadas...'],
    ['Poção', 'Beber poção'],
    ['Botões ★ e de magia', 'Magias, habilidades e poder único'],
    ['Botões à direita', 'Pausa, personagem, mochila'],
    ['Opções', 'Botões, canhoto, vibração, bateria'],
  ] : [
    ['WASD / Setas', 'Mover'],
    ['Clique / Espaço', 'Atacar'],
    ['Shift', 'Dash (esquiva)'],
    ['E', 'Abrir / Usar / Descer'],
    ['1-4 / 5-8 / F', 'Magias, habilidades e poder único'],
    ['Q', 'Beber poção'],
    ['C / I', 'Personagem / Mochila'],
    ['P / Esc', 'Pausa'],
  ];
  controlos.forEach(([k, d], i) => {
    textoEsqAjustado(k, 462, 262 + i * 28, 14, '#ffe680', 170);
    textoEsqAjustado(d, 640, 262 + i * 28, 13, '#ddd', 248, 'normal');
  });

  desenharIcone(ITENS.find(i => i.nome === 'Colher Enferrujada'), 470, 530, 32);
  desenharIcone(ITENS.find(i => i.nome === 'Espada do Infinito'), 870, 530, 32);
  textoCentro('Cada baú pode dar o PIOR ou o MELHOR item!', 670, 530, 14, '#fff', false);
  desenharMsgTitulo();
  const extra = recorde > 0 ? `Recorde: Andar ${recorde}  ·  ` : '';
  textoCentro(`${extra}Almas: ${meta.almas}  ·  Coleção: ${Object.keys(meta.colecao).length}/${ITENS_COLECAO.length}  ·  Conquistas: ${Object.keys(meta.conquistas).length}/${CONQUISTAS.length}`, LARGURA / 2, modoToque ? 608 : 586, 13, '#7ec8ff', false);
  if (!modoToque) textoCentro('ENTER: jogar · N: novo · D: diário · O: torre · B: boss rush · A: almas · K: pacto · L: coleção · T: conquistas · R: missões · I: idioma', LARGURA / 2, 612, 11, '#777', false);
  botaoIdioma();
  botoesMenuToque(true);
}

function desenharPausa() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  textoCentro('PAUSA', LARGURA / 2, 88, 48, '#fff');
  if (!confirmarDesistir) { botaoIdioma(); botoesMenuToque(false); }
  const B = BOTOES_PAUSA;
  botao(B.continuar, modoToque ? 'Continuar' : 'Continuar (P)', '#5dff7a', undefined, 'jogar');
  botao(B.guardar, modoToque ? 'Guardar e sair' : 'Guardar e sair (G)', '#ffe680', undefined, 'guardar');
  botao(B.desistir, modoToque ? 'Desistir' : 'Desistir (X)', '#ff6060', undefined, 'desistir');
  const D = dif();
  textoCentro(`${classeJ().nome} · ${RACAS[J.raca].nome} · Dificuldade ${D.nome} · Andar ${andar}${calorAtual() ? ` · Calor ${calorAtual()}` : ''}`, LARGURA / 2, 218, 14, '#aaa', false);
  const obtidas = PERKS.filter(p => nPerk(p.id) > 0);
  textoCentro(obtidas.length ? 'As tuas melhorias' : 'Ainda não tens melhorias. Sobe de nível!', LARGURA / 2, 262, 18, '#ffe14d');
  obtidas.forEach((p, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = LARGURA / 2 - 330 + col * 340, y = 300 + lin * 34;
    iconePerk(p, x + 14, y, 12);
    textoEsq(`${p.nome}${p.max > 1 ? ` (${nPerk(p.id)}/${p.max})` : ''}`, x + 36, y - 7, 14, p.cor);
    textoEsq(p.desc, x + 36, y + 9, 12, '#ccc', 'normal');
  });
  const rels = J.reliquias || [];
  if (rels.length) { // relíquias que já tens nesta partida
    textoEsq('Relíquias:', 60, ALTURA - 62, 13, '#ffe14d');
    rels.forEach((id, i) => {
      const x = 170 + (i % 10) * 76, y = ALTURA - 62 + Math.floor(i / 10) * 30;
      sprEcra(iconeReliquia(id), x, y, 2);
      textoEsq(traduzir(RELIQUIAS[id].nome).split(' ')[0], x + 18, y, 10, RELIQUIAS[id].cor, 'normal');
    });
  }
  textoCentro('O jogo guarda sozinho: continuas no mesmo sítio do andar', LARGURA / 2, ALTURA - 24, 13, '#888', false);

  if (confirmarDesistir) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
    painel(250, 230, 460, 196, 'rgba(30,8,12,0.98)', '#ff6060');
    textoCentro('Desistir desta partida?', LARGURA / 2, 268, 24, '#ff8080');
    textoCentro('A partida termina e a gravação é apagada.', LARGURA / 2, 304, 14, '#ddd', false);
    textoCentro('O andar a que chegaste conta para o recorde.', LARGURA / 2, 326, 14, '#aaa', false);
    botao(BOTOES_CONFIRMAR.sim, modoToque ? 'Sim, desistir' : 'Sim, desistir (X)', '#ff6060');
    botao(BOTOES_CONFIRMAR.nao, modoToque ? 'Não' : 'Não (Esc)', '#5dff7a');
  }
}

function desenharMorte() {
  ctx.fillStyle = 'rgba(40,0,0,0.75)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  textoCentro(J.venceuRush ? 'BOSS RUSH COMPLETO!' : J.desistiu ? 'DESISTISTE' : 'MORRESTE', LARGURA / 2, 130, J.venceuRush ? 46 : 60, J.venceuRush ? '#ffe14d' : J.desistiu ? '#ff9f43' : '#ff4040');
  const D = dif();
  textoCentro(`${classeJ().nome} · ${RACAS[J.raca].nome} · ${D.nome}${calorAtual() ? ` · Calor ${calorAtual()}` : ''}`, LARGURA / 2, 178, 16, D.cor);
  if (!J.desistiu && J.causa) textoCentro(`Morto por: ${J.causa}`, LARGURA / 2, 200, 14, '#ff8080', false);
  const dica = dicaMorte();
  if (dica) { // dica ligada ao que te matou
    painel(LARGURA / 2 - 330, 212, 660, 26, 'rgba(30,24,10,0.9)', '#ffe14d');
    textoCentroAjustado(`Dica: ${traduzir(dica)}`, LARGURA / 2, 226, 12, '#ffe680', 640, false);
  }
  const linhas = [
    `Andar alcançado: ${andar}`,
    `Nível: ${J.nivel}`,
    `Inimigos derrotados: ${J.kills}`,
    `Baús abertos: ${J.bausAbertos}`,
  ];
  linhas.forEach((l, i) => textoCentro(l, LARGURA / 2, 258 + i * 22, 17, '#eee', false));
  if (J.melhorItem) {
    textoCentro('Melhor item encontrado:', LARGURA / 2, 368, 15, '#aaa', false);
    desenharIcone(J.melhorItem, LARGURA / 2, 402, 44);
    textoCentro(J.melhorItem.nome, LARGURA / 2, 440, 18, RARIDADES[J.melhorItem.r].cor);
  }
  if (J.novoRecorde) textoCentro('NOVO RECORDE!', LARGURA / 2, 478, 24, '#ffe14d');
  else textoCentro(`Recorde: Andar ${recorde}`, LARGURA / 2, 478, 18, '#7ec8ff');
  textoCentro(`+${J.almasGanhas || 0} almas  (tens ${meta.almas})`, LARGURA / 2, 514, 20, '#b48cff');
  textoCentro('Gasta-as no Altar das Almas, no menu inicial', LARGURA / 2, 540, 12, '#aaa', false);
  if (J.modo === 'diario') textoCentro(`Desafio Diário: ${J.pontosDiario} pontos${J.recordeDiario ? ' · NOVO RECORDE DE HOJE!' : ''}`, LARGURA / 2, 346, 15, '#ffae00');
  if (J.modo === 'torre') textoCentro(`Torre: chegaste ao andar ${andar}/100 (recorde ${meta.torreMax || andar})`, LARGURA / 2, 346, 15, '#ff8080');
  if (J.modo === 'bossrush') textoCentro(J.venceuRush ? `Tempo: ${relogioRush(tempoJogo)}${J.recordeRush ? ' · NOVO RECORDE!' : ''}` : `Boss Rush: chegaste ao boss ${Math.ceil(andar / 5)}/${BOSSES.length}`, LARGURA / 2, 346, 15, '#ffae00');
  botao(BOTOES_MORTE.denovo, modoToque ? 'Tentar outra vez' : 'ENTER: Outra vez', '#5dff7a', undefined, 'jogar');
  botao(BOTOES_MORTE.menu, modoToque ? 'Menu' : 'Esc: Menu', '#ddd', undefined, 'menu');
}
