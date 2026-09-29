'use strict';
// =====================================================================
//  LÓGICA DO JOGO
// =====================================================================

const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');
canvas.width = LARGURA;
canvas.height = ALTURA;

let estado = 'titulo'; // titulo | jogo | pausa | bau | nivel | morto
let andar = 0;
let mapa, mapaImg, J, S;
let inimigos = [], projeteis = [], baus = [], drops = [], particulas = [], textos = [], perigos = [];
let boss = null, roleta = null, banner = null, escolha = null;
let raios = [];
let cam = { x: 0, y: 0 };
let tremor = 0;
let tempoJogo = 0;
let somLigado = true;
let recorde = 0;
try { recorde = parseInt(localStorage.getItem('masmorra_recorde') || '0', 10) || 0; } catch (e) { /* sem storage */ }

// ---------------------------------------------------------------------
//  Som (WebAudio, sem ficheiros)
// ---------------------------------------------------------------------
let actx = null;
function som(freq, dur, tipo = 'square', vol = 0.05, slide = 0, atraso = 0) {
  if (!somLigado) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + atraso;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { /* ignora */ }
}
function fanfarra(notas, vol = 0.05) {
  notas.forEach((f, i) => som(f, 0.18, 'square', vol, 0, i * 0.11));
}

// ---------------------------------------------------------------------
//  Input
// ---------------------------------------------------------------------
const teclas = {};
const premidas = {};
const rato = { x: LARGURA / 2, y: ALTURA / 2, baixo: false };

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!teclas[k]) premidas[k] = true;
  teclas[k] = true;
  if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { teclas[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in teclas) teclas[k] = false; rato.baixo = false; });
