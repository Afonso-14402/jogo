'use strict';
// =====================================================================
//  CONTEÚDO EXTRA: tipos de arma, relíquias, companheiros novos,
//  os bosses das zonas novas (andares 35 e 40) e as conquistas novas.
// =====================================================================

// ---------------------------------------------------------------------
//  Tipos de arma
// ---------------------------------------------------------------------
function classeArma(it) {
  if (!it || it.tipo !== 'arma') return 'espada';
  const n = it.nomeBase || it.nome;
  if (/^Arco|Fisga/.test(n)) return 'arco';
  if (/Cajado|Cetro/.test(n)) return 'cajado';
  if (/Adaga|Garra|Presa|Mata-Cavaleiros|Fúria do Dragão/.test(n)) return 'adaga';
  if (/Bastão/.test(n)) return 'cajado';
  if (/Manopla/.test(n)) return 'martelo';
  if (/Machad/.test(n)) return 'machado';
  if (/Lança|Tridente/.test(n)) return 'lanca';
  if (/Martelo/.test(n)) return 'martelo';
  if (/Foice/.test(n)) return 'foice';
  return 'espada';
}

// Metade do ângulo que cada tipo de arma apanha à frente do herói
const ARCO_ARMA = { espada: 1.15, adaga: 0.9, machado: 1.6, lanca: 0.38, martelo: Math.PI, foice: 2.4, cajado: 1.0, arco: 0 };

// Dano de um golpe do herói (com crítico, adagas e o Dado da Sorte)
function rolarDano(fator = 1) {
  let dano = S.dano * rand(0.85, 1.15) * (1 + S.danoPct) * fator;
  const crit = Math.random() < S.crit;
  if (crit) dano *= classeArma(J.arma) === 'adaga' ? 2.5 : 2;
  if (J.hp < S.maxHp * 0.5 && temCombo('furiaSangue')) dano *= 1.3;
  if (crit && temCombo('olhoArcano')) J.mana = Math.min(S.maxMana, J.mana + 2);
  if (temRel('dado') && Math.random() < 0.12) { dano *= 3; texto(J.x, J.y - 40, 'x3!', '#ffffff', 18); }
  if (J.golpeFurtivo) { dano *= 3; J.golpeFurtivo = false; J.furtivo = 0; texto(J.x, J.y - 40, 'EMBOSCADA!', '#b0a8c8', 18); }
  return { dano: Math.max(1, Math.round(dano)), crit };
}

function dispararFlecha(dx, dy) {
  const { dano, crit } = rolarDano();
  const vel = 560, vida = Math.max(0.3, S.alcance / vel);
  projeteis.push({ x: J.x + dx * 14, y: J.y + dy * 14, vx: dx * vel, vy: dy * vel, r: 6, vida, cor: RARIDADES[J.arma.r].cor,
    tipo: 'flecha', dono: 'jogador', dano, crit, perfura: 1 + perfuraClasse(), atingidos: [] });
  som(760, 0.07, 'triangle', 0.03, -500);
}

function dispararBolaCajado(dx, dy) {
  projeteis.push({ x: J.x + dx * 14, y: J.y + dy * 14, vx: dx * 420, vy: dy * 420, r: 6, vida: 0.9, cor: '#b48cff',
    tipo: 'bola', dono: 'jogador', dano: Math.max(1, Math.round(S.dano * 0.45 + S.poder * 0.6)) });
}

// ---------------------------------------------------------------------
//  Relíquias
// ---------------------------------------------------------------------
const temRel = id => !!(J && J.reliquias && J.reliquias.includes(id));

function sortearReliquia() {
  const livres = Object.keys(RELIQUIAS).filter(id => !temRel(id));
  return livres.length ? escolher(livres) : null;
}

function ganharReliquia(id) {
  if (!id || temRel(id)) return;
  if (!J.reliquias) J.reliquias = [];
  J.reliquias.push(id);
  if (!meta.relVistas) meta.relVistas = {};
  meta.relVistas[id] = true;
  registar('reliquia');
  const R = RELIQUIAS[id];
  if (id === 'fenix') J.vidasExtra = (J.vidasExtra || 0) + 1;
  S = stats();
  mostrarBanner(`Relíquia: ${R.nome}`, R.desc, R.cor);
  fanfarra([659, 880, 1175, 1568], 0.04);
  explosao(J.x, J.y, R.cor, 24, 200, 5);
  if (J.reliquias.length >= 5) desbloquear('reliquias');
}

