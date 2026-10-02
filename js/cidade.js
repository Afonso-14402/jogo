'use strict';
// =====================================================================
//  CIDADE DOS CAÇADORES (dentro do jogo)
//  Depois de cada boss aparece uma escada para cima, para a cidade. Lá andas à
//  vontade entre as casas e os habitantes e entras nos edifícios:
//  - A tua Casa: descansar (vida e mana cheias) e guardar o jogo
//  - Guilda dos Caçadores: reavaliação de rank e contratos
//  - Ferreiro: afiar a arma e reforçar a armadura (sem falhar)
//  - Alquimista: poções e elixires de vida e de mana
//  A escada da praça desce para o andar seguinte.
// =====================================================================

function metaCidade() {
  if (!meta.contratos) meta.contratos = {};
  if (meta.rankCacador == null) meta.rankCacador = 0;
  if (meta.melhorPoder == null) meta.melhorPoder = 0;
}
const naCidade = () => !!(mapa && mapa.cidade);

// ---------------------------------------------------------------------
//  Rank de caçador (reavaliação na Guilda)
// ---------------------------------------------------------------------
const bonusRankCacador = () => ({ dano: 0.03 * (meta.rankCacador || 0), hp: 0.03 * (meta.rankCacador || 0) });
// Poder que tens de ter mostrado para passar ao rank k
const poderParaRank = k => poderReferencia(RANKS[k - 1].ate);

// O melhor poder de sempre fica guardado
function registarPoder() {
  metaCidade();
  const p = poderJogador();
  if (p > meta.melhorPoder) { meta.melhorPoder = p; salvarMeta(); }
}

function reavaliar() {
  registarPoder();
  const k = (meta.rankCacador || 0) + 1;
  if (k >= RANKS.length) return { txt: 'Já és um Caçador de Nível Nacional!', cor: '#ffe14d' };
  const precisa = poderParaRank(k);
  if (meta.melhorPoder < precisa) return { txt: `O cristal não reage. Precisas de mostrar poder ${precisa} (o teu melhor: ${meta.melhorPoder})`, cor: '#ff8080' };
  meta.rankCacador = k;
  salvarMeta();
  S = stats();
  cidade.anim = { t: 0, letra: RANKS[k].letra, cor: RANKS[k].cor };
  fanfarra([392, 523, 659, 784, 1046, 1318, 1568], 0.05);
  if (RANKS[k].letra === 'S' || RANKS[k].letra === 'Nacional') desbloquear('reavaliadoS');
  return { txt: `REAVALIADO! Agora és Caçador de Rank ${RANKS[k].letra}`, cor: RANKS[k].cor };
}

// ---------------------------------------------------------------------
//  Contratos da Guilda (acumulam entre partidas, dão almas)
// ---------------------------------------------------------------------
const CONTRATOS = [
  { id: 'matar',       desc: 'Mata {n} monstros',          n: [100, 300, 800, 2000], almas: [15, 30, 60, 120] },
  { id: 'elite',       desc: 'Mata {n} monstros de elite', n: [10, 30, 80, 200],     almas: [15, 30, 60, 120] },
  { id: 'boss',        desc: 'Derrota {n} bosses',         n: [3, 10, 25, 60],       almas: [20, 40, 80, 150] },
  { id: 'portalFeito', desc: 'Conquista {n} portais',      n: [2, 8, 20, 50],        almas: [20, 40, 80, 150] },
  { id: 'baus',        desc: 'Abre {n} baús',              n: [20, 60, 150, 400],    almas: [10, 25, 50, 100] },
  { id: 'andar',       desc: 'Chega ao andar {n}',         n: [10, 20, 35, 50],      almas: [20, 40, 80, 160], maximo: true },
];
function estadoContrato(C) {
  metaCidade();
  const e = meta.contratos[C.id] || (meta.contratos[C.id] = { nivel: 0, prog: 0 });
  const nv = Math.min(e.nivel, C.n.length - 1);
  return { e, alvo: C.n[nv], premio: C.almas[nv], acabado: e.nivel >= C.n.length, pronto: e.nivel < C.n.length && e.prog >= C.n[nv] };
}
// Chamado por registar() (extras.js)
function progressoContratos(evento, q) {
  for (const C of CONTRATOS) {
    if (C.id !== evento) continue;
    const { e, acabado } = estadoContrato(C);
    if (acabado) continue;
    const antes = e.prog >= C.n[e.nivel];
    e.prog = C.maximo ? Math.max(e.prog, q) : e.prog + q;
    if (!antes && e.prog >= C.n[e.nivel]) avisar('Contrato cumprido!', 'Recebe o prémio na Guilda, na Cidade dos Caçadores', '#4dc3ff');
  }
}
function receberContrato(C) {
  const { e, pronto, premio } = estadoContrato(C);
  if (!pronto) return false;
  meta.almas += premio;
  e.nivel++;
  if (!C.maximo) e.prog = 0;
  salvarMeta();
  fanfarra([523, 659, 784, 1046], 0.04);
  return premio;
}

// ---------------------------------------------------------------------
//  Lojas (pagas com o ouro da partida)
// ---------------------------------------------------------------------
const precoAfiar = it => Math.round(60 * Math.pow(1.6, it.enc || 0) * (1 + andar * 0.12));
const precoPocao = () => 30 + andar * 4;
const precoElixir = n => Math.round((120 + andar * 15) * (1 + n * 0.5));
const MAX_ELIXIR = 3;
const cidadeRun = () => J.cidadeRun || (J.cidadeRun = { vida: 0, mana: 0 });

// Bónus que vêm da cidade (entra nos stats)
function bonusCidade() {
  const r = bonusRankCacador(), c = J ? cidadeRun() : { vida: 0, mana: 0 };
  return { danoPct: r.dano, hpPct: r.hp + 0.08 * c.vida, cura: 0, mana: 20 * c.mana };
}

// No início de cada partida: o Rank S dá +1 poção
function aplicarCidadeInicial() {
  J.cidadeRun = { vida: 0, mana: 0 };
  if ((meta.rankCacador || 0) >= 5) J.pocoes++;
}

function pagar(preco) {
  if (J.ouro < preco) { som(140, 0.2, 'square', 0.04); return false; }
  J.ouro -= preco;
  som(1300, 0.08, 'square', 0.03, 300);
  return true;
}