canvas.addEventListener('mousemove', e => {
  const b = canvas.getBoundingClientRect();
  rato.x = (e.clientX - b.left) * LARGURA / b.width;
  rato.y = (e.clientY - b.top) * ALTURA / b.height;
});
canvas.addEventListener('mousedown', e => { rato.baixo = true; premidas['rato'] = true; e.preventDefault(); });
addEventListener('mouseup', () => { rato.baixo = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

const premiu = (...ks) => ks.some(k => premidas[k]);

// ---------------------------------------------------------------------
//  Itens
// ---------------------------------------------------------------------
function criarItem(modelo, nAndar, semAfixo = false) {
  const esc = modelo.r === 'lixo' ? 1 : 1 + (nAndar - 1) * 0.12;
  const it = Object.assign({}, modelo);
  it.nomeBase = modelo.nome;
  if (it.dano != null) it.dano = Math.round(modelo.dano * esc);
  if (it.def != null) it.def = Math.round(modelo.def * esc);
  if (it.hp != null && modelo.hp > 0) it.hp = Math.round(modelo.hp * esc);
  if (it.regen) it.regen = +(modelo.regen * esc).toFixed(1);
  if (!semAfixo && Math.random() < CHANCE_AFIXO[it.r]) {
    const af = it.r === 'lixo' ? AFIXO_MALDICAO : escolher(AFIXOS[it.tipo]);
    it.afixo = af;
    it.nome = `${modelo.nome} ${af.nome}`;
    if (af.multDano) it.dano = Math.round(it.dano * af.multDano);
    if (af.multVel) it.vel = +(it.vel * af.multVel).toFixed(2);
    if (af.multDef) it.def = Math.round(it.def * af.multDef);
    if (af.multHp && it.hp > 0) it.hp = Math.round(it.hp * af.multHp);
  }
  return it;
}

// Probabilidades do baú já com a Sorte do jogador aplicada (somam 100)
function chancesBau(tipoBau) {
  const base = TIPOS_BAU[tipoBau].chances;
  const sorte = J && S ? S.sorte : 0;
  const pesos = {};
  let total = 0;
  for (const r of ORDEM_RARIDADES) {
    pesos[r] = base[r] * Math.pow(EFEITO_SORTE[r], sorte);
    total += pesos[r];
  }
  for (const r of ORDEM_RARIDADES) pesos[r] = pesos[r] * 100 / total;
  return pesos;
}

function sortearItem(tipoBau) {
  const r = escolherPeso(chancesBau(tipoBau));
  const pool = ITENS.filter(i => i.r === r && !i.inicial);
  return criarItem(escolher(pool), andar);
}

// Soma um atributo de afixo em todo o equipamento
function somaAfixos(k) {
  let v = 0;
  for (const t of ['arma', 'armadura', 'amuleto']) if (J[t] && J[t].afixo && J[t].afixo[k]) v += J[t].afixo[k];
  return v;
}
const nPerk = id => J.perks[id] || 0;

function stats() {
  const a = J.arma, ar = J.armadura, am = J.amuleto || {};
  return {
    maxHp: Math.max(10, J.hpBase + (ar ? ar.hp : 0) + 30 * nPerk('vitalidade')),
    def: J.defBase + (ar ? ar.def : 0) + 3 * nPerk('pedra'),
    dano: Math.round((J.atkBase + a.dano) * (1 + 0.15 * nPerk('forca'))),
    crit: 0.05 + (a.crit || 0) + (am.crit || 0) + somaAfixos('crit') + 0.08 * nPerk('olho'),
    vel: J.velBase * Math.max(0.3, 1 + (am.velMov || 0) + somaAfixos('velMov') + 0.12 * nPerk('pes')),
    roubo: (am.roubo || 0) + somaAfixos('roubo') + 0.03 * nPerk('sangue'),
    regen: (am.regen || 0) + somaAfixos('regen') + 1.5 * nPerk('regen'),
    danoPct: am.danoPct || 0,
    cdAtaque: 0.42 / (a.vel * (1 + 0.15 * nPerk('furia'))),
    alcance: a.alcance,
    xpMult: 1 + somaAfixos('xp') + 0.2 * nPerk('iman'),
    sorte: somaAfixos('sorte') + nPerk('sorte'),
    espinhos: somaAfixos('espinhos'),
    cdDash: 0.9 * (1 - 0.25 * nPerk('esquiva')),
    curaPocao: 0.4 + 0.15 * nPerk('pocoes'),
  };
}

function equipar(item) {
  J[item.tipo] = item;
  S = stats();
  J.hp = Math.min(J.hp, S.maxHp);
  if (!J.melhorItem || RARIDADES[item.r].ordem > RARIDADES[J.melhorItem.r].ordem) J.melhorItem = item;
}

// ---------------------------------------------------------------------
//  Melhorias ao subir de nível
// ---------------------------------------------------------------------
function abrirEscolha() {
  const disponiveis = PERKS.filter(p => nPerk(p.id) < p.max);
  const opcoes = [];
  while (opcoes.length < 3 && opcoes.length < disponiveis.length) {
    const pesos = {};
    for (const p of disponiveis) if (!opcoes.includes(p)) pesos[p.id] = p.unica ? 0.6 : 1;
    const id = escolherPeso(pesos);
    opcoes.push(disponiveis.find(p => p.id === id));
  }
  if (!opcoes.length) { J.escolhasPendentes = 0; return; }
  escolha = { opcoes, t: 0 };
  estado = 'nivel';
  fanfarra([523, 659, 784, 1046], 0.04);
}

function atualizarEscolha(dt) {
  escolha.t += dt;
  if (escolha.t < 0.35) return; // evita escolher sem querer
  let i = -1;
  if (premiu('1')) i = 0; else if (premiu('2')) i = 1; else if (premiu('3')) i = 2;
  if (premiu('rato')) {
    escolha.opcoes.forEach((_, k) => {
      const r = retCartaPerk(k, escolha.opcoes.length);
      if (rato.x > r.x && rato.x < r.x + r.w && rato.y > r.y && rato.y < r.y + r.h) i = k;
    });
  }
  if (i < 0 || i >= escolha.opcoes.length) return;
  const p = escolha.opcoes[i];
  J.perks[p.id] = nPerk(p.id) + 1;
  if (p.id === 'vitalidade') J.hp += 30;
  if (p.id === 'pocoes') J.pocoes += 2;
  J.escolhasPendentes--;
  escolha = null;
  estado = 'jogo';
  rato.baixo = false;
  S = stats();
  texto(J.x, J.y - 30, p.nome + '!', p.cor, 20);
  explosao(J.x, J.y, p.cor, 24, 200, 5);
  som(660, 0.2, 'triangle', 0.05, 300);
}

function retCartaPerk(i, n) {
  const w = 230, h = 280, gap = 30;
  const total = n * w + (n - 1) * gap;
  return { x: (LARGURA - total) / 2 + i * (w + gap), y: 190, w, h };
}

// ---------------------------------------------------------------------
//  Início / andares
// ---------------------------------------------------------------------
function novoJogo() {
  J = {
    x: 0, y: 0, r: 12,
    hpBase: 100, hp: 100, nivel: 1, xp: 0, atkBase: 5, defBase: 0, velBase: 165,
    arma: criarItem(ITENS.find(i => i.inicial), 1, true), armadura: null, amuleto: null,
    pocoes: 2, cdAtaque: 0, invuln: 0, dashT: 0, cdDash: 0, dashVX: 0, dashVY: 0,
    kbx: 0, kby: 0, dirX: 1, dirY: 0, angArma: 0, golpe: null,
    kills: 0, bausAbertos: 0, melhorItem: null,
    perks: {}, escolhasPendentes: 0, contaGolpes: 0, escudoCd: 0,
  };
  andar = 0;
  tempoJogo = 0;
  S = stats();
  proximoAndar();
  estado = 'jogo';
}

function proximoAndar() {
  andar++;
  mapa = gerarMapa(andar);
  mapaImg = renderizarMapa(mapa, andar);
  inimigos = []; projeteis = []; baus = []; drops = []; particulas = []; textos = []; perigos = []; raios = [];
  boss = null;
  reiniciarCampo();
  J.x = mapa.inicio.x; J.y = mapa.inicio.y;
  J.invuln = 1.2; J.golpe = null;
  if (mapa.eBoss) {
    boss = criarBoss();
    inimigos.push(boss);
    mostrarBanner(`ANDAR ${andar} — BOSS`, boss.nome, '#ff4d4d');
    som(80, 1.2, 'sawtooth', 0.06, -30);
  } else {
    popularAndar();
    mostrarBanner(`ANDAR ${andar}`, andar % 5 === 4 ? 'Cuidado... o próximo andar tem um BOSS!' : 'Encontra a escada para descer', '#ffffff');
    if (andar > 1) som(300, 0.3, 'triangle', 0.05, -150);
  }
  cam.x = J.x - LARGURA / 2; cam.y = J.y - ALTURA / 2;
  revelar(mapa, J.x, J.y, 7);
}

function popularAndar() {
  const pesos = {};
  for (const k in INIMIGOS) if (INIMIGOS[k].minAndar <= andar) pesos[k] = INIMIGOS[k].peso;
  const salas = mapa.salas.filter(s => s !== mapa.salaInicio);
  const n = Math.min(32, 7 + Math.floor(andar * 1.6));
  for (let i = 0; i < n; i++) {
    const p = pontoLivreNaSala(mapa, escolher(salas), 18);
    inimigos.push(criarInimigo(escolherPeso(pesos), p.x, p.y));
  }
  const nBaus = randInt(2, 4);
  for (let i = 0; i < nBaus; i++) {
    const p = pontoLivreNaSala(mapa, escolher(salas), 16, 1);
    if (Math.hypot(p.x - mapa.escada.x, p.y - mapa.escada.y) < 50) continue;
    baus.push({ x: p.x, y: p.y, tipo: Math.random() < 0.07 ? 'ouro' : 'madeira', t: Math.random() * 6 });
  }
  if (andar === 1) { // um baú logo no início para experimentar
    baus.push({ x: mapa.inicio.x + TILE * 2, y: mapa.inicio.y, tipo: 'madeira', semMimico: true, t: 0 });
    if (colideCirculo(mapa, mapa.inicio.x + TILE * 2, mapa.inicio.y, 14)) baus[baus.length - 1].x = mapa.inicio.x - TILE * 2;
  }
}

function criarInimigo(tipo, x, y) {
  const d = INIMIGOS[tipo];
  const fh = 1 + (andar - 1) * 0.3, fd = 1 + (andar - 1) * 0.18;
  const hp = Math.round(d.hp * fh);
  return {
    tipo, nome: d.nome, x, y, r: d.r, hp, maxHp: hp,
    dano: Math.round(d.dano * fd), vel: d.vel, xp: Math.round(d.xp * (1 + (andar - 1) * 0.2)),
    cor: d.cor, t: Math.random() * 10, cd: rand(0.8, 2), acordado: false,
    kbx: 0, kby: 0, flash: 0, boss: false, morto: false, carga: 0, preparar: 0, cx: 0, cy: 0, z: 0,
  };
}

function criarBoss() {
  const n = andar / 5;
  const b = BOSSES[(n - 1) % BOSSES.length];
  const fh = 1 + (andar - 1) * 0.3, fd = 1 + (andar - 1) * 0.18;
  const hp = Math.round(b.hp * fh);
  return {
    tipo: b.id, nome: b.nome, x: mapa.posBoss.x, y: mapa.posBoss.y, r: b.r, hp, maxHp: hp,
    dano: Math.round(b.dano * fd), vel: b.vel, xp: Math.round(b.xp * (1 + (andar - 1) * 0.2)),
    cor: b.cor, t: 0, cd: 0, cdA: 2.5, cdB: 5, cdC: 8, cdD: 1, acordado: true,
    kbx: 0, kby: 0, flash: 0, boss: true, morto: false, z: 0,
    salto: 0, sopro: 0, investida: 0, fase2: false, giro: 0,
  };
}

// ---------------------------------------------------------------------
//  Efeitos
// ---------------------------------------------------------------------
function mostrarBanner(titulo, sub, cor) { banner = { titulo, sub, cor, t: 3 }; }

function texto(x, y, txt, cor = '#fff', tam = 16) {
  textos.push({ x: x + rand(-6, 6), y, txt, cor, tam, t: 0.9, vy: -55 });
}

function explosao(x, y, cor, n = 12, vel = 160, tam = 4) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), v = rand(vel * 0.3, vel);
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rand(0.3, 0.7), cor, tam: rand(tam * 0.5, tam) });
  }
}

