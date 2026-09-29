'use strict';
// =====================================================================
//  CAÇADOR (inspirado em manhwas como Solo Leveling):
//  - Atributos para distribuir (Força, Agilidade, Vitalidade, Inteligência, Perceção)
//  - Habilidades de Caçador que desbloqueiam com o nível (teclas 5 a 8)
//  - Exército das Sombras: os monstros mortos levantam-se para lutar contigo
//  - Poder de combate e Rank de Caçador (E, D, C, B, A, S, Nacional)
//  - Equilíbrio dinâmico: se ficares muito mais forte do que o andar,
//    os monstros também sobem um pouco (mas o melhor equipamento continua a
//    fazer-te matar tudo depressa)
//  - A Janela de Estado com o aspeto azul do "Sistema"
// =====================================================================

// ---------------------------------------------------------------------
//  Atributos
// ---------------------------------------------------------------------
const ATRIBUTOS = [
  { id: 'for', nome: 'Força',        desc: '+1% dano',                           cor: '#ff6060' },
  { id: 'agi', nome: 'Agilidade',    desc: '+0.8% vel. de ataque e +0.3% vel.',  cor: '#5dff7a' },
  { id: 'vit', nome: 'Vitalidade',   desc: '+1.5% vida máxima',                  cor: '#ffae00' },
  { id: 'int', nome: 'Inteligência', desc: '+2% poder mágico e +1 mana',         cor: '#b48cff' },
  { id: 'per', nome: 'Perceção',     desc: '+0.4% crítico',                      cor: '#4dc3ff' },
];
const PONTOS_POR_NIVEL = 2;
const nAtr = id => (J && J.atributos ? J.atributos[id] || 0 : 0);

function bonusCacador() {
  return {
    danoPct: 0.01 * nAtr('for'),
    velAtaque: 0.008 * nAtr('agi'),
    velMov: 0.003 * nAtr('agi'),
    hpPct: 0.015 * nAtr('vit'),
    magia: 0.02 * nAtr('int'),
    mana: nAtr('int'),
    crit: 0.004 * nAtr('per'),
  };
}

function subirAtributo(id) {
  if (!(J.pontos > 0)) return;
  if (!J.atributos) J.atributos = {};
  J.atributos[id] = (J.atributos[id] || 0) + 1;
  J.pontos--;
  const hpAntes = S.maxHp;
  S = stats();
  if (S.maxHp > hpAntes) J.hp += S.maxHp - hpAntes;
  som(700 + (J.atributos[id] % 5) * 60, 0.06, 'square', 0.03, 200);
}

// ---------------------------------------------------------------------
//  Habilidades de Caçador (teclas 5 a 8 / segunda fila de botões)
// ---------------------------------------------------------------------
const HABILIDADES_CACADOR = [
  { id: 'ergue',   nome: 'Ergue-te!',       nivel: 5,  mana: 30, cd: 6,  cor: '#8a6aff', desc: 'Os monstros que mataste há pouco levantam-se como soldados sombra' },
  { id: 'sede',    nome: 'Sede de Sangue',  nivel: 10, mana: 20, cd: 18, cor: '#ff3b3b', desc: 'Os monstros à tua volta ficam paralisados de medo e levam +30% dano' },
  { id: 'mao',     nome: 'Mão Invisível',   nivel: 15, mana: 15, cd: 8,  cor: '#9fdcff', desc: 'Uma força invisível esmaga e empurra os monstros à tua frente' },
  { id: 'furtivo', nome: 'Furtividade',     nivel: 20, mana: 25, cd: 20, cor: '#b0a8c8', desc: 'Ficas invisível 5 s e o golpe seguinte faz dano x3' },
];
const temHabilidade = h => J && J.nivel >= (h.id === 'ergue' ? nivelErgue() : h.nivel);

function usarHabilidade(i) {
  const h = HABILIDADES_CACADOR[i];
  if (!h) return;
  if (!temHabilidade(h)) { texto(J.x, J.y - 30, `Desbloqueia no nível ${h.nivel}`, '#aaaaaa', 13); return; }
  if (!J.cdHab) J.cdHab = {};
  if ((J.cdHab[h.id] || 0) > 0) return;
  if (J.mana < h.mana) { texto(J.x, J.y - 30, 'Sem mana!', '#b48cff', 15); som(150, 0.1, 'square', 0.03); return; }
  const feito = ({ ergue: habErgue, sede: habSede, mao: habMao, furtivo: habFurtivo })[h.id]();
  if (!feito) return;
  J.mana -= h.mana;
  J.cdHab[h.id] = h.cd * (temRel('relogio') ? 0.7 : 1);
  registar('feitico');
}