// ---------------------------------------------------------------------
//  O mapa da cidade
// ---------------------------------------------------------------------
// Cada zona da masmorra tem a sua cidade: o nome, as cores, as árvores e a fonte mudam
const CIDADES = [
  { nome: 'Vila da Pedra', calc: ['#8a8078', '#7a7068', '#5e564e'], relva: ['#3f7a34', '#468a3a', '#6ab050'], flores: ['#ff7fd0', '#ffe14d', '#ffffff'], muralha: ['#4a4458', '#5e5870', '#2a2436'],
    arvore: 'arvore', folhas: ['#2f6a2a', '#3f8a34'], tronco: '#5a3a1a', fonte: '#4d9fff', gota: '#bfe6ff', luz: '#ffd27a',
    conversas: ['Esta vila foi a primeira a ver um portal abrir.', 'Bem-vindo à Vila da Pedra, caçador!'] },
  { nome: 'Vila dos Coveiros', calc: ['#6e6a72', '#625e68', '#46424e'], relva: ['#3a4a3a', '#34423a', '#5a6a50'], flores: ['#b48cff', '#d0d0d0', '#7d9a7d'], muralha: ['#3a3644', '#4a4656', '#1e1a26'],
    arvore: 'morta', folhas: ['#3a3644', '#4a4656'], tronco: '#4a3a32', fonte: '#7dffb0', gota: '#c8ffe0', luz: '#9dffcf',
    conversas: ['Aqui enterramos os caçadores que não voltaram.', 'À noite ouvem-se ossos a bater nas campas.'] },
  { nome: 'Forja das Brasas', calc: ['#5a4a44', '#4e3f3a', '#2e2420'], relva: ['#3a2a24', '#42302a', '#ff7b25'], flores: ['#ff9b45', '#ffd23f', '#ff5a1a'], muralha: ['#3a2a26', '#4e3a34', '#1a100c'],
    arvore: 'rocha', folhas: ['#5a4a44', '#6e5c54'], tronco: '#2a1a14', fonte: '#ff6a1a', gota: '#ffd27a', luz: '#ff9b45',
    conversas: ['As melhores espadas são forjadas no calor da lava.', 'Não toques na fonte. A sério.'] },
  { nome: 'Porto Gelado', calc: ['#9aa8b8', '#8a98aa', '#6a788a'], relva: ['#dfeaf5', '#cfdcea', '#ffffff'], flores: ['#bfe6ff', '#ffffff', '#9fd0ff'], muralha: ['#5a6a80', '#7486a0', '#34405a'],
    arvore: 'pinheiro', folhas: ['#2a5a4a', '#e8f4ff'], tronco: '#4a3a2a', fonte: '#9fdcff', gota: '#ffffff', luz: '#cfe8ff',
    conversas: ['Os barcos estão presos no gelo há três invernos.', 'Bebe qualquer coisa quente antes de desceres.'] },
  { nome: 'Aldeia das Palafitas', calc: ['#6a5a3a', '#5e4e32', '#3e3220'], relva: ['#2e4a2a', '#344f2c', '#7dff5a'], flores: ['#7dff5a', '#d0ff7a', '#5dff9a'], muralha: ['#3a4430', '#4a5640', '#1e2618'],
    arvore: 'salgueiro', folhas: ['#2a4a24', '#3a6a30'], tronco: '#3a2a1a', fonte: '#6ab04a', gota: '#bfffa0', luz: '#d0ff7a',
    conversas: ['As casas estão em cima de estacas por causa dos sapos gigantes.', 'Se te picar um escorpião, vai ao alquimista.'] },
  { nome: 'Oásis das Areias', calc: ['#c8a870', '#b89860', '#8a6e40'], relva: ['#e0c890', '#d8bc80', '#f0dca0'], flores: ['#ff9b45', '#ffe14d', '#5dff7a'], muralha: ['#a08050', '#b89868', '#6a5030'],
    arvore: 'palmeira', folhas: ['#3a7a2a', '#5aa03a'], tronco: '#8a6a3a', fonte: '#4dc3ff', gota: '#bfe6ff', luz: '#ffe680',
    conversas: ['A água deste oásis nunca acaba. Ninguém sabe porquê.', 'As múmias do templo não gostam de visitas.'] },
  { nome: 'Cidade de Cristal', calc: ['#6a6a9a', '#5e5e8a', '#3e3e6a'], relva: ['#3a3a6a', '#44447a', '#9fdcff'], flores: ['#ff9ff3', '#9fdcff', '#b48cff'], muralha: ['#4a4a7a', '#6060a0', '#24244a'],
    arvore: 'cristal', folhas: ['#9fdcff', '#ff9ff3'], tronco: '#4a4a7a', fonte: '#ff9ff3', gota: '#ffd0f8', luz: '#9fdcff',
    conversas: ['Os cristais cantam quando um portal abre.', 'Não partas nada. Tudo aqui é caro.'] },
  { nome: 'Bastião do Vazio', calc: ['#3a3044', '#32283c', '#1a1424'], relva: ['#241c30', '#2a2036', '#b44dff'], flores: ['#b44dff', '#6a4aff', '#ff4dff'], muralha: ['#2a2036', '#3a2e4a', '#100a18'],
    arvore: 'obelisco', folhas: ['#1a1424', '#b44dff'], tronco: '#2a2036', fonte: '#b44dff', gota: '#e0b0ff', luz: '#d08aff',
    conversas: ['Este é o último bastião antes do reino do Vazio.', 'Às vezes o chão sussurra o teu nome.'] },
  { nome: 'Cidadela das Nuvens', calc: ['#e8e2cf', '#d8d0b8', '#b8ae90'], relva: ['#f4f4ff', '#e8ecff', '#ffffff'], flores: ['#ffe14d', '#ffffff', '#fff0a0'], muralha: ['#c8c0a8', '#e0d8c0', '#9a9078'],
    arvore: 'coluna', folhas: ['#f0e8d0', '#ffe14d'], tronco: '#d8d0b8', fonte: '#ffe680', gota: '#fffbe0', luz: '#fff0a0',
    conversas: ['Os anjos daqui não confiam em caçadores.', 'Cuidado onde pões os pés: há nuvens que não seguram ninguém.'] },
  { nome: 'Último Acampamento', calc: ['#5a4a4a', '#4e4040', '#2e2424'], relva: ['#3a2a2a', '#422e2e', '#ff3b3b'], flores: ['#ff3b3b', '#ff8080', '#ffae00'], muralha: ['#3a2a2a', '#4e3a3a', '#1a0e0e'],
    arvore: 'ruina', folhas: ['#5a4a4a', '#6e5a5a'], tronco: '#3a2a2a', fonte: '#ff3b3b', gota: '#ff9b9b', luz: '#ff8a5a',
    conversas: ['Daqui já se vê o trono.', 'Somos os últimos caçadores que ainda acreditam em ti.'] },
];
// A cidade a que se chega depois do boss do andar a
const temaCidade = (a = andar) => CIDADES[zonaDoAndar(a) % CIDADES.length];
const nomeCidade = a => temaCidade(a).nome;

const EDIFICIOS = [
  { id: 'casa',       nome: 'A tua Casa',              cor: '#ffae00', parede: '#6a4a2a', telhado: '#8a2a1a', tx: 3 },
  { id: 'assoc',      nome: 'Guilda dos Caçadores', cor: '#4dc3ff', parede: '#2a3a5a', telhado: '#1a2a4a', tx: 13 },
  { id: 'ferreiro',   nome: 'Ferreiro',                cor: '#ff9b45', parede: '#4a3020', telhado: '#5a2418', tx: 27 },
  { id: 'alquimista', nome: 'Alquimista',              cor: '#5dff7a', parede: '#2a4a30', telhado: '#1a3a24', tx: 37 },
];
const CID_W = 46, CID_H = 26, ED_W = 6, ED_Y = 2, ED_H = 5;