function atualizarEfeitos(dt) {
  for (const p of particulas) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3;
    p.t -= dt;
  }
  particulas = particulas.filter(p => p.t > 0);
  for (const t of textos) { t.y += t.vy * dt; t.vy *= 1 - dt * 2; t.t -= dt; }
  textos = textos.filter(t => t.t > 0);
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  tremor = Math.max(0, tremor - dt * 30);
}

// ---------------------------------------------------------------------
//  Combate
// ---------------------------------------------------------------------
function xpProximo(n) { return Math.floor(20 * Math.pow(n, 1.5)); }

function ganharXp(q) {
  q = Math.round(q * S.xpMult);
  J.xp += q;
  texto(J.x, J.y - 26, `+${q} XP`, '#7ec8ff', 13);
  while (J.xp >= xpProximo(J.nivel)) {
    J.xp -= xpProximo(J.nivel);
    J.nivel++;
    J.hpBase += 10; J.atkBase += 2; J.defBase += 1;
    J.escolhasPendentes++;
    S = stats();
    J.hp = S.maxHp;
    texto(J.x, J.y - 40, 'SUBIU DE NÍVEL!', '#ffe14d', 22);
    explosao(J.x, J.y, '#ffe14d', 30, 220, 5);
  }
}

function atacar(dx, dy) {
  if (J.cdAtaque > 0) return;
  const l = Math.hypot(dx, dy) || 1;
  dx /= l; dy /= l;
  const ang = Math.atan2(dy, dx);
  J.cdAtaque = S.cdAtaque;
  J.angArma = ang;
  J.contaGolpes++;
  const giro = nPerk('remoinho') > 0 && J.contaGolpes % 4 === 0;
  const arco = giro ? Math.PI + 0.1 : 1.15;
  J.golpe = { ang, t: giro ? 0.25 : 0.15, dur: giro ? 0.25 : 0.15, alcance: S.alcance + J.r, giro };
  som(giro ? 180 : 260, giro ? 0.15 : 0.07, 'square', 0.025, -150);
  if (nPerk('laminas') > 0) {
    projeteis.push({ x: J.x + dx * 14, y: J.y + dy * 14, vx: dx * 430, vy: dy * 430, r: 7, vida: 0.55,
      cor: '#d9a6ff', tipo: 'lamina', dono: 'jogador', dano: Math.max(1, Math.round(S.dano * 0.5)) });
  }
  let acertou = false;
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const ex = e.x - J.x, ey = e.y - J.y;
    const d = Math.hypot(ex, ey);
    if (d - e.r > S.alcance + J.r) continue;
    let diff = Math.atan2(ey, ex) - ang;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) > arco && d > e.r + J.r + 4) continue;
    let dano = S.dano * rand(0.85, 1.15) * (1 + S.danoPct);
    const crit = Math.random() < S.crit;
    if (crit) dano *= 2;
    danoInimigo(e, Math.max(1, Math.round(dano)), crit, dx, dy, true);
    acertou = true;
  }
  if (acertou) tremor = Math.max(tremor, 2);
}

