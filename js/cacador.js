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
// Todas as habilidades que existem. Cada caçador só recebe as suas (ver CLASSES em classes.js)
const TODAS_HABILIDADES = {
  ergue:      { nome: 'Ergue-te!',         mana: 30, cd: 6,  cor: '#8a6aff', desc: 'Os monstros que mataste há pouco levantam-se como soldados sombra' },
  sede:       { nome: 'Sede de Sangue',    mana: 20, cd: 18, cor: '#ff3b3b', desc: 'Os monstros à tua volta ficam paralisados de medo e levam +30% dano' },
  mao:        { nome: 'Mão Invisível',     mana: 15, cd: 8,  cor: '#9fdcff', desc: 'Uma força invisível esmaga e empurra os monstros à tua frente' },
  furtivo:    { nome: 'Furtividade',       mana: 25, cd: 20, cor: '#b0a8c8', desc: 'Ficas invisível 5 s e o golpe seguinte faz dano x3' },
  redemoinho: { nome: 'Redemoinho',        mana: 15, cd: 5,  cor: '#ffe680', desc: 'Giras a arma e cortas todos os monstros à tua volta' },
  investida:  { nome: 'Investida',         mana: 15, cd: 7,  cor: '#ffae00', desc: 'Carregas em frente e atordoas os monstros que atropelas' },
  milCortes:  { nome: 'Mil Cortes',        mana: 20, cd: 8,  cor: '#fff6a0', desc: 'Saltas para o monstro mais perto e cortas 6 vezes seguidas' },
  paredeFogo: { nome: 'Rio de Chamas',     mana: 25, cd: 8,  cor: '#ff7b25', desc: 'Uma linha de explosões de fogo à tua frente' },
  supernova:  { nome: 'Supernova',         mana: 45, cd: 20, cor: '#ffe14d', desc: 'Uma explosão enorme à tua volta que queima tudo' },
  rugido:     { nome: 'Rugido',            mana: 20, cd: 16, cor: '#ffffff', desc: 'Os monstros fogem de medo e ganhas +25% dano durante 6 s' },
  grito:      { nome: 'Grito de Guerra',   mana: 20, cd: 18, cor: '#c0a060', desc: 'Durante 6 s levas -40% dano' },
  onda:       { nome: 'Onda de Choque',    mana: 15, cd: 8,  cor: '#d8b070', desc: 'Um soco no ar que esmaga e empurra os monstros à tua frente' },
  barreira:   { nome: 'Barreira Sagrada',  mana: 25, cd: 15, cor: '#fff0a0', desc: 'Um escudo de luz absorve dano (25% da tua vida) durante 8 s' },
  julgamento: { nome: 'Julgamento',        mana: 25, cd: 9,  cor: '#fff6a0', desc: 'Pilares de luz caem sobre os 4 monstros mais perto (x2 em mortos-vivos)' },
  tornado:    { nome: 'Tornado',           mana: 20, cd: 9,  cor: '#9fdcff', desc: 'Um tornado lento que atravessa e corta tudo no caminho' },
};
// Níveis em que se desbloqueia a 1.ª, 2.ª, 3.ª e 4.ª habilidade
const NIVEIS_HABILIDADE = [3, 8, 14, 20];

// As habilidades do caçador escolhido (teclas 5 a 8)
const cacheHabs = {};
function habsJ() {
  const id = (J && J.classe) || 'aventureiro';
  if (!cacheHabs[id]) cacheHabs[id] = (classeJ().habs || []).map((h, i) =>
    Object.assign({ id: h }, TODAS_HABILIDADES[h], { nivel: h === 'ergue' && id === 'sombras' ? 1 : NIVEIS_HABILIDADE[i] }));
  return cacheHabs[id];
}
const temHabilidade = h => J && J.nivel >= h.nivel;