function soltarReliquia(x, y) {
  const id = sortearReliquia();
  if (id) drops.push({ tipo: 'reliquia', id, x, y, t: 0 });
}

// Bónus das relíquias e da raça que entram nos stats
function bonusExtra() {
  const R = RACAS[J.raca] || {};
  const b = { hpPct: 0, defPct: 0, danoPct: 0, crit: 0, vel: 0, dash: 1, ouro: 1, xp: 0, sorte: 0, espinhos: 0, magia: 0, mana: 0, manaRegen: 0, regen: R.regen || 0 };
  if (temRel('coracao')) b.hpPct += 0.15;
  if (temRel('runas')) b.defPct += 0.25;
  if (temRel('luva')) b.danoPct += 0.12;
  if (temRel('aguia')) b.crit += 0.1;
  if (temRel('botas')) { b.vel += 0.12; b.dash = 0.8; }
  if (temRel('bolsa')) b.ouro *= 1.35;
  if (temRel('coroa')) { b.ouro *= 1.15; b.xp += 0.25; }
  if (temRel('trevo')) b.sorte += 1;
  if (temRel('espinhos')) b.espinhos += 0.4;
  if (temRel('grimorio')) b.magia += 0.35;
  if (temRel('mana')) { b.mana += 40; b.manaRegen += 2; }
  return b;
}

const imuneVeneno = () => temRel('antidoto') || !!(RACAS[J.raca] || {}).imuneVeneno;
const imuneFogoChao = () => !!(RACAS[J.raca] || {}).imuneFogo;

// Efeitos das relíquias quando acertas num monstro com a arma
function golpeReliquias(e) {
  if (temRel('floco')) e.lento = Math.max(e.lento || 0, 1.5);
  if (temRel('brasa')) { e.queima = 2; e.queimaDps = Math.max(e.queimaDps || 0, S.dano * 0.25); }
}