function danoInimigo(e, dano, crit, dx, dy, efeitos = false) {
  if (e.morto) return;
  e.hp -= dano;
  e.flash = 0.1;
  e.acordado = true;
  if (!e.boss) { e.kbx = dx * 300; e.kby = dy * 300; }
  texto(e.x, e.y - e.r - 4, crit ? `${dano}!` : `${dano}`, crit ? '#ffe14d' : '#ffffff', crit ? 22 : 16);
  explosao(e.x, e.y, e.cor, 5, 120, 3);
  if (S.roubo > 0) J.hp = Math.min(S.maxHp, J.hp + dano * S.roubo);
  som(crit ? 620 : 340, 0.06, 'square', 0.03, -100);
  const af = efeitos && J.arma.afixo ? J.arma.afixo.id : null;
  if (af === 'fogo') { e.queima = 3; e.queimaDps = Math.max(1, dano * 0.35); }
  if (af === 'gelo') e.lento = 2;
  if (e.hp <= 0 && !e.morto) matarInimigo(e);
  if (af === 'trovao' && Math.random() < 0.25) relampago(e, dano);
}

// Relâmpago salta do inimigo atingido para até 3 inimigos próximos
function relampago(origem, dano) {
  let atual = origem;
  const atingidos = [origem];
  for (let k = 0; k < 3; k++) {
    let prox = null, md = 170;
    for (const o of inimigos) {
      if (o.morto || atingidos.includes(o)) continue;
      const d = Math.hypot(o.x - atual.x, o.y - atual.y);
      if (d < md) { md = d; prox = o; }
    }
    if (!prox) break;
    raios.push({ x1: atual.x, y1: atual.y, x2: prox.x, y2: prox.y, t: 0.25 });
    atingidos.push(prox);
    danoInimigo(prox, Math.max(1, Math.round(dano * 0.6)), false, 0, 0);
    atual = prox;
  }
  if (atingidos.length > 1) som(1200, 0.15, 'sawtooth', 0.03, -900);
}

function matarInimigo(e) {
  e.morto = true;
  J.kills++;
  explosao(e.x, e.y, e.cor, e.boss ? 80 : 16, e.boss ? 350 : 180, e.boss ? 7 : 4);
  som(e.boss ? 60 : 150, e.boss ? 1 : 0.2, 'sawtooth', 0.05, -40);
  ganharXp(e.xp);
  if (e.boss) {
    boss = null;
    mapa.escada.ativa = true;
    tremor = 20;
    const ex = mapa.escada.x, ey = mapa.escada.y;
    baus.push({ x: ex - 70, y: ey, tipo: 'ouro', semMimico: true, t: 0 });
    baus.push({ x: ex + 70, y: ey, tipo: 'madeira', semMimico: true, t: 0 });
    J.pocoes += 1;
    mostrarBanner('BOSS DERROTADO!', 'Abre os baús e desce a escada', '#ffae00');
    fanfarra([392, 523, 659, 784, 1046, 1318], 0.05);
    projeteis = []; perigos = [];
    // os lacaios morrem com o mestre
    for (const o of inimigos) if (!o.morto && o !== e) { o.morto = true; explosao(o.x, o.y, o.cor, 10); }
    return;
  }
  if (nPerk('explosao') > 0) {
    explosao(e.x, e.y, '#ff7b25', 18, 200, 6);
    for (const o of inimigos) {
      if (o.morto || o === e || Math.hypot(o.x - e.x, o.y - e.y) > 80 + o.r) continue;
      danoInimigo(o, Math.max(1, Math.round(e.maxHp * 0.4)), false, 0, 0);
    }
  }
  if (Math.random() < 0.12) drops.push({ tipo: 'pocao', x: e.x, y: e.y, t: 0 });
  if (e.tipo === 'mimico') baus.push({ x: e.x, y: e.y, tipo: 'madeira', semMimico: true, t: 0 });
}

function danoJogador(d, fx, fy, fonte = null) {
  if (J.invuln > 0 || J.dashT > 0 || estado !== 'jogo') return;
  if (nPerk('escudo') > 0 && J.escudoCd <= 0) {
    J.escudoCd = 10;
    J.invuln = 0.5;
    texto(J.x, J.y - 24, 'BLOQUEADO!', '#fff0a0', 18);
    explosao(J.x, J.y, '#fff0a0', 16, 180, 4);
    som(900, 0.2, 'triangle', 0.05, -400);
    return;
  }
  if (fonte && S.espinhos > 0 && !fonte.morto) danoInimigo(fonte, Math.max(1, Math.round(d * S.espinhos)), false, 0, 0);
  const final = Math.max(1, Math.round(d * 60 / (60 + S.def * 5)));
  J.hp -= final;
  J.invuln = 0.7;
  texto(J.x, J.y - 20, `-${final}`, '#ff4d4d', 18);
  tremor = Math.max(tremor, 6);
  som(110, 0.18, 'sawtooth', 0.06, -60);
  if (fx != null) {
    const dx = J.x - fx, dy = J.y - fy, l = Math.hypot(dx, dy) || 1;
    J.kbx = dx / l * 260; J.kby = dy / l * 260;
  }
  if (J.hp <= 0) morrer();
}

