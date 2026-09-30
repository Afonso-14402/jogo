'use strict';
// =====================================================================
//  EXTRAS (ideias de Hades e Binding of Isaac):
//  - Pacto de Castigo (Calor): regras mais difíceis em troca de mais almas
//  - Missões diárias e estatísticas / histórico das partidas
//  - Salas secretas atrás de paredes rachadas
//  - Sala do Diabo (troca vida máxima por poder) e Sala do Anjo (prémio grátis)
//  - Bestiário e relíquias na Coleção
// =====================================================================

// ---------------------------------------------------------------------
//  Pacto de Castigo
// ---------------------------------------------------------------------
const PACTOS = [
  { id: 'forca',    nome: 'Força Bruta',      desc: 'Os monstros fazem +20% dano (por nível)',          max: 3, calor: 1, cor: '#ff6060' },
  { id: 'pele',     nome: 'Pele de Pedra',    desc: 'Os monstros têm +25% vida (por nível)',            max: 3, calor: 1, cor: '#a8a090' },
  { id: 'enxame',   nome: 'Enxame',           desc: '+25% monstros em cada andar (por nível)',          max: 2, calor: 1, cor: '#8bc34a' },
  { id: 'elites',   nome: 'Elite',            desc: '+60% de monstros de elite (por nível)',            max: 2, calor: 1, cor: '#ffd23f' },
  { id: 'pressa',   nome: 'Pressa',           desc: 'Os monstros são 12% mais rápidos (por nível)',     max: 2, calor: 1, cor: '#9fdcff' },
  { id: 'secura',   nome: 'Secura',           desc: 'As poções curam -25% (por nível)',                 max: 2, calor: 1, cor: '#ff6b8a' },
  { id: 'pobreza',  nome: 'Pobreza',          desc: 'Ganhas -30% ouro',                                 max: 1, calor: 1, cor: '#c9a15a' },
  { id: 'campeoes', nome: 'Campeões',         desc: 'Muitos mais Veteranos e Campeões (por nível)',     max: 2, calor: 1, cor: '#cfd8e0' },
  { id: 'furia',    nome: 'Bosses Furiosos',  desc: 'Os bosses têm +30% vida e enfurecem-se mais cedo', max: 1, calor: 2, cor: '#ff3b3b' },
];
const nPacto = id => (J && J.pacto ? J.pacto[id] || 0 : 0);
const calorDe = pacto => PACTOS.reduce((s, p) => s + (pacto && pacto[p.id] || 0) * p.calor, 0);
const calorAtual = () => (J && J.pacto ? calorDe(J.pacto) : 0);

function retPacto(i) { return { x: 40 + (i % 3) * 300, y: 124 + Math.floor(i / 3) * 132, w: 284, h: 120 }; }

function atualizarPacto(dt) {
  menuMeta.t += dt;
  if (menuMeta.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = 'titulo'; menuMeta = null; return; }
  if (!meta.pacto) meta.pacto = {};
  PACTOS.forEach((p, i) => {
    if (!(premiu(String(i + 1)) || clicou(retPacto(i)))) return;
    meta.pacto[p.id] = ((meta.pacto[p.id] || 0) + 1) % (p.max + 1);
    salvarMeta();
    som(meta.pacto[p.id] ? 300 + meta.pacto[p.id] * 120 : 200, 0.08, 'square', 0.03);
  });
  if (premiu('0')) { meta.pacto = {}; salvarMeta(); }
}

