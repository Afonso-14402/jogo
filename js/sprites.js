'use strict';
// =====================================================================
//  PIXEL ART
//  Todos os gráficos são feitos aqui, pixel a pixel, e guardados em
//  pequenos canvases. O mundo é desenhado a metade da resolução do
//  ecrã, por isso 1 pixel de sprite = 2 pixels no ecrã.
//  Nas linhas de texto: '.' = transparente, 'k' = contorno escuro,
//  as outras letras vêm da paleta de cada sprite.
// =====================================================================

const CONTORNO = '#140f1c';
const ESCALA = 2; // pixels do ecrã por pixel de sprite

// ---------------------------------------------------------------------
//  Cores
// ---------------------------------------------------------------------
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function misturar(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
const clarear = (c, t) => misturar(c, '#ffffff', t);
const escurecer = (c, t) => misturar(c, '#000000', t);
const tons = c => ({ base: c, claro: clarear(c, 0.3), escuro: escurecer(c, 0.35), brilho: clarear(c, 0.65) });

// gerador aleatório com semente (os sprites saem sempre iguais)
function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------
//  Grelhas de pixels
// ---------------------------------------------------------------------
function novaGrade(w, h) { return Array.from({ length: h }, () => new Array(w).fill(null)); }

function corDe(ch, paleta) {
  if (ch === '.' || ch === ' ') return null;
  if (ch === 'k' && !paleta.k) return CONTORNO;
  return paleta[ch] || null;
}

function gradeDeLinhas(linhas, paleta) {
  const w = Math.max(...linhas.map(l => l.length));
  const g = novaGrade(w, linhas.length);
  linhas.forEach((l, y) => { for (let x = 0; x < l.length; x++) g[y][x] = corDe(l[x], paleta); });
  return g;
}

function carimbar(g, linhas, paleta, x0, y0) {
  linhas.forEach((l, y) => {
    for (let x = 0; x < l.length; x++) {
      const c = corDe(l[x], paleta);
      const gy = y0 + y, gx = x0 + x;
      if (c && gy >= 0 && gy < g.length && gx >= 0 && gx < g[0].length) g[gy][gx] = c;
    }
  });
}

function pixel(g, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
}

function gradeParaCanvas(g) {
  const h = g.length, w = g[0].length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  const img = cx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cor = g[y][x];
      if (!cor) continue;
      const [r, gg, b] = hexRgb(cor);
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  cx.putImageData(img, 0, 0);
  return c;
}

const sprite = (linhas, paleta) => gradeParaCanvas(gradeDeLinhas(linhas, paleta));

function virarH(c) {
  const n = document.createElement('canvas');
  n.width = c.width; n.height = c.height;
  const x = n.getContext('2d');
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  return n;
}

// Espelha grelhas simétricas: desenha-se só a metade esquerda
function espelhar(g) {
  const w = g[0].length;
  for (const linha of g) for (let x = 0; x < w / 2; x++) if (linha[x] && !linha[w - 1 - x]) linha[w - 1 - x] = linha[x];
  return g;
}

// Contorno de 1 pixel à volta de tudo o que está pintado
function contornar(g, cor = CONTORNO) {
  const h = g.length, w = g[0].length, marcar = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y][x]) continue;
      if ((y > 0 && g[y - 1][x] && g[y - 1][x] !== cor) || (y < h - 1 && g[y + 1][x] && g[y + 1][x] !== cor) ||
          (x > 0 && g[y][x - 1] && g[y][x - 1] !== cor) || (x < w - 1 && g[y][x + 1] && g[y][x + 1] !== cor)) marcar.push([x, y]);
    }
  }
  for (const [x, y] of marcar) g[y][x] = cor;
  return g;
}

// Elipse com luz a vir de cima à esquerda
function elipse(g, cx, cy, rx, ry, t, sombra = true) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      let c = t.base;
      if (sombra) {
        const v = -(nx * 0.55 + ny * 0.85);
        if (ny > 0.55 || v < -0.62) c = t.escuro;
        else if (v > 0.55) c = t.claro;
      }
      pixel(g, x, y, c);
    }
  }
}

function linha(g, x0, y0, x1, y1, c, grossura = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pixel(g, x0, y0, c);
    if (grossura > 1) { pixel(g, x0 + 1, y0, c); pixel(g, x0, y0 + 1, c); }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function poligono(g, pts, c) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const px = x + 0.5, py = y + 0.5;
      let dentro = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) dentro = !dentro;
      }
      if (dentro) pixel(g, x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
}

// ---------------------------------------------------------------------
//  Sprites desenhados à mão
// ---------------------------------------------------------------------
const PAL_HEROI = { r: '#e04848', s: '#dfe4ef', m: '#9aa3b8', d: '#5b6480', v: '#1b1424', w: '#ffffff', b: '#3a6ad4', B: '#27489c', l: '#6f9bff', n: '#6b4a2a', y: '#ffd23f', p: '#4a4058', N: '#3b2a1c' };
const HEROI_TOPO = [
  '......krrk......',
  '.....kkrrkk.....',
  '....kssssssk....',
  '...ksssssssmk...',
  '...ksvvvvvvmk...',
  '...ksvwvvwvmk...',
  '...kmsssssmdk...',
  '....kddmmddk....',
  '..kkBbbbbbbBkk..',
  '.kmkBlbbbbbBkmk.',
  '.kmkBlbbbbbBkmk.',
  '.kskkynnnnykksk.',
  '..kk.kbbbbk.kk..',
];
const HEROI_PES = [
  ['....kpk..kpk....', '...kNNk..kNNk...', '...kkkk..kkkk...'],
  ['...kpk....kpk...', '...kNk....kNNk..', '...kk.....kkkk..'],
];