// Ícone de uma relíquia (moldura dourada com um símbolo)
const cacheIconeRel = {};
function iconeReliquia(id) {
  if (cacheIconeRel[id]) return cacheIconeRel[id];
  const R = RELIQUIAS[id], c = R.cor, e = escurecer(c, 0.4), l = clarear(c, 0.5);
  const g = novaGrade(16, 16);
  switch (R.forma) {
    case 'trevo': for (const [x, y] of [[6, 5], [10, 5], [6, 9], [10, 9]]) elipse(g, x, y, 2.6, 2.6, tons(c)); linha(g, 8, 9, 10, 14, '#3a7a2a'); break;
    case 'coracao': elipse(g, 5.5, 6, 3, 3, tons(c)); elipse(g, 10.5, 6, 3, 3, tons(c)); poligono(g, [[2.6, 7], [13.4, 7], [8, 14]], c); pixel(g, 5, 5, l); break;
    case 'punho': for (let y = 4; y <= 12; y++) for (let x = 4; x <= 11; x++) pixel(g, x, y, y < 7 ? l : x > 9 ? e : c); for (const x of [6, 8, 10]) pixel(g, x, 4, e); break;
    case 'bota': for (let y = 3; y <= 12; y++) for (let x = 5; x <= 9; x++) pixel(g, x, y, c); for (let x = 5; x <= 13; x++) { pixel(g, x, 12, e); pixel(g, x, 11, c); } pixel(g, 4, 5, l); pixel(g, 3, 6, l); break;
    case 'ampulheta': poligono(g, [[4, 3], [12, 3], [8, 8]], c); poligono(g, [[8, 8], [4, 13], [12, 13]], c); linha(g, 3, 2, 12, 2, '#8b5a2b', 2); linha(g, 3, 13, 12, 13, '#8b5a2b', 2); pixel(g, 8, 10, '#fff6c8'); break;
    case 'dente': poligono(g, [[4, 4], [12, 4], [10, 13], [8, 9], [6, 13]], '#f0ece0'); pixel(g, 8, 13, c); pixel(g, 10, 14, c); break;
    case 'escudo': poligono(g, [[3, 3], [13, 3], [13, 8], [8, 14], [3, 8]], c); linha(g, 8, 4, 8, 12, l); linha(g, 4, 7, 12, 7, l); break;
    case 'bolsa': elipse(g, 8, 10, 5, 4, tons(c)); linha(g, 6, 5, 10, 5, e, 2); pixel(g, 8, 10, '#ffd23f'); break;
    case 'olho': poligono(g, [[1, 8], [5, 4], [11, 4], [15, 8], [11, 12], [5, 12]], '#f0f0f0'); elipse(g, 8, 8, 3, 3, tons(c)); pixel(g, 8, 8, CONTORNO); break;
    case 'pena': linha(g, 4, 13, 12, 3, '#fff0c0'); for (let k = 0; k < 7; k++) { pixel(g, 6 + k, 11 - k, c); pixel(g, 5 + k, 10 - k, l); pixel(g, 7 + k, 12 - k, e); } break;
    case 'gema': poligono(g, [[8, 2], [13, 7], [8, 14], [3, 7]], c); poligono(g, [[8, 2], [8, 14], [3, 7]], l); break;
    case 'livro': for (let y = 3; y <= 13; y++) for (let x = 3; x <= 12; x++) pixel(g, x, y, x === 3 ? e : c); for (let y = 4; y <= 12; y++) pixel(g, 12, y, '#f0e8d0'); pixel(g, 7, 7, '#ffe14d'); pixel(g, 8, 8, '#ffe14d'); break;
    case 'frasco': elipse(g, 8, 10, 4.5, 4, tons(c)); for (let y = 3; y <= 6; y++) { pixel(g, 7, y, '#d0e8f0'); pixel(g, 8, y, '#d0e8f0'); } linha(g, 6, 3, 9, 3, '#8b5a2b'); break;
    case 'floco': for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; linha(g, 8 - Math.cos(a) * 6, 8 - Math.sin(a) * 6, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, c); } pixel(g, 8, 8, '#ffffff'); break;
    case 'chama': poligono(g, [[8, 2], [13, 10], [8, 14], [3, 10]], c); poligono(g, [[8, 7], [10, 11], [8, 13], [6, 11]], '#ffe14d'); break;
    case 'coroa': poligono(g, [[3, 12], [3, 5], [6, 8], [8, 4], [10, 8], [13, 5], [13, 12]], c); linha(g, 3, 12, 13, 12, e); pixel(g, 8, 9, '#ff3355'); break;
    case 'dado': for (let y = 3; y <= 13; y++) for (let x = 3; x <= 13; x++) pixel(g, x, y, x === 3 || y === 3 ? '#ffffff' : '#e0e0e8'); for (const [x, y] of [[5, 5], [8, 8], [11, 11], [11, 5], [5, 11]]) pixel(g, x, y, CONTORNO); break;
    case 'coleira': for (let a = 0; a < 24; a++) pixel(g, 8 + Math.round(Math.cos(a / 24 * Math.PI * 2) * 5), 7 + Math.round(Math.sin(a / 24 * Math.PI * 2) * 4), c); elipse(g, 8, 12.5, 1.8, 1.8, tons('#ffe14d')); break;
    default: elipse(g, 8, 8, 5, 5, tons(c));
  }
  contornar(g);
  cacheIconeRel[id] = gradeParaCanvas(g);
  return cacheIconeRel[id];
}

// ---------------------------------------------------------------------
//  Companheiros novos (sprites e comportamento)
// ---------------------------------------------------------------------
const GATO = [
  'k.......k...',
  'kok....kok..',
  'kookkkkook..',
  'koyoooyook..',
  'koooopooko..',
  '.koooooook.k',
  '..kooOoookok',
  '..koOooOoko.',
  '..kokkkokk..',
  '..kk...kk...',
];
const PAL_GATO = { o: '#ffb86b', O: '#d0804a', y: '#5dff7a', p: '#ff8fa0' };

const CORUJA = simetrico([
  '.k....',
  'kbk...',
  'kbbkkk',
  'kwwwbb',
  'kwkywb',
  'kwwwbb',
  'kbbbby',
  'kbBbbb',
  'kbbBbb',
  '.kbbbb',
  '..kyk.',
]);
const PAL_CORUJA = { b: '#a07850', B: '#6a4a30', w: '#f0e8d0', y: '#ffd23f' };

