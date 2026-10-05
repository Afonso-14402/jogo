'use strict';
// =====================================================================
//  ALMAS COMO MOEDA: loja do Altar das Almas, raças e companheiros novos,
//  e títulos
//  - Raças novas (compram-se com almas): Anjo, Demónio e Homem-Lagarto
//  - Companheiros novos (compram-se com almas): Corvo (apanha o ouro de longe)
//    e Golem Pequeno (dá-te um escudo de pedra de vez em quando)
//  - Títulos: ganham-se com conquistas e aparecem por baixo do herói
//  - O Altar das Almas tem 3 separadores: Melhorias, Loja e Títulos
// =====================================================================

// ---------------------------------------------------------------------
//  Raças novas
// ---------------------------------------------------------------------
Object.assign(RACAS, {
  anjo: { nome: 'Anjo', cor: '#fff0a0', desc: 'Asas de luz e uma auréola dourada.', almas: 150,
    bonus: ['Poções curam +20%', '+2 vida por segundo', '+10% velocidade'], contra: ['-15% dano'],
    cura: 0.2, regen: 2, velMov: 0.1, dano: -0.15 },
  demonio: { nome: 'Demónio', cor: '#ff3b3b', desc: 'Chifres, fogo e muito mau feitio.', almas: 200,
    bonus: ['+30% dano', '+10% crítico'], contra: ['-30 vida', 'Poções curam -20%'],
    dano: 0.3, crit: 0.1, hp: -30, cura: -0.2 },
  lagarto: { nome: 'Homem-Lagarto', cor: '#5dff7a', desc: 'Escamas duras e regeneração rápida.', almas: 150,
    bonus: ['+6 defesa', '+3 vida por segundo', 'Imune a veneno'], contra: ['-10% poder mágico'],
    def: 6, regen: 3, imuneVeneno: true, magia: -0.1 },
});
ORDEM_RACAS.push('anjo', 'demonio', 'lagarto');

// Desenho por cima do herói (chamado pelo aplicarRaca do sprites.js)
function aplicarRacaNova(g, raca) {
  if (raca === 'anjo') { // auréola e asas brancas
    for (let x = 5; x <= 10; x++) pixel(g, x, 0, '#ffe680');
    pixel(g, 4, 1, '#ffe680'); pixel(g, 11, 1, '#ffe680');
    for (let y = 8; y <= 11; y++) { pixel(g, 0, y, '#ffffff'); pixel(g, 15, y, '#ffffff'); pixel(g, 1, y + 1, '#e0e8ff'); pixel(g, 14, y + 1, '#e0e8ff'); }
  } else if (raca === 'demonio') { // chifres vermelhos, olhos dourados e cauda
    for (const [x, y] of [[4, 1], [4, 2], [3, 0], [11, 1], [11, 2], [12, 0]]) pixel(g, x, y, '#c02020');
    pixel(g, 6, 5, '#ffe14d'); pixel(g, 9, 5, '#ffe14d');
    pixel(g, 2, 5, '#d04040'); pixel(g, 13, 5, '#d04040');
    for (const [x, y] of [[14, 12], [15, 11], [15, 10]]) pixel(g, x, y, '#a01818');
  } else if (raca === 'lagarto') { // escamas verdes, olhos de réptil e cauda
    for (const [x, y] of [[4, 4], [11, 4], [4, 6], [11, 6], [2, 5], [13, 5], [5, 7], [10, 7]]) pixel(g, x, y, '#4aa83a');
    pixel(g, 6, 5, '#ffe14d'); pixel(g, 9, 5, '#ffe14d');
    for (const [x, y] of [[13, 13], [14, 13], [15, 12]]) pixel(g, x, y, '#3a8a2a');
  }
}

