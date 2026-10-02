'use strict';
// =====================================================================
//  ARTE NOVA: sprites em pixel art (com contorno, como o resto do jogo)
//  para as coisas das cidades, armadilhas, enigmas, minijogos e ícones.
//  Cada letra é uma cor da paleta; '.' é transparente.
// =====================================================================

// Sprite com contorno automático (acrescenta 1 pixel de margem à volta)
function spriteC(linhas, pal, contorno = CONTORNO) {
  const w = Math.max(...linhas.map(l => l.length));
  const pad = ['.'.repeat(w + 2)].concat(linhas.map(l => '.' + l.padEnd(w, '.') + '.'), ['.'.repeat(w + 2)]);
  return gradeParaCanvas(contornar(gradeDeLinhas(pad, pal), contorno));
}
const ART = {};

// ---------------------------------------------------------------------
//  Cidade
// ---------------------------------------------------------------------
const BANCA_L = [
  'aawwaawwaawwaawwaawwaa',
  'aawwaawwaawwaawwaawwaa',
  'AAWWAAWWAAWWAAWWAAWWAA',
  '.A.W..W.A..A.W..W.A.A.',
  '.p..................p.',
  '.p..................p.',
  '.p.rr.gg..yy.cc..mm.p.',
  '.p.rR.gG..yY.cC..mM.p.',
  'ttttttttttttttttttttt',
  'TTTTTTTTTTTTTTTTTTTTT',
  '.bbbbbbbbbbbbbbbbbbb.',
  '.bBbbBbbBbbBbbBbbBbb.',
  '.bbbbbbbbbbbbbbbbbbb.',
  '.bBbbBbbBbbBbbBbbBbb.',
  '.BBBBBBBBBBBBBBBBBBB.',
  '.p.................p.',
];
const cacheBanca = {};
function spriteBanca(cor) {
  if (!cacheBanca[cor]) cacheBanca[cor] = spriteC(BANCA_L, { a: cor, A: escurecer(cor, 0.3), w: '#f4ecd8', W: '#c8bea8', p: '#6a4a2a', r: '#e04848', R: '#a02828', g: '#5dcf4a', G: '#3a8a2a',
    y: '#ffd23f', Y: '#c99a2e', c: '#4dc3ff', C: '#2a7ab0', m: '#b44dff', M: '#7a2ac0', t: '#b08050', T: '#7a5230', b: '#9a6a3a', B: '#6a4422' });
  return cacheBanca[cor];
}

const PEDRA_L = [
  '....SSSS....',
  '...SssssS...',
  '..SsssssSS..',
  '..SssrssSS..',
  '.SsssrrssSS.',
  '.SssrrrrsSS.',
  '.SsssrrssSS.',
  '.SssssrssSS.',
  '.SsssrrrsSS.',
  '.SssrsssrSS.',
  '.SsssssssSS.',
  'SssssssssSSS',
  'SsssssrssSSS',
  'SssssrrrsSSS',
  'SSssssssSSSS',
  'gGGGGGGGGGGg',
  'gggggggggggg',
];
ART.pedra = ['#a070ff', '#e8d0ff'].map(r => spriteC(PEDRA_L, { s: '#7a7088', S: '#4e4660', r, g: '#5a5468', G: '#3a3448' }));

ART.arena = spriteC([
  '..SSSSSSSSSSSSSSSSSSSSSSSS..',
  '.SssssssssssssssssssssssssS.',
  'SsSSsSSsSSsSSsSSsSSsSSsSSsSS',
  'SssssssssssssssssssssssssssS',
  'SSSSsskkkkkkkkkkkkkkkkssSSSS',
  'SsssskDDDDDDDDDDDDDDDDksssSS',
  'SSrrkDDiDDiDDiDDiDDiDDDkrrSS',
  'SsryDDDiDDiDDiDDiDDiDDDDyrsS',
  'SSrrDDDiDDiDDiDDiDDiDDDDrrSS',
  'SsrrDiiiiiiiiiiiiiiiiiiDrrsS',
  'SSrrDDDiDDiDDiDDiDDiDDDDrrSS',
  'SsrrDDDiDDiDDiDDiDDiDDDDrrsS',
  'SS.rDDDiDDiDDiDDiDDiDDDDr.SS',
  'SsssDDDiDDiDDiDDiDDiDDDDsssS',
  'SSssDDDiDDiDDiDDiDDiDDDDssSS',
  'SsssDDDiDDiDDiDDiDDiDDDDsssS',
  'SSssDDDIDDIDDIDDIDDIDDDDssSS',
  'SsssDDDDDDDDDDDDDDDDDDDDsssS',
  'GGGGDDDDDDDDDDDDDDDDDDDDGGGG',
  'gggggggggggggggggggggggggggg',
], { s: '#9a9088', S: '#6e655e', D: '#1a1218', i: '#7a7488', I: '#c0c8d8', r: '#c03030', y: '#ffd23f', g: '#5a524c', G: '#3e3832' });