function morrer() {
  J.hp = 0;
  estado = 'morto';
  explosao(J.x, J.y, '#3a6ad4', 40, 250, 6);
  fanfarra([392, 330, 262, 196], 0.05);
  if (andar > recorde) {
    recorde = andar;
    J.novoRecorde = true;
    try { localStorage.setItem('masmorra_recorde', String(recorde)); } catch (e) { /* ignora */ }
  }
}

function beberPocao() {
  if (J.pocoes <= 0 || J.hp >= S.maxHp) return;
  J.pocoes--;
  const cura = Math.round(S.maxHp * S.curaPocao);
  J.hp = Math.min(S.maxHp, J.hp + cura);
  texto(J.x, J.y - 24, `+${cura}`, '#5dff7a', 20);
  explosao(J.x, J.y, '#5dff7a', 14, 120, 4);
  som(440, 0.25, 'sine', 0.06, 400);
}

function disparar(x, y, ux, uy, vel, dano, cor, r, tipo = 'bola', vida = 3) {
  projeteis.push({ x, y, vx: ux * vel, vy: uy * vel, dano, cor, r, tipo, vida });
}

function invocar(tipo, perto, raio) {
  for (let t = 0; t < 12; t++) {
    const a = rand(0, Math.PI * 2);
    const x = perto.x + Math.cos(a) * raio, y = perto.y + Math.sin(a) * raio;
    if (!colideCirculo(mapa, x, y, INIMIGOS[tipo].r + 2)) {
      const m = criarInimigo(tipo, x, y);
      m.acordado = true;
      inimigos.push(m);
      explosao(x, y, '#b57bff', 10, 120);
      return;
    }
  }
}

// ---------------------------------------------------------------------
//  Atualização
// ---------------------------------------------------------------------
function atualizar(dt) {
  tempoJogo += dt;
  S = stats();
  atualizarJogador(dt);
  if (estado !== 'jogo') return;
  atualizarCampo(mapa, J.x, J.y);
  for (const r of raios) r.t -= dt;
  raios = raios.filter(r => r.t > 0);
  for (const e of inimigos) if (!e.morto) atualizarInimigo(e, dt);
  separarInimigos();
  atualizarProjeteis(dt);
  atualizarPerigos(dt);
  for (const d of drops) {
    d.t += dt;
    if (Math.hypot(d.x - J.x, d.y - J.y) < J.r + 12) {
      d.morto = true;
      J.pocoes++;
      texto(d.x, d.y - 10, '+1 Poção', '#ff6b8a', 15);
      som(660, 0.12, 'triangle', 0.05, 200);
    }
  }
  drops = drops.filter(d => !d.morto);
  for (const b of baus) b.t += dt;
  inimigos = inimigos.filter(e => !e.morto);
  atualizarEfeitos(dt);

  // câmara
  const alvoX = clamp(J.x - LARGURA / 2, 0, mapa.W * TILE - LARGURA);
  const alvoY = clamp(J.y - ALTURA / 2, 0, mapa.H * TILE - ALTURA);
  cam.x += (alvoX - cam.x) * Math.min(1, dt * 8);
  cam.y += (alvoY - cam.y) * Math.min(1, dt * 8);
  revelar(mapa, J.x, J.y, 7);

  // interações
  J.bauPerto = null;
  let md = 46;
  for (const b of baus) {
    const d = Math.hypot(b.x - J.x, b.y - J.y);
    if (d < md) { md = d; J.bauPerto = b; }
  }
  J.escadaPerto = Math.hypot(mapa.escada.x - J.x, mapa.escada.y - J.y) < 40;
  if (premiu('e')) {
    if (J.bauPerto) abrirBau(J.bauPerto);
    else if (J.escadaPerto && mapa.escada.ativa) proximoAndar();
  }
}

function atualizarJogador(dt) {
  let mx = 0, my = 0;
  if (teclas['w'] || teclas['arrowup']) my -= 1;
  if (teclas['s'] || teclas['arrowdown']) my += 1;
  if (teclas['a'] || teclas['arrowleft']) mx -= 1;
  if (teclas['d'] || teclas['arrowright']) mx += 1;
  if (mx || my) {
    const l = Math.hypot(mx, my);
    mx /= l; my /= l;
    J.dirX = mx; J.dirY = my;
    if (!J.golpe) J.angArma = Math.atan2(my, mx);
  }
  J.cdAtaque -= dt; J.invuln -= dt; J.cdDash -= dt; J.escudoCd -= dt;

  if (premiu('shift') && J.cdDash <= 0) {
    const dx = (mx || my) ? mx : J.dirX, dy = (mx || my) ? my : J.dirY;
    J.dashT = 0.16; J.dashVX = dx * 560; J.dashVY = dy * 560; J.cdDash = S.cdDash;
    som(500, 0.12, 'sine', 0.04, -300);
  }

  if (J.dashT > 0) {
    J.dashT -= dt;
    moverEntidade(mapa, J, J.dashVX * dt, J.dashVY * dt);
    particulas.push({ x: J.x, y: J.y, vx: 0, vy: 0, t: 0.25, cor: 'rgba(120,170,255,0.6)', tam: 10 });
  } else {
    moverEntidade(mapa, J, (mx * S.vel + J.kbx) * dt, (my * S.vel + J.kby) * dt);
  }
  J.kbx *= Math.max(0, 1 - dt * 10);
  J.kby *= Math.max(0, 1 - dt * 10);

  if (rato.baixo) atacar(rato.x + cam.x - J.x, rato.y + cam.y - J.y);
  else if (teclas[' '] || teclas['j']) atacar(J.dirX, J.dirY);
  if (premiu('q')) beberPocao();

  J.hp = Math.min(S.maxHp, J.hp + S.regen * dt);
  if (J.golpe) { J.golpe.t -= dt; if (J.golpe.t <= 0) J.golpe = null; }
}

