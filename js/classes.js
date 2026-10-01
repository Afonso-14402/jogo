'use strict';
// =====================================================================
//  CAÇADORES: personagens jogáveis, cada um com a sua arma e uma
//  habilidade única (tecla F / botão ★ no telemóvel).
//  Inspirados nos arquétipos de manhwas de caçadores (o necromante das
//  sombras, a espadachim que dança, o mago do fogo, o homem-tigre, o
//  colosso, o curandeiro e o mestre das espadas gémeas), com nomes próprios.
// =====================================================================

const CLASSES = {
  aventureiro: { nome: 'Aventureiro', cor: '#ddd', arma: null, icone: 'Espada de Treino',
    hab: null, habNome: '—', habDesc: 'Sem habilidade especial', passiva: '+10% XP', xp: 0.1,
    feit: ['fogo', 'raio', 'gelo'], habs: ['redemoinho', 'investida'] },
  sombras: { nome: 'Caçador das Sombras', cor: '#8a6aff', arma: 'Presa Venenosa',
    hab: 'troca', habNome: 'Passo Sombrio', habDesc: 'Trocas de lugar com a tua sombra mais longe e o exército fica +50% mais forte',
    passiva: '"Serve-me!" desde o nível 1 e +2 sombras', mana: 20, cd: 10,
    feit: [], habs: ['ergue', 'sede', 'mao', 'furtivo'] },
  espada: { nome: 'Dançarina da Espada', cor: '#ffd23f', arma: 'Espada Celeste',
    hab: 'danca', habNome: 'Dança da Espada', habDesc: 'Atravessa os monstros num relâmpago e corta todos pelo caminho (dano x3)',
    passiva: '+15% vel. de ataque e +5% crítico', mana: 15, cd: 6, velAtaque: 0.15, crit: 0.05,
    feit: [], habs: ['milCortes', 'redemoinho', 'investida'] },
  fogo: { nome: 'Imperador das Chamas', cor: '#ff5a1a', arma: 'Cajado Flamejante',
    hab: 'meteoros', habNome: 'Chuva de Meteoros', habDesc: 'Faz cair meteoros de fogo à volta do alvo',
    passiva: '+60% poder mágico e Bola de Fogo nível 2', mana: 35, cd: 12, magia: 0.6,
    feit: ['fogo', 'raio'], habs: ['paredeFogo', 'supernova'] },
  besta: { nome: 'Garra Selvagem', cor: '#f0f0f0', arma: 'Garras de Tigre',
    hab: 'forma', habNome: 'Forma Bestial', habDesc: 'Transformas-te em fera durante 8 s: +50% dano, +30% velocidade e roubo de vida',
    passiva: '+40 vida', mana: 20, cd: 20, hp: 40,
    feit: [], habs: ['rugido', 'investida', 'redemoinho'] },
  titan: { nome: 'Colosso', cor: '#c0a060', arma: 'Manoplas do Titã',
    hab: 'punho', habNome: 'Punho do Titã', habDesc: 'Esmaga o chão: atordoa tudo à volta e levas -50% dano durante 4 s',
    passiva: '+60 vida e +6 defesa, -10% velocidade', mana: 25, cd: 14, hp: 60, def: 6, vel: -0.1,
    feit: [], habs: ['investida', 'grito', 'onda'] },
  cura: { nome: 'Curandeiro Supremo', cor: '#5dff7a', arma: 'Bastão Sagrado',
    hab: 'luz', habNome: 'Luz Sagrada', habDesc: 'Cura 30% da vida, tira o veneno e queima os monstros à volta (x2 em mortos-vivos)',
    passiva: '+2 vida/s, poções +15% e +30% poder mágico', mana: 30, cd: 18, regen: 2, cura: 0.15, magia: 0.3,
    feit: ['cura', 'raio'], habs: ['barreira', 'julgamento'] },
  vento: { nome: 'Mestre das Lâminas', cor: '#9fdcff', arma: 'Espadas Gémeas do Vento',
    hab: 'corte', habNome: 'Corte do Vento', habDesc: 'Lança um leque de lâminas de vento que atravessam os monstros',
    passiva: '+15% velocidade', mana: 12, cd: 5, vel: 0.15,
    feit: [], habs: ['redemoinho', 'tornado', 'furtivo'] },
  arqueiro: { nome: 'Arqueira Lunar', cor: '#c8b4ff', arma: 'Arco Lunar',
    hab: 'chuvaFlechas', habNome: 'Chuva de Flechas', habDesc: 'Uma chuva de flechas cai do céu sobre o alvo e à volta dele',
    passiva: '+20% alcance, +8% crítico e as flechas atravessam mais 1 monstro', mana: 25, cd: 10, crit: 0.08, alcance: 0.2,
    feit: ['gelo'], habs: ['leque', 'explosiva', 'recuo'] },
  // o único que mexe no tempo: para-o, acelera-o e volta atrás
  cronos: { nome: 'Guardião do Tempo', cor: '#7df9ff', arma: 'Cetro das Horas', unico: true,
    hab: 'parar', habNome: 'Parar o Tempo', habDesc: 'O tempo para durante 3 s: os monstros e os tiros ficam gelados e levam +50% dano',
    passiva: '+20% vel. de ataque, +5% crítico e recargas 15% mais rápidas', mana: 35, cd: 18, velAtaque: 0.2, crit: 0.05,
    feit: ['gelo'], habs: ['acelerar', 'rebobinar', 'tornado'] },
};
const ORDEM_CLASSES = ['aventureiro', 'sombras', 'espada', 'fogo', 'besta', 'titan', 'cura', 'vento', 'arqueiro', 'cronos'];

