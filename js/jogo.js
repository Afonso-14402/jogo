'use strict';
// =====================================================================
//  LÓGICA DO JOGO
// =====================================================================

const canvas = document.getElementById('tela');
const ctxTela = canvas.getContext('2d');
let ctx = ctxTela; // durante o desenho do mundo aponta para o buffer de pixel art
canvas.width = LARGURA;
canvas.height = ALTURA;

let estado = 'titulo'; // titulo | criar | almas | colecao | conquistas | jogo | pausa | bau | nivel | loja | encantar | mochila | personagem | morto
let andar = 0;
let mapa, mapaImg, J, S;
let inimigos = [], projeteis = [], baus = [], drops = [], particulas = [], textos = [], perigos = [];
let boss = null, roleta = null, banner = null, escolha = null;
let raios = [], objetos = [], armadilhas = [], ondas = [];
let loja = null, mesa = null, criacao = null, mochilaUI = null;
let pet = null; // o companheiro no mundo (os dados ficam em J.pet)
const TAMANHO_MOCHILA = 6;
let cam = { x: 0, y: 0 };
let tremor = 0;
let tempoJogo = 0;
let somLigado = true;
let recorde = 0;
try { recorde = parseInt(localStorage.getItem('masmorra_recorde') || '0', 10) || 0; } catch (e) { /* sem storage */ }

// ---------------------------------------------------------------------
//  Guardar / continuar (o jogo guarda sozinho ao entrar em cada andar
//  e quando fechas a página; ao continuar recomeças esse andar)
// ---------------------------------------------------------------------
const CHAVE_SAVE = 'masmorra_save';
const CAMPOS_SAVE = ['hpBase', 'hp', 'nivel', 'xp', 'atkBase', 'defBase', 'velBase', 'arma', 'armadura', 'amuleto',
  'pocoes', 'kills', 'bausAbertos', 'melhorItem', 'perks', 'escolhasPendentes', 'ouro', 'raca', 'skin', 'mana', 'feiticos', 'dificuldade', 'mochila', 'pet', 'vidasExtra', 'bossesMortos', 'reliquias', 'pacto', 'vidaVendida', 'atributos', 'pontos', 'sombras', 'sombrasCaidas', 'cidadesVisitadas', 'missao', 'classe', 'evoluido', 'provacao', 'modo', 'generais', 'cidadeRun', 'pedidos', 'historiaVista'];

function lerSave() {
  try {
    const t = localStorage.getItem(CHAVE_SAVE);
    const d = t ? JSON.parse(t) : null;
    return d && d.J && d.andar ? d : null;
  } catch (e) { return null; }
}
let saveInfo = lerSave();

function guardarJogo() {
  if (!J || J.hp <= 0 || J.remoto) return; // o herói do parceiro não é guardado
  const dados = { v: 1, andar: naCidade() ? andar + 1 : andar, tempoJogo, J: {} }; // na cidade, continuas no andar seguinte
  for (const k of CAMPOS_SAVE) dados.J[k] = J[k];
  const chao = fotoAndar();
  if (chao) dados.chao = chao;
  try { localStorage.setItem(CHAVE_SAVE, JSON.stringify(dados)); saveInfo = dados; } catch (e) {
    try { delete dados.chao; localStorage.setItem(CHAVE_SAVE, JSON.stringify(dados)); saveInfo = dados; } catch (e2) { /* sem storage */ }
  }
}