function gerarCidade() {
  const m = criarBaseMapa(CID_W, CID_H);
  m.cidade = true;
  m.tema = temaCidade();
  m.eBoss = false;
  const sala = { x: 1, y: 1, w: CID_W - 2, h: CID_H - 2 };
  m.salas.push(sala);
  m.salaInicio = sala; m.salaEscada = sala;
  for (let y = 1; y < CID_H - 1; y++) for (let x = 1; x < CID_W - 1; x++) cavar(m, x, y);
  const solidos = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) m.tiles[y * m.W + x] = 0; };
  for (const E of EDIFICIOS) solidos(E.tx, ED_Y, ED_W, ED_H);
  solidos(22, 12, 2, 2); // fonte
  m.arvores = [[2, 21], [6, 23], [40, 22], [43, 20], [2, 13], [43, 12], [10, 22], [35, 23]];
  for (const [x, y] of m.arvores) solidos(x, y, 1, 1);
  m.fonte = { x: 23 * TILE, y: 13 * TILE };
  m.inicio = { x: 23 * TILE, y: 19 * TILE };
  m.posBoss = { x: 23 * TILE, y: 13 * TILE };
  m.escada = { x: -9999, y: -9999, ativa: false };
  m.explorado.fill(1);
  m.tochas = [];
  m.lama = new Set();
  m.candeeiros = [[9, 9], [20, 9], [26, 9], [34, 9], [9, 18], [36, 18]].map(([x, y]) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }));
  m.luzes = m.candeeiros.map(c => ({ x: c.x, y: c.y - 30, cor: m.tema.luz }));
  // habitantes que passeiam pela praça
  m.aldeoes = HABITANTES.map((h, i) => ({ tipo: 'aldeao', nome: h.nome, papel: h.papel, raca: h.raca, skin: h.skin,
    x: h.papel === 'anciao' ? 23 * TILE : (6 + i * 7) * TILE, y: h.papel === 'anciao' ? 15.6 * TILE : (11 + (i % 3) * 3) * TILE,
    r: 10, alvo: null, espera: rand(0, 2), dir: 1, andando: false, t: 0 }));
  return m;
}

function renderizarCidade(m) {
  const T = TILE / ESCALA, C = m.tema || CIDADES[0];
  const c = document.createElement('canvas');
  c.width = m.W * T; c.height = m.H * T;
  const g = c.getContext('2d');
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    const h = Math.abs((x * 73856093) ^ (y * 19349663));
    const px = x * T, py = y * T;
    const praca = y >= 8 && y <= 20 && x >= 4 && x <= 41, rua = x >= 21 && x <= 24;
    if (x === 0 || y === 0 || x === m.W - 1 || y === m.H - 1) { // muralha
      g.fillStyle = C.muralha[0]; g.fillRect(px, py, T, T);
      g.fillStyle = C.muralha[1]; g.fillRect(px + 1, py + 1, T - 2, T / 2 - 2);
      g.fillStyle = C.muralha[2]; g.fillRect(px, py + T - 2, T, 2);
    } else if (praca || rua) { // calçada
      g.fillStyle = h % 3 ? C.calc[0] : C.calc[1]; g.fillRect(px, py, T, T);
      g.fillStyle = C.calc[2]; g.fillRect(px, py + T / 2, T, 1); g.fillRect(px + ((y % 2) ? T / 2 : 0), py, 1, T / 2); g.fillRect(px + ((y % 2) ? 0 : T / 2), py + T / 2, 1, T / 2);
    } else { // relva
      g.fillStyle = h % 5 ? C.relva[0] : C.relva[1]; g.fillRect(px, py, T, T);
      if (h % 7 === 0) { g.fillStyle = C.relva[2]; g.fillRect(px + (h % 11), py + (h % 9), 2, 3); }
      if (h % 23 === 0) { g.fillStyle = C.flores[h % 3]; g.fillRect(px + 5, py + 6, 2, 2); }
    }
  }
  return c;
}

// Objetos com que se pode interagir
// Os habitantes da cidade: alguns pedem ajuda, o Ancião conta a história
const HABITANTES = [
  { nome: 'Ancião', papel: 'anciao', raca: 'humano', skin: 'celestial' },
  { nome: 'Rosa', papel: 'pedido', raca: 'humano', skin: 'floresta' },
  { nome: 'Tomé', papel: 'pedido', raca: 'anao', skin: 'carmesim' },
  { nome: 'Leonor', papel: 'pedido', raca: 'elfo', skin: 'gelo' },
  { nome: 'Brás', papel: 'conversa', raca: 'orc', skin: 'sombra' },
  { nome: 'Inês', papel: 'conversa', raca: 'gnomo', skin: 'real' },
  { nome: 'Duarte', papel: 'conversa', raca: 'vampiro', skin: 'infinito' },
];
const CONVERSAS = ['Bom dia, caçador! Hoje o céu está calmo.', 'Os preços do ferreiro estão pela hora da morte.', 'Vi um portal maldito ontem... fugi a correr.',
  'A fonte da praça tem água benta. Ou assim dizem.', 'Cuidado com os baús que mordem!', 'O meu avô dizia que a masmorra não tem fundo.',
  'Se vires uma porta antiga, não te mexas quando a estátua olhar para ti.'];
const LORE_ANCIAO = [
  [10, 'Dizem que no fundo da masmorra vive um rei feito de sombra.'],
  [20, 'Os portais começaram a abrir no dia em que o Vazio acordou.'],
  [30, 'O Soberano do Vazio já foi um caçador, como tu. O poder mudou-o.'],
  [40, 'Acima do reino dele há uma cidadela de anjos que lhe juraram lealdade.'],
  [59, 'O trono fica no andar 60. Leva poções. Muitas poções.'],
  [9999, 'Venceste-o... ou vais vencer. Para nós já és uma lenda, caçador.'],
];