// Mudança de classe (nível 30 + Provação): novo nome, passiva mais forte e habilidade única melhorada
const EVOLUCOES = {
  aventureiro: { nome: 'Herói Lendário', xp: 0.2, hp: 60, hab: 'heroi', habNome: 'Golpe Heróico', habDesc: 'Um corte enorme em leque à tua frente (dano x4)',
    passiva: '+20% XP e +60 vida', mana: 20, cd: 8 },
  sombras: { nome: 'Senhor da Legião', cd: 5, passiva: '+7 sombras e as sombras fazem +40% dano', habDesc: 'Trocas de lugar com a tua sombra mais longe (recarga 5 s)' },
  espada: { nome: 'Espada Santa', velAtaque: 0.25, crit: 0.12, passiva: '+25% vel. de ataque e +12% crítico', habDesc: 'Atravessa os monstros num relâmpago (dano x5)' },
  fogo: { nome: 'Fénix Eterna', magia: 1.0, passiva: '+100% poder mágico', habDesc: 'Uma chuva de 14 meteoros de fogo' },
  besta: { nome: 'Rei das Feras', hp: 120, passiva: '+120 vida', habDesc: 'Forma de fera durante 14 s: +50% dano, +30% velocidade e roubo de vida' },
  titan: { nome: 'Rei Titã', hp: 160, def: 12, passiva: '+160 vida e +12 defesa, -10% velocidade', habDesc: 'Esmaga o chão num raio enorme e levas -50% dano durante 4 s' },
  cura: { nome: 'Santo', regen: 4, cura: 0.2, magia: 0.5, passiva: '+4 vida/s, poções +20% e +50% poder mágico', habDesc: 'Cura 40% da vida e queima os monstros à volta (x2 em mortos-vivos)' },
  vento: { nome: 'Senhor da Tempestade', vel: 0.25, passiva: '+25% velocidade', habDesc: 'Um leque de 9 lâminas de vento' },
  arqueiro: { nome: 'Caçadora de Estrelas', crit: 0.15, alcance: 0.35, cd: 8, passiva: '+35% alcance, +15% crítico e as flechas atravessam mais 2 monstros', habDesc: 'Uma chuva enorme de flechas cai sobre o alvo' },
  cronos: { nome: 'Senhor do Tempo', velAtaque: 0.3, crit: 0.1, cd: 14, passiva: '+30% vel. de ataque, +10% crítico e recargas 15% mais rápidas', habDesc: 'O tempo para durante 5 s em toda a sala' },
};
const cacheClasseEvo = {};
function classeJ() {
  const id = (J && J.classe) || 'aventureiro', base = CLASSES[id] || CLASSES.aventureiro;
  if (!J || !J.evoluido) return base;
  return cacheClasseEvo[id] || (cacheClasseEvo[id] = Object.assign({}, base, EVOLUCOES[id], { base: base.nome }));
}
const MORTOS_VIVOS = ['esqueleto', 'zumbi', 'fantasma', 'mumia', 'necromante', 'lich', 'sombra'];

