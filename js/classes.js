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
    hab: null, habNome: '—', habDesc: 'Sem habilidade especial', passiva: '+10% XP', xp: 0.1 },
  sombras: { nome: 'Caçador das Sombras', cor: '#8a6aff', arma: 'Presa Venenosa',
    hab: 'troca', habNome: 'Troca de Sombra', habDesc: 'Trocas de lugar com a tua sombra mais longe e o exército fica +50% mais forte',
    passiva: '"Ergue-te!" desde o nível 1 e +2 sombras', mana: 20, cd: 10 },
  espada: { nome: 'Dançarina da Espada', cor: '#ffd23f', arma: 'Espada Celeste',
    hab: 'danca', habNome: 'Dança da Espada', habDesc: 'Atravessa os monstros num relâmpago e corta todos pelo caminho (dano x3)',
    passiva: '+15% vel. de ataque e +5% crítico', mana: 15, cd: 6, velAtaque: 0.15, crit: 0.05 },
  fogo: { nome: 'Imperador das Chamas', cor: '#ff5a1a', arma: 'Cajado Flamejante',
    hab: 'meteoros', habNome: 'Chuva de Meteoros', habDesc: 'Faz cair meteoros de fogo à volta do alvo',
    passiva: '+40% poder mágico e Bola de Fogo nível 2', mana: 35, cd: 12, magia: 0.4 },
  besta: { nome: 'Tigre Branco', cor: '#f0f0f0', arma: 'Garras de Tigre',
    hab: 'forma', habNome: 'Forma Bestial', habDesc: 'Transformas-te em fera durante 8 s: +50% dano, +30% velocidade e roubo de vida',
    passiva: '+40 vida', mana: 20, cd: 20, hp: 40 },
  titan: { nome: 'Colosso', cor: '#c0a060', arma: 'Manoplas do Titã',
    hab: 'punho', habNome: 'Punho do Titã', habDesc: 'Esmaga o chão: atordoa tudo à volta e levas -50% dano durante 4 s',
    passiva: '+60 vida e +6 defesa, -10% velocidade', mana: 25, cd: 14, hp: 60, def: 6, vel: -0.1 },
  cura: { nome: 'Curandeiro Supremo', cor: '#5dff7a', arma: 'Bastão Sagrado',
    hab: 'luz', habNome: 'Luz Sagrada', habDesc: 'Cura 45% da vida, tira o veneno e queima os monstros à volta (x2 em mortos-vivos)',
    passiva: '+3 vida por segundo e poções +20%', mana: 30, cd: 16, regen: 3, cura: 0.2 },
  vento: { nome: 'Mestre das Lâminas', cor: '#9fdcff', arma: 'Espadas Gémeas do Vento',
    hab: 'corte', habNome: 'Corte do Vento', habDesc: 'Lança um leque de lâminas de vento que atravessam os monstros',
    passiva: '+15% velocidade', mana: 12, cd: 5, vel: 0.15 },
};
const ORDEM_CLASSES = ['aventureiro', 'sombras', 'espada', 'fogo', 'besta', 'titan', 'cura', 'vento'];
const classeJ = () => CLASSES[(J && J.classe) || 'aventureiro'] || CLASSES.aventureiro;
const MORTOS_VIVOS = ['esqueleto', 'zumbi', 'fantasma', 'mumia', 'necromante', 'lich', 'sombra'];

// Bónus passivos do caçador (entram nos stats)
function bonusClasse() {
  const C = classeJ(), b = { hp: C.hp || 0, def: C.def || 0, velAtaque: C.velAtaque || 0, crit: C.crit || 0, magia: C.magia || 0,
    vel: C.vel || 0, regen: C.regen || 0, cura: C.cura || 0, xp: C.xp || 0, danoPct: 0, roubo: 0 };
  if (J.formaBestial > 0) { b.danoPct += 0.5; b.vel += 0.3; b.roubo += 0.1; }
  return b;
}

// Ao começar a partida
function aplicarClasseInicial() {
  const C = classeJ();
  if (C.arma) J.arma = criarItem(ITENS.find(i => i.nome === C.arma), 1, true);
  if (J.classe === 'fogo') J.feiticos.fogo = 2;
}