const ROCHINHA = simetrico([
  '....kk',
  '..kkss',
  '.kssss',
  'ksssss',
  'ksseSs',
  'ksssss',
  'kSssss',
  '.kSSSs',
  '.kssk.',
  '.kkk..',
]);
const PAL_ROCHINHA = { s: '#a8a090', S: '#6a6458', e: '#7fe0ff' };

const FENIX = [
  simetrico([
    '......k',
    'k....ky',
    'rk..kyy',
    'ork.kyr',
    '.orkyyr',
    '..orryy',
    '...oorr',
    '....koo',
    '.....ko',
    '....kyy',
    '.....kk',
  ]),
  simetrico([
    '......k',
    '.....ky',
    '....kyy',
    '....kyr',
    'k..kyyr',
    'rkkrryy',
    'orrrorr',
    '.oookoo',
    '..kk.ko',
    '....kyy',
    '.....kk',
  ]),
];
const PAL_FENIX = { y: '#ffe14d', r: '#ff7b25', o: '#ff3b1a' };

function criarSpritesConteudo() {
  SPR.pet.gato = [sprite(GATO, PAL_GATO)];
  SPR.pet.coruja = [sprite(CORUJA, PAL_CORUJA)];
  SPR.pet.rochinha = [sprite(ROCHINHA, PAL_ROCHINHA)];
  SPR.pet.fenix = FENIX.map(l => sprite(l, PAL_FENIX));
  SPR.guardiao = [gerarGuardiao(false), gerarGuardiao(true)];
  SPR.senhorVazio = [gerarSenhorVazio()];
}

// 3 companheiros diferentes para a Sala do Companheiro
function escolherPets(n) {
  const l = ORDEM_PETS.slice();
  for (let i = l.length - 1; i > 0; i--) { const j = randInt(0, i); [l[i], l[j]] = [l[j], l[i]]; }
  return l.slice(0, n);
}