// Bónus passivos do caçador (entram nos stats)
function bonusClasse() {
  const C = classeJ(), b = { hp: C.hp || 0, def: C.def || 0, velAtaque: C.velAtaque || 0, crit: C.crit || 0, magia: C.magia || 0,
    vel: C.vel || 0, regen: C.regen || 0, cura: C.cura || 0, xp: C.xp || 0, alcance: C.alcance || 0, danoPct: 0, roubo: 0 };
  if (J.formaBestial > 0) { b.danoPct += 0.5; b.vel += 0.3; b.roubo += 0.05; }
  if (J.furia > 0) b.danoPct += 0.25;
  if (J.acelerado > 0) { b.velAtaque += 0.5; b.vel += 0.35; } // Acelerar (Guardião do Tempo)
  return b;
}

// Ao começar a partida
function aplicarClasseInicial() {
  const C = classeJ();
  if (C.arma) J.arma = criarItem(ITENS.find(i => i.nome === C.arma), 1, true);
  // só sabes as magias do teu caçador: a primeira já vem aprendida
  J.feiticos = {};
  if (C.feit.length) J.feiticos[C.feit[0]] = J.classe === 'fogo' ? 2 : 1;
  if (nMeta('feitico') && C.feit.includes('raio')) J.feiticos.raio = Math.max(1, J.feiticos.raio || 0);
}

function usarHabilidadeClasse() {
  const C = classeJ();
  if (!C.hab) return;
  if ((J.cdClasse || 0) > 0) return;
  if (J.mana < C.mana) { texto(J.x, J.y - 30, 'Sem mana!', '#b48cff', 15); som(150, 0.1, 'square', 0.03); return; }
  const feito = ({ troca: habTroca, danca: habDanca, meteoros: habMeteoros, forma: habForma, punho: habPunho, luz: habLuz, corte: habCorte, heroi: habHeroi, parar: habParar, chuvaFlechas: habChuvaFlechas })[C.hab]();
  if (!feito) return;
  J.mana -= C.mana;
  J.cdClasse = C.cd * (temRel('relogio') ? 0.7 : 1) * fatorRecarga();
  registar('feitico');
}

function atualizarClasse(dt) {
  if (J.cdClasse > 0) J.cdClasse -= dt;
  if (J.formaBestial > 0) {
    J.formaBestial -= dt;
    if (Math.random() < 0.3) particulas.push({ x: J.x + rand(-10, 10), y: J.y + rand(-12, 8), vx: 0, vy: -30, t: 0.4, cor: '#ffffff', tam: 3 });
  }
  if (J.escudoTitan > 0) J.escudoTitan -= dt;
  if (J.buffSombras > 0) J.buffSombras -= dt;
  if (J.acelerado > 0) {
    J.acelerado -= dt;
    if (Math.random() < 0.4) particulas.push({ x: J.x + rand(-8, 8), y: J.y + rand(-10, 8), vx: -J.dirX * 90, vy: -J.dirY * 90, t: 0.3, cor: '#7df9ff', tam: 3 });
    if (J.acelerado <= 0) S = stats();
  }
  if (J.classe === 'cronos') lembrarPassado(dt);
  if (tempoParado > 0) tempoParado -= dt;
  if (premiu('f')) usarHabilidadeClasse();
}

// Ponto à frente do herói (para onde aponta ou para o monstro mais perto)
function pontoAlvo(dist) {
  const [ux, uy] = mira();
  const a = alvoProximo(dist + 60);
  return a ? { x: a.x, y: a.y, ux, uy } : { x: J.x + ux * dist, y: J.y + uy * dist, ux, uy };
}

function habTroca() {
  if (!sombras.length) { texto(J.x, J.y - 30, 'Não tens sombras', '#aaaaaa', 13); return false; }
  let s = null, md = -1; // a sombra mais longe onde o herói cabe (nunca dentro de uma parede)
  for (const x of sombras) { const d = Math.hypot(x.x - J.x, x.y - J.y); if (d > md && !colideCirculo(mapa, x.x, x.y, J.r)) { md = d; s = x; } }
  if (!s) { texto(J.x, J.y - 30, 'Não há espaço', '#aaaaaa', 13); return false; }
  const px = J.x, py = J.y;
  explosao(J.x, J.y, '#6a4aff', 20, 180, 5);
  J.x = s.x; J.y = s.y; s.x = px; s.y = py;
  explosao(J.x, J.y, '#6a4aff', 20, 180, 5);
  J.invuln = Math.max(J.invuln, 0.5);
  J.buffSombras = 5;
  revelar(mapa, J.x, J.y, 7);
  texto(J.x, J.y - 40, 'PASSO SOMBRIO', '#8a6aff', 16);
  som(200, 0.4, 'sine', 0.05, 600);
  return true;
}

