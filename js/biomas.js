'use strict';
// =====================================================================
//  BIOMAS: 8 zonas com cenário próprio (ladrilhos, decoração, tochas,
//  partículas no ar e luz), os monstros novos de cada zona e as
//  habilidades que os monstros ganham com o nível (Veterano / Campeão).
// =====================================================================

// ---------------------------------------------------------------------
//  Aspeto de cada zona
// ---------------------------------------------------------------------
const BIOMAS = [
  { escuro: 0.88, chama: ['#ff7b25', '#ffe14d'], brilho: '255,140,40', ar: 'poeira' },   // Masmorra
  { escuro: 0.9,  chama: ['#3fd46a', '#c8ffb0'], brilho: '90,255,140', ar: 'nevoa' },     // Cemitério
  { escuro: 0.84, chama: ['#ff5a1a', '#fff0a0'], brilho: '255,110,30', ar: 'brasa' },     // Cavernas de Lava
  { escuro: 0.86, chama: ['#5ab4ff', '#e0f6ff'], brilho: '110,190,255', ar: 'neve' },     // Abismo Gelado
  { escuro: 0.88, chama: ['#a8e04a', '#f4ffc0'], brilho: '160,255,80', ar: 'vagalume' },  // Pântano Venenoso
  { escuro: 0.76, chama: ['#ff9b2a', '#fff4c0'], brilho: '255,170,60', ar: 'areia' },     // Templo do Deserto
  { escuro: 0.87, chama: ['#5ae0ff', '#e8fcff'], brilho: '100,230,255', ar: 'brilho' },   // Caverna de Cristal
  { escuro: 0.92, chama: ['#c04dff', '#f0c8ff'], brilho: '190,80,255', ar: 'vazio' },     // Reino do Vazio
  { escuro: 0.72, chama: ['#ffe680', '#ffffff'], brilho: '255,240,180', ar: 'pena' },     // Cidadela Celeste (41-50)
  { escuro: 0.94, chama: ['#6a3aff', '#d0c0ff'], brilho: '120,80,255', ar: 'vazio' },     // Trono do Soberano (51-60)
];

// Até ao andar 40 muda a cada 5 andares; 41-50 e 51-60 são as zonas finais; depois repete tudo
const zonaDoAndar = a => a <= 40 ? Math.floor((a - 1) / 5) : a <= 60 ? 8 + Math.floor((a - 41) / 10) : Math.floor((a - 61) / 5) % NOMES_ZONAS.length;
const zonaAtual = () => zonaDoAndar(andar);
const bioma = () => BIOMAS[zonaAtual()];

// Um sprite simétrico escreve-se só com a metade esquerda
const simetrico = linhas => linhas.map(l => l + l.split('').reverse().join(''));

// ---------------------------------------------------------------------
//  Sprites dos monstros novos
// ---------------------------------------------------------------------
const GOBLIN = [
  '................',
  '.kk.........kk..',
  'kgGk.kkkkk.kGgk.',
  '.kgGkgggggkGgk..',
  '..kkgggggggkk...',
  '...kgygggygk....',
  '...kgggggggk....',
  '...kgkwkwkgk....',
  '....kgggggk..kk.',
  '..kkbbbbbbbkksk.',
  '.kgkbbbbbbbksssk',
  '.kgkbBbbbBbksssk',
  '..kkbbbbbbbkksk.',
  '....kbk.kbk..k..',
  '....kgk.kgk.....',
  '...kkk..kkk.....',
];
const PAL_GOBLIN = { g: '#8bc34a', G: '#5a8a2a', y: '#ffe14d', w: '#ffffff', b: '#8a5a2b', B: '#5a3a1a', s: '#c9a15a' };

const NECROMANTE = [
  '...........kkk..',
  '....kkkkk.kwwwk.',
  '...kpppppkkwkwk.',
  '..kpppppppkkwk..',
  '..kpkkkkkpk.kbk.',
  '..kpkgkgkpk.kbk.',
  '..kpkkkkkpk.kbk.',
  '.kppppppppkkkbk.',
  '.kpPppppPpkppbk.',
  'kppPppppPppkkbk.',
  'kpPpppppPpk.kbk.',
  'kpPpppppPpk.kbk.',
  'kpPppppppPk.kbk.',
  'kPPpPPpPPPk.kbk.',
  '.kkkkkkkkkk.kbk.',
  '............kk..',
];
const PAL_NECROMANTE = { p: '#6a3fb5', P: '#4a2a80', g: '#5dff7a', w: '#e8e2cf', b: '#6b4a2a' };

const SALAMANDRA = [
  '...........kkkk.',
  '..........kooyok',
  'kk..kkkkkkoooook',
  'kyk.koyoooyookk.',
  'kyrkooooooooook.',
  '.krooyoooooyok..',
  '..kkOOOOOOOOk...',
  '...kok.kok.kok..',
  '...kk..kk..kk...',
];
const PAL_SALAMANDRA = { o: '#ff9b45', O: '#c0602a', y: '#ffe14d', r: '#ff5a1a' };

const YETI = simetrico([
  '.....kkkk',
  '....kwwww',
  '...kwwwww',
  '...kwkbbb',
  '..kwwkbeb',
  '..kwwkbbb',
  '..kwwkbkw',
  '.kwwwwkbb',
  'kwwWwwwww',
  'kwWwwwwww',
  'kwWkwwwww',
  'kbbkwwwww',
  '.kk.kwwww',
  '....kwwwW',
  '....kwwwk',
  '...kWWWk.',
  '...kkkkk.',
]);
const PAL_YETI = { w: '#e8f4ff', W: '#a8c8e0', b: '#6a8ab0', e: '#ff4040' };

const SAPO = simetrico([
  '..kkk...',
  '.kwewk..',
  '.kwwwkkk',
  'kggggggg',
  'kgGgpggg',
  'kgggkkkk',
  '.kgggyyy',
  '.kgGgyyy',
  'kgggkggg',
  'kGGk.kgg',
  '.kk...kk',
]);
const PAL_SAPO = { g: '#7ed957', G: '#4a9a30', y: '#e8f0a0', w: '#ffffff', e: '#140f1c', p: '#b44dff' };

const PLANTA = simetrico([
  '....kkkk',
  '...krrrr',
  '..krRrrw',
  '..krrrrr',
  '..kkwkwk',
  '..kmmmmm',
  '..kmmmmm',
  '..kkwkwk',
  '..krrrrr',
  '...krRrr',
  '....kkkk',
  '......kg',
  '..kk..kg',
  '.kllk.kg',
  '.kLllkkg',
  '..kLlllg',
  '...kkkkk',
]);
const PAL_PLANTA = { r: '#e04050', R: '#a02030', w: '#ffffff', m: '#3a0a10', g: '#3fa34d', l: '#5fd35f', L: '#2f7a3a' };

const MUMIA = simetrico([
  '.....kkk',
  '....kwwW',
  '....kkyk',
  '....kWww',
  '.....kwW',
  '.kkkkkWw',
  'kwwWwwww',
  '.kkkkkww',
  '.....kwW',
  '.....kww',
  '.....kWw',
  '.....kwk',
  '.....kWk',
  '....kkkk',
]);
const PAL_MUMIA = { w: '#d8c9a3', W: '#a89878', y: '#5dff7a' };

const ESCORPIAO = simetrico([
  '......kk',
  '.....kyy',
  '......kO',
  '.kk...kO',
  'kook..kO',
  'kokk.kkO',
  '.kook.kO',
  '..kkoooo',
  '...koOoo',
  '.kkooooo',
  'kok.kOoo',
  'k.k.kooO',
  '.kk..koo',
  '......kk',
]);
const PAL_ESCORPIAO = { o: '#c8902e', O: '#8a5a1a', y: '#ff4040' };

