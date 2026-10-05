'use strict';
// =====================================================================
//  BOSSES E MONSTROS DAS ZONAS FINAIS (desenho e ataques próprios)
//  - Arcanjo Caído (45), General do Soberano (50), Carrasco do Vazio (55)
//    e o Soberano do Vazio (60, chefe final)
//  - Monstros novos: Anjo Guerreiro, Arqueiro Celeste, Querubim,
//    Cavaleiro do Vazio, Mago do Vazio e Devorador
//  - A estátua do Santuário do Vigia
//  - Luz e sombra automáticas em todos os sprites de monstros
// =====================================================================

// ---------------------------------------------------------------------
//  Monstros novos (16x16, 2 passos de animação)
// ---------------------------------------------------------------------
const MONSTROS_FINAIS = {
  anjoGuerreiro: { pal: { y: '#ffd23f', h: '#ffe680', f: '#f1c8a0', v: '#3a2a50', w: '#ffffff', a: '#e8e0ff', A: '#ffd23f', b: '#c8c0f0' },
    f: [['.....kyy', '......kh', '.....khf', '.....kvf', '.kw..kff', 'kwwk.kaa', 'kwwwkaAa', '.kwwkaaa', '..kkkaAa', '....kaaa', '....kbbb', '....kbbk', '....kaak', '....kaak', '...kyyk.', '........'],
        ['.....kyy', '......kh', '.....khf', '.k...kvf', 'kwk..kff', 'kwwk.kaa', '.kwwkaAa', '..kwkaaa', '...kkaAa', '....kaaa', '....kbbb', '....kbbk', '...kaak.', '...kaak.', '..kyyk..', '........']] },
  arqueiroCeleste: { pal: { c: '#fff6c8', d: '#c8a060', y: '#ffe14d', a: '#f4f0ff', A: '#ffd23f' },
    f: [['......kk', '.....kcc', '....kccc', '....kcyd', '....kccc', '...kkaaa', '..kcaaAa', '..kckaaa', '..kk.kaa', '....kaAa', '....kaaa', '...kaaaa', '...kaaak', '...kkaak', '....kyyk', '........'],
        ['......kk', '.....kcc', '....kccc', '....kcyd', '....kccc', '...kkaaa', '..kcaaAa', '..kckaaa', '..kk.kaa', '....kaAa', '....kaaa', '...kaaaa', '...kaak.', '...kaak.', '..kyyk..', '........']] },
  querubim: { voa: true, pal: { y: '#ffe680', f: '#ffd8c0', v: '#3a2a50', r: '#ff9fb0', w: '#ffffff' },
    f: [['........', '........', 'kk......', 'kwk..kkk', 'kwwkkyyy', '.kwkyfff', '..kkfvff', '...kffff', '...kfrff', '....kfff', '.....kkk', '........', '........', '........', '........', '........'],
        ['........', '........', '........', '.....kkk', '....kyyy', '...kyfff', 'kk.kfvff', 'kwkkffff', 'kwwkfrff', '.kwkkfff', '..kk.kkk', '........', '........', '........', '........', '........']] },
  cavaleiroVazio: { pal: { o: '#e8e2cf', d: '#2a2238', r: '#ff3b3b', p: '#8a4aff', a: '#4a4458', A: '#d07fff' },
    f: [['..kk....', '..kok...', '...kokkk', '....kddd', '....kdrr', '....kddd', '..kkkppp', '.kddkaaa', '.kddkaAa', '.kkkkaaa', '....kppp', '....kaak', '....kaak', '...kaaak', '...kkkk.', '........'],
        ['..kk....', '..kok...', '...kokkk', '....kddd', '....kdrr', '....kddd', '..kkkppp', '.kddkaaa', '.kddkaAa', '.kkkkaaa', '....kppp', '....kaak', '...kaak.', '...kaak.', '..kkkk..', '........']] },
  magoVazio: { voa: true, pal: { p: '#3a1a5a', P: '#b44dff', d: '#0a0610', y: '#ff4dff', o: '#d07fff' },
    f: [['.......k', '......kp', '.....kpp', '....kppp', '...kkkkk', '....kddd', '....kdyd', '...kpppp', '..kppPpp', '.kokpppp', '.kkkpppp', '...kpPpp', '...kpppp', '....kppp', '.....kpk', '......k.'],
        ['.......k', '......kp', '.....kpp', '....kppp', '...kkkkk', '....kddd', '....kdyd', '...kpppp', '..kppPpp', '.kokpppp', '.kkkpppp', '...kpPpp', '...kpppp', '...kpppp', '....kpkp', '.....k..']] },
  devorador: { pal: { m: '#3a1a4a', M: '#6a3aff', y: '#ffe14d', v: '#1a0010', w: '#ffffff', r: '#8a0a2a' },
    f: [['........', '....kkkk', '..kkmmmm', '.kmmmmmm', 'kmmyymmm', 'kmmyvmmm', 'kmmmmmmm', 'kmkwkwkw', 'kmkrrrrr', 'kmkwkwkw', 'kmmmmmmm', '.kmmMmmm', '..kmmmmm', '...kkmmk', '....kkk.', '........'],
        ['........', '....kkkk', '..kkmmmm', '.kmmmmmm', 'kmmyymmm', 'kmmyvmmm', 'kmmmmmmm', 'kmmmmmmm', 'kmkwkwkw', 'kmmmmmmm', 'kmmmmmmm', '.kmmMmmm', '..kmmmmm', '...kkmmk', '....kkk.', '........']] },
};
Object.assign(INIMIGOS, {
  anjoGuerreiro:   { nome: 'Anjo Guerreiro',     hp: 58,  dano: 15, vel: 85,  r: 14, xp: 34, cor: '#ffe680', minAndar: 1, peso: 3, zonas: [8], ia: 'orc' },
  arqueiroCeleste: { nome: 'Arqueiro Celeste',   hp: 38,  dano: 13, vel: 85,  r: 13, xp: 30, cor: '#fff6c8', minAndar: 1, peso: 3, zonas: [8], ia: 'esqueleto' },
  querubim:        { nome: 'Querubim',           hp: 26,  dano: 10, vel: 140, r: 10, xp: 24, cor: '#ffd8c0', minAndar: 1, peso: 3, zonas: [8], ia: 'morcego' },
  cavaleiroVazio:  { nome: 'Cavaleiro do Vazio', hp: 62,  dano: 14, vel: 80,  r: 14, xp: 40, cor: '#8a4aff', minAndar: 1, peso: 3, zonas: [9], ia: 'orc' },
  magoVazio:       { nome: 'Mago do Vazio',      hp: 38,  dano: 13, vel: 95,  r: 12, xp: 34, cor: '#b44dff', minAndar: 1, peso: 3, zonas: [9], ia: 'diabrete' },
  devorador:       { nome: 'Devorador',          hp: 84,  dano: 15, vel: 55,  r: 16, xp: 44, cor: '#6a3aff', minAndar: 1, peso: 2, zonas: [9], ia: 'zumbi' },
});
// Monstros antigos que também vivem nas zonas finais
for (const [tipo, z] of [['espiritoCristal', 8], ['elementalGelo', 8], ['sombra', 9], ['olhoVazio', 9]]) if (!INIMIGOS[tipo].zonas.includes(z)) INIMIGOS[tipo].zonas.push(z);