// Detalhes de cada raça pintados por cima do herói
function aplicarRaca(g, raca) {
  const pele = '#f1c8a0';
  if (raca === 'elfo') { // orelhas pontiagudas
    for (const [x, y] of [[2, 5], [2, 4], [1, 4], [13, 5], [13, 4], [14, 4]]) pixel(g, x, y, pele);
  } else if (raca === 'anao') { // barba ruiva
    const b = '#c9602a', B = '#8a3f1a';
    for (let x = 5; x <= 10; x++) { pixel(g, x, 6, b); pixel(g, x, 7, x === 5 || x === 10 ? B : b); }
    for (let x = 6; x <= 9; x++) pixel(g, x, 8, b);
    pixel(g, 7, 9, B); pixel(g, 8, 9, B);
  } else if (raca === 'orc') { // pele verde, dentes e olhos amarelos
    pixel(g, 2, 5, '#8fb33a'); pixel(g, 13, 5, '#8fb33a');
    pixel(g, 5, 6, '#fffbe6'); pixel(g, 10, 6, '#fffbe6');
    pixel(g, 6, 5, '#ffe14d'); pixel(g, 9, 5, '#ffe14d');
  } else if (raca === 'vampiro') { // olhos vermelhos e capa
    pixel(g, 6, 5, '#ff2040'); pixel(g, 9, 5, '#ff2040');
    for (let y = 8; y <= 13; y++) { pixel(g, 0, y, '#6a0f1f'); pixel(g, 15, y, '#6a0f1f'); }
    pixel(g, 3, 7, '#8a1a2a'); pixel(g, 12, 7, '#8a1a2a');
  }
}

function gerarHeroi(raca, skinId) {
  const skin = SKINS[skinId] || SKINS.azul;
  const pal = Object.assign({}, PAL_HEROI, skin.pal);
  const frames = HEROI_PES.map(pes => {
    const g = gradeDeLinhas(HEROI_TOPO.concat(pes), pal);
    aplicarRaca(g, raca);
    contornar(g);
    return gradeParaCanvas(g);
  });
  frames.push(virarH(frames[1]));
  return frames;
}

const cacheHerois = {};
function framesHeroi(raca = 'humano', skin = 'azul') {
  const k = raca + '|' + skin;
  if (!cacheHerois[k]) cacheHerois[k] = gerarHeroi(raca, skin);
  return cacheHerois[k];
}

const PAL_SLIME = { g: '#5fd35f', G: '#3a9a3a', l: '#a6f5a6', w: '#ffffff' };
const SLIME = [
  [
    '................',
    '.....kkkkkk.....',
    '...kkgggggGkk...',
    '..kgglgggggGGk..',
    '..kglwgggggggk..',
    '.kggggggggggggk.',
    '.kgggwkgggwkggk.',
    '.kgggkkgggkkggk.',
    '.kGgggggggggGGk.',
    '.kGGgggggggGGGk.',
    '..kGGGGGGGGGGk..',
    '...kkkkkkkkkk...',
  ],
  [
    '................',
    '................',
    '................',
    '....kkkkkkkk....',
    '..kkgglggggGkk..',
    '.kgglwgggggggGk.',
    'kggggwkggggwkggk',
    'kggggkkggggkkggk',
    'kGgggggggggggGGk',
    'kGGgggggggggGGGk',
    '.kGGGGGGGGGGGGk.',
    '..kkkkkkkkkkkk..',
  ],
];

const PAL_MORCEGO = { p: '#8a64c0', P: '#5b3f86', e: '#ff3b3b' };
const MORCEGO = [
  [
    'kk............kk',
    'kpk...k..k...kpk',
    'kppk..kkkk..kppk',
    'kpppkkppppkkpppk',
    '.kPppkepepkppPk.',
    '..kPPkppppkPPk..',
    '...kk.kppk.kk...',
    '......kppk......',
    '.......kk.......',
    '................',
  ],
  [
    '................',
    '......k..k......',
    '......kkkk......',
    '..kkkkppppkkkk..',
    '.kpppkepepkpppk.',
    'kppPkkppppkkPppk',
    'kpPk.kppppk.kPpk',
    'kPk...kppk...kPk',
    'kk.....kk.....kk',
    '................',
  ],
];

const PAL_ESQUELETO = { w: '#ece6d2', g: '#b9b29c', e: '#ff4040', b: '#8b5a2b', s: '#dddddd' };
const ESQUELETO = [
  '................',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '....kwwwwwwwk...',
  '....kkekwkekk...',
  '....kwwwwwwwk...',
  '.....kwkwkwk....',
  '......kwwk....b.',
  '....kkwggwkk..bs',
  '...kwkwwwwkwk.bs',
  '...kgkkggkkgk.bs',
  '...kk.kwwk.kk.bs',
  '......kggk...bs.',
  '.....kwkkwk.....',
  '.....kwk.kwk....',
  '....kkk..kkk....',
];

const PAL_ORC = { g: '#6b8e23', G: '#4a6318', l: '#8fb33a', w: '#fffbe6', y: '#ffe14d', a: '#7a6450', A: '#4a3d32' };
const ORC = [
  '................',
  '....kkkkkkkk....',
  '...kgggggggGk...',
  '...kglggggggk...',
  '...kgGyGGyGGk...',
  '...kggggggggk...',
  '...kgwkkkkwgk...',
  '....kgwggwgk....',
  '..kkkAaaaaAkkk..',
  '.kgGkAaaaaAkGgk.',
  '.kgGkaAaaAakGgk.',
  '.kGkkAaaaaAkkGk.',
  '..k.kAAAAAAk.k..',
  '....kGGkkGGk....',
  '...kGGk..kGGk...',
  '...kkkk..kkkk...',
];

const PAL_FANTASMA = { o: '#5a7a9a', w: '#cfeaff', b: '#9ec4e6', l: '#ffffff', e: '#223344' };
const FANTASMA = [
  '................',
  '.....oooooo.....',
  '....owwwwwwo....',
  '...owwwwwwwwo...',
  '..owlwwwwwwwwo..',
  '..owweewweewwo..',
  '..owweewweewwo..',
  '..owwwwwwwwwwo..',
  '..owwwweewwwwo..',
  '..owwwwwwwwwwo..',
  '..obwwwwwwwwbo..',
  '..obbwwbbwwbbo..',
  '..obbbobbobbbo..',
  '..oo.oo..oo.oo..',
  '................',
  '................',
];