// Guardar a meio do andar: o mapa, os monstros vivos, os baús e os objetos ficam como estão.
// Nos portais, no templo, na cidade e nos andares de boss continua-se do início do andar.
function fotoAndar() {
  if (!mapa || !mapa.tiles || guardaAndar || naCidade() || mapa.eBoss || mapa.provacao || boss || (J.modo === 'bossrush')) return null;
  const simples = o => { const r = {}; for (const k in o) { const v = o[k]; if (k[0] !== '_' && (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')) r[k] = v; } return r; };
  return {
    andar, x: Math.round(J.x), y: Math.round(J.y), mapa: mapaParaGuardar(mapa),
    inimigos: inimigos.filter(e => !e.morto && !e.boss && INIMIGOS[e.tipo]).map(e => Object.assign(simples(e), { hab: [...(e.hab || [])] })),
    baus, drops, objetos, armadilhas,
  };
}
// O mapa inteiro (as tabelas de números vão em base64; ao ler usa-se o desserializarMapa do co-op)
function mapaParaGuardar(m) {
  const o = {};
  for (const k in m) {
    const v = m[k];
    if (ArrayBuffer.isView(v)) o[k] = { __u8: paraBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
    else if (v instanceof Set) o[k] = { __set: [...v] };
    else if (typeof v !== 'function') o[k] = v;
  }
  return o;
}
let relogioGuardar = 0;
function autoGuardar(dt) { // a meio do andar guarda sozinho de 30 em 30 segundos
  relogioGuardar += dt;
  if (relogioGuardar < 30) return;
  relogioGuardar = 0;
  guardarJogo();
}
function restaurarAndar(c) {
  andar = c.andar;
  atualizarFatorAdaptativo();
  mapa = desserializarMapa(c.mapa);
  mapaImg = renderizarMapa(mapa, andar);
  inimigos = c.inimigos.map(o => Object.assign(criarInimigo(o.tipo, o.x, o.y), o, { hab: new Set(o.hab), nasceu: tempoJogo }));
  projeteis = []; particulas = []; textos = []; perigos = []; raios = []; ondas = []; restos = []; brilhos = [];
  comecarTransicaoAndar();
  baus = c.baus || []; drops = c.drops || []; objetos = c.objetos || []; armadilhas = c.armadilhas || [];
  reiniciarBioma();
  boss = null;
  reiniciarCampo();
  J.x = c.x; J.y = c.y;
  J.invuln = 2; J.golpe = null;
  levantarExercito();
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  revelar(mapa, J.x, J.y, 7);
  criarPetEntidade();
  mostrarBanner(`ANDAR ${andar}`, 'Continuas onde paraste', '#ffffff');
}

function apagarSave() {
  try { localStorage.removeItem(CHAVE_SAVE); } catch (e) { /* sem storage */ }
  saveInfo = null;
}

function guardarSeAJogar() {
  if (J && J.hp > 0 && ['jogo', 'pausa', 'bau', 'nivel', 'loja', 'encantar', 'mochila', 'personagem'].includes(estado)) guardarJogo();
}
addEventListener('pagehide', guardarSeAJogar);

// Raça e skin escolhidas (lembradas entre partidas)
let escolhaRaca = 'humano', escolhaSkin = 'azul', escolhaDificuldade = 'normal', escolhaClasse = 'aventureiro';
try {
  const e = JSON.parse(localStorage.getItem('masmorra_personagem') || 'null');
  if (e && RACAS[e.raca]) escolhaRaca = e.raca;
  if (e && SKINS[e.skin]) escolhaSkin = e.skin;
  if (e && e.classe) escolhaClasse = e.classe;
  if (e && DIFICULDADES[e.dificuldade] && !DIFICULDADES[e.dificuldade].conquista) escolhaDificuldade = e.dificuldade;
} catch (e) { /* sem storage */ }
const dif = () => DIFICULDADES[(J && J.dificuldade) || 'normal'] || DIFICULDADES.normal;
const skinLivre = id => (!SKINS[id].recorde || recorde >= SKINS[id].recorde) && (!SKINS[id].conquista || !!meta.conquistas[SKINS[id].conquista]);
if (!skinLivre(escolhaSkin)) escolhaSkin = 'azul';
function guardarEscolha() {
  try { localStorage.setItem('masmorra_personagem', JSON.stringify({ raca: escolhaRaca, skin: escolhaSkin, dificuldade: escolhaDificuldade, classe: escolhaClasse })); } catch (e) { /* sem storage */ }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) guardarSeAJogar(); });

// ---------------------------------------------------------------------
//  Som (WebAudio, sem ficheiros)
// ---------------------------------------------------------------------
let actx = null, mestreSom = null;
// Todo o som passa por aqui (assim também o podemos enviar ao telemóvel do parceiro)
function saidaSom() {
  if (!mestreSom) { mestreSom = actx.createGain(); mestreSom.connect(actx.destination); }
  return mestreSom;
}
function som(freq, dur, tipo = 'square', vol = 0.05, slide = 0, atraso = 0) {
  if (capturarSom([freq, dur, tipo, vol, slide, atraso])) return; // a jogar a 2, também toca no telemóvel do parceiro
  if (!somLigado) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended' && !document.hidden) actx.resume();
    const t0 = actx.currentTime + atraso;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(saidaSom());
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
const rato = { x: LARGURA / 2, y: ALTURA / 2, baixo: false, movido: -1e9 };

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
  rato.x = (e.clientX - b.left) * TELA_W / b.width - MARGEM_X;
  rato.y = (e.clientY - b.top) * ALTURA / b.height;
  rato.movido = performance.now();
});
canvas.addEventListener('mousedown', e => { rato.baixo = true; premidas['rato'] = true; e.preventDefault(); });
addEventListener('mouseup', () => { rato.baixo = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

const premiu = (...ks) => !(J && J.remoto && !coop.menuP2) && ks.some(k => premidas[k]); // o herói do convidado não usa o teu teclado (só nos menus dele)

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
    aplicarAfixo(it, af);
    it.nome = `${modelo.nome} ${af.nome}`;
  }
  return it;
}

// Probabilidades do baú já com a Sorte do jogador aplicada (somam 100)
function chancesBau(tipoBau) {
  const base = TIPOS_BAU[tipoBau].chances;
  const sorte = J && S ? S.sorte : 0;
  const pesos = {};
  let total = 0;
  // lá em cima os lendários e os míticos são muito mais raros (ficam normais no andar 15 e no 35)
  const fundo = { lendario: clamp(andar / 15, 0.2, 1), mitico: clamp((andar - 5) / 30, 0.05, 1) };
  if (andar > 60) { fundo.lendario = 1 + Math.min(1, (andar - 60) * 0.03); fundo.mitico = 1 + Math.min(2, (andar - 60) * 0.05); } // Profundezas: baús melhores
  for (const r of ORDEM_RARIDADES) {
    pesos[r] = base[r] * Math.pow(EFEITO_SORTE[r], sorte) * (fundo[r] || 1);
    total += pesos[r];
  }
  for (const r of ORDEM_RARIDADES) pesos[r] = pesos[r] * 100 / total;
  return pesos;
}

function sortearItem(tipoBau) {
  let r = escolherPeso(chancesBau(tipoBau));
  // quanto mais fundo, menos lixo (mas pode sempre calhar)
  if (r === 'lixo' && Math.random() < Math.min(0.6, andar / 40)) r = escolherPeso(chancesBau(tipoBau));
  let pool = ITENS.filter(i => i.r === r && !i.inicial);
  // às vezes calha uma arma do mesmo tipo da tua (mais útil para o teu caçador)
  if (J && J.arma && Math.random() < 0.3) {
    const mesmo = pool.filter(i => i.tipo === 'arma' && classeArma(i) === classeArma(J.arma));
    if (mesmo.length) pool = mesmo;
  }
  const it = criarItem(escolher(pool), andar);
  if (TIPOS_BAU[tipoBau].maldito) { // sempre com encantamento, mas amaldiçoado
    if (!it.afixo || it.afixo.id === 'maldicao') { retirarAfixo(it); aplicarAfixo(it, escolher(AFIXOS[it.tipo])); }
    it.maldicao = escolher(MALDICOES);
    renomear(it);
  }
  return it;
}

function retirarAfixo(it) {
  const a = it.afixo;
  if (!a) return;
  if (a.multDano) it.dano = Math.round(it.dano / a.multDano);
  if (a.multVel) it.vel = +(it.vel / a.multVel).toFixed(2);
  if (a.multDef) it.def = Math.round(it.def / a.multDef);
  if (a.multHp && it.hp > 0) it.hp = Math.round(it.hp / a.multHp);
  it.afixo = null;
}

function aplicarAfixo(it, af) {
  if (af.multDano) it.dano = Math.round(it.dano * af.multDano);
  if (af.multVel) it.vel = +(it.vel * af.multVel).toFixed(2);
  if (af.multDef) it.def = Math.round(it.def * af.multDef);
  if (af.multHp && it.hp > 0) it.hp = Math.round(it.hp * af.multHp);
  it.afixo = af;
}

// Soma um atributo das maldições do equipamento
function somaMaldicoes(k) {
  let v = 0;
  for (const t of ['arma', 'armadura', 'amuleto']) if (J[t] && J[t].maldicao && J[t].maldicao[k]) v += J[t].maldicao[k];
  return v;
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
  const R = RACAS[J.raca] || RACAS.humano;
  const X = bonusExtra(); // relíquias e bónus das raças novas
  const C = bonusCacador(); // atributos do caçador
  const K = bonusClasse();  // passiva do caçador escolhido (e Forma Bestial)
  const Z = bonusCidade();  // rank de caçador e alquimista da cidade
  const Q = bonusConjuntos(); // conjuntos de equipamento
  const magia = (a.magia || 0) + (am.magia || 0) + somaAfixos('magia') + 0.2 * nPerk('arcano') + (R.magia || 0) + X.magia + C.magia + K.magia;
  return {
    maxHp: Math.max(10, Math.round((J.hpBase + K.hp + (ar ? ar.hp : 0) + 30 * nPerk('vitalidade') + (R.hp || 0) + 10 * nMeta('vida')) * (1 + somaMaldicoes('vidaPct') + X.hpPct + C.hpPct + Z.hpPct + Q.hpPct) * (1 - (J.vidaVendida || 0)))),
    def: Math.round((J.defBase + K.def + (ar ? ar.def : 0) + 3 * nPerk('pedra') + (R.def || 0)) * (1 + X.defPct)),
    dano: Math.round((J.atkBase + a.dano) * (1 + 0.15 * nPerk('forca')) * (1 + (R.dano || 0)) * (1 + 0.05 * nMeta('dano')) * (1 + X.danoPct) * (1 + C.danoPct) * (1 + K.danoPct) * (1 + Z.danoPct) * (1 + Q.danoPct)),
    crit: Math.min(0.6, 0.05 + (a.crit || 0) + (am.crit || 0) + somaAfixos('crit') + 0.08 * nPerk('olho') + (R.crit || 0) + X.crit + C.crit + K.crit + Q.crit),
    vel: J.velBase * Math.max(0.3, 1 + (am.velMov || 0) + somaAfixos('velMov') + 0.12 * nPerk('pes') + (R.velMov || 0) + somaMaldicoes('velMov') + X.vel + C.velMov + K.vel + Q.vel),
    roubo: Math.min(0.1 + K.roubo, (am.roubo || 0) + somaAfixos('roubo') + 0.03 * nPerk('sangue') + (R.roubo || 0) + K.roubo),
    regen: (am.regen || 0) + somaAfixos('regen') + 1.5 * nPerk('regen') + somaMaldicoes('regen') + X.regen + K.regen + Q.regen,
    danoPct: am.danoPct || 0,
    cdAtaque: 0.42 / (a.vel * (1 + 0.15 * nPerk('furia')) * (1 + (R.velAtaque || 0) + C.velAtaque + K.velAtaque + Q.velAtaque)),
    alcance: Math.round(a.alcance * (1 + (K.alcance || 0))),
    xpMult: (1 + somaAfixos('xp') + 0.2 * nPerk('iman') + (R.xp || 0) + 0.1 * nMeta('xp') + X.xp + K.xp) * dif().xp,
    sorte: somaAfixos('sorte') + nPerk('sorte') + (R.sorte || 0) + nMeta('sorte') + X.sorte,
    espinhos: somaAfixos('espinhos') + X.espinhos,
    cdDash: 0.9 * (1 - 0.25 * nPerk('esquiva')) * X.dash,
    curaPocao: (0.35 + 0.12 * nPerk('pocoes') + (R.cura || 0) + K.cura + Z.cura + Q.cura) * (1 - 0.25 * nPacto('secura')),
    ouroMult: Math.max(0.1, (1 + (R.ouro || 0)) * dif().ouro * (1 + somaMaldicoes('ouroPct')) * X.ouro * (1 - 0.3 * nPacto('pobreza'))),
    danoRecebido: somaMaldicoes('danoRecebido'),
    magia,
    queimar: Q.queimar,
    poder: Math.round((8 + J.nivel * 3) * Math.max(0.2, 1 + magia)),
    maxMana: Math.max(0, 50 + (R.mana || 0) + (ar ? ar.mana || 0 : 0) + (am.mana || 0) + somaAfixos('manaMax') + 25 * nPerk('mana') + 10 * nMeta('mana') + somaMaldicoes('manaMax') + X.mana + C.mana + Z.mana),
    manaRegen: 3 + 2 * nPerk('canal') + X.manaRegen,
  };
}

function equipar(item) {
  J[item.tipo] = item;
  S = stats();
  J.hp = Math.min(J.hp, S.maxHp);
  J.mana = Math.min(J.mana, S.maxMana);
  if (!J.melhorItem || RARIDADES[item.r].ordem > RARIDADES[J.melhorItem.r].ordem) J.melhorItem = item;
  registrarItem(item);
  if (item.maldicao) desbloquear('maldito');
  for (const k in CONJUNTOS) if (pecasConjunto(k) >= 3) desbloquear('conjunto');
}

// Equipa e manda o item antigo para a mochila (ou vende-o se estiver cheia)
function trocarEquipamento(item) {
  const antigo = J[item.tipo];
  equipar(item);
  if (!antigo) return '';
  if (J.mochila.length < TAMANHO_MOCHILA) { J.mochila.push(antigo); return `${antigo.nome} foi para a mochila`; }
  const v = valorVenda(antigo);
  J.ouro += v;
  return `Mochila cheia: vendeste ${antigo.nome} (+${v} ouro)`;
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
  const combosAntes = combosAtivos().map(c => c.id);
  J.perks[p.id] = nPerk(p.id) + 1;
  if (p.id === 'vitalidade') J.hp += 30;
  if (p.id === 'pocoes') J.pocoes += 2;
  J.escolhasPendentes--;
  const voltar = escolha.voltar || 'jogo';
  escolha = null;
  estado = voltar;
  rato.baixo = false;
  S = stats();
  texto(J.x, J.y - 30, p.nome + '!', p.cor, 20);
  explosao(J.x, J.y, p.cor, 24, 200, 5);
  som(660, 0.2, 'triangle', 0.05, 300);
  anunciarCombos(combosAntes);
}

function retCartaPerk(i, n) {
  const w = 230, h = 280, gap = 30;
  const total = n * w + (n - 1) * gap;
  return { x: (LARGURA - total) / 2 + i * (w + gap), y: 190, w, h };
}

// ---------------------------------------------------------------------
//  Início / andares
// ---------------------------------------------------------------------
function criarJogador() {
  return {
    x: 0, y: 0, r: 12,
    hpBase: 100, hp: 100, nivel: 1, xp: 0, atkBase: 5, defBase: 0, velBase: 165,
    arma: criarItem(ITENS.find(i => i.inicial), 1, true), armadura: null, amuleto: null,
    pocoes: 2, cdAtaque: 0, invuln: 0, dashT: 0, cdDash: 0, dashVX: 0, dashVY: 0,
    kbx: 0, kby: 0, dirX: 1, dirY: 0, angArma: 0, golpe: null,
    kills: 0, bausAbertos: 0, melhorItem: null,
    perks: {}, escolhasPendentes: 0, contaGolpes: 0, escudoCd: 0, ouro: 0, lentoT: 0,
    raca: escolhaRaca, skin: escolhaSkin, dificuldade: escolhaDificuldade, mana: 50, feiticos: { fogo: 1 }, cdFeitico: {},
    mochila: [], pet: null, vidasExtra: 0, bossesMortos: 0, reliquias: [],
    pacto: Object.assign({}, meta.pacto || {}), vidaVendida: 0,
    atributos: {}, pontos: 0, sombras: [], cdHab: {}, classe: escolhaClasse,
  };
}

function novoJogo() {
  apagarSave();
  J = criarJogador();
  J.modo = modoProximo; modoProximo = null;
  if (J.modo === 'diario') J.pacto = Object.assign({}, desafioDeHoje().pacto);
  const R = RACAS[J.raca];
  J.pocoes = Math.max(0, J.pocoes + (R.pocoes || 0) + dif().pocoes + nMeta('pocao'));
  J.ouro += 25 * nMeta('ouro');
  if (nMeta('feitico')) J.feiticos.raio = 1;
  J.vidasExtra = nMeta('reviver');
  J.ouro += R.ouroInicial || 0;
  if (R.armaInicial) J.arma = criarItem(ITENS.find(i => i.nome === R.armaInicial), 1, true);
  aplicarClasseInicial(); // a arma do caçador escolhido
  aplicarCidadeInicial(); // o que compraste na Cidade dos Caçadores
  andar = 0;
  tempoJogo = 0;
  S = stats();
  J.hp = S.maxHp;
  J.mana = S.maxMana;
  registar('partidas');
  conquistasCalor();
  if (!J.modo && andarInicial > 1 && atalhosLivres().includes(andarInicial)) prepararAtalho(andarInicial); // atalho para uma zona mais funda
  proximoAndar();
  estado = 'jogo';
  tutorial = null;
  if (!opcoes.tutorialFeito) iniciarTutorial(); // no andar 1 da primeira partida
}

function continuarJogo() {
  const d = lerSave();
  if (!d) { novoJogo(); return; }
  J = Object.assign(criarJogador(), d.J);
  J.cdFeitico = {};
  andar = d.andar - 1;
  tempoJogo = d.tempoJogo || 0;
  if (J.pontos > 0) distribuirPontos(); // jogos guardados antes de os pontos irem sozinhos
  S = stats();
  let feito = false;
  if (d.chao && d.chao.andar === d.andar) {
    try { restaurarAndar(d.chao); feito = true; } catch (e) { console.warn('andar guardado estragado', e); }
  }
  if (!feito) { andar = d.andar - 1; proximoAndar(); }
  estado = 'jogo';
}

function proximoAndar() {
  andar++;
  if (J && J.modo === 'bossrush') andarBossRush();
  if (J) atualizarFatorAdaptativo(); // os monstros acompanham o teu poder
  if (J && andar > 1) registarPoder();
  if (J) progressoDesbloqueios(); // modos novos no menu inicial
  if (J) { const rk = rankJogador().letra; if (rk === 'S' || rk === 'Nacional') desbloquear('rankS'); if (rk === 'Nacional') desbloquear('nacional'); }
  // no Desafio Diário os mapas usam uma semente: são iguais para toda a gente
  const semente = J && J.modo === 'diario' ? hashTexto(desafioDeHoje().dia + '#' + andar) : null;
  mapa = semente != null ? comSemente(semente, () => gerarMapa(andar)) : J && J.modo === 'torre' ? gerarMapaTorre(andar) : gerarMapa(andar);
  andarProvacao(); // nível 30: o andar passa a ser a Provação da mudança de classe
  mapaImg = renderizarMapa(mapa, andar);
  inimigos = []; projeteis = []; baus = []; drops = []; particulas = []; textos = []; perigos = []; raios = [];
  objetos = []; armadilhas = []; ondas = []; restos = []; brilhos = [];
  comecarTransicaoAndar();
  reiniciarBioma();
  boss = null;
  reiniciarCampo();
  J.x = mapa.inicio.x; J.y = mapa.inicio.y;
  J.invuln = 1.2; J.golpe = null;
  levantarExercito();
  if (J.modo === 'torre' && !mapa.eBoss) popularTorre();
  else if (mapa.eBoss) {
    boss = mapa.provacao ? bossProvacao() : bossHistoria() || (J.modo === 'torre' ? criarBoss(BOSSES[(andar / 10 - 1) % BOSSES.length].id) : criarBoss(null, J.modo === 'bossrush' ? forcaBossRush() : 1));
    inimigos.push(boss);
    mostrarBanner(mapa.provacao ? 'PROVAÇÃO DE CLASSE' : `ANDAR ${andar} — BOSS`, boss.nome, mapa.provacao ? '#4dc3ff' : '#ff4d4d');
    bossDuploProfundezas(); // Profundezas: de 10 em 10 andares vêm dois
    som(80, 1.2, 'sawtooth', 0.06, -30);
  } else {
    if (semente != null) comSemente(semente + 1, popularAndar); else popularAndar();
    const zona = NOMES_ZONAS[zonaAtual()];
    if (zonaDoAndar(andar) !== zonaDoAndar(andar - 1)) mostrarBanner(`ANDAR ${andar}`, `Nova zona: ${zona}${andar > 60 ? ' (Profundezas)' : ''}`, '#ffe14d');
    else mostrarBanner(`ANDAR ${andar}`, andar % 5 === 4 ? 'Cuidado... o próximo andar tem um BOSS!' : 'Encontra a escada para descer', '#ffffff');
    banner.extra = `Andar de Rank ${rankDoAndar(andar).letra} · poder recomendado ${poderRecomendado(andar)} · o teu: ${poderJogador()}`;
    banner.corExtra = corPoder();
    banner.extra2 = mapa.avisoPortal || null;
    if (andar > 1) som(300, 0.3, 'triangle', 0.05, -150);
  }
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  revelar(mapa, J.x, J.y, 7);
  criarPetEntidade();
  sortearEvento();
  historiaDoAndar();
  missaoNoAndar(); // missão da cidade: o monstro raro
  if (andar >= 10) desbloquear('andar10');
  if (andar >= 20) desbloquear('andar20');
  if (andar >= 70) desbloquear('fundo70');
  if (andar >= 100) desbloquear('fundo100');
  if (andar >= 10) conquistaEquipa('coopAndar10');
  if (andar >= 30) conquistaEquipa('coopAndar30');
  conquistasAoDescer();
  registar('andar', andar);
  if (boss) viuMonstro(boss.tipo);
  guardarJogo();
}

function pesosInimigos() {
  const pesos = {};
  const zona = zonaAtual();
  for (const k in INIMIGOS) {
    const d = INIMIGOS[k];
    if (!d.peso || d.minAndar > andar) continue;
    if (d.zonas && d.zonas.includes(zona)) pesos[k] = d.peso;
  }
  return pesos;
}

const centroPx = s => { const c = centroSala(s); return { x: (c.x + 0.5) * TILE, y: (c.y + 0.5) * TILE }; };
const longeDe = (p, lista, dist) => lista.every(o => Math.hypot(o.x - p.x, o.y - p.y) > dist);

function popularAndar() {
  const pesos = pesosInimigos();

  // Salas especiais
  const candidatas = mapa.salas.filter(s => s !== mapa.salaInicio && s !== mapa.salaEscada);
  for (let i = candidatas.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
  }
  const marcar = tipo => { const s = candidatas.pop(); if (s) s.tipo = tipo; return s || null; };
  const salaLoja = (andar % 5 === 3 || Math.random() < 0.15) ? marcar('loja') : null;
  const salaTesouro = Math.random() < 0.3 ? marcar('tesouro') : null;
  const salaAltar = andar >= 2 && Math.random() < 0.25 ? marcar('altar') : null;
  const salaDesafio = andar >= 2 && Math.random() < 0.3 ? marcar('desafio') : null;
  const salaEnc = (andar % 5 === 2 || (andar >= 2 && Math.random() < 0.2)) ? marcar('encantamento') : null;
  criarSalaPacto(marcar);
  const salaPet = (!J.pet && (andar === 2 || (andar > 2 && Math.random() < 0.3))) ? marcar('companheiro') : null;
  if (salaPet) {
    const c = centroPx(salaPet);
    escolherPets(3).forEach((id, i) => {
      let x = c.x + (i - 1) * 76, y = c.y;
      if (colideCirculo(mapa, x, y, 16)) ({ x, y } = pontoLivreNaSala(mapa, salaPet, 16, 1));
      objetos.push({ tipo: 'gaiola', pet: id, sala: salaPet, x, y });
    });
  }
  if (salaEnc) objetos.push(Object.assign(centroPx(salaEnc), { tipo: 'mesa', sala: salaEnc }));
  if (salaLoja) objetos.push(Object.assign(centroPx(salaLoja), { tipo: 'mercador', sala: salaLoja, stock: null }));
  if (salaAltar) objetos.push(Object.assign(centroPx(salaAltar), { tipo: 'altar', sala: salaAltar, usado: false }));
  if (salaDesafio) objetos.push(Object.assign(centroPx(salaDesafio), { tipo: 'cristal', sala: salaDesafio, fase: 'inativo', onda: 0 }));
  if (salaTesouro) {
    const nb = randInt(2, 3);
    for (let i = 0; i < nb; i++) {
      const p = pontoLivreNaSala(mapa, salaTesouro, 16, 1);
      if (longeDe(p, baus, 40)) baus.push({ x: p.x, y: p.y, tipo: Math.random() < 0.3 ? 'ouro' : 'madeira', t: Math.random() * 6 });
    }
    for (let i = 0; i < 4; i++) {
      const p = pontoLivreNaSala(mapa, salaTesouro, 8, 1);
      soltarOuro(p.x, p.y, Math.round(rand(4, 8) * (1 + (andar - 1) * 0.25)), 1);
    }
    const p = pontoLivreNaSala(mapa, salaTesouro, 18);
    const guarda = criarInimigo(escolherPeso(pesos), p.x, p.y);
    aplicarNivel(guarda, sortearNivel());
    tornarElite(guarda);
    inimigos.push(guarda);
  }

  // Inimigos (a loja e o tesouro não recebem inimigos normais)
  let salas = mapa.salas.filter(s => s !== mapa.salaInicio && !['loja', 'tesouro', 'diabo', 'anjo'].includes(s.tipo));
  encherSalaSecreta();
  criarPortalNoAndar(salas);
  criarPortaDupla(salas);
  if (!salas.length) salas = mapa.salas.filter(s => s !== mapa.salaInicio);
  const n = Math.min(40, Math.round((7 + Math.floor(andar * 1.6)) * (1 + 0.25 * nPacto('enxame'))));
  for (let i = 0; i < n; i++) {
    const p = pontoLivreNaSala(mapa, escolher(salas), 18);
    const e = criarInimigo(escolherPeso(pesos), p.x, p.y);
    aplicarNivel(e, sortearNivel());
    // elites só a partir do andar 3, e nos primeiros andares nunca elite e veterano/campeão ao mesmo tempo
    if (andar >= 3 && !(andar < 8 && e.nv >= 2) && Math.random() < Math.min(0.4, (0.05 + andar * 0.01) * dif().elite * (1 + 0.6 * nPacto('elites')))) tornarElite(e);
    inimigos.push(e);
  }

  // Baús
  const nBaus = randInt(2, 4);
  for (let i = 0; i < nBaus; i++) {
    const p = pontoLivreNaSala(mapa, escolher(salas), 16, 1);
    if (Math.hypot(p.x - mapa.escada.x, p.y - mapa.escada.y) < 50 || !longeDe(p, objetos, 50) || !longeDe(p, baus, 40)) continue;
    const r = Math.random();
    baus.push({ x: p.x, y: p.y, tipo: r < 0.07 ? 'ouro' : (andar >= 3 && r < 0.16) ? 'maldito' : 'madeira', t: Math.random() * 6 });
  }
  if (andar === 1) { // um baú logo no início para experimentar
    baus.push({ x: mapa.inicio.x + TILE * 2, y: mapa.inicio.y, tipo: 'madeira', semMimico: true, t: 0 });
    if (colideCirculo(mapa, mapa.inicio.x + TILE * 2, mapa.inicio.y, 14)) baus[baus.length - 1].x = mapa.inicio.x - TILE * 2;
  }

  // Armadilhas (a partir do andar 2)
  if (andar < 2) return;
  const livres = [mapa.escada, mapa.inicio, ...baus, ...objetos];
  const salasArm = mapa.salas.filter(s => s !== mapa.salaInicio && s.tipo !== 'loja');
  const nEsp = Math.min(12, 2 + Math.floor(andar * 0.8));
  for (let i = 0; i < nEsp && salasArm.length; i++) {
    const s = escolher(salasArm);
    const tx0 = randInt(s.x + 1, s.x + s.w - 2), ty0 = randInt(s.y + 1, s.y + s.h - 2);
    const gw = randInt(1, 2), gh = randInt(1, 2), fase = rand(0, 3.2);
    for (let ty = ty0; ty < ty0 + gh; ty++) {
      for (let tx = tx0; tx < tx0 + gw; tx++) {
        const p = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
        if (solido(mapa, tx, ty) || !longeDe(p, livres, 56) || armadilhas.some(a => a.tx === tx && a.ty === ty)) continue;
        armadilhas.push({ tipo: 'espinhos', tx, ty, x: p.x, y: p.y, fase, estado: 0 });
      }
    }
  }
  const nSetas = Math.min(6, Math.floor(andar / 2));
  let feitas = 0;
  for (let t = 0; t < 400 && feitas < nSetas; t++) {
    const tx = randInt(1, mapa.W - 2), ty = randInt(1, mapa.H - 2);
    if (!solido(mapa, tx, ty)) continue;
    const [dx, dy] = escolher([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    let livre = 0;
    for (let k = 1; k <= 6 && !solido(mapa, tx + dx * k, ty + dy * k); k++) livre++;
    if (livre < 5) continue;
    const x = (tx + 0.5) * TILE, y = (ty + 0.5) * TILE;
    if (Math.hypot(x - mapa.inicio.x, y - mapa.inicio.y) < 320 || armadilhas.some(a => a.tx === tx && a.ty === ty)) continue;
    armadilhas.push({ tipo: 'seta', tx, ty, dx, dy, x, y, cd: rand(0, 2) });
    feitas++;
  }
}

function tornarElite(e) {
  const mod = escolher(Object.keys(ELITES));
  e.elite = mod;
  e.r = Math.min(15, Math.round(e.r * 1.3)); // não passa de 15 para caber nos corredores
  e.hp = e.maxHp = Math.round(e.maxHp * 3);
  e.dano = Math.round(e.dano * 1.35);
  e.xp *= 3;
  if (mod === 'veloz') e.vel *= 1.5;
  e.nome = `${e.nome} ${ELITES[mod].nome}`;
}

function soltarOuro(x, y, total, n = 1) {
  const cada = Math.max(1, Math.round(total / n));
  for (let i = 0; i < n; i++) {
    const d = { tipo: 'ouro', valor: cada, x: x + rand(-8, 8), y: y + rand(-8, 8), t: Math.random() * 3 };
    lancarMoeda(d); // salta para fora e quica
    drops.push(d);
  }
}

// Quanto os monstros crescem com o andar: devagar no início e cada vez mais
// depressa a partir do andar 20, para o herói nunca ficar imortal.
function escalaAndar(a) {
  // nas Profundezas (depois do andar 60) cresce bem mais devagar: dá para ir longe
  const extra = Math.max(0, Math.min(a, 60) - 20), fundo = Math.max(0, a - 60);
  return {
    hp: (1 + (a - 1) * 0.3) * Math.pow(1.035, extra) * Math.pow(1.012, fundo),
    dano: (1 + (a - 1) * 0.18) * Math.pow(1.03, extra) * Math.pow(1.01, fundo),
  };
}

// Parte do dano que a defesa tira. Nos andares fundos a mesma defesa vale menos
// (no andar 1 é igual à fórmula antiga) e nunca passa de 80%.
function reducaoDefesa() {
  const K = 12 * (1 + (andar - 1) * 0.15);
  return Math.min(0.8, S.def / (S.def + K));
}

function criarInimigo(tipo, x, y) {
  const d = INIMIGOS[tipo], D = dif();
  const F = fatorAdapt();
  const E = escalaAndar(andar), fh = E.hp * D.hp * (1 + 0.25 * nPacto('pele')) * F.hp, fd = E.dano * D.dano * (1 + 0.2 * nPacto('forca')) * F.dano;
  const hp = Math.round(d.hp * fh);
  return {
    tipo, nome: d.nome, x, y, r: d.r, hp, maxHp: hp,
    dano: Math.round(d.dano * fd), vel: d.vel * (1 + 0.12 * nPacto('pressa')), xp: Math.round(d.xp * (1 + (andar - 1) * 0.2)),
    cor: d.cor, t: Math.random() * 10, cd: rand(0.8, 2), acordado: false,
    kbx: 0, kby: 0, flash: 0, boss: false, morto: false, carga: 0, preparar: 0, cx: 0, cy: 0, z: 0,
    nv: 1, hab: new Set(HAB_BASE[tipo] || []), ia: d.ia, nasceu: tempoJogo,
  };
}

function criarBoss(idForcado = null, mult = 1) {
  const n = Math.max(1, andar / 5);
  const b = idForcado ? BOSSES.find(x => x.id === idForcado) : BOSSES[(n - 1) % BOSSES.length];
  const ciclo = idForcado ? 0 : Math.floor((n - 1) / BOSSES.length);
  const D = dif();
  const F = fatorAdapt();
  const E = escalaAndar(andar), fh = E.hp * D.hp * (1 + 0.25 * nPacto('pele')) * (nPacto('furia') ? 1.3 : 1) * F.hp, fd = E.dano * D.dano * (1 + 0.2 * nPacto('forca')) * F.dano;
  const hp = Math.round(b.hp * fh * mult * (andar === 5 && !idForcado ? 0.85 : 1)); // o 1.º boss é um pouco mais fraco
  return {
    tipo: b.id, nome: ciclo > 0 ? `${b.nome} +${ciclo}` : b.nome, x: mapa.posBoss.x, y: mapa.posBoss.y, r: b.r, hp, maxHp: hp,
    dano: Math.round(b.dano * fd * Math.pow(mult, 0.7)), vel: b.vel, xp: Math.round(b.xp * (1 + (andar - 1) * 0.2)),
    cor: b.cor, t: 0, cd: 0, cdA: 2.5, cdB: 5, cdC: 8, cdD: 1, cdE: 10, acordado: true,
    kbx: 0, kby: 0, flash: 0, boss: true, morto: false, z: 0,
    salto: 0, sopro: 0, investida: 0, fase2: false, giro: 0,
    pisao: 0, espiral: 0, aparecer: 0, cdTiro: 0, duracaoSalto: 0.8,
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
  if (particulas.length > 700) n = Math.min(n, 3); // não deixa o telemóvel ficar lento
  if (n >= 30 && typeof ruido === 'function') ruido(Math.min(0.9, n / 60), Math.min(0.08, n / 700), 900);
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
  for (const o of ondas) o.t -= dt;
  ondas = ondas.filter(o => o.t > 0);
  atualizarBrilhos(dt);
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  tremor = Math.max(0, tremor - dt * 30);
}

// ---------------------------------------------------------------------
//  Combate
// ---------------------------------------------------------------------
// XP para o nível seguinte: igual nos primeiros níveis e cada vez mais depois do 6
// (antes o herói chegava ao andar 60 no nível 140+ e o fim do jogo ficava fácil demais)
function xpProximo(n) { return Math.floor(20 * Math.pow(n, 1.5) * Math.max(1, n / 6)); }

function ganharXp(q) {
  const base = q;
  q = Math.round(q * S.xpMult);
  J.xp += q;
  texto(J.x, J.y - 26, `+${q} XP`, '#7ec8ff', 13);
  while (J.xp >= xpProximo(J.nivel)) {
    J.xp -= xpProximo(J.nivel);
    J.nivel++;
    J.hpBase += 10; J.atkBase += 2; J.defBase += 1;
    J.escolhasPendentes++;
    vibrar(50);
    if (J.nivel >= 30) desbloquear('nivel30');
    aoSubirNivelCacador();
    S = stats();
    J.hp = S.maxHp;
    texto(J.x, J.y - 40, 'SUBIU DE NÍVEL!', '#ffe14d', 22);
    explosao(J.x, J.y, '#ffe14d', 30, 220, 5);
    colunaDeLuz(J.x, J.y, '#ffe14d', 0.9);
  }
  partilharXp(base); // a jogar a 2, o parceiro ganha o mesmo
}

function atacar(dx, dy) {
  if (J.cdAtaque > 0) return;
  const l = Math.hypot(dx, dy) || 1;
  dx /= l; dy /= l;
  const ang = Math.atan2(dy, dx);
  J.cdAtaque = S.cdAtaque;
  J.angArma = ang;
  tutorialEvento('atacar');
  J.contaGolpes++;
  const classe = classeArma(J.arma);
  const giro = nPerk('remoinho') > 0 && J.contaGolpes % 4 === 0;
  const arco = giro ? Math.PI + 0.1 : ARCO_ARMA[classe];
  // o martelo esmaga à volta (um pouco mais curto); o arco não tem golpe corpo a corpo
  const alcance = classe === 'martelo' && !giro ? S.alcance * 0.9 : S.alcance;
  J.golpe = classe === 'arco' && !giro ? null : { ang, t: giro ? 0.25 : 0.15, dur: giro ? 0.25 : 0.15, alcance: alcance + J.r, giro, estilo: classe };
  som(giro ? 180 : 260, giro ? 0.15 : 0.07, 'square', 0.025, -150);
  if (giro) tempestadeDeLaminas();
  if (nPerk('laminas') > 0) {
    projeteis.push({ x: J.x + dx * 14, y: J.y + dy * 14, vx: dx * 430, vy: dy * 430, r: 7, vida: 0.55,
      cor: '#d9a6ff', tipo: 'lamina', dono: 'jogador', dano: Math.max(1, Math.round(S.dano * 0.5)) });
  }
  tocarRachada(J.x + dx * alcance * 0.5, J.y + dy * alcance * 0.5, alcance * 0.6);
  if (classe === 'arco' && !giro) { dispararFlecha(dx, dy); return; }
  if (classe === 'cajado') dispararBolaCajado(dx, dy);
  const empurrao = classe === 'machado' ? 1.8 : classe === 'martelo' ? 1.3 : 1;
  let acertou = false;
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const ex = e.x - J.x, ey = e.y - J.y;
    const d = Math.hypot(ex, ey);
    if (d - e.r > alcance + J.r) continue;
    let diff = Math.atan2(ey, ex) - ang;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) > arco && d > e.r + J.r + 4) continue;
    const { dano, crit } = rolarDano();
    const l2 = d || 1;
    danoInimigo(e, dano, crit, (classe === 'martelo' ? ex / l2 : dx) * empurrao, (classe === 'martelo' ? ey / l2 : dy) * empurrao, true);
    if (classe === 'martelo') e.lento = Math.max(e.lento || 0, 1.2);
    if (classe === 'foice') curarRoubo(dano * 0.04);
    acertou = true;
  }
  if (classe === 'martelo' && !giro) { ondas.push({ x: J.x, y: J.y, r: alcance + J.r, t: 0.25, dur: 0.25, cor: '#ffe680' }); tremor = Math.max(tremor, 4); }
  if (acertou) tremor = Math.max(tremor, 2);
}

// Roubo de vida: no máximo 6% da vida por segundo (antes, com muitas sombras, fogo e golpes
// em grupos de monstros, a cura era tanta que o herói ficava imortal)
function curarRoubo(v) {
  const seg = Math.floor(tempoJogo);
  if (J.rouboSeg !== seg) { J.rouboSeg = seg; J.rouboCurado = 0; }
  const h = Math.min(v, S.maxHp * 0.06 - J.rouboCurado);
  if (h <= 0) return;
  J.rouboCurado += h;
  J.hp = Math.min(S.maxHp, J.hp + h);
}

function danoInimigo(e, dano, crit, dx, dy, efeitos = false) {
  if (e.morto || e.enterrado > 0) return;
  if (e.medo > 0) dano = Math.round(dano * 1.3);
  if (e.parado > 0) dano = Math.round(dano * 1.5); // com o tempo parado leva mais dano
  if (e.elite === 'blindado') dano = Math.max(1, Math.ceil(dano * 0.5));
  e.hp -= dano;
  e.flash = 0.1;
  e.acordado = true;
  if (!e.boss) { e.kbx = dx * 300 * (crit ? 1.6 : 1); e.kby = dy * 300 * (crit ? 1.6 : 1); }
  texto(e.x, e.y - e.r - 4, crit ? `${dano}!` : `${dano}`, crit ? '#ffe14d' : '#ffffff', crit ? 26 : 16);
  explosao(e.x, e.y, e.cor, 5, 120, 3);
  if (efeitos) faiscasGolpe(e, crit, dx, dy);
  if (S.roubo > 0) curarRoubo(dano * S.roubo);
  if (efeitos) sentirGolpe(e, dano, crit, dx, dy); // som da arma, faíscas e micro-pausa
  else som(crit ? 620 : 340, 0.06, 'square', 0.03, -100);
  const af = efeitos && J.arma.afixo ? J.arma.afixo.id : null;
  if (af === 'fogo') { e.queima = 3; e.queimaDps = Math.max(1, dano * 0.35); }
  if (af === 'gelo') e.lento = 2;
  if (efeitos && S.queimar && !(af === 'fogo')) { e.queima = 2.5; e.queimaDps = Math.max(1, dano * 0.25); }
  if (crit && e.boss && dano > e.maxHp * 0.04) efeitoGolpeForte();
  if (efeitos) golpeReliquias(e);
  if (efeitos && J.arma.paralisa && Math.random() < J.arma.paralisa && !e.morto) { e.medo = Math.max(e.medo || 0, e.boss ? 0.3 : 0.9); texto(e.x, e.y - e.r - 16, 'Paralisado!', '#7dff5a', 12); }
  aoSerAtingido(e);
  if (e.hp <= 0 && !e.morto) matarInimigo(e);
  if (af === 'trovao' && Math.random() < 0.25) relampago(e, dano);
}

// Relâmpago salta do inimigo atingido para até 3 inimigos próximos
function relampago(origem, dano, saltos = 3, fator = 0.6) {
  let atual = origem;
  const atingidos = [origem];
  for (let k = 0; k < saltos; k++) {
    let prox = null, md = 170;
    for (const o of inimigos) {
      if (o.morto || atingidos.includes(o)) continue;
      const d = Math.hypot(o.x - atual.x, o.y - atual.y);
      if (d < md) { md = d; prox = o; }
    }
    if (!prox) break;
    raios.push({ x1: atual.x, y1: atual.y, x2: prox.x, y2: prox.y, t: 0.25 });
    atingidos.push(prox);
    danoInimigo(prox, Math.max(1, Math.round(dano * fator)), false, 0, 0);
    atual = prox;
  }
  if (atingidos.length > 1) som(1200, 0.15, 'sawtooth', 0.03, -900);
}

function matarInimigo(e) {
  if (J.remoto) { comHeroi(coop.principal, () => matarInimigo(e)); return; }
  if (e.tipo === 'zumbi' && !e.reviveu) { // os zumbis levantam-se uma vez
    e.reviveu = true;
    e.hp = Math.round(e.maxHp * 0.4);
    e.caido = 1.6;
    texto(e.x, e.y - 24, 'Levanta-se...', '#7fa65a', 14);
    return;
  }
  e.morto = true;
  J.kills++;
  registar('matar');
  progressoPedidos('matar', e);
  missaoMatou(e);
  if (e.elite) registar('elite');
  if (e.nv === 3) registar('campeao');
  if (e.boss) { registar('boss'); conquistaEquipa('coopBoss'); }
  deixarCadaver(e);
  guardarResto(e);
  explosao(e.x, e.y, e.cor, e.boss ? 80 : 16, e.boss ? 350 : 180, e.boss ? 7 : 4);
  som(e.boss ? 60 : 150, e.boss ? 1 : 0.2, 'sawtooth', 0.05, -40);
  ruido(e.boss ? 1 : 0.12, e.boss ? 0.09 : 0.03, e.boss ? 700 : 2500);
  ganharXp(e.xp);
  if (e.boss) {
    boss = null;
    vibrar([80, 50, 80, 50, 200]);
    J.bossesMortos = (J.bossesMortos || 0) + 1;
    if (e.tipo === 'reiSlime') desbloquear('rei');
    if (e.tipo === 'dragao' && J.dificuldade === 'pesadelo') desbloquear('pesadelo');
    if (e.tipo === 'demonio') desbloquear('demonio');
    if (e.tipo === 'guardiao') desbloquear('guardiao');
    if (e.tipo === 'senhorVazio') desbloquear('vazio');
    if (!J.levouDanoBoss) desbloquear('intocavel');
    if (mapa.portal) { bossPortalMorto(e); return; } // boss de um portal
    const outro = inimigos.find(x => x.boss && !x.morto && x !== e); // boss duplo: ainda falta o outro
    if (outro) { boss = outro; texto(e.x, e.y - 40, 'Falta um!', '#ff8080', 20); return; }
    vitoriaTorre();
    efeitoBossMorto();
    if (!meta.trofeus) meta.trofeus = {};
    if (BOSSES.some(b => b.id === e.tipo)) { meta.trofeus[e.tipo] = true; salvarMeta(); }
    if (J.pet) petGanharXp(10);
    mapa.escada.ativa = true;
    tremor = 20;
    const ex = mapa.escada.x, ey = mapa.escada.y;
    baus.push({ x: ex - 70, y: ey, tipo: 'ouro', semMimico: true, t: 0 });
    baus.push({ x: ex + 70, y: ey, tipo: 'madeira', semMimico: true, t: 0 });
    premioBossDuplo(ex, ey);
    J.pocoes += 1;
    soltarOuro(e.x, e.y, Math.round(40 * (1 + (andar - 1) * 0.25)), 8);
    const livro = sortearLivro();
    if (livro) drops.push({ tipo: 'livro', feitico: livro, x: ex, y: ey + 64, t: 0 });
    soltarReliquia(ex, ey - 64);
    mostrarBanner('BOSS DERROTADO!', 'Abre os baús: podes subir à cidade ou descer a escada', '#ffae00');
    if (J.modo !== 'bossrush') abrirEscadaCidade(ex + 200, ey); // escada para cima, para a Cidade dos Caçadores
    if (e.final) vitoriaFinal();
    bossRushVencido();
    if (mapa.provacao) concluirProvacao(); // o banner da mudança de classe fica por cima
    fanfarra([392, 523, 659, 784, 1046, 1318], 0.05);
    projeteis = []; perigos = [];
    // os lacaios morrem com o mestre
    for (const o of inimigos) if (!o.morto && o !== e) { o.morto = true; explosao(o.x, o.y, o.cor, 10); }
    return;
  }
  aoMorrerInimigo(e);
  conquistasAoMatar(e);
  if (nPerk('explosao') > 0) {
    explosao(e.x, e.y, '#ff7b25', 18, 200, 6);
    for (const o of inimigos) {
      if (o.morto || o === e || Math.hypot(o.x - e.x, o.y - e.y) > 80 + o.r) continue;
      danoInimigo(o, Math.max(1, Math.round(e.maxHp * 0.4)), false, 0, 0);
    }
  }
  if (Math.random() < 0.12) drops.push({ tipo: 'pocao', x: e.x, y: e.y, t: 0 });
  soltarOuro(e.x, e.y, Math.max(1, Math.round(rand(1, 3) * (1 + (andar - 1) * 0.25) * (e.elite ? 5 : 1) * (e.ouroExtra || 1) * (temCombo('chuvaOuro') ? 1.5 : 1))), e.elite ? 4 : 1);
  if (e.elite) {
    if (e.elite === 'explosivo') perigos.push({ x: e.x, y: e.y, r: 75, t: 0.7, dur: 0.7, dano: Math.round(e.dano * 1.3), cor: '#ff7b25' });
    if (Math.random() < 0.35) baus.push({ x: e.x, y: e.y, tipo: 'madeira', semMimico: true, t: 0 });
  }
  if (e.tipo === 'mimico') {
    baus.push({ x: e.x, y: e.y, tipo: 'madeira', semMimico: true, t: 0 });
    if (contar('mimicos') >= 5) desbloquear('mimicos');
  }
  if (e.tipo === 'slimeLava') perigos.push({ x: e.x, y: e.y, r: 55, t: 0.6, dur: 0.6, dano: e.dano, cor: '#ff7b25', semQueda: true });
  if (J.pet) petGanharXp(1);
}

function danoJogador(d, fx, fy, fonte = null) {
  if (J.invuln > 0 || J.dashT > 0 || J.caido || J.emMenu || estado !== 'jogo') return;
  J.causa = fonte ? fonte.nome : (J.causaProxima || (boss ? boss.nome : 'uma armadilha'));
  J.causaTipo = fonte ? fonte.tipo : (!J.causaProxima && boss ? boss.tipo : null);
  J.causaProxima = null;
  if (nPerk('escudo') > 0 && J.escudoCd <= 0) {
    J.escudoCd = temCombo('bastiao') ? 5 : 10;
    J.invuln = 0.5;
    texto(J.x, J.y - 24, 'BLOQUEADO!', '#fff0a0', 18);
    explosao(J.x, J.y, '#fff0a0', 16, 180, 4);
    som(900, 0.2, 'triangle', 0.05, -400);
    return;
  }
  if (fonte && S.espinhos > 0 && !fonte.morto) danoInimigo(fonte, Math.max(1, Math.round(d * S.espinhos)), false, 0, 0);
  let final = Math.max(1, Math.round(d * (1 - reducaoDefesa()) * (1 + S.danoRecebido) * reducaoClasse() * (temCombo('muralha') ? 0.85 : 1)));
  J.feridoT = 3;
  if (J.barreira > 0) { // a Barreira Sagrada absorve primeiro
    const abs = Math.min(J.barreira, final);
    J.barreira -= abs; final -= abs;
    texto(J.x, J.y - 34, `(${abs})`, '#fff0a0', 13);
    if (final <= 0) { J.invuln = 0.4; return; }
  }
  if (fonte && fonte.tipo === 'loboGelo') J.lentoT = Math.max(J.lentoT, 1.2);
  J.hp -= final;
  if (boss) J.levouDanoBoss = true;
  if (fonte && fonte.elite === 'vampirico' && !fonte.morto) {
    fonte.hp = Math.min(fonte.maxHp, fonte.hp + final * 3);
    texto(fonte.x, fonte.y - fonte.r - 6, `+${final * 3}`, '#ff4d6d', 14);
  }
  J.invuln = 0.7;
  vibrar(final > S.maxHp * 0.15 ? 90 : 40);
  texto(J.x, J.y - 20, `-${final}`, '#ff4d4d', 18);
  ruido(0.15, 0.05, 1200);
  J.dorT = 0.2;
  tremor = Math.max(tremor, 6);
  som(110, 0.18, 'sawtooth', 0.06, -60);
  if (fx != null) {
    const dx = J.x - fx, dy = J.y - fy, l = Math.hypot(dx, dy) || 1;
    J.kbx = dx / l * 260; J.kby = dy / l * 260;
  }
  if (J.hp <= 0) {
    if (J.vidasExtra > 0) {
      J.vidasExtra--;
      J.hp = Math.round(S.maxHp * 0.3);
      J.invuln = 2.5;
      mostrarBanner('SEGUNDA VIDA!', 'As almas trouxeram-te de volta', '#fff0a0');
      explosao(J.x, J.y, '#fff0a0', 50, 280, 6);
      fanfarra([523, 784, 1046, 1568], 0.05);
    } else if (!caiuCoop()) morrer();
  }
}

function morrer(desistiu = false) {
  J.hp = 0;
  J.desistiu = desistiu;
  if (!desistiu) animarMorteHeroi();
  J.almasGanhas = calcularAlmas();
  meta.almas += J.almasGanhas;
  if (J.modo === 'diario') fimDiario();
  recordeTorre();
  salvarMeta();
  estado = 'morto';
  confirmarDesistir = false;
  tutorial = null;
  registarFimPartida(desistiu);
  if (!desistiu) vibrar([120, 60, 250]);
  explosao(J.x, J.y, '#3a6ad4', 40, 250, 6);
  fanfarra([392, 330, 262, 196], 0.05);
  apagarSave();
  if (andar > recorde) {
    recorde = andar;
    J.novoRecorde = true;
    try { localStorage.setItem('masmorra_recorde', String(recorde)); } catch (e) { /* ignora */ }
  }
}

function beberPocao() {
  if (J.pocoes <= 0 || J.hp >= S.maxHp) return;
  if (J.cdPocao > 0) { texto(J.x, J.y - 30, `Espera ${J.cdPocao.toFixed(1)}s`, '#aaaaaa', 13); return; }
  J.cdPocao = 3;
  J.pocoes--;
  registar('pocao');
  const cura = Math.round(S.maxHp * S.curaPocao);
  J.hp = Math.min(S.maxHp, J.hp + cura);
  J.mana = Math.min(S.maxMana, J.mana + S.maxMana * 0.4);
  texto(J.x, J.y - 24, `+${cura}`, '#5dff7a', 20);
  explosao(J.x, J.y, '#5dff7a', 14, 120, 4);
  J.bebeuT = 0.6;
  som(440, 0.25, 'sine', 0.06, 400);
  if (temCombo('elixir')) { J.furia = Math.max(J.furia || 0, 6); S = stats(); texto(J.x, J.y - 44, 'Elixir Vivo!', '#5dff7a', 15); }
}

function disparar(x, y, ux, uy, vel, dano, cor, r, tipo = 'bola', vida = 3) {
  const p = { x, y, vx: ux * vel, vy: uy * vel, dano, cor, r, tipo, vida };
  projeteis.push(p);
  return p;
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
  // proteções: uma vida estragada (NaN) ou um "num menu" que ficou preso deixavam o herói imortal
  if (!Number.isFinite(J.hp)) { console.warn('vida estragada', J.hp); J.hp = S.maxHp; }
  if (J.emMenu && !parceiroAtivo()) J.emMenu = false;
  atualizarJogador(dt);
  if (estado !== 'jogo') return;
  atualizarCoop(dt); // o herói do parceiro (a jogar a 2)
  atualizarCacador(dt);
  atualizarClasse(dt);
  atualizarPortal(dt);
  atualizarTorre();
  atualizarTemplo(dt);
  atualizarCidadeMundo(dt);
  atualizarEvento(dt);
  atualizarRestos(dt);
  atualizarHeroiVivo(dt);
  atualizarFalas(dt);
  atualizarCampo(mapa, J.x, J.y);
  for (const r of raios) r.t -= dt;
  raios = raios.filter(r => r.t > 0);
  for (const e of inimigos) if (!e.morto) comHeroi(alvoDe(e), () => atualizarInimigo(e, dt)); // cada monstro vai ao herói mais perto
  separarInimigos();
  atualizarProjeteis(dt);
  atualizarPerigos(dt);
  for (const d of drops) {
    d.t += dt;
    animarDrop(d, dt);
    const dd = Math.hypot(d.x - J.x, d.y - J.y);
    if (d.tipo === 'ouro' && dd < 120 && dd > 1) { // íman
      d.x += (J.x - d.x) / dd * 380 * dt;
      d.y += (J.y - d.y) / dd * 380 * dt;
    }
    if (dd < J.r + 12) {
      d.morto = true;
      if (d.tipo === 'ouro') {
        const v = Math.max(1, Math.round(d.valor * S.ouroMult));
        J.ouro += v;
        registar('ouro', v);
        texto(d.x, d.y - 10, `+${v} ouro`, '#ffd23f', 13);
        som(1300, 0.05, 'square', 0.02, 300);
      } else if (d.tipo === 'livro') {
        aprenderFeitico(d.feitico);
      } else if (d.tipo === 'reliquia') {
        ganharReliquia(d.id);
      } else {
        J.pocoes++;
        texto(d.x, d.y - 10, '+1 Poção', '#ff6b8a', 15);
        som(660, 0.12, 'triangle', 0.05, 200);
      }
    }
  }
  drops = drops.filter(d => !d.morto);
  for (const b of baus) b.t += dt;
  atualizarArmadilhas(dt);
  atualizarBioma(dt);
  atualizarPet(dt);
  if (J.ouro >= 1000) desbloquear('rico');
  inimigos = inimigos.filter(e => !e.morto);
  for (const o of objetos) {
    if (o.tipo !== 'cristal' || o.fase !== 'ativo') continue;
    if (inimigos.some(e => e.desafio === o)) continue;
    if (o.onda >= 3) {
      o.fase = 'feito';
      baus.push({ x: o.x, y: o.y + 44, tipo: 'ouro', semMimico: true, t: 0 });
      soltarOuro(o.x, o.y, Math.round(20 * (1 + (andar - 1) * 0.25)), 4);
      const livro = Math.random() < 0.6 ? sortearLivro() : null;
      if (livro) drops.push({ tipo: 'livro', feitico: livro, x: o.x + 50, y: o.y + 44, t: 0 });
      if (Math.random() < 0.5) soltarReliquia(o.x - 50, o.y + 44);
      mostrarBanner('DESAFIO CONCLUÍDO!', 'Ganhaste um Baú Dourado', '#b44dff');
      fanfarra([392, 523, 659, 784, 1046], 0.05);
    } else {
      o.onda++;
      lancarOnda(o);
    }
  }
  atualizarEfeitos(dt);

  // câmara (a jogar a 2 fica no meio dos dois)
  const foco = focoCamara();
  const alvoX = clamp(foco.x - vistaW() / 2, 0, mapa.W * TILE - vistaW());
  const alvoY = clamp(foco.y - vistaH() / 2, 0, mapa.H * TILE - vistaH());
  cam.x += (alvoX - cam.x) * Math.min(1, dt * 8);
  cam.y += (alvoY - cam.y) * Math.min(1, dt * 8);
  revelar(mapa, J.x, J.y, 7);

  // entrar numa sala especial
  const tx = Math.floor(J.x / TILE), ty = Math.floor(J.y / TILE);
  const sala = mapa.salas.find(s => tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h);
  if (sala && sala.tipo && !sala.visitada) {
    sala.visitada = true;
    const info = SALAS_ESPECIAIS[sala.tipo];
    mostrarBanner(info.nome, info.desc, info.cor);
  }

  // interações
  J.bauPerto = null;
  let md = 46;
  for (const b of baus) {
    const d = Math.hypot(b.x - J.x, b.y - J.y);
    if (d < md) { md = d; J.bauPerto = b; }
  }
  J.objPerto = null;
  md = 52;
  for (const o of objetos) {
    const d = Math.hypot(o.x - J.x, o.y - J.y);
    if (d < md) { md = d; J.objPerto = o; }
  }
  J.escadaPerto = Math.hypot(mapa.escada.x - J.x, mapa.escada.y - J.y) < 40;
  if (premiu('e')) {
    if (J.bauPerto) abrirBau(J.bauPerto);
    else if (J.objPerto) usarObjeto(J.objPerto);
    else if (J.escadaPerto && mapa.escada.ativa) proximoAndar();
  }
  usarParceiroPendente(); // o parceiro carregou em USAR
}

const danoArmadilha = () => Math.round(8 * escalaAndar(andar).dano * dif().dano);

function atualizarArmadilhas(dt) {
  for (const a of armadilhas) {
    if (a.tipo === 'espinhos') {
      const t = (tempoJogo + a.fase) % 3.2;
      const antes = a.estado;
      a.estado = t < 2.2 ? 0 : t < 2.7 ? 1 : 2; // 0 escondidos, 1 aviso, 2 levantados
      if (a.estado === 2 && antes !== 2 && Math.hypot(a.x - J.x, a.y - J.y) < 300) som(700, 0.05, 'square', 0.015, -300);
      if (a.estado === 2) for (const H of heroisVivos()) if (a.tx === Math.floor(H.x / TILE) && a.ty === Math.floor(H.y / TILE)) comHeroi(H, () => danoJogador(danoArmadilha(), a.x, a.y));
    } else {
      a.cd -= dt;
      const frente = (a.ty + a.dy) * mapa.W + a.tx + a.dx;
      if (a.cd <= 0 && mapa.explorado[frente] && Math.hypot(J.x - a.x, J.y - a.y) < 420) {
        a.cd = 2.6;
        disparar(a.x + a.dx * TILE * 0.6, a.y + a.dy * TILE * 0.6, a.dx, a.dy, 300, danoArmadilha(), '#d8c9a3', 5, 'flecha', 3);
        som(600, 0.06, 'triangle', 0.02, -300);
      }
    }
  }
}

// ---------------------------------------------------------------------
//  Salas especiais
// ---------------------------------------------------------------------
function usarObjeto(o) {
  if (o.tipo === 'pedestal') { usarPedestal(o); return; }
  if (o.tipo === 'portal') { entrarPortal(o); return; }
  if (o.tipo === 'saidaPortal') { sairPortal(); return; }
  if (o.tipo === 'portaDupla') { entrarTemplo(o); return; }
  if (o.tipo === 'escadaCidade') { entrarCidade(); return; }
  if (o.tipo === 'escadaMasmorra') { sairCidade(); return; }
  if (o.tipo === 'edificio') { abrirEdificio(o.id); return; }
  if (o.tipo === 'teleporte') { abrirTeletransporte(); return; }
  if (o.tipo === 'banca') { abrirBanca(); return; }
  if (o.tipo === 'aldeao') { falarAldeao(o); return; }
  if (o.tipo === 'estatua') return;
  if (o.tipo === 'mercador') { abrirLoja(o); return; }
  if (o.tipo === 'mesa') { abrirMesa(o); return; }
  if (o.tipo === 'gaiola') {
    J.pet = { tipo: o.pet, nivel: 1, xp: 0 };
    conquistaPetLivre(o.pet);
    objetos = objetos.filter(x => x.tipo !== 'gaiola');
    criarPetEntidade();
    pet.x = o.x; pet.y = o.y;
    explosao(o.x, o.y, PETS[o.pet].cor, 30, 200, 5);
    mostrarBanner(`${PETS[o.pet].nome} juntou-se a ti!`, PETS[o.pet].desc, PETS[o.pet].cor);
    fanfarra([523, 659, 784, 1046], 0.05);
    return;
  }
  if (o.tipo === 'altar') {
    if (o.usado) { texto(o.x, o.y - 30, 'O altar já foi usado', '#aaa', 14); return; }
    const custo = Math.round(S.maxHp * 0.35);
    if (J.hp <= custo + 1) { texto(o.x, o.y - 30, 'Precisas de mais vida!', '#ff6060', 16); som(150, 0.2, 'square', 0.04); return; }
    J.hp -= custo;
    o.usado = true;
    texto(J.x, J.y - 24, `-${custo}`, '#ff4d4d', 20);
    let p = { x: o.x, y: o.y + 48 };
    if (colideCirculo(mapa, p.x, p.y, 16)) p = pontoLivreNaSala(mapa, o.sala, 16, 1);
    baus.push({ x: p.x, y: p.y, tipo: 'ouro', semMimico: true, t: 0 });
    explosao(o.x, o.y, '#ff3b3b', 40, 240, 6);
    tremor = 8;
    fanfarra([220, 185, 147, 440], 0.05);
    return;
  }
  if (o.tipo === 'cristal') {
    if (o.fase === 'inativo') {
      o.fase = 'ativo';
      o.onda = 1;
      lancarOnda(o);
    } else if (o.fase === 'feito') texto(o.x, o.y - 40, 'Desafio concluído', '#aaa', 14);
  }
}

function lancarOnda(o) {
  const pesos = pesosInimigos();
  const n = 3 + o.onda * 2;
  for (let k = 0; k < n; k++) {
    let p = pontoLivreNaSala(mapa, o.sala, 18);
    if (Math.hypot(p.x - J.x, p.y - J.y) < 90) p = pontoLivreNaSala(mapa, o.sala, 18);
    const e = criarInimigo(escolherPeso(pesos), p.x, p.y);
    aplicarNivel(e, sortearNivel());
    e.acordado = true;
    e.desafio = o;
    if (o.onda === 3 && k === 0) tornarElite(e);
    inimigos.push(e);
    explosao(p.x, p.y, '#b44dff', 10, 120);
  }
  mostrarBanner(`ONDA ${o.onda}/3`, 'Derrota todos os inimigos', '#b44dff');
  som(200, 0.4, 'sawtooth', 0.05, 200);
}

// ---------------------------------------------------------------------
//  Loja do Mercador
// ---------------------------------------------------------------------
function gerarStock() {
  const r = escolherPeso({ raro: 70, epico: 25, lendario: 4.5 * clamp(andar / 15, 0.2, 1), mitico: 0.5 * clamp((andar - 5) / 30, 0.05, 1) });
  const item = criarItem(escolher(ITENS.filter(i => i.r === r && !i.inicial)), andar);
  const stock = [
    { id: 'pocao', nome: 'Poção de Vida', desc: 'Cura parte da tua vida', preco: 15 + andar * 2, qtd: 99 },
    { id: 'cura', nome: 'Cura Completa', desc: 'Recupera toda a vida', preco: 10 + andar * 3, qtd: 1 },
    { id: 'madeira', nome: 'Baú de Madeira', desc: 'Roda a roleta (nunca é Mímico)', preco: 40 + andar * 6, qtd: 2 },
    { id: 'ouro', nome: 'Baú Dourado', desc: 'Roleta com as melhores chances', preco: 120 + andar * 15, qtd: 1 },
    { id: 'item', nome: item.nome, desc: `${RARIDADES[item.r].nome} · equipa logo`, item, preco: Math.round(PRECO_ITEM_LOJA[item.r] * (1 + andar * 0.1)), qtd: 1 },
    { id: 'perk', nome: 'Pergaminho de Poder', desc: 'Escolhe 1 de 3 melhorias', preco: 100 + andar * 14, qtd: 1 },
  ];
  const rel = Math.random() < 0.45 ? sortearReliquia() : null;
  if (rel) stock.push({ id: 'reliquia', rel, nome: `Relíquia: ${RELIQUIAS[rel].nome}`, desc: RELIQUIAS[rel].desc, preco: 160 + andar * 20, qtd: 1 });
  const livro = sortearLivro();
  if (livro) {
    const nv = J.feiticos[livro] || 0;
    stock.push({ id: 'livro', feitico: livro, nome: `Livro: ${FEITICOS[livro].nome}`, desc: nv ? `Sobe o feitiço para nível ${nv + 1}` : 'Aprende um feitiço novo', preco: 90 + andar * 12, qtd: 1 });
  }
  return stock;
}

function abrirLoja(o) {
  if (!o.stock) o.stock = gerarStock();
  loja = { obj: o, t: 0, sel: 4, msg: null };
  estado = 'loja';
  som(880, 0.1, 'triangle', 0.04, 200);
}

function retLinhaLoja(i) { // com muitos artigos as linhas ficam mais juntas
  const n = loja && loja.obj && loja.obj.stock ? loja.obj.stock.length : 6;
  return n > 7 ? { x: 40, y: 104 + i * 58, w: 500, h: 52 } : { x: 40, y: 108 + i * 66, w: 500, h: 58 };
}

function atualizarLoja(dt) {
  loja.t += dt;
  if (loja.msg) { loja.msg.t -= dt; if (loja.msg.t <= 0) loja.msg = null; }
  if (loja.t < 0.1) return;
  if (premiu('escape', 'e') || clicou(BOTAO_FECHAR)) { loja = null; estado = 'jogo'; rato.baixo = false; return; }
  const stock = loja.obj.stock;
  stock.forEach((_, i) => {
    const r = retLinhaLoja(i);
    if (rato.x > r.x && rato.x < r.x + r.w && rato.y > r.y && rato.y < r.y + r.h) {
      loja.sel = i;
      if (premiu('rato')) comprar(i);
    }
  });
  for (let i = 0; i < stock.length; i++) if (premiu(String(i + 1))) { loja.sel = i; comprar(i); }
  if (premiu('w', 'arrowup')) loja.sel = (loja.sel + stock.length - 1) % stock.length;
  if (premiu('s', 'arrowdown')) loja.sel = (loja.sel + 1) % stock.length;
  if (premiu('enter', ' ')) comprar(loja.sel);
}

function comprar(i) {
  const of = loja.obj.stock[i];
  if (!of || of.qtd <= 0) return;
  if (J.ouro < of.preco) {
    loja.msg = { txt: 'Não tens ouro suficiente', cor: '#ff6060', t: 1.6 };
    som(140, 0.2, 'square', 0.04);
    return;
  }
  if (of.id === 'cura' && J.hp >= S.maxHp) {
    loja.msg = { txt: 'Já tens a vida cheia', cor: '#aaa', t: 1.6 };
    return;
  }
  J.ouro -= of.preco;
  of.qtd--;
  fanfarra([1046, 1318], 0.03);
  if (of.id === 'pocao') { J.pocoes++; loja.msg = { txt: '+1 Poção', cor: '#ff6b8a', t: 1.6 }; }
  else if (of.id === 'cura') { J.hp = S.maxHp; loja.msg = { txt: 'Vida recuperada', cor: '#5dff7a', t: 1.6 }; }
  else if (of.id === 'item') { const m = trocarEquipamento(of.item); loja.msg = { txt: `Equipaste ${of.item.nome}. ${m}`, cor: RARIDADES[of.item.r].cor, t: 2.5 }; }
  else if (of.id === 'madeira' || of.id === 'ouro') { J.bausAbertos++; iniciarRoleta(of.id, 'loja'); }
  else if (of.id === 'perk') { J.escolhasPendentes++; abrirEscolha(); if (escolha) escolha.voltar = 'loja'; }
  else if (of.id === 'reliquia') { ganharReliquia(of.rel); loja.msg = { txt: RELIQUIAS[of.rel].nome, cor: RELIQUIAS[of.rel].cor, t: 2 }; }
  else if (of.id === 'livro') { aprenderFeitico(of.feitico); loja.msg = { txt: `${FEITICOS[of.feitico].nome}: nível ${J.feiticos[of.feitico]}`, cor: FEITICOS[of.feitico].cor, t: 2 }; }
}

// R: os comandos que chegam do telemóvel do parceiro (a jogar a 2); sem R usa o teclado e o toque
function atualizarJogador(dt, R = null) {
  if (J.caido || J.emMenu) { J.andando = false; J.golpe = null; return; } // caído (espera que o parceiro o reanime) ou num menu
  let mx = 0, my = 0;
  let forca = 1;
  if (R) { mx = R.mx; my = R.my; forca = R.forca || 1; }
  else {
    if (teclas['w'] || teclas['arrowup']) my -= 1;
    if (teclas['s'] || teclas['arrowdown']) my += 1;
    if (teclas['a'] || teclas['arrowleft']) mx -= 1;
    if (teclas['d'] || teclas['arrowright']) mx += 1;
    const js = lerJoystick(); // joystick analógico e suavizado
    if (js) { mx = js.x; my = js.y; forca = js.forca; }
  }
  J.andando = !!(mx || my);
  if (mx || my) {
    const l = Math.hypot(mx, my);
    mx /= l; my /= l;
    J.dirX = mx; J.dirY = my;
    if (!J.golpe) J.angArma = Math.atan2(my, mx);
    mx *= forca; my *= forca;
  }
  J.cdAtaque -= dt; J.invuln -= dt; J.cdDash -= dt; J.escudoCd -= dt; J.lentoT -= dt;
  if (mapa && mapa.tiles) desencravar(mapa, J); // nunca ficar preso dentro de uma parede
  const fLento = (J.lentoT > 0 ? 0.5 : 1) * fatorTerreno();

  if ((R ? R.dash : premiu('shift')) && J.cdDash <= 0) {
    const dx = (mx || my) ? mx : J.dirX, dy = (mx || my) ? my : J.dirY;
    J.dashT = 0.16; J.dashVX = dx * 560; J.dashVY = dy * 560; J.cdDash = S.cdDash; J.dashAtingidos = [];
    som(500, 0.12, 'sine', 0.04, -300);
  }

  if (J.dashT > 0) {
    J.dashT -= dt;
    moverEntidade(mapa, J, J.dashVX * dt, J.dashVY * dt);
    ventaniaNaEsquiva();
    particulas.push({ x: J.x, y: J.y, vx: 0, vy: 0, t: 0.25, cor: 'rgba(120,170,255,0.6)', tam: 10 });
  } else {
    moverEntidade(mapa, J, (mx * S.vel * fLento + J.kbx) * dt, (my * S.vel * fLento + J.kby) * dt);
  }
  J.kbx *= Math.max(0, 1 - dt * 10);
  J.kby *= Math.max(0, 1 - dt * 10);

  if (R ? R.atk : toque.atacar || comando.atacar) {
    const a = alvoMelhor(S.alcance + J.r + 80);
    if (a) atacar(a.x - J.x, a.y - J.y); else atacar(J.dirX, J.dirY);
  } else if (R) { /* o parceiro só ataca com o botão */ } else if (rato.baixo) atacar(rato.x + cam.x - J.x, rato.y + cam.y - J.y);
  else if (teclas[' '] || teclas['j']) atacar(J.dirX, J.dirY);
  if (R ? R.pocao : premiu('q')) { beberPocao(); tutorialEvento('pocao'); }
  feiticosJ().forEach((id, i) => { if (premiu(String(i + 1))) lancarFeitico(id); });
  for (const k in J.cdFeitico) J.cdFeitico[k] -= dt;
  if (J.cdPocao > 0) J.cdPocao -= dt;
  if (J.feridoT > 0) J.feridoT -= dt;
  J.mana = Math.min(S.maxMana, J.mana + S.manaRegen * dt);

  // em combate (levaste dano há menos de 3 s) a regeneração é metade
  J.hp = Math.min(S.maxHp, J.hp + S.regen * dt * (S.regen > 0 && J.feridoT > 0 ? 0.5 : 1));
  if (S.regen < 0) J.hp = Math.max(1, J.hp); // a maldição Sangrento não te mata sozinha
  if (J.golpe) { J.golpe.t -= dt; if (J.golpe.t <= 0) J.golpe = null; }
}

function atualizarInimigo(e, dt) {
  if (e.parado > 0) { e.parado -= dt; return; } // o Guardião do Tempo parou o tempo
  e.t += dt; e.cd -= dt; e.flash -= dt;
  atualizarAnimAtaque(e, dt);
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
  if (e.congelado > 0) e.congelado -= dt;
  const fLento = e.congelado > 0 ? 0.1 : e.lento > 0 ? 0.6 : 1;
  if (e.medo > 0) { // paralisado de medo (Sede de Sangue)
    e.medo -= dt;
    if (!e.boss) {
      moverEntidade(mapa, e, e.kbx * dt, e.kby * dt);
      e.kbx *= Math.max(0, 1 - dt * 10); e.kby *= Math.max(0, 1 - dt * 10);
      if (Math.random() < 0.1) particulas.push({ x: e.x + rand(-6, 6), y: e.y - e.r, vx: 0, vy: -30, t: 0.4, cor: '#ff3b3b', tam: 3 });
      return;
    }
  }
  if (e.boss) { atualizarBoss(e, dt, d, ux, uy, e.medo > 0 ? fLento * 0.3 : fLento); return; }
  if (J.furtivo > 0) e.acordado = false; // não te vêem enquanto estás invisível
  if (e.caido > 0) { e.caido -= dt; return; } // zumbi a levantar-se
  if (e.congelado > 0) { // congelado: não ataca nem se mexe (só é empurrado)
    moverEntidade(mapa, e, e.kbx * dt, e.kby * dt);
    e.kbx *= Math.max(0, 1 - dt * 10);
    e.kby *= Math.max(0, 1 - dt * 10);
    return;
  }
  if (!e.acordado && d < 300 && !(J.furtivo > 0)) {
    const dc = distCampo(mapa, e.x, e.y);
    if (e.tipo === 'fantasma' || (dc >= 0 && dc <= 12)) e.acordado = true;
  }

  let vx = 0, vy = 0;
  const ru = e.acordado && e.tipo !== 'fantasma' ? rumo(mapa, e, J.x, J.y) : { x: ux, y: uy };
  if (e.acordado) {
    if (!e.visto) { e.visto = true; veMonstroNovo(e); }
    const especial = movimentoHabilidade(e, dt, d, ux, uy);
    if (especial) { vx = especial.vx; vy = especial.vy; }
    else switch (e.ia || e.tipo) { // os monstros novos usam o comportamento de um antigo (ia)
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
          tiroInimigo(e, ux, uy, { vel: 250, dano: e.dano, cor: e.tipo === 'arqueiroCeleste' ? '#fff6a0' : '#e8e2cf', r: 5, tipo: 'flecha' });
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
      case 'zumbi':
      case 'loboGelo':
        vx = ru.x * e.vel; vy = ru.y * e.vel;
        break;
      case 'slimeLava':
        if (e.t % 1.0 < 0.45) { vx = ru.x * e.vel * 1.9; vy = ru.y * e.vel * 1.9; }
        break;
      case 'diabrete':
      case 'elementalGelo': {
        const vejo = linhaDeVista(mapa, e.x, e.y, J.x, J.y, 4);
        if (!vejo || d > 240) { vx = ru.x * e.vel; vy = ru.y * e.vel; }
        else if (d < 150) { vx = -ux * e.vel; vy = -uy * e.vel; }
        else { const s = Math.sin(e.t * 0.9) > 0 ? 1 : -1; vx = -uy * e.vel * 0.7 * s; vy = ux * e.vel * 0.7 * s; }
        if (e.cd <= 0 && d < 380 && vejo) {
          if (e.tipo === 'diabrete' || e.tipo === 'magoVazio') {
            e.cd = rand(1.8, 2.6);
            tiroInimigo(e, ux, uy, e.tipo === 'magoVazio' ? { vel: 240, dano: e.dano, cor: '#b44dff', r: 8, tipo: 'bola', vida: 2.5 } : { vel: 230, dano: e.dano, cor: '#ff7b25', r: 7, tipo: 'fogo', vida: 2.5 });
            som(250, 0.15, 'sawtooth', 0.03, -100);
          } else {
            e.cd = rand(2.2, 3);
            tiroInimigo(e, ux, uy, { angs: [-0.25, 0, 0.25], vel: 220, dano: Math.round(e.dano * 0.7), cor: '#bfe6ff', r: 6, vida: 2.5, efeito: 'gelo' });
            som(1100, 0.12, 'sine', 0.03, -500);
          }
        }
        break;
      }
      default: // monstros das zonas novas
        ({ vx, vy } = movimentoBioma(e, dt, d, ux, uy, ru));
    }
    if (!especial) [vx, vy] = iaEsperta(e, dt, d, ux, uy, vx, vy); // foge ferido, cerca-te, não fica preso
    if (!e.morto) habilidadesPassivas(e, dt, d, ux, uy);
  }
  if (e.morto) return; // o goblin fugiu
  const fBuff = e.buffT > 0 ? 1.4 : 1;
  const mx = (vx * fLento * fBuff + e.kbx) * dt, my = (vy * fLento * fBuff + e.kby) * dt;
  if (e.tipo === 'fantasma') { e.x += mx; e.y += my; }
  else if (moverEntidade(mapa, e, mx, my) && e.carga > 0) e.carga = 0;
  e.kbx *= Math.max(0, 1 - dt * 10);
  e.kby *= Math.max(0, 1 - dt * 10);

  if (d < e.r + J.r - 2 && !(e.enterrado > 0) && !(e.tipo === 'goblin' && e.roubou)) {
    const hp0 = J.hp;
    danoJogador(e.dano * (e.carga > 0 ? 1.5 : e.inv > 0 ? 1.3 : 1), e.x, e.y, e);
    if (J.hp < hp0) { aoAcertarJogador(e, hp0 - J.hp); e.atacouT = 0.22; }
  }
}

function atualizarBoss(e, dt, d, ux, uy, fLento = 1) {
  const ru = rumo(mapa, e, J.x, J.y);
  const fase2 = e.hp < e.maxHp * (nPacto('furia') ? 0.75 : 0.5);
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
  } else if (e.tipo === 'golem') {
    if (e.pisao > 0) { // prepara o pisão
      e.pisao -= dt;
      if (e.pisao <= 0) {
        tremor = 16;
        som(50, 0.5, 'sawtooth', 0.08, -20);
        explosao(e.x, e.y, '#a89f91', 40, 300, 7);
        if (d < 150 + J.r) danoJogador(e.dano * 1.2, e.x, e.y, e);
        const n = fase2 ? 18 : 12;
        for (let k = 0; k < n; k++) {
          const a = k * Math.PI * 2 / n;
          disparar(e.x, e.y, Math.cos(a), Math.sin(a), 160, Math.round(e.dano * 0.6), '#a89f91', 9, 'rocha', 4);
        }
      }
    } else {
      vx = ru.x * e.vel; vy = ru.y * e.vel;
      if (e.cdA <= 0 && d < 260) {
        e.cdA = fase2 ? 2.6 : 3.6;
        e.pisao = 0.8;
        som(80, 0.8, 'triangle', 0.05, -40);
      } else if (e.cdB <= 0) {
        e.cdB = fase2 ? 1.7 : 2.5;
        const base = Math.atan2(uy, ux);
        for (const s of [-0.3, 0, 0.3]) disparar(e.x + ux * e.r, e.y + uy * e.r, Math.cos(base + s), Math.sin(base + s), 230, Math.round(e.dano * 0.8), '#8a8176', 13, 'rocha', 3);
        som(110, 0.2, 'square', 0.04, -50);
      }
    }
    if (fase2 && e.cdC <= 0) { // rochas a cair do teto
      e.cdC = 2.2;
      for (let k = 0; k < 5; k++) {
        const p = k === 0 ? { x: J.x, y: J.y } : pontoLivreNaSala(mapa, mapa.salas[0], 20, 1);
        perigos.push({ x: p.x, y: p.y, r: 40, t: 1.2, dur: 1.2, dano: e.dano, cor: '#a89f91' });
      }
    }
  } else if (e.tipo === 'rainha') {
    if (e.salto > 0) {
      e.salto -= dt;
      const p = 1 - e.salto / e.duracaoSalto;
      e.z = Math.sin(clamp(p, 0, 1) * Math.PI) * 60;
      vx = e.svx; vy = e.svy;
      if (e.salto <= 0) {
        e.z = 0;
        tremor = 8;
        for (let k = 0; k < 10; k++) {
          const a = k * Math.PI * 2 / 10;
          disparar(e.x, e.y, Math.cos(a), Math.sin(a), 190, Math.round(e.dano * 0.6), '#9dff4d', 7, 'bola', 3);
        }
        if (d < e.r + J.r + 16) danoJogador(e.dano * 1.2, e.x, e.y, e);
      }
    } else {
      if (d > 230) { vx = ru.x * e.vel; vy = ru.y * e.vel; }
      else { const s = Math.sin(e.t * 0.7) > 0 ? 1 : -1; vx = -uy * e.vel * 0.8 * s; vy = ux * e.vel * 0.8 * s; }
      if (e.cdA <= 0) { // teias
        e.cdA = fase2 ? 1.2 : 1.8;
        const n = fase2 ? 5 : 3, base = Math.atan2(uy, ux);
        for (let k = 0; k < n; k++) {
          const a = base + (k - (n - 1) / 2) * 0.28;
          disparar(e.x, e.y, Math.cos(a), Math.sin(a), 260, Math.round(e.dano * 0.5), '#e8e8f0', 8, 'teia', 3).efeito = 'teia';
        }
        som(400, 0.15, 'sine', 0.04, -200);
      }
      if (e.cdB <= 0) {
        e.cdB = fase2 ? 3.5 : 5;
        e.duracaoSalto = 0.55; e.salto = 0.55;
        e.svx = (J.x - e.x) / 0.55; e.svy = (J.y - e.y) / 0.55;
      }
      if (e.cdC <= 0) {
        e.cdC = 8;
        const lacaios = inimigos.filter(o => !o.boss && !o.morto).length;
        if (lacaios < 12) for (let k = 0; k < (fase2 ? 5 : 3); k++) invocar('aranha', e, e.r + 24);
      }
    }
  } else if (e.tipo === 'demonio') {
    if (e.aparecer > 0) { // acabou de se teletransportar: pausa curta antes de investir
      e.aparecer -= dt;
      if (e.aparecer <= 0) {
        const l = Math.hypot(J.x - e.x, J.y - e.y) || 1;
        e.investida = 0.45; e.ivx = (J.x - e.x) / l * 460; e.ivy = (J.y - e.y) / l * 460;
        som(150, 0.3, 'sawtooth', 0.05, 200);
      }
    } else if (e.investida > 0) {
      e.investida -= dt;
      vx = e.ivx; vy = e.ivy;
      particulas.push({ x: e.x, y: e.y, vx: 0, vy: 0, t: 0.3, cor: 'rgba(255,50,50,0.5)', tam: 16 });
    } else if (e.espiral > 0) {
      e.espiral -= dt;
      vx = ru.x * e.vel * 0.2; vy = ru.y * e.vel * 0.2;
      e.cdTiro -= dt;
      if (e.cdTiro <= 0) {
        e.cdTiro = 0.09;
        e.giro += 0.23;
        const bracos = fase2 ? 4 : 2;
        for (let k = 0; k < bracos; k++) {
          const a = e.giro + k * Math.PI * 2 / bracos;
          disparar(e.x, e.y, Math.cos(a), Math.sin(a), 170, Math.round(e.dano * 0.55), '#ff3b3b', 7, 'bola', 4);
        }
      }
    } else {
      if (d < 140) { vx = -uy * e.vel; vy = ux * e.vel; } else { vx = ru.x * e.vel; vy = ru.y * e.vel; }
      if (e.cdA <= 0) { // pilares de fogo em linha
        e.cdA = fase2 ? 2.6 : 3.6;
        const base = Math.atan2(uy, ux);
        for (let k = 0; k < 8; k++) {
          perigos.push({ x: e.x + Math.cos(base) * (60 + k * 55), y: e.y + Math.sin(base) * (60 + k * 55), r: 34, t: 0.55 + k * 0.1, dur: 0.55 + k * 0.1, dano: e.dano, cor: '#ff3b3b' });
        }
        som(90, 0.6, 'sawtooth', 0.05, 80);
      } else if (e.cdB <= 0) {
        e.cdB = 6;
        e.espiral = fase2 ? 2.6 : 2;
        e.cdTiro = 0;
      } else if (e.cdC <= 0) {
        e.cdC = 7;
        for (let t = 0; t < 20; t++) {
          const a = rand(0, Math.PI * 2);
          const x = J.x + Math.cos(a) * 170, y = J.y + Math.sin(a) * 170;
          if (!colideCirculo(mapa, x, y, e.r)) {
            explosao(e.x, e.y, '#b3122e', 25, 200);
            e.x = x; e.y = y;
            explosao(e.x, e.y, '#b3122e', 25, 200);
            e.aparecer = 0.4;
            som(900, 0.3, 'sine', 0.04, -700);
            break;
          }
        }
      }
    }
    if (fase2 && e.cdE <= 0) {
      e.cdE = 10;
      if (inimigos.filter(o => !o.boss && !o.morto).length < 4) for (let k = 0; k < 2; k++) invocar('fantasma', e, 70);
    }
  }

  if (e.tipo === 'guardiao' || e.tipo === 'senhorVazio') ({ vx, vy } = atualizarBossNovo(e, dt, d, ux, uy, ru, fase2));
  else if (BOSSES_FINAIS.includes(e.tipo)) ({ vx, vy } = atualizarBossFinal(e, dt, d, ux, uy, ru, fase2));

  const bateu = moverEntidade(mapa, e, vx * dt * fLento, vy * dt * fLento);
  if (bateu && e.investida > 0) { e.investida = 0; tremor = 10; som(60, 0.3, 'square', 0.05); }
  if (e.z < 20 && d < e.r + J.r - 4) danoJogador(e.dano * (e.investida > 0 ? 1.5 : 1), e.x, e.y, e);
}

function separarInimigos() {
  for (let i = 0; i < inimigos.length; i++) {
    const a = inimigos[i];
    if (a.morto || a.parado > 0) continue; // com o tempo parado ninguém se mexe
    for (let j = i + 1; j < inimigos.length; j++) {
      const b = inimigos[j];
      if (b.morto || b.parado > 0) continue;
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
  if (e.tipo === 'planta') return;
  if (e.tipo === 'fantasma') { e.x += dx; e.y += dy; } else moverEntidade(mapa, e, dx, dy);
}

function atualizarProjeteis(dt) {
  for (const p of projeteis) {
    if (p.parado > 0) { p.parado -= dt; continue; } // tiro parado no ar (Parar o Tempo)
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vida -= dt;
    if (p.vida <= 0 || solido(mapa, Math.floor(p.x / TILE), Math.floor(p.y / TILE))) {
      p.morto = true;
      if (p.dono === 'jogador') tocarRachada(p.x, p.y, p.explode || 10);
      if (p.explode) explodirFogo(p);
      else explosao(p.x, p.y, p.cor, 3, 60, 3);
      continue;
    }
    if (p.dono === 'jogador') {
      if (p.caindo) continue; // ainda está a cair do céu
      for (const e of inimigos) {
        if (e.morto || e.z > 20 || Math.hypot(p.x - e.x, p.y - e.y) > p.r + e.r) continue;
        if (p.atingidos && p.atingidos.includes(e)) continue;
        const l = Math.hypot(p.vx, p.vy) || 1;
        if (p.explode) explodirFogo(p);
        else danoInimigo(e, p.dano, !!p.crit, p.vx / l, p.vy / l, true);
        if (p.perfura > 0) { p.perfura--; p.atingidos.push(e); break; } // a flecha atravessa um monstro
        p.morto = true;
        break;
      }
      continue;
    }
    for (const H of heroisVivos()) if (!p.morto) comHeroi(H, () => acertarHeroi(p));
  }
  projeteis = projeteis.filter(p => !p.morto);
}

// Um tiro dos monstros acerta no herói J?
function acertarHeroi(p) {
  if (J.dashT <= 0 && Math.hypot(p.x - J.x, p.y - J.y) < p.r + J.r - 2) {
    if (p.efeito === 'teia') {
      if (J.lentoT <= 0) texto(J.x, J.y - 30, 'PRESO NA TEIA!', '#e8e8f0', 15);
      J.lentoT = 2.5;
    }
    if (p.efeito === 'gelo') J.lentoT = Math.max(J.lentoT, 1.5);
    const hp0 = J.hp;
    J.causaProxima = p.origem ? p.origem.nome : null;
    danoJogador(p.dano, p.x - p.vx, p.y - p.vy);
    if (J.hp < hp0 && p.efeito === 'veneno') aplicarVeneno(Math.max(2, p.dano * 0.35), 3);
    if (J.hp < hp0 && p.efeito === 'puxar' && p.origem && !p.origem.morto) { // a ligadura da múmia puxa-te
      const ox = p.origem.x - J.x, oy = p.origem.y - J.y, l = Math.hypot(ox, oy) || 1;
      J.kbx = ox / l * 620; J.kby = oy / l * 620;
      J.lentoT = Math.max(J.lentoT, 1);
      texto(J.x, J.y - 30, 'Puxado!', '#d8c9a3', 14);
    }
    p.morto = true;
  }
}

function atualizarPerigos(dt) {
  for (const p of perigos) {
    p.t -= dt;
    if (p.t <= 0) {
      p.morto = true;
      explosao(p.x, p.y, '#ff7b25', 22, 220, 6);
      tremor = Math.max(tremor, 6);
      som(80, 0.3, 'sawtooth', 0.05, -30);
      for (const H of heroisVivos()) comHeroi(H, () => { if (Math.hypot(p.x - J.x, p.y - J.y) < p.r + J.r * 0.5) danoJogador(p.dano, p.x, p.y); });
    }
  }
  perigos = perigos.filter(p => !p.morto);
}

// ---------------------------------------------------------------------
//  Magia
// ---------------------------------------------------------------------
function alvoProximo(raio) {
  let alvo = null, md = raio;
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const d = Math.hypot(e.x - J.x, e.y - J.y);
    if (d < md) { md = d; alvo = e; }
  }
  return alvo;
}

function mira() {
  const mc = !J.remoto && miraComando(); // stick direito do comando
  if (mc) return mc;
  if (modoToque || J.remoto || comando.ativo) {
    const a = alvoMelhor(420);
    if (a) { const dx = a.x - J.x, dy = a.y - J.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
    return [J.dirX, J.dirY];
  }
  if (performance.now() - rato.movido < 4000) {
    const dx = rato.x + cam.x - J.x, dy = rato.y + cam.y - J.y, l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }
  return [J.dirX, J.dirY];
}

const custoMana = id => Math.round(FEITICOS[id].mana * (1 - 0.1 * ((J.feiticos[id] || 1) - 1)) * (temCombo('fonte') ? 0.7 : 1));

function lancarFeitico(id) {
  const nv = J.feiticos[id] || 0;
  const f = FEITICOS[id];
  if (!feiticosJ().includes(id)) { texto(J.x, J.y - 30, 'O teu caçador não usa esta magia', '#aaaaaa', 13); return; }
  if (!nv) { texto(J.x, J.y - 30, 'Ainda não sabes este feitiço', '#aaaaaa', 13); return; }
  if ((J.cdFeitico[id] || 0) > 0) return;
  const custo = custoMana(id);
  if (J.mana < custo) { texto(J.x, J.y - 30, 'Sem mana!', '#b48cff', 15); som(150, 0.1, 'square', 0.03); return; }
  const poder = S.poder * (1 + 0.35 * (nv - 1));
  registar('feitico');
  if (id === 'fogo') {
    const [ux, uy] = mira();
    projeteis.push({ x: J.x + ux * 16, y: J.y + uy * 16, vx: ux * 420, vy: uy * 420, r: 9, vida: 1.1, cor: '#ff7b25', tipo: 'fogo', dono: 'jogador', dano: Math.round(poder * 1.3), explode: 60 + nv * 10 });
    som(300, 0.25, 'sawtooth', 0.04, -200);
  } else if (id === 'raio') {
    let alvo = null, md = 340;
    for (const e of inimigos) {
      if (e.morto) continue;
      const d = Math.hypot(e.x - J.x, e.y - J.y);
      if (d < md && linhaDeVista(mapa, J.x, J.y, e.x, e.y, 2)) { md = d; alvo = e; }
    }
    if (!alvo) { texto(J.x, J.y - 30, 'Nenhum inimigo à vista', '#aaaaaa', 13); return; }
    const dano = Math.round(poder * 1.1);
    raios.push({ x1: J.x, y1: J.y, x2: alvo.x, y2: alvo.y, t: 0.3 });
    danoInimigo(alvo, dano, false, 0, 0);
    relampago(alvo, dano, 2 + nv, 0.8);
    tremor = Math.max(tremor, 3);
    som(1400, 0.2, 'sawtooth', 0.05, -1000);
  } else if (id === 'gelo') {
    const raio = 150 + nv * 20;
    ondas.push({ x: J.x, y: J.y, r: raio, t: 0.4, dur: 0.4, cor: '#bfe6ff' });
    for (const e of inimigos) {
      if (e.morto) continue;
      const d = Math.hypot(e.x - J.x, e.y - J.y);
      if (d > raio + e.r) continue;
      e.lento = 3 + nv;
      e.congelado = 1 + nv * 0.5;
      danoInimigo(e, Math.round(poder * 0.7), false, (e.x - J.x) / (d || 1), (e.y - J.y) / (d || 1));
    }
    som(900, 0.4, 'sine', 0.05, -600);
  } else if (id === 'cura') {
    const cura = Math.round(S.maxHp * 0.2 + poder * 0.4);
    J.hp = Math.min(S.maxHp, J.hp + cura);
    texto(J.x, J.y - 30, `+${cura}`, '#5dff7a', 22);
    ondas.push({ x: J.x, y: J.y, r: 60, t: 0.5, dur: 0.5, cor: '#5dff7a' });
    fanfarra([659, 784, 1046], 0.03);
  }
  J.mana -= custo;
  J.cdFeitico[id] = f.cd * (temRel('relogio') ? 0.7 : 1);
  explosao(J.x, J.y, f.cor, 10, 120, 3);
}

function explodirFogo(p) {
  explosao(p.x, p.y, '#ff7b25', 30, 260, 6);
  explosao(p.x, p.y, '#ffe14d', 14, 160, 4);
  ondas.push({ x: p.x, y: p.y, r: p.explode, t: 0.3, dur: 0.3, cor: '#ff9b45' });
  tremor = Math.max(tremor, 5);
  som(80, 0.3, 'sawtooth', 0.06, -30);
  for (const e of inimigos) {
    if (e.morto) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d > p.explode + e.r) continue;
    danoInimigo(e, p.dano, false, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1));
    e.queima = 3;
    e.queimaDps = Math.max(1, p.dano * 0.15);
  }
}

// Escolhe um livro: prefere feitiços que ainda não sabes
function sortearLivro() {
  const pesos = {};
  for (const id of feiticosJ()) {
    const nv = J.feiticos[id] || 0;
    if (nv < 3) pesos[id] = nv ? 1 : 3;
  }
  return Object.keys(pesos).length ? escolherPeso(pesos) : null;
}

function aprenderFeitico(id) {
  const f = FEITICOS[id];
  const antes = J.feiticos[id] || 0;
  if (antes >= 3) { J.ouro += 50; texto(J.x, J.y - 30, `Já dominas ${f.nome}: +50 ouro`, '#ffd23f', 14); return; }
  J.feiticos[id] = antes + 1;
  if (feiticosJ().length >= 2 && feiticosJ().every(k => (J.feiticos[k] || 0) >= 3)) desbloquear('arquimago');
  const tecla = feiticosJ().indexOf(id) + 1;
  mostrarBanner(antes ? `${f.nome} nível ${antes + 1}` : `Aprendeste: ${f.nome}`, antes ? 'O feitiço ficou mais forte' : modoToque ? 'Tens um botão novo' : `Carrega ${tecla} para lançar`, f.cor);
  texto(J.x, J.y - 30, antes ? `${f.nome} Nv ${antes + 1}!` : `Novo feitiço!`, f.cor, 18);
  fanfarra([523, 659, 784, 1046, 1318], 0.04);
}

// ---------------------------------------------------------------------
//  Mesa de Encantamentos
// ---------------------------------------------------------------------
const CHANCE_REFORCO = [0.95, 0.85, 0.7, 0.55, 0.4]; // de +0 para +1, de +1 para +2, ...
const SLOTS_EQUIP = ['arma', 'armadura', 'amuleto'];
const custoReforco = it => Math.round((20 + 15 * RARIDADES[it.r].ordem) * ((it.enc || 0) + 1) * (1 + andar * 0.15));
const custoEncanto = it => Math.round((35 + 12 * RARIDADES[it.r].ordem) * (1 + andar * 0.15));
function retSlotMesa(i) { return { x: 40, y: 116 + i * 92, w: 470, h: 80 }; }
const BOTAO_REFORCAR = { x: 40, y: 398, w: 470, h: 58 };
const BOTAO_ENCANTO = { x: 40, y: 464, w: 470, h: 58 };
const BOTAO_PURIFICAR = { x: 40, y: 530, w: 470, h: 50 };
const BOTAO_FECHAR = { x: LARGURA - 132, y: ALTURA - 52, w: 116, h: 38 };
const custoPurificar = it => Math.round((60 + 20 * RARIDADES[it.r].ordem) * (1 + andar * 0.15));
const dentro = (r) => rato.x > r.x && rato.x < r.x + r.w && rato.y > r.y && rato.y < r.y + r.h;

function renomear(it) {
  it.nome = `${it.nomeBase || it.nome}${it.afixo ? ' ' + it.afixo.nome : ''}${it.enc ? ' +' + it.enc : ''}`;
}

function abrirMesa(o) {
  mesa = { obj: o, t: 0, slot: SLOTS_EQUIP.find(k => J[k]) || 'arma', msg: null };
  estado = 'encantar';
  som(500, 0.3, 'sine', 0.04, 400);
}

function melhorarStats(it) {
  if (it.tipo === 'arma') {
    it.dano = Math.max(it.dano + 1, Math.round(it.dano * 1.12));
    if (it.magia) it.magia = +(it.magia * 1.1).toFixed(3);
  } else if (it.tipo === 'armadura') {
    it.def = Math.max(it.def + 1, Math.round(it.def * 1.12));
    it.hp = it.hp > 0 ? Math.max(it.hp + 5, Math.round(it.hp * 1.12)) : (it.hp || 0) + 5;
    if (it.mana) it.mana = Math.round(it.mana * 1.12);
  } else {
    for (const k of ['crit', 'velMov', 'roubo', 'regen', 'danoPct', 'magia']) if (it[k] > 0) it[k] = +(it[k] * 1.15).toFixed(3);
    if (it.mana) it.mana = Math.round(it.mana * 1.15);
    it.crit = +((it.crit || 0) + 0.02).toFixed(3);
  }
}

function reforcar(it) {
  const nv = it.enc || 0;
  if (nv >= 5) { mesa.msg = { txt: 'Este item já está no máximo (+5)', cor: '#aaa', t: 2 }; return; }
  const custo = custoReforco(it);
  if (J.ouro < custo) { mesa.msg = { txt: 'Não tens ouro suficiente', cor: '#ff6060', t: 2 }; som(140, 0.2, 'square', 0.04); return; }
  J.ouro -= custo;
  if (Math.random() < CHANCE_REFORCO[nv]) {
    it.enc = nv + 1;
    if (it.enc >= 5) desbloquear('encantar5');
    melhorarStats(it);
    renomear(it);
    S = stats();
    mesa.msg = { txt: `Sucesso! ${it.nome}`, cor: '#5dff7a', t: 2.5 };
    mesa.brilho = 1;
    fanfarra([523, 659, 784, 1046], 0.04);
  } else {
    mesa.msg = { txt: 'O encantamento falhou... perdeste o ouro.', cor: '#ff6060', t: 2.5 };
    fanfarra([300, 220, 160], 0.04);
  }
}

function novoEncanto(it) {
  const custo = custoEncanto(it);
  if (J.ouro < custo) { mesa.msg = { txt: 'Não tens ouro suficiente', cor: '#ff6060', t: 2 }; som(140, 0.2, 'square', 0.04); return; }
  J.ouro -= custo;
  const antigo = it.afixo;
  retirarAfixo(it);
  const af = escolher(AFIXOS[it.tipo].filter(a => !antigo || a.id !== antigo.id));
  aplicarAfixo(it, af);
  renomear(it);
  S = stats();
  J.hp = Math.min(J.hp, S.maxHp);
  mesa.msg = { txt: `Novo encantamento: ${af.nome} (${af.desc})`, cor: af.cor, t: 2.5 };
  mesa.brilho = 1;
  som(700, 0.3, 'sine', 0.05, 500);
}

function atualizarMesa(dt) {
  mesa.t += dt;
  if (mesa.brilho) mesa.brilho = Math.max(0, mesa.brilho - dt * 2);
  if (mesa.msg) { mesa.msg.t -= dt; if (mesa.msg.t <= 0) mesa.msg = null; }
  if (mesa.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_FECHAR)) { mesa = null; estado = 'jogo'; rato.baixo = false; return; }
  SLOTS_EQUIP.forEach((k, i) => {
    if (!J[k]) return;
    if (premiu(String(i + 1)) || (premiu('rato') && dentro(retSlotMesa(i)))) mesa.slot = k;
  });
  const it = J[mesa.slot];
  if (!it) return;
  if (premiu('e') || (premiu('rato') && dentro(BOTAO_REFORCAR))) reforcar(it);
  else if (premiu('r') || (premiu('rato') && dentro(BOTAO_ENCANTO))) novoEncanto(it);
  else if (it.maldicao && (premiu('p') || clicou(BOTAO_PURIFICAR))) purificar(it);
}

