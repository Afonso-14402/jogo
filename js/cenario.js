'use strict';
// =====================================================================
//  CENÁRIO E APRESENTAÇÃO
//  - Animação de ataque de cada monstro (prepara-se antes e golpeia)
//  - Paredes com mais variedade, luz das tochas a tremer e pormenores
//    que se mexem (gotas, teias, lava, água, fendas do Vazio...)
//  - Ícones dos botões (interface com um estilo só)
//  - Dicas no ecrã de morte, conforme o que te matou
// =====================================================================

// ---------------------------------------------------------------------
//  Animação de ataque dos monstros
// ---------------------------------------------------------------------
// salto: agacha-se e salta para ti · erguer: levanta a arma e esmaga
// mola: encolhe e estica · carregar: junta energia antes de disparar
const ESTILO_ATAQUE = {
  aranha: 'salto', loboGelo: 'salto', goblin: 'salto', querubim: 'salto', morcego: 'salto', fantasma: 'salto', salamandra: 'salto', sombra: 'salto', escorpiao: 'salto',
  orc: 'erguer', anjoGuerreiro: 'erguer', cavaleiroVazio: 'erguer', zumbi: 'erguer', mumia: 'erguer', yeti: 'erguer', golemCristal: 'erguer', mimico: 'erguer',
  slime: 'mola', slimeLava: 'mola', devorador: 'mola', sapo: 'mola', planta: 'mola',
  esqueleto: 'carregar', arqueiroCeleste: 'carregar', diabrete: 'carregar', magoVazio: 'carregar', elementalGelo: 'carregar', necromante: 'carregar', espiritoCristal: 'carregar', olhoVazio: 'carregar',
};
const JANELA_CARREGAR = 0.45;

// Chamado no fim do atualizarInimigo: deteta quando o monstro atacou
function atualizarAnimAtaque(e, dt) {
  if (e.atacouT > 0) e.atacouT -= dt;
  if (e.cdAnt !== undefined && e.cd > e.cdAnt + 0.3) e.atacouT = 0.22; // o tempo de recarga voltou a encher: disparou
  e.cdAnt = e.cd;
}

// Pose do monstro: devolve { sx, sy, rot, ox, oy } a juntar à animação normal
function poseAtaque(e) {
  const est = ESTILO_ATAQUE[e.tipo];
  const p = { sx: 1, sy: 1, rot: 0, ox: 0, oy: 0, k: 0, a: 0, est };
  if (!est || e.boss || !e.acordado || e.morto) return p;
  const dx = J.x - e.x, dy = J.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, lado = dx < 0 ? -1 : 1;
  let k = 0;
  if (est === 'carregar') k = e.cd > 0 && e.cd < JANELA_CARREGAR && d < 420 ? 1 - e.cd / JANELA_CARREGAR : 0;
  else k = clamp(1 - (d - e.r - J.r) / 48, 0, 1);
  const a = e.atacouT > 0 ? e.atacouT / 0.22 : 0;
  p.k = k; p.a = a;
  if (est === 'salto') {
    p.sx *= 1 + 0.12 * k - 0.1 * a; p.sy *= 1 - 0.2 * k + 0.15 * a;
    const f = -5 * k + 8 * a; p.ox = ux * f; p.oy = uy * f;
  } else if (est === 'erguer') {
    p.sy *= 1 + 0.16 * k - 0.25 * a; p.sx *= 1 + 0.2 * a;
    p.rot = -lado * 0.18 * k + lado * 0.15 * a;
  } else if (est === 'mola') {
    p.sy *= 1 - 0.28 * k + 0.2 * a; p.sx *= 1 + 0.18 * k - 0.1 * a;
  } else { // carregar
    p.rot = -lado * 0.1 * k; p.ox = -ux * 3 * k + ux * 4 * a; p.oy = -uy * 3 * k + uy * 4 * a;
  }
  return p;
}