const GOLEM_CRISTAL = simetrico([
  '.......kk',
  '.kk...kcC',
  'kcCk..kcC',
  'kcCk.kssS',
  '.kkk.kses',
  '..kkkssss',
  '.kssSssss',
  'kssSsscss',
  'kSsskssss',
  'kssk.ksss',
  'kcck.kSss',
  '.kk..kssS',
  '.....ksss',
  '.....kssk',
  '....kSSSk',
  '....kkkkk',
]);
const PAL_GOLEM_CRISTAL = { s: '#8a8fa0', S: '#5a5f70', c: '#7fe0ff', C: '#d8f8ff', e: '#7fe0ff' };

const ESPIRITO_CRISTAL = simetrico([
  '.......k',
  '......kC',
  '.....kCc',
  '....kCcc',
  '...kCccc',
  '..kCcccc',
  '.kCccekc',
  'kCcccccc',
  '.kcccccc',
  '..kcccPc',
  '...kcccc',
  '....kccc',
  '.....kcc',
  '......kc',
  '.......k',
]);
const PAL_ESPIRITO = { c: '#d07fff', C: '#f0c8ff', P: '#8a3fc0', e: '#ffffff' };

const OLHO_VAZIO = simetrico([
  '....kkkk',
  '..kkpppp',
  '.kpppppp',
  '.kppwwww',
  'kppwwwww',
  'kpwwwkrr',
  'kpwwwkrk',
  'kpwwwkrr',
  'kppwwwww',
  '.kppwwww',
  '.kpppppp',
  '..kkpppp',
  '...kpk.k',
  '..kpk..k',
  '..kk....',
]);
const PAL_OLHO = { p: '#7a2aa8', w: '#f0e8ff', r: '#ff3b8a' };

const SOMBRA = simetrico([
  '.....kkk',
  '....kddd',
  '...kdddd',
  '...kdydd',
  '...kdddd',
  '..kddddd',
  '.kdDdddd',
  'kdDddddd',
  'kdDddddd',
  '.kdddddd',
  '..kdDddd',
  '..kdDddd',
  '...kdDdd',
  '...kd.kd',
  '....k..k',
]);
const PAL_SOMBRA = { d: '#3a2a5a', D: '#241838', y: '#ff4dff' };

function criarSpritesBiomas() {
  SPR.goblin = [sprite(GOBLIN, PAL_GOBLIN)];
  SPR.necromante = [sprite(NECROMANTE, PAL_NECROMANTE)];
  SPR.salamandra = [sprite(SALAMANDRA, PAL_SALAMANDRA)];
  SPR.yeti = [sprite(YETI, PAL_YETI)];
  SPR.sapo = [sprite(SAPO, PAL_SAPO)];
  SPR.planta = [sprite(PLANTA, PAL_PLANTA), sprite(PLANTA.map((l, y) => y >= 5 && y <= 6 ? l.replace(/m/g, 'k') : l), PAL_PLANTA)];
  SPR.mumia = [sprite(MUMIA, PAL_MUMIA)];
  SPR.escorpiao = [sprite(ESCORPIAO, PAL_ESCORPIAO)];
  SPR.golemCristal = [sprite(GOLEM_CRISTAL, PAL_GOLEM_CRISTAL)];
  SPR.espiritoCristal = [sprite(ESPIRITO_CRISTAL, PAL_ESPIRITO)];
  SPR.olhoVazio = [sprite(OLHO_VAZIO, PAL_OLHO)];
  SPR.sombra = [sprite(SOMBRA, PAL_SOMBRA)];
  // tochas com a chama da cor de cada zona
  SPR.tochaZona = BIOMAS.map(b => [
    sprite(TOCHA, { f: b.chama[0], y: b.chama[1], b: '#6b4a2a' }),
    sprite(TOCHA, { f: escurecer(b.chama[0], 0.15), y: '#ffffff', b: '#6b4a2a' }),
  ]);
  SPR.decor = BIOMAS.map((_, z) => gerarDecoracoes(z));
  SPR.lama = gerarLama();
}