function purificar(it) {
  const custo = custoPurificar(it);
  if (J.ouro < custo) { mesa.msg = { txt: 'Não tens ouro suficiente', cor: '#ff6060', t: 2 }; som(140, 0.2, 'square', 0.04); return; }
  J.ouro -= custo;
  it.maldicao = null;
  S = stats();
  mesa.msg = { txt: 'A maldição foi quebrada!', cor: '#fff0a0', t: 2.5 };
  mesa.brilho = 1;
  fanfarra([659, 784, 1046, 1318], 0.04);
}

// ---------------------------------------------------------------------
//  Companheiro
// ---------------------------------------------------------------------
function criarPetEntidade() {
  pet = J && J.pet ? { x: J.x - 24, y: J.y + 12, r: 9, t: 0, cd: 1, curaCd: 3, dir: 1, andando: false } : null;
}

const xpPetProximo = n => 6 + n * 4;
function petGanharXp(q) {
  const antes = J.pet.nivel;
  J.pet.xp += q;
  while (J.pet.xp >= xpPetProximo(J.pet.nivel)) {
    J.pet.xp -= xpPetProximo(J.pet.nivel);
    J.pet.nivel++;
    if (pet) { texto(pet.x, pet.y - 24, `${nomePet()} Nv ${J.pet.nivel}!`, PETS[J.pet.tipo].cor, 15); explosao(pet.x, pet.y, PETS[J.pet.tipo].cor, 14, 140, 4); }
    if (J.pet.nivel >= 5) desbloquear('amigo');
  }
  verEvolucaoPet(antes);
}