function desenharPacto(t) {
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  const calor = calorDe(meta.pacto || {});
  textoCentro('PACTO DE CASTIGO', LARGURA / 2, 32, 30, '#ff5a1a');
  textoCentro('Escolhe regras mais difíceis para as próximas partidas. Cada ponto de Calor dá +10% almas.', LARGURA / 2, 66, 13, '#aaa', false);
  // chama com o Calor total
  const cx = LARGURA / 2;
  ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 5);
  circuloEcra(cx, 96, 16 + calor, '#ff5a1a', '#ff5a1a', 1);
  ctx.globalAlpha = 1;
  textoCentro(`Calor ${calor}  ·  almas x${(1 + calor * 0.1).toFixed(1)}`, cx, 98, 18, calor ? '#ffae00' : '#888');
  PACTOS.forEach((p, i) => {
    const r = retPacto(i), nv = (meta.pacto || {})[p.id] || 0;
    painel(r.x, r.y, r.w, r.h, nv ? 'rgba(48,20,12,0.96)' : 'rgba(18,14,28,0.95)', dentro(r) ? '#ffffff' : nv ? p.cor : '#3a3150');
    textoEsq(`${i + 1}. ${p.nome}`, r.x + 14, r.y + 20, 16, nv ? p.cor : '#bbb');
    textoDir(`+${p.calor} calor`, r.x + r.w - 12, r.y + 20, 11, '#ffae00');
    textoEsq(p.desc, r.x + 14, r.y + 50, 11, '#ddd', 'normal');
    for (let k = 0; k < p.max; k++) {
      ctx.fillStyle = k < nv ? p.cor : '#2e2640';
      ctx.fillRect(r.x + 14 + k * 28, r.y + 76, 22, 12);
    }
    textoEsq(nv ? `Nível ${nv}/${p.max}` : 'Desligado', r.x + 14, r.y + 104, 12, nv ? '#fff' : '#777');
  });
  textoCentro(modoToque ? 'Toca numa regra para subir o nível (volta a 0 no fim)' : 'Clica ou carrega 1-9 para subir o nível · 0 desliga tudo · Esc: voltar',
    LARGURA / 2, 620, 12, '#888', false);
}

// Conquistas do Calor ao começar uma partida
function conquistasCalor() {
  const c = calorAtual();
  if (c >= 5) desbloquear('calor5');
  if (c >= 10) desbloquear('calor10');
}

// ---------------------------------------------------------------------
//  Missões diárias e estatísticas
// ---------------------------------------------------------------------
const MISSOES = [
  { id: 'matar',     desc: 'Mata {n} monstros',        n: [60, 120, 200],   almas: 15 },
  { id: 'baus',      desc: 'Abre {n} baús',            n: [5, 10, 15],      almas: 15 },
  { id: 'andar',     desc: 'Chega ao andar {n}',       n: [8, 12, 18],      almas: 20, maximo: true },
  { id: 'boss',      desc: 'Derrota {n} bosses',       n: [1, 2, 3],        almas: 20 },
  { id: 'elite',     desc: 'Mata {n} monstros de elite', n: [3, 6, 10],     almas: 15 },
  { id: 'ouro',      desc: 'Apanha {n} de ouro',       n: [300, 800, 1500], almas: 15 },
  { id: 'feitico',   desc: 'Lança {n} feitiços',       n: [20, 40, 80],     almas: 10 },
  { id: 'campeao',   desc: 'Mata {n} Campeões',        n: [3, 6, 10],       almas: 20 },
  { id: 'reliquia',  desc: 'Apanha {n} relíquias',     n: [1, 2, 3],        almas: 20 },
  { id: 'pocao',     desc: 'Bebe {n} poções',          n: [3, 6, 10],       almas: 10 },
  { id: 'secreta',   desc: 'Encontra {n} salas secretas', n: [1, 1, 2],     almas: 25 },
];

function hojeTexto() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// As 3 missões do dia (as mesmas o dia todo)
function missoesDeHoje() {
  const dia = hojeTexto();
  if (!meta.missoes || meta.missoes.dia !== dia) {
    let h = 0;
    for (const ch of dia) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const r = aleatorio(h), pool = MISSOES.slice(), lista = [];
    for (let k = 0; k < 3; k++) {
      const M = pool.splice(Math.floor(r() * pool.length), 1)[0];
      lista.push({ id: M.id, alvo: M.n[k], prog: 0, feita: false });
    }
    meta.missoes = { dia, lista };
    salvarMeta();
  }
  return meta.missoes.lista;
}

// Regista um acontecimento (conta para as missões e para as estatísticas)
function registar(evento, q = 1) {
  if (!meta.stats) meta.stats = {};
  if (evento === 'andar') meta.stats.andarMax = Math.max(meta.stats.andarMax || 0, q);
  else meta.stats[evento] = (meta.stats[evento] || 0) + q;
  progressoContratos(evento, q);
  for (const m of missoesDeHoje()) {
    if (m.feita || m.id !== evento) continue;
    const M = MISSOES.find(x => x.id === m.id);
    m.prog = M.maximo ? Math.max(m.prog, q) : m.prog + q;
    if (m.prog >= m.alvo) {
      m.feita = true;
      meta.almas += M.almas;
      avisar('Missão cumprida!', `${traduzir(M.desc).replace('{n}', m.alvo)}  (+${M.almas} almas)`, '#5dff7a');
      fanfarra([523, 659, 784, 1046], 0.04);
      if (contar('missoes') >= 10) desbloquear('missoes10');
    }
  }
  salvarMeta();
}

