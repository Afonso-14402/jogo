'use strict';
// =====================================================================
//  CONTROLOS DE TOQUE (telemóvel / tablet)
//  Só ficam ativos em aparelhos com ecrã tátil como controlo principal,
//  ou a partir do momento em que alguém toca no ecrã.
//  No computador com rato e teclado nunca aparecem.
// =====================================================================

let modoToque = false;
try {
  modoToque = matchMedia('(pointer: coarse)').matches && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
} catch (e) { /* sem matchMedia */ }

const toque = {
  joy: null,     // { id, cx, cy, x, y } enquanto o dedo está no joystick
  botoes: {},    // identificador do toque -> botão carregado
  atacar: false, // botão de ataque a ser segurado
};

const RAIO_JOYSTICK = 56;

// Botões do ecrã durante o jogo (coordenadas do canvas 960x640).
// ancora: ponto à volta do qual o botão cresce/encolhe com o tamanho escolhido;
// lado: o botão passa para o outro lado no modo canhoto.
const BOTOES_BASE = [
  { id: 'atacar', x: 862, y: 536, r: 58, segurar: true, ancora: [LARGURA, ALTURA], lado: true },
  { id: 'dash', x: 746, y: 596, r: 34, tecla: 'shift', ancora: [LARGURA, ALTURA], lado: true },
  { id: 'pocao', x: 752, y: 486, r: 32, tecla: 'q', ancora: [LARGURA, ALTURA], lado: true },
  { id: 'usar', x: 872, y: 418, r: 32, tecla: 'e', ancora: [LARGURA, ALTURA], lado: true },
  { id: 'f1', x: 436, y: 598, r: 28, tecla: '1', feitico: 'fogo', ancora: [535, ALTURA] },
  { id: 'f2', x: 502, y: 598, r: 28, tecla: '2', feitico: 'raio', ancora: [535, ALTURA] },
  { id: 'f3', x: 568, y: 598, r: 28, tecla: '3', feitico: 'gelo', ancora: [535, ALTURA] },
  { id: 'f4', x: 634, y: 598, r: 28, tecla: '4', feitico: 'cura', ancora: [535, ALTURA] },
  { id: 'pausa', x: 926, y: 214, r: 22, tecla: 'p', ancora: [LARGURA, 264] },
  { id: 'personagem', x: 926, y: 264, r: 22, tecla: 'c', ancora: [LARGURA, 264] },
  { id: 'mochila', x: 926, y: 314, r: 22, tecla: 'i', ancora: [LARGURA, 264] },
];

function botoesToque() {
  const k = TAMANHOS_BOTAO[opcoes.tamanho] || 1;
  // as habilidades de caçador só aparecem quando já as tens
  const habs = J && estado !== 'titulo' ? botoesHabilidadeToque().filter(b => temHabilidade(HABILIDADES_CACADOR[b.hab])) : [];
  if (J && estado !== 'titulo' && classeJ().hab) habs.push(botaoClasseToque()); // habilidade única do caçador
  return BOTOES_BASE.concat(habs).map(b => {
    const [ax, ay] = b.ancora;
    const n = Object.assign({}, b, { x: ax + (b.x - ax) * k, y: ay + (b.y - ay) * k, r: Math.round(b.r * k) });
    const trocado = opcoes.canhoto && b.lado;
    if (trocado) n.x = LARGURA - n.x;
    // encosta às bordas verdadeiras do ecrã (no telemóvel o ecrã é mais largo que o interface)
    if (ax === LARGURA) n.x += trocado ? -MARGEM_X : MARGEM_X;
    return n;
  });
}

// Onde fica o joystick quando não está a ser usado
const centroJoystick = () => ({ x: opcoes.canhoto ? LARGURA - 150 + MARGEM_X : 150 - MARGEM_X, y: 500 });
const zonaJoystick = p => opcoes.canhoto ? p.x > LARGURA * 0.45 : p.x < LARGURA * 0.55;

function posToque(t) {
  const b = canvas.getBoundingClientRect();
  return { x: (t.clientX - b.left) * TELA_W / b.width - MARGEM_X, y: (t.clientY - b.top) * ALTURA / b.height };
}