// ---------------------------------------------------------------------
//  Decoração do chão de cada zona (desenhada uma vez no mapa)
// ---------------------------------------------------------------------
function gerarDecoracoes(z) {
  const r = aleatorio(777 + z * 31);
  const lista = []; // { c, luz }
  const novo = () => novaGrade(16, 16);
  const fim = (g, luz = null, semContorno = false) => { if (!semContorno) contornar(g); lista.push({ c: gradeParaCanvas(g), luz }); };

  const ossos = () => {
    const g = novo();
    linha(g, 3, 11, 10, 8, '#d8d0c0'); pixel(g, 2, 11, '#f0e8d8'); pixel(g, 3, 12, '#f0e8d8'); pixel(g, 10, 7, '#f0e8d8'); pixel(g, 11, 8, '#f0e8d8');
    linha(g, 6, 13, 12, 13, '#b8b0a0'); pixel(g, 5, 13, '#d8d0c0'); pixel(g, 13, 13, '#d8d0c0');
    fim(g);
  };
  const caveira = () => {
    const g = novo();
    elipse(g, 8, 10, 4, 3.5, tons('#e8e2cf'));
    pixel(g, 6, 10, CONTORNO); pixel(g, 10, 10, CONTORNO); pixel(g, 8, 12, CONTORNO);
    fim(g);
  };
  const pedras = cor => {
    const g = novo();
    elipse(g, 6, 11, 3, 2, tons(cor)); elipse(g, 11, 12, 2, 1.5, tons(escurecer(cor, 0.1)));
    fim(g);
  };
  switch (z) {
    case 0: // Masmorra
      ossos(); caveira(); pedras('#5a5068');
      { // barril
        const g = novo();
        for (let y = 4; y <= 13; y++) for (let x = 4; x <= 11; x++) pixel(g, x, y, (y === 6 || y === 11) ? '#3a3a40' : x < 6 ? '#a0703a' : x > 9 ? '#6b4a2a' : '#8a5a2b');
        linha(g, 5, 4, 10, 4, '#b08048');
        fim(g);
      }
      break;
    case 1: // Cemitério
      for (let k = 0; k < 2; k++) { // lápides
        const g = novo(), c = k ? '#8a8a96' : '#6e7080';
        for (let y = 5; y <= 13; y++) for (let x = 4; x <= 11; x++) if (y > 6 || (x > 4 && x < 11)) pixel(g, x, y, x < 6 ? clarear(c, 0.2) : c);
        linha(g, 6, 8, 9, 8, escurecer(c, 0.4)); linha(g, 6, 10, 9, 10, escurecer(c, 0.4));
        if (k) { pixel(g, 12, 13, '#4a7a3a'); pixel(g, 3, 13, '#4a7a3a'); }
        fim(g);
      }
      { // cruz de madeira
        const g = novo();
        linha(g, 8, 3, 8, 13, '#6b4a2a', 2); linha(g, 5, 6, 11, 6, '#6b4a2a', 2);
        fim(g);
      }
      ossos();
      break;
    case 2: // Cavernas de Lava
      for (let k = 0; k < 2; k++) { // fendas de lava a brilhar
        const g = novo();
        let x = 3, y = 5 + k * 3;
        for (let s = 0; s < 6; s++) { const nx = x + 2, ny = y + Math.round(r() * 2 - 0.6); linha(g, x, y, nx, ny, '#ff7b25'); pixel(g, x, y + 1, '#ffe14d'); x = nx; y = ny; }
        fim(g, '#ff7b25', true);
      }
      pedras('#4a2a24');
      ossos();
      break;
    case 3: // Abismo Gelado
      for (let k = 0; k < 2; k++) { // estalagmites de gelo
        const g = novo();
        poligono(g, [[5, 14], [8, 2 + k * 3], [11, 14]], x => x < 8 ? '#e0f6ff' : '#8ac8f0');
        poligono(g, [[10, 14], [12, 8], [14, 14]], '#a8dcff');
        fim(g, k ? null : '#9fdcff');
      }
      { // monte de neve
        const g = novo();
        elipse(g, 8, 12, 5, 2.5, { base: '#e8f4ff', claro: '#ffffff', escuro: '#b8d4ea' });
        fim(g);
      }
      break;
    case 4: // Pântano Venenoso
      for (let k = 0; k < 2; k++) { // cogumelos luminosos
        const g = novo(), c = k ? '#b44dff' : '#7dff5a';
        linha(g, 7, 9, 7, 13, '#e8e2cf', 2);
        elipse(g, 8, 8, 4, 2.5, tons(c));
        pixel(g, 6, 7, '#ffffff'); pixel(g, 9, 8, '#ffffff');
        linha(g, 12, 11, 12, 13, '#e8e2cf'); elipse(g, 12, 10.5, 2, 1.3, tons(c));
        fim(g, c);
      }
      { // juncos
        const g = novo();
        for (const x of [4, 6, 9, 11]) { linha(g, x, 14, x + (x % 3) - 1, 5 + (x % 4), '#5a8a3a'); pixel(g, x + (x % 3) - 1, 5 + (x % 4), '#8a5a2b'); pixel(g, x + (x % 3) - 1, 6 + (x % 4), '#8a5a2b'); }
        fim(g);
      }
      break;
    case 5: // Templo do Deserto
      { // vaso
        const g = novo();
        elipse(g, 8, 10, 4, 4, tons('#c07a3a'));
        linha(g, 6, 5, 10, 5, '#a0602a', 2); linha(g, 5, 9, 11, 9, '#ffd23f');
        fim(g);
      }
      { // coluna partida
        const g = novo();
        for (let y = 6; y <= 13; y++) for (let x = 5; x <= 10; x++) pixel(g, x, y, x < 7 ? '#e8d8b0' : x > 8 ? '#a89060' : '#c8b088');
        pixel(g, 5, 5, '#e8d8b0'); pixel(g, 6, 4, '#e8d8b0'); pixel(g, 9, 5, '#c8b088');
        linha(g, 4, 13, 11, 13, '#8a7048');
        fim(g);
      }
      { // monte de areia
        const g = novo();
        elipse(g, 8, 12, 6, 2.5, { base: '#d8b878', claro: '#f0d8a0', escuro: '#b09058' });
        fim(g, null, true);
      }
      caveira();
      break;
    case 6: // Caverna de Cristal
      for (const c of ['#7fe0ff', '#ff7fd0', '#b48cff']) {
        const g = novo();
        poligono(g, [[4, 14], [6, 5], [8, 14]], x => x < 6 ? clarear(c, 0.5) : c);
        poligono(g, [[7, 14], [10, 2], [12, 14]], x => x < 10 ? clarear(c, 0.5) : escurecer(c, 0.2));
        poligono(g, [[11, 14], [13, 9], [14, 14]], c);
        fim(g, c);
      }
      pedras('#34406a');
      break;
    case 7: // Reino do Vazio
      { // runa a brilhar
        const g = novo(), c = '#d07fff';
        for (let a = 0; a < 16; a++) pixel(g, 8 + Math.round(Math.cos(a / 16 * Math.PI * 2) * 5), 9 + Math.round(Math.sin(a / 16 * Math.PI * 2) * 3), c);
        linha(g, 5, 9, 11, 9, c); linha(g, 8, 7, 8, 11, c);
        fim(g, '#b44dff', true);
      }
      { // fragmento a flutuar
        const g = novo();
        poligono(g, [[8, 2], [11, 7], [8, 11], [5, 7]], x => x < 8 ? '#5a3a8a' : '#2e1a40');
        pixel(g, 7, 5, '#d07fff');
        elipse(g, 8, 14, 3, 1, { base: '#07040c' }, false);
        fim(g);
      }
      pedras('#2e1a40');
      break;
    case 8: // Cidadela Celeste: cristais dourados e penas
      for (const c of ['#ffe680', '#ffffff', '#fff0a0']) {
        const g = novo();
        poligono(g, [[5, 14], [8, 3], [11, 14]], x => x < 8 ? clarear(c, 0.4) : escurecer(c, 0.15));
        fim(g, c);
      }
      pedras('#c8c0e0');
      break;
    case 9: // Trono do Soberano: ossos, caveiras e runas
      ossos(); caveira();
      { const g = novo(), c = '#8a6aff';
        for (let a = 0; a < 16; a++) pixel(g, 8 + Math.round(Math.cos(a / 16 * Math.PI * 2) * 5), 9 + Math.round(Math.sin(a / 16 * Math.PI * 2) * 3), c);
        fim(g, '#6a3aff', true); }
      pedras('#2a1a3a');
      break;
  }
  return lista;
}

// Água parada do pântano (abranda quem passa)
function gerarLama() {
  const r = aleatorio(4242);
  const g = novaGrade(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = r() < 0.08 ? '#2e4a24' : '#22381c';
  linha(g, 3, 5, 7, 5, '#4a6e38'); linha(g, 9, 11, 13, 11, '#4a6e38');
  pixel(g, 11, 3, '#6a9a4a'); pixel(g, 4, 12, '#6a9a4a');
  return gradeParaCanvas(g);
}

// Chamado pelo renderizarMapa: põe decoração e (no pântano) poças de lama
function decorarMapa(m, g, T, nAndar) {
  const z = zonaDoAndar(nAndar);
  const decos = SPR.decor[z];
  m.luzes = [];
  m.lama = new Set();
  criarAnimados(m, z); // gotas, teias, lava, água... (cenario.js)
  if (m.eBoss) return;
  const perto = (x, y, p, d) => Math.hypot((x + 0.5) * TILE - p.x, (y + 0.5) * TILE - p.y) < d;
  if (z === 4) { // poças de lama em algumas salas
    for (const s of m.salas) {
      if (s === m.salaInicio || Math.random() < 0.35) continue;
      const cx = s.x + randInt(1, Math.max(1, s.w - 2)), cy = s.y + randInt(1, Math.max(1, s.h - 2));
      const rx = rand(1.2, 2.6), ry = rand(1, 2.2);
      for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1 || solido(m, x, y)) continue;
        if (perto(x, y, m.escada, 60) || perto(x, y, m.inicio, 60)) continue;
        m.lama.add(y * m.W + x);
        g.drawImage(SPR.lama, x * T, y * T);
      }
    }
  }
  for (let y = 1; y < m.H - 1; y++) for (let x = 1; x < m.W - 1; x++) {
    if (solido(m, x, y) || m.lama.has(y * m.W + x)) continue;
    const h = Math.abs((x * 92837111) ^ (y * 689287499));
    if (h % 100 >= 6) continue;
    if (perto(x, y, m.escada, 50) || perto(x, y, m.inicio, 50)) continue;
    const d = decos[(h >> 7) % decos.length];
    g.drawImage(d.c, x * T, y * T);
    if (d.luz) m.luzes.push({ x: (x + 0.5) * TILE, y: (y + 0.6) * TILE, cor: d.luz });
  }
}

// ---------------------------------------------------------------------
//  Estado extra do andar: poças (fogo, veneno, gosma) e partículas no ar
// ---------------------------------------------------------------------
let pocas = [], ambiente = [];
const COR_POCA = { fogo: '#ff7b25', veneno: '#7dff5a', gosma: '#5fd35f' };