// Guarda o fim da partida no histórico
function registarFimPartida(desistiu) {
  if (!meta.stats) meta.stats = {};
  meta.stats.mortes = (meta.stats.mortes || 0) + (desistiu ? 0 : 1);
  meta.stats.tempo = (meta.stats.tempo || 0) + tempoJogo;
  if (!meta.historico) meta.historico = [];
  meta.historico.unshift({ andar, nivel: J.nivel, raca: J.raca, dif: J.dificuldade, calor: calorAtual(),
    causa: desistiu ? 'Desistiu' : (J.causa || '?'), dia: hojeTexto() });
  meta.historico.length = Math.min(meta.historico.length, 8);
  salvarMeta();
}

function atualizarRegisto(dt) {
  menuMeta.t += dt;
  if (menuMeta.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = 'titulo'; menuMeta = null; }
}

function desenharRegisto(t) {
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  textoCentro('MISSÕES E ESTATÍSTICAS', LARGURA / 2, 32, 28, '#5dff7a');
  // missões de hoje
  textoEsq('Missões de hoje', 40, 86, 18, '#ffe14d');
  missoesDeHoje().forEach((m, i) => {
    const M = MISSOES.find(x => x.id === m.id), y = 104 + i * 70;
    painel(40, y, 420, 60, m.feita ? 'rgba(20,40,20,0.96)' : 'rgba(18,14,28,0.95)', m.feita ? '#5dff7a' : '#3a3150');
    textoEsq(traduzir(M.desc).replace('{n}', m.alvo), 56, y + 18, 15, m.feita ? '#5dff7a' : '#fff');
    textoDir(`+${M.almas} almas`, 448, y + 18, 12, '#b48cff');
    barra(56, y + 36, 280, 10, Math.min(1, m.prog / m.alvo), m.feita ? '#5dff7a' : '#ffae00');
    textoEsq(m.feita ? 'Feita!' : `${Math.min(m.prog, m.alvo)} / ${m.alvo}`, 346, y + 42, 12, '#ddd', 'normal');
  });
  textoEsq('Há missões novas todos os dias', 40, 326, 11, '#888', 'normal');
  // estatísticas
  const st = meta.stats || {}, c = meta.contadores || {};
  const min = Math.round((st.tempo || 0) / 60);
  const linhas = [
    ['Partidas', st.partidas || 0], ['Mortes', st.mortes || 0], ['Tempo de jogo', `${Math.floor(min / 60)}h ${min % 60}m`],
    ['Andar mais fundo', Math.max(recorde, st.andarMax || 0)], ['Monstros mortos', c.matou || 0], ['Bosses derrotados', st.boss || 0],
    ['Baús abertos', st.baus || 0], ['Ouro apanhado', st.ouro || 0], ['Relíquias apanhadas', st.reliquia || 0],
    ['Salas secretas', st.secreta || 0], ['Feitiços lançados', st.feitico || 0], ['Pactos com o Diabo', c.diabo || 0],
  ];
  textoEsq('Estatísticas', 500, 86, 18, '#7ec8ff');
  painel(500, 104, 420, 250, 'rgba(18,14,28,0.95)');
  linhas.forEach(([k, v], i) => {
    const y = 124 + i * 19;
    textoEsq(k, 516, y, 13, '#bbb', 'normal');
    textoDir(`${v}`, 904, y, 13, '#fff');
  });
  // histórico
  textoEsq('Últimas partidas', 40, 372, 18, '#ffae00');
  const h = meta.historico || [];
  painel(40, 388, 880, 216, 'rgba(18,14,28,0.95)');
  if (!h.length) textoCentro('Ainda não acabaste nenhuma partida', LARGURA / 2, 490, 14, '#777', false);
  h.forEach((p, i) => {
    const y = 408 + i * 25, D = DIFICULDADES[p.dif] || DIFICULDADES.normal;
    textoEsq(`Andar ${p.andar}`, 56, y, 14, '#ffe14d');
    textoEsq(`Nv ${p.nivel}`, 156, y, 13, '#9fc8ff', 'normal');
    textoEsq((RACAS[p.raca] || RACAS.humano).nome, 226, y, 13, (RACAS[p.raca] || RACAS.humano).cor, 'normal');
    textoEsq(D.nome, 346, y, 13, D.cor, 'normal');
    if (p.calor) textoEsq(`Calor ${p.calor}`, 446, y, 13, '#ff5a1a', 'normal');
    textoEsq(p.causa === 'Desistiu' ? 'Desistiu' : `Morto por: ${p.causa}`, 546, y, 12, '#ff8080', 'normal');
    textoDir(p.dia, 904, y, 11, '#777', 'normal');
  });
}