function habErgue() {
  const max = maxSombras();
  const perto = cadaveres.filter(c => Math.hypot(c.x - J.x, c.y - J.y) < 220);
  if (!perto.length) { texto(J.x, J.y - 30, 'Não há corpos perto', '#aaaaaa', 13); return false; }
  let n = 0;
  for (const c of perto) {
    if (c.boss) { // só pode haver uma sombra de boss: a nova substitui a antiga
      J.sombras = J.sombras.filter(s => !s.boss);
      sombras = sombras.filter(s => !s.boss);
    } else if (J.sombras.filter(s => !s.boss).length >= max) continue;
    const s = { tipo: c.tipo, boss: c.boss };
    J.sombras.push(s);
    sombras.push(criarSombra(s, c.x, c.y));
    cadaveres.splice(cadaveres.indexOf(c), 1);
    explosao(c.x, c.y, '#6a4aff', 18, 160, 4);
    n++;
  }
  if (!n) { texto(J.x, J.y - 30, `Exército cheio (${max})`, '#aaaaaa', 13); return false; }
  texto(J.x, J.y - 40, 'ERGUE-TE!', '#8a6aff', 22);
  ondas.push({ x: J.x, y: J.y, r: 220, t: 0.5, dur: 0.5, cor: '#6a4aff' });
  som(90, 0.6, 'sawtooth', 0.05, 60);
  if (J.sombras.length >= 10) desbloquear('exercito');
  return true;
}

function habSede() {
  let n = 0;
  for (const e of inimigos) {
    if (e.morto || Math.hypot(e.x - J.x, e.y - J.y) > 230) continue;
    e.medo = e.boss ? 1 : 2.5;
    n++;
  }
  ondas.push({ x: J.x, y: J.y, r: 230, t: 0.6, dur: 0.6, cor: '#ff3b3b' });
  texto(J.x, J.y - 40, 'SEDE DE SANGUE', '#ff3b3b', 18);
  tremor = Math.max(tremor, 8);
  som(60, 0.8, 'sawtooth', 0.06, 30);
  return true;
}

function habMao() {
  const [ux, uy] = mira();
  const cx = J.x + ux * 110, cy = J.y + uy * 110;
  for (const e of inimigos) {
    if (e.morto || e.z > 20 || Math.hypot(e.x - cx, e.y - cy) > 120 + e.r) continue;
    const { dano, crit } = rolarDano(1.5);
    danoInimigo(e, dano, crit, ux * 3, uy * 3, true);
  }
  ondas.push({ x: cx, y: cy, r: 120, t: 0.35, dur: 0.35, cor: '#9fdcff' });
  tocarRachada(cx, cy, 120);
  tremor = Math.max(tremor, 6);
  som(120, 0.3, 'square', 0.05, -60);
  return true;
}

function habFurtivo() {
  J.furtivo = 5;
  J.golpeFurtivo = true;
  explosao(J.x, J.y, '#b0a8c8', 16, 140, 4);
  som(1200, 0.3, 'sine', 0.03, -900);
  return true;
}

function atualizarCacador(dt) {
  if (!J.cdHab) J.cdHab = {};
  for (const k in J.cdHab) J.cdHab[k] -= dt;
  for (let i = 0; i < HABILIDADES_CACADOR.length; i++) if (premiu(String(5 + i))) usarHabilidade(i);
  if (premiu('u')) abrirStatus();
  if (J.furtivo > 0) J.furtivo -= dt;
  for (const c of cadaveres) c.t -= dt;
  cadaveres = cadaveres.filter(c => c.t > 0);
  atualizarSombras(dt);
}

// Novas habilidades e pontos ao subir de nível
function aoSubirNivelCacador() {
  J.pontos = (J.pontos || 0) + PONTOS_POR_NIVEL;
  const h = HABILIDADES_CACADOR.find(x => x.nivel === J.nivel);
  if (h) avisar(`[Sistema] Nova habilidade: ${h.nome}`, `Tecla ${5 + HABILIDADES_CACADOR.indexOf(h)} · ${h.desc}`, '#4dc3ff');
  else if (J.nivel === 2) avisar('[Sistema] Tens pontos de atributo', `Abre a Janela de Estado (${modoToque ? 'botão do herói' : 'tecla U'}) para os usar`, '#4dc3ff');
}