function usarHabilidadeClasse() {
  const C = classeJ();
  if (!C.hab) return;
  if ((J.cdClasse || 0) > 0) return;
  if (J.mana < C.mana) { texto(J.x, J.y - 30, 'Sem mana!', '#b48cff', 15); som(150, 0.1, 'square', 0.03); return; }
  const feito = ({ troca: habTroca, danca: habDanca, meteoros: habMeteoros, forma: habForma, punho: habPunho, luz: habLuz, corte: habCorte })[C.hab]();
  if (!feito) return;
  J.mana -= C.mana;
  J.cdClasse = C.cd * (temRel('relogio') ? 0.7 : 1);
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
  let s = sombras[0], md = -1;
  for (const x of sombras) { const d = Math.hypot(x.x - J.x, x.y - J.y); if (d > md) { md = d; s = x; } }
  const px = J.x, py = J.y;
  explosao(J.x, J.y, '#6a4aff', 20, 180, 5);
  J.x = s.x; J.y = s.y; s.x = px; s.y = py;
  explosao(J.x, J.y, '#6a4aff', 20, 180, 5);
  J.invuln = Math.max(J.invuln, 0.5);
  J.buffSombras = 5;
  revelar(mapa, J.x, J.y, 7);
  texto(J.x, J.y - 40, 'TROCA DE SOMBRA', '#8a6aff', 16);
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
    const { dano, crit } = rolarDano(3);
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
  chuvaDeFogo(p.x, p.y, 8, 150, Math.round(S.poder * 1.3), 70, '#ff5a1a', 'fogo');
  texto(J.x, J.y - 40, 'CHUVA DE METEOROS', '#ff5a1a', 16);
  som(90, 0.8, 'sawtooth', 0.05, -30);
  return true;
}

function habForma() {
  J.formaBestial = 8;
  S = stats();
  explosao(J.x, J.y, '#ffffff', 30, 220, 6);
  texto(J.x, J.y - 40, 'FORMA BESTIAL', '#ffffff', 18);
  som(80, 0.6, 'sawtooth', 0.06, 120);
  tremor = Math.max(tremor, 6);
  return true;
}

function habPunho() {
  for (const e of inimigos) {
    if (e.morto || e.z > 20 || Math.hypot(e.x - J.x, e.y - J.y) > 200 + e.r) continue;
    const { dano, crit } = rolarDano(2.5);
    const l = Math.hypot(e.x - J.x, e.y - J.y) || 1;
    danoInimigo(e, dano, crit, (e.x - J.x) / l * 2, (e.y - J.y) / l * 2, true);
    e.medo = Math.max(e.medo || 0, e.boss ? 0.6 : 1.5);
  }
  J.escudoTitan = 4;
  ondas.push({ x: J.x, y: J.y, r: 200, t: 0.5, dur: 0.5, cor: '#c0a060' });
  tocarRachada(J.x, J.y, 200);
  tremor = Math.max(tremor, 14);
  som(50, 0.6, 'square', 0.07, -20);
  return true;
}

function habLuz() {
  const q = Math.round(S.maxHp * 0.45);
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
  for (const a of [-0.36, -0.18, 0, 0.18, 0.36]) {
    projeteis.push({ x: J.x, y: J.y, vx: Math.cos(base + a) * 480, vy: Math.sin(base + a) * 480, r: 9, vida: 0.7, cor: '#9fdcff',
      tipo: 'lamina', dono: 'jogador', dano, perfura: 3, atingidos: [] });
  }
  som(900, 0.2, 'triangle', 0.04, -600);
  return true;
}

// Dano que levas com o Punho do Titã ativo
const reducaoClasse = () => (J.escudoTitan > 0 ? 0.5 : 1);
// As sombras ficam mais fortes depois da Troca de Sombra
const bonusSombras = () => (J.buffSombras > 0 ? 1.5 : 1);
// O Caçador das Sombras tem o "Ergue-te!" desde o início e mais sombras
const extraSombras = () => (J.classe === 'sombras' ? 2 : 0);
const nivelErgue = () => (J.classe === 'sombras' ? 1 : 5);

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
  const cabe = (txt, tam, peso) => { ctx.font = fonte(tam, peso); return tam <= 7 || ctx.measureText(traduzir(txt)).width <= r.w - 72 ? tam : cabe(txt, tam - 1, peso); };
  textoEsq(C.nome, r.x + 64, r.y + 20, cabe(C.nome, 14, 'bold'), C.cor);
  const h = C.hab ? `F: ${C.habNome}` : 'Sem habilidade';
  textoEsq(h, r.x + 64, r.y + 44, cabe(h, 11, 'normal'), '#ffe680', 'normal');
  textoEsq(C.passiva, r.x + 64, r.y + 64, cabe(C.passiva, 10, 'normal'), '#7dff9a', 'normal');
  if (C.arma) textoEsq(C.arma, r.x + 64, r.y + 88, cabe(C.arma, 10, 'normal'), '#aaa', 'normal');
}