const botaoEm = p => botoesToque().find(b => Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 10);

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (!modoToque) { modoToque = true; ajustarTela(); }
  for (const t of e.changedTouches) {
    const p = posToque(t);
    rato.x = p.x; rato.y = p.y;
    if (estado === 'jogo') {
      if (tutorial && noRet(p, BOTAO_SALTAR_TUTORIAL)) { acabarTutorial(); continue; }
      const b = botaoEm(p);
      if (b) {
        tutorialAcao(b.id);
        toque.botoes[t.identifier] = b;
        if (b.segurar) toque.atacar = true;
        else premidas[b.tecla] = true;
        continue;
      }
      if (zonaJoystick(p) && !toque.joy) {
        toque.joy = { id: t.identifier, cx: p.x, cy: p.y, x: p.x, y: p.y };
      }
      continue;
    }
    premidas['rato'] = true; // nos menus um toque é um clique
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const p = posToque(t);
    if (toque.joy && t.identifier === toque.joy.id) {
      let dx = p.x - toque.joy.cx, dy = p.y - toque.joy.cy;
      const d = Math.hypot(dx, dy);
      if (d > RAIO_JOYSTICK) { dx = dx / d * RAIO_JOYSTICK; dy = dy / d * RAIO_JOYSTICK; }
      toque.joy.x = toque.joy.cx + dx;
      toque.joy.y = toque.joy.cy + dy;
    } else if (estado !== 'jogo') {
      rato.x = p.x; rato.y = p.y;
    }
  }
}, { passive: false });

function largarToque(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (e.type === 'touchend') gesto(posToque(t));
    if (toque.joy && t.identifier === toque.joy.id) toque.joy = null;
    const b = toque.botoes[t.identifier];
    if (b) {
      if (b.segurar) toque.atacar = false;
      delete toque.botoes[t.identifier];
    }
  }
}
canvas.addEventListener('touchend', largarToque, { passive: false });
canvas.addEventListener('touchcancel', largarToque, { passive: false });

// =====================================================================
//  OPÇÕES DE TELEMÓVEL (guardadas entre partidas)
// =====================================================================
const CHAVE_OPCOES = 'masmorra_opcoes';
const opcoes = { tamanho: 1, visibilidade: 1, canhoto: false, vibracao: true, poupanca: false, tutorialFeito: false };
try { Object.assign(opcoes, JSON.parse(localStorage.getItem(CHAVE_OPCOES) || '{}')); } catch (e) { /* sem storage */ }
function guardarOpcoes() {
  try { localStorage.setItem(CHAVE_OPCOES, JSON.stringify(opcoes)); } catch (e) { /* sem storage */ }
}
const TAMANHOS_BOTAO = [0.82, 1, 1.18];
const VISIBILIDADES = [0.4, 0.7, 0.95];

const noRet = (p, r) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;

// Botões extra do menu inicial e da pausa (só em ecrãs táteis)
const BOTAO_OPCOES = { x: 16, y: 14, w: 150, h: 36 };
const BOTAO_INSTALAR = { x: 16, y: 58, w: 150, h: 32 };
const BOTAO_ECRA = { x: LARGURA - 176, y: 14, w: 40, h: 36 };

// ---------------------------------------------------------------------
//  Ecrã inteiro
// ---------------------------------------------------------------------
const ehIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const podeEcraInteiro = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const emEcraInteiro = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function comoApp() {
  try { return navigator.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches; } catch (e) { return false; }
}
const mostrarBotaoEcra = () => modoToque && !comoApp();

function alternarEcraInteiro() {
  try {
    if (emEcraInteiro()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    if (!podeEcraInteiro()) {
      avisar('Ecrã inteiro', ehIOS ? 'No iPhone: Partilhar → Adicionar ao ecrã principal' : 'Este browser não deixa usar ecrã inteiro', '#7ec8ff');
      return;
    }
    const el = document.documentElement;
    const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    const rodar = () => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* não suportado */ } };
    if (r && r.then) r.then(rodar).catch(() => {}); else rodar();
  } catch (e) { /* ignora */ }
}