// Pedidos dos habitantes (duram até ao fim da partida)
function novoPedido(quem) {
  const z = zonaDoAndar(andar + 1);
  const monstros = Object.keys(INIMIGOS).filter(k => INIMIGOS[k].peso && INIMIGOS[k].zonas.includes(z) && INIMIGOS[k].minAndar <= andar + 1);
  const tipos = ['elite', 'baus', 'portal'].concat(monstros.length ? ['matar', 'matar'] : []);
  const tipo = escolher(tipos);
  const p = { quem, tipo, prog: 0, ouro: 80 + andar * 12 };
  if (tipo === 'matar') { p.monstro = escolher(monstros); p.n = randInt(6, 10); }
  else if (tipo === 'elite') p.n = randInt(2, 3);
  else if (tipo === 'baus') p.n = randInt(3, 5);
  else p.n = 1;
  return p;
}
function textoPedido(p) {
  if (p.tipo === 'matar') return `Mata ${p.n} ${traduzir(INIMIGOS[p.monstro].nome)} (${Math.min(p.prog, p.n)}/${p.n})`;
  if (p.tipo === 'elite') return `Mata ${p.n} monstros de elite (${Math.min(p.prog, p.n)}/${p.n})`;
  if (p.tipo === 'baus') return `Abre ${p.n} baús (${Math.min(p.prog, p.n)}/${p.n})`;
  return `Conquista um portal (${Math.min(p.prog, p.n)}/${p.n})`;
}
// Chamado quando matas, abres baús e conquistas portais
function progressoPedidos(evento, e) {
  if (!J || !J.pedidos) return;
  for (const p of J.pedidos) {
    if (p.prog >= p.n) continue;
    if ((evento === 'matar' && p.tipo === 'matar' && e.tipo === p.monstro) || (evento === 'matar' && p.tipo === 'elite' && e.elite) ||
      (evento === 'baus' && p.tipo === 'baus') || (evento === 'portal' && p.tipo === 'portal')) {
      p.prog++;
      if (p.prog >= p.n) avisar(`Pedido de ${p.quem} cumprido!`, 'Volta à cidade para receberes a recompensa', '#ffe14d');
    }
  }
}
const pedidoDe = nome => (J.pedidos || []).find(p => p.quem === nome);

function falarAldeao(o) {
  if (o.papel === 'anciao') { falar('anciao', LORE_ANCIAO.find(([a]) => andar <= a)[1]); return; }
  if (o.papel === 'conversa') { falarComo(o.nome, escolher(CONVERSAS.concat((mapa.tema || CIDADES[0]).conversas, (mapa.tema || CIDADES[0]).conversas))); return; }
  if (!J.pedidos) J.pedidos = [];
  const p = pedidoDe(o.nome);
  if (p && p.prog >= p.n) {
    J.pedidos.splice(J.pedidos.indexOf(p), 1);
    J.ouro += p.ouro;
    ganharXp(Math.round(xpProximo(J.nivel) * 0.3));
    J.pocoes++;
    falarComo(o.nome, `Obrigado, caçador! Toma ${p.ouro} de ouro e uma poção.`);
    fanfarra([523, 659, 784, 1046], 0.04);
    registar('pedido');
    if (contar('pedidos') >= 5) desbloquear('ajudante');
  } else if (p) falarComo(o.nome, `Ainda estou à espera: ${textoPedido(p)}`);
  else if (J.pedidos.length >= 3) falarComo(o.nome, 'Já tens pedidos demais. Volta quando tiveres tempo!');
  else {
    const n = novoPedido(o.nome);
    J.pedidos.push(n);
    falarComo(o.nome, `Podes ajudar-me? ${textoPedido(n)}. Pago ${n.ouro} de ouro.`);
  }
}
// Fala de um habitante (usa a caixa de diálogo da história)
function falarComo(nome, txt) {
  QUEM['h_' + nome] = { nome, cor: '#ffe680' };
  falar('h_' + nome, txt);
}

function objetosCidade() {
  const l = EDIFICIOS.map(E => ({ tipo: 'edificio', id: E.id, x: (E.tx + ED_W / 2) * TILE, y: (ED_Y + ED_H + 0.4) * TILE }));
  l.push({ tipo: 'escadaMasmorra', x: 23 * TILE, y: 22 * TILE, t: 0 });
  l.push({ tipo: 'teleporte', x: 29.5 * TILE, y: 15.5 * TILE, t: 0 });
  return l;
}

// Escada para cima, para a cidade (aparece quando matas um boss)
function abrirEscadaCidade(x, y) {
  objetos.push({ tipo: 'escadaCidade', x, y, t: 0 });
}

let cidade = null;

function entrarCidade() {
  mapa = gerarCidade();
  mapaImg = renderizarCidade(mapa);
  inimigos = []; projeteis = []; baus = []; drops = []; perigos = []; armadilhas = []; ondas = []; raios = [];
  objetos = objetosCidade().concat(mapa.aldeoes);
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = mapa.inicio.x; J.y = mapa.inicio.y; J.invuln = 1;
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  levantarExercito();
  criarPetEntidade();
  J.visitaCidade = { descansou: false };
  if (!J.cidadesVisitadas) J.cidadesVisitadas = [];
  if (!J.cidadesVisitadas.includes(andar)) J.cidadesVisitadas.push(andar);
  registarPoder();
  mostrarBanner(mapa.tema.nome, `Descansa e prepara-te para o andar ${andar + 1}`, '#4dc3ff');
  fanfarra([523, 659, 784, 659, 1046], 0.04);
  guardarJogo();
}

function sairCidade() {
  som(300, 0.4, 'triangle', 0.05, -150);
  proximoAndar();
}

// Os habitantes passeiam pela praça
function atualizarCidadeMundo(dt) {
  if (!naCidade()) return;
  for (const o of objetos) if (o.t != null) o.t += dt;
  for (const a of mapa.aldeoes) {
    if (a.papel === 'anciao') { a.t += dt; continue; } // o Ancião fica junto à fonte
    if (Math.hypot(a.x - J.x, a.y - J.y) < 50) { a.alvo = null; a.andando = false; a.dir = J.x > a.x ? 1 : -1; continue; } // pára para falar contigo
    a.t += dt;
    if (!a.alvo) {
      a.andando = false;
      a.espera -= dt;
      if (a.espera <= 0) a.alvo = { x: rand(5, 40) * TILE, y: rand(9, 20) * TILE };
      continue;
    }
    const dx = a.alvo.x - a.x, dy = a.alvo.y - a.y, d = Math.hypot(dx, dy);
    if (d < 6) { a.alvo = null; a.espera = rand(1, 4); continue; }
    a.andando = true;
    a.dir = dx > 0 ? 1 : -1;
    const x0 = a.x, y0 = a.y;
    moverEntidade(mapa, a, dx / d * 55 * dt, dy / d * 55 * dt);
    if (Math.hypot(a.x - x0, a.y - y0) < 0.2) { a.alvo = null; a.espera = 0.5; } // bateu numa parede
  }
}

// ---------------------------------------------------------------------
//  Painel de um edifício (por cima do mundo)
// ---------------------------------------------------------------------
function abrirEdificio(id) {
  cidade = { t: 0, ed: EDIFICIOS.findIndex(E => E.id === id), sel: 0, msg: null, anim: null };
  estado = 'cidade';
  som(500, 0.08, 'triangle', 0.03, 100);
}