const danoPet = () => Math.round((4 + J.pet.nivel * 3) * (1 + (andar - 1) * 0.12) * (temRel('coleira') ? 2 : 1) * (petEvoluido() ? 1.6 : 1));

function atualizarPet(dt) {
  if (!J.pet || !pet) return;
  pet.t += dt; pet.cd -= dt; pet.curaCd -= dt;
  const alvo = (() => {
    let a = null, md = 240;
    for (const e of inimigos) {
      if (e.morto || e.z > 20) continue;
      const d = Math.hypot(e.x - J.x, e.y - J.y);
      if (d < md) { md = d; a = e; }
    }
    return a;
  })();
  const tipo = J.pet.tipo, dano = danoPet();
  if (atualizarPetNovo(tipo, alvo, dano, dt)) return;
  if (tipo === 'lobo') {
    const tx = alvo ? alvo.x : J.x - J.dirX * 32, ty = alvo ? alvo.y : J.y - J.dirY * 32 + 8;
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy) || 1;
    const perto = alvo ? alvo.r + 12 : 26;
    pet.andando = d > perto;
    if (pet.andando) moverEntidade(mapa, pet, dx / d * 210 * dt, dy / d * 210 * dt);
    if (Math.abs(dx) > 2) pet.dir = dx > 0 ? 1 : -1;
    if (alvo && d < alvo.r + 18 && pet.cd <= 0) {
      pet.cd = 0.75;
      danoInimigo(alvo, Math.round(dano * 1.3), false, dx / d, dy / d);
      som(420, 0.06, 'square', 0.02, -200);
    }
    if (Math.hypot(pet.x - J.x, pet.y - J.y) > 420) { pet.x = J.x - 20; pet.y = J.y + 10; }
  } else {
    const ang = pet.t * 1.6;
    const tx = J.x + Math.cos(ang) * 38, ty = J.y - 28 + Math.sin(ang) * 12;
    pet.dir = tx > pet.x ? 1 : -1;
    pet.x += (tx - pet.x) * Math.min(1, dt * 5);
    pet.y += (ty - pet.y) * Math.min(1, dt * 5);
    if (alvo && pet.cd <= 0) {
      const dx = alvo.x - pet.x, dy = alvo.y - pet.y, d = Math.hypot(dx, dy) || 1;
      if (tipo === 'fada') {
        pet.cd = 1.2;
        projeteis.push({ x: pet.x, y: pet.y, vx: dx / d * 380, vy: dy / d * 380, r: 5, vida: 1, cor: '#ff9ff3', tipo: 'bola', dono: 'jogador', dano: Math.max(1, Math.round(dano * 0.6)) });
        som(1500, 0.05, 'sine', 0.02, 300);
      } else {
        pet.cd = 1.8;
        projeteis.push({ x: pet.x, y: pet.y, vx: dx / d * 340, vy: dy / d * 340, r: 7, vida: 1.2, cor: '#ff7b25', tipo: 'fogo', dono: 'jogador', dano, explode: 42 });
        som(260, 0.12, 'sawtooth', 0.03, -120);
      }
    }
    if (tipo === 'fada' && pet.curaCd <= 0) {
      pet.curaCd = 4;
      if (J.hp < S.maxHp) {
        const cura = Math.round(S.maxHp * 0.03 + J.pet.nivel * 2);
        J.hp = Math.min(S.maxHp, J.hp + cura);
        texto(J.x, J.y - 24, `+${cura}`, '#ff9ff3', 13);
      }
    }
  }
}