const PAL_ARANHA = { b: '#7a3f96', B: '#4f2463', e: '#ff4040', l: '#a86bc4' };
const ARANHA = [
  [
    '................',
    '..k..........k..',
    '...k..kkkk..k...',
    'k...kkbbbbkk...k',
    '.k.kbblbbbbBk.k.',
    '..kkbebbbbebkk..',
    'kk.kBbbbbbbBk.kk',
    '..k.kBBBBBBk.k..',
    '.k...kkkkkk...k.',
    'k..............k',
  ],
  [
    '................',
    '................',
    'k.....kkkk.....k',
    '.k..kkbbbbkk..k.',
    '..kkbblbbbbBkk..',
    'k.kkbebbbbebkk.k',
    '.k.kBbbbbbbBk.k.',
    'k..kkBBBBBBkk..k',
    '...k.kkkkkk.k...',
    '..k..........k..',
  ],
];

const PAL_MIMICO = { b: '#a86a36', B: '#7a4a22', a: '#c9a15a', r: '#6a0f0f', w: '#ffffff', y: '#ffe14d', t: '#e05050' };
const MIMICO = [
  [
    '................',
    '..kkkkkkkkkkkk..',
    '.kBbbbbbbbbbbBk.',
    '.kbbkykbbkykbbk.',
    '.kaaaaaaaaaaaak.',
    '.kwrwrwrwrwrwrk.',
    '.krrrrrrrrrrrrk.',
    '.krrrtttttrrrrk.',
    '.krwrwrwrwrwrwk.',
    '.kaaaaaaaaaaaak.',
    '.kbbbbbbbbbbbbk.',
    '.kbBbbbbbbbbBbk.',
    '.kbbbbbbbbbbbbk.',
    '.kaaaaaaaaaaaak.',
    '.kBBBBBBBBBBBBk.',
    '..kkkkkkkkkkkk..',
  ],
  [
    '................',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.kBbbbbbbbbbbBk.',
    '.kbbkykbbkykbbk.',
    '.kaaaaaaaaaaaak.',
    '.kwrwrwrwrwrwrk.',
    '.krwrwrwrwrwrwk.',
    '.kaaaaaaaaaaaak.',
    '.kbbbbbbbbbbbbk.',
    '.kbBbbbbbbbbBbk.',
    '.kbbbbbbbbbbbbk.',
    '.kaaaaaaaaaaaak.',
    '.kBBBBBBBBBBBBk.',
    '..kkkkkkkkkkkk..',
  ],
];

const BAU = [
  '..kkkkkkkkkkkk..',
  '.kbllllllllllbk.',
  '.kbbbbbbbbbbbbk.',
  '.kbabbbbbbbbabk.',
  'kaaaaaakkaaaaaak',
  'kAAAAAkyykAAAAAk',
  'kbbabbkyykbbabbk',
  'kbbabbbkkbbbabbk',
  'kbbabbbbbbbbabbk',
  'kddaddddddddaddk',
  'kbbabbbbbbbbabbk',
  'kbbabbbbbbbbabbk',
  'kaaaaaaaaaaaaaak',
  '.kkkkkkkkkkkkkk.',
];
const PAL_BAU = {
  madeira: { B: '#7a4a22', b: '#a86a36', l: '#c98a4a', a: '#c9a15a', A: '#8a6a30', y: '#ffd23f', d: '#7f4f25' },
  ouro: { B: '#b88a00', b: '#e0b000', l: '#fff0a0', a: '#fff6c8', A: '#c9a15a', y: '#ff3355', d: '#b08a00' },
};

const POCAO = [
  '...kkkk...',
  '...kcck...',
  '...kggk...',
  '..kkggkk..',
  '.kgrrrrgk.',
  'kgwrrrrrrk',
  'kgwrrrrrrk',
  'krrrrrrrRk',
  'krrrrrrRRk',
  '.kRrrrRRk.',
  '..kkkkkk..',
];
const PAL_POCAO = { r: '#ff3d6b', R: '#b82048', w: '#ffffff', g: '#cfd6e6', c: '#8b5a2b' };

const MOEDA = [
  '.kkkk.',
  'kylyyk',
  'klyyYk',
  'kyyyYk',
  'kyYYYk',
  '.kkkk.',
];
const PAL_MOEDA = { y: '#ffd23f', Y: '#c99a10', l: '#fff4b0' };

const MERCADOR = [
  '......kkkk......',
  '.....kGGGGk.....',
  '....kGggggGk....',
  '...kGggggggGk...',
  '...kGkkkkkkGk...',
  '...kGfeffefGk...',
  '...kGffffffGk...',
  '....kGfwwfGk....',
  '..hhkgwwwwgkhh..',
  '.hHhkggyyggkhHh.',
  '.hHhkgggggGkhHh.',
  '.hHhkglgggGkhHh.',
  '.hhhkglgggGkhhh.',
  '..kkkgggggGkkk..',
  '....kgggggGk....',
  '....kGGGGGGk....',
  '....kHk..kHk....',
  '....kkk..kkk....',
];
const PAL_MERCADOR = { g: '#2f8f5b', G: '#1f6040', l: '#4fc07f', f: '#f1c8a0', h: '#8b5a2b', H: '#5a3a1c', y: '#ffd23f', w: '#eeeeee', e: '#1b1424' };

const ALTAR = [
  '..f..............f..',
  '..c..............c..',
  '.kck............kck.',
  '.kck.kkkkkkkkkk.kck.',
  '.kkk.krRRRRRRrk.kkk.',
  '....kkkkkkkkkkkk....',
  '...kllllllllllllk...',
  '...kssssssssssssk...',
  '....kssrssssrssk....',
  '....kssssssssssk....',
  '....ksssrrrrsssk....',
  '....kssssssssssk....',
  '...kSSSSSSSSSSSSk...',
  '..kSSSSSSSSSSSSSSk..',
  '..kkkkkkkkkkkkkkkk..',
];
const PAL_ALTAR = { s: '#8d8698', S: '#5e5868', l: '#b8b2c4', r: '#ff3b3b', R: '#a01818', c: '#f0e6c8', f: '#ffb040' };
const PAL_ALTAR_USADO = { s: '#6d6878', S: '#4a4556', l: '#8d8698', r: '#4a4556', R: '#3a3546', c: '#b0a890', f: null };