// Pedra de Teletransporte: viajar para as cidades onde já estiveste nesta partida
// (e voltar a descer a partir de lá, para treinar em andares mais fáceis)
const PEDRA_TELETRANSPORTE = { id: 'teleporte', nome: 'Pedra de Teletransporte', cor: '#b48cff' };
function abrirTeletransporte() {
  if (J.remoto) { texto(J.x, J.y - 30, 'Só quem criou a sala pode usar a pedra', '#aaaaaa', 13); return; }
  cidade = { t: 0, ed: -1, tele: true, sel: Math.max(0, cidadesConhecidas().indexOf(andar)), msg: null, anim: null };
  estado = 'cidade';
  som(700, 0.2, 'sine', 0.04, 400);
}
const cidadesConhecidas = () => (J.cidadesVisitadas || [andar]).slice().sort((a, b) => a - b).slice(-12);
const painelCidade = () => (cidade.tele ? PEDRA_TELETRANSPORTE : EDIFICIOS[cidade.ed]);

function viajarParaCidade(a) {
  cidade = null;
  estado = 'jogo';
  andar = a;
  explosao(J.x, J.y, '#b48cff', 30, 220, 5);
  entrarCidade();
  colunaDeLuz(J.x, J.y, '#b48cff', 0.9);
}

function linhasCidade() {
  if (cidade.tele) return cidadesConhecidas().map(a => ({ tipo: 'viajar', a, txt: `${nomeCidade(a)} · andar ${a + 1}`, aqui: a === andar }));
  const id = EDIFICIOS[cidade.ed].id;
  if (id === 'casa') return [
    { tipo: 'descansar', txt: J.visitaCidade && J.visitaCidade.descansou ? 'Já descansaste nesta visita' : 'Descansar (vida e mana cheias)' },
    { tipo: 'guardar', txt: 'Guardar o jogo e sair para o menu' },
  ].filter(l => !(J.remoto && l.tipo === 'guardar')); // o parceiro não guarda o teu jogo
  if (id === 'assoc') {
    const k = (meta.rankCacador || 0) + 1;
    const l = [{ tipo: 'reav', txt: k < RANKS.length ? `Reavaliação de rank (precisas de poder ${poderParaRank(k)})` : 'Reavaliação: rank máximo' }];
    for (const C of CONTRATOS) {
      const s = estadoContrato(C);
      if (s.acabado) continue;
      l.push({ tipo: 'contrato', C, txt: `${traduzir(C.desc).replace('{n}', s.alvo)}  ${Math.min(s.e.prog, s.alvo)}/${s.alvo}`, pronto: s.pronto, premio: s.premio });
      if (l.length >= 4) break;
    }
    return l;
  }
  if (id === 'ferreiro') return ['arma', 'armadura'].map(t => {
    const it = J[t];
    if (!it) return { tipo: 'nada', txt: t === 'arma' ? 'Sem arma' : 'Não tens armadura' };
    const max = (it.enc || 0) >= 5;
    return { tipo: 'afiar', t, txt: `${t === 'arma' ? 'Afiar' : 'Reforçar'}: ${it.nome}${max ? ' (máximo)' : ''}`, preco: max ? null : precoAfiar(it) };
  });
  const c = cidadeRun();
  return [
    { tipo: 'pocao', txt: `Poção (tens ${J.pocoes})`, preco: precoPocao() },
    { tipo: 'elixir', k: 'vida', txt: `Elixir de vida: +8% vida máxima (${c.vida}/${MAX_ELIXIR})`, preco: c.vida >= MAX_ELIXIR ? null : precoElixir(c.vida) },
    { tipo: 'elixir', k: 'mana', txt: `Elixir de mana: +20 mana máxima (${c.mana}/${MAX_ELIXIR})`, preco: c.mana >= MAX_ELIXIR ? null : precoElixir(c.mana) },
  ];
}

const teclaLinha = i => (i < 9 ? String(i + 1) : i === 9 ? '0' : null); // teclas 1-9 e 0
const retLinhaCidade = i => (cidade && cidade.tele ? { x: 120 + (i % 2) * 290, y: 236 + Math.floor(i / 2) * 46, w: 280, h: 40 } : { x: 120, y: 250 + i * 50, w: 560, h: 42 });

function atualizarCidade(dt) {
  const C = cidade;
  C.t += dt;
  if (C.msg) { C.msg.t -= dt; if (C.msg.t <= 0) C.msg = null; }
  if (C.anim) { C.anim.t += dt; if (C.anim.t > 3) C.anim = null; }
  if (C.t < 0.15) return;
  if (premiu('escape') || clicou(BOTAO_FECHAR)) { estado = 'jogo'; cidade = null; rato.baixo = false; return; }
  const L = linhasCidade();
  if (!L.length) return;
  if (premiu('s', 'arrowdown')) C.sel = (C.sel + 1) % L.length;
  if (premiu('w', 'arrowup')) C.sel = (C.sel + L.length - 1) % L.length;
  L.forEach((l, i) => { if (teclaLinha(i) && premiu(teclaLinha(i))) { C.sel = i; } if (dentro(retLinhaCidade(i))) C.sel = i; });
  let acao = null;
  L.forEach((l, i) => { if (clicou(retLinhaCidade(i)) || (teclaLinha(i) && premiu(teclaLinha(i)))) acao = l; });
  if (premiu('e', 'enter', ' ')) acao = L[C.sel];
  if (!acao) return;
  const msg = (txt, cor) => { C.msg = { txt, cor, t: 2.5 }; };
  const semOuro = () => msg('Não tens ouro suficiente', '#ff6060');
  if (acao.tipo === 'viajar') {
    if (acao.aqui) return msg('Já estás nesta cidade', '#aaa');
    if (J.modo === 'diario') return msg('No Desafio Diário a pedra não funciona', '#ff8080');
    viajarParaCidade(acao.a);
    return;
  }
  if (acao.tipo === 'descansar') {
    if (J.visitaCidade.descansou) return msg('Já descansaste nesta visita', '#aaa');
    J.visitaCidade.descansou = true;
    J.hp = S.maxHp; J.mana = S.maxMana; J.veneno = 0;
    msg('Dormiste na tua cama. Vida e mana cheias!', '#5dff7a');
    fanfarra([392, 523, 659], 0.04);
  } else if (acao.tipo === 'guardar') {
    guardarJogo();
    cidade = null;
    estado = 'titulo';
  } else if (acao.tipo === 'reav') {
    const r = reavaliar(); msg(r.txt, r.cor);
  } else if (acao.tipo === 'contrato') {
    const p = receberContrato(acao.C);
    msg(p ? `Contrato entregue: +${p} almas` : 'Ainda não cumpriste este contrato', p ? '#b48cff' : '#aaa');
  } else if (acao.tipo === 'afiar') {
    if (acao.preco == null) return msg('Já está no máximo (+5)', '#aaa');
    if (!pagar(acao.preco)) return semOuro();
    const it = J[acao.t];
    it.enc = (it.enc || 0) + 1;
    melhorarStats(it);
    renomear(it);
    S = stats();
    if (it.enc >= 5) desbloquear('encantar5');
    msg(`O ferreiro melhorou: ${it.nome}`, '#5dff7a');
    fanfarra([523, 659, 784], 0.04);
  } else if (acao.tipo === 'pocao') {
    if (!pagar(acao.preco)) return semOuro();
    J.pocoes++;
    msg('+1 poção', '#ff6b8a');
  } else if (acao.tipo === 'elixir') {
    if (acao.preco == null) return msg('Já bebeste todos os elixires deste tipo', '#aaa');
    if (!pagar(acao.preco)) return semOuro();
    cidadeRun()[acao.k]++;
    const hp0 = S.maxHp;
    S = stats();
    J.hp += Math.max(0, S.maxHp - hp0);
    msg(acao.k === 'vida' ? 'Sentes-te mais forte: +8% vida máxima' : 'A tua mana cresce: +20', '#5dff7a');
    fanfarra([659, 784, 1046], 0.04);
  }
}