// ---------------------------------------------------------------------
//  Companheiros novos
// ---------------------------------------------------------------------
const CORVO = [
  '....kk......',
  '...kbbk.....',
  '..kbwbbk....',
  '.kyybbbbk...',
  '..kkbbbbbk.k',
  '...kbBbbbkbk',
  '...kbbBbbbk.',
  '....kbbbbk..',
  '.....kyky...',
  '.....k.k....',
];
const PAL_CORVO = { b: '#3a3a4a', B: '#22222e', w: '#ffffff', y: '#ffcf3a' };
const GOLEMZINHO = simetrico([
  '..kkkk',
  '.ksSss',
  'kssess',
  'kSssss',
  '.kkSss',
  'kssSss',
  'ksssSs',
  'kSsssS',
  '.kss.k',
  '.kkk..',
]);
const PAL_GOLEMZINHO = { s: '#9a8a70', S: '#6a5a48', e: '#5dff7a' };
SPR.pet.corvo = [sprite(CORVO, PAL_CORVO)];
SPR.pet.golem = [sprite(GOLEMZINHO, PAL_GOLEMZINHO)];
Object.assign(PETS, {
  corvo: { nome: 'Corvo', desc: 'Voa até ao ouro mais longe e bica os monstros', cor: '#8a8aa0', voa: true, almas: 120 },
  golem: { nome: 'Golem Pequeno', desc: 'Dá-te um escudo de pedra de vez em quando', cor: '#9a8a70', almas: 150 },
});
ORDEM_PETS.push('corvo', 'golem');
Object.assign(PETS_EVOLUIDOS, { corvo: 'Corvo Real', golem: 'Golem Guardião' });

const comprado = id => !!(meta.comprados && meta.comprados[id]);
const racaLivre = id => !RACAS[id] || !RACAS[id].almas || comprado('raca_' + id);
const petLivre = id => !PETS[id] || !PETS[id].almas || comprado('pet_' + id);