// ---------------------------------------------------------------------
//  Os 4 bosses novos
// ---------------------------------------------------------------------
BOSSES.push(
  { id: 'arcanjo',        nome: 'Arcanjo Caído',      hp: 1250, dano: 28, vel: 110, r: 34, xp: 1100, cor: '#ffe680' },
  { id: 'generalMonarca', nome: 'General do Soberano', hp: 1450, dano: 30, vel: 95,  r: 32, xp: 1250, cor: '#8a4aff' },
  { id: 'carrasco',       nome: 'Carrasco do Vazio',  hp: 1750, dano: 34, vel: 60,  r: 40, xp: 1400, cor: '#6a3a8a' },
  { id: 'monarca',        nome: 'Soberano do Vazio',   hp: 2300, dano: 32, vel: 85,  r: 36, xp: 2500, cor: '#b44dff' },
);
const BOSSES_FINAIS = ['arcanjo', 'generalMonarca', 'carrasco', 'monarca'];

function gerarArcanjo(asa) {
  const g = novaGrade(52, 54);
  const ponta = [4, 14, 28][asa];
  for (const lado of [-1, 1]) { // asas brancas com penas
    const cx = 26, pts = [[cx + lado * 5, 18], [cx + lado * 24, ponta], [cx + lado * 25, ponta + 8], [cx + lado * 20, 36], [cx + lado * 7, 30]];
    poligono(g, pts, (x, y) => ((y + (x >> 1)) % 5 === 0 ? '#d8d0f0' : Math.abs(x - cx) > 18 ? '#fff6c8' : '#ffffff'));
    for (let k = 0; k < 4; k++) linha(g, cx + lado * (8 + k * 4), 30 - k, cx + lado * (12 + k * 3), ponta + 10 + k * 2, '#c8c0e0');
  }
  poligono(g, [[20, 18], [32, 18], [34, 34], [18, 34]], (x, y) => (x < 24 ? '#fff6c8' : x > 29 ? '#c8b060' : '#ffe9a0')); // couraça
  poligono(g, [[18, 34], [34, 34], [37, 46], [15, 46]], (x) => (x < 22 ? '#f4f0ff' : x > 31 ? '#b8b0e0' : '#e0d8ff'));   // saia
  for (const x of [21, 26, 31]) linha(g, x, 35, x + (x - 26) / 3, 45, '#b8b0e0');
  elipse(g, 26, 22, 3, 3, tons('#ffd23f'));                    // joia
  elipse(g, 26, 12, 5, 5.5, tons('#f1c8a0'));                  // cara
  elipse(g, 26, 8, 6, 3.5, tons('#ffd23f'));                   // cabelo
  pixel(g, 24, 12, '#3a2a50'); pixel(g, 28, 12, '#3a2a50');
  for (let a = 0; a < 28; a++) { if (a > 17 && a < 21) continue; pixel(g, 26 + Math.round(Math.cos(a / 28 * Math.PI * 2) * 8), 3 + Math.round(Math.sin(a / 28 * Math.PI * 2) * 2), '#fff6a0'); } // auréola partida
  linha(g, 38, 16, 47, 50, '#e8f4ff', 2); linha(g, 36, 22, 41, 20, '#ffd23f', 2);                 // espada de luz
  for (const x of [21, 29]) { linha(g, x, 46, x, 51, '#c8b060', 2); }
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarGeneral(erguida) {
  const g = novaGrade(54, 56);
  poligono(g, [[16, 18], [38, 18], [46, 52], [8, 52]], (x, y) => (y > 48 && (x % 4 === 0) ? null : x < 20 ? '#5a2a7a' : x > 34 ? '#2a0a3a' : '#3a1a5a')); // capa rasgada
  poligono(g, [[18, 18], [36, 18], [35, 38], [19, 38]], (x) => (x < 23 ? '#6a6478' : x > 31 ? '#2a2638' : '#4a4458'));      // armadura
  for (const [x, s] of [[14, -1], [40, 1]]) { elipse(g, x, 21, 6, 5, tons('#3a3448')); linha(g, x, 17, x + s * 4, 10, '#e8e2cf', 2); } // ombreiras com espinhos
  linha(g, 19, 28, 35, 28, '#8a4aff'); elipse(g, 27, 32, 2.5, 2.5, tons('#d07fff'));
  elipse(g, 27, 11, 7, 7.5, tons('#2a2638'));                   // elmo
  for (const s of [-1, 1]) { linha(g, 27 + s * 5, 7, 27 + s * 11, 1, '#e8e2cf', 2); linha(g, 27 + s * 11, 1, 27 + s * 12, 4, '#c8c0b0'); } // chifres
  for (let x = 23; x <= 31; x++) pixel(g, x, 12, x % 2 ? '#ff3b3b' : '#ff8080');   // viseira a brilhar
  for (const x of [22, 30]) { linha(g, x, 38, x, 51, '#3a3448', 3); linha(g, x - 1, 51, x + 3, 51, '#1a1622', 2); }
  if (erguida) { linha(g, 42, 24, 50, 0, '#b8b8d0', 3); linha(g, 38, 25, 45, 21, '#8a4aff', 2); }
  else { linha(g, 42, 26, 51, 54, '#b8b8d0', 3); linha(g, 39, 24, 45, 28, '#8a4aff', 2); }
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarCarrasco(lado) {
  const g = novaGrade(60, 58);
  elipse(g, 30, 34, 17, 15, tons('#4a3a58'));                  // corpo enorme
  poligono(g, [[20, 30], [40, 30], [42, 52], [18, 52]], (x) => (x < 25 ? '#6a4a30' : x > 36 ? '#3a2418' : '#5a3a24')); // avental
  for (let y = 34; y < 52; y += 5) linha(g, 21, y, 39, y, '#3a2418');
  poligono(g, [[30, 2], [40, 12], [39, 24], [21, 24], [20, 12]], (x) => (x < 26 ? '#2a1438' : x > 35 ? '#0a0410' : '#1a0a24')); // capuz
  pixel(g, 26, 16, '#ff3b3b'); pixel(g, 27, 16, '#ff8080'); pixel(g, 33, 16, '#ff3b3b'); pixel(g, 34, 16, '#ff8080');
  for (const s of [-1, 1]) elipse(g, 30 + s * 17, 34, 5, 7, tons('#4a3a58'));  // braços
  const hx = lado ? 10 : 50;
  linha(g, hx, 6, hx + (lado ? 4 : -4), 56, '#6a4a30', 2);    // cabo da foice
  const s = lado ? 1 : -1; // lâmina da foice: um crescente grande
  for (let k = 0; k <= 20; k++) {
    const f = k / 20, x = hx + s * f * 26, y = 7 - Math.sin(f * Math.PI) * 6 + f * 10;
    linha(g, Math.round(x), Math.round(y), Math.round(x), Math.round(y + Math.max(1, 4 - f * 3)), f > 0.7 ? '#ffffff' : k % 4 ? '#d0c0ff' : '#9a90c0', 2);
  }
  for (let k = 0; k < 7; k++) pixel(g, 14 + k * 5, 50 + (k % 2), '#9a9ab0'); // correntes
  for (const x of [23, 35]) linha(g, x, 50, x, 56, '#2a1a30', 3);
  contornar(g);
  return gradeParaCanvas(g);
}

function gerarMonarca(f) {
  const g = novaGrade(64, 70);
  const jag = y => (f ? (y % 6 < 3) : (y % 6 >= 3));
  poligono(g, [[32, 10], [60, 66], [4, 66]], (x, y) => (y > 60 && jag(x) ? null : x < 20 ? '#2a1438' : x > 44 ? '#07030c' : '#1a0a2a')); // capa
  poligono(g, [[32, 14], [48, 64], [16, 64]], (x, y) => (y > 60 && jag(x + 1) ? null : '#5a2a8a'));  // forro
  poligono(g, [[24, 22], [40, 22], [38, 46], [26, 46]], (x) => (x < 29 ? '#3a2a4a' : x > 35 ? '#140a1e' : '#2a1a3a'));    // armadura
  linha(g, 26, 30, 38, 30, '#b44dff'); elipse(g, 32, 36, 3, 3, tons('#d07fff'));
  elipse(g, 32, 15, 7, 8, tons('#140a1e'));                     // cabeça em sombra
  for (const [x, c] of [[29, '#ffffff'], [35, '#ffffff']]) { pixel(g, x, 15, c); pixel(g, x + (x < 32 ? -1 : 1), 15, '#d07fff'); }
  for (const [x, h] of [[24, 4], [28, 7], [32, 10], [36, 7], [40, 4]]) linha(g, x, 8, x, 8 - h, h > 8 ? '#ffd23f' : '#b44dff', 2); // coroa
  linha(g, 24, 8, 40, 8, '#ffd23f');
  for (const s of [-1, 1]) { linha(g, 32 + s * 8, 26, 32 + s * 20, 36, '#2a1a3a', 3); elipse(g, 32 + s * 22, 37, 4, 4, tons('#b44dff')); } // braços e esferas
  for (let k = 0; k < 10; k++) pixel(g, 8 + k * 5, 64 - (k % 3), '#b44dff');
  contornar(g);
  return gradeParaCanvas(g);
}

// Vigia de Pedra (Santuário do Vigia)
function gerarEstatuaDeus() {
  const g = novaGrade(64, 76);
  const pedra = (x, y) => ((x * 7 + y * 13) % 19 === 0 ? '#5a554c' : null);
  poligono(g, [[6, 12], [58, 12], [58, 72], [6, 72]], (x, y) => pedra(x, y) || (x < 12 ? '#7a7468' : x > 52 ? '#4a463e' : '#625c52')); // trono
  poligono(g, [[6, 12], [32, 2], [58, 12]], (x) => (x < 32 ? '#8a8478' : '#5a554c'));
  poligono(g, [[18, 28], [46, 28], [52, 68], [12, 68]], (x, y) => pedra(x, y) || (x < 24 ? '#b8b2a4' : x > 40 ? '#7a7468' : '#9a9486')); // manto
  for (const x of [20, 26, 32, 38, 44]) linha(g, x, 32, x + (x - 32) / 4, 66, '#7a7468');
  elipse(g, 32, 18, 9, 11, { base: '#a8a294', claro: '#c8c2b4', escuro: '#7a7468' }); // cabeça
  for (const x of [28, 36]) { elipse(g, x, 17, 2.5, 1.5, { base: '#3a362e' }, false); linha(g, x - 3, 14, x + 2, 14, '#6a655a'); } // olhos fundos e sobrancelhas
  linha(g, 32, 17, 32, 21, '#7a7468'); pixel(g, 31, 21, '#6a655a'); // nariz
  for (const [x, h] of [[24, 5], [28, 8], [32, 10], [36, 8], [40, 5]]) linha(g, x, 9, x, 9 - h, '#8a8478', 2); // coroa
  linha(g, 23, 9, 41, 9, '#8a8478', 2);
  for (let x = 26; x <= 38; x++) pixel(g, x, 24 - Math.round(Math.sin((x - 26) / 12 * Math.PI) * 2), '#3a362e'); // sorriso
  for (const s of [-1, 1]) elipse(g, 32 + s * 17, 44, 6, 10, { base: '#9a9486', claro: '#b8b2a4', escuro: '#6a655a' }); // braços
  poligono(g, [[23, 44], [41, 44], [41, 58], [23, 58]], (x) => (x < 28 ? '#8a8478' : '#6a655a'));  // tábua
  for (let y = 47; y < 57; y += 3) linha(g, 25, y, 39, y, '#4a463e');
  poligono(g, [[2, 68], [62, 68], [62, 75], [2, 75]], (x) => (x < 20 ? '#6a655a' : '#4a463e'));    // base
  contornar(g);
  return gradeParaCanvas(g);
}

function criarSpritesFinais() {
  for (const [id, M] of Object.entries(MONSTROS_FINAIS)) SPR[id] = M.f.map(l => sprite(simetrico(l), M.pal));
  SPR.arcanjo = [0, 1, 2].map(gerarArcanjo);
  SPR.generalMonarca = [gerarGeneral(false), gerarGeneral(true)];
  SPR.carrasco = [gerarCarrasco(false), gerarCarrasco(true)];
  SPR.monarca = [gerarMonarca(0), gerarMonarca(1)];
  SPR.estatuaDeus = gerarEstatuaDeus();
}

function spriteFinais(e, t) {
  const M = MONSTROS_FINAIS[e.tipo];
  if (M) {
    const L = SPR[e.tipo], anda = e.acordado || M.voa;
    return { c: anda ? frameAnim(L, e.t, (M.voa ? 8 : 6) * L.length / 2) : L[0], y: M.voa ? -6 + Math.sin(e.t * 5) * 3 : 0, voa: M.voa, flip: J.x < e.x };
  }
  if (e.tipo === 'arcanjo') return { c: SPR.arcanjo[[0, 1, 2, 1][Math.floor(t * 6) % 4]], y: -10 + Math.sin(t * 3) * 5, voa: true, flip: J.x < e.x };
  if (e.tipo === 'generalMonarca') return { c: SPR.generalMonarca[e.golpeT > 0 ? 1 : 0], y: 0, flip: J.x < e.x };
  if (e.tipo === 'carrasco') return { c: SPR.carrasco[e.ceifaT > 0 ? 1 : 0], y: 0, flip: false };
  if (e.tipo === 'monarca') return { c: SPR.monarca[Math.floor(t * 3) % 2], y: -8 + Math.sin(t * 2) * 4, voa: true };
  return null;
}

// ---------------------------------------------------------------------
//  Ataques dos bosses novos
// ---------------------------------------------------------------------
function manterDistancia(e, d, ux, uy, ru, perto, longe) {
  if (d > longe) return { vx: ru.x * e.vel, vy: ru.y * e.vel };
  if (d < perto) return { vx: -ux * e.vel, vy: -uy * e.vel };
  return { vx: -uy * e.vel * 0.5, vy: ux * e.vel * 0.5 };
}
const pilarLuz = (x, y, e, cor, r = 44, t = 1.2) => perigos.push({ x, y, r, t, dur: t, dano: Math.round(e.dano * 1.2), cor, semQueda: true });

function atualizarBossFinal(e, dt, d, ux, uy, ru, fase2) {
  const ang = Math.atan2(uy, ux);
  if (e.golpeT > 0) e.golpeT -= dt;
  if (e.ceifaT > 0) e.ceifaT -= dt;

  if (e.tipo === 'arcanjo') {
    if (e.investida > 0) { // investida alada
      e.investida -= dt;
      if (Math.random() < 0.6) particulas.push({ x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), vx: 0, vy: 0, t: 0.4, cor: '#fff6c8', tam: 6 });
      return { vx: e.ix * e.vel * 4.5, vy: e.iy * e.vel * 4.5 };
    }
    if (e.cdA <= 0) { // leque de penas
      e.cdA = fase2 ? 2.4 : 3.4;
      const n = fase2 ? 11 : 7;
      for (let k = 0; k < n; k++) { const a = ang + (k - (n - 1) / 2) * 0.16; disparar(e.x, e.y, Math.cos(a), Math.sin(a), 270, Math.round(e.dano * 0.55), '#fff6c8', 6, 'estilhaco', 3); }
      som(1300, 0.2, 'triangle', 0.04, -700);
    }
    if (e.cdB <= 0) { // julgamento: pilares de luz
      e.cdB = fase2 ? 4.5 : 6;
      pilarLuz(J.x, J.y, e, '#fff6a0', 50);
      for (let k = 0; k < (fase2 ? 6 : 4); k++) { const a = k / (fase2 ? 6 : 4) * Math.PI * 2 + Math.random(); pilarLuz(J.x + Math.cos(a) * 95, J.y + Math.sin(a) * 95, e, '#fff6a0', 40, 1.4); }
      som(500, 0.4, 'sine', 0.05, 800);
    }
    if (e.cdC <= 0 && d < 420) { e.cdC = fase2 ? 5 : 7; e.investida = 0.45; e.ix = ux; e.iy = uy; som(900, 0.3, 'sawtooth', 0.04, -500); }
    if (fase2 && e.cdE <= 0) { e.cdE = 12; if (inimigos.filter(o => !o.boss && !o.morto).length < 4) for (let k = 0; k < 2; k++) invocar('querubim', e, 80); }
    return manterDistancia(e, d, ux, uy, ru, 150, 300);
  }

  if (e.tipo === 'generalMonarca') {
    if (e.salto) { // salto esmagador
      const S2 = e.salto;
      S2.t -= dt;
      e.z = Math.sin((1 - S2.t / S2.dur) * Math.PI) * 60;
      e.x += (S2.x - e.x) * Math.min(1, dt * 5); e.y += (S2.y - e.y) * Math.min(1, dt * 5);
      if (S2.t <= 0) { e.salto = null; e.z = 0; tremor = 14; explosao(e.x, e.y, '#8a4aff', 30, 260, 6); som(50, 0.5, 'square', 0.07, -20); }
      return { vx: 0, vy: 0 };
    }
    if (e.cdA <= 0 && d < 500) { // onda da espada
      e.cdA = fase2 ? 2.8 : 3.8; e.golpeT = 0.5;
      for (const a of [-0.2, 0, 0.2]) disparar(e.x, e.y, Math.cos(ang + a), Math.sin(ang + a), 320, Math.round(e.dano * 0.8), '#8a4aff', 12, 'bola', 2);
      som(200, 0.3, 'sawtooth', 0.05, -120);
    }
    if (e.cdB <= 0 && d < 520) { // salta para cima de ti
      e.cdB = fase2 ? 4.5 : 6.5;
      const dur = 0.9;
      e.salto = { x: J.x, y: J.y, t: dur, dur };
      perigos.push({ x: J.x, y: J.y, r: 90, t: dur, dur, dano: Math.round(e.dano * 1.4), cor: '#8a4aff' });
    }
    if (e.cdC <= 0 && d < 160) { // corte giratório
      e.cdC = fase2 ? 4 : 6; e.golpeT = 0.9;
      perigos.push({ x: e.x, y: e.y, r: 140, t: 0.9, dur: 0.9, dano: Math.round(e.dano * 1.3), cor: '#d07fff' });
    }
    if (fase2 && e.cdE <= 0) { e.cdE = 11; if (inimigos.filter(o => !o.boss && !o.morto).length < 4) for (let k = 0; k < 2; k++) invocar('cavaleiroVazio', e, 80); }
    return { vx: ru.x * e.vel * (fase2 ? 1.25 : 1), vy: ru.y * e.vel * (fase2 ? 1.25 : 1) };
  }

  if (e.tipo === 'carrasco') {
    if (e.cdA <= 0 && d < 260) { // ceifa em arco à frente
      e.cdA = fase2 ? 2.4 : 3.4; e.ceifaT = 0.9;
      for (let k = -2; k <= 2; k++) { const a = ang + k * 0.35; pilarLuz(e.x + Math.cos(a) * 85, e.y + Math.sin(a) * 85, e, '#d0c0ff', 42, 0.85); }
      som(160, 0.4, 'sawtooth', 0.05, 200);
    }
    if (e.cdB <= 0 && d < 420 && d > 120) { // correntes: puxa-te para ele
      e.cdB = fase2 ? 5 : 7;
      raios.push({ x1: e.x, y1: e.y, x2: J.x, y2: J.y, t: 0.4 });
      J.kbx = -ux * 700; J.kby = -uy * 700;
      danoJogador(Math.round(e.dano * 0.4), null, null, e);
      texto(J.x, J.y - 30, 'Puxado!', '#d0c0ff', 16);
      som(300, 0.3, 'square', 0.05, -200);
    }
    if (e.cdC <= 0) { // poças do vazio
      e.cdC = fase2 ? 6 : 8;
      for (let k = 0; k < 3; k++) criarPoca(J.x + rand(-80, 80), J.y + rand(-80, 80), 'veneno', 50, 6, Math.round(e.dano * 0.35));
    }
    return { vx: ru.x * e.vel * (fase2 ? 1.4 : 1), vy: ru.y * e.vel * (fase2 ? 1.4 : 1) };
  }

  // Soberano do Vazio (chefe final): 3 fases
  const fase3 = e.hp < e.maxHp * 0.25;
  if (fase3 && !e.fase3) {
    e.fase3 = true; e.vel *= 1.2;
    falar('monarca', 'Não! Eu SOU o Vazio! Não podes vencer o nada!');
    tremor = 20; explosao(e.x, e.y, '#b44dff', 70, 380, 7);
  }
  const k3 = fase3 ? 0.7 : 1;
  if (e.cdA <= 0) { // anel de esferas a rodar
    e.cdA = (fase2 ? 2.6 : 3.4) * k3;
    e.giro = (e.giro || 0) + 0.3;
    const n = fase2 ? 20 : 14;
    for (let k = 0; k < n; k++) { const a = e.giro + k / n * Math.PI * 2; disparar(e.x, e.y, Math.cos(a), Math.sin(a), 170, Math.round(e.dano * 0.55), '#b44dff', 8, 'bola', 4); }
    som(160, 0.3, 'sawtooth', 0.04, 200);
  }
  if (e.cdB <= 0) { // chuva do vazio
    e.cdB = (fase2 ? 4.5 : 6) * k3;
    for (let k = 0; k < (fase2 ? 12 : 8); k++) pilarLuz(J.x + rand(-200, 200), J.y + rand(-160, 160), e, '#b44dff', 40, rand(1, 1.6));
    pilarLuz(J.x, J.y, e, '#ff4dff', 46, 1.2);
  }
  if (e.cdC <= 0) { // teletransporte e nova
    e.cdC = 8 * k3;
    if (teletransportar(e, 200, 280)) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; disparar(e.x, e.y, Math.cos(a), Math.sin(a), 210, Math.round(e.dano * 0.5), '#ff4dff', 7, 'bola', 3); }
  }
  if (e.cdD <= 0) { // o exército do Soberano
    e.cdD = 13 * k3;
    if (inimigos.filter(o => !o.boss && !o.morto).length < 5) for (let k = 0; k < 3; k++) invocar(k % 2 ? 'cavaleiroVazio' : 'sombra', e, 90);
  }
  if (fase2 && e.cdE <= 0) { // espiral de lâminas do vazio
    e.cdE = 9 * k3;
    const base = Math.random() * Math.PI * 2;
    for (let braco = 0; braco < 3; braco++) for (let k = 1; k <= 8; k++) {
      const a = base + braco * Math.PI * 2 / 3 + k * 0.25, r = 40 + k * 38;
      perigos.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, r: 30, t: 0.8 + k * 0.12, dur: 0.8 + k * 0.12, dano: Math.round(e.dano), cor: '#d07fff', semQueda: true });
    }
  }
  return manterDistancia(e, d, ux, uy, ru, 180, 300);
}