function usarHabilidade(i) {
  const h = habsJ()[i];
  if (!h) return;
  if (!temHabilidade(h)) { texto(J.x, J.y - 30, `Desbloqueia no nível ${h.nivel}`, '#aaaaaa', 13); return; }
  if (!J.cdHab) J.cdHab = {};
  if ((J.cdHab[h.id] || 0) > 0) return;
  if (J.mana < h.mana) { texto(J.x, J.y - 30, 'Sem mana!', '#b48cff', 15); som(150, 0.1, 'square', 0.03); return; }
  const feito = ({ ergue: habErgue, sede: habSede, mao: habMao, furtivo: habFurtivo, redemoinho: habRedemoinho, investida: habInvestida,
    milCortes: habMilCortes, paredeFogo: habParedeFogo, supernova: habSupernova, rugido: habRugido, grito: habGrito, onda: habMao,
    barreira: habBarreira, julgamento: habJulgamento, tornado: habTornado })[h.id]();
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
    let nome = null;
    if (c.boss) { // os bosses tornam-se generais com nome; se já tens o máximo, o mais antigo dá lugar ao novo
      const gens = J.sombras.filter(s => s.boss);
      if (gens.length >= maxGenerais()) {
        const velho = gens[0];
        J.sombras.splice(J.sombras.indexOf(velho), 1);
        const vs = sombras.find(x => x.boss && x.nome === velho.nome);
        if (vs) sombras.splice(sombras.indexOf(vs), 1);
      }
      nome = nomeGeneral(c.tipo);
      avisar(`[Sistema] Novo general: ${nome}`, 'Um boss juntou-se ao teu Exército das Sombras', '#8a6aff');
      desbloquear('general');
    } else if (J.sombras.filter(s => !s.boss).length >= max) continue;
    const s = { tipo: c.tipo, boss: c.boss, elite: c.elite, nome: nome || (c.elite ? 'Cavaleiro Sombrio' : null) };
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

function habRedemoinho() {
  const raio = S.alcance + 50;
  for (const e of inimigos) {
    if (e.morto || e.z > 20 || Math.hypot(e.x - J.x, e.y - J.y) > raio + e.r) continue;
    const { dano, crit } = rolarDano(1.6);
    const l = Math.hypot(e.x - J.x, e.y - J.y) || 1;
    danoInimigo(e, dano, crit, (e.x - J.x) / l * 1.5, (e.y - J.y) / l * 1.5, true);
  }
  ondas.push({ x: J.x, y: J.y, r: raio, t: 0.3, dur: 0.3, cor: '#ffe680' });
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; particulas.push({ x: J.x + Math.cos(a) * raio * 0.7, y: J.y + Math.sin(a) * raio * 0.7, vx: -Math.sin(a) * 200, vy: Math.cos(a) * 200, t: 0.3, cor: '#ffffff', tam: 4 }); }
  som(700, 0.2, 'triangle', 0.04, -400);
  return true;
}

function habInvestida() {
  const [ux, uy] = mira();
  let d = 0;
  while (d < 180 && !colideCirculo(mapa, J.x + ux * (d + 8), J.y + uy * (d + 8), J.r)) d += 8;
  const x0 = J.x, y0 = J.y;
  J.x += ux * d; J.y += uy * d;
  J.invuln = Math.max(J.invuln, 0.3);
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const px = e.x - x0, py = e.y - y0, proj = px * ux + py * uy;
    if (proj < -20 || proj > d + 30 || Math.abs(px * uy - py * ux) > 34 + e.r) continue;
    const { dano, crit } = rolarDano(1.8);
    danoInimigo(e, dano, crit, ux * 2.5, uy * 2.5, true);
    e.medo = Math.max(e.medo || 0, e.boss ? 0.4 : 1.2);
  }
  for (let k = 0; k <= d; k += 14) particulas.push({ x: x0 + ux * k, y: y0 + uy * k, vx: 0, vy: 0, t: 0.3, cor: '#ffae00', tam: 6 });
  revelar(mapa, J.x, J.y, 7);
  tremor = Math.max(tremor, 6);
  som(140, 0.3, 'square', 0.05, -60);
  return true;
}

function habMilCortes() {
  const a = alvoProximo(220);
  if (!a) { texto(J.x, J.y - 30, 'Nenhum monstro perto', '#aaaaaa', 13); return false; }
  const l = Math.hypot(a.x - J.x, a.y - J.y) || 1, ux = (a.x - J.x) / l, uy = (a.y - J.y) / l;
  const nx = a.x - ux * (a.r + J.r + 4), ny = a.y - uy * (a.r + J.r + 4);
  if (!colideCirculo(mapa, nx, ny, J.r)) { J.x = nx; J.y = ny; }
  J.invuln = Math.max(J.invuln, 0.6);
  J.milCortes = { alvo: a, n: 6, t: 0 }; // 6 golpes seguidos (ver atualizarCacador)
  return true;
}