function habDanca() {
  const [ux, uy] = mira();
  let d = 0;
  while (d < 240 && !colideCirculo(mapa, J.x + ux * (d + 8), J.y + uy * (d + 8), J.r)) d += 8;
  const x0 = J.x, y0 = J.y;
  for (let k = 0; k <= d; k += 12) particulas.push({ x: x0 + ux * k, y: y0 + uy * k, vx: 0, vy: 0, t: 0.35, cor: '#ffe680', tam: 8 });
  J.x += ux * d; J.y += uy * d;
  J.invuln = Math.max(J.invuln, 0.35);
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const px = e.x - x0, py = e.y - y0, proj = px * ux + py * uy;
    if (proj < -20 || proj > d + 20 || Math.abs(px * uy - py * ux) > 40 + e.r) continue;
    const { dano, crit } = rolarDano(J.evoluido ? 5 : 3);
    danoInimigo(e, dano, crit, ux, uy, true);
  }
  revelar(mapa, J.x, J.y, 7);
  som(1400, 0.15, 'sawtooth', 0.04, -1200);
  tremor = Math.max(tremor, 4);
  return true;
}

// Meteoros e flechas que caem: projéteis do herói parados que explodem
function chuvaDeFogo(cx, cy, n, raio, dano, explode, cor, tipo) {
  for (let k = 0; k < n; k++) {
    const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * raio;
    projeteis.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: 0, vy: 0, r: 4, vida: 0.25 + k * 0.1, cor,
      tipo, dono: 'jogador', dano, explode, caindo: true });
  }
}

function habMeteoros() {
  const p = pontoAlvo(170);
  chuvaDeFogo(p.x, p.y, J.evoluido ? 14 : 8, J.evoluido ? 190 : 150, Math.round(S.poder * 1.3), 70, '#ff5a1a', 'fogo');
  texto(J.x, J.y - 40, 'CHUVA DE METEOROS', '#ff5a1a', 16);
  som(90, 0.8, 'sawtooth', 0.05, -30);
  return true;
}

function habForma() {
  J.formaBestial = J.evoluido ? 14 : 8;
  S = stats();
  explosao(J.x, J.y, '#ffffff', 30, 220, 6);
  texto(J.x, J.y - 40, 'FORMA BESTIAL', '#ffffff', 18);
  som(80, 0.6, 'sawtooth', 0.06, 120);
  tremor = Math.max(tremor, 6);
  return true;
}

function habPunho() {
  for (const e of inimigos) {
    if (e.morto || e.z > 20 || Math.hypot(e.x - J.x, e.y - J.y) > (J.evoluido ? 280 : 200) + e.r) continue;
    const { dano, crit } = rolarDano(2.5);
    const l = Math.hypot(e.x - J.x, e.y - J.y) || 1;
    danoInimigo(e, dano, crit, (e.x - J.x) / l * 2, (e.y - J.y) / l * 2, true);
    e.medo = Math.max(e.medo || 0, e.boss ? 0.6 : 1.5);
  }
  J.escudoTitan = 4;
  ondas.push({ x: J.x, y: J.y, r: J.evoluido ? 280 : 200, t: 0.5, dur: 0.5, cor: '#c0a060' });
  tocarRachada(J.x, J.y, 200);
  tremor = Math.max(tremor, 14);
  som(50, 0.6, 'square', 0.07, -20);
  return true;
}

function habLuz() {
  const q = Math.round(S.maxHp * (J.evoluido ? 0.4 : 0.3));
  J.hp = Math.min(S.maxHp, J.hp + q);
  J.veneno = 0;
  texto(J.x, J.y - 40, `+${q}`, '#5dff7a', 20);
  for (const e of inimigos) {
    if (e.morto || Math.hypot(e.x - J.x, e.y - J.y) > 180 + e.r) continue;
    danoInimigo(e, Math.round(S.poder * 1.5 * (MORTOS_VIVOS.includes(e.tipo) ? 2 : 1)), false, 0, 0);
  }
  ondas.push({ x: J.x, y: J.y, r: 180, t: 0.6, dur: 0.6, cor: '#fff6a0' });
  fanfarra([659, 880, 1175], 0.04);
  return true;
}