ART.cais = spriteC([
  '...................c.',
  '..................c..',
  '.................c...',
  '................c....',
  '...............c.....',
  '..............c......',
  '.............c.......',
  '............c........',
  'ppppppppppppcpppppppp',
  'PpPPpPPpPPpPPpPPpPPpP',
  'ppppppppppppppppppppp',
  '.P...P...P...P...P...',
  '.P...P...P...P...P...',
  '.w...w...w...w...w...',
], { p: '#b08050', P: '#7a5230', c: '#8a6a3a', w: '#4d9fff' });

// lago gelado debaixo do cais
ART.lago = spriteC(Array.from({ length: 12 }, (_, y) => Array.from({ length: 30 }, (_, x) => {
  const d = ((x - 14.5) / 15) ** 2 + ((y - 5.5) / 6) ** 2;
  return d > 1 ? '.' : d > 0.7 ? 'i' : (y === 4 && x % 7 < 3) || (y === 8 && (x + 3) % 9 < 3) ? 'b' : y < 5 ? 'a' : 'A';
}).join('')), { i: '#e8f4ff', a: '#4d9fdf', A: '#2a6aa8', b: '#bfe6ff' });

ART.pistaSapos = spriteC([
  '.....pppppppppp.....',
  '....pyyyyyyyyyyp....',
  '....pygggyyyyyyp....',
  '....pyggGgyyyyyp....',
  '....pyggggyRRRyp....',
  '....pyyyyyyyRyyp....',
  '....pppppppppppp....',
  '.........pp.........',
  'llllllllllllllllllll',
  'LgLLLLLLLLLLLLLLLLwL',
  'llllllllllllllllllwl',
  'LLLLLLLLLbLLLLLLLLwL',
  'llllllllllllllllllll',
], { p: '#7a5230', y: '#f0dca0', g: '#5dcf4a', G: '#ffffff', R: '#e04848', l: '#4a7a34', L: '#3e6a2c', w: '#ffffff', b: '#4dc3ff' });

// ---------------------------------------------------------------------
//  Enigmas
// ---------------------------------------------------------------------
ART.jaula = spriteC([
  'mmmmmmmmmmmmmmmmmm',
  'MMMMMMMMMMMMMMMMMM',
  '.m..m..m..m..m..m.',
  '.m..m..m..m..m..m.',
  '.m..m..m..m..m..m.',
  '.m.ymmymmymmymm.m.',
  '.m.yyyyyyyyyyyy.m.',
  '.m.YYYYYmmYYYYY.m.',
  '.m.bbbbbmmbbbbb.m.',
  '.m.bbbbbbbbbbbb.m.',
  '.m.bBbbbbbbbbBb.m.',
  '.m.BBBBBBBBBBBB.m.',
  'mmmmmmmmmmmmmmmmmm',
  'MMMMMMMMMMMMMMMMMM',
], { m: '#8a93a8', M: '#5a6478', y: '#ffd23f', Y: '#c99a2e', b: '#b07a3a', B: '#7a5226' });

const PLACA_L = [
  'SSSSSSSSSSSS',
  'SppppppppppS',
  'SpPPPPPPPPpS',
  'SpPccccccPpS',
  'SpPcPPPPcPpS',
  'SpPcPccPcPpS',
  'SpPcPccPcPpS',
  'SpPcPPPPcPpS',
  'SpPccccccPpS',
  'SpPPPPPPPPpS',
  'SppppppppppS',
  'SSSSSSSSSSSS',
];
ART.placa = [spriteC(PLACA_L, { S: '#3a3448', p: '#6a6478', P: '#55506a', c: '#7a7488' }), spriteC(PLACA_L, { S: '#2a5a7a', p: '#4dc3ff', P: '#2a8ac0', c: '#bfe6ff' })];