// Comportamento dos companheiros novos. Devolve true se tratou do companheiro.
function atualizarPetNovo(tipo, alvo, dano, dt) {
  if (!['gato', 'coruja', 'rochinha', 'fenix'].includes(tipo)) return false;
  const segueChao = (tx, ty, vel, perto) => {
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy) || 1;
    pet.andando = d > perto;
    if (pet.andando) moverEntidade(mapa, pet, dx / d * vel * dt, dy / d * vel * dt);
    if (Math.abs(dx) > 2) pet.dir = dx > 0 ? 1 : -1;
    if (Math.hypot(pet.x - J.x, pet.y - J.y) > 420) { pet.x = J.x - 20; pet.y = J.y + 10; }
    return d;
  };
  const voa = () => {
    const ang = pet.t * 1.6;
    const tx = J.x + Math.cos(ang) * 38, ty = J.y - 28 + Math.sin(ang) * 12;
    pet.dir = tx > pet.x ? 1 : -1;
    pet.x += (tx - pet.x) * Math.min(1, dt * 5);
    pet.y += (ty - pet.y) * Math.min(1, dt * 5);
  };
  if (tipo === 'gato') { // vai buscar o ouro que está no chão e arranha os monstros
    let ouro = null, md = 260;
    for (const d of drops) if (d.tipo === 'ouro') { const dd = Math.hypot(d.x - pet.x, d.y - pet.y); if (dd < md) { md = dd; ouro = d; } }
    if (ouro) {
      if (segueChao(ouro.x, ouro.y, 240, 6) < 14) {
        ouro.morto = true;
        const v = Math.max(1, Math.round(ouro.valor * S.ouroMult));
        J.ouro += v;
        texto(pet.x, pet.y - 16, `+${v}`, '#ffd23f', 12);
        som(1400, 0.04, 'square', 0.02, 300);
      }
    } else {
      const tx = alvo ? alvo.x : J.x - J.dirX * 30, ty = alvo ? alvo.y : J.y - J.dirY * 30 + 8;
      const d = segueChao(tx, ty, 220, alvo ? alvo.r + 10 : 24);
      if (alvo && d < alvo.r + 16 && pet.cd <= 0) {
        pet.cd = 0.55;
        danoInimigo(alvo, Math.round(dano), false, 0, 0);
        som(700, 0.04, 'square', 0.02, -300);
      }
    }
  } else if (tipo === 'rochinha') { // fica entre ti e o monstro mais perto: bloqueia tiros e esmaga
    const ang = alvo ? Math.atan2(alvo.y - J.y, alvo.x - J.x) : Math.atan2(-J.dirY, -J.dirX);
    segueChao(J.x + Math.cos(ang) * 34, J.y + Math.sin(ang) * 34 + 6, 190, 6);
    for (const p of projeteis) {
      if (p.dono === 'jogador' || p.morto || Math.hypot(p.x - pet.x, p.y - pet.y) > 24) continue;
      p.morto = true;
      explosao(p.x, p.y, '#a8a090', 5, 90, 3);
    }
    if (pet.cd <= 0 && inimigos.some(e => !e.morto && e.z < 20 && Math.hypot(e.x - pet.x, e.y - pet.y) < 85)) {
      pet.cd = 2.2;
      for (const e of inimigos) if (!e.morto && e.z < 20 && Math.hypot(e.x - pet.x, e.y - pet.y) < 85) danoInimigo(e, Math.round(dano * 1.4), false, 0, 0);
      ondas.push({ x: pet.x, y: pet.y, r: 85, t: 0.35, dur: 0.35, cor: '#a8a090' });
      som(90, 0.2, 'square', 0.04, -30);
    }
  } else if (tipo === 'coruja') { // penas que atravessam e mostra o mapa à volta
    voa();
    pet.revelar = (pet.revelar || 0) - dt;
    if (pet.revelar <= 0) { pet.revelar = 1; revelar(mapa, J.x, J.y, 12); }
    if (alvo && pet.cd <= 0) {
      pet.cd = 1;
      const dx = alvo.x - pet.x, dy = alvo.y - pet.y, d = Math.hypot(dx, dy) || 1;
      projeteis.push({ x: pet.x, y: pet.y, vx: dx / d * 460, vy: dy / d * 460, r: 5, vida: 0.8, cor: '#f0e8d0', tipo: 'flecha', dono: 'jogador', dano: Math.max(1, Math.round(dano * 0.8)), perfura: 1, atingidos: [] });
      som(1200, 0.04, 'triangle', 0.02, -400);
    }
  } else if (tipo === 'fenix') { // fogo e, uma vez por andar, cura-te quando estás quase a morrer
    voa();
    if (alvo && pet.cd <= 0) {
      pet.cd = 1.6;
      const dx = alvo.x - pet.x, dy = alvo.y - pet.y, d = Math.hypot(dx, dy) || 1;
      projeteis.push({ x: pet.x, y: pet.y, vx: dx / d * 360, vy: dy / d * 360, r: 6, vida: 1.2, cor: '#ffcf3a', tipo: 'fogo', dono: 'jogador', dano, explode: 36 });
      som(300, 0.1, 'sawtooth', 0.03, -120);
    }
    if (J.hp < S.maxHp * 0.25 && J.fenixAndar !== andar) {
      J.fenixAndar = andar;
      const q = Math.round(S.maxHp * 0.4);
      J.hp = Math.min(S.maxHp, J.hp + q);
      texto(J.x, J.y - 30, `Fénix: +${q}`, '#ffcf3a', 16);
      ondas.push({ x: J.x, y: J.y, r: 90, t: 0.6, dur: 0.6, cor: '#ffcf3a' });
      fanfarra([523, 784, 1046], 0.04);
    }
  }
  return true;
}