// Efeitos por cima: energia a juntar-se (carregar) e o risco do golpe (erguer / salto)
function desenharEfeitoAtaque(e, p, t) {
  if (!p.est) return;
  const dx = J.x - e.x, dy = J.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  if (p.est === 'carregar' && p.k > 0) {
    const fx = e.x + ux * (e.r + 4), fy = e.y + uy * (e.r + 4) - 6;
    ctx.globalAlpha = 0.35 + 0.5 * p.k;
    circulo(fx, fy, 2 + p.k * 6 + Math.sin(t * 30) * 1, e.cor);
    circulo(fx, fy, 1 + p.k * 3, '#ffffff');
    ctx.globalAlpha = 1;
  }
  if ((p.est === 'erguer' || p.est === 'salto') && p.a > 0) { // risco branco do golpe
    const ang = Math.atan2(uy, ux);
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = p.a * 0.8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(alinhar(e.x), alinhar(e.y), e.r + 12, ang - 0.9, ang + 0.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------
//  Paredes com mais variedade (pintadas uma vez no mapa)
// ---------------------------------------------------------------------
function detalheParedeExtra(g, px, py, T, z, h) {
  const r = h % 23;
  if (r === 1) { // rachadura
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(px + 4, py + 3, 1, 4); g.fillRect(px + 5, py + 6, 1, 3); g.fillRect(px + 6, py + 8, 1, 4); g.fillRect(px + 7, py + 11, 2, 1);
  } else if (r === 2 && z !== 8) { // correntes penduradas
    g.fillStyle = '#6a6478';
    for (let k = 0; k < 5; k++) g.fillRect(px + 5 + (k % 2), py + 2 + k * 2, 2, 1);
    g.fillRect(px + 4, py + 12, 4, 2);
  } else if (r === 3) { // estandarte da cor da zona
    const cor = ['#8a2a2a', '#2a6a4a', '#aa4a1a', '#3a6aaa', '#5a7a2a', '#b89a40', '#6a4aaa', '#6a2a9a', '#e8d080', '#4a1a7a'][z] || '#8a2a2a';
    g.fillStyle = '#3a2a1a'; g.fillRect(px + 3, py + 2, 10, 1);
    g.fillStyle = cor; g.fillRect(px + 4, py + 3, 8, 9);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(px + 10, py + 3, 2, 9);
    g.fillStyle = cor; g.fillRect(px + 5, py + 12, 2, 2); g.fillRect(px + 9, py + 12, 2, 2);
    g.fillStyle = 'rgba(255,230,120,0.6)'; g.fillRect(px + 7, py + 6, 2, 2);
  } else if (r === 4) { // nicho com caveira ou vela
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(px + 5, py + 5, 6, 6);
    g.fillStyle = z === 1 || z === 9 ? '#e8e2cf' : '#fff0a0'; g.fillRect(px + 6, py + 7, 4, 3);
    if (z === 1 || z === 9) { g.fillStyle = '#140f1c'; g.fillRect(px + 6, py + 8, 1, 1); g.fillRect(px + 9, py + 8, 1, 1); }
  } else if (r === 5) { // musgo a escorrer
    g.fillStyle = z === 2 ? 'rgba(255,120,40,0.35)' : z === 3 || z === 6 ? 'rgba(160,220,255,0.35)' : 'rgba(90,160,70,0.4)';
    g.fillRect(px + 2, py + T - 5, 5, 5); g.fillRect(px + 3, py + T - 2, 2, 3); g.fillRect(px + 9, py + T - 4, 4, 4);
  }
}

// ---------------------------------------------------------------------
//  Pormenores que se mexem em cada zona
// ---------------------------------------------------------------------
// que coisas animadas aparecem em cada zona: junto à parede de cima e no chão
const ANIMADOS_ZONA = [
  { parede: ['gota', 'teia'], chao: ['agua'] },       // Masmorra
  { parede: ['teia'], chao: ['vela'] },               // Cemitério
  { parede: [], chao: ['lava'] },                     // Cavernas de Lava
  { parede: ['gota'], chao: ['agua', 'brilho'] },     // Abismo Gelado
  { parede: ['gota'], chao: ['agua', 'bolhas'] },     // Pântano
  { parede: ['areia'], chao: ['vela'] },              // Templo do Deserto
  { parede: [], chao: ['brilho', 'agua'] },           // Caverna de Cristal
  { parede: [], chao: ['fenda', 'vela'] },            // Reino do Vazio
  { parede: [], chao: ['brilho', 'agua'] },           // Cidadela Celeste
  { parede: ['teia'], chao: ['fenda', 'lavaRoxa'] },  // Trono do Soberano
];

function criarAnimados(m, z) {
  m.animados = [];
  if (m.eBoss || m.cidade) return;
  const Z = ANIMADOS_ZONA[z] || ANIMADOS_ZONA[0];
  const longe = (x, y, p, dist) => Math.hypot((x + 0.5) * TILE - p.x, (y + 0.5) * TILE - p.y) > dist;
  for (let y = 2; y < m.H - 2; y++) for (let x = 2; x < m.W - 2; x++) {
    if (solido(m, x, y)) continue;
    if (!longe(x, y, m.inicio, 80) || !longe(x, y, m.escada, 70)) continue;
    const h = Math.abs((x * 19349663) ^ (y * 83492791));
    const paredeCima = solido(m, x, y - 1);
    const lista = paredeCima ? Z.parede : Z.chao;
    if (!lista.length || h % 1000 >= (paredeCima ? 90 : 18)) continue;
    const tipo = lista[(h >> 5) % lista.length];
    if (['lava', 'agua', 'lavaRoxa', 'bolhas'].includes(tipo) && (solido(m, x + 1, y) || solido(m, x - 1, y) || solido(m, x, y + 1) || paredeCima)) continue;
    const a = { tipo, x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, fase: (h % 97) / 97 * 6 };
    if (tipo === 'teia') { a.y = y * TILE + 4; a.x = (x + (solido(m, x - 1, y) ? 0 : solido(m, x + 1, y) ? 1 : 0.5)) * TILE; }
    if (tipo === 'gota' || tipo === 'areia') a.y = y * TILE + 2;
    m.animados.push(a);
    if (tipo === 'lava' || tipo === 'lavaRoxa') m.luzes.push({ x: a.x, y: a.y, cor: tipo === 'lava' ? '#ff7b25' : '#b44dff' });
    if (tipo === 'vela') m.luzes.push({ x: a.x, y: a.y - 6, cor: '#ffd27a' });
    if (tipo === 'fenda') m.luzes.push({ x: a.x, y: a.y, cor: '#b44dff' });
  }
}

function desenharAnimados(t) {
  const x0 = cam.x - 60, y0 = cam.y - 60, x1 = cam.x + vistaW() + 60, y1 = cam.y + vistaH() + 60;
  for (const a of mapa.animados || []) {
    if (a.x < x0 || a.x > x1 || a.y < y0 || a.y > y1 || !explorado(a.x, a.y)) continue; // só o que está no ecrã
    const f = t + a.fase, x = a.x, y = a.y;
    switch (a.tipo) {
      case 'lava': case 'lavaRoxa': { // poça a borbulhar
        const cor = a.tipo === 'lava' ? ['#8a2a08', '#ff5a1a', '#ffe14d'] : ['#2a0a4a', '#8a3aff', '#e0b0ff'];
        ctx.fillStyle = cor[0]; ctx.beginPath(); ctx.ellipse(alinhar(x), alinhar(y), 22, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = cor[1]; ctx.beginPath(); ctx.ellipse(alinhar(x), alinhar(y), 17 + Math.sin(f * 2) * 1.5, 8, 0, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 3; k++) {
          const b = (f * 0.8 + k * 0.33) % 1;
          ctx.globalAlpha = 1 - b; circulo(x - 10 + k * 10, y + 2 - b * 6, 2 + b * 3, cor[2]); ctx.globalAlpha = 1;
        }
        if (Math.random() < 0.02) particulas.push({ x: x + rand(-12, 12), y, vx: rand(-10, 10), vy: -50, t: 0.6, cor: cor[2], tam: 3 });
        break;
      }
      case 'agua': { // poça com ondinhas
        ctx.fillStyle = 'rgba(60,120,170,0.45)'; ctx.beginPath(); ctx.ellipse(alinhar(x), alinhar(y), 20, 10, 0, 0, Math.PI * 2); ctx.fill();
        const o = (f * 0.5) % 1;
        ctx.strokeStyle = `rgba(190,230,255,${0.6 * (1 - o)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(alinhar(x + 4), alinhar(y), 3 + o * 12, 1.5 + o * 6, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(alinhar(x - 10), alinhar(y - 4), 6, 2);
        break;
      }
      case 'bolhas': { // pântano a borbulhar
        ctx.fillStyle = 'rgba(70,90,40,0.5)'; ctx.beginPath(); ctx.ellipse(alinhar(x), alinhar(y), 16, 8, 0, 0, Math.PI * 2); ctx.fill();
        const b = (f * 0.6) % 1;
        ctx.globalAlpha = 1 - b; circulo(x + Math.sin(f) * 5, y - b * 4, 2 + b * 3, '#b4e06a'); ctx.globalAlpha = 1;
        break;
      }
      case 'gota': case 'areia': { // gotas de água (ou fios de areia) a cair da parede
        const ciclo = (f * 0.7) % 1, cor = a.tipo === 'gota' ? '#9fd8ff' : '#e0c080';
        if (a.tipo === 'areia') { ctx.globalAlpha = 0.6; ctx.fillStyle = cor; for (let k = 0; k < 5; k++) ctx.fillRect(alinhar(x + Math.sin(f * 7 + k) * 1), alinhar(y + ((ciclo + k / 5) % 1) * 26), 2, 3); ctx.globalAlpha = 1; break; }
        if (ciclo < 0.75) { ctx.fillStyle = cor; ctx.fillRect(alinhar(x), alinhar(y + ciclo / 0.75 * 24), 2, 3); }
        else { ctx.globalAlpha = 1 - (ciclo - 0.75) * 4; aro(x + 1, y + 26, 2 + (ciclo - 0.75) * 24, cor, 1); ctx.globalAlpha = 1; }
        break;
      }
      case 'teia': { // teia no canto, a abanar
        ctx.strokeStyle = 'rgba(230,230,240,0.45)'; ctx.lineWidth = 1;
        const bal = Math.sin(f * 1.5) * 1.5;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) { const ang = Math.PI * 0.1 + k * Math.PI * 0.2; ctx.moveTo(alinhar(x), alinhar(y)); ctx.lineTo(alinhar(x + Math.cos(ang) * 18 + bal), alinhar(y + Math.sin(ang) * 18)); }
        for (const r of [7, 13]) { ctx.moveTo(alinhar(x + r * Math.cos(Math.PI * 0.1)), alinhar(y + r * Math.sin(Math.PI * 0.1))); for (let k = 1; k < 5; k++) { const ang = Math.PI * 0.1 + k * Math.PI * 0.2; ctx.lineTo(alinhar(x + Math.cos(ang) * r + bal * r / 18), alinhar(y + Math.sin(ang) * r)); } }
        ctx.stroke();
        break;
      }
      case 'vela': { // vela com chama a tremer
        ctx.fillStyle = '#e8e2cf'; ctx.fillRect(alinhar(x - 2), alinhar(y - 6), 4, 8);
        const tr = Math.sin(f * 11) + Math.sin(f * 17) * 0.5;
        ctx.fillStyle = '#ffae00'; ctx.fillRect(alinhar(x - 1 + tr * 0.5), alinhar(y - 11), 3, 5);
        ctx.fillStyle = '#fff6c8'; ctx.fillRect(alinhar(x), alinhar(y - 9), 1, 2);
        break;
      }
      case 'brilho': { // cintilar de cristais
        for (let k = 0; k < 3; k++) {
          const s = Math.max(0, Math.sin(f * 2 + k * 2.1));
          ctx.globalAlpha = s; ctx.fillStyle = '#ffffff';
          const bx = x - 10 + k * 9, by = y - 4 + (k % 2) * 7;
          ctx.fillRect(alinhar(bx - 1), alinhar(by), 3, 1); ctx.fillRect(alinhar(bx), alinhar(by - 1), 1, 3);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'fenda': { // fenda do Vazio a pulsar
        const p = 0.6 + 0.4 * Math.sin(f * 2.5);
        ctx.fillStyle = '#07030c'; ctx.beginPath(); ctx.ellipse(alinhar(x), alinhar(y), 14, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(180,77,255,${p})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(alinhar(x), alinhar(y), 14, 4, 0.3, 0, Math.PI * 2); ctx.stroke();
        if (Math.random() < 0.04) particulas.push({ x: x + rand(-10, 10), y, vx: 0, vy: -30, t: 0.8, cor: '#d07fff', tam: 2 });
        break;
      }
    }
  }
}

// A luz das tochas treme de forma irregular
const tremorTocha = (t, x) => Math.sin(t * 9 + x) * 6 + Math.sin(t * 23 + x * 1.7) * 4 + Math.sin(t * 3.1 + x * 0.3) * 5;

// ---------------------------------------------------------------------
//  Ícones dos botões (8x8, desenhados em blocos de 2 px)
// ---------------------------------------------------------------------
const ICONES_UI = {
  coop: ['.##..##.', '.##..##.', '........', '####.###', '####.###', '.##...#.', '.#.#.#.#', '.#.#.#.#'],
  jogar: ['.#......', '.##.....', '.###....', '.####...', '.###....', '.##.....', '.#......', '........'],
  novo: ['......##', '.....###', '....###.', '#..###..', '.####...', '..##....', '.#.#....', '#...#...'],
  diario: ['########', '#.#..#.#', '########', '#......#', '#.##.#.#', '#......#', '#.#.##.#', '########'],
  torre: ['#.#..#.#', '########', '.######.', '.##..##.', '.######.', '.##.###.', '.##..##.', '.######.'],
  bossrush: ['.######.', '########', '#..##..#', '#..##..#', '########', '.##..##.', '..####..', '..#..#..'],
  almas: ['...#....', '..##....', '..###...', '.####.#.', '.#####..', '.##.###.', '..####..', '...##...'],
  pacto: ['#......#', '##....##', '.######.', '.#.##.#.', '.######.', '..#..#..', '..####..', '...##...'],
  colecao: ['.######.', '#......#', '#.####.#', '#......#', '#.####.#', '#......#', '.######.', '...##...'],
  conquistas: ['########', '#.####.#', '.######.', '..####..', '...##...', '...##...', '..####..', '.######.'],
  registo: ['.######.', '#.#####.', '.#....#.', '.#.##.#.', '.#....#.', '.#.##.#.', '.######.', '..#####.'],
  transferir: ['...#....', '..###...', '.#####..', '...#....', '....#...', '..#####.', '...###..', '....#...'],
  guardar: ['#######.', '#.###.##', '#.###..#', '#######.', '#......#', '#.####.#', '#.####.#', '########'],
  desistir: ['#.......', '#####...', '######..', '#####...', '#.......', '#.......', '#.......', '#.......'],
  menu: ['...##...', '..####..', '.######.', '########', '.#....#.', '.#.##.#.', '.#.##.#.', '.######.'],
  opcoes: ['..#..#..', '.######.', '##.##.##', '.##..##.', '.##..##.', '##.##.##', '.######.', '..#..#..'],
  voltar: ['...#....', '..##....', '.#######', '########', '.#######', '..##....', '...#....', '........'],
  fechar: ['#......#', '.#....#.', '..#..#..', '...##...', '...##...', '..#..#..', '.#....#.', '#......#'],
};
function iconeUI(nome, cx, cy, cor, tam = 2) {
  const I = ICONES_UI[nome];
  if (!I) return;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (I[y][x] === '#') ctx.fillRect(Math.round(cx - 4 * tam + x * tam + 1), Math.round(cy - 4 * tam + y * tam + 1), tam, tam);
  ctx.fillStyle = cor;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (I[y][x] === '#') ctx.fillRect(Math.round(cx - 4 * tam + x * tam), Math.round(cy - 4 * tam + y * tam), tam, tam);
}

// ---------------------------------------------------------------------
//  Dicas no ecrã de morte
// ---------------------------------------------------------------------
const DICAS_MORTE = {
  slime: 'Os slimes saltam em linha reta: esquiva-te para o lado quando pararem.',
  morcego: 'Os morcegos voam aos ziguezagues: espera que venham e ataca-os de perto.',
  esqueleto: 'Os esqueletos disparam de longe: esconde-te atrás das paredes e aproxima-te depressa.',
  orc: 'O orc fica vermelho antes da investida: sai da frente dele (Shift para te esquivares).',
  fantasma: 'Os fantasmas atravessam paredes: não fiques encostado a elas.',
  zumbi: 'Os zumbis levantam-se uma vez depois de morrer: acaba com eles.',
  diabrete: 'Os diabretes disparam bolas de fogo: anda de lado e ataca entre tiros.',
  slimeLava: 'O slime de lava deixa fogo no chão: não lutes em cima das poças.',
  loboGelo: 'Os lobos de gelo são muito rápidos e abrandam-te: luta com as costas numa parede.',
  elementalGelo: 'Os elementais disparam três cristais em leque: fica perto deles ou bem longe.',
  aranha: 'As aranhas envenenam: uma poção tira-te o veneno a tempo.',
  mimico: 'Alguns baús são mímicos: com pouca vida, deixa os baús de madeira para depois.',
  goblin: 'O goblin rouba ouro e foge: mata-o depressa para o recuperares.',
  necromante: 'O necromante levanta esqueletos: mata-o primeiro, antes dos outros.',
  salamandra: 'A salamandra deixa um rasto de fogo: não a persigas por trás.',
  yeti: 'O yeti avisa antes de esmagar o chão: afasta-te do círculo vermelho.',
  sapo: 'Os sapos cospem veneno de longe: aproxima-te de lado.',
  planta: 'As plantas não se mexem: ataca-as de longe (magia) ou ignora-as.',
  mumia: 'As múmias aguentam muito: usa a tua habilidade mais forte nelas.',
  escorpiao: 'O escorpião esconde-se na areia: quando vires o monte a andar, afasta-te.',
  golemCristal: 'O golem solta estilhaços quando lhe bates: ataca e afasta-te logo a seguir.',
  espiritoCristal: 'O espírito teletransporta-se à tua volta: vira-te para ele assim que aparecer.',
  olhoVazio: 'O olho dispara um raio a direito: sai da linha do raio assim que ele brilhar.',
  sombra: 'As sombras quase não se veem e roubam vida: ataca assim que as vires.',
  anjoGuerreiro: 'O anjo guerreiro carrega com a lança: esquiva-te no último momento.',
  arqueiroCeleste: 'Os arqueiros celestes disparam de longe: corta-lhes o caminho entre as paredes.',
  querubim: 'Os querubins são rápidos mas frágeis: um golpe chega.',
  cavaleiroVazio: 'O cavaleiro do Vazio prepara uma investida: sai da frente quando ele parar.',
  magoVazio: 'Os magos do Vazio disparam esferas: anda de lado e ataca entre tiros.',
  devorador: 'O devorador é lento mas bate muito: nunca o deixes chegar perto.',
  reiSlime: 'O Rei Slime salta para cima de ti: vê a sombra no chão e sai de lá.',
  lich: 'O Lich chama mortos-vivos: mata os lacaios só quando tiveres espaço.',
  dragao: 'O dragão avisa antes de cuspir fogo: põe-te atrás de um pilar.',
  golem: 'O golem esmaga o chão num círculo grande: afasta-te quando o círculo aparecer.',
  rainha: 'A Rainha Aranha põe ovos: destrói-os antes que nasçam aranhas.',
  demonio: 'O Rei Demónio teletransporta-se: fica perto de um pilar e esquiva-te quando ele aparecer.',
  guardiao: 'O Guardião faz nascer cristais à tua volta: sai do meio antes de se fecharem.',
  senhorVazio: 'Os raios do Senhor do Vazio rodam: anda na mesma direção que eles.',
  arcanjo: 'O Arcanjo avisa os pilares de luz com círculos: não pares dentro deles.',
  generalMonarca: 'O General salta para onde estás: quando o círculo aparecer, corre para fora.',
  carrasco: 'O Carrasco puxa-te com correntes: esquiva-te logo a seguir para fugir à ceifa.',
  monarca: 'O Soberano tem três fases: guarda as poções e as habilidades para o fim.',
};
const DICAS_CAUSA = {
  'uma armadilha': 'Os espinhos do chão avisam antes de subir: passa quando estiverem em baixo.',
  'o fogo no chão': 'Não lutes em cima do fogo: puxa os monstros para fora das poças.',
  'o Vigia de Pedra': 'Quando os olhos da estátua ficam vermelhos, larga tudo e não te mexas.',
};
function dicaMorte() {
  if (J.desistiu) return null;
  return DICAS_MORTE[J.causaTipo] || DICAS_CAUSA[J.causa] || 'Usa a esquiva (Shift ou »») para passar pelos ataques: ficas invencível durante ela.';
}