function atualizarInimigo(e, dt) {
  e.t += dt; e.cd -= dt; e.flash -= dt;
  const dx = J.x - e.x, dy = J.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  // estados: queimado / abrandado
  if (e.queima > 0) {
    e.queima -= dt;
    e.hp -= e.queimaDps * dt;
    e.acumQueima = (e.acumQueima || 0) + e.queimaDps * dt;
    if (Math.random() < 0.3) particulas.push({ x: e.x + rand(-e.r, e.r), y: e.y + rand(-e.r, e.r), vx: 0, vy: -40, t: 0.4, cor: '#ff7b25', tam: 4 });
    if (e.acumQueima >= 1 && (e.queima <= 0 || Math.floor(e.queima * 2) !== Math.floor((e.queima + dt) * 2))) {
      texto(e.x, e.y - e.r - 4, `${Math.round(e.acumQueima)}`, '#ff9b45', 13);
      e.acumQueima = 0;
    }
    if (e.hp <= 0) { matarInimigo(e); return; }
  }
  if (e.lento > 0) e.lento -= dt;
  const fLento = e.lento > 0 ? 0.6 : 1;
  if (e.boss) { atualizarBoss(e, dt, d, ux, uy, fLento); return; }
  if (!e.acordado && d < 300) {
    const dc = distCampo(mapa, e.x, e.y);
    if (e.tipo === 'fantasma' || (dc >= 0 && dc <= 12)) e.acordado = true;
  }

  let vx = 0, vy = 0;
  const ru = e.acordado && e.tipo !== 'fantasma' ? rumo(mapa, e, J.x, J.y) : { x: ux, y: uy };
  if (e.acordado) {
    switch (e.tipo) {
      case 'slime':
        if (e.t % 1.1 < 0.45) { vx = ru.x * e.vel * 1.8; vy = ru.y * e.vel * 1.8; }
        break;
      case 'morcego': {
        const a = Math.atan2(ru.y, ru.x) + Math.sin(e.t * 5) * 0.9;
        vx = Math.cos(a) * e.vel; vy = Math.sin(a) * e.vel;
        break;
      }
      case 'esqueleto': {
        const vejo = linhaDeVista(mapa, e.x, e.y, J.x, J.y, 4);
        if (!vejo || d > 260) { vx = ru.x * e.vel; vy = ru.y * e.vel; }
        else if (d < 170) { vx = -ux * e.vel; vy = -uy * e.vel; }
        else { const s = Math.sin(e.t * 0.8) > 0 ? 1 : -1; vx = -uy * e.vel * 0.6 * s; vy = ux * e.vel * 0.6 * s; }
        if (e.cd <= 0 && d < 400 && vejo) {
          e.cd = rand(1.6, 2.3);
          disparar(e.x, e.y, ux, uy, 250, e.dano, '#e8e2cf', 5, 'flecha');
          som(700, 0.08, 'triangle', 0.02, -400);
        }
        break;
      }
      case 'orc':
        if (e.carga > 0) { e.carga -= dt; vx = e.cx * e.vel * 3.2; vy = e.cy * e.vel * 3.2; }
        else if (e.preparar > 0) { e.preparar -= dt; if (e.preparar <= 0) { e.carga = 0.45; e.cx = ux; e.cy = uy; } }
        else {
          vx = ru.x * e.vel; vy = ru.y * e.vel;
          if (d < 160 && e.cd <= 0 && linhaDeVista(mapa, e.x, e.y, J.x, J.y, e.r)) { e.preparar = 0.45; e.cd = 3; }
        }
        break;
      case 'fantasma':
      case 'mimico':
        vx = ru.x * e.vel; vy = ru.y * e.vel;
        break;
    }
  }
  const mx = (vx * fLento + e.kbx) * dt, my = (vy * fLento + e.kby) * dt;
  if (e.tipo === 'fantasma') { e.x += mx; e.y += my; }
  else if (moverEntidade(mapa, e, mx, my) && e.carga > 0) e.carga = 0;
  e.kbx *= Math.max(0, 1 - dt * 10);
  e.kby *= Math.max(0, 1 - dt * 10);

  if (d < e.r + J.r - 2) danoJogador(e.dano * (e.carga > 0 ? 1.5 : 1), e.x, e.y, e);
}