// ---------------------------------------------------------------------
//  Mochila
// ---------------------------------------------------------------------
function retMochila(i) { return { x: 40 + (i % 3) * 110, y: 262 + Math.floor(i / 3) * 110, w: 100, h: 100 }; }
const BOTOES_MOCHILA = {
  equipar: { x: 40, y: 500, w: 160, h: 44 },
  vender:  { x: 210, y: 500, w: 160, h: 44 },
  forjar:  { x: 40, y: 556, w: 330, h: 40 },
};

// Forja: 3 itens da mesma raridade na mochila dão 1 item da raridade seguinte
// (do mesmo tipo do item escolhido; os outros dois vão os primeiros que houver)
function proximaRaridade(r) { const i = ORDEM_RARIDADES.indexOf(r); return i >= 0 && i < ORDEM_RARIDADES.length - 1 ? ORDEM_RARIDADES[i + 1] : null; }
function podeForjar(it) {
  return !!(it && proximaRaridade(it.r) && J.mochila.filter(x => x.r === it.r).length >= 3);
}
function forjar(idx) {
  const it = J.mochila[idx];
  if (!podeForjar(it)) return null;
  const nova = proximaRaridade(it.r);
  let pool = ITENS.filter(i => i.r === nova && i.tipo === it.tipo && !i.inicial);
  if (!pool.length) pool = ITENS.filter(i => i.r === nova && !i.inicial);
  if (it.tipo === 'arma' && Math.random() < 0.5) { const m = pool.filter(i => classeArma(i) === classeArma(it)); if (m.length) pool = m; }
  const outros = J.mochila.filter((x, i) => i !== idx && x.r === it.r).slice(0, 2);
  J.mochila = J.mochila.filter(x => x !== it && !outros.includes(x));
  const feito = criarItem(escolher(pool), andar);
  J.mochila.splice(Math.min(idx, J.mochila.length), 0, feito);
  registrarItem(feito);
  contar('forjados');
  return feito;
}