// ---------------------------------------------------------------------
//  Salas secretas atrás de paredes rachadas
// ---------------------------------------------------------------------
function criarSalaSecreta(m) {
  const salas = m.salas.filter(s => s !== m.salas[0]);
  for (let t = 0; t < 40; t++) {
    const s = escolher(salas), lado = randInt(0, 3);
    let fx, fy, px, py, pw, ph; // f: a parede rachada; p: o esconderijo
    if (lado === 0) { fy = s.y + randInt(1, s.h - 2); fx = s.x + s.w; px = fx + 1; py = fy - 1; pw = 4; ph = 3; }
    else if (lado === 1) { fy = s.y + randInt(1, s.h - 2); fx = s.x - 1; px = fx - 4; py = fy - 1; pw = 4; ph = 3; }
    else if (lado === 2) { fx = s.x + randInt(1, s.w - 2); fy = s.y + s.h; px = fx - 1; py = fy + 1; pw = 3; ph = 4; }
    else { fx = s.x + randInt(1, s.w - 2); fy = s.y - 1; px = fx - 1; py = fy - 4; pw = 3; ph = 4; }
    if (px < 2 || py < 2 || px + pw > m.W - 2 || py + ph > m.H - 2) continue;
    // tudo à volta do esconderijo (e a parede) tem de ser parede maciça
    let livre = true;
    for (let y = Math.min(py, fy) - 1; y <= Math.max(py + ph - 1, fy) + 1 && livre; y++)
      for (let x = Math.min(px, fx) - 1; x <= Math.max(px + pw - 1, fx) + 1 && livre; x++) {
        const eParede = x === fx && y === fy;
        const vizinhoDaSala = (lado < 2 ? x === fx - (lado === 0 ? 1 : -1) : y === fy - (lado === 2 ? 1 : -1));
        if (!eParede && !vizinhoDaSala && !solido(m, x, y)) livre = false;
      }
    if (!livre || !solido(m, fx, fy)) continue;
    m.oculto = new Uint8Array(m.W * m.H);
    for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) { cavar(m, x, y); m.oculto[y * m.W + x] = 1; }
    m.oculto[fy * m.W + fx] = 1;
    m.rachada = { x: fx, y: fy };
    m.secreta = { x: px, y: py, w: pw, h: ph, cx: (px + pw / 2) * TILE, cy: (py + ph / 2) * TILE };
    return;
  }
}

// Desenha as fendas na parede (no mapa pré-desenhado)
function desenharRachada(m, g, T) {
  if (!m.rachada) return;
  const x = m.rachada.x * T, y = m.rachada.y * T;
  g.fillStyle = 'rgba(0,0,0,0.55)';
  for (const [a, b] of [[3, 2], [4, 3], [5, 5], [6, 6], [6, 7], [8, 8], [9, 10], [10, 11], [7, 9], [5, 11], [4, 12], [11, 5], [12, 4]]) g.fillRect(x + a, y + b, 1, 1);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  for (const [a, b] of [[4, 2], [7, 6], [10, 10], [12, 5]]) g.fillRect(x + a, y + b, 1, 1);
}