function reiniciarBioma() { pocas = []; ambiente = []; }

function criarPoca(x, y, tipo, r, dur, dano = 0) {
  if (pocas.length > 70) pocas.shift();
  pocas.push({ x, y, tipo, r, t: dur, dur, dano });
}

function aplicarVeneno(dps, dur = 3) {
  if (imuneVeneno()) return;
  if (!(J.veneno > 0)) texto(J.x, J.y - 30, 'Envenenado!', '#7dff5a', 15);
  J.veneno = Math.max(J.veneno || 0, dur);
  J.venenoDps = Math.max(J.venenoDps || 0, dps);
}

// veneno: tira vida aos poucos, mas nunca te mata sozinho
function atualizarVeneno(dt) {
  if (J.veneno > 0) {
    J.veneno -= dt;
    J.venenoAcum = (J.venenoAcum || 0) + J.venenoDps * dt;
    if (J.venenoAcum >= 1) {
      const q = Math.floor(J.venenoAcum);
      J.venenoAcum -= q;
      J.hp = Math.max(1, J.hp - q);
      if (Math.random() < 0.5) texto(J.x, J.y - 22, `-${q}`, '#7dff5a', 13);
    }
    if (Math.random() < 0.25) particulas.push({ x: J.x + rand(-8, 8), y: J.y + rand(-10, 6), vx: 0, vy: -30, t: 0.5, cor: '#7dff5a', tam: 3 });
    if (J.veneno <= 0) J.venenoDps = 0;
  }
}

function atualizarBioma(dt) {
  atualizarVeneno(dt);
  // poças
  J.pocaCd = (J.pocaCd || 0) - dt;
  for (const p of pocas) {
    p.t -= dt;
    if (J.dashT > 0 || Math.hypot(p.x - J.x, p.y - J.y) > p.r + J.r * 0.4) continue;
    if (p.tipo === 'gosma') J.lentoT = Math.max(J.lentoT, 0.3);
    else if (p.tipo === 'veneno') aplicarVeneno(Math.max(2, p.dano * 0.3), 2.5);
    else if (p.tipo === 'fogo' && J.pocaCd <= 0 && !imuneFogoChao()) { J.pocaCd = 0.6; J.causaProxima = 'o fogo no chão'; danoJogador(Math.max(1, Math.round(p.dano * 0.6)), null, null); }
  }
  pocas = pocas.filter(p => p.t > 0);
  // salpicos ao andar na lama
  if (J.andando && naLama() && Math.random() < 0.3) particulas.push({ x: J.x + rand(-6, 6), y: J.y + 12, vx: rand(-30, 30), vy: -40, t: 0.3, cor: '#4a6e38', tam: 3 });
  atualizarAmbiente(dt);
}

const naLama = () => mapa.lama && mapa.lama.has(Math.floor(J.y / TILE) * mapa.W + Math.floor(J.x / TILE));
const fatorTerreno = () => (J.dashT <= 0 && naLama()) ? 0.6 : 1;

// Partículas no ar (poeira, neve, brasas, vaga-lumes...)
function atualizarAmbiente(dt) {
  const tipo = bioma().ar, max = tipo === 'nevoa' ? 14 : 40;
  const x0 = cam.x - 60, y0 = cam.y - 60, w = vistaW() + 120, h = vistaH() + 120;
  while (ambiente.length < max) {
    const a = { x: x0 + Math.random() * w, y: y0 + Math.random() * h, t: rand(3, 7), fase: Math.random() * 6, vx: 0, vy: 0, tam: 2 };
    if (tipo === 'poeira') { a.vx = rand(-6, 6); a.vy = rand(-4, 4); a.cor = 'rgba(200,190,220,0.35)'; }
    else if (tipo === 'nevoa') { a.vx = rand(6, 16); a.vy = rand(-2, 2); a.cor = 'rgba(150,200,170,0.07)'; a.tam = rand(40, 80); }
    else if (tipo === 'brasa') { a.vx = rand(-10, 10); a.vy = rand(-50, -20); a.cor = Math.random() < 0.5 ? '#ff9b45' : '#ffe14d'; }
    else if (tipo === 'neve') { a.vx = rand(10, 30); a.vy = rand(30, 60); a.cor = 'rgba(240,248,255,0.8)'; a.tam = Math.random() < 0.3 ? 4 : 2; }
    else if (tipo === 'vagalume') { a.vx = rand(-12, 12); a.vy = rand(-12, 12); a.cor = '#d8ff6a'; }
    else if (tipo === 'areia') { a.vx = rand(40, 80); a.vy = rand(-6, 6); a.cor = 'rgba(240,210,150,0.5)'; }
    else if (tipo === 'pena') { a.vx = rand(-12, 12); a.vy = rand(15, 35); a.cor = Math.random() < 0.6 ? '#fff6c8' : '#ffe680'; a.tam = 3; }
    else if (tipo === 'brilho') { a.vx = rand(-4, 4); a.vy = rand(-8, -2); a.cor = Math.random() < 0.5 ? '#bff4ff' : '#ffc0f0'; }
    else { a.vx = rand(-6, 6); a.vy = rand(-25, -8); a.cor = Math.random() < 0.5 ? '#b44dff' : '#5a2a8a'; }
    ambiente.push(a);
  }
  for (const a of ambiente) {
    a.t -= dt; a.fase += dt;
    a.x += (a.vx + (bioma().ar === 'vagalume' ? Math.sin(a.fase * 2) * 15 : 0)) * dt;
    a.y += a.vy * dt;
    if (a.x < x0 || a.x > x0 + w || a.y < y0 || a.y > y0 + h) a.t = 0;
  }
  ambiente = ambiente.filter(a => a.t > 0);
}

function desenharAmbiente() {
  const tipo = bioma().ar;
  for (const a of ambiente) {
    let alfa = clamp(Math.min(a.t, 1.2) / 1.2, 0, 1);
    if (tipo === 'vagalume' || tipo === 'brilho' || tipo === 'pena') alfa *= 0.4 + 0.6 * Math.abs(Math.sin(a.fase * 3));
    ctx.globalAlpha = alfa;
    if (tipo === 'nevoa') circulo(a.x, a.y, a.tam, a.cor);
    else { ctx.fillStyle = a.cor; ctx.fillRect(alinhar(a.x), alinhar(a.y), a.tam, a.tam); }
  }
  ctx.globalAlpha = 1;
}