function desenharPainelCidade(t) {
  const E = painelCidade();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  painel(100, 130, 760, 420, 'rgba(14,11,22,0.97)', E.cor);
  textoCentro(E.nome, LARGURA / 2 - 80, 164, 28, E.cor);
  textoDir(`Ouro: ${J.ouro}`, 840, 164, 18, '#ffd23f');
  const info = {
    casa: 'A tua casa na cidade. Aqui descansas e guardas o jogo.',
    assoc: `A Guilda mede o teu poder. Rank atual: ${RANKS[meta.rankCacador || 0].letra} (cada rank: +3% dano e vida para sempre)`,
    ferreiro: 'O ferreiro melhora o teu equipamento sem nunca falhar (até +5).',
    alquimista: 'Poções e elixires que duram até ao fim da partida.',
    teleporte: 'Viaja para uma cidade onde já estiveste. Quando desceres, continuas a partir dessa cidade.',
  }[E.id];
  textoCentroAjustado(info, LARGURA / 2, 206, 13, '#ccc', 700, false);
  linhasCidade().forEach((l, i) => {
    const r = retLinhaCidade(i), s = cidade.sel === i;
    const direita = l.preco != null || l.premio;
    painel(r.x, r.y, r.w, r.h, s ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', s ? '#ffffff' : l.pronto ? '#ffe14d' : '#3a3150');
    textoEsq(teclaLinha(i) || '', r.x + 10, r.y + r.h / 2 + 1, 13, '#777');
    textoCentroAjustado(l.aqui ? `${l.txt} (aqui)` : l.txt, r.x + r.w / 2 - (direita ? 40 : 0), r.y + r.h / 2 + 1, 14, l.aqui ? '#777' : l.pronto ? '#ffe14d' : l.tipo === 'contrato' ? '#ddd' : E.cor, r.w - (direita ? 150 : 40));
    if (l.preco != null) textoDir(`${l.preco} ouro`, r.x + r.w - 12, r.y + r.h / 2 + 1, 13, J.ouro >= l.preco ? '#ffd23f' : '#ff8080');
    if (l.premio) textoDir(l.pronto ? `Receber ${l.premio} almas` : `${l.premio} almas`, r.x + r.w - 12, r.y + r.h / 2 + 1, 13, l.pronto ? '#ffe14d' : '#887');
  });
  // quem te atende
  const npc = { casa: ['humano', J.skin], assoc: ['humano', 'real'], ferreiro: ['anao', 'dourado'], alquimista: ['elfo', 'gelo'] }[E.id];
  if (npc) sprEcra(framesHeroi(npc[0], npc[1])[Math.floor(t * 2) % 2 ? 0 : 1], 770, 360, 5);
  if (cidade.tele && cidadesConhecidas().length < 2) textoCentro('Ainda só conheces esta cidade. Cada boss leva-te a uma nova.', LARGURA / 2, 300, 14, '#aaa');
  if (E.id === 'casa') { // troféus dos bosses que já derrotaste (em qualquer partida)
    textoEsq('Troféus:', 130, 400, 14, '#ffae00');
    BOSSES.forEach((b, i) => {
      const c = SPR[b.id] && SPR[b.id][0];
      if (!c) return;
      const tem = meta.trofeus && meta.trofeus[b.id], esc = Math.max(1, Math.floor(40 / Math.max(c.width, c.height)));
      sprEcra(tem ? c : silhueta(c, '#2a2438'), 150 + i * 56, 450, esc);
    });
    textoEsq(`${Object.keys(meta.trofeus || {}).length}/${BOSSES.length}`, 130, 490, 12, '#aaa', 'normal');
  }
  if (E.id === 'assoc' && J.pedidos && J.pedidos.length) textoEsq(`Pedidos da cidade: ${J.pedidos.map(textoPedido).join(' · ')}`, 130, 460, 11, '#ffe680', 'normal');
  if (cidade.msg) textoCentro(cidade.msg.txt, LARGURA / 2, 516, 15, cidade.msg.cor);
  botao(BOTAO_FECHAR, 'Sair', '#ff8080');
  if (!modoToque) textoCentro(cidade.tele ? '1-0 ou W/S: escolher · E: viajar · Esc: sair' : '1-4 ou W/S: escolher · E: comprar · Esc: sair', LARGURA / 2, 568, 12, '#777', false);
  if (cidade.anim) { // animação da reavaliação
    const a = cidade.anim, al = Math.min(1, a.t * 2) * Math.min(1, (3 - a.t) * 2);
    ctx.globalAlpha = al * 0.85; ctx.fillStyle = '#000'; ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
    ctx.globalAlpha = al;
    ctx.fillStyle = a.cor; ctx.beginPath(); ctx.arc(LARGURA / 2, 280, 60 + Math.sin(t * 8) * 6, 0, Math.PI * 2); ctx.fill();
    textoCentro(a.letra, LARGURA / 2, 284, a.letra.length > 2 ? 30 : 64, '#07060a');
    textoCentro('[Destino] Reavaliação concluída', LARGURA / 2, 390, 22, '#9fdcff');
    textoCentro(`Rank ${a.letra}`, LARGURA / 2, 424, 28, a.cor);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------
//  Desenho da cidade no mundo
// ---------------------------------------------------------------------
function desenharEdificioMundo(E, t) {
  const x = E.tx * TILE, y = ED_Y * TILE, w = ED_W * TILE, h = ED_H * TILE, base = y + h;
  // telhado (sobe acima do edifício)
  ctx.fillStyle = E.telhado;
  ctx.beginPath(); ctx.moveTo(x - 8, y + 52); ctx.lineTo(x + w / 2, y - 40); ctx.lineTo(x + w + 8, y + 52); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  for (let k = 0; k < 5; k++) ctx.fillRect(x + w / 2 - 20 * k - 10, y - 30 + k * 16, 40 * k + 20, 3);
  // parede
  ctx.fillStyle = E.parede; ctx.fillRect(x, y + 48, w, h - 48);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let yy = y + 60; yy < base; yy += 14) ctx.fillRect(x, yy, w, 2);
  ctx.fillStyle = E.cor; ctx.fillRect(x - 8, y + 48, w + 16, 5);
  // janelas acesas
  ctx.fillStyle = `rgba(255,210,120,${0.75 + Math.sin(t * 2 + x) * 0.15})`;
  ctx.fillRect(x + 22, y + 70, 30, 28); ctx.fillRect(x + w - 52, y + 70, 30, 28);
  ctx.fillStyle = E.parede; ctx.fillRect(x + 36, y + 70, 2, 28); ctx.fillRect(x + w - 38, y + 70, 2, 28);
  // porta
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + w / 2 - 20, base - 62, 40, 62);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + w / 2 + 10, base - 32, 4, 4);
  // letreiro
  ctx.fillStyle = 'rgba(20,14,8,0.95)'; ctx.fillRect(x + 12, y + 108, w - 24, 20);
  ctx.fillStyle = E.cor; ctx.fillRect(x + 12, y + 108, w - 24, 2); ctx.fillRect(x + 12, y + 126, w - 24, 2);
  // pormenores
  if (E.id === 'ferreiro') { ctx.fillStyle = '#555a66'; ctx.fillRect(x + w + 4, base - 20, 30, 10); ctx.fillRect(x + w + 12, base - 10, 14, 10); if (Math.sin(t * 6) > 0.5) { ctx.fillStyle = '#ffe14d'; ctx.fillRect(x + w + 12 + Math.random() * 10, base - 30 - Math.random() * 8, 3, 3); } }
  if (E.id === 'alquimista') for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ff5a5a', '#5dff7a', '#4dc3ff'][k]; ctx.fillRect(x + w + 4 + k * 10, base - 14, 7, 12); }
  if (E.id === 'assoc') { ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3; circulo(x + w + 18, base - 16, 9, '#4dc3ff'); ctx.globalAlpha = 1; }
  if (E.id === 'casa') { ctx.fillStyle = '#6a3a1a'; ctx.fillRect(x + w - 40, y - 10, 14, 30); if (Math.random() < 0.1) particulas.push({ x: x + w - 33, y: y - 14, vx: rand(-5, 5), vy: -25, t: 1.4, cor: '#bbbbbb', tam: 5 }); }
}