// ---------------------------------------------------------------------
//  Instalar como app
// ---------------------------------------------------------------------
let pedidoInstalar = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; });
addEventListener('appinstalled', () => {
  pedidoInstalar = null;
  avisar('App instalada!', 'Abre o jogo a partir do ecrã principal', '#5dff7a');
});
const mostrarInstalar = () => modoToque && !comoApp() && (!!pedidoInstalar || ehIOS);
function instalarApp() {
  if (pedidoInstalar) {
    const p = pedidoInstalar;
    pedidoInstalar = null;
    p.prompt();
  } else {
    avisar('Instalar no iPhone', 'Toca em Partilhar → Adicionar ao ecrã principal', '#7ec8ff');
  }
}

// ---------------------------------------------------------------------
//  Som: o iPhone e o Android só deixam tocar depois de um toque
// ---------------------------------------------------------------------
let somDesbloqueado = false;
function desbloquearSom() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') actx.resume();
    if (!somDesbloqueado) {
      const s = actx.createBufferSource();
      s.buffer = actx.createBuffer(1, 1, 22050);
      s.connect(actx.destination);
      s.start(0);
      somDesbloqueado = true;
    }
  } catch (e) { /* sem áudio */ }
}
addEventListener('keydown', desbloquearSom);
canvas.addEventListener('mousedown', desbloquearSom);

// Ações que o browser só deixa fazer dentro de um toque ou clique verdadeiro
function gesto(p) {
  desbloquearSom();
  if (!modoToque) return;
  const menu = estado === 'titulo' || (estado === 'pausa' && !confirmarDesistir);
  if ((menu && mostrarBotaoEcra() && noRet(p, BOTAO_ECRA)) ||
      (estado === 'opcoes' && noRet(p, retOpcao(linhasOpcoes().findIndex(l => l.id === 'ecra'))))) alternarEcraInteiro();
  if (estado === 'titulo' && mostrarInstalar() && noRet(p, BOTAO_INSTALAR)) instalarApp();
}
canvas.addEventListener('click', e => gesto(posToque(e)));

// ---------------------------------------------------------------------
//  Vibração (só Android; o iPhone não deixa)
// ---------------------------------------------------------------------
function vibrar(padrao) {
  if (!modoToque || !opcoes.vibracao || !navigator.vibrate) return;
  try { navigator.vibrate(padrao); } catch (e) { /* ignora */ }
}

// ---------------------------------------------------------------------
//  Pausa automática ao sair da app, receber uma chamada, etc.
// ---------------------------------------------------------------------
function pausarSozinho() {
  toque.joy = null;
  toque.botoes = {};
  toque.atacar = false;
  for (const k in teclas) teclas[k] = false;
  rato.baixo = false;
  if (estado === 'jogo' && J && J.hp > 0) estado = 'pausa';
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pausarSozinho();
    try { if (actx) actx.suspend(); } catch (e) { /* ignora */ }
  } else {
    try { if (actx) actx.resume(); } catch (e) { /* ignora */ }
  }
});
addEventListener('blur', pausarSozinho);
addEventListener('pagehide', pausarSozinho);

// ---------------------------------------------------------------------
//  Tamanho do jogo no ecrã (respeita o notch e as bordas curvas)
// ---------------------------------------------------------------------
function ajustarTela() {
  const b = document.body, cs = getComputedStyle(b);
  const w = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (!(w > 0 && h > 0)) return;
  // No telemóvel deitado o jogo estica para ocupar a largura toda do ecrã
  // e o mundo aparece ampliado, para os bonecos não ficarem pequenos.
  const largo = modoToque && w / h > LARGURA / ALTURA;
  TELA_W = largo ? Math.min(1800, Math.round(ALTURA * w / h / 2) * 2) : LARGURA;
  MARGEM_X = (TELA_W - LARGURA) / 2;
  ZOOM = modoToque ? 1.25 : 1;
  if (canvas.width !== TELA_W) canvas.width = TELA_W;
  ajustarBuffers();
  const k = Math.min(w / TELA_W, h / ALTURA);
  canvas.style.width = Math.floor(TELA_W * k) + 'px';
  canvas.style.height = Math.floor(ALTURA * k) + 'px';
}
addEventListener('resize', ajustarTela);
addEventListener('orientationchange', () => setTimeout(ajustarTela, 250));
document.addEventListener('fullscreenchange', ajustarTela);
ajustarTela();

// =====================================================================
//  ECRÃ DE OPÇÕES
// =====================================================================
let opcoesVoltar = 'titulo', menuOpcoes = null;