const ALAVANCA_E = [
  '..h.......',
  '..hh......',
  '...ss.....',
  '....ss....',
  '.....ss...',
  '......s...',
  '..bbbbbbb.',
  '.bBBBBBBBb',
  '.bBcccccBb',
  '.bbbbbbbbb',
];
ART.alavanca = [spriteC(ALAVANCA_E, { h: '#e04848', s: '#9a9aa8', b: '#5a5468', B: '#3a3448', c: '#7a7488' }),
  spriteC(ALAVANCA_E.map(l => l.split('').reverse().join('')).map((l, i) => (i < 2 ? l : l)), { h: '#5dff7a', s: '#9a9aa8', b: '#5a5468', B: '#3a3448', c: '#5dff7a' })];

// estátua que se roda: de frente, de costas e de lado (os olhos mostram para onde olha)
const ESTATUA_FRENTE = [
  '...ssss...',
  '..ssssss..',
  '..seSSes..',
  '..ssssss..',
  '...ssss...',
  '..ssssss..',
  '.ssSssSss.',
  '.ss.ss.ss.',
  '.ssssssss.',
  '..ssssss..',
  '..ss..ss..',
  'gggggggggg',
  'gGGGGGGGGg',
];
const ESTATUA_COSTAS = ESTATUA_FRENTE.map((l, i) => (i === 2 ? '..ssssss..' : l));
const ESTATUA_LADO = [
  '...ssss...',
  '..sssssS..',
  '..sssse...',
  '..ssssss..',
  '...ssss...',
  '..ssssss..',
  '.ssSssss..',
  '.ss.sss...',
  '.ssssss...',
  '..ssssss..',
  '..ss..ss..',
  'gggggggggg',
  'gGGGGGGGGg',
];
function palEstatua(certa) { return { s: '#9a94a8', S: '#6a6478', e: certa ? '#5dff7a' : '#ffd23f', g: '#5a5468', G: '#3a3448' }; }
ART.estatua = [false, true].map(c => ({ frente: spriteC(ESTATUA_FRENTE, palEstatua(c)), costas: spriteC(ESTATUA_COSTAS, palEstatua(c)), lado: spriteC(ESTATUA_LADO, palEstatua(c)) }));

// ---------------------------------------------------------------------
//  Armadilhas
// ---------------------------------------------------------------------
ART.chao = [
  sprite([
    '................',
    '..k.............',
    '...k......k.....',
    '....kk...k......',
    '......k.k.......',
    '.......k........',
    '......kk........',
    '.....k..kk......',
    '....k.....k..k..',
    '...........kk...',
    '.....k.....k....',
    '......kk..k.....',
    '........kk......',
    '..........k.....',
    '................',
    '................',
  ], { k: '#0c0810' }),
  sprite([
    '..d.........d...',
    '..k...d.........',
    '...k......k..d..',
    '.d..kk...k......',
    '......kkkk...d..',
    '..d....kk.......',
    '......kkkk......',
    '.....k.kk.kk..d.',
    '....k..kk.k..k..',
    '..d....k...kk...',
    '.....k.kk..k....',
    '......kk..k...d.',
    '..d.....kk......',
    '..........k..d..',
    '.....d..........',
    '................',
  ], { k: '#140a0a', d: '#ffc896' }),
  sprite([ // o buraco: borda partida, parede de dentro e o fundo escuro
    '..ee.eeeeee.ee..',
    '.eEEeEEEEEEeEEe.',
    'eEwwwwwwwwwwwwEe',
    'eEWWWWWWWWWWWWEe',
    'eWnnnnnnnnnnnnWe',
    'eWnnnnnnnnnnnnWe',
    '.Wnnnnnnnnnnnnne',
    'eWnnnnnnnnnnnnWe',
    'eWnnnnnnnnnnnnW.',
    'eWnnnnnnnnnnnnWe',
    'eWnnnnnnnnnnnnWe',
    '.Wnnnnnnnnnnnnne',
    'eWnnnnnnnnnnnnWe',
    'eEWnnnnnnnnnnWEe',
    '.eEEEEEEEEEEEEe.',
    '..ee.eeeee.eee..',
  ], { e: '#4a4054', E: '#2a2230', w: '#3a3046', W: '#1c1622', n: '#050307' }),
];
// grelha da parede e a lança (a apontar para baixo; roda-se para os outros lados)
ART.grelhaLanca = spriteC([
  'GGGGGGGGGGGGGG',
  'GkGGGkGGGGkGGG',
  'GkGGGkGGGGkGGG',
], { G: '#4a4458', k: '#0a0810' });
ART.lancas = spriteC([
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  '.p....p....p..',
  'sss..sss..sss.',
  'sss..sss..sss.',
  '.s....s....s..',
], { p: '#8a6a4a', s: '#d8dce8' });
ART.pontas = spriteC([
  '.w....w....w..',
  'www..www..www.',
], { w: '#ffffff' });
ART.grelhaGas = spriteC([
  'GGGGGGGGGG',
  'GkkkkkkkkG',
  'GggggggggG',
  'GkkkkkkkkG',
  'GggggggggG',
  'GkkkkkkkkG',
  'GggggggggG',
  'GGGGGGGGGG',
], { G: '#4a5a40', g: '#6a8a4a', k: '#1a2414' });
ART.nuvemGas = sprite([
  '.....gggg...........',
  '...ggGGGGgg...gggg..',
  '..gGGGGGGGGg.gGGGGg.',
  '.gGGGLLGGGGGgGGGGGGg',
  'gGGGLLLLGGGGGGGLLGGg',
  'gGGGGLLGGGGGGGLLLLGg',
  '.gGGGGGGGGGGGGGLLGGg',
  '..ggGGGGGGgGGGGGGgg.',
  '....gggggg.gggggg...',
], { g: '#5ac846', G: '#6ee650', L: '#c8ffaa' }); // desenha-se meio transparente