// Um golpe, flecha ou explosão perto da parede rachada parte-a
function tocarRachada(x, y, raio) {
  const r = mapa && mapa.rachada;
  if (!r) return;
  const cx = (r.x + 0.5) * TILE, cy = (r.y + 0.5) * TILE;
  if (Math.hypot(x - cx, y - cy) > raio + TILE * 0.6) return;
  mapa.tiles[r.y * mapa.W + r.x] = 1;
  mapa.oculto = null;
  mapa.rachada = null;
  const T = TILE / ESCALA, g = mapaImg.getContext('2d');
  g.drawImage(ladrilhosZona(andar).chaos[0], r.x * T, r.y * T);
  reiniciarCampo();
  revelar(mapa, cx, cy, 4);
  explosao(cx, cy, '#8a8176', 30, 220, 6);
  tremor = Math.max(tremor, 8);
  som(90, 0.4, 'square', 0.05, -40);
  mostrarBanner('SALA SECRETA!', 'Encontraste um esconderijo', '#ffd23f');
  registar('secreta');
  if (contar('secretas') >= 3) desbloquear('segredos');
}

// O que há dentro da sala secreta
function encherSalaSecreta() {
  const s = mapa.secreta;
  if (!s) return;
  soltarOuro(s.cx, s.cy, Math.round(rand(20, 35) * (1 + (andar - 1) * 0.25)), 6);
  if (Math.random() < 0.5) soltarReliquia(s.cx, s.cy);
  else baus.push({ x: s.cx, y: s.cy, tipo: 'ouro', semMimico: true, t: 0 });
}

// ---------------------------------------------------------------------
//  Sala do Diabo e Sala do Anjo
// ---------------------------------------------------------------------
function criarSalaPacto(marcar) {
  const depoisBoss = andar % 5 === 1 && andar > 1;
  if (!(depoisBoss ? Math.random() < 0.65 : andar >= 3 && Math.random() < 0.08)) return null;
  const diabo = Math.random() < 0.55;
  const sala = marcar(diabo ? 'diabo' : 'anjo');
  if (!sala) return null;
  const c = centroPx(sala);
  objetos.push({ tipo: 'estatua', diabo, sala, x: c.x, y: c.y - 50 });
  const grupo = Math.random();
  const n = diabo ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const x = c.x + (k - (n - 1) / 2) * 80, y = c.y + 34;
    const o = { tipo: 'pedestal', sala, grupo, diabo, x, y };
    if (diabo && k === n - 1) { // o Diabo também vende uma arma ou armadura poderosa
      const r = Math.random() < 0.25 ? 'mitico' : 'lendario';
      o.item = criarItem(escolher(ITENS.filter(i => i.r === r && i.tipo !== 'amuleto')), andar);
      o.custo = 0.2;
    } else {
      o.rel = sortearReliquia();
      if (!o.rel || objetos.some(p => p.tipo === 'pedestal' && p.rel === o.rel)) continue;
      o.custo = diabo ? 0.15 : 0;
    }
    objetos.push(o);
  }
  return sala;
}

function usarPedestal(o) {
  if (o.custo > 0) {
    if ((J.vidaVendida || 0) + o.custo > 0.61) { texto(J.x, J.y - 30, 'Já não tens vida para vender!', '#ff6060', 15); return; }
    J.vidaVendida = +((J.vidaVendida || 0) + o.custo).toFixed(2);
    S = stats();
    J.hp = Math.min(J.hp, S.maxHp);
    texto(J.x, J.y - 40, `-${Math.round(o.custo * 100)}% vida máxima`, '#ff3b3b', 16);
    tremor = 8;
    som(70, 0.6, 'sawtooth', 0.06, -20);
    if (contar('diabo') >= 3) desbloquear('diabo');
  }
  if (o.item) { const m = trocarEquipamento(o.item); texto(J.x, J.y - 60, m || o.item.nome, RARIDADES[o.item.r].cor, 14); registrarItem(o.item); }
  else ganharReliquia(o.rel);
  // no Anjo só podes levar um
  objetos = objetos.filter(p => p !== o && !(p.tipo === 'pedestal' && !o.diabo && p.grupo === o.grupo));
}

const cacheExtras = {};
function spritePedestal() {
  if (cacheExtras.pedestal) return cacheExtras.pedestal;
  const g = novaGrade(16, 12);
  for (let y = 2; y < 12; y++) for (let x = 3; x < 13; x++) pixel(g, x, y, x < 5 ? '#b8b0c8' : x > 10 ? '#5a5068' : '#8a8098');
  for (let x = 1; x < 15; x++) { pixel(g, x, 1, '#c8c0d8'); pixel(g, x, 2, '#9a90a8'); pixel(g, x, 11, '#4a4058'); }
  contornar(g);
  return (cacheExtras.pedestal = gradeParaCanvas(g));
}