// Comportamento (chamado pelo atualizarPetNovo). Devolve true se tratou do companheiro.
function atualizarPetExtra(tipo, alvo, dano, dt) {
  if (tipo === 'corvo') {
    let ouro = null, md = 480;
    for (const d of drops) if (d.tipo === 'ouro' && !d.morto) { const dd = Math.hypot(d.x - J.x, d.y - J.y); if (dd < md) { md = dd; ouro = d; } }
    let tx, ty;
    if (ouro) { tx = ouro.x; ty = ouro.y - 6; }
    else if (alvo) { tx = alvo.x; ty = alvo.y - 20; }
    else { const a = pet.t * 1.8; tx = J.x + Math.cos(a) * 40; ty = J.y - 30 + Math.sin(a) * 10; }
    pet.dir = tx > pet.x ? 1 : -1;
    const k = Math.min(1, dt * (ouro ? 7 : 5));
    pet.x += (tx - pet.x) * k; pet.y += (ty - pet.y) * k;
    if (ouro && Math.hypot(ouro.x - pet.x, ouro.y - pet.y) < 16) {
      ouro.morto = true;
      const v = Math.max(1, Math.round(ouro.valor * S.ouroMult));
      J.ouro += v;
      texto(pet.x, pet.y - 16, `+${v}`, '#ffd23f', 12);
      som(1500, 0.04, 'square', 0.02, 300);
    } else if (!ouro && alvo && Math.hypot(alvo.x - pet.x, alvo.y - pet.y) < alvo.r + 24 && pet.cd <= 0) {
      pet.cd = 0.8;
      danoInimigo(alvo, Math.max(1, Math.round(dano * 0.8)), false, 0, 0);
      som(900, 0.04, 'square', 0.02, -300);
    }
    return true;
  }
  if (tipo === 'golem') {
    const tx = J.x - J.dirX * 30, ty = J.y - J.dirY * 30 + 8;
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy) || 1;
    pet.andando = d > 14;
    if (pet.andando) moverEntidade(mapa, pet, dx / d * 170 * dt, dy / d * 170 * dt);
    if (Math.abs(dx) > 2) pet.dir = dx > 0 ? 1 : -1;
    if (Math.hypot(pet.x - J.x, pet.y - J.y) > 420) { pet.x = J.x - 20; pet.y = J.y + 10; }
    pet.escudoCd = (pet.escudoCd == null ? 3 : pet.escudoCd) - dt;
    if (pet.escudoCd <= 0 && inimigos.some(e => !e.morto && Math.hypot(e.x - J.x, e.y - J.y) < 300)) {
      pet.escudoCd = petEvoluido() ? 6 : 8;
      const q = Math.round(S.maxHp * (0.1 + 0.005 * (J.pet.nivel || 1)));
      J.barreira = Math.max(J.barreira || 0, q); J.barreiraT = 5;
      texto(J.x, J.y - 40, `Escudo de pedra (${q})`, '#c8b890', 13);
      ondas.push({ x: J.x, y: J.y, r: 40, t: 0.4, dur: 0.4, cor: '#c8b890' });
      som(140, 0.2, 'square', 0.04, -40);
    }
    if (alvo && Math.hypot(alvo.x - pet.x, alvo.y - pet.y) < alvo.r + 20 && pet.cd <= 0) {
      pet.cd = 1.2;
      danoInimigo(alvo, Math.round(dano * 1.2), false, 0, 0);
      som(110, 0.1, 'square', 0.03, -30);
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------
//  Loja das almas (no Altar das Almas)
// ---------------------------------------------------------------------
const LOJA_ALMAS = [
  { id: 'raca_anjo', tipo: 'raca', ref: 'anjo' },
  { id: 'raca_demonio', tipo: 'raca', ref: 'demonio' },
  { id: 'raca_lagarto', tipo: 'raca', ref: 'lagarto' },
  { id: 'pet_corvo', tipo: 'pet', ref: 'corvo' },
  { id: 'pet_golem', tipo: 'pet', ref: 'golem' },
];
function infoLoja(o) {
  if (o.tipo === 'raca') { const R = RACAS[o.ref]; return { nome: `Raça: ${R.nome}`, desc: R.desc, preco: R.almas, cor: R.cor }; }
  if (o.tipo === 'pet') { const P = PETS[o.ref]; return { nome: `Companheiro: ${P.nome}`, desc: P.desc, preco: P.almas, cor: P.cor }; }
  return { nome: o.nome, desc: o.desc, preco: o.preco, cor: o.cor };
}
function comprarLoja(o) {
  const I = infoLoja(o);
  if (comprado(o.id)) return { txt: 'Já tens isto', cor: '#aaa' };
  if ((meta.almas || 0) < I.preco) { som(140, 0.2, 'square', 0.04); return { txt: 'Não tens almas suficientes. Joga mais partidas!', cor: '#ff6060' }; }
  meta.almas -= I.preco;
  if (!meta.comprados) meta.comprados = {};
  meta.comprados[o.id] = true;
  salvarMeta();
  fanfarra([523, 659, 784, 1046], 0.04);
  const quando = o.tipo === 'raca' ? 'Escolhe-a ao criar o caçador' : o.tipo === 'pet' ? 'Aparece nas Salas do Companheiro' : 'Já está na tua casa da cidade';
  return { txt: `Comprado: ${traduzir(I.nome)} · ${traduzir(quando)}`, cor: '#5dff7a' };
}

// ---------------------------------------------------------------------
//  Títulos
// ---------------------------------------------------------------------
const TITULOS_HEROI = [
  { id: 'reiSlime', nome: 'Rei dos Slimes', cor: '#5fd35f', como: 'Derrota o Rei Slime', ok: () => !!(meta.trofeus || {}).reiSlime },
  { id: 'dragoes', nome: 'Matador de Dragões', cor: '#ff7b25', como: 'Derrota o Dragão Ancião', ok: () => !!(meta.trofeus || {}).dragao },
  { id: 'semMedo', nome: 'Sem Medo', cor: '#ffe14d', como: 'Derrota um boss sem levar dano', ok: () => !!meta.conquistas.intocavel },
  { id: 'exterminador', nome: 'Exterminador', cor: '#ff5050', como: 'Mata 500 monstros', ok: () => !!meta.conquistas.matar500 },
  { id: 'lenda', nome: 'Lenda da Matança', cor: '#ff3b3b', como: 'Mata 2000 monstros', ok: () => !!meta.conquistas.matar2000 },
  { id: 'milionario', nome: 'Milionário', cor: '#ffd23f', como: 'Tem 1000 ouro ao mesmo tempo', ok: () => !!meta.conquistas.rico },
  { id: 'mimicos', nome: 'Caça-Mímicos', cor: '#c98a4a', como: 'Mata 5 mímicos', ok: () => !!meta.conquistas.mimicos },
  { id: 'sombras', nome: 'Rei das Sombras', cor: '#8a6aff', como: 'Tem 10 sombras no exército', ok: () => !!meta.conquistas.exercito },
  { id: 'cidade', nome: 'Herói da Cidade', cor: '#4dc3ff', como: 'Cumpre 3 missões da Capitã Vera', ok: () => (meta.contadores.missoesCidade || 0) >= 3 },
  { id: 'enigmas', nome: 'Mestre dos Enigmas', cor: '#4dc3ff', como: 'Resolve 5 enigmas', ok: () => (meta.contadores.enigmas || 0) >= 5 },
  { id: 'duendes', nome: 'Caçador de Ouro', cor: '#ffd23f', como: 'Apanha 3 Duendes Dourados', ok: () => (meta.contadores.duendes || 0) >= 3 },
  { id: 'torre', nome: 'Senhor da Torre', cor: '#ffae00', como: 'Conquista os 100 andares da Torre', ok: () => !!meta.conquistas.torre100 },
  { id: 'bosses', nome: 'Caçador de Bosses', cor: '#ff8080', como: 'Completa o Boss Rush', ok: () => !!meta.conquistas.bossrush },
  { id: 'vazio', nome: 'Vencedor do Vazio', cor: '#b44dff', como: 'Derrota o Soberano do Vazio', ok: () => !!meta.conquistas.final },
  { id: 'abismo', nome: 'Sem Fundo', cor: '#9fdcff', como: 'Chega ao andar 100', ok: () => !!meta.conquistas.fundo100 },
  { id: 'dupla', nome: 'Dupla Imbatível', cor: '#5dff7a', como: 'Derrotem um boss a jogar a 2', ok: () => !!meta.conquistas.coopBoss },
];
const tituloAtual = () => TITULOS_HEROI.find(t => t.id === meta.titulo && t.ok()) || null;

// Avisa quando ganhas um título novo (chamado ao descer de andar e ao morrer)
function verificarTitulosNovos() {
  if (!meta.titulosVistos) meta.titulosVistos = {};
  for (const T of TITULOS_HEROI) {
    if (meta.titulosVistos[T.id] || !T.ok()) continue;
    meta.titulosVistos[T.id] = true;
    avisar(`Título novo: ${traduzir(T.nome)}`, 'Escolhe-o no Altar das Almas (separador Títulos)', T.cor);
    salvarMeta();
  }
}

// O título por baixo do herói (no ecrã, por cima do mundo)
function desenharTituloHeroi() {
  const T = tituloAtual();
  if (!T || !J || J.remoto || !['jogo', 'convidado'].includes(estado)) return;
  textoCentro(T.nome, ecraX(J.x), ecraY(J.y) + 30 * ZOOM, 10, T.cor);
}

// ---------------------------------------------------------------------
//  Separadores do Altar das Almas
// ---------------------------------------------------------------------
const ABAS_ALMAS = ['melhorias', 'loja', 'titulos'];
const NOMES_ABAS_ALMAS = { melhorias: 'Melhorias', loja: 'Loja', titulos: 'Títulos' };
const retAbaAlmas = i => ({ x: 640 + i * 102, y: 14, w: 96, h: 36 });
const retLoja = i => ({ x: 26 + (i % 4) * 228, y: 108 + Math.floor(i / 4) * 112, w: 220, h: 104 });
const retTitulo = i => ({ x: 40 + (i % 2) * 450, y: 112 + Math.floor(i / 2) * 58, w: 430, h: 50 });

// Devolve true se tratou do menu (o separador não é o das melhorias)
function atualizarAbasAlmas() {
  if (!menuMeta.aba) menuMeta.aba = 'melhorias';
  ABAS_ALMAS.forEach((a, i) => { if (clicou(retAbaAlmas(i))) { menuMeta.aba = a; menuMeta.sel = 0; som(700, 0.05, 'square', 0.02); } });
  if (premiu('tab')) { menuMeta.aba = ABAS_ALMAS[(ABAS_ALMAS.indexOf(menuMeta.aba) + 1) % ABAS_ALMAS.length]; menuMeta.sel = 0; }
  if (menuMeta.aba === 'loja') {
    lojaAlmasVisivel().forEach((o, i) => {
      if (dentro(retLoja(i))) menuMeta.sel = i;
      if (!(premiu(String(i + 1)) || clicou(retLoja(i)))) return;
      menuMeta.sel = i;
      const r = comprarLoja(o);
      menuMeta.msg = { txt: r.txt, cor: r.cor, t: 2.5 };
    });
    return true;
  }
  if (menuMeta.aba === 'titulos') {
    TITULOS_HEROI.forEach((T, i) => {
      if (dentro(retTitulo(i))) menuMeta.sel = i;
      if (!clicou(retTitulo(i))) return;
      if (!T.ok()) { menuMeta.msg = { txt: `Ainda não tens este título: ${traduzir(T.como)}`, cor: '#aaa', t: 2.5 }; return; }
      meta.titulo = meta.titulo === T.id ? null : T.id;
      salvarMeta();
      som(800, 0.08, 'triangle', 0.03);
    });
    return true;
  }
  return false;
}
const lojaAlmasVisivel = () => LOJA_ALMAS.slice(0, 15);

function desenharAbasAlmas() {
  ABAS_ALMAS.forEach((a, i) => {
    const r = retAbaAlmas(i), sel = (menuMeta.aba || 'melhorias') === a;
    painel(r.x, r.y, r.w, r.h, sel ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#b48cff' : dentro(r) ? '#ffffff' : '#3a3150');
    textoCentroAjustado(NOMES_ABAS_ALMAS[a], r.x + r.w / 2, r.y + r.h / 2 + 1, 14, sel ? '#b48cff' : '#aaa', r.w - 10);
  });
}

// Devolve true se desenhou (separadores Loja e Títulos)
function desenharLojaAlmas(t) {
  desenharAbasAlmas();
  if ((menuMeta.aba || 'melhorias') === 'melhorias') return false;
  textoCentro('ALTAR DAS ALMAS', LARGURA / 2 - 40, 34, 30, '#b48cff');
  if (menuMeta.aba === 'loja') {
    sprEcra(ART.alma, LARGURA / 2 - 190, 80, 2);
    textoCentro(`Tens ${meta.almas} almas  ·  O que comprares fica teu para sempre`, LARGURA / 2, 80, 13, '#ddd', false);
    lojaAlmasVisivel().forEach((o, i) => {
      const r = retLoja(i), I = infoLoja(o), tem = comprado(o.id), sel = menuMeta.sel === i || dentro(r);
      painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? I.cor : tem ? '#3a6a3a' : '#3a3150');
      // ícone num quadrado escuro
      px(r.x + 8, r.y + 10, 60, 60, 'rgba(0,0,0,0.35)'); px(r.x + 8, r.y + 10, 60, 3, I.cor);
      const c = o.tipo === 'raca' ? framesHeroi(o.ref, escolhaSkin)[Math.floor(t * 3) % 2] : o.tipo === 'pet' ? SPR.pet[o.ref][0] : null;
      if (c) sprEcra(c, r.x + 38, r.y + 42, 3);
      else if (o.movel) { const m = ART.moveis[o.movel]; const mc = Array.isArray(m) ? m[Math.floor(t * 6) % 2] : m; sprEcra(mc, r.x + 38, r.y + 42, ladoSpr(mc) > 16 ? 2 : 3); }
      const tipo = { raca: 'Raça', pet: 'Companheiro', movel: 'Móvel' }[o.tipo];
      textoEsq(tipo, r.x + 76, r.y + 16, 10, '#999', 'normal');
      textoEsqAjustado(traduzir(I.nome).replace(/^[^:]*:\s*/, ''), r.x + 76, r.y + 34, 14, I.cor, r.w - 84);
      textoEsqAjustado(I.desc, r.x + 76, r.y + 56, 10, '#ccc', r.w - 84, 'normal');
      if (tem) textoEsq('✔ COMPRADO', r.x + 76, r.y + r.h - 16, 12, '#5dff7a');
      else precoAlmas(I.preco, r.x + 76, r.y + r.h - 16, 14, (meta.almas || 0) >= I.preco ? '#b48cff' : '#ff6060');
    });
  } else {
    const T0 = tituloAtual();
    textoCentro(T0 ? `Título em uso: ${traduzir(T0.nome)} (toca outra vez para tirar)` : 'Ganha títulos com conquistas e escolhe um para aparecer por baixo do teu herói', LARGURA / 2, 80, 13, '#aaa', false);
    TITULOS_HEROI.forEach((T, i) => {
      const r = retTitulo(i), ok = T.ok(), usa = meta.titulo === T.id && ok, sel = menuMeta.sel === i;
      painel(r.x, r.y, r.w, r.h, usa ? 'rgba(50,42,72,0.97)' : sel ? 'rgba(36,30,54,0.97)' : 'rgba(18,14,28,0.95)', usa ? T.cor : ok ? '#4a4060' : '#2a2438');
      sprEcra(ok ? ART.medalha : ART.cadeado, r.x + 24, r.y + r.h / 2, 3);
      if (ok) { ctx.globalAlpha = 0.25; px(r.x + 2, r.y + 2, 4, r.h - 4, T.cor); ctx.globalAlpha = 1; }
      textoEsqAjustado(ok ? T.nome : '???', r.x + 46, r.y + 17, 15, ok ? T.cor : '#555', 240);
      textoEsqAjustado(T.como, r.x + 46, r.y + 36, 11, ok ? '#ccc' : '#777', 300, 'normal');
      if (usa) textoDir('EM USO', r.x + r.w - 12, r.y + r.h / 2, 13, T.cor);
      else if (ok) textoDir('Usar', r.x + r.w - 12, r.y + r.h / 2, 13, '#aaa');
    });
  }
  if (menuMeta.msg) textoCentroAjustado(menuMeta.msg.txt, LARGURA / 2, 606, 16, menuMeta.msg.cor, 880);
  return true;
}