// ---------------------------------------------------------------------
//  Duende Dourado (o goblin com outra paleta, a brilhar)
// ---------------------------------------------------------------------
ART.duende = sprite(GOBLIN, Object.assign({}, PAL_GOBLIN, { g: '#ffd23f', G: '#c99a2e', y: '#ffffff', b: '#e8a83a', B: '#a0661a', s: '#fff0a0' }));

// ---------------------------------------------------------------------
//  Árvores e decoração das cidades
// ---------------------------------------------------------------------
const pinheiro = [
  '.......w.......',
  '......wGw......',
  '.....wGGGw.....',
  '....wGGgGGw....',
  '.....GGgGG.....',
  '....wGGGGGw....',
  '...wGGgGGgGw...',
  '..wGGGGGGGGGw..',
  '....GGGgGGG....',
  '...wGGGGGGGGw..',
  '..GGGgGGGGgGGG.',
  '.wGGGGGGgGGGGGw',
  '.GGGGgGGGGGGgGG',
  '......ttt......',
  '......tTt......',
  '......tTt......',
];
const morta = [
  '..b.......b....',
  '..bb.....bb..b.',
  '...b..b..b..bb.',
  '...bb.b.bb.bb..',
  '....bbbbb.bb...',
  '.b...bbbbbb....',
  '.bb...bbbb.....',
  '..bbb.bbb......',
  '....bbbbb......',
  '......bbb......',
  '......bBb......',
  '......bBb......',
  '.....bbBbb.....',
  '....bb.B.bb....',
];
const rocha = [
  '.....rrrrr.....',
  '...rrRrrrrrr...',
  '..rRrrrrrorrr..',
  '.rRrrrrroorrrr.',
  '.rrrrrrooorrrr.',
  'rRrrrorrorrrrRr',
  'rrrrroorrrrrrRr',
  'rrrrrrorrrrRRRr',
  '.RrrrrrrrRRRRR.',
  '..RRRRRRRRRRR..',
];
const salgueiro = [
  '....GGGGGGG....',
  '..GGgGGGGGgGG..',
  '.GGGGGgGGGGGGG.',
  'GGgGGGGGGGGgGGG',
  'GGGGgGGGGgGGGGG',
  'G.G.GGGtGGG.G.G',
  'G.G.G.ttt.G.G.G',
  'G.G...tTt...G.G',
  '..G...tTt...G..',
  '......tTt......',
  '.....ttTtt.....',
];
const palmeira = [
  '...GGG...GGG...',
  '.GGgGGG.GGgGGG.',
  'GG....GGG....GG',
  'G...GGGcGGG...G',
  '...GG.ccc.GG...',
  '..G....t....G..',
  '.......tT......',
  '.......tT......',
  '......tT.......',
  '......tT.......',
  '......tT.......',
  '.......tT......',
  '.......tT......',
  '......ttTt.....',
];
const cristal = [
  '......w........',
  '.....waw.......',
  '.....aaa...w...',
  '....waAa..waw..',
  '....aaAa..aaa..',
  '.w..aaAa.waAa..',
  'waw.aaAa.aaAa..',
  'aaa.aaAaaaaAa..',
  'aAa.aaAaaaaAa..',
  'aAaaaaAaaaaAaw.',
  'aAaaaaAaaaaAaaa',
  'ccccccccccccccc',
];
const obelisco = [
  '.......o.......',
  '......ooo......',
  '......oOo......',
  '.....ooOoo.....',
  '.....oRoOo.....',
  '.....ooOoo.....',
  '.....oRoOo.....',
  '.....ooOoo.....',
  '.....oRoOo.....',
  '.....ooOoo.....',
  '.....ooOoo.....',
  '....oooOooo....',
  '...ccccccccc...',
];
const coluna = [
  '...yyyyyyyyy...',
  '...YYYYYYYYY...',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '....wwWwwWw....',
  '...yyyyyyyyy...',
  '..YYYYYYYYYYY..',
];
const ruina = [
  '.rr............',
  '.rrrr....rr....',
  '.rRrr...rrrr...',
  '.rrrrr..rRrr...',
  '.rrRrrrrrrrrr..',
  '.rrrrrRrrrrRr..',
  '.rRrrrrrrRrrr..',
  '.rrrrrrrRrrrr..',
  '.RRRRRRRRRRRR..',
  '...m....m......',
];
const PAL_ARVORES = {
  arvore: null,
  pinheiro: { G: '#2a5a4a', g: '#3a7a5a', w: '#e8f4ff', t: '#6a4a2a', T: '#4a321a' },
  morta: { b: '#5a4a42', B: '#3a2e28' },
  rocha: { r: '#5a4a44', R: '#3a2e2a', o: '#ff7b25' },
  salgueiro: { G: '#3a6a30', g: '#4e8a3e', t: '#5a3a1a', T: '#3a2410' },
  palmeira: { G: '#3a8a2a', g: '#5aaa3a', c: '#8a5a2a', t: '#a07a4a', T: '#7a5a32' },
  cristal: { w: '#ffffff', a: '#9fdcff', A: '#5aa8e0', c: '#4a4a7a' },
  obelisco: { o: '#2a2036', O: '#1a1424', R: '#d08aff', c: '#3a2e4a' },
  coluna: { w: '#f4f0e0', W: '#d8d0b8', y: '#ffe14d', Y: '#c99a2e' },
  ruina: { r: '#6e5a5a', R: '#4a3a3a', m: '#5a7a3a' },
};
ART.arvores = {};
for (const [id, l] of Object.entries({ pinheiro, morta, rocha, salgueiro, palmeira, cristal, obelisco, coluna, ruina })) ART.arvores[id] = spriteC(l, PAL_ARVORES[id]);
ART.arvores.arvore = spriteC([
  '.....GGGGG.....',
  '...GGgGGGgGG...',
  '..GGGGGGGGGGG..',
  '.GGgGGGGGgGGGG.',
  '.GGGGGgGGGGGgG.',
  'GGgGGGGGGGgGGGG',
  'GGGGGgGGGGGGGgG',
  '.GGGGGGGgGGGGG.',
  '..GGgGGGGGGGG..',
  '....GGGtGGG....',
  '......tTt......',
  '......tTt......',
  '.....ttTtt.....',
], { G: '#2f6a2a', g: '#4a9a3a', t: '#6a4a2a', T: '#4a321a' });