const CRISTAL = [
  '.....kk.....',
  '....kwlk....',
  '....klak....',
  '...klaaAk...',
  '...klaaAk...',
  '..klaaaaAk..',
  '..klaaaaAk..',
  '..kwlaaaAk..',
  '..klaaaAAk..',
  '..klaaaaAk..',
  '..klaaaAAk..',
  '...klaaAk...',
  '...klaAAk...',
  '....klAk....',
  '....kaAk....',
  '..kkkkkkkk..',
  '.ksssssssssk',
  '.kSSSSSSSSSk',
  'kkkkkkkkkkkk',
];
const pal_cristal = cor => ({ a: cor, A: escurecer(cor, 0.4), l: clarear(cor, 0.45), w: '#ffffff', s: '#5e5868', S: '#3e3848' });

const COROA = [
  '.k.....kk.....k.',
  'kyk...kyyk...kyk',
  'kyyk.kyyyyk.kyyk',
  'kyyykyyrryykyyyk',
  'kyyyyyyrryyyyyyk',
  'kYYYYYYYYYYYYYYk',
  '.kkkkkkkkkkkkkk.',
];
const PAL_COROA = { y: '#ffd23f', Y: '#c99a10', r: '#ff3355' };

const TOCHA = [
  '..kk..',
  '.kffk.',
  'kfyyfk',
  'kfyyfk',
  '.kffk.',
  '.kbbk.',
  '.kbbk.',
  'kbbbbk',
  '.kbbk.',
  '..kk..',
];
const PAL_TOCHA = [
  { f: '#ff7b25', y: '#ffe14d', b: '#6b4a2a' },
  { f: '#ff5a1a', y: '#fff0a0', b: '#6b4a2a' },
];

// ---------------------------------------------------------------------
//  Sprites gerados ao nível do pixel
// ---------------------------------------------------------------------
function gerarEscada() {
  const g = novaGrade(16, 16);
  const cores = ['#6e5f50', '#584a3e', '#43382f', '#2e2620', '#1a1512'];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = '#000000';
  for (let i = 0; i < 5; i++) {
    const y0 = 1 + i * 3;
    for (let y = y0; y < y0 + 2 && y < 15; y++) for (let x = 1 + i; x < 15 - i; x++) g[y][x] = cores[i];
  }
  for (let i = 0; i < 16; i++) { g[0][i] = CONTORNO; g[15][i] = CONTORNO; g[i][0] = CONTORNO; g[i][15] = CONTORNO; }
  return gradeParaCanvas(g);
}

function gerarEspinhos(estado) {
  const g = novaGrade(16, 16);
  const buracos = [[3, 3], [10, 3], [3, 10], [10, 10]];
  for (const [bx, by] of buracos) {
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) g[by + y][bx + x] = '#0d0a12';
    if (estado === 1) { g[by][bx + 1] = '#9aa3b8'; }
    if (estado === 2) {
      for (let k = 0; k < 5; k++) {
        const w = Math.max(0, 2 - Math.floor(k / 2));
        for (let x = bx + 1 - w; x <= bx + 1 + w; x++) pixel(g, x, by + 2 - k, k < 2 ? '#8a93a8' : '#dfe4ef');
      }
    }
  }
  if (estado === 2) contornar(g);
  return gradeParaCanvas(g);
}

// Ícones dos itens (16x16), recoloridos pela raridade
function iconeDoItem(it) {
  const n = it.nomeBase || it.nome;
  if (it.tipo === 'arma') {
    if (/Cajado|Cetro/.test(n)) return 'cajado';
    if (/Colher/.test(n)) return 'colher';
    if (/Galho/.test(n)) return 'galho';
    if (/Peixe/.test(n)) return 'peixe';
    if (/Adaga/.test(n)) return 'adaga';
    if (/Machad/.test(n)) return 'machado';
    if (/Lança/.test(n)) return 'lanca';
    if (/Martelo/.test(n)) return 'martelo';
    if (/Foice/.test(n)) return 'foice';
    return 'espada';
  }
  if (it.tipo === 'armadura') {
    if (/Saco/.test(n)) return 'saco';
    if (/Cueca/.test(n)) return 'cueca';
    if (/Balde/.test(n)) return 'balde';
    if (/Manto|Túnica/.test(n)) return 'manto';
    return 'peitoral';
  }
  if (/Anel/.test(n)) return 'anel';
  if (/Pedra/.test(n)) return 'pedra';
  if (/Pena/.test(n)) return 'pena';
  if (/Coração/.test(n)) return 'coracao';
  if (/Olho/.test(n)) return 'olho';
  return 'amuleto';
}