function habParedeFogo() {
  const [ux, uy] = mira();
  for (let k = 1; k <= 6; k++) {
    const x = J.x + ux * k * 45, y = J.y + uy * k * 45;
    if (colideCirculo(mapa, x, y, 4)) break;
    projeteis.push({ x, y, vx: 0, vy: 0, r: 4, vida: 0.08 + k * 0.07, cor: '#ff7b25', tipo: 'fogo', dono: 'jogador', dano: Math.round(S.poder * 1.1), explode: 50, caindo: true });
  }
  som(200, 0.5, 'sawtooth', 0.05, -100);
  return true;
}

function habSupernova() {
  const raio = 210;
  ondas.push({ x: J.x, y: J.y, r: raio, t: 0.6, dur: 0.6, cor: '#ffe14d' });
  explosao(J.x, J.y, '#ff7b25', 60, 400, 7);
  for (const e of inimigos) {
    if (e.morto || Math.hypot(e.x - J.x, e.y - J.y) > raio + e.r) continue;
    const l = Math.hypot(e.x - J.x, e.y - J.y) || 1;
    danoInimigo(e, Math.round(S.poder * 2.2), false, (e.x - J.x) / l * 2, (e.y - J.y) / l * 2);
    e.queima = 4; e.queimaDps = Math.max(1, S.poder * 0.3);
  }
  tremor = Math.max(tremor, 16);
  som(50, 1, 'sawtooth', 0.07, -20);
  return true;
}

function habRugido() {
  for (const e of inimigos) if (!e.morto && Math.hypot(e.x - J.x, e.y - J.y) < 220) e.medo = e.boss ? 0.8 : 2;
  J.furia = 6;
  S = stats();
  ondas.push({ x: J.x, y: J.y, r: 220, t: 0.5, dur: 0.5, cor: '#ffffff' });
  texto(J.x, J.y - 40, 'RUGIDO!', '#ffffff', 20);
  tremor = Math.max(tremor, 10);
  som(70, 0.7, 'sawtooth', 0.07, 40);
  return true;
}

function habGrito() {
  J.grito = 6;
  ondas.push({ x: J.x, y: J.y, r: 120, t: 0.5, dur: 0.5, cor: '#c0a060' });
  texto(J.x, J.y - 40, 'GRITO DE GUERRA', '#c0a060', 16);
  som(110, 0.5, 'square', 0.06, 30);
  return true;
}

function habBarreira() {
  J.barreira = Math.round(S.maxHp * 0.25);
  J.barreiraT = 8;
  ondas.push({ x: J.x, y: J.y, r: 50, t: 0.5, dur: 0.5, cor: '#fff0a0' });
  fanfarra([784, 988, 1175], 0.03);
  return true;
}

function habJulgamento() {
  const alvos = inimigos.filter(e => !e.morto && Math.hypot(e.x - J.x, e.y - J.y) < 320)
    .sort((a, b) => Math.hypot(a.x - J.x, a.y - J.y) - Math.hypot(b.x - J.x, b.y - J.y)).slice(0, 4);
  if (!alvos.length) { texto(J.x, J.y - 30, 'Nenhum monstro perto', '#aaaaaa', 13); return false; }
  for (const e of alvos) {
    danoInimigo(e, Math.round(S.poder * 1.6 * (MORTOS_VIVOS.includes(e.tipo) ? 2 : 1)), false, 0, 0);
    raios.push({ x1: e.x, y1: e.y - 220, x2: e.x, y2: e.y, t: 0.3 });
    explosao(e.x, e.y, '#fff6a0', 14, 160, 4);
  }
  som(1200, 0.3, 'triangle', 0.05, -500);
  return true;
}

function habTornado() {
  const [ux, uy] = mira();
  const { dano } = rolarDano(0.9);
  projeteis.push({ x: J.x + ux * 20, y: J.y + uy * 20, vx: ux * 170, vy: uy * 170, r: 20, vida: 2.2, cor: '#9fdcff',
    tipo: 'lamina', dono: 'jogador', dano, perfura: 30, atingidos: [] });
  som(500, 0.6, 'sine', 0.04, -300);
  return true;
}