// ---------------------------------------------------------------------
//  Móveis (casa e loja)
// ---------------------------------------------------------------------
ART.moveis = {
  cama: spriteC([
    'WW..............',
    'WWww............',
    'WwwwRRRRRRRRRRRR',
    'WwwwRrrrrrrrrrrR',
    'WbbbRrrrrrrrrrrR',
    'bbbbbbbbbbbbbbbb',
    'BBBBBBBBBBBBBBBB',
    'B..............B',
  ], { W: '#c8bea8', w: '#f4ecd8', R: '#a02828', r: '#d04a4a', b: '#9a6a3a', B: '#6a4422' }),
  tapete: spriteC([
    'yryryryryryryryryr',
    'rmmmmmmmmmmmmmmmmr',
    'ymyyyyyyyyyyyyyymy',
    'rmyMMMMMMMMMMMMymr',
    'ymyyyyyyyyyyyyyymy',
    'rmmmmmmmmmmmmmmmmr',
    'yryryryryryryryryr',
  ], { y: '#ffcf3a', r: '#a02828', m: '#7a2ac0', M: '#b44dff' }),
  planta: spriteC([
    '...g..G...',
    '..gG.gG.g.',
    '.gGG.GGgG.',
    '..gGgGgG..',
    '...GgGG...',
    '....gG....',
    '..pppppp..',
    '..PpppPP..',
    '...pppP...',
    '...PPPP...',
  ], { g: '#5dcf4a', G: '#3a8a2a', p: '#c06a3a', P: '#8a4422' }),
  estante: spriteC([
    'bbbbbbbbbbbbbb',
    'bBBBBBBBBBBBBb',
    'bBrrcyymmgrcBb',
    'bBrrcyymmgrcBb',
    'bbbbbbbbbbbbbb',
    'bBgmmrcyycgrBb',
    'bBgmmrcyycgrBb',
    'bbbbbbbbbbbbbb',
    'bBycrrgmmyycBb',
    'bBycrrgmmyycBb',
    'bbbbbbbbbbbbbb',
    'b............b',
  ], { b: '#7a5230', B: '#4a321a', r: '#d04a4a', c: '#4dc3ff', y: '#ffd23f', m: '#b44dff', g: '#5dcf4a' }),
  lareira: [0, 1].map(f => spriteC([
    'SSSSSSSSSSSSSS',
    'ssssssssssssss',
    'sSSSSSSSSSSSSs',
    'sS..........Ss',
    'sS..........Ss',
    'sS....' + (f ? 'oy' : 'yo') + '....Ss',
    'sS...' + (f ? 'oyyo' : 'yooy') + '...Ss',
    'sS..oyyyyo..Ss',
    'sS.lllllllll.s',
    'ssssssssssssss',
  ], { S: '#8a8498', s: '#6a6478', o: '#ff7b25', y: '#ffe14d', l: '#5a3a1a' })),
  armas: spriteC([
    'bbbbbbbbbbbbbb',
    '.w...w....w...',
    '.w...w...www..',
    '.w...w....w...',
    '.w..www...w...',
    '.w...w....w...',
    'www..w....w...',
    '.h...h....h...',
    '.h...h....h...',
    'bbbbbbbbbbbbbb',
  ], { b: '#6a4422', w: '#d8dce8', h: '#8a6a4a' }),
  quadro: spriteC([
    'yyyyyyyyyyyy',
    'yYYYYYYYYYYy',
    'yYssssssssYy',
    'yYsssffsssYy',
    'yYssffffssYy',
    'yYsssffsssYy',
    'yYssbbbbssYy',
    'yYsbbbbbbsYy',
    'yYYYYYYYYYYy',
    'yyyyyyyyyyyy',
  ], { y: '#ffd23f', Y: '#c99a2e', s: '#3a5a8a', f: '#f1c8a0', b: '#3d7bd8' }),
  aquario: spriteC([
    'wwwwwwwwwwwwwwww',
    'aaaaaaaaaaaaaaaa',
    'aaaaoaaaaaaaaaaa',
    'aaaooOaaaaaaaaaa',
    'aaaaoaaaaaayaaaa',
    'aaaaaaaaaayyYaaa',
    'aaaaaaaaaaayaaaa',
    'aaGaaaaaaaaaaGaa',
    'aGGaGaaaaaaaGGaa',
    'ssssssssssssssss',
    'SSSSSSSSSSSSSSSS',
  ], { w: '#e0f4ff', a: '#7fc8f0', o: '#ff9b45', O: '#ffffff', y: '#ffd23f', Y: '#ffffff', G: '#3a8a2a', s: '#5a5468', S: '#3a3448' }),
};