// ---------------------------------------------------------------------
//  Exército das Sombras
// ---------------------------------------------------------------------
let cadaveres = [], sombras = [];
const maxSombras = () => Math.min(10, 2 + Math.floor(J.nivel / 8)) + extraSombras();

function deixarCadaver(e) {
  if (!J || J.nivel < nivelErgue() || e.mini) return;
  if (!SPR[e.tipo]) return;
  cadaveres.push({ tipo: e.tipo, boss: !!e.boss, x: e.x, y: e.y, t: e.boss ? 20 : 8 });
  if (cadaveres.length > 30) cadaveres.shift();
}

function criarSombra(s, x, y) {
  const r = s.boss ? 22 : Math.min(15, (INIMIGOS[s.tipo] || { r: 12 }).r);
  return { tipo: s.tipo, boss: s.boss, x, y, r, t: Math.random() * 6, cd: 0.5, dir: 1, ang: Math.random() * Math.PI * 2 };
}

// No início de cada andar o exército aparece à tua volta
function levantarExercito() {
  cadaveres = [];
  sombras = (J.sombras || []).map((s, i) => {
    const a = i / Math.max(1, J.sombras.length) * Math.PI * 2;
    let x = J.x + Math.cos(a) * 40, y = J.y + Math.sin(a) * 40;
    if (colideCirculo(mapa, x, y, 10)) { x = J.x; y = J.y; }
    return criarSombra(s, x, y);
  });
}

const danoSombra = s => Math.max(1, Math.round(S.dano * (s.boss ? 0.6 : 0.15) * (1 + 0.01 * J.nivel) * bonusSombras()));

function atualizarSombras(dt) {
  sombras.forEach((s, i) => {
    s.t += dt; s.cd -= dt;
    let alvo = null, md = 280;
    for (const e of inimigos) {
      if (e.morto || e.z > 20) continue;
      const d = Math.hypot(e.x - s.x, e.y - s.y);
      if (d < md && Math.hypot(e.x - J.x, e.y - J.y) < 420) { md = d; alvo = e; }
    }
    let tx, ty;
    if (alvo) { tx = alvo.x; ty = alvo.y; }
    else { // formação à volta do herói
      const a = s.ang + i * 0.9 + s.t * 0.2, raio = 44 + (i % 3) * 16;
      tx = J.x + Math.cos(a) * raio; ty = J.y + Math.sin(a) * raio;
    }
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
    const vel = s.boss ? 150 : 185, perto = alvo ? alvo.r + s.r : 8;
    s.andando = d > perto;
    if (s.andando) moverEntidade(mapa, s, dx / d * vel * dt, dy / d * vel * dt);
    if (Math.abs(dx) > 2) s.dir = dx > 0 ? 1 : -1;
    if (alvo && d < alvo.r + s.r + 8 && s.cd <= 0) {
      s.cd = s.boss ? 1.2 : 0.9;
      danoInimigo(alvo, danoSombra(s), false, dx / d, dy / d);
      if (s.boss) ondas.push({ x: s.x, y: s.y, r: 60, t: 0.25, dur: 0.25, cor: '#6a4aff' });
    }
    if (Math.hypot(s.x - J.x, s.y - J.y) > 520) { s.x = J.x + rand(-20, 20); s.y = J.y + rand(-20, 20); }
    if (Math.random() < 0.08) particulas.push({ x: s.x + rand(-s.r, s.r), y: s.y + rand(-s.r, s.r), vx: 0, vy: -30, t: 0.5, cor: '#4a2a8a', tam: 4 });
  });
}

function spriteSombra(s) {
  const k = 'sombra_' + s.tipo;
  if (!cacheExtras[k]) {
    const base = SPR[s.tipo][0];
    const c = document.createElement('canvas');
    c.width = base.width; c.height = base.height;
    const g = c.getContext('2d');
    g.drawImage(silhueta(base, '#1c1030'), 0, 0);
    // olhos azuis a brilhar
    g.fillStyle = '#4dc3ff';
    const ox = Math.round(base.width / 2), oy = Math.round(base.height * 0.3);
    g.fillRect(ox - 3, oy, 2, 1); g.fillRect(ox + 1, oy, 2, 1);
    cacheExtras[k] = c;
  }
  return cacheExtras[k];
}