function spriteEstatua(diabo) {
  const k = diabo ? 'diabo' : 'anjo';
  if (cacheExtras[k]) return cacheExtras[k];
  const g = novaGrade(24, 30);
  const pedra = diabo ? tons('#5a2a2a') : tons('#d8d8e8');
  elipse(g, 12, 9, 5, 5, pedra);                     // cabeça
  poligono(g, [[6, 14], [18, 14], [16, 26], [8, 26]], pedra.base); // corpo
  for (let y = 26; y < 30; y++) for (let x = 5; x < 19; x++) pixel(g, x, y, '#6a6478');
  if (diabo) { // chifres e olhos vermelhos
    poligono(g, [[7, 6], [5, 0], [9, 5]], '#3a1a1a'); poligono(g, [[17, 6], [19, 0], [15, 5]], '#3a1a1a');
    pixel(g, 10, 9, '#ff3b3b'); pixel(g, 14, 9, '#ff3b3b');
  } else { // asas e auréola
    poligono(g, [[6, 15], [0, 10], [2, 22]], '#f0f0ff'); poligono(g, [[18, 15], [24, 10], [22, 22]], '#f0f0ff');
    for (let x = 8; x <= 16; x++) pixel(g, x, 2, '#ffe14d');
    pixel(g, 10, 9, '#8ab8d0'); pixel(g, 14, 9, '#8ab8d0');
  }
  contornar(g);
  return (cacheExtras[k] = gradeParaCanvas(g));
}

function desenharObjetoExtra(o, t) {
  if (o.tipo === 'estatua') {
    sombra(o.x, o.y + 28, 16);
    spr(spriteEstatua(o.diabo), o.x, o.y);
    return true;
  }
  if (o.tipo === 'pedestal') {
    sombra(o.x, o.y + 12, 12);
    spr(spritePedestal(), o.x, o.y + 6);
    const bob = Math.sin(t * 3 + o.x) * 3;
    ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 4);
    circulo(o.x, o.y - 18 + bob, 18, o.diabo ? '#ff3b3b' : '#fff0a0');
    ctx.globalAlpha = 1;
    if (o.item) spr(iconeItem(o.item), o.x, o.y - 18 + bob);
    else spr(iconeReliquia(o.rel), o.x, o.y - 18 + bob);
    return true;
  }
  return false;
}