function atualizarCacador(dt) {
  if (!J.cdHab) J.cdHab = {};
  for (const k in J.cdHab) J.cdHab[k] -= dt;
  for (let i = 0; i < habsJ().length; i++) if (premiu(String(5 + i))) usarHabilidade(i);
  if (premiu('u')) abrirStatus();
  if (J.furtivo > 0) J.furtivo -= dt;
  if (J.milCortes) { // Mil Cortes: um golpe a cada 0.07 s
    const M = J.milCortes;
    M.t -= dt;
    if (M.t <= 0) {
      M.t = 0.07; M.n--;
      if (!M.alvo.morto) {
        const { dano, crit } = rolarDano(0.7);
        danoInimigo(M.alvo, dano, crit, 0, 0, true);
        particulas.push({ x: M.alvo.x + rand(-14, 14), y: M.alvo.y + rand(-14, 14), vx: rand(-200, 200), vy: rand(-200, 200), t: 0.2, cor: '#fff6a0', tam: 5 });
        som(1500 + M.n * 80, 0.04, 'sawtooth', 0.02, -900);
      }
      if (M.n <= 0 || M.alvo.morto) J.milCortes = null;
    }
  }
  if (J.grito > 0) J.grito -= dt;
  if (J.furia > 0) { J.furia -= dt; if (J.furia <= 0) S = stats(); }
  if (J.barreiraT > 0) { J.barreiraT -= dt; if (J.barreiraT <= 0) J.barreira = 0; }
  if (J.remoto) return; // o exército e os corpos são do herói principal
  for (const c of cadaveres) c.t -= dt;
  cadaveres = cadaveres.filter(c => c.t > 0);
  atualizarSombras(dt);
}

const temErgue = () => habsJ().some(h => h.id === 'ergue' && temHabilidade(h));

// Novas habilidades e pontos ao subir de nível
function aoSubirNivelCacador() {
  if (J.remoto) { subirNivelParceiro(); return; } // o herói do parceiro (a jogar a 2)
  verificarProvacao();
  J.pontos = (J.pontos || 0) + PONTOS_POR_NIVEL;
  const h = habsJ().find(x => x.nivel === J.nivel);
  if (h) avisar(`[Sistema] Nova habilidade: ${h.nome}`, `${modoToque ? 'Novo botão' : `Tecla ${5 + habsJ().indexOf(h)}`} · ${h.desc}`, '#4dc3ff');
  else if (J.nivel === 2) avisar('[Sistema] Tens pontos de atributo', `Abre a Janela de Estado (${modoToque ? 'botão do herói' : 'tecla U'}) para os usar`, '#4dc3ff');
}

// ---------------------------------------------------------------------
//  Exército das Sombras
// ---------------------------------------------------------------------
let cadaveres = [], sombras = [];
const maxSombras = () => Math.min(10, 2 + Math.floor(J.nivel / 8)) + extraSombras();
// Generais: bosses erguidos, com nome próprio (mais com o nível e com o Monarca das Sombras)
const maxGenerais = () => Math.min(5, 1 + Math.floor(J.nivel / 15) + (J.evoluido ? 1 : 0));
const NOMES_GENERAIS = {
  reiSlime: 'Gelatinoso', lich: 'Arquimago Negro', dragao: 'Asa da Noite', golem: 'Rocha Eterna',
  rainha: 'Rainha Tecelã', demonio: 'Chifre Negro', guardiao: 'Guarda Cristalino', senhorVazio: 'Eco do Vazio',
};
function nomeGeneral(tipo) {
  const base = NOMES_GENERAIS[tipo] || 'General Sombrio';
  const n = J.sombras.filter(s => s.nome && s.nome.startsWith(base)).length;
  return n ? `${base} ${['II', 'III', 'IV', 'V'][Math.min(3, n - 1)]}` : base;
}

function deixarCadaver(e) {
  if (!J || !temErgue() || e.mini) return;
  if (!SPR[e.tipo]) return;
  cadaveres.push({ tipo: e.tipo, boss: !!e.boss, elite: !!e.elite, x: e.x, y: e.y, t: e.boss ? 20 : 8 });
  if (cadaveres.length > 30) cadaveres.shift();
}

function criarSombra(s, x, y) {
  const r = s.boss ? 22 : Math.min(15, (INIMIGOS[s.tipo] || { r: 12 }).r);
  return { tipo: s.tipo, boss: s.boss, elite: s.elite, nome: s.nome, x, y, r, t: Math.random() * 6, cd: 0.5, dir: 1, ang: Math.random() * Math.PI * 2 };
}

// No início de cada andar o exército aparece à tua volta
function levantarExercito() {
  cadaveres = [];
  if (J.classe !== 'sombras') J.sombras = []; // o exército é só do Caçador das Sombras
  sombras = (J.sombras || []).map((s, i) => {
    const a = i / Math.max(1, J.sombras.length) * Math.PI * 2;
    let x = J.x + Math.cos(a) * 40, y = J.y + Math.sin(a) * 40;
    if (colideCirculo(mapa, x, y, 10)) { x = J.x; y = J.y; }
    return criarSombra(s, x, y);
  });
}