function abrirOpcoes() {
  opcoesVoltar = estado;
  menuOpcoes = { t: 0, msg: null };
  estado = 'opcoes';
  rato.baixo = false;
}

function linhasOpcoes() {
  return [
    { id: 'tamanho', nome: 'Tamanho dos botões', valor: ['Pequeno', 'Normal', 'Grande'][opcoes.tamanho] },
    { id: 'visibilidade', nome: 'Visibilidade dos botões', valor: ['Transparente', 'Normal', 'Forte'][opcoes.visibilidade] },
    { id: 'canhoto', nome: 'Joystick', valor: opcoes.canhoto ? 'À direita (canhoto)' : 'À esquerda' },
    { id: 'vibracao', nome: 'Vibração', valor: !navigator.vibrate ? 'Não suportada' : opcoes.vibracao ? 'Ligada' : 'Desligada' },
    { id: 'poupanca', nome: 'Poupança de bateria', valor: opcoes.poupanca ? 'Ligada (30 FPS)' : 'Desligada (60 FPS)' },
    { id: 'som', nome: 'Som do jogo', valor: somLigado ? 'Ligado' : 'Desligado' },
    { id: 'ecra', nome: 'Ecrã inteiro', valor: comoApp() ? 'Já está (app)' : emEcraInteiro() ? 'Ligado' : 'Desligado' },
    { id: 'tutorial', nome: 'Tutorial', valor: 'Ver outra vez' },
  ];
}
const retOpcao = i => ({ x: 170, y: 90 + i * 58, w: 620, h: 48 });

function atualizarOpcoes(dt) {
  menuOpcoes.t += dt;
  if (menuOpcoes.msg) { menuOpcoes.msg.t -= dt; if (menuOpcoes.msg.t <= 0) menuOpcoes.msg = null; }
  if (menuOpcoes.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = opcoesVoltar; menuOpcoes = null; return; }
  linhasOpcoes().forEach((l, i) => {
    if (!(premiu(String(i + 1)) || clicou(retOpcao(i)))) return;
    som(700, 0.05, 'square', 0.02);
    if (l.id === 'tamanho') opcoes.tamanho = (opcoes.tamanho + 1) % 3;
    else if (l.id === 'visibilidade') opcoes.visibilidade = (opcoes.visibilidade + 1) % 3;
    else if (l.id === 'canhoto') opcoes.canhoto = !opcoes.canhoto;
    else if (l.id === 'vibracao') { opcoes.vibracao = !opcoes.vibracao; vibrar(80); }
    else if (l.id === 'poupanca') opcoes.poupanca = !opcoes.poupanca;
    else if (l.id === 'som') somLigado = !somLigado;
    else if (l.id === 'tutorial') {
      opcoes.tutorialFeito = false;
      if (opcoesVoltar === 'pausa') {
        iniciarTutorial();
        menuOpcoes.msg = { txt: 'O tutorial começa quando voltares ao jogo', cor: '#5dff7a', t: 2.5 };
      } else menuOpcoes.msg = { txt: 'O tutorial aparece no próximo jogo', cor: '#5dff7a', t: 2.5 };
    }
    guardarOpcoes();
  });
}