function gerarIcone(nome, cor) {
  const g = novaGrade(16, 16);
  const a = cor, b = escurecer(cor, 0.4), c = clarear(cor, 0.5);
  const cabo = '#8b5a2b', caboE = '#5a3a1c';
  const lamina = (x0, y0, x1, y1) => { linha(g, x0, y0, x1, y1, c); linha(g, x0 + 1, y0 + 1, x1 + 1, y1 + 1, a); };
  const cabo2 = (x0, y0, x1, y1) => { linha(g, x0, y0, x1, y1, cabo); pixel(g, x1, y1, caboE); };
  switch (nome) {
    case 'espada':
      lamina(6, 8, 13, 1); pixel(g, 14, 1, c);
      linha(g, 3, 7, 8, 12, b);
      cabo2(5, 10, 2, 13);
      pixel(g, 1, 14, a);
      break;
    case 'adaga':
      lamina(7, 7, 11, 3); pixel(g, 12, 3, c);
      linha(g, 5, 7, 8, 10, b);
      cabo2(6, 9, 3, 12);
      pixel(g, 2, 13, a);
      break;
    case 'machado':
      linha(g, 2, 14, 11, 5, cabo); linha(g, 3, 14, 12, 5, caboE);
      poligono(g, [[9, 1], [15, 3], [15, 9], [12, 11], [8, 5]], a);
      linha(g, 14, 3, 14, 9, c);
      linha(g, 9, 2, 12, 3, c);
      break;
    case 'lanca':
      linha(g, 1, 15, 11, 5, cabo); linha(g, 2, 15, 12, 5, caboE);
      poligono(g, [[10, 4], [15, 0], [12, 6]], a);
      linha(g, 11, 4, 14, 1, c);
      pixel(g, 10, 6, b); pixel(g, 11, 7, b);
      break;
    case 'martelo':
      linha(g, 2, 14, 9, 7, cabo); linha(g, 3, 14, 10, 7, caboE);
      poligono(g, [[6, 4], [10, 0], [15, 5], [11, 9]], a);
      linha(g, 7, 4, 10, 1, c);
      linha(g, 11, 8, 14, 5, b);
      break;
    case 'foice':
      linha(g, 2, 15, 11, 2, cabo); linha(g, 3, 15, 12, 2, caboE);
      poligono(g, [[11, 1], [7, 0], [2, 2], [1, 5], [4, 3], [8, 2], [12, 3]], a);
      linha(g, 2, 2, 7, 0, c);
      break;
    case 'cajado':
      linha(g, 2, 14, 11, 5, cabo); linha(g, 3, 14, 12, 5, caboE);
      linha(g, 10, 3, 14, 7, b);
      elipse(g, 13.5, 3.5, 2.8, 2.8, { base: a, claro: c, escuro: b });
      pixel(g, 13, 2, '#ffffff');
      break;
    case 'colher':
      linha(g, 2, 13, 9, 6, a); linha(g, 3, 13, 10, 6, b);
      elipse(g, 12, 4, 3, 3, { base: a, claro: c, escuro: b });
      break;
    case 'galho':
      linha(g, 2, 14, 13, 2, '#7a5230'); linha(g, 3, 14, 14, 2, '#5a3a1c');
      linha(g, 7, 9, 5, 5, '#7a5230');
      linha(g, 10, 6, 13, 7, '#7a5230');
      pixel(g, 5, 4, a); pixel(g, 13, 8, a);
      break;
    case 'peixe':
      elipse(g, 8, 8, 6, 3.5, { base: a, claro: c, escuro: b });
      poligono(g, [[13, 8], [16, 4], [16, 12]], b);
      pixel(g, 5, 7, CONTORNO);
      linha(g, 8, 6, 8, 10, b);
      break;
    case 'peitoral':
      poligono(g, [[3, 2], [6, 1], [8, 3], [10, 1], [13, 2], [15, 7], [12, 8], [12, 15], [4, 15], [4, 8], [1, 7]], a);
      linha(g, 8, 4, 8, 14, b);
      linha(g, 5, 9, 11, 9, b);
      linha(g, 4, 3, 6, 2, c); linha(g, 5, 5, 5, 8, c);
      break;
    case 'manto':
      poligono(g, [[5, 1], [11, 1], [13, 5], [15, 15], [1, 15], [3, 5]], a);
      elipse(g, 8, 4, 3, 3, { base: b, claro: b, escuro: b }, false);
      linha(g, 8, 7, 8, 14, b);
      linha(g, 4, 6, 3, 13, c);
      break;
    case 'saco':
      elipse(g, 8, 10, 6, 5.5, { base: '#b08a5a', claro: '#d0aa7a', escuro: '#806040' });
      poligono(g, [[6, 2], [10, 2], [9, 5], [7, 5]], '#b08a5a');
      linha(g, 6, 5, 10, 5, a);
      break;
    case 'cueca':
      poligono(g, [[2, 3], [14, 3], [14, 7], [10, 12], [8, 9], [6, 12], [2, 7]], a);
      linha(g, 2, 3, 14, 3, b);
      pixel(g, 11, 6, CONTORNO); pixel(g, 12, 6, CONTORNO);
      break;
    case 'balde':
      poligono(g, [[3, 5], [13, 5], [12, 15], [4, 15]], a);
      linha(g, 3, 5, 13, 5, c);
      linha(g, 4, 10, 12, 10, b);
      linha(g, 3, 5, 5, 1, b); linha(g, 5, 1, 11, 1, b); linha(g, 11, 1, 13, 5, b);
      break;
    case 'anel':
      for (let t = 0; t < 40; t++) {
        const ang = t / 40 * Math.PI * 2;
        pixel(g, 8 + Math.cos(ang) * 5, 9 + Math.sin(ang) * 5, t < 20 ? b : a);
        pixel(g, 8 + Math.cos(ang) * 4, 9 + Math.sin(ang) * 4, a);
      }
      poligono(g, [[8, 0], [11, 3], [8, 6], [5, 3]], c);
      break;
    case 'amuleto':
      linha(g, 2, 1, 8, 8, b); linha(g, 14, 1, 8, 8, b);
      poligono(g, [[8, 6], [12, 10], [8, 15], [4, 10]], a);
      linha(g, 8, 7, 5, 10, c);
      break;
    case 'pedra':
      elipse(g, 8, 9, 6, 5, { base: '#8a8a8a', claro: '#aaaaaa', escuro: '#5a5a5a' });
      pixel(g, 6, 8, '#5a5a5a'); pixel(g, 10, 10, '#5a5a5a');
      break;
    case 'pena':
      poligono(g, [[14, 1], [9, 3], [4, 9], [3, 12], [6, 11], [12, 6]], a);
      linha(g, 1, 15, 13, 2, b);
      linha(g, 10, 3, 5, 8, c);
      break;
    case 'coracao':
      elipse(g, 5.5, 6, 4, 4, { base: a, claro: c, escuro: b });
      elipse(g, 10.5, 6, 4, 4, { base: a, claro: a, escuro: b });
      poligono(g, [[1.6, 7], [14.4, 7], [8, 14.5]], a);
      pixel(g, 4, 4, '#ffffff');
      break;
    case 'olho':
      poligono(g, [[1, 8], [5, 4], [11, 4], [15, 8], [11, 12], [5, 12]], '#f0f0f0');
      elipse(g, 8, 8, 3, 3, { base: a, claro: c, escuro: b });
      pixel(g, 8, 8, CONTORNO); pixel(g, 7, 7, '#ffffff');
      break;
  }
  contornar(g);
  return gradeParaCanvas(g);
}