function desenharSombra(s, t) {
  const c = spriteSombra(s);
  const esc = s.boss ? 0.55 : 1;
  sombra(s.x, s.y + s.r * 0.8, s.r * 0.8);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(esc, esc);
  ctx.translate(-s.x, -s.y);
  ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 4 + s.ang);
  spr(silhueta(SPR[s.tipo][0], '#6a4aff'), s.x, s.y - 2 - (s.andando ? Math.abs(Math.sin(s.t * 10)) * 2 : 0), s.dir < 0);
  ctx.globalAlpha = 0.95;
  spr(c, s.x, s.y - (s.andando ? Math.abs(Math.sin(s.t * 10)) * 2 : 0), s.dir < 0);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function desenharCadaveres(t) {
  for (const c of cadaveres) {
    ctx.globalAlpha = Math.min(1, c.t) * (0.4 + 0.2 * Math.sin(t * 5 + c.x));
    ctx.fillStyle = '#4a2a8a';
    ctx.beginPath();
    ctx.ellipse(alinhar(c.x), alinhar(c.y + 8), c.boss ? 30 : 12, c.boss ? 10 : 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (Math.random() < 0.05) particulas.push({ x: c.x + rand(-8, 8), y: c.y, vx: 0, vy: -40, t: 0.6, cor: '#6a4aff', tam: 3 });
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Poder de combate, Rank e equilíbrio dinâmico
// ---------------------------------------------------------------------
const RANKS = [
  { letra: 'E', ate: 5,   cor: '#9a9aa8' },
  { letra: 'D', ate: 10,  cor: '#5dff7a' },
  { letra: 'C', ate: 20,  cor: '#4dc3ff' },
  { letra: 'B', ate: 30,  cor: '#b48cff' },
  { letra: 'A', ate: 40,  cor: '#ffae00' },
  { letra: 'S', ate: 55,  cor: '#ff3b3b' },
  { letra: 'Nacional', ate: 9999, cor: '#ffe14d' },
];
const rankDoAndar = a => RANKS.find(r => a <= r.ate);

function dpsSombras() {
  return (J.sombras || []).reduce((s, x) => s + danoSombra(x) / (x.boss ? 1.2 : 0.9), 0);
}

// Força do herói num só número: mistura o dano por segundo com a vida "efetiva"
function poderJogador() {
  const golpe = S.dano * (1 + S.danoPct) * (1 + S.crit);
  const dps = golpe / S.cdAtaque + dpsSombras();
  const ehp = S.maxHp / (1 - reducaoDefesa());
  return Math.round(Math.sqrt(dps * 0.42 * ehp));
}

// Poder que um andar pede: o poder de um herói "médio" nesse andar
// (nível e equipamento típicos), calculado com as mesmas regras do jogo.
const cachePoderRef = new Map();
function poderReferencia(a) {
  if (cachePoderRef.has(a)) return cachePoderRef.get(a);
  const guardaJ = J, guardaS = S, guardaAndar = andar;
  try {
    andar = a;
    J = criarJogador();
    J.dificuldade = 'normal'; J.pacto = {}; J.reliquias = [];
    const L = Math.round(a * 0.9) + 1;
    J.nivel = L; J.hpBase += 10 * (L - 1); J.atkBase += 2 * (L - 1); J.defBase += (L - 1);
    J.atributos = { for: L - 1, vit: L - 1 };
    const r = a < 6 ? 'comum' : a < 16 ? 'raro' : a < 36 ? 'epico' : 'lendario';
    for (const tipo of ['arma', 'armadura', 'amuleto']) {
      const lista = ITENS.filter(i => i.tipo === tipo && i.r === r && !i.inicial);
      if (lista.length) J[tipo] = criarItem(lista[Math.floor(lista.length / 2)], a, true);
    }
    const k = Math.min(3, Math.floor(L / 8));
    J.perks = { forca: k, vitalidade: k, pedra: Math.min(2, k) };
    J.sombras = L >= 5 ? Array.from({ length: Math.min(10, 2 + Math.floor(L / 8)) }, () => ({ tipo: 'esqueleto' })) : [];
    S = stats();
    const v = poderJogador();
    cachePoderRef.set(a, v);
    return v;
  } finally { J = guardaJ; S = guardaS; andar = guardaAndar; }
}

function poderRecomendado(a) {
  const D = dif();
  const p = J && J.pacto ? (1 + 0.25 * nPacto('pele')) * (1 + 0.2 * nPacto('forca')) : 1;
  return Math.round(poderReferencia(a) * Math.sqrt(D.hp * D.dano * p));
}

// Rank do herói: o andar mais fundo cujo poder recomendado ele já tem
function rankJogador() {
  const p = poderJogador();
  let f = 1;
  while (f < 300 && poderRecomendado(f + 1) <= p) f++;
  return rankDoAndar(f);
}

// Se estiveres muito acima do andar, os monstros também sobem (com limites)
function atualizarFatorAdaptativo() {
  S = stats();
  const razao = poderJogador() / Math.max(1, poderRecomendado(andar));
  J.fatorAdapt = {
    hp: clamp(Math.pow(razao / 1.6, 0.4), 1, 2),
    dano: clamp(Math.pow(razao / 1.6, 0.3), 1, 1.6),
    razao,
  };
}
const fatorAdapt = () => (J && J.fatorAdapt) || { hp: 1, dano: 1, razao: 1 };

// Cor do poder no HUD: verde = mais forte do que o andar, vermelho = perigo
function corPoder() {
  const r = poderJogador() / Math.max(1, poderRecomendado(andar));
  return r >= 1.3 ? '#5dff7a' : r >= 0.85 ? '#ffe14d' : '#ff5050';
}
const formatarPoder = p => p >= 10000 ? `${(p / 1000).toFixed(0)}k` : p >= 1000 ? `${(p / 1000).toFixed(1)}k` : `${p}`;

// ---------------------------------------------------------------------
//  Janela de Estado (estilo "Sistema")
// ---------------------------------------------------------------------
let voltarStatus = 'jogo';
function abrirStatus() {
  voltarStatus = estado;
  menuMeta = { t: 0 };
  estado = 'status';
  rato.baixo = false;
}
const retAtributo = i => ({ x: 60, y: 250 + i * 50, w: 400, h: 42 });
const retMais = i => ({ x: 404, y: 254 + i * 50, w: 48, h: 34 });
const BOTAO_STATUS = { x: LARGURA - 190, y: 20, w: 170, h: 34 };

function atualizarStatus(dt) {
  menuMeta.t += dt;
  if (menuMeta.t < 0.1) return;
  ATRIBUTOS.forEach((a, i) => { if (clicou(retMais(i))) subirAtributo(a.id); });
  if (premiu('escape', 'u') || clicou(BOTAO_VOLTAR) || (premiu('rato') && !ATRIBUTOS.some((a, i) => dentro(retMais(i))))) {
    estado = voltarStatus === 'status' ? 'jogo' : voltarStatus;
    menuMeta = null;
  }
}

function janelaSistema(x, y, w, h) {
  ctx.fillStyle = 'rgba(6,20,40,0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#4dc3ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = 'rgba(77,195,255,0.12)';
  ctx.fillRect(x + 4, y + 4, w - 8, 3);
}

function desenharStatus(t) {
  ctx.fillStyle = 'rgba(0,4,12,0.88)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  textoCentro('ESTADO', LARGURA / 2, 34, 30, '#4dc3ff');
  const poder = poderJogador(), rec = poderRecomendado(andar), rk = rankJogador(), rp = rankDoAndar(andar);
  // cabeçalho: rank, poder e o que o andar pede
  janelaSistema(40, 64, 880, 150);
  textoEsq('RANK', 64, 92, 14, '#9fdcff');
  textoEsq(rk.letra, 64, 136, rk.letra.length > 2 ? 28 : 54, rk.cor);
  textoEsq(`Nível ${J.nivel}   ·   ${RACAS[J.raca].nome}`, 250, 92, 16, '#ffffff');
  textoEsq(`Poder de combate: ${poder}`, 250, 124, 20, corPoder());
  textoEsq(`Andar ${andar} · Portal Rank ${rp.letra} · recomendado ${rec}`, 250, 152, 14, '#9fdcff', 'normal');
  const r = poder / Math.max(1, rec);
  const veredicto = r >= 2 ? 'Muito mais forte do que este portal. Os monstros também ficaram mais fortes.'
    : r >= 1.3 ? 'Mais forte do que este portal.' : r >= 0.85 ? 'Ao nível deste portal. Cuidado.' : 'Mais fraco do que este portal. Perigo!';
  textoEsq(veredicto, 250, 178, 13, corPoder(), 'normal');
  const F = fatorAdapt();
  if (F.hp > 1.01) textoEsq(`Equilíbrio: monstros +${Math.round((F.hp - 1) * 100)}% vida, +${Math.round((F.dano - 1) * 100)}% dano`, 250, 198, 11, '#ff9b45', 'normal');
  // atributos
  janelaSistema(40, 226, 440, 300);
  textoEsq('ATRIBUTOS', 60, 240, 14, '#9fdcff');
  textoDir(`Pontos: ${J.pontos || 0}`, 460, 240, 14, J.pontos > 0 ? '#ffe14d' : '#667');
  ATRIBUTOS.forEach((a, i) => {
    const rr = retAtributo(i), m = retMais(i);
    textoEsq(a.nome, rr.x + 6, rr.y + 14, 16, a.cor);
    textoEsq(a.desc, rr.x + 6, rr.y + 32, 11, '#9fb8d0', 'normal');
    textoDir(`${nAtr(a.id)}`, rr.x + 330, rr.y + 20, 20, '#ffffff');
    if (J.pontos > 0) {
      painel(m.x, m.y, m.w, m.h, dentro(m) ? 'rgba(40,90,140,0.97)' : 'rgba(10,40,70,0.95)', '#4dc3ff');
      textoCentro('+', m.x + m.w / 2, m.y + m.h / 2 + 1, 22, '#ffffff');
    }
  });
  textoEsq(`Ganhas ${PONTOS_POR_NIVEL} pontos em cada nível`, 60, 512, 11, '#667', 'normal');
  // habilidades
  janelaSistema(500, 226, 420, 300);
  textoEsq('HABILIDADES DE CAÇADOR', 520, 240, 14, '#9fdcff');
  HABILIDADES_CACADOR.forEach((h, i) => {
    const y = 268 + i * 62, tem = temHabilidade(h);
    ctx.globalAlpha = tem ? 1 : 0.45;
    circuloEcra(538, y + 8, 16, 'rgba(10,30,60,0.9)', h.cor, 3);
    textoCentro(`${5 + i}`, 538, y + 9, 14, '#fff');
    textoEsq(`${h.nome}`, 564, y, 15, tem ? h.cor : '#889');
    textoDir(tem ? `Mana ${h.mana} · ${h.cd}s` : `Nível ${h.nivel}`, 904, y, 11, tem ? '#9fdcff' : '#ff8080');
    textoEsq(h.desc, 564, y + 20, 10, '#bcd', 'normal');
    ctx.globalAlpha = 1;
  });
  // exército
  janelaSistema(40, 538, 880, 64);
  const n = (J.sombras || []).length;
  textoEsq('EXÉRCITO DAS SOMBRAS', 60, 556, 14, '#9fdcff');
  textoDir(J.nivel >= 5 ? `${J.sombras.filter(s => !s.boss).length} / ${maxSombras()} soldados${J.sombras.some(s => s.boss) ? ' + 1 boss' : ''}` : 'Desbloqueia no nível 5', 904, 556, 13, '#b48cff');
  (J.sombras || []).slice(0, 22).forEach((s, i) => {
    const c = spriteSombra(s), esc = Math.max(1, Math.floor(26 / Math.max(c.width, c.height)));
    sprEcra(c, 72 + i * 38, 584, Math.min(2, esc));
  });
  if (!n && J.nivel >= 5) textoEsq('Mata monstros e usa "Ergue-te!" (tecla 5) perto dos corpos', 60, 584, 12, '#889', 'normal');
  textoCentro(modoToque ? 'Toca fora dos botões para voltar' : 'U / Esc para voltar', LARGURA / 2, ALTURA - 14, 12, '#667', false);
}

// Botões de toque das habilidades (segunda fila, por cima dos feitiços)
function botoesHabilidadeToque() {
  return HABILIDADES_CACADOR.map((h, i) => ({ id: 'h' + i, x: 436 + i * 66, y: 532, r: 26, tecla: String(5 + i), hab: i, ancora: [535, ALTURA] }));
}