function desenharCidadeMundo(t) {
  if (!naCidade()) return;
  for (const E of EDIFICIOS) desenharEdificioMundo(E, t);
  // fonte
  const f = mapa.fonte;
  sombra(f.x, f.y + 30, 40);
  const C = mapa.tema || CIDADES[0];
  ctx.fillStyle = C.muralha[1]; ctx.beginPath(); ctx.ellipse(f.x, f.y + 10, 44, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.fonte; ctx.beginPath(); ctx.ellipse(f.x, f.y + 8, 36, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.muralha[0]; ctx.fillRect(f.x - 6, f.y - 30, 12, 38);
  if (Math.random() < 0.6) particulas.push({ x: f.x + rand(-3, 3), y: f.y - 32, vx: rand(-40, 40), vy: rand(-90, -50), t: 0.6, cor: C.gota, tam: 3 });
  // árvores (ou rochas, cristais, colunas... conforme a cidade) e candeeiros
  for (const [tx, ty] of mapa.arvores) desenharArvoreCidade(C, (tx + 0.5) * TILE, (ty + 0.5) * TILE, t);
  for (const c of mapa.candeeiros) {
    ctx.fillStyle = C.muralha[2]; ctx.fillRect(c.x - 2, c.y - 34, 4, 40);
    ctx.fillStyle = C.luz; ctx.fillRect(c.x - 6, c.y - 44, 12, 10);
  }
}

function desenharArvoreCidade(C, x, y, t) {
  const [f1, f2] = C.folhas;
  sombra(x, y + 14, 16);
  const tri = (ax, ay, bx, by, cx, cy, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); };
  switch (C.arvore) {
    case 'morta': // árvore seca, sem folhas
      ctx.fillStyle = C.tronco; ctx.fillRect(x - 3, y - 26, 6, 40);
      ctx.fillRect(x - 14, y - 22, 12, 3); ctx.fillRect(x - 14, y - 30, 3, 10); ctx.fillRect(x + 2, y - 16, 12, 3); ctx.fillRect(x + 11, y - 26, 3, 12);
      break;
    case 'rocha': // rocha com fendas de lava
      circulo(x, y - 4, 18, f1); circulo(x - 6, y - 10, 12, f2);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + x); ctx.fillStyle = '#ff7b25'; ctx.fillRect(x - 8, y - 6, 12, 2); ctx.fillRect(x + 2, y - 12, 2, 8); ctx.globalAlpha = 1;
      break;
    case 'pinheiro': // pinheiro com neve
      ctx.fillStyle = C.tronco; ctx.fillRect(x - 3, y, 6, 14);
      tri(x, y - 40, x - 18, y + 2, x + 18, y + 2, f1); tri(x, y - 40, x - 9, y - 20, x + 9, y - 20, f2);
      break;
    case 'salgueiro': // copa caída
      ctx.fillStyle = C.tronco; ctx.fillRect(x - 4, y - 4, 8, 18);
      circulo(x, y - 16, 20, f1);
      ctx.fillStyle = f2; for (let k = -16; k <= 16; k += 6) ctx.fillRect(x + k, y - 12, 2, 18 + (k % 4));
      break;
    case 'palmeira':
      ctx.fillStyle = C.tronco; for (let k = 0; k < 6; k++) ctx.fillRect(x - 3 + k, y - k * 6, 6, 7);
      for (const [dx, dy] of [[-18, -30], [20, -28], [-14, -40], [14, -42], [0, -46]]) { ctx.strokeStyle = f1; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 5, y - 34); ctx.lineTo(x + dx, y + dy + 8); ctx.stroke(); }
      circulo(x + 5, y - 34, 5, f2);
      break;
    case 'cristal': // cristais a brilhar
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 2 + x);
      tri(x - 8, y - 34, x - 16, y + 8, x, y + 8, f1); tri(x + 6, y - 24, x - 2, y + 8, x + 14, y + 8, f2); tri(x - 1, y - 44, x - 7, y + 8, x + 5, y + 8, '#ffffff');
      ctx.globalAlpha = 1;
      break;
    case 'obelisco': // obelisco negro com runas
      ctx.fillStyle = f1; ctx.fillRect(x - 7, y - 34, 14, 48); tri(x, y - 46, x - 7, y - 34, x + 7, y - 34, f1);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + x); ctx.fillStyle = f2; ctx.fillRect(x - 2, y - 26, 4, 4); ctx.fillRect(x - 2, y - 14, 4, 4); ctx.fillRect(x - 2, y - 2, 4, 4); ctx.globalAlpha = 1;
      break;
    case 'coluna': // coluna branca com topo dourado
      ctx.fillStyle = f1; ctx.fillRect(x - 7, y - 34, 14, 48);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 3, y - 34, 2, 48); ctx.fillRect(x + 2, y - 34, 2, 48);
      ctx.fillStyle = f2; ctx.fillRect(x - 10, y - 40, 20, 6); ctx.fillRect(x - 10, y + 10, 20, 5);
      break;
    case 'ruina': // pedaço de muro partido
      ctx.fillStyle = f1; ctx.fillRect(x - 14, y - 14, 28, 28); ctx.fillRect(x - 14, y - 24, 10, 12); ctx.fillRect(x + 4, y - 20, 10, 8);
      ctx.fillStyle = f2; ctx.fillRect(x - 12, y - 4, 10, 6); ctx.fillRect(x + 2, y + 4, 10, 6);
      break;
    default: // árvore normal
      ctx.fillStyle = C.tronco; ctx.fillRect(x - 4, y - 4, 8, 18);
      circulo(x, y - 14, 20, f1); circulo(x - 6, y - 20, 12, f2);
  }
}