function habCorte() {
  const [ux, uy] = mira();
  const base = Math.atan2(uy, ux);
  const { dano } = rolarDano(1.2);
  for (const a of J.evoluido ? [-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6] : [-0.36, -0.18, 0, 0.18, 0.36]) {
    projeteis.push({ x: J.x, y: J.y, vx: Math.cos(base + a) * 480, vy: Math.sin(base + a) * 480, r: 9, vida: 0.7, cor: '#9fdcff',
      tipo: 'lamina', dono: 'jogador', dano, perfura: 3, atingidos: [] });
  }
  som(900, 0.2, 'triangle', 0.04, -600);
  return true;
}

// ---------------------------------------------------------------------
//  Arqueira Lunar
// ---------------------------------------------------------------------
// Flechas a mais que atravessam os monstros (passiva)
const perfuraClasse = () => (J.classe === 'arqueiro' ? (J.evoluido ? 2 : 1) : 0);

function habChuvaFlechas() {
  const p = pontoAlvo(200);
  chuvaDeFogo(p.x, p.y, J.evoluido ? 18 : 11, J.evoluido ? 170 : 120, rolarDano(1.2).dano, 42, '#c8b4ff', 'flecha');
  texto(J.x, J.y - 40, 'CHUVA DE FLECHAS', '#c8b4ff', 16);
  som(1200, 0.5, 'triangle', 0.04, -900);
  return true;
}

// ---------------------------------------------------------------------
//  Guardião do Tempo
// ---------------------------------------------------------------------
let tempoParado = 0; // para o ecrã ficar azulado enquanto o tempo está parado
const fatorRecarga = () => (J.classe === 'cronos' ? 0.85 : 1);

// Parar o Tempo: os monstros (e os tiros deles) ficam parados e levam +50% dano
function habParar() {
  const dur = J.evoluido ? 5 : 3, raio = J.evoluido ? 2000 : 520;
  let n = 0;
  for (const e of inimigos) {
    if (e.morto || Math.hypot(e.x - J.x, e.y - J.y) > raio) continue;
    e.parado = e.boss ? dur * 0.4 : dur; // os bosses resistem mais
    n++;
  }
  for (const p of projeteis) if (p.dono !== 'jogador' && Math.hypot(p.x - J.x, p.y - J.y) < raio) p.parado = dur;
  tempoParado = dur;
  ondas.push({ x: J.x, y: J.y, r: Math.min(raio, 520), t: 0.6, dur: 0.6, cor: '#7df9ff' });
  texto(J.x, J.y - 40, 'O TEMPO PAROU', '#7df9ff', 20);
  som(1600, 0.8, 'sine', 0.05, -1400);
  fanfarra([1046, 784, 523], 0.03);
  return true;
}

// Rebobinar: guarda onde estavas e a vida que tinhas nos últimos 3 segundos
function lembrarPassado(dt) {
  J.passadoT = (J.passadoT || 0) - dt;
  if (J.passadoT > 0) return;
  J.passadoT = 0.1;
  if (!J.passado) J.passado = [];
  J.passado.push({ x: J.x, y: J.y, hp: J.hp, mana: J.mana, mapa });
  if (J.passado.length > 30) J.passado.shift();
}

// ---------------------------------------------------------------------
// Golpe Heróico (Herói Lendário): leque grande à frente
function habHeroi() {
  const [ux, uy] = mira(), base = Math.atan2(uy, ux);
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const d = Math.hypot(e.x - J.x, e.y - J.y);
    let da = Math.abs(Math.atan2(e.y - J.y, e.x - J.x) - base); if (da > Math.PI) da = Math.PI * 2 - da;
    if (d > 170 + e.r || da > 0.9) continue;
    const { dano, crit } = rolarDano(4);
    danoInimigo(e, dano, crit, ux * 2, uy * 2, true);
  }
  for (let k = -6; k <= 6; k++) { const a = base + k * 0.14; particulas.push({ x: J.x + Math.cos(a) * 60, y: J.y + Math.sin(a) * 60, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, t: 0.35, cor: '#ffe680', tam: 6 }); }
  tremor = Math.max(tremor, 8);
  som(300, 0.4, 'sawtooth', 0.05, 600);
  return true;
}

