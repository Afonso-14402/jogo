'use strict';
// =====================================================================
//  MODOS DE JOGO
//  - Desafio Diário: todos os dias um caçador, uma raça, dois pactos e
//    mapas iguais para toda a gente (mesma semente). Guarda a tua pontuação.
//  - Torre dos 100 Andares: cada andar é uma arena com ondas de monstros,
//    descanso a cada 5 andares e um boss a cada 10.
// =====================================================================

let modoProximo = null; // 'diario' | 'torre' | null (usado pelo novoJogo)

// ---------------------------------------------------------------------
//  Números aleatórios com semente
// ---------------------------------------------------------------------
function hashTexto(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function geradorSemente(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Corre fn com o Math.random substituído por um gerador com semente
function comSemente(seed, fn) {
  const orig = Math.random;
  Math.random = geradorSemente(seed);
  try { return fn(); } finally { Math.random = orig; }
}

// ---------------------------------------------------------------------
//  Desafio Diário
// ---------------------------------------------------------------------
function desafioDeHoje() {
  const dia = hojeTexto();
  return comSemente(hashTexto('diario' + dia), () => {
    const classe = ORDEM_CLASSES[1 + Math.floor(Math.random() * (ORDEM_CLASSES.length - 1))];
    const racas = ORDEM_RACAS.filter(r => !RACAS[r].almas); // (as raças compradas com almas não entram)
    const raca = racas[Math.floor(Math.random() * racas.length)];
    const lista = PACTOS.filter(p => p.calor === 1).slice();
    const pacto = {};
    for (let k = 0; k < 2; k++) pacto[lista.splice(Math.floor(Math.random() * lista.length), 1)[0].id] = 1;
    return { dia, classe, raca, pacto };
  });
}
const pontosDiario = () => andar * 1000 + J.kills * 5 + J.nivel * 20 + (J.bossesMortos || 0) * 300;

let diarioUI = null;
function comecarDiario() { diarioUI = { t: 0 }; estado = 'diario'; }
const BOTAO_DIARIO = { x: 330, y: 540, w: 300, h: 50 };

function iniciarDiario() {
  const D = desafioDeHoje();
  const guarda = [escolhaClasse, escolhaRaca, escolhaDificuldade];
  escolhaClasse = D.classe; escolhaRaca = D.raca; escolhaDificuldade = 'normal';
  modoProximo = 'diario';
  novoJogo();
  [escolhaClasse, escolhaRaca, escolhaDificuldade] = guarda;
}

function atualizarDiario(dt) {
  diarioUI.t += dt;
  if (diarioUI.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = 'titulo'; diarioUI = null; return; }
  if (premiu('enter', 'e', ' ') || clicou(BOTAO_DIARIO)) { rato.baixo = false; diarioUI = null; iniciarDiario(); }
}

function desenharDiario(t) {
  const D = desafioDeHoje(), C = CLASSES[D.classe], R = RACAS[D.raca];
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  textoCentro('DESAFIO DIÁRIO', LARGURA / 2, 40, 32, '#ffae00');
  textoCentro(`Hoje: ${D.dia} · os mapas de hoje são iguais para toda a gente`, LARGURA / 2, 76, 13, '#aaa', false);
  painel(80, 100, 380, 290, 'rgba(18,14,28,0.95)', C.cor);
  sprEcra(framesHeroi(D.raca, escolhaSkin)[Math.floor(t * 4) % 2 ? 0 : 1], 150, 180, 5);
  textoEsq(C.nome, 220, 140, 17, C.cor);
  textoEsq(R.nome, 220, 166, 15, R.cor);
  textoEsq(C.hab ? `F: ${C.habNome}` : '', 220, 192, 12, '#ffe680', 'normal');
  textoEsq('Pactos de hoje:', 100, 270, 15, '#ff8080');
  Object.keys(D.pacto).forEach((id, i) => { const P = PACTOS.find(p => p.id === id); textoEsq(`${P.nome}: ${traduzir(P.desc)}`, 100, 298 + i * 26, 12, P.cor, 'normal'); });
  // recordes dos últimos dias
  painel(500, 100, 380, 290);
  textoCentro('As tuas pontuações', 690, 124, 16, '#ffe14d');
  const dias = Object.keys(meta.diario || {}).sort().reverse().slice(0, 8);
  if (!dias.length) textoCentro('Ainda não jogaste nenhum desafio', 690, 200, 13, '#777', false);
  dias.forEach((d, i) => {
    textoEsq(d === D.dia ? `${d} (hoje)` : d, 524, 156 + i * 28, 14, d === D.dia ? '#ffe14d' : '#ccc', 'normal');
    textoDir(`${meta.diario[d]}`, 860, 156 + i * 28, 14, '#fff');
  });
  textoCentro('Pontos: andar x1000 + monstros x5 + nível x20 + bosses x300', LARGURA / 2, 420, 12, '#aaa', false);
  const b = BOTAO_DIARIO;
  painel(b.x, b.y, b.w, b.h, dentro(b) ? 'rgba(60,50,20,0.97)' : 'rgba(40,34,20,0.95)', '#ffae00');
  textoCentro(modoToque ? 'Começar o desafio' : 'ENTER: Começar o desafio', b.x + b.w / 2, b.y + b.h / 2, 18, '#ffe14d');
}

function fimDiario() {
  if (!meta.diario) meta.diario = {};
  const dia = hojeTexto(), p = pontosDiario();
  J.pontosDiario = p;
  J.recordeDiario = !meta.diario[dia] || p > meta.diario[dia];
  meta.diario[dia] = Math.max(meta.diario[dia] || 0, p);
  // guarda só os últimos 30 dias
  const dias = Object.keys(meta.diario).sort();
  while (dias.length > 30) delete meta.diario[dias.shift()];
  if (andar >= 10) desbloquear('diario10');
  salvarMeta();
}

// ---------------------------------------------------------------------
//  Torre dos 100 Andares
// ---------------------------------------------------------------------
const TOPO_TORRE = 100;

function gerarMapaTorre(a) {
  const m = gerarArenaBoss();
  if (a % 10 === 0) return m; // boss
  m.eBoss = false;
  m.torre = true;
  if (a % 5 === 0) { m.descanso = true; m.escada.ativa = true; }
  return m;
}

function popularTorre() {
  if (mapa.descanso) {
    const c = { x: 18 * TILE, y: 13 * TILE };
    objetos.push({ tipo: 'mercador', sala: mapa.salas[0], stock: null, x: c.x - 140, y: c.y + 60 });
    objetos.push({ tipo: 'mesa', sala: mapa.salas[0], x: c.x + 140, y: c.y + 60 });
    baus.push({ x: c.x, y: c.y + 110, tipo: 'ouro', semMimico: true, t: 0 });
    mostrarBanner(`TORRE · ANDAR ${andar}/${TOPO_TORRE}`, 'Andar de descanso: loja, encantamentos e um baú', '#5dff7a');
    return;
  }
  mapa.ondasTorre = 2 + Math.floor(andar / 30);
  mapa.ondaTorre = 0;
  lancarOndaTorre();
  mostrarBanner(`TORRE · ANDAR ${andar}/${TOPO_TORRE}`, `Sobrevive a ${mapa.ondasTorre} ondas`, '#ffae00');
}

function lancarOndaTorre() {
  mapa.ondaTorre++;
  const pesos = pesosInimigos(), n = Math.min(26, 5 + Math.floor(andar * 0.35));
  for (let k = 0; k < n; k++) {
    let p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
    for (let t = 0; t < 6 && Math.hypot(p.x - J.x, p.y - J.y) < 220; t++) p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
    const e = criarInimigo(escolherPeso(pesos), p.x, p.y);
    aplicarNivel(e, sortearNivel());
    e.acordado = true;
    inimigos.push(e);
    explosao(p.x, p.y, '#b48cff', 8, 100);
  }
  if (mapa.ondaTorre > 1) mostrarBanner(`ONDA ${mapa.ondaTorre}/${mapa.ondasTorre}`, '', '#ffae00');
}

function atualizarTorre() {
  if (!J || J.modo !== 'torre' || !mapa.torre || mapa.descanso || mapa.escada.ativa) return;
  if (inimigos.some(e => !e.morto)) return;
  if (mapa.ondaTorre < mapa.ondasTorre) { lancarOndaTorre(); return; }
  mapa.escada.ativa = true;
  baus.push({ x: mapa.escada.x + 70, y: mapa.escada.y, tipo: Math.random() < 0.25 ? 'ouro' : 'madeira', semMimico: true, t: 0 });
  mostrarBanner('ANDAR LIMPO!', 'Abre o baú e sobe a escada', '#5dff7a');
  fanfarra([523, 659, 784, 1046], 0.04);
}

function recordeTorre() {
  if (J.modo !== 'torre') return;
  meta.torreMax = Math.max(meta.torreMax || 0, andar);
  if (andar >= 25) desbloquear('torre25');
  salvarMeta();
}

// Boss do andar 100 da torre
function vitoriaTorre() {
  if (J.modo !== 'torre' || andar < TOPO_TORRE) return;
  desbloquear('torre100');
  mostrarBanner('CONQUISTASTE A TORRE!', 'Os 100 andares são teus. Continua, se tiveres coragem...', '#ffe14d');
  fanfarra([523, 659, 784, 1046, 1318, 1568, 2093], 0.06);
}

// Torre: quando faltam poucos monstros e estão fora do ecrã, setas na borda apontam para eles
// (as plantas carnívoras não se mexem e ficavam esquecidas num canto)
function desenharSetasInimigos(t) {
  if (!J || J.modo !== 'torre' || !mapa || !mapa.torre || mapa.escada.ativa || !['jogo', 'convidado'].includes(estado)) return;
  const vivos = inimigos.filter(e => !e.morto);
  if (!vivos.length || vivos.length > 3) return;
  const x0 = -MARGEM_X + 40, x1 = LARGURA + MARGEM_X - 40, y0 = 130, y1 = ALTURA - 120;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  for (const e of vivos) {
    const sx = ecraX(e.x), sy = ecraY(e.y);
    if (sx > x0 && sx < x1 && sy > y0 && sy < y1) continue; // já está à vista
    const dx = sx - cx, dy = sy - cy, k = Math.min((x1 - cx) / Math.abs(dx || 1e-6), (y1 - cy) / Math.abs(dy || 1e-6));
    const px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx), pulso = 1 + 0.15 * Math.sin(t * 8);
    ctx.save();
    ctx.translate(px, py); ctx.rotate(a); ctx.scale(pulso, pulso);
    ctx.fillStyle = '#ff4d4d'; ctx.strokeStyle = '#2a0a0a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
  }
}