// Ladrilhos do chão e paredes para cada zona (4 zonas que se repetem)
const ZONAS = [
  { chao: '#2d2640', parede: '#4d4163', topo: '#1a1522', musgo: '#3d5a3a' },
  { chao: '#232e2a', parede: '#3e5a4a', topo: '#121c17', musgo: '#4a7a3a' },
  { chao: '#3a2622', parede: '#6a3a2e', topo: '#200f0c', musgo: '#7a3a1a' },
  { chao: '#20283a', parede: '#3a4a70', topo: '#0f1422', musgo: '#3a5a7a' },
];

function gerarLadrilhos(z) {
  const r = aleatorio(1234);
  const f = z.chao, F = escurecer(f, 0.4), L = clarear(f, 0.1), M = escurecer(f, 0.15);
  const chaos = [];
  for (let v = 0; v < 4; v++) {
    const g = novaGrade(16, 16);
    for (let y = 0; y < 16; y++) {
      const fila = Math.floor(y / 8), off = fila % 2 ? 4 : 0;
      for (let x = 0; x < 16; x++) {
        const lx = (x + off) % 8, ly = y % 8;
        let c = f;
        if (ly === 7 || lx === 7) c = F;
        else if (ly === 0 || lx === 0) c = L;
        else if (r() < 0.07) c = M;
        g[y][x] = c;
      }
    }
    if (v === 1) { linha(g, 3, 2, 6, 5, F); linha(g, 6, 5, 5, 9, F); }
    if (v === 2) { for (let k = 0; k < 7; k++) pixel(g, 2 + Math.floor(r() * 12), 9 + Math.floor(r() * 5), z.musgo); }
    if (v === 3) { pixel(g, 10, 11, '#d8d0c0'); pixel(g, 11, 11, '#d8d0c0'); pixel(g, 12, 12, '#d8d0c0'); pixel(g, 9, 12, '#b8b0a0'); }
    chaos.push(gradeParaCanvas(g));
  }
  const b = z.parede, B = escurecer(b, 0.45), BL = clarear(b, 0.18), BM = escurecer(b, 0.12);
  const face = novaGrade(16, 16);
  for (let y = 0; y < 16; y++) {
    const fila = Math.floor(y / 4), off = fila % 2 ? 4 : 0;
    for (let x = 0; x < 16; x++) {
      let c = b;
      if (y % 4 === 3 || (x + off) % 8 === 7) c = B;
      else if (y % 4 === 0) c = BL;
      else if (r() < 0.1) c = BM;
      if (y >= 14) c = escurecer(c, 0.35);
      face[y][x] = c;
    }
  }
  const topo = novaGrade(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) topo[y][x] = r() < 0.06 ? clarear(z.topo, 0.08) : z.topo;
  return { chaos, face: gradeParaCanvas(face), topo: gradeParaCanvas(topo) };
}

// ---------------------------------------------------------------------
//  Bosses
// ---------------------------------------------------------------------
function gerarReiSlime(fase) {
  const g = novaGrade(50, 46);
  const t = tons('#3fbf3f');
  const ry = fase ? 13 : 15, cy = fase ? 31 : 29;
  elipse(g, 25, cy, fase ? 23 : 21, ry, t);
  elipse(g, 16, cy - 7, 4, 2.5, { base: t.brilho }, false);
  pixel(g, 13, cy - 6, '#ffffff'); pixel(g, 14, cy - 6, '#ffffff');
  const olho = ['.kk.', 'kwkk', 'kkkk', '.kk.'];
  carimbar(g, olho, { w: '#ffffff' }, 17, cy - 3);
  carimbar(g, olho, { w: '#ffffff' }, 29, cy - 3);
  linha(g, 22, cy + 4, 28, cy + 4, t.escuro);
  contornar(g);
  carimbar(g, COROA, PAL_COROA, 17, cy - ry - 5);
  return gradeParaCanvas(g);
}