const danoSombra = s => Math.max(1, Math.round(S.dano * (s.boss ? 0.6 : s.elite ? 0.25 : 0.15) * (1 + 0.01 * J.nivel) * bonusSombras()));

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

// Nome por cima dos generais e cavaleiros (desenhado no ecrã)
function desenharNomesSombras() {
  for (const s of sombras) {
    if (!s.nome || !explorado(s.x, s.y)) continue;
    textoCentro(s.nome, ecraX(s.x), ecraY(s.y) - (s.boss ? 34 : 24) * ZOOM, s.boss ? 11 : 9, s.boss ? '#b48cff' : '#8a7fb8', false);
  }
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
  if (J.classe !== 'sombras') return 0;
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
  tutorialEvento('status');
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

// Janela azul do [Sistema]: a mesma moldura de todas as janelas, com as cores do Sistema
function janelaSistema(x, y, w, h) {
  painel(x, y, w, h, 'rgba(6,20,40,0.94)', '#4dc3ff');
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
  textoEsq(`Andar ${andar} · Rank do andar ${rp.letra} · recomendado ${rec}`, 250, 152, 14, '#9fdcff', 'normal');
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
  if (!habsJ().length) textoEsq('Este caçador não tem habilidades extra', 520, 280, 12, '#889', 'normal');
  habsJ().forEach((h, i) => {
    const y = 268 + i * 62, tem = temHabilidade(h);
    ctx.globalAlpha = tem ? 1 : 0.45;
    circuloEcra(538, y + 8, 16, 'rgba(10,30,60,0.9)', h.cor, 3);
    textoCentro(`${5 + i}`, 538, y + 9, 14, '#fff');
    textoEsq(`${h.nome}`, 564, y, 15, tem ? h.cor : '#889');
    textoDir(tem ? `Mana ${h.mana} · ${h.cd}s` : `Nível ${h.nivel}`, 904, y, 11, tem ? '#9fdcff' : '#ff8080');
    textoEsq(h.desc, 564, y + 20, 10, '#bcd', 'normal');
    ctx.globalAlpha = 1;
  });
  // exército (só o Caçador das Sombras)
  janelaSistema(40, 538, 880, 64);
  if (J.classe !== 'sombras') {
    const CL = classeJ();
    textoEsq(`CAÇADOR: ${CL.nome}`, 60, 556, 14, CL.cor);
    textoEsq(`Passiva: ${CL.passiva}`, 60, 580, 12, '#7dff9a', 'normal');
    if (CL.hab) textoDir(`F: ${CL.habNome}`, 904, 556, 13, '#ffe680');
    textoCentro(modoToque ? 'Toca fora dos botões para voltar' : 'U / Esc para voltar', LARGURA / 2, ALTURA - 14, 12, '#667', false);
    return;
  }
  const n = (J.sombras || []).length;
  textoEsq('EXÉRCITO DAS SOMBRAS', 60, 556, 14, '#9fdcff');
  textoDir(temErgue() ? `${J.sombras.filter(s => !s.boss).length} / ${maxSombras()} soldados · ${J.sombras.filter(s => s.boss).length} / ${maxGenerais()} generais` : `Desbloqueia no nível ${habsJ()[0].nivel}`, 904, 556, 13, '#b48cff');
  (J.sombras || []).slice(0, 22).forEach((s, i) => {
    const c = spriteSombra(s), esc = Math.max(1, Math.floor(26 / Math.max(c.width, c.height)));
    sprEcra(c, 72 + i * 38, 584, Math.min(2, esc));
  });
  if (!n && temErgue()) textoEsq('Mata monstros e usa "Ergue-te!" (tecla 5) perto dos corpos', 60, 584, 12, '#889', 'normal');
  textoCentro(modoToque ? 'Toca fora dos botões para voltar' : 'U / Esc para voltar', LARGURA / 2, ALTURA - 14, 12, '#667', false);
}

// Botões de toque das habilidades (segunda fila, por cima dos feitiços)
function botoesHabilidadeToque() {
  const y = feiticosJ().some(f => J.feiticos[f]) ? 532 : 598; // sem magias ficam na fila de baixo
  return habsJ().map((h, i) => ({ id: 'h' + i, x: 436 + i * 66, y, r: 26, tecla: String(5 + i), hab: i, ancora: [535, ALTURA] }));
}