// ---------------------------------------------------------------------
//  Luz e sombra automáticas: realça a parte de cima e escurece a de baixo
//  de cada sprite de monstro (dá volume à pixel art)
// ---------------------------------------------------------------------
function realcar(c) {
  const w = c.width, h = c.height, g = c.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data;
  const [cr, cg, cb] = hexRgb(CONTORNO);
  const vazio = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return true; const i = (y * w + x) * 4; return d[i + 3] < 10 || (Math.abs(d[i] - cr) < 6 && Math.abs(d[i + 1] - cg) < 6 && Math.abs(d[i + 2] - cb) < 6); };
  const orig = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (orig[i + 3] < 10 || vazio(x, y)) continue;
    let f = 0;
    if (vazio(x, y - 1)) f += 0.22;          // luz de cima
    if (vazio(x - 1, y)) f += 0.08;          // luz da esquerda
    if (vazio(x, y + 1)) f -= 0.22;          // sombra em baixo
    if (vazio(x + 1, y)) f -= 0.06;
    if (!f) continue;
    for (let k = 0; k < 3; k++) d[i + k] = f > 0 ? orig[i + k] + (255 - orig[i + k]) * f : orig[i + k] * (1 + f);
  }
  g.putImageData(img, 0, 0);
  return c;
}
function realcarMonstros() {
  const ids = Object.keys(INIMIGOS).concat(BOSSES.map(b => b.id));
  for (const id of ids) if (Array.isArray(SPR[id])) SPR[id].forEach(c => { if (c && c.getContext) realcar(c); });
}

criarSpritesFinais();
realcarMonstros();