function abrirMochila() {
  tutorialEvento('mochila');
  mochilaUI = { t: 0, sel: 0, msg: null };
  estado = 'mochila';
  som(500, 0.08, 'triangle', 0.03, 100);
}

function atualizarMochila(dt) {
  const M = mochilaUI;
  M.t += dt;
  if (M.msg) { M.msg.t -= dt; if (M.msg.t <= 0) M.msg = null; }
  if (M.t < 0.1) return;
  if (premiu('escape', 'i') || clicou(BOTAO_FECHAR)) { mochilaUI = null; estado = 'jogo'; rato.baixo = false; return; }
  for (let i = 0; i < TAMANHO_MOCHILA; i++) if (premiu(String(i + 1)) || clicou(retMochila(i))) M.sel = i;
  const it = J.mochila[M.sel];
  if (!it) return;
  if (premiu('e') || clicou(BOTOES_MOCHILA.equipar)) {
    const antigo = J[it.tipo];
    J.mochila.splice(M.sel, 1);
    equipar(it);
    if (antigo) J.mochila.splice(M.sel, 0, antigo);
    M.msg = { txt: `Equipaste ${it.nome}`, cor: RARIDADES[it.r].cor, t: 2 };
    som(520, 0.12, 'triangle', 0.04, 200);
  } else if (premiu('x') || clicou(BOTOES_MOCHILA.vender)) {
    const v = valorVenda(it);
    J.mochila.splice(M.sel, 1);
    J.ouro += v;
    M.msg = { txt: `Vendeste ${it.nome} por ${v} ouro`, cor: '#ffd23f', t: 2 };
    som(1300, 0.08, 'square', 0.03, 300);
    if (M.sel >= J.mochila.length) M.sel = Math.max(0, J.mochila.length - 1);
  } else if (premiu('f') || clicou(BOTOES_MOCHILA.forjar)) {
    if (!podeForjar(it)) {
      M.msg = { txt: proximaRaridade(it.r) ? `Precisas de 3 itens (${RARIDADES[it.r].nome}) na mochila` : 'Os itens Míticos já não sobem mais', cor: '#ff8080', t: 2.2 };
      som(200, 0.1, 'square', 0.03);
      return;
    }
    const feito = forjar(M.sel);
    M.sel = J.mochila.indexOf(feito);
    M.msg = { txt: `Forjaste: ${feito.nome}!`, cor: RARIDADES[feito.r].cor, t: 3 };
    fanfarra([523, 659, 784, 1047], 0.04);
    vibrar(60);
  }
}