function desenharPocas(t) {
  for (const p of pocas) {
    const f = Math.min(1, p.t / 0.6, (p.dur - p.t) / 0.2 + 0.3);
    ctx.globalAlpha = 0.45 * f;
    ctx.fillStyle = COR_POCA[p.tipo];
    ctx.beginPath();
    ctx.ellipse(alinhar(p.x), alinhar(p.y), p.r, p.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7 * f;
    if (p.tipo === 'fogo' && Math.random() < 0.15) particulas.push({ x: p.x + rand(-p.r, p.r) * 0.7, y: p.y, vx: 0, vy: -50, t: 0.4, cor: '#ffe14d', tam: 3 });
    if (p.tipo === 'veneno' && Math.random() < 0.06) particulas.push({ x: p.x + rand(-p.r, p.r) * 0.6, y: p.y, vx: 0, vy: -25, t: 0.6, cor: '#b4ff8a', tam: 4 });
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Nível dos monstros (I normal, II Veterano, III Campeão)
// ---------------------------------------------------------------------
// Habilidades que alguns monstros já têm de base
const HAB_BASE = { salamandra: ['rasto'], escorpiao: ['veneno'], sombra: ['invisivel', 'vampiro'] };

function sortearNivel() {
  const pos = (andar - 1) % 5, ciclo = Math.floor((andar - 1) / 40), k = dif().elite;
  const kc = 1 + 0.5 * nPacto('campeoes');
  let p3 = ([0, 0.05, 0.12, 0.2, 0.3][pos] + ciclo * 0.25 + Math.min(0.1, andar * 0.003)) * k * kc;
  let p2 = ([0.15, 0.3, 0.4, 0.45, 0.45][pos] + Math.min(0.1, andar * 0.003)) * Math.min(1.3, k) * kc;
  if (andar <= 1) { p3 = 0; p2 = 0.1; }
  else if (andar <= 3) { p3 = 0; p2 = Math.min(p2, 0.2); } // começo mais suave em todas as dificuldades
  const r = Math.random();
  return r < p3 ? 3 : r < p3 + p2 ? 2 : 1;
}

function aplicarNivel(e, nv) {
  const N = NIVEIS_INIMIGO[nv], d = INIMIGOS[e.tipo];
  e.nv = nv;
  if (nv >= 2 && d.hab && d.hab[2]) e.hab.add(d.hab[2]);
  if (nv >= 3 && d.hab && d.hab[3]) e.hab.add(d.hab[3]);
  e.hp = e.maxHp = Math.round(e.maxHp * N.hp);
  e.dano = Math.round(e.dano * N.dano);
  e.xp = Math.round(e.xp * N.xp);
  if (N.nome) e.nome = `${e.nome} ${N.nome}`;
}

// Mostra o nome da habilidade por cima do monstro na primeira vez que a usa
function anunciar(e, hab) {
  if (!e.anunciado) e.anunciado = new Set();
  if (e.anunciado.has(hab)) return;
  e.anunciado.add(hab);
  const N = NIVEIS_INIMIGO[e.nv || 1];
  // textos seguidos do mesmo monstro ficam uns por cima dos outros, sem se tapar
  const recente = tempoJogo - (e.ultimoAnuncio || -9) < 1;
  e.pilhaAnuncio = recente ? (e.pilhaAnuncio || 0) + 1 : 0;
  e.ultimoAnuncio = tempoJogo;
  texto(e.x, e.y - e.r - 14 - e.pilhaAnuncio * 16, HABILIDADES_INIMIGO[hab] || hab, (N && N.cor) || '#ffffff', 14);
}

// Aviso na primeira vez que vês um monstro novo
function veMonstroNovo(e) {
  const jaViu = !!(meta.vistos && meta.vistos[e.tipo]);
  viuMonstro(e.tipo); // conta para o bestiário (todos os monstros)
  const d = INIMIGOS[e.tipo];
  if (jaViu || !d || !d.desc) return;
  avisar(`Novo monstro: ${d.nome}`, d.desc, d.cor);
  if (Object.keys(INIMIGOS).filter(k => INIMIGOS[k].desc && meta.vistos[k]).length >= 12) desbloquear('bestiario');
}

// ---------------------------------------------------------------------
//  Tiros dos monstros (com Leque e Rajada)
// ---------------------------------------------------------------------
function tiroInimigo(e, ux, uy, o) {
  const base = Math.atan2(uy, ux);
  let angs = o.angs || [0];
  if (e.hab.has('leque') && angs.length === 1) { angs = [-0.28, 0, 0.28]; anunciar(e, 'leque'); }
  for (const a of angs) {
    const p = disparar(e.x, e.y, Math.cos(base + a), Math.sin(base + a), o.vel, o.dano, o.cor, o.r, o.tipo || 'bola', o.vida || 3);
    if (o.efeito) p.efeito = o.efeito;
    p.origem = e;
  }
  if (e.hab.has('rajada') && !o.repetido) { e.rajada = { t: 0.3, o: Object.assign({}, o, { repetido: true }) }; anunciar(e, 'rajada'); }
}

// ---------------------------------------------------------------------
//  Habilidades
// ---------------------------------------------------------------------
function pontoPerto(x, y, dmin, dmax, r) {
  for (let k = 0; k < 16; k++) {
    const a = rand(0, Math.PI * 2), dd = rand(dmin, dmax);
    const px = x + Math.cos(a) * dd, py = y + Math.sin(a) * dd;
    if (!colideCirculo(mapa, px, py, r + 2) && linhaDeVista(mapa, x, y, px, py, 4)) return { x: px, y: py };
  }
  return null;
}

function teletransportar(e, dmin, dmax) {
  const p = pontoPerto(J.x, J.y, dmin, dmax, e.r);
  if (!p) return false;
  explosao(e.x, e.y, e.cor, 10, 140, 3);
  e.x = p.x; e.y = p.y;
  explosao(e.x, e.y, e.cor, 10, 140, 3);
  som(900, 0.12, 'sine', 0.03, 500);
  return true;
}

// Movimentos especiais que tomam conta do monstro (investida, teletransporte, enterrar)
function movimentoHabilidade(e, dt, d, ux, uy) {
  if (e.inv > 0) { e.inv -= dt; return { vx: e.cx * e.velInv, vy: e.cy * e.velInv }; }
  if (e.prepInv > 0) {
    e.prepInv -= dt;
    if (e.prepInv <= 0) { e.inv = 0.35; e.cx = ux; e.cy = uy; e.velInv = Math.max(320, e.vel * 3.4); som(300, 0.15, 'sawtooth', 0.03, 200); }
    return { vx: 0, vy: 0 };
  }
  if (e.hab.has('investida') && (e.cdInv = (e.cdInv ?? rand(1, 3)) - dt) <= 0 && d < 230 && d > 50 && linhaDeVista(mapa, e.x, e.y, J.x, J.y, e.r)) {
    e.cdInv = rand(3.2, 4.2);
    e.prepInv = 0.4;
    anunciar(e, 'investida');
    return { vx: 0, vy: 0 };
  }
  if (e.hab.has('teleporte') && e.tipo !== 'espiritoCristal' && (e.cdTp = (e.cdTp ?? rand(3, 6)) - dt) <= 0 && d < 420) {
    e.cdTp = rand(5.5, 7.5);
    if (teletransportar(e, 70, 120)) { anunciar(e, 'teleporte'); e.cd = Math.min(e.cd, 0.5); }
  }
  return null;
}

// Habilidades que correm "por cima" do movimento normal
function habilidadesPassivas(e, dt, d, ux, uy) {
  if (e.rajada) {
    e.rajada.t -= dt;
    if (e.rajada.t <= 0) { const o = e.rajada.o; e.rajada = null; tiroInimigo(e, ux, uy, o); }
  }
  if (e.buffT > 0) e.buffT -= dt;
  // rasto (fogo / veneno) e gosma
  if (e.hab.has('rasto') || e.hab.has('gosma')) {
    e.cdRasto = (e.cdRasto || 0) - dt;
    const mexe = Math.hypot(e.x - (e.px ?? e.x), e.y - (e.py ?? e.y)) > 0.5;
    if (e.cdRasto <= 0 && mexe) {
      e.cdRasto = 0.45;
      const tipo = e.hab.has('gosma') ? 'gosma' : (e.tipo === 'sapo' ? 'veneno' : 'fogo');
      criarPoca(e.x, e.y + e.r * 0.5, tipo, tipo === 'fogo' ? 18 : 22, tipo === 'fogo' ? 2.8 : 4, e.dano);
      if (e.nv > 1 || e.tipo !== 'salamandra') anunciar(e, e.hab.has('gosma') ? 'gosma' : 'rasto');
    }
  }
  e.px = e.x; e.py = e.y;
  if (e.hab.has('furia') && !e.enfurecido && e.hp < e.maxHp * 0.5) {
    e.enfurecido = true;
    e.vel *= 1.45;
    e.dano = Math.round(e.dano * 1.2);
    anunciar(e, 'furia');
    som(160, 0.3, 'sawtooth', 0.04, 80);
  }
  // grito de guerra (orc) e uivo (lobo): acorda e acelera os aliados
  for (const h of ['grito', 'uivo']) {
    if (!e.hab.has(h)) continue;
    e.cdGrito = (e.cdGrito ?? rand(1, 3)) - dt;
    if (e.cdGrito > 0 || d > 320) continue;
    e.cdGrito = 10;
    for (const o of inimigos) if (!o.morto && !o.boss && Math.hypot(o.x - e.x, o.y - e.y) < 240) { o.acordado = true; o.buffT = 4; }
    ondas.push({ x: e.x, y: e.y, r: 240, t: 0.6, dur: 0.6, cor: h === 'uivo' ? '#bfe6ff' : '#ff6060' });
    anunciar(e, h);
    som(h === 'uivo' ? 500 : 120, 0.5, h === 'uivo' ? 'sine' : 'sawtooth', 0.04, h === 'uivo' ? 300 : -40);
  }
  if (e.hab.has('cura')) {
    e.cdCura = (e.cdCura ?? rand(2, 4)) - dt;
    if (e.cdCura <= 0) {
      e.cdCura = 6;
      let curou = false;
      for (const o of inimigos) {
        if (o.morto || o.boss || o.hp >= o.maxHp || Math.hypot(o.x - e.x, o.y - e.y) > 170) continue;
        const q = Math.round(o.maxHp * 0.2);
        o.hp = Math.min(o.maxHp, o.hp + q);
        texto(o.x, o.y - o.r - 6, `+${q}`, '#5dff7a', 13);
        curou = true;
      }
      if (curou) { ondas.push({ x: e.x, y: e.y, r: 170, t: 0.6, dur: 0.6, cor: '#5dff7a' }); anunciar(e, 'cura'); som(700, 0.25, 'sine', 0.03, 300); }
    }
  }
  if (e.hab.has('nova')) {
    e.cdNova = (e.cdNova ?? rand(1, 2)) - dt;
    if (e.cdNova <= 0 && d < 120) {
      e.cdNova = 4.5;
      anelProjeteis(e, 8, e.tipo === 'olhoVazio' ? '#d07fff' : e.tipo === 'golemCristal' ? '#7fe0ff' : '#bfe6ff', e.tipo === 'elementalGelo' || e.tipo === 'yeti' ? 'gelo' : null);
      anunciar(e, 'nova');
    }
  }
  if (e.hab.has('teia')) {
    e.cdTeia = (e.cdTeia ?? rand(1, 3)) - dt;
    if (e.cdTeia <= 0 && d < 320 && linhaDeVista(mapa, e.x, e.y, J.x, J.y, 4)) {
      e.cdTeia = 4.5;
      disparar(e.x, e.y, ux, uy, 240, Math.round(e.dano * 0.5), '#e8e8f0', 8, 'teia', 2).efeito = 'teia';
      anunciar(e, 'teia');
    }
  }
  if (e.hab.has('bomba')) {
    e.cdBomba = (e.cdBomba ?? rand(2, 4)) - dt;
    if (e.cdBomba <= 0 && d > 70 && d < 300 && !e.roubou) {
      e.cdBomba = 4.5;
      perigos.push({ x: J.x, y: J.y, r: 50, t: 1.1, dur: 1.1, dano: Math.round(e.dano * 1.6), cor: '#ff9b45', semQueda: true });
      anunciar(e, 'bomba');
    }
  }
  // invisível: quase não se vê quando está longe
  if (e.hab.has('invisivel')) {
    const vis = d < 110 || e.flash > 0 || e.inv > 0 || e.prepInv > 0;
    const alvo = vis ? 1 : (e.tipo === 'sombra' ? 0.08 : 0.15 + 0.1 * Math.sin(e.t * 2));
    e.alfa = (e.alfa ?? 1) + (alvo - (e.alfa ?? 1)) * Math.min(1, dt * 6);
    if (!vis && e.nv > 1 && e.tipo !== 'sombra') anunciar(e, 'invisivel');
  }
}

function anelProjeteis(e, n, cor, efeito) {
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + e.t;
    const p = disparar(e.x, e.y, Math.cos(a), Math.sin(a), 200, Math.round(e.dano * 0.6), cor, 6, e.tipo === 'golemCristal' || e.tipo === 'espiritoCristal' ? 'estilhaco' : 'bola', 2);
    if (efeito) p.efeito = efeito;
  }
  som(1000, 0.15, 'sine', 0.03, -600);
}

// Quando um monstro acerta no jogador
function aoAcertarJogador(e, dano) {
  if (e.hab.has('vampiro')) {
    const q = Math.max(1, Math.round(dano * 2));
    e.hp = Math.min(e.maxHp, e.hp + q);
    texto(e.x, e.y - e.r - 6, `+${q}`, '#ff4d6d', 13);
    anunciar(e, 'vampiro');
  }
  if (e.hab.has('veneno')) {
    aplicarVeneno(Math.max(2, e.dano * 0.3), 3);
    if (e.nv > 1 || !HAB_BASE[e.tipo]) anunciar(e, 'veneno');
  }
  if (e.tipo === 'goblin' && !e.roubou && J.ouro > 0) {
    const n = Math.min(J.ouro, 5 + andar * 3);
    J.ouro -= n;
    e.roubou = n;
    e.fugir = 9;
    texto(J.x, J.y - 36, `-${n} ouro!`, '#ffd23f', 16);
    som(1500, 0.08, 'square', 0.03, -900);
  }
}

// Quando um monstro leva dano
function aoSerAtingido(e) {
  if (e.tipo === 'golemCristal' && !e.morto) {
    e.cdEstilhaco = (e.cdEstilhaco || 0);
    if (tempoJogo - e.cdEstilhaco > 1.8) { e.cdEstilhaco = tempoJogo; anelProjeteis(e, 5, '#7fe0ff', null); }
  }
  if (e.tipo === 'goblin' && e.roubou && e.hp > 0) e.fugir = Math.max(e.fugir, 3);
}

// Quando um monstro morre
function aoMorrerInimigo(e) {
  if (e.hab && e.hab.has('dividir') && !e.mini) {
    anunciar(e, 'dividir');
    for (let k = 0; k < 2; k++) {
      const p = pontoPerto(e.x, e.y, 6, 26, 8) || { x: e.x, y: e.y };
      const m = criarInimigo(e.tipo, p.x, p.y);
      m.mini = true;
      m.acordado = true;
      m.r = Math.max(8, Math.round(e.r * 0.7));
      m.hp = m.maxHp = Math.max(1, Math.round(e.maxHp * 0.35));
      m.dano = Math.max(1, Math.round(e.dano * 0.6));
      m.xp = Math.max(1, Math.round(e.xp * 0.25));
      m.kbx = (p.x - e.x) * 12; m.kby = (p.y - e.y) * 12;
      inimigos.push(m);
    }
  }
  if (e.hab && e.hab.has('nuvem')) {
    criarPoca(e.x, e.y, 'veneno', 58, 5, e.dano);
    anunciar(e, 'nuvem');
  }
  if (e.dourado) premioDourado(e);
  if (e.tipo === 'goblin' && e.roubou) {
    soltarOuro(e.x, e.y, Math.round(e.roubou * 1.5), 5);
    texto(e.x, e.y - 30, 'Recuperaste o ouro!', '#ffd23f', 15);
  }
}

// ---------------------------------------------------------------------
//  Comportamento dos monstros novos (e da aranha)
// ---------------------------------------------------------------------
function movimentoBioma(e, dt, d, ux, uy, ru) {
  const vejo = () => linhaDeVista(mapa, e.x, e.y, J.x, J.y, 4);
  // afasta-se se estiver perto, aproxima-se se estiver longe, e anda de lado pelo meio
  const manterDistancia = (perto, longe, vel = e.vel) => {
    if (!vejo() || d > longe) return { vx: ru.x * vel, vy: ru.y * vel };
    if (d < perto) return { vx: -ux * vel, vy: -uy * vel };
    const s = Math.sin(e.t * 0.9) > 0 ? 1 : -1;
    return { vx: -uy * vel * 0.6 * s, vy: ux * vel * 0.6 * s };
  };
  switch (e.tipo) {
    case 'aranha': {
      const a = Math.atan2(ru.y, ru.x) + Math.sin(e.t * 7) * 0.6;
      return { vx: Math.cos(a) * e.vel, vy: Math.sin(a) * e.vel };
    }
    case 'goblin': {
      if (e.dourado) return movimentoDourado(e, dt, d, ux, uy);
      if (e.roubou) { // foge com o ouro
        e.fugir -= dt;
        if (e.fugir <= 0 && d > 380) {
          e.morto = true;
          mostrarBanner('O goblin fugiu!', `Levou ${e.roubou} de ouro`, '#ffd23f');
          return { vx: 0, vy: 0 };
        }
        if (Math.random() < 0.2) particulas.push({ x: e.x, y: e.y, vx: 0, vy: -20, t: 0.4, cor: '#ffd23f', tam: 3 });
        return { vx: -ux * e.vel * 1.05, vy: -uy * e.vel * 1.05 };
      }
      return { vx: ru.x * e.vel, vy: ru.y * e.vel };
    }
    case 'necromante': {
      const mov = manterDistancia(170, 280);
      if (e.cd <= 0 && d < 420 && vejo()) {
        e.cd = rand(2.4, 3.4);
        const lacaios = inimigos.filter(o => o.mestre === e && !o.morto).length;
        if (lacaios < (e.nv >= 3 ? 3 : 2)) {
          invocar('esqueleto', e, 44);
          const m = inimigos[inimigos.length - 1];
          if (m && m !== e) { m.mestre = e; m.xp = 1; }
          ondas.push({ x: e.x, y: e.y, r: 50, t: 0.5, dur: 0.5, cor: '#5dff7a' });
          som(200, 0.4, 'sine', 0.03, -100);
        } else {
          tiroInimigo(e, ux, uy, { vel: 220, dano: e.dano, cor: '#b44dff', r: 7 });
          som(400, 0.12, 'sine', 0.03, -200);
        }
      }
      return mov;
    }
    case 'salamandra': {
      const a = Math.atan2(ru.y, ru.x) + Math.sin(e.t * 4) * 0.5;
      if (e.cd <= 0 && d < 300 && vejo()) {
        e.cd = rand(2.6, 3.4);
        tiroInimigo(e, ux, uy, { vel: 240, dano: e.dano, cor: '#ff7b25', r: 7, tipo: 'fogo', vida: 2.5 });
        som(250, 0.15, 'sawtooth', 0.03, -100);
      }
      return { vx: Math.cos(a) * e.vel, vy: Math.sin(a) * e.vel };
    }
    case 'yeti': {
      if (e.esmagar > 0) { // pisão: aviso vermelho e depois onda de choque
        e.esmagar -= dt;
        if (e.esmagar <= 0) {
          ondas.push({ x: e.x, y: e.y, r: 100, t: 0.4, dur: 0.4, cor: '#e8f4ff' });
          tremor = Math.max(tremor, 8);
          som(70, 0.35, 'sawtooth', 0.05, -30);
          if (d < 100 + J.r) { danoJogador(Math.round(e.dano * 1.3), e.x, e.y, e); J.lentoT = Math.max(J.lentoT, 1.2); }
        }
        return { vx: 0, vy: 0 };
      }
      e.cdPisao = (e.cdPisao ?? 2) - dt;
      if (d < 90 && e.cdPisao <= 0) { e.cdPisao = 4; e.esmagar = 0.6; return { vx: 0, vy: 0 }; }
      if (e.cd <= 0 && d > 110 && d < 360 && vejo()) {
        e.cd = rand(2.2, 3);
        tiroInimigo(e, ux, uy, { vel: 260, dano: e.dano, cor: '#f0f8ff', r: 9, efeito: 'gelo' });
        som(300, 0.1, 'triangle', 0.03, -100);
      }
      return { vx: ru.x * e.vel, vy: ru.y * e.vel };
    }
    case 'sapo': {
      if (e.cd <= 0 && d < 320 && vejo()) {
        e.cd = rand(2.4, 3.2);
        tiroInimigo(e, ux, uy, { vel: 220, dano: Math.round(e.dano * 0.7), cor: '#7dff5a', r: 6, efeito: 'veneno' });
        som(500, 0.08, 'square', 0.02, -300);
      }
      const salto = e.t % 1.2 < 0.4;
      e.z = salto ? Math.sin((e.t % 1.2) / 0.4 * Math.PI) * 12 : 0;
      return salto ? { vx: ru.x * e.vel * 2.2, vy: ru.y * e.vel * 2.2 } : { vx: 0, vy: 0 };
    }
    case 'planta': {
      e.kbx = 0; e.kby = 0;
      if (e.cd <= 0 && d < 340 && vejo()) {
        e.cd = rand(1.5, 2.1);
        tiroInimigo(e, ux, uy, { vel: 260, dano: Math.round(e.dano * 0.7), cor: '#a0e060', r: 5, efeito: e.hab.has('veneno') ? 'veneno' : null });
        e.boca = 0.25;
        som(600, 0.05, 'square', 0.02, -200);
      }
      if (e.boca > 0) e.boca -= dt;
      return { vx: 0, vy: 0 };
    }
    case 'mumia': {
      if (e.cd <= 0 && d > 80 && d < 320 && vejo()) {
        e.cd = rand(3.2, 4.2);
        tiroInimigo(e, ux, uy, { vel: 300, dano: Math.round(e.dano * 0.6), cor: '#d8c9a3', r: 6, tipo: 'ligadura', vida: 1.4, efeito: 'puxar' });
        som(350, 0.12, 'triangle', 0.03, -150);
      }
      return { vx: ru.x * e.vel, vy: ru.y * e.vel };
    }
    case 'escorpiao': {
      if (e.enterrado > 0) { // debaixo da areia: não leva dano e vem ter contigo
        e.enterrado -= dt;
        e.z = 30;
        if (Math.random() < 0.4) particulas.push({ x: e.x + rand(-8, 8), y: e.y + 6, vx: rand(-20, 20), vy: -30, t: 0.4, cor: '#c8a060', tam: 3 });
        if (d < 34 || e.enterrado <= 0) {
          e.enterrado = 0; e.z = 0;
          explosao(e.x, e.y, '#c8a060', 14, 160, 4);
          som(150, 0.2, 'sawtooth', 0.04, 100);
        }
        return { vx: ru.x * e.vel * 1.9, vy: ru.y * e.vel * 1.9 };
      }
      e.cdEnterrar = (e.cdEnterrar ?? 2) - dt;
      if (e.cdEnterrar <= 0 && d > 110 && d < 450) { e.cdEnterrar = 6; e.enterrado = 2.4; explosao(e.x, e.y, '#c8a060', 10, 120, 4); }
      if (e.hab.has('leque') && e.cd <= 0 && d < 280 && vejo()) {
        e.cd = rand(2.6, 3.4);
        tiroInimigo(e, ux, uy, { vel: 230, dano: Math.round(e.dano * 0.6), cor: '#9aff5a', r: 5, efeito: 'veneno' });
      }
      return { vx: ru.x * e.vel, vy: ru.y * e.vel };
    }
    case 'golemCristal':
      return { vx: ru.x * e.vel, vy: ru.y * e.vel };
    case 'espiritoCristal': {
      e.cdTp = (e.cdTp ?? rand(1, 2.5)) - dt;
      if (e.cdTp <= 0 && d < 450) {
        e.cdTp = rand(3, 4);
        if (teletransportar(e, 90, 170)) e.tiroAtraso = 0.4;
      }
      if (e.tiroAtraso > 0) {
        e.tiroAtraso -= dt;
        if (e.tiroAtraso <= 0 && vejo()) tiroInimigo(e, ux, uy, { vel: 260, dano: e.dano, cor: '#d07fff', r: 6, tipo: 'estilhaco' });
      }
      return { vx: ru.x * e.vel * 0.5, vy: ru.y * e.vel * 0.5 };
    }
    case 'olhoVazio': {
      if (e.laser) {
        e.laser.t -= dt;
        if (e.laser.fase === 'mirar' && e.laser.t <= 0) { e.laser.fase = 'fogo'; e.laser.t = 0.35; som(120, 0.35, 'sawtooth', 0.05, 400); tremor = Math.max(tremor, 4); }
        else if (e.laser.fase === 'fogo') {
          const L = e.laser, fx = Math.cos(L.ang), fy = Math.sin(L.ang);
          const px = J.x - e.x, py = J.y - e.y, proj = px * fx + py * fy;
          if (proj > 0 && proj < L.comp && Math.abs(px * fy - py * fx) < J.r + 7) danoJogador(Math.round(e.dano * 1.3), e.x, e.y, e);
          if (L.t <= 0) e.laser = null;
        }
        return { vx: 0, vy: 0 };
      }
      if (e.cd <= 0 && d < 420 && vejo()) {
        e.cd = rand(3.2, 4);
        const ang = Math.atan2(uy, ux);
        e.laser = { fase: 'mirar', t: 0.8, ang, comp: comprimentoRaio(e.x, e.y, ang) };
        return { vx: 0, vy: 0 };
      }
      return manterDistancia(170, 260);
    }
    case 'sombra':
      return { vx: ru.x * e.vel, vy: ru.y * e.vel };
  }
  return { vx: ru.x * e.vel, vy: ru.y * e.vel };
}

// Até onde vai um raio antes de bater numa parede
function comprimentoRaio(x, y, ang) {
  const fx = Math.cos(ang), fy = Math.sin(ang);
  for (let s = 0; s < 700; s += 8) if (solido(mapa, Math.floor((x + fx * s) / TILE), Math.floor((y + fy * s) / TILE))) return s;
  return 700;
}

// ---------------------------------------------------------------------
//  Desenho dos monstros novos
// ---------------------------------------------------------------------
function spriteBioma(e, t) {
  switch (e.tipo) {
    case 'goblin': return { c: SPR.goblin[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 14)) * 3 : 0, flip: e.roubou ? J.x > e.x : J.x < e.x };
    case 'necromante': return { c: SPR.necromante[0], y: -4 + Math.sin(e.t * 2) * 3, flip: J.x < e.x, voa: true };
    case 'salamandra': return { c: SPR.salamandra[0], y: 0, flip: J.x < e.x };
    case 'yeti': return { c: SPR.yeti[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 6)) * 3 : 0 };
    case 'sapo': return { c: SPR.sapo[0], y: -(e.z || 0) };
    case 'planta': return { c: SPR.planta[e.boca > 0 ? 0 : 1], y: 0 };
    case 'mumia': return { c: SPR.mumia[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 4)) * 2 : 0 };
    case 'escorpiao': return { c: SPR.escorpiao[0], y: 0 };
    case 'golemCristal': return { c: SPR.golemCristal[0], y: e.acordado ? -Math.abs(Math.sin(e.t * 5)) * 2 : 0 };
    case 'espiritoCristal': return { c: SPR.espiritoCristal[0], y: -10 + Math.sin(e.t * 3) * 4, voa: true };
    case 'olhoVazio': return { c: SPR.olhoVazio[0], y: -10 + Math.sin(e.t * 2) * 5, voa: true };
    case 'sombra': return { c: SPR.sombra[0], y: -4 + Math.sin(e.t * 3) * 2, voa: true };
  }
  return null;
}