function atualizarBoss(e, dt, d, ux, uy, fLento = 1) {
  const ru = rumo(mapa, e, J.x, J.y);
  const fase2 = e.hp < e.maxHp * 0.5;
  if (fase2 && !e.fase2) {
    e.fase2 = true;
    mostrarBanner(`${e.nome} ENFURECEU-SE!`, 'Fase 2', '#ff4d4d');
    tremor = 12;
    som(70, 0.8, 'sawtooth', 0.07, 40);
  }
  e.cdA -= dt; e.cdB -= dt; e.cdC -= dt; e.cdD -= dt;
  let vx = 0, vy = 0;

  if (e.tipo === 'reiSlime') {
    if (e.salto > 0) {
      e.salto -= dt;
      const p = 1 - e.salto / e.duracaoSalto;
      e.z = Math.sin(clamp(p, 0, 1) * Math.PI) * 90;
      vx = e.svx; vy = e.svy;
      if (e.salto <= 0) {
        e.z = 0;
        tremor = 14;
        som(60, 0.4, 'sawtooth', 0.07, -20);
        const n = fase2 ? 20 : 14;
        for (let k = 0; k < n; k++) {
          const a = k * Math.PI * 2 / n;
          disparar(e.x, e.y, Math.cos(a), Math.sin(a), 170, Math.round(e.dano * 0.7), '#7dff7d', 8, 'bola', 4);
        }
        explosao(e.x, e.y, '#5fd35f', 30, 250, 6);
        if (d < e.r + J.r + 20) danoJogador(e.dano * 1.3, e.x, e.y);
      }
    } else {
      vx = ru.x * e.vel; vy = ru.y * e.vel;
      if (e.cdA <= 0) {
        e.cdA = fase2 ? 1.7 : 2.6;
        e.duracaoSalto = 0.8; e.salto = 0.8;
        e.svx = (J.x - e.x) / 0.8; e.svy = (J.y - e.y) / 0.8;
      }
      if (e.cdB <= 0) {
        e.cdB = 7;
        if (inimigos.length < 10) for (let k = 0; k < (fase2 ? 3 : 2); k++) invocar('slime', e, e.r + 30);
      }
    }
  } else if (e.tipo === 'lich') {
    if (d < 200) { vx = -ux * e.vel; vy = -uy * e.vel; }
    else if (d > 320) { vx = ru.x * e.vel; vy = ru.y * e.vel; }
    else { vx = -uy * e.vel * 0.7; vy = ux * e.vel * 0.7; }
    if (e.cdA <= 0) {
      e.cdA = fase2 ? 1.5 : 2.2;
      const n = fase2 ? 18 : 14;
      e.giro += 0.3;
      for (let k = 0; k < n; k++) {
        const a = e.giro + k * Math.PI * 2 / n;
        disparar(e.x, e.y, Math.cos(a), Math.sin(a), 150, Math.round(e.dano * 0.8), '#b57bff', 7, 'bola', 5);
      }
      som(200, 0.3, 'triangle', 0.05, -120);
    }
    if (fase2 && e.cdD <= 0) {
      e.cdD = 0.9;
      const base = Math.atan2(uy, ux);
      for (const s of [-0.22, 0, 0.22]) disparar(e.x, e.y, Math.cos(base + s), Math.sin(base + s), 270, e.dano, '#ff5cf0', 6, 'bola', 3);
    }
    if (e.cdB <= 0) { // teletransporte
      e.cdB = 6;
      explosao(e.x, e.y, '#6a3fb5', 25, 200);
      for (let t = 0; t < 20; t++) {
        const p = pontoLivreNaSala(mapa, mapa.salas[0], e.r + 4, 2);
        if (Math.hypot(p.x - J.x, p.y - J.y) > 230) { e.x = p.x; e.y = p.y; break; }
      }
      explosao(e.x, e.y, '#6a3fb5', 25, 200);
      som(900, 0.3, 'sine', 0.04, -700);
    }
    if (e.cdC <= 0) {
      e.cdC = 9;
      const lacaios = inimigos.filter(o => !o.boss && !o.morto).length;
      if (lacaios < 6) for (let k = 0; k < 2; k++) invocar('esqueleto', e, 60);
    }
  } else if (e.tipo === 'dragao') {
    if (e.investida > 0) {
      e.investida -= dt;
      vx = e.ivx; vy = e.ivy;
      particulas.push({ x: e.x, y: e.y, vx: 0, vy: 0, t: 0.3, cor: 'rgba(255,90,40,0.5)', tam: 18 });
    } else if (e.sopro > 0) {
      e.sopro -= dt;
      vx = ux * e.vel * 0.3; vy = uy * e.vel * 0.3;
      e.cdTiro -= dt;
      if (e.cdTiro <= 0) {
        e.cdTiro = 0.07;
        const a = Math.atan2(uy, ux) + rand(-0.35, 0.35);
        disparar(e.x + ux * e.r * 0.8, e.y + uy * e.r * 0.8, Math.cos(a), Math.sin(a), rand(240, 300), Math.round(e.dano * 0.6), '#ff7b25', 8, 'fogo', 1.4);
      }
    } else {
      vx = ru.x * e.vel; vy = ru.y * e.vel;
      if (e.cdA <= 0) {
        e.cdA = fase2 ? 2.4 : 3.4;
        e.sopro = 1.0; e.cdTiro = 0;
        som(90, 1.0, 'sawtooth', 0.05, 60);
      } else if (e.cdB <= 0) {
        e.cdB = 7;
        e.investida = 0.8; e.ivx = ux * 420; e.ivy = uy * 420;
        som(120, 0.5, 'square', 0.05, -60);
      }
    }
    if (fase2 && e.cdC <= 0) { // meteoros
      e.cdC = 2.6;
      for (let k = 0; k < 3; k++)
        perigos.push({ x: J.x + rand(-90, 90), y: J.y + rand(-90, 90), r: 46, t: 1.1, dur: 1.1, dano: e.dano });
    }
  }

  const bateu = moverEntidade(mapa, e, vx * dt * fLento, vy * dt * fLento);
  if (bateu && e.investida > 0) { e.investida = 0; tremor = 10; som(60, 0.3, 'square', 0.05); }
  if (e.z < 20 && d < e.r + J.r - 4) danoJogador(e.dano * (e.investida > 0 ? 1.5 : 1), e.x, e.y, e);
}