function desenharInfoExtra(o, sx, sy) {
  const usar = modoToque ? 'Usar' : '[E]';
  if (o.tipo === 'estatua') {
    textoCentro(o.diabo ? 'O Diabo sorri...' : 'O Anjo observa-te', sx, sy - 18, 15, o.diabo ? '#ff6060' : '#fff0a0');
    textoCentro(o.diabo ? 'Troca vida máxima por poder' : 'Escolhe só um dos presentes', sx, sy, 12, '#ddd');
    return true;
  }
  if (o.tipo === 'pedestal') {
    const nome = o.item ? o.item.nome : RELIQUIAS[o.rel].nome, cor = o.item ? RARIDADES[o.item.r].cor : RELIQUIAS[o.rel].cor;
    const desc = o.item ? `${RARIDADES[o.item.r].nome} · ${linhasItem(o.item).slice(0, 2).join(' · ')}` : RELIQUIAS[o.rel].desc;
    textoCentro(nome, sx, sy - 36, 15, cor);
    textoCentro(desc, sx, sy - 18, 12, '#ddd');
    textoCentro(o.custo > 0 ? `${usar}: Pagar ${Math.round(o.custo * 100)}% da vida máxima` : `${usar}: Levar (os outros desaparecem)`, sx, sy, 13, o.custo > 0 ? '#ff6060' : '#ffe680');
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------
//  Coleção: Itens, Monstros (bestiário) e Relíquias
// ---------------------------------------------------------------------
const DESC_MONSTROS = {
  anjoGuerreiro: 'Carrega contra ti com a lança.', arqueiroCeleste: 'Dispara flechas de luz de longe.', querubim: 'Voa aos ziguezagues e morde.',
  cavaleiroVazio: 'Prepara-se e faz uma investida.', magoVazio: 'Lança esferas do Vazio.', devorador: 'Lento, mas engole tudo o que apanha.',
  arcanjo: 'Leque de penas, pilares de luz e investidas pelo ar.', generalMonarca: 'Ondas de espada, saltos esmagadores e cortes giratórios.',
  carrasco: 'Ceifa em arco, puxa-te com correntes e deixa poças do Vazio.', monarca: 'O chefe final. Três fases, esferas, chuva do Vazio e o seu exército.',
  slime: 'Salta para cima de ti.', morcego: 'Voa aos ziguezagues.', esqueleto: 'Dispara flechas quando te vê.',
  orc: 'Prepara-se e faz uma investida.', fantasma: 'Atravessa paredes.', zumbi: 'Levanta-se uma vez depois de morrer.',
  diabrete: 'Atira bolas de fogo.', slimeLava: 'Explode quando morre.', loboGelo: 'Muito rápido. A mordida abranda-te.',
  elementalGelo: 'Dispara três pedaços de gelo.', aranha: 'Pequena, rápida e aos ziguezagues.', mimico: 'Finge ser um baú.',
  reiSlime: 'Boss do andar 5.', lich: 'Boss do andar 10.', dragao: 'Boss do andar 15.', golem: 'Boss do andar 20.',
  rainha: 'Boss do andar 25.', demonio: 'Boss do andar 30.', guardiao: 'Boss do andar 35.', senhorVazio: 'Boss do andar 40.',
};
const LISTA_MONSTROS = Object.keys(INIMIGOS).concat(BOSSES.map(b => b.id));
const nomeMonstro = id => (INIMIGOS[id] || BOSSES.find(b => b.id === id)).nome;
const corMonstro = id => (INIMIGOS[id] || BOSSES.find(b => b.id === id)).cor;
const ABAS_COLECAO = ['itens', 'monstros', 'reliquias'];
const retAba = i => ({ x: 214 + i * 180, y: 52, w: 170, h: 30 });
const retMonstro = i => ({ x: 34 + (i % 12) * 75, y: 92 + Math.floor(i / 12) * 76, w: 70, h: 70 });
const retRelColecao = i => ({ x: 94 + (i % 10) * 78, y: 110 + Math.floor(i / 10) * 86, w: 70, h: 76 });

function viuMonstro(id) {
  if (!meta.vistos) meta.vistos = {};
  if (meta.vistos[id]) return;
  meta.vistos[id] = true;
  salvarMeta();
}

// Devolve true se tratou da aba (as abas Monstros e Relíquias)
function atualizarColecaoExtra() {
  if (!menuMeta.aba) menuMeta.aba = 'itens';
  ABAS_COLECAO.forEach((a, i) => { if (clicou(retAba(i))) { menuMeta.aba = a; menuMeta.sel = 0; } });
  if (premiu('tab')) { menuMeta.aba = ABAS_COLECAO[(ABAS_COLECAO.indexOf(menuMeta.aba) + 1) % 3]; menuMeta.sel = 0; }
  if (menuMeta.aba === 'itens') return false;
  const lista = menuMeta.aba === 'monstros' ? LISTA_MONSTROS : Object.keys(RELIQUIAS);
  const ret = menuMeta.aba === 'monstros' ? retMonstro : retRelColecao, porLinha = menuMeta.aba === 'monstros' ? 12 : 10;
  lista.forEach((_, i) => { if (dentro(ret(i)) || clicou(ret(i))) menuMeta.sel = i; });
  const n = lista.length;
  if (premiu('d', 'arrowright')) menuMeta.sel = (menuMeta.sel + 1) % n;
  if (premiu('a', 'arrowleft')) menuMeta.sel = (menuMeta.sel + n - 1) % n;
  if (premiu('s', 'arrowdown')) menuMeta.sel = Math.min(n - 1, menuMeta.sel + porLinha);
  if (premiu('w', 'arrowup')) menuMeta.sel = Math.max(0, menuMeta.sel - porLinha);
  return true;
}

function desenharAbasColecao() {
  const nItens = Object.keys(meta.colecao).length, nMon = LISTA_MONSTROS.filter(id => (meta.vistos || {})[id]).length;
  const nRel = Object.keys(meta.relVistas || {}).length;
  const textos = [`Itens ${nItens}/${ITENS_COLECAO.length}`, `Monstros ${nMon}/${LISTA_MONSTROS.length}`, `Relíquias ${nRel}/${Object.keys(RELIQUIAS).length}`];
  ABAS_COLECAO.forEach((a, i) => {
    const r = retAba(i), sel = (menuMeta.aba || 'itens') === a;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffd23f' : dentro(r) ? '#ffffff' : '#3a3150');
    textoCentroAjustado(textos[i], r.x + r.w / 2, r.y + r.h / 2 + 1, 13, sel ? '#ffd23f' : '#aaa', r.w - 10);
  });
}

// Devolve true se desenhou (abas Monstros e Relíquias)
function desenharColecaoExtra() {
  const aba = menuMeta.aba || 'itens';
  if (aba === 'itens') return false;
  if (aba === 'monstros') {
    LISTA_MONSTROS.forEach((id, i) => {
      const r = retMonstro(i), viu = (meta.vistos || {})[id], sel = menuMeta.sel === i;
      painel(r.x, r.y, r.w, r.h, sel ? 'rgba(44,38,66,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffffff' : viu ? corMonstro(id) : '#2e2640');
      const c = SPR[id][0], esc = Math.max(1, Math.floor(56 / Math.max(c.width, c.height)));
      sprEcra(viu ? c : silhueta(c, '#2a2238'), r.x + r.w / 2, r.y + r.h / 2, Math.min(3, esc));
      if (!viu) textoCentro('?', r.x + r.w / 2, r.y + r.h / 2, 16, '#555', false);
    });
    const id = LISTA_MONSTROS[menuMeta.sel], viu = id && (meta.vistos || {})[id];
    if (id) {
      painel(160, 400, 640, 200, 'rgba(14,11,22,0.96)', viu ? corMonstro(id) : '#3a3150');
      if (viu) {
        const c = SPR[id][0], esc = Math.max(1, Math.floor(100 / Math.max(c.width, c.height)));
        sprEcra(c, 240, 490, Math.min(5, esc));
        const d = INIMIGOS[id];
        textoEsq(nomeMonstro(id), 330, 432, 20, corMonstro(id));
        textoEsq(d ? `Zonas: ${d.zonas.map(z => traduzir(NOMES_ZONAS[z])).join(', ') || '—'}` : 'Boss', 330, 456, 12, '#bbb', 'normal');
        textoEsq(d && d.desc ? d.desc : DESC_MONSTROS[id] || '', 330, 484, 13, '#eee', 'normal');
        if (d && d.hab) {
          textoEsq(`Veterano: ${traduzir(HABILIDADES_INIMIGO[d.hab[2]] || '')}`, 330, 516, 13, NIVEIS_INIMIGO[2].cor, 'normal');
          textoEsq(`Campeão: ${traduzir(HABILIDADES_INIMIGO[d.hab[3]] || '')}`, 330, 540, 13, NIVEIS_INIMIGO[3].cor, 'normal');
        }
      } else {
        textoEsq('???', 330, 440, 22, '#777');
        textoEsq('Ainda não encontraste este monstro.', 330, 476, 13, '#999', 'normal');
      }
    }
  } else {
    Object.keys(RELIQUIAS).forEach((id, i) => {
      const r = retRelColecao(i), viu = (meta.relVistas || {})[id], sel = menuMeta.sel === i;
      painel(r.x, r.y, r.w, r.h, sel ? 'rgba(44,38,66,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffffff' : viu ? RELIQUIAS[id].cor : '#2e2640');
      const c = iconeReliquia(id);
      sprEcra(viu ? c : silhueta(c, '#2a2238'), r.x + r.w / 2, r.y + r.h / 2, 3);
    });
    const id = Object.keys(RELIQUIAS)[menuMeta.sel], viu = id && (meta.relVistas || {})[id];
    if (id) {
      const R = RELIQUIAS[id];
      painel(160, 400, 640, 200, 'rgba(14,11,22,0.96)', viu ? R.cor : '#3a3150');
      sprEcra(viu ? iconeReliquia(id) : silhueta(iconeReliquia(id), '#2a2238'), 240, 490, 5);
      textoEsq(viu ? R.nome : '???', 330, 440, 20, viu ? R.cor : '#777');
      textoEsq(viu ? R.desc : 'Ainda não encontraste esta relíquia.', 330, 476, 14, '#eee', 'normal');
      textoEsq('Aparecem nos bosses, Baús Dourados, Sala de Desafio e loja,', 330, 512, 12, '#999', 'normal');
      textoEsq('nas salas secretas e nas salas do Diabo e do Anjo.', 330, 530, 12, '#999', 'normal');
    }
  }
  return true;
}