// ---------------------------------------------------------------------
//  Minijogos e ícones
// ---------------------------------------------------------------------
const PEIXE_L = [
  '.....ff.....',
  '...bbbbbb..f',
  '.bbbwbbbbbff',
  'bbbbbbbbbbbf',
  '.bBBBBBBBbff',
  '...bbbbbb..f',
];
ART.peixes = {
  'Peixe Prateado': spriteC(PEIXE_L, { b: '#c0c8d8', B: '#8a93a8', f: '#9aa3b8', w: '#1a1424' }),
  'Peixe Dourado': spriteC(PEIXE_L, { b: '#ffd23f', B: '#c99a2e', f: '#ffae00', w: '#1a1424' }),
  'Garrafa com Poção': spriteC([
    '...cc...',
    '...cc...',
    '..gggg..',
    '.gpppPg.',
    '.gpPppg.',
    '.gppppg.',
    '..gggg..',
  ], { c: '#a07040', g: '#bfe6ff', p: '#ff6b8a', P: '#ffffff' }),
  'Bota Velha': spriteC([
    '...bbbb..',
    '...bBbb..',
    '...bbbb..',
    '...bbbb..',
    'bbbbbbbb.',
    'bBBBBBBBb',
    'sssssssss',
  ], { b: '#7a5a3a', B: '#5a3a1a', s: '#3a2a1a' }),
};
const SAPO_L = [
  [
    '.......ww...',
    '......wkwg..',
    '....ggggggg.',
    '..gggggggggr',
    '.gggGGGggggg',
    'gggGGGGGgggg',
    '.gg.GGGG.gg.',
    'gg...gg...gg',
  ],
  [
    '.......ww...',
    '......wkwg..',
    '....ggggggg.',
    '..gggggggggr',
    '.gggGGGggggg',
    'gggGGGGGgggg',
    'ggg.GGGG..gg',
    '..........gg',
  ],
];
ART.sapos = [['#5dcf4a', '#3a8a2a'], ['#4dc3ff', '#2a7ab0'], ['#ffd23f', '#c99a2e']].map(([g, G]) => SAPO_L.map(l => spriteC(l, { g, G, w: '#ffffff', k: '#1a1424', r: '#e04848' })));
ART.bandeira = spriteC([
  'pkwkw',
  'pwkwk',
  'pkwkw',
  'p....',
  'p....',
  'p....',
], { p: '#6a4a2a', k: '#1a1424', w: '#ffffff' });
ART.alma = spriteC([
  '..w...',
  '.wpw..',
  'wppPw.',
  'wpppw.',
  '.wppPw',
  '..wppw',
  '...ww.',
], { w: '#e0c8ff', p: '#b48cff', P: '#ffffff' });
ART.medalha = spriteC([
  'r..b',
  'rrbb',
  '.rb.',
  '.yy.',
  'yYYy',
  'yYYy',
  '.yy.',
], { r: '#e04848', b: '#3d7bd8', y: '#ffd23f', Y: '#fff0a0' });
ART.cadeado = spriteC([
  '.ssss.',
  's....s',
  's....s',
  'yyyyyy',
  'yYYkYy',
  'yYYkYy',
  'yyyyyy',
], { s: '#9a9aa8', y: '#c99a2e', Y: '#ffd23f', k: '#1a1424' });
ART.espadas = spriteC([
  'w.........w',
  '.w.......w.',
  '..w.....w..',
  '...w...w...',
  '....w.w....',
  '.....h.....',
  '....h.h....',
  '..hh...hh..',
  '.h.......h.',
], { w: '#d8dce8', h: '#ffd23f' });

// "123 [alma]" alinhado à direita ou à esquerda (ecrã)
function precoAlmas(n, x, y, tam, cor, alinhamento = 'esq') {
  const txt = `${n}`;
  ctx.font = fonte(tam);
  const w = ctx.measureText(traduzir(txt)).width * apertoLetra(tam);
  const ix = alinhamento === 'dir' ? x - 14 : x + w + 14;
  if (alinhamento === 'dir') textoDir(txt, x - 28, y, tam, cor); else textoEsq(txt, x, y, tam, cor);
  sprEcra(ART.alma, ix, y, 2);
}