function desenharOpcoes(t) {
  ctx.fillStyle = opcoesVoltar === 'pausa' ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  textoCentro('OPÇÕES', LARGURA / 2, 50, 36, '#ffe14d');
  linhasOpcoes().forEach((l, i) => {
    const r = retOpcao(i), sobre = dentro(r);
    painel(r.x, r.y, r.w, r.h, sobre ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', sobre ? '#ffffff' : '#5a4d74');
    textoEsq(l.nome, r.x + 20, r.y + r.h / 2 + 1, 17, '#ddd');
    textoDir(l.valor, r.x + r.w - 20, r.y + r.h / 2 + 1, 16, '#ffe680');
  });
  if (menuOpcoes && menuOpcoes.msg) textoCentro(menuOpcoes.msg.txt, LARGURA / 2, 578, 15, menuOpcoes.msg.cor);
  else textoCentro('Toca numa opção para a mudar', LARGURA / 2, 578, 13, '#888', false);
  // pré-visualização dos controlos com as opções atuais
  desenharPreviaControlos();
}

function desenharPreviaControlos() {
  const k = 144 / TELA_W, w = TELA_W * k, h = ALTURA * k, x0 = 804, y0 = 110;
  textoCentro('Como fica', x0 + w / 2, y0 - 12, 12, '#aaa', false);
  painel(x0 - 3, y0 - 3, w + 6, h + 6, 'rgba(10,8,16,0.95)');
  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(k, k);
  ctx.translate(MARGEM_X, 0);
  ctx.globalAlpha = VISIBILIDADES[opcoes.visibilidade];
  const c = centroJoystick();
  circuloEcra(c.x, c.y, RAIO_JOYSTICK, 'rgba(60,50,90,0.6)', '#cfc6e0', 8);
  for (const b of botoesToque()) circuloEcra(b.x, b.y, b.r, 'rgba(60,50,90,0.6)', b.id === 'atacar' ? '#ffe14d' : '#cfc6e0', 8);
  ctx.restore();
}

// =====================================================================
//  TUTORIAL DE TOQUE (primeira partida no telemóvel)
// =====================================================================
let tutorial = null;
const PASSOS_TUTORIAL = [
  { alvo: 'joy', txt: 'Arrasta o dedo neste lado do ecrã para andar' },
  { alvo: 'atacar', txt: 'Toca no botão grande para atacar o inimigo mais perto' },
  { alvo: 'dash', txt: 'Toca em »» para te esquivares (ficas invencível)' },
  { alvo: 'f1', txt: 'Lança uma Bola de Fogo (gasta mana)' },
  { alvo: 'usar', txt: 'Ao pé de baús, lojas e da escada, toca em USAR', tempo: 4 },
  { alvo: 'pocao', txt: 'A poção cura-te. Boa sorte na masmorra!', tempo: 3.5 },
];
const BOTAO_SALTAR_TUTORIAL = { x: 652, y: 42, w: 88, h: 26 };

function iniciarTutorial() { tutorial = { passo: 0, t: 0, feito: 0 }; }
function acabarTutorial() {
  tutorial = null;
  opcoes.tutorialFeito = true;
  guardarOpcoes();
}
function avancarTutorial() {
  som(880, 0.08, 'triangle', 0.04, 200);
  tutorial.passo++;
  tutorial.t = 0;
  tutorial.feito = 0;
  if (tutorial.passo >= PASSOS_TUTORIAL.length) acabarTutorial();
}
function tutorialAcao(id) {
  if (!tutorial) return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  if (P.alvo === id && !P.tempo) avancarTutorial();
}
function atualizarTutorial(dt) {
  if (!tutorial) return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  tutorial.t += dt;
  if (P.alvo === 'joy') {
    const j = toque.joy;
    if (j && Math.hypot(j.x - j.cx, j.y - j.cy) > 20) tutorial.feito += dt;
    if (tutorial.feito > 0.7) avancarTutorial();
  }
  if (tutorial && tutorial.t > (P.tempo || 8)) avancarTutorial(); // não fica preso num passo
}

function desenharTutorial(t) {
  if (!tutorial) return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  // entre o painel de vida (esquerda) e o minimapa (direita)
  painel(300, 10, 450, 64, 'rgba(24,18,8,0.96)', '#ffe14d');
  textoCentroAjustado(P.txt, 525, 29, 15, '#fff', 426, false);
  textoEsq(`${tutorial.passo + 1}/${PASSOS_TUTORIAL.length}`, 314, 56, 11, '#aaa', 'normal');
  barra(350, 52, 280, 6, 1 - tutorial.t / (P.tempo || 8), '#ffe14d', '#3a3020');
  botao(BOTAO_SALTAR_TUTORIAL, 'Saltar', '#ff8080');
  // realça o que é preciso tocar
  const pulso = Math.sin(t * 6) * 5;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffe14d';
  if (P.alvo === 'joy') {
    const c = centroJoystick();
    ctx.beginPath();
    ctx.arc(c.x, c.y, RAIO_JOYSTICK + 12 + pulso, 0, Math.PI * 2);
    ctx.stroke();
    const dx = Math.sin(t * 2.5) * 40;
    circuloEcra(c.x + dx, c.y, 14, 'rgba(255,225,77,0.8)', '#fff', 2);
  } else {
    const b = botoesToque().find(x => x.id === P.alvo);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 10 + pulso, 0, Math.PI * 2);
    ctx.stroke();
  }
}

requestAnimationFrame(loop);