// ---------------------------------------------------------------------
//  Pausa (com botões) e desistir
// ---------------------------------------------------------------------
let confirmarDesistir = false;
const BOTAO_PAUSA = { x: LARGURA - 56, y: ALTURA - 76, w: 40, h: 36 };
const BOTOES_PAUSA = {
  continuar: { x: 150, y: 150, w: 200, h: 44 },
  guardar:   { x: 380, y: 150, w: 200, h: 44 },
  desistir:  { x: 610, y: 150, w: 200, h: 44 },
};
const BOTOES_CONFIRMAR = {
  sim: { x: 290, y: 360, w: 180, h: 44 },
  nao: { x: 490, y: 360, w: 180, h: 44 },
};
const clicou = r => premiu('rato') && dentro(r);

function botoesTitulo() {
  const l = saveInfo ? [['continuar', 'Continuar'], ['novo', 'Novo jogo']] : [['novo', 'Começar']];
  l.push(['coop', coop.papel === 'anfitriao' ? `Jogar a 2 (sala ${coop.codigo})` : 'Jogar a 2'], ['diario', 'Desafio Diário'], ['bossrush', `Boss Rush${meta.bossRush ? ` (${relogioRush(meta.bossRush)})` : ''}`], ['torre', `Torre dos 100 Andares${meta.torreMax ? ` (${meta.torreMax})` : ''}`]);
  const calor = calorDe(meta.pacto || {});
  const peq = [['almas', `Almas (${meta.almas})`], ['pacto', calor ? `Pacto (Calor ${calor})` : 'Pacto de Castigo'],
    ['colecao', 'Coleção'], ['conquistas', 'Conquistas'], ['registo', 'Missões'], ['transferir', 'Transferir progresso']];
  // os modos abrem-se aos poucos (ver guia.js): fechados aparecem a cinzento
  const fecho = ([id, txt]) => modoLivre(id) ? [id, txt, false] : [id, `${DESBLOQUEIOS[id].nome} · Andar ${DESBLOQUEIOS[id].andar}`, true];
  return l.map(fecho).map(([id, txt, fechado], i) => ({ id, txt, fechado, x: 70, y: 206 + i * 44, w: 330, h: 38 }))
    .concat(peq.map(fecho).map(([id, txt, fechado], i) => ({ id, txt, fechado, peq: true, x: 70 + (i % 2) * 168, y: 214 + l.length * 44 + Math.floor(i / 2) * 40, w: 162, h: 34 })));
}
const BOTOES_MORTE = {
  denovo: { x: 250, y: 566, w: 220, h: 44 },
  menu:   { x: 490, y: 566, w: 220, h: 44 },
};