// ---------------------------------------------------------------------
//  Bosses novos: Guardião de Cristal (andar 35) e Senhor do Vazio (andar 40)
// ---------------------------------------------------------------------
function gerarGuardiao(carregar) {
  const g = novaGrade(44, 46);
  const pedra = tons('#6a7080'), cr = carregar ? '#ff7fd0' : '#7fe0ff';
  elipse(g, 22, 28, 15, 13, pedra);                        // corpo
  elipse(g, 22, 13, 8, 7, tons('#7a8090'));                // cabeça
  for (const [x, y] of [[6, 26], [38, 26]]) elipse(g, x, y, 6, 8, pedra); // braços
  for (const [x, y] of [[14, 42], [30, 42]]) elipse(g, x, y, 5, 4, tons('#5a6070')); // pés
  const cristal = (x, y, h) => { poligono(g, [[x - 3, y], [x, y - h], [x + 3, y]], xx => xx < x ? clarear(cr, 0.5) : cr); };
  cristal(9, 20, 12); cristal(35, 20, 12); cristal(22, 8, 8); cristal(15, 22, 6); cristal(29, 22, 6); cristal(22, 30, 7);
  pixel(g, 19, 13, cr); pixel(g, 20, 13, cr); pixel(g, 24, 13, cr); pixel(g, 25, 13, cr);
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarSenhorVazio() {
  const g = novaGrade(38, 46);
  const manto = tons('#3a2058');
  poligono(g, [[19, 6], [33, 42], [5, 42]], x => x < 14 ? manto.claro : x > 24 ? manto.escuro : manto.base);
  elipse(g, 19, 13, 8, 8, tons('#2a1640'));                  // capuz
  elipse(g, 19, 14, 5, 4, { base: '#f0e8ff' }, false);      // olho grande
  elipse(g, 19, 14, 2.5, 2.5, { base: '#ff3b8a' }, false);
  pixel(g, 19, 14, CONTORNO);
  for (const [x, y] of [[4, 18], [34, 18], [19, 1]]) elipse(g, x, y, 2.5, 2.5, tons('#b44dff')); // orbes
  for (let x = 8; x <= 30; x += 4) pixel(g, x, 38, '#b44dff');
  linha(g, 12, 44, 26, 44, '#07040c');
  contornar(g);
  return gradeParaCanvas(g);
}

function spriteConteudo(e, t) {
  if (e.tipo === 'guardiao') return { c: SPR.guardiao[e.prisao > 0 ? 1 : 0], y: Math.sin(t * 2) * 2 };
  if (e.tipo === 'senhorVazio') return { c: SPR.senhorVazio[0], y: -8 + Math.sin(t * 2) * 5, voa: true };
  return null;
}

function atualizarBossNovo(e, dt, d, ux, uy, ru, fase2) {
  if (e.tipo === 'guardiao') {
    if (e.prisao > 0) e.prisao -= dt;
    if (e.cdA <= 0) { // anel de estilhaços a rodar
      e.cdA = fase2 ? 2.2 : 3.2;
      e.giro = (e.giro || 0) + 0.25;
      const n = fase2 ? 20 : 14;
      for (let k = 0; k < n; k++) {
        const a = e.giro + k / n * Math.PI * 2;
        disparar(e.x, e.y, Math.cos(a), Math.sin(a), 190, Math.round(e.dano * 0.6), '#7fe0ff', 7, 'estilhaco', 4);
      }
      som(1000, 0.2, 'sine', 0.04, -600);
    }
    if (e.cdB <= 0) { // cristais a nascer do chão à tua volta
      e.cdB = fase2 ? 4.5 : 6;
      e.prisao = 1.1;
      const pts = [[0, 0], [90, 0], [-90, 0], [0, 90], [0, -90]];
      for (const [ox, oy] of pts) perigos.push({ x: J.x + ox, y: J.y + oy, r: 44, t: 1.1, dur: 1.1, dano: Math.round(e.dano * 1.2), cor: '#7fe0ff', semQueda: true });
      som(500, 0.3, 'triangle', 0.04, 400);
    }
    if (e.cdC <= 0) {
      e.cdC = 10;
      if (inimigos.filter(o => !o.boss && !o.morto).length < 4) for (let k = 0; k < 2; k++) invocar('espiritoCristal', e, 90);
    }
    return { vx: ru.x * e.vel, vy: ru.y * e.vel };
  }
  // Senhor do Vazio
  if (e.lasersB) { // raios que rodam à volta dele
    const L = e.lasersB;
    L.t -= dt;
    if (L.fase === 'mirar' && L.t <= 0) { L.fase = 'fogo'; L.t = fase2 ? 3 : 2.4; som(110, 0.6, 'sawtooth', 0.05, 300); tremor = Math.max(tremor, 6); }
    else if (L.fase === 'fogo') {
      L.base += L.rot * dt;
      for (const a0 of L.angs) {
        const a = L.base + a0, fx = Math.cos(a), fy = Math.sin(a);
        const comp = comprimentoRaio(e.x, e.y, a);
        const px = J.x - e.x, py = J.y - e.y, proj = px * fx + py * fy;
        if (proj > 0 && proj < comp && Math.abs(px * fy - py * fx) < J.r + 8) danoJogador(Math.round(e.dano * 0.9), e.x, e.y, e);
      }
      if (L.t <= 0) e.lasersB = null;
    }
    return { vx: 0, vy: 0 };
  }
  if (e.cdA <= 0 && d < 520) {
    e.cdA = fase2 ? 5.5 : 7;
    const n = fase2 ? 4 : 3;
    e.lasersB = { fase: 'mirar', t: 1.1, base: Math.atan2(uy, ux) + Math.PI / n, rot: (Math.random() < 0.5 ? -1 : 1) * (fase2 ? 0.8 : 0.55), angs: Array.from({ length: n }, (_, k) => k / n * Math.PI * 2) };
    return { vx: 0, vy: 0 };
  }
  if (e.cdB <= 0) { // teletransporte e explosão de bolas roxas
    e.cdB = fase2 ? 5 : 7;
    if (teletransportar(e, 180, 260)) {
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; disparar(e.x, e.y, Math.cos(a), Math.sin(a), 180, Math.round(e.dano * 0.6), '#d07fff', 7, 'bola', 3); }
    }
  }
  if (e.cdC <= 0) {
    e.cdC = 11;
    if (inimigos.filter(o => !o.boss && !o.morto).length < 4) for (let k = 0; k < 2; k++) invocar('sombra', e, 80);
  }
  // mantém-se a meia distância
  if (d > 280) return { vx: ru.x * e.vel, vy: ru.y * e.vel };
  if (d < 170) return { vx: -ux * e.vel, vy: -uy * e.vel };
  return { vx: -uy * e.vel * 0.5, vy: ux * e.vel * 0.5 };
}