// Coisas por baixo do monstro (avisos no chão)
function desenharAvisosInimigo(e, t) {
  if (e.lasersB) desenharAvisosBoss(e, t);
  if (e.tipo === 'yeti' && e.esmagar > 0) {
    ctx.globalAlpha = 0.2 + (1 - e.esmagar / 0.6) * 0.35;
    circulo(e.x, e.y, 100, '#ff3c3c');
    ctx.globalAlpha = 1;
  }
  if (e.laser) {
    const L = e.laser, x2 = e.x + Math.cos(L.ang) * L.comp, y2 = e.y + Math.sin(L.ang) * L.comp;
    ctx.beginPath();
    ctx.moveTo(alinhar(e.x), alinhar(e.y - 10));
    ctx.lineTo(alinhar(x2), alinhar(y2));
    if (L.fase === 'mirar') {
      ctx.strokeStyle = `rgba(255,60,90,${0.3 + 0.4 * Math.abs(Math.sin(t * 20))})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(208,127,255,0.85)';
      ctx.lineWidth = 16;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }
}

// Divisas por cima dos Veteranos (prata) e Campeões (ouro)
function desenharNivelInimigo(e, y) {
  if (!(e.nv > 1)) return;
  const cor = NIVEIS_INIMIGO[e.nv].cor;
  for (let k = 0; k < e.nv - 1; k++) {
    const cx = e.x - (e.nv - 2) * 6 + k * 12, cy = y;
    ctx.fillStyle = CONTORNO;
    ctx.fillRect(alinhar(cx - 6), alinhar(cy - 2), 12, 6);
    ctx.fillStyle = cor;
    ctx.fillRect(alinhar(cx - 4), alinhar(cy), 4, 2);
    ctx.fillRect(alinhar(cx), alinhar(cy), 4, 2);
    ctx.fillRect(alinhar(cx - 2), alinhar(cy + 2), 4, 2);
  }
}

// Projéteis novos
function desenharProjetilBioma(p, t) {
  if (p.tipo === 'estilhaco') {
    const a = Math.atan2(p.vy, p.vx), c = Math.cos(a), s = Math.sin(a);
    ctx.fillStyle = CONTORNO;
    ctx.beginPath();
    ctx.moveTo(p.x + c * 11, p.y + s * 11); ctx.lineTo(p.x - s * 6, p.y + c * 6); ctx.lineTo(p.x - c * 9, p.y - s * 9); ctx.lineTo(p.x + s * 6, p.y - c * 6);
    ctx.fill();
    ctx.fillStyle = p.cor;
    ctx.beginPath();
    ctx.moveTo(p.x + c * 8, p.y + s * 8); ctx.lineTo(p.x - s * 3, p.y + c * 3); ctx.lineTo(p.x - c * 6, p.y - s * 6); ctx.lineTo(p.x + s * 3, p.y - c * 3);
    ctx.fill();
    return true;
  }
  if (p.tipo === 'ligadura') {
    const o = p.origem;
    if (o && !o.morto) {
      ctx.strokeStyle = '#a89878';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(alinhar(o.x), alinhar(o.y));
      ctx.lineTo(alinhar(p.x), alinhar(p.y));
      ctx.stroke();
    }
    circulo(p.x, p.y, 6, '#d8c9a3');
    return true;
  }
  return false;
}

criarSpritesBiomas();