// ---------------------------------------------------------------------
//  Provação da mudança de classe
// ---------------------------------------------------------------------
function verificarProvacao() {
  if (J.nivel >= 30 && !J.evoluido && !J.provacao) {
    J.provacao = 'pendente';
    avisar('[Destino] Missão de Mudança de Classe', 'O próximo andar é a tua Provação. Vence-a para evoluir!', '#4dc3ff');
  }
}
// Chamado pelo proximoAndar: o andar da provação é uma arena com um boss
function andarProvacao() {
  if (J.provacao !== 'pendente' && J.provacao !== 'ativa') return false;
  J.provacao = 'ativa';
  mapa = gerarArenaBoss();
  mapa.provacao = true;
  return true;
}
function bossProvacao() {
  const b = criarBoss(escolher(BOSSES.slice(0, Math.min(BOSSES.length, 2 + Math.floor(andar / 8)))).id, 1.3);
  b.nome = `Provação: ${b.nome}`; // traduz-se ao desenhar (a jogar a 2, cada um na sua língua)
  return b;
}
function concluirProvacao() {
  J.provacao = 'feita';
  J.evoluido = true;
  S = stats();
  J.hp = S.maxHp;
  const C = classeJ();
  mostrarBanner('MUDANÇA DE CLASSE!', `${C.base} → ${C.nome}`, C.cor);
  avisar(`[Destino] Agora és ${C.nome}`, C.passiva, '#4dc3ff');
  desbloquear('evolucao');
  explosao(J.x, J.y, C.cor, 60, 320, 7);
  fanfarra([392, 523, 659, 784, 1046, 1318, 1568], 0.06);
}

// Dano que levas com o Punho do Titã ativo
const reducaoClasse = () => (J.escudoTitan > 0 ? 0.5 : 1) * (J.grito > 0 ? 0.6 : 1);
// Magias que o caçador pode usar (teclas 1 a 4, pela ordem da lista)
const feiticosJ = () => classeJ().feit || [];
// As sombras ficam mais fortes depois do Passo Sombrio
const bonusSombras = () => (J.buffSombras > 0 ? 1.5 : 1) * (J.evoluido && J.classe === 'sombras' ? 1.4 : 1);
// O Caçador das Sombras tem o "Serve-me!" desde o início e mais sombras
const extraSombras = () => (J.classe === 'sombras' ? (J.evoluido ? 7 : 2) : 0);

// Botão de toque da habilidade de classe
function botaoClasseToque() {
  return { id: 'classe', x: 772, y: 400, r: 30, tecla: 'f', ancora: [LARGURA, ALTURA], lado: true };
}

// Desenho no ecrã de criação: cartão de um caçador
function desenharCartaoClasse(r, id, sel) {
  const C = CLASSES[id];
  painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? C.cor : dentro(r) ? '#ffffff' : '#3a3150');
  const arma = ITENS.find(i => i.nome === (C.arma || C.icone));
  if (arma) desenharIcone(arma, r.x + 34, r.y + r.h / 2, 40);
  // o texto encolhe para caber no cartão
  const k = r.h / 110, larg = r.w - 72; // cartões mais baixos quando há muitos caçadores
  textoEsqAjustado(C.nome, r.x + 64, r.y + 20 * k, 14, C.cor, larg);
  const h = C.hab ? `F: ${C.habNome}` : 'Sem habilidade';
  textoEsqAjustado(h, r.x + 64, r.y + 42 * k, 11, '#ffe680', larg, 'normal');
  textoEsqAjustado(C.passiva, r.x + 64, r.y + 62 * k, 10, '#7dff9a', larg, 'normal');
  if (C.arma) textoEsqAjustado(C.arma, r.x + 64, r.y + 86 * k, 10, '#aaa', larg - (C.unico ? 50 : 0), 'normal');
  if (C.unico) { // caçador único: etiqueta a brilhar (em baixo, para não tapar o nome)
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(performance.now() / 250);
    textoDir('ÚNICO', r.x + r.w - 8, r.y + 86 * k, 9, C.cor);
    ctx.globalAlpha = 1;
  }
}