function desenharAvisosBoss(e, t) {
  const L = e.lasersB;
  if (!L) return;
  for (const a0 of L.angs) {
    const a = L.base + a0, comp = comprimentoRaio(e.x, e.y, a);
    ctx.beginPath();
    ctx.moveTo(alinhar(e.x), alinhar(e.y - 8));
    ctx.lineTo(alinhar(e.x + Math.cos(a) * comp), alinhar(e.y + Math.sin(a) * comp));
    if (L.fase === 'mirar') {
      ctx.strokeStyle = `rgba(255,60,90,${0.3 + 0.4 * Math.abs(Math.sin(t * 20))})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(180,77,255,0.85)';
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------
//  Conquistas novas
// ---------------------------------------------------------------------
function conquistasAoMatar(e) {
  const k = contar('matou');
  if (k >= 500) desbloquear('matar500');
  if (k >= 2000) desbloquear('matar2000');
  if (e.nv === 3 && contar('campeoes') >= 25) desbloquear('campeoes');
  if (classeArma(J.arma) === 'arco' && contar('arco') >= 100) desbloquear('arqueiro');
  if (e.tipo === 'goblin' && e.roubou) desbloquear('ladrao');
  if (temRel('dente') && !e.boss) J.hp = Math.min(S.maxHp, J.hp + S.maxHp * 0.02);
}

function conquistasAoDescer() {
  if (andar >= 30) desbloquear('andar30');
  if (andar >= 40) desbloquear('andar40');
  if (andar >= 50) desbloquear('andar50');
  if (andar >= 10 && J.dificuldade === 'inferno') desbloquear('inferno');
  if (andar === 10) {
    if (!meta.racas10) meta.racas10 = {};
    meta.racas10[J.raca] = true;
    salvarMeta();
    if (Object.keys(meta.racas10).length >= 5) desbloquear('racas');
  }
  if (temRel('frasco') && andar > 1) { J.pocoes++; texto(J.x, J.y - 30, '+1 Poção (Frasco Eterno)', '#ff6b8a', 14); }
  J.levouDanoBoss = false;
}

function conquistaPetLivre(id) {
  if (!meta.petsLivres) meta.petsLivres = {};
  meta.petsLivres[id] = true;
  salvarMeta();
  if (Object.keys(meta.petsLivres).length >= 4) desbloquear('tratador');
}

criarSpritesConteudo();