function separarInimigos() {
  for (let i = 0; i < inimigos.length; i++) {
    const a = inimigos[i];
    if (a.morto) continue;
    for (let j = i + 1; j < inimigos.length; j++) {
      const b = inimigos[j];
      if (b.morto) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy), min = a.r + b.r;
      if (d >= min || d < 0.01) continue;
      const push = (min - d) / 2, nx = dx / d, ny = dy / d;
      if (!a.boss) empurrar(a, -nx * push, -ny * push);
      if (!b.boss) empurrar(b, nx * push, ny * push);
    }
  }
}
function empurrar(e, dx, dy) {
  if (e.tipo === 'fantasma') { e.x += dx; e.y += dy; } else moverEntidade(mapa, e, dx, dy);
}

function atualizarProjeteis(dt) {
  for (const p of projeteis) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vida -= dt;
    if (p.vida <= 0 || solido(mapa, Math.floor(p.x / TILE), Math.floor(p.y / TILE))) {
      p.morto = true;
      explosao(p.x, p.y, p.cor, 3, 60, 3);
      continue;
    }
    if (p.dono === 'jogador') {
      for (const e of inimigos) {
        if (e.morto || e.z > 20 || Math.hypot(p.x - e.x, p.y - e.y) > p.r + e.r) continue;
        const l = Math.hypot(p.vx, p.vy) || 1;
        danoInimigo(e, p.dano, false, p.vx / l, p.vy / l, true);
        p.morto = true;
        break;
      }
      continue;
    }
    if (J.dashT <= 0 && Math.hypot(p.x - J.x, p.y - J.y) < p.r + J.r - 2) {
      danoJogador(p.dano, p.x - p.vx, p.y - p.vy);
      p.morto = true;
    }
  }
  projeteis = projeteis.filter(p => !p.morto);
}

function atualizarPerigos(dt) {
  for (const p of perigos) {
    p.t -= dt;
    if (p.t <= 0) {
      p.morto = true;
      explosao(p.x, p.y, '#ff7b25', 22, 220, 6);
      tremor = Math.max(tremor, 6);
      som(80, 0.3, 'sawtooth', 0.05, -30);
      if (Math.hypot(p.x - J.x, p.y - J.y) < p.r + J.r * 0.5) danoJogador(p.dano, p.x, p.y);
    }
  }
  perigos = perigos.filter(p => !p.morto);
}

// ---------------------------------------------------------------------
//  Baús e roleta
// ---------------------------------------------------------------------
function abrirBau(b) {
  baus.splice(baus.indexOf(b), 1);
  const tipo = TIPOS_BAU[b.tipo];
  if (!b.semMimico && Math.random() < tipo.mimico) {
    const m = criarInimigo('mimico', b.x, b.y);
    m.acordado = true;
    inimigos.push(m);
    texto(b.x, b.y - 30, 'É UM MÍMICO!', '#ff4d4d', 24);
    tremor = 10;
    som(90, 0.5, 'sawtooth', 0.07, 120);
    return;
  }
  J.bausAbertos++;
  const premio = sortearItem(b.tipo);
  const IDX = 42;
  const faixa = [];
  for (let i = 0; i < 50; i++) faixa.push(i === IDX ? premio : sortearItem(b.tipo));
  roleta = { tipoBau: b.tipo, faixa, premio, idx: IDX, t: 0, dur: 4.5, fim: false, pos: 0, desvio: rand(-0.38, 0.38), ultimoTick: -1, brilho: 0 };
  estado = 'bau';
  som(300, 0.2, 'triangle', 0.05, 300);
}

function atualizarRoleta(dt) {
  const R = roleta;
  R.brilho += dt;
  if (!R.fim) {
    R.t += dt;
    if (premiu('e', ' ', 'enter', 'rato') && R.t > 0.3) R.t = R.dur;
    const p = Math.min(1, R.t / R.dur);
    const ease = 1 - Math.pow(1 - p, 4);
    R.pos = ease * (R.idx + 0.5 + R.desvio);
    const tick = Math.floor(R.pos);
    if (tick !== R.ultimoTick) { R.ultimoTick = tick; som(900, 0.03, 'square', 0.02); }
    if (p >= 1) {
      R.fim = true;
      R.brilho = 0;
      const ordem = RARIDADES[R.premio.r].ordem;
      if (ordem === 0) fanfarra([300, 250, 200, 120], 0.04);
      else if (ordem >= 4) { fanfarra([523, 659, 784, 1046, 1318, 1568], 0.05); tremor = 12; }
      else fanfarra([440, 554, 659], 0.04);
    }
  } else {
    if (premiu('e')) {
      equipar(R.premio);
      som(520, 0.15, 'triangle', 0.05, 200);
      roleta = null;
      estado = 'jogo';
    } else if (premiu('x')) {
      const xp = RARIDADES[R.premio.r].xpReciclar * andar;
      roleta = null;
      estado = 'jogo';
      ganharXp(xp);
    }
  }
}

// ---------------------------------------------------------------------
//  Loop principal
// ---------------------------------------------------------------------
let ultimo = performance.now();
function loop(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;

  if (premiu('m')) somLigado = !somLigado;

  if (estado === 'titulo') {
    if (premiu('enter', ' ', 'rato')) novoJogo();
  } else if (estado === 'jogo') {
    if (premiu('p', 'escape')) estado = 'pausa';
    else atualizar(dt);
    if (estado === 'jogo' && J.escolhasPendentes > 0) abrirEscolha();
  } else if (estado === 'nivel') {
    atualizarEscolha(dt);
    atualizarEfeitos(dt);
  } else if (estado === 'pausa') {
    if (premiu('p', 'escape')) estado = 'jogo';
  } else if (estado === 'bau') {
    atualizarRoleta(dt);
    atualizarEfeitos(dt);
  } else if (estado === 'morto') {
    atualizarEfeitos(dt);
    if (premiu('enter')) novoJogo();
  }

  desenhar(agora / 1000);
  for (const k in premidas) delete premidas[k];
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