// Pedra de Teletransporte na praça
function desenharPedraTeletransporte(o, t) {
  const x = o.x, y = o.y;
  sombra(x, y + 16, 18);
  ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3);
  circulo(x, y + 10, 26, '#b48cff');
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#4a4058'; ctx.beginPath(); ctx.moveTo(x - 14, y + 14); ctx.lineTo(x - 10, y - 26); ctx.lineTo(x, y - 34); ctx.lineTo(x + 10, y - 26); ctx.lineTo(x + 14, y + 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(200,150,255,${0.6 + 0.4 * Math.sin(t * 4)})`;
  ctx.fillRect(x - 2, y - 22, 4, 10); ctx.fillRect(x - 6, y - 8, 12, 3); ctx.fillRect(x - 2, y, 4, 8);
  if (Math.random() < 0.25) { const a = Math.random() * Math.PI * 2; particulas.push({ x: x + Math.cos(a) * 20, y: y + Math.sin(a) * 8, vx: 0, vy: -40, t: 0.8, cor: '#d0a8ff', tam: 3 }); }
}

// Os habitantes (entram na lista ordenada pela altura)
function entidadesCidade(lista) {
  if (!naCidade()) return;
  for (const a of mapa.aldeoes) lista.push({ y: a.y, f: () => { sombra(a.x, a.y + 12, 9); spr(framesHeroi(a.raca, a.skin)[a.andando ? [0, 1, 0, 2][Math.floor(a.t * 8) % 4] : 0], a.x, a.y - (a.andando ? Math.abs(Math.sin(a.t * 10)) * 2 : 0), a.dir < 0); } });
}

// Nomes nos letreiros (no ecrã, para ficarem nítidos)
function desenharNomesCidade() {
  if (!naCidade()) return;
  for (const a of mapa.aldeoes) {
    const p = a.papel === 'pedido' ? pedidoDe(a.nome) : null;
    const marca = a.papel === 'anciao' ? '…' : a.papel === 'pedido' ? (p ? (p.prog >= p.n ? '?' : '') : '!') : '';
    if (marca) textoCentro(marca, ecraX(a.x), ecraY(a.y) - 40 * ZOOM, 18, marca === '?' ? '#5dff7a' : '#ffe14d');
  }
  for (const E of EDIFICIOS) textoCentro(E.nome, ecraX((E.tx + ED_W / 2) * TILE), ecraY(ED_Y * TILE + 118), 11 * Math.min(1.2, ZOOM), E.cor, false);
}

// Escada para cima (na masmorra, depois do boss) e escada para baixo (na cidade)
function desenharEscadaCidade(o, t) {
  const x = alinhar(o.x), y = alinhar(o.y);
  if (o.tipo === 'escadaMasmorra') { // descer para a masmorra
    ctx.drawImage(SPR.escada, x - TILE / 2 - 6, y - TILE / 2 - 6, TILE + 12, TILE + 12);
    ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
    ctx.strokeStyle = '#ffae00'; ctx.lineWidth = 2;
    ctx.strokeRect(x - TILE / 2 - 6, y - TILE / 2 - 6, TILE + 12, TILE + 12);
    ctx.globalAlpha = 1;
    return;
  }
  // degraus de pedra que sobem para a luz
  sombra(o.x, o.y + 22, 26);
  for (let k = 0; k < 5; k++) {
    const w = 52 - k * 6, yy = y + 14 - k * 9;
    ctx.fillStyle = ['#5a5468', '#6a6478', '#7a7488', '#8a8498', '#9a94a8'][k];
    ctx.fillRect(x - w / 2, yy, w, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - w / 2, yy + 7, w, 2);
  }
  ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3);
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath(); ctx.moveTo(x - 14, y - 32); ctx.lineTo(x + 14, y - 32); ctx.lineTo(x + 30, y + 22); ctx.lineTo(x - 30, y + 22); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  const b = Math.sin(t * 4) * 3;
  ctx.fillStyle = '#4dc3ff';
  ctx.beginPath(); ctx.moveTo(x, y - 46 + b); ctx.lineTo(x - 8, y - 36 + b); ctx.lineTo(x + 8, y - 36 + b); ctx.closePath(); ctx.fill();
  if (Math.random() < 0.2) particulas.push({ x: o.x + rand(-20, 20), y: o.y + 10, vx: 0, vy: -50, t: 0.6, cor: '#fff6c8', tam: 3 });
}

function desenharInfoCidade(o, sx, sy) {
  const usar = modoToque ? 'Usar' : '[E]';
  if (o.tipo === 'escadaCidade') {
    textoCentro(`Escada para ${traduzir(nomeCidade(andar))}`, sx, sy - 36, 16, '#4dc3ff');
    textoCentro('Abre os baús primeiro! Da cidade segues para o andar seguinte', sx, sy - 18, 12, '#ddd');
    textoCentro(`${usar}: Subir à cidade`, sx, sy, 15, '#ffe680');
    return true;
  }
  if (o.tipo === 'escadaMasmorra') {
    textoCentro(`Escada para a masmorra (andar ${andar + 1})`, sx, sy - 18, 15, '#ffae00');
    textoCentro(`${usar}: Descer à masmorra`, sx, sy, 15, '#ffe680');
    return true;
  }
  if (o.tipo === 'teleporte') {
    textoCentro('Pedra de Teletransporte', sx, sy - 18, 15, '#b48cff');
    textoCentro(`${usar}: Viajar para outra cidade`, sx, sy, 15, '#ffe680');
    return true;
  }
  if (o.tipo === 'aldeao') {
    const p = o.papel === 'pedido' ? pedidoDe(o.nome) : null;
    textoCentro(o.nome, sx, sy + 12, 13, '#ffe680');
    textoCentro(`${usar}: ${p && p.prog >= p.n ? 'Receber recompensa' : 'Falar'}`, sx, sy + 30, 14, '#ffe680');
    return true;
  }
  if (o.tipo === 'edificio') {
    const E = EDIFICIOS.find(x => x.id === o.id);
    textoCentro(`${usar}: Entrar em ${traduzir(E.nome)}`, sx, sy + 20, 15, E.cor);
    return true;
  }
  return false;
}