function atualizarPausa() {
  if (confirmarDesistir) {
    if (premiu('x', 'enter') || clicou(BOTOES_CONFIRMAR.sim)) morrer(true);
    else if (premiu('escape', 'n', 'p') || clicou(BOTOES_CONFIRMAR.nao)) confirmarDesistir = false;
    return;
  }
  if (clicou(BOTAO_IDIOMA)) mudarIdioma();
  else if (modoToque && clicou(BOTAO_OPCOES)) abrirOpcoes();
  else if (premiu('p', 'escape') || clicou(BOTOES_PAUSA.continuar)) { estado = 'jogo'; rato.baixo = false; }
  else if (premiu('g') || clicou(BOTOES_PAUSA.guardar)) { guardarJogo(); estado = 'titulo'; }
  else if (premiu('x') || clicou(BOTOES_PAUSA.desistir)) confirmarDesistir = true;
}

// ---------------------------------------------------------------------
//  Criação de personagem
// ---------------------------------------------------------------------
const ABAS_CRIACAO = ['classe', 'raca'];
const retAbaCriacao = i => ({ x: 30 + i * 150, y: 50, w: 142, h: 26 });
function retRaca(i) { return { x: 30 + (i % 2) * 228, y: 80 + Math.floor(i / 2) * 118, w: 220, h: 110 }; }
// Cartões dos caçadores: com mais de 8 ficam mais baixos para caberem todos
function retClasse(i) {
  const linhas = Math.ceil(ORDEM_CLASSES.length / 2), h = Math.min(110, Math.floor((462 - (linhas - 1) * 8) / linhas));
  return { x: 30 + (i % 2) * 228, y: 80 + Math.floor(i / 2) * (h + 8), w: 220, h };
}
function retSkin(i) { return { x: 506 + (i % 8) * 54, y: 372 + Math.floor(i / 8) * 100, w: 50, h: 92 }; }
const BOTAO_COMECAR = { x: 700, y: 586, w: 240, h: 40 };
function retDificuldade(i) { return { x: 30 + i * 92, y: 562, w: 86, h: 34 }; }
const difLivre = id => !DIFICULDADES[id].conquista || !!meta.conquistas[DIFICULDADES[id].conquista];

function abrirCriacao() {
  criacao = { t: 0, msg: null, aba: 'classe' };
  estado = 'criar';
}

function atualizarCriacao(dt) {
  criacao.t += dt;
  if (criacao.msg) { criacao.msg.t -= dt; if (criacao.msg.t <= 0) criacao.msg = null; }
  if (criacao.t < 0.1) return;
  let ir = ORDEM_RACAS.indexOf(escolhaRaca), is = ORDEM_SKINS.indexOf(escolhaSkin);
  const n = ORDEM_SKINS.length;
  const proxSkin = d => {
    for (let j = 1; j < n; j++) { const k = (is + d * j + n * 2) % n; if (skinLivre(ORDEM_SKINS[k])) return k; }
    return is;
  };
  // separadores: Caçador / Raça
  ABAS_CRIACAO.forEach((a, i) => { if (clicou(retAbaCriacao(i))) criacao.aba = a; });
  if (premiu('tab')) criacao.aba = criacao.aba === 'raca' ? 'classe' : 'raca';
  if (criacao.aba === 'classe') {
    let ic = ORDEM_CLASSES.indexOf(escolhaClasse);
    if (premiu('w', 'arrowup')) ic = (ic + ORDEM_CLASSES.length - 1) % ORDEM_CLASSES.length;
    if (premiu('s', 'arrowdown')) ic = (ic + 1) % ORDEM_CLASSES.length;
    if (premiu('rato')) ORDEM_CLASSES.forEach((_, i) => { if (dentro(retClasse(i))) ic = i; });
    if (ORDEM_CLASSES[ic] !== escolhaClasse) som(700, 0.05, 'square', 0.02);
    escolhaClasse = ORDEM_CLASSES[ic];
  } else {
    if (premiu('w', 'arrowup')) ir = (ir + ORDEM_RACAS.length - 1) % ORDEM_RACAS.length;
    if (premiu('s', 'arrowdown')) ir = (ir + 1) % ORDEM_RACAS.length;
  }
  if (premiu('a', 'arrowleft')) is = proxSkin(-1);
  if (premiu('d', 'arrowright')) is = proxSkin(1);
  ORDEM_DIFICULDADES.forEach((id, i) => {
    if (!(premiu(String(i + 1)) || clicou(retDificuldade(i)))) return;
    if (difLivre(id)) escolhaDificuldade = id;
    else criacao.msg = { txt: DIFICULDADES[id].desc, cor: '#ff8080', t: 2.5 };
  });
  let comecar = premiu('enter', ' ');
  if (premiu('rato')) {
    if (criacao.aba === 'raca') ORDEM_RACAS.forEach((_, i) => { if (dentro(retRaca(i))) ir = i; });
    ORDEM_SKINS.forEach((id, i) => {
      if (!dentro(retSkin(i))) return;
      if (skinLivre(id)) is = i;
      else criacao.msg = { txt: SKINS[id].conquista ? `Desbloqueia com a conquista "${CONQUISTAS.find(c => c.id === SKINS[id].conquista).nome}"` : `Chega ao andar ${SKINS[id].recorde} para desbloquear esta skin`, cor: '#ff8080', t: 2.5 };
    });
    if (dentro(BOTAO_COMECAR)) comecar = true;
    if (!modoProximo && atalhosLivres().length > 1 && dentro(BOTAO_ATALHO)) { // muda o andar onde começas
      const l = atalhosLivres();
      andarInicial = l[(l.indexOf(andarInicial) + 1) % l.length];
      som(700, 0.05, 'square', 0.02);
    }
  }
  if (ir !== ORDEM_RACAS.indexOf(escolhaRaca) || is !== ORDEM_SKINS.indexOf(escolhaSkin)) som(700, 0.05, 'square', 0.02);
  escolhaRaca = ORDEM_RACAS[ir];
  escolhaSkin = ORDEM_SKINS[is];
  if (comecar) { guardarEscolha(); rato.baixo = false; novoJogo(); }
  else if (premiu('escape') || clicou(BOTAO_VOLTAR)) estado = 'titulo';
}

// ---------------------------------------------------------------------
//  Baús e roleta
// ---------------------------------------------------------------------
function abrirBau(b) {
  baus.splice(baus.indexOf(b), 1);
  const tipo = TIPOS_BAU[b.tipo];
  if (!b.semMimico && andar >= 3 && Math.random() < tipo.mimico) { // nos 2 primeiros andares não há mímicos
    const m = criarInimigo('mimico', b.x, b.y);
    m.acordado = true;
    inimigos.push(m);
    texto(b.x, b.y - 30, 'É UM MÍMICO!', '#ff4d4d', 24);
    tremor = 10;
    som(90, 0.5, 'sawtooth', 0.07, 120);
    return;
  }
  J.bausAbertos++;
  colunaDeLuz(b.x, b.y, tipo.aro);
  registar('baus');
  progressoPedidos('baus');
  if (b.tipo === 'ouro' && Math.random() < 0.2) soltarReliquia(b.x, b.y + 30);
  iniciarRoleta(b.tipo, 'jogo');
  presenteParceiro(b.tipo);
}

function iniciarRoleta(tipoBau, voltar) {
  const premio = sortearItem(tipoBau);
  const IDX = 42;
  const faixa = [];
  for (let i = 0; i < 50; i++) faixa.push(i === IDX ? premio : sortearItem(tipoBau));
  roleta = { tipoBau, faixa, premio, idx: IDX, t: 0, dur: 4.5, fim: false, pos: 0, desvio: rand(-0.38, 0.38), ultimoTick: -1, brilho: 0, voltar };
  estado = 'bau';
  som(300, 0.2, 'triangle', 0.05, 300);
}

const valorVenda = it => Math.round(PRECO_VENDA[it.r] * (1 + andar * 0.3));

const BOTOES_ROLETA = {
  equipar: { x: 150, y: 586, w: 200, h: 42 },
  mochila: { x: 380, y: 586, w: 200, h: 42 },
  vender:  { x: 610, y: 586, w: 200, h: 42 },
};

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
      else if (ordem >= 4) { fanfarra([523, 659, 784, 1046, 1318, 1568], 0.05); tremor = 12; vibrar(ordem >= 5 ? [100, 50, 100, 50, 300] : [70, 40, 150]); }
      else fanfarra([440, 554, 659], 0.04);
      registrarItem(R.premio);
    }
  } else {
    if (R.brilho < 0.25) return;
    if (premiu('e') || clicou(BOTOES_ROLETA.equipar)) {
      const m = trocarEquipamento(R.premio);
      if (m) texto(J.x, J.y - 44, m, '#cfc6e0', 13);
      som(520, 0.15, 'triangle', 0.05, 200);
      roleta = null;
      estado = R.voltar;
    } else if ((premiu('m') || clicou(BOTOES_ROLETA.mochila)) && J.mochila.length < TAMANHO_MOCHILA) {
      J.mochila.push(R.premio);
      texto(J.x, J.y - 44, 'Guardado na mochila', '#cfc6e0', 14);
      som(600, 0.1, 'triangle', 0.04, 100);
      roleta = null;
      estado = R.voltar;
    } else if (premiu('x') || clicou(BOTOES_ROLETA.vender)) {
      const xp = RARIDADES[R.premio.r].xpReciclar * andar;
      const ouro = valorVenda(R.premio);
      roleta = null;
      estado = R.voltar;
      J.ouro += ouro;
      texto(J.x, J.y - 44, `+${ouro} ouro`, '#ffd23f', 16);
      som(1300, 0.08, 'square', 0.03, 300);
      ganharXp(xp);
    }
  }
}

// ---------------------------------------------------------------------
//  Loop principal
// ---------------------------------------------------------------------
let ultimo = performance.now();
function loop(agora) {
  // poupança de bateria: desenha no máximo 30 vezes por segundo
  if (opcoes.poupanca && modoToque && agora - ultimo < 30) { requestAnimationFrame(loop); return; }
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  lerComando(dt); // comando (gamepad): vira teclas, movimento e cursor

  if (premiu('m')) mudarSom();
  atualizarMusica();
  atualizarRedeCoop(dt);
  atualizarMenuParceiro(dt); // os menus do parceiro (a jogar a 2)

  if (estado === 'titulo') {
    let acao = null;
    for (const b of botoesTitulo()) if (clicou(b)) acao = b.id;
    if (premiu('enter', ' ')) acao = saveInfo ? 'continuar' : 'novo';
    if (premiu('n')) acao = 'novo';
    if (premiu('a')) acao = 'almas';
    if (premiu('l')) acao = 'colecao';
    if (premiu('t')) acao = 'conquistas';
    if (premiu('k')) acao = 'pacto';
    if (premiu('r')) acao = 'registo';
    if (premiu('d')) acao = 'diario';
    if (premiu('o')) acao = 'torre';
    if (premiu('b')) acao = 'bossrush';
    if (premiu('i') || clicou(BOTAO_IDIOMA)) { mudarIdioma(); acao = null; }
    if (modoToque && clicou(BOTAO_OPCOES)) acao = 'opcoes';
    if (msgTitulo) { msgTitulo.t -= dt; if (msgTitulo.t <= 0) msgTitulo = null; }
    if (acao && !modoLivre(acao)) { tocarModoFechado(acao); acao = null; }
    if (acao === 'opcoes') abrirOpcoes();
    else if (acao === 'continuar') continuarJogo();
    else if (acao === 'novo') { modoProximo = null; abrirCriacao(); }
    else if (acao === 'diario') comecarDiario();
    else if (acao === 'torre') { modoProximo = 'torre'; abrirCriacao(); }
    else if (acao === 'bossrush') { modoProximo = 'bossrush'; abrirCriacao(); }
    else if (acao === 'transferir') abrirTransferir();
    else if (acao === 'coop') abrirCoop();
    else if (acao) abrirMenuMeta(acao);
  } else if (estado === 'almas' || estado === 'colecao' || estado === 'conquistas') {
    atualizarMenuMeta(dt);
  } else if (estado === 'pacto') {
    atualizarPacto(dt);
  } else if (estado === 'registo') {
    atualizarRegisto(dt);
  } else if (estado === 'cidade') {
    atualizarCidade(dt);
  } else if (estado === 'mapa') {
    atualizarMapaGrande();
  } else if (estado === 'fim') {
    atualizarFim(dt);
  } else if (estado === 'transferir') {
    atualizarTransferir(dt);
  } else if (estado === 'coop') {
    atualizarLobby(dt);
  } else if (estado === 'convidado') {
    atualizarConvidado(dt);
  } else if (estado === 'diario') {
    atualizarDiario(dt);
  } else if (estado === 'opcoes') {
    atualizarOpcoes(dt);
  } else if (estado === 'mochila') {
    atualizarMochila(dt);
  } else if (estado === 'criar') {
    atualizarCriacao(dt);
  } else if (estado === 'encantar') {
    atualizarMesa(dt);
    if (!parceiroAtivo()) atualizarEfeitos(dt);
  } else if (estado === 'jogo') {
    if (premiu('p', 'escape') || clicou(BOTAO_PAUSA)) { estado = 'pausa'; rato.baixo = false; }
    else if (premiu('c')) estado = 'personagem';
    else if (premiu('tab')) estado = 'mapa';
    else if (premiu('i')) abrirMochila();
    else { atualizar(dt * ritmoJogo()); atualizarTutorial(dt); atualizarDicas(dt); autoGuardar(dt); }
    if (estado === 'jogo' && J.escolhasPendentes > 0) abrirEscolha();
  } else if (estado === 'nivel') {
    atualizarEscolha(dt);
    if (!parceiroAtivo()) atualizarEfeitos(dt);
  } else if (estado === 'pausa') {
    atualizarPausa();
  } else if (estado === 'personagem') {
    if (premiu('c', 'tab', 'escape', 'rato')) estado = 'jogo';
  } else if (estado === 'loja') {
    atualizarLoja(dt);
    if (!parceiroAtivo()) atualizarEfeitos(dt);
  } else if (estado === 'bau') {
    atualizarRoleta(dt);
    if (!parceiroAtivo()) atualizarEfeitos(dt);
  } else if (estado === 'morto') {
    atualizarEfeitos(dt);
    atualizarRestos(dt); // o herói a cair
    if (premiu('enter') || clicou(BOTOES_MORTE.denovo)) { if (J.modo === 'diario') iniciarDiario(); else { modoProximo = J.modo; novoJogo(); } }
    else if (premiu('escape') || clicou(BOTOES_MORTE.menu)) estado = 'titulo';
  }
  mundoEmMenu(dt); // a jogar a 2, o mundo não para enquanto estás num menu
  if (estado !== 'jogo') toque.atacar = false;
  atualizarEfeitosEcra(dt);
  atualizarAvisos(dt);

  desenhar(agora / 1000);
  desenharCursorComando();
  for (const k in premidas) delete premidas[k];
  requestAnimationFrame(loop);
}