function gerarLich() {
  const g = novaGrade(34, 42);
  const roxo = tons('#6a3fb5');
  poligono(g, [[17, 7], [28, 38], [6, 38]], (x) => x < 14 ? roxo.claro : x > 21 ? roxo.escuro : roxo.base);
  for (let x = 6; x <= 28; x++) { pixel(g, x, 38, '#c9a15a'); pixel(g, x, 37, '#c9a15a'); }
  linha(g, 17, 20, 17, 36, roxo.escuro);
  elipse(g, 17, 13, 8, 8, { base: roxo.base, claro: roxo.claro, escuro: roxo.escuro });
  elipse(g, 17, 14, 5, 4.5, { base: '#1a0f2a' }, false);
  pixel(g, 15, 14, '#4dffea'); pixel(g, 14, 14, '#4dffea');
  pixel(g, 19, 14, '#4dffea'); pixel(g, 20, 14, '#4dffea');
  linha(g, 10, 24, 12, 26, '#ece6d2'); linha(g, 24, 24, 26, 22, '#ece6d2');
  linha(g, 29, 6, 29, 39, '#6b4a2a');
  linha(g, 30, 6, 30, 39, '#4a3220');
  elipse(g, 29.5, 4, 3, 3, { base: '#4dffea', claro: '#c8fffa', escuro: '#20a0a0' });
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarDragao() {
  const g = novaGrade(60, 50);
  const verm = tons('#c0392b'), asa = tons('#7a1f18');
  const asaE = [[22, 20], [2, 6], [5, 16], [1, 24], [9, 25], [5, 33], [20, 31]];
  poligono(g, asaE, asa.base);
  poligono(g, asaE.map(([x, y]) => [59 - x, y]), asa.base);
  linha(g, 22, 20, 2, 6, asa.claro); linha(g, 37, 20, 57, 6, asa.claro);
  linha(g, 20, 22, 5, 16, asa.escuro); linha(g, 39, 22, 54, 16, asa.escuro);
  elipse(g, 30, 31, 15, 14, verm);
  elipse(g, 30, 35, 8, 8, { base: '#e8c080', claro: '#f5d8a0', escuro: '#c8a060' });
  for (let y = 30; y < 43; y += 3) linha(g, 24, y, 36, y, '#c8a060');
  poligono(g, [[23, 11], [18, 1], [25, 8]], '#f0e0c0');
  poligono(g, [[37, 11], [42, 1], [35, 8]], '#f0e0c0');
  elipse(g, 30, 15, 10, 8, verm);
  elipse(g, 30, 21, 6, 3.5, { base: verm.claro, claro: verm.claro, escuro: verm.base });
  carimbar(g, ['yy', 'yk'], { y: '#ffe14d' }, 25, 13);
  carimbar(g, ['yy', 'ky'], { y: '#ffe14d' }, 34, 13);
  pixel(g, 28, 21, CONTORNO); pixel(g, 32, 21, CONTORNO);
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarGolem(pisao) {
  const g = novaGrade(56, 56);
  const pedra = tons('#8a8176');
  const r = aleatorio(77);
  if (pisao) { elipse(g, 8, 14, 7, 8, pedra); elipse(g, 48, 14, 7, 8, pedra); }
  else { elipse(g, 8, 36, 7, 9, pedra); elipse(g, 48, 36, 7, 9, pedra); }
  elipse(g, 28, 33, 19, 18, pedra);
  elipse(g, 28, 14, 10, 8, pedra);
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(r() * 56), y = Math.floor(r() * 56);
    if (g[y][x] === pedra.base) g[y][x] = r() < 0.5 ? pedra.escuro : clarear(pedra.base, 0.12);
  }
  for (let k = 0; k < 30; k++) {
    const x = 14 + Math.floor(r() * 28), y = 8 + Math.floor(r() * 14);
    if (g[y][x]) g[y][x] = '#5a7a3a';
  }
  const brasa = '#ff9b45';
  linha(g, 20, 27, 23, 34, brasa); linha(g, 23, 34, 21, 41, brasa);
  linha(g, 34, 25, 37, 31, brasa); linha(g, 37, 31, 35, 36, brasa);
  carimbar(g, ['yyy', 'fff'], { y: '#ffe14d', f: brasa }, 23, 13);
  carimbar(g, ['yyy', 'fff'], { y: '#ffe14d', f: brasa }, 31, 13);
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarRainhaAranha(frame) {
  const g = novaGrade(60, 44);
  const perna = '#3a1a48';
  for (let k = 0; k < 4; k++) {
    const oy = frame && k % 2 ? 2 : 0;
    const ax = 24, ay = 18 + k * 3;
    const jx = 12 - k * 2, jy = 6 + k * 5 + oy, px = 3 + k, py = 18 + k * 7 - oy;
    linha(g, ax, ay, jx, jy, perna, 2); linha(g, jx, jy, px, py, perna, 2);
    linha(g, 59 - ax, ay, 59 - jx, jy, perna, 2); linha(g, 59 - jx, jy, 59 - px, py, perna, 2);
  }
  elipse(g, 30, 29, 12, 11, tons('#5b2a6e'));
  poligono(g, [[27, 24], [33, 24], [30, 29]], '#e02030');
  poligono(g, [[27, 34], [33, 34], [30, 29]], '#e02030');
  elipse(g, 30, 15, 8, 7, tons('#7a3f96'));
  for (const [x, y] of [[26, 13], [28, 12], [32, 12], [34, 13], [27, 16], [33, 16]]) pixel(g, x, y, '#ff4040');
  pixel(g, 28, 21, '#ffffff'); pixel(g, 32, 21, '#ffffff'); pixel(g, 28, 22, '#ffffff'); pixel(g, 32, 22, '#ffffff');
  contornar(g);
  carimbar(g, ['k.kk.k', 'kykkyk', 'kyyyyk', 'kkkkkk'], { y: '#ffd23f' }, 27, 5);
  return gradeParaCanvas(g);
}

function gerarDemonio() {
  const g = novaGrade(56, 50);
  const verm = tons('#b3122e'), asa = tons('#4a0a14');
  const asaE = [[20, 22], [2, 8], [6, 18], [1, 27], [10, 27], [6, 36], [20, 32]];
  poligono(g, asaE, asa.base);
  poligono(g, asaE.map(([x, y]) => [55 - x, y]), asa.base);
  linha(g, 20, 22, 2, 8, asa.claro); linha(g, 35, 22, 53, 8, asa.claro);
  elipse(g, 28, 33, 13, 14, verm);
  linha(g, 24, 26, 28, 32, verm.escuro); linha(g, 32, 26, 28, 32, verm.escuro);
  poligono(g, [[21, 12], [12, 2], [10, 7], [18, 15]], '#e8d8b0');
  poligono(g, [[35, 12], [44, 2], [46, 7], [38, 15]], '#e8d8b0');
  elipse(g, 28, 17, 9, 8, verm);
  linha(g, 23, 15, 25, 16, '#ffe14d'); linha(g, 33, 15, 31, 16, '#ffe14d');
  linha(g, 24, 21, 32, 21, CONTORNO);
  pixel(g, 25, 22, '#ffffff'); pixel(g, 31, 22, '#ffffff');
  contornar(g);
  return gradeParaCanvas(g);
}

const MESA = [
  '.......kkkkkk.......',
  '......kwwwwwwk......',
  '.....kwkwkwwwwk.....',
  '.....kwwwwkwkwk.....',
  '....kppppppppppk....',
  '..kkkkkkkkkkkkkkkk..',
  '.kllllllllllllllllk.',
  '.kssrssssssssssrssk.',
  '.kssssssssssssssssk.',
  '..kSSSSSSSSSSSSSSk..',
  '...kSk........kSk...',
  '...kSk........kSk...',
  '...kSk........kSk...',
  '..kkkkk......kkkkk..',
];
const PAL_MESA = { w: '#f0e6c8', p: '#6a3fb5', l: '#b8b2c4', s: '#8d8698', S: '#5e5868', r: '#d9a6ff' };

function gerarLivro(cor) {
  const g = novaGrade(12, 14);
  for (let y = 1; y < 13; y++) for (let x = 2; x < 10; x++) g[y][x] = cor;
  for (let y = 1; y < 13; y++) { g[y][2] = escurecer(cor, 0.4); g[y][10] = '#f0e6c8'; }
  for (let y = 2; y < 12; y++) g[y][9] = '#d8ccb0';
  const c = clarear(cor, 0.6);
  for (const [x, y] of [[5, 4], [6, 4], [7, 5], [6, 6], [5, 7], [6, 8], [7, 8]]) g[y][x] = c;
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarIconeFeitico(id) {
  const g = novaGrade(16, 16);
  const f = FEITICOS[id], a = f.cor, b = escurecer(a, 0.35), c = clarear(a, 0.55);
  if (id === 'fogo') {
    poligono(g, [[8, 1], [12, 6], [13, 10], [11, 14], [5, 14], [3, 10], [4, 6], [6, 8]], a);
    poligono(g, [[8, 6], [10, 10], [9, 13], [7, 13], [6, 10]], '#ffe14d');
    pixel(g, 8, 11, '#ffffff');
  } else if (id === 'raio') {
    poligono(g, [[10, 0], [4, 8], [8, 8], [5, 15], [12, 6], [8, 6], [11, 0]], a);
    linha(g, 9, 1, 6, 7, c);
  } else if (id === 'gelo') {
    for (let k = 0; k < 3; k++) {
      const ang = k * Math.PI / 3;
      linha(g, 8 - Math.cos(ang) * 6, 8 - Math.sin(ang) * 6, 8 + Math.cos(ang) * 6, 8 + Math.sin(ang) * 6, a, 2);
    }
    pixel(g, 8, 8, '#ffffff'); pixel(g, 8, 2, c); pixel(g, 8, 14, c);
  } else {
    for (let y = 2; y < 14; y++) for (let x = 6; x < 10; x++) g[y][x] = a;
    for (let y = 6; y < 10; y++) for (let x = 2; x < 14; x++) g[y][x] = a;
    linha(g, 6, 2, 6, 13, c); linha(g, 2, 6, 13, 6, c);
    linha(g, 9, 3, 9, 13, b);
  }
  contornar(g);
  return gradeParaCanvas(g);
}

// Círculo pequeno usado nos ícones das melhorias
function gerarBola(cor, raio) {
  const d = raio * 2 + 2;
  const g = novaGrade(d, d);
  elipse(g, d / 2, d / 2, raio, raio, tons(cor));
  contornar(g);
  return gradeParaCanvas(g);
}

// ---------------------------------------------------------------------
//  Construção e caches
// ---------------------------------------------------------------------
const SPR = {};
const cacheIcones = {}, cacheLadrilhos = {}, cacheSilhuetas = new Map(), cacheBolas = {};

function construirSprites() {
  SPR.heroi = framesHeroi('humano', 'azul');
  SPR.slime = SLIME.map(l => sprite(l, PAL_SLIME));
  SPR.morcego = MORCEGO.map(l => sprite(l, PAL_MORCEGO));
  SPR.esqueleto = [sprite(ESQUELETO, PAL_ESQUELETO)];
  SPR.orc = [sprite(ORC, PAL_ORC)];
  const f = sprite(FANTASMA, PAL_FANTASMA);
  SPR.fantasma = [f, virarH(f)];
  SPR.aranha = ARANHA.map(l => sprite(l, PAL_ARANHA));
  SPR.mimico = MIMICO.map(l => sprite(l, PAL_MIMICO));
  SPR.bau = { madeira: sprite(BAU, PAL_BAU.madeira), ouro: sprite(BAU, PAL_BAU.ouro) };
  SPR.pocao = sprite(POCAO, PAL_POCAO);
  SPR.moeda = sprite(MOEDA, PAL_MOEDA);
  SPR.mercador = sprite(MERCADOR, PAL_MERCADOR);
  SPR.altar = sprite(ALTAR, PAL_ALTAR);
  SPR.altarUsado = sprite(ALTAR, PAL_ALTAR_USADO);
  SPR.cristal = { inativo: sprite(CRISTAL, pal_cristal('#b44dff')), ativo: sprite(CRISTAL, pal_cristal('#ff3b5b')), feito: sprite(CRISTAL, pal_cristal('#8d8698')) };
  SPR.tocha = PAL_TOCHA.map(p => sprite(TOCHA, p));
  SPR.escada = gerarEscada();
  SPR.mesa = sprite(MESA, PAL_MESA);
  SPR.livro = {};
  SPR.feitico = {};
  for (const id of ORDEM_FEITICOS) { SPR.livro[id] = gerarLivro(FEITICOS[id].cor); SPR.feitico[id] = gerarIconeFeitico(id); }
  SPR.espinhos = [0, 1, 2].map(gerarEspinhos);
  SPR.reiSlime = [gerarReiSlime(0), gerarReiSlime(1)];
  SPR.lich = [gerarLich()];
  SPR.dragao = [gerarDragao()];
  SPR.golem = [gerarGolem(false), gerarGolem(true)];
  SPR.rainha = [gerarRainhaAranha(0), gerarRainhaAranha(1)];
  SPR.demonio = [gerarDemonio()];
}

function iconeItem(it) {
  const nome = iconeDoItem(it);
  const cor = RARIDADES[it.r].cor;
  const k = nome + cor;
  if (!cacheIcones[k]) cacheIcones[k] = gerarIcone(nome, cor);
  return cacheIcones[k];
}

function ladrilhosZona(andar) {
  const i = Math.floor((andar - 1) / 5) % ZONAS.length;
  if (!cacheLadrilhos[i]) cacheLadrilhos[i] = gerarLadrilhos(ZONAS[i]);
  return cacheLadrilhos[i];
}

function bolaPerk(cor, raio) {
  const k = cor + raio;
  if (!cacheBolas[k]) cacheBolas[k] = gerarBola(cor, raio);
  return cacheBolas[k];
}

// Versão do sprite pintada de uma só cor (para piscar a branco, auras de elite, gelo...)
function silhueta(c, cor) {
  let porCor = cacheSilhuetas.get(c);
  if (!porCor) { porCor = {}; cacheSilhuetas.set(c, porCor); }
  if (!porCor[cor]) {
    const n = document.createElement('canvas');
    n.width = c.width; n.height = c.height;
    const x = n.getContext('2d');
    x.drawImage(c, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = cor;
    x.fillRect(0, 0, n.width, n.height);
    porCor[cor] = n;
  }
  return porCor[cor];
}

construirSprites();
