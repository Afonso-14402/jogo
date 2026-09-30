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
  { id: 'pausa', x: 926, y: 214, r: 22, tecla: 'p', ancora: [LARGURA, 264] },
  { id: 'personagem', x: 926, y: 264, r: 22, tecla: 'c', ancora: [LARGURA, 264] },
  { id: 'mochila', x: 926, y: 314, r: 22, tecla: 'i', ancora: [LARGURA, 264] },
];

function botoesToque() {
  const k = TAMANHOS_BOTAO[opcoes.tamanho] || 1;
  // as habilidades de caçador só aparecem quando já as tens
  const emJogo = J && estado !== 'titulo';
  // só as magias do teu caçador (as que já sabes)
  const feits = emJogo ? feiticosJ().map((f, i) => ({ id: 'f' + (i + 1), x: 436 + i * 66, y: 598, r: 28, tecla: String(i + 1), feitico: f, ancora: [535, ALTURA] }))
    .filter(b => J.feiticos[b.feitico]) : [];
  // as habilidades só aparecem quando já as tens
  const habs = emJogo ? feits.concat(botoesHabilidadeToque().filter(b => temHabilidade(habsJ()[b.hab]))) : [];
  if (J && estado !== 'titulo' && classeJ().hab) habs.push(botaoClasseToque()); // habilidade única do caçador
  // a jogar a 2, o convidado só tem os botões de lutar
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
    if (estado === 'jogo' || (estado === 'convidado' && convidadoPronto() && coop.menu === 'jogo' && !coop.confirmarSair)) {
      if (estado === 'jogo' && tutorial && noRet(p, BOTAO_SALTAR_TUTORIAL)) { acabarTutorial(); continue; }
      if (estado === 'jogo' && dicaAtual && dicaAtual.t > 0.4 && noRet(p, BOTAO_DICA)) { dicaAtual = null; continue; } // tocar na dica fecha-a
      if (mapa && noRet(p, retMinimapa())) { if (estado === 'jogo') estado = 'mapa'; else premidas['tab'] = true; continue; } // tocar no minimapa abre o mapa grande
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
const opcoes = { tamanho: 1, visibilidade: 1, letra: 1, canhoto: false, vibracao: true, poupanca: false, tutorialFeito: false };
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
// A correr dentro da app Android (Play Store)?
const naAppAndroid = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function comoApp() {
  if (naAppAndroid()) return true;
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
  if (J && J.remoto) { enviarCoop({ t: 'vib', p: padrao }); return; } // vibra o telemóvel do parceiro
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
  // letras maiores quando o interface fica pequeno no ecrã (telemóvel deitado)
  const kEcra = Math.min(w / TELA_W, h / ALTURA);
  const base = !modoToque ? 1 : kEcra < 0.75 ? 1.3 : kEcra < 0.95 ? 1.15 : 1;
  const letra = opcoes.letra == null ? 1 : opcoes.letra;
  escalaLetra = [1, base, Math.max(1.25, base * 1.25)][letra];
  alargarLetra = letra === 2 ? 1.4 : 1.18;
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
    { id: 'letra', nome: 'Tamanho da letra', valor: ['Pequena', 'Normal', 'Grande'][opcoes.letra == null ? 1 : opcoes.letra] },
    { id: 'tamanho', nome: 'Tamanho dos botões', valor: ['Pequeno', 'Normal', 'Grande'][opcoes.tamanho] },
    { id: 'visibilidade', nome: 'Visibilidade dos botões', valor: ['Transparente', 'Normal', 'Forte'][opcoes.visibilidade] },
    { id: 'canhoto', nome: 'Joystick', valor: opcoes.canhoto ? 'À direita (canhoto)' : 'À esquerda' },
    { id: 'vibracao', nome: 'Vibração', valor: !navigator.vibrate ? 'Não suportada' : opcoes.vibracao ? 'Ligada' : 'Desligada' },
    { id: 'poupanca', nome: 'Poupança de bateria', valor: opcoes.poupanca ? 'Ligada (30 FPS)' : 'Desligada (60 FPS)' },
    { id: 'som', nome: 'Som e música', valor: !somLigado ? 'Desligado' : musicaLigada ? 'Tudo ligado' : 'Só efeitos' },
    { id: 'ecra', nome: 'Ecrã inteiro', valor: comoApp() ? 'Já está (app)' : emEcraInteiro() ? 'Ligado' : 'Desligado' },
    { id: 'tutorial', nome: 'Tutorial', valor: 'Ver outra vez' },
  ];
}
const retOpcao = i => ({ x: 170, y: 88 + i * 52, w: 620, h: 44 });

function atualizarOpcoes(dt) {
  menuOpcoes.t += dt;
  if (menuOpcoes.msg) { menuOpcoes.msg.t -= dt; if (menuOpcoes.msg.t <= 0) menuOpcoes.msg = null; }
  if (menuOpcoes.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = opcoesVoltar; menuOpcoes = null; return; }
  linhasOpcoes().forEach((l, i) => {
    if (!(premiu(String(i + 1)) || clicou(retOpcao(i)))) return;
    som(700, 0.05, 'square', 0.02);
    if (l.id === 'letra') { opcoes.letra = ((opcoes.letra == null ? 1 : opcoes.letra) + 1) % 3; ajustarTela(); }
    else if (l.id === 'tamanho') opcoes.tamanho = (opcoes.tamanho + 1) % 3;
    else if (l.id === 'visibilidade') opcoes.visibilidade = (opcoes.visibilidade + 1) % 3;
    else if (l.id === 'canhoto') opcoes.canhoto = !opcoes.canhoto;
    else if (l.id === 'vibracao') { opcoes.vibracao = !opcoes.vibracao; vibrar(80); }
    else if (l.id === 'poupanca') opcoes.poupanca = !opcoes.poupanca;
    else if (l.id === 'som') mudarSom();
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
//  TUTORIAL (primeira partida, no andar 1, no PC e no telemóvel)
//  Cada passo acaba quando fazes o que ele pede (ou carregas em Saltar).
// =====================================================================
let tutorial = null;
// pc/tel: texto para teclado e para toque; alvo: botão a realçar no telemóvel; ev: o que acaba o passo
const PASSOS_TUTORIAL = [
  { ev: 'mover', alvo: 'joy', pc: 'Anda com W A S D ou as setas', tel: 'Arrasta o dedo neste lado do ecrã para andar' },
  { ev: 'atacar', alvo: 'atacar', pc: 'Ataca: clica com o rato (ou Espaço)', tel: 'Toca no botão grande para atacar' },
  { ev: 'bau', alvo: 'usar', pc: 'Vai até ao baú (seta amarela) e carrega E para o abrir', tel: 'Vai até ao baú (seta amarela) e toca em USAR' },
  { ev: 'mochila', alvo: 'mochila', pc: 'Abre a mochila com a tecla I: lá equipas ou vendes itens', tel: 'Toca no saco para abrir a mochila: lá equipas ou vendes itens' },
  { ev: 'status', alvo: 'personagem', pc: 'Carrega U para abrir a Janela de Estado e gastar pontos', tel: 'Toca no herói e depois em Estado para gastar pontos' },
  { ev: 'pocao', alvo: 'pocao', pc: 'Q bebe uma poção (cura). Experimenta agora', tel: 'O botão da poção cura-te. Experimenta agora' },
  { ev: 'poder', alvo: null, pc: '', tel: '' }, // o texto depende do caçador (ver textoPasso)
  { ev: 'fim', alvo: null, tempo: 7, pc: 'Mata monstros e encontra a escada (vê o minimapa). Os portais são opcionais... e perigosos!', tel: 'Mata monstros e encontra a escada (vê o minimapa). Os portais são opcionais... e perigosos!' },
];
const TEMPO_MAX_PASSO = 40; // nunca fica preso para sempre
const BOTAO_SALTAR_TUTORIAL = { x: 652, y: 42, w: 88, h: 26 };

function textoPasso(P) {
  if (P.ev === 'poder') {
    if (feiticosJ().length) return modoToque ? `Toca no botão de ${traduzir(FEITICOS[feiticosJ()[0]].nome)} para lançar magia` : `Carrega 1 para lançar ${traduzir(FEITICOS[feiticosJ()[0]].nome)} (gasta mana)`;
    if (classeJ().hab) return modoToque ? `Toca em ★ para usar ${traduzir(classeJ().habNome)}` : `Carrega F para usar ${traduzir(classeJ().habNome)}`;
    return modoToque ? 'Toca em »» para te esquivares' : 'Shift: esquiva (ficas invencível)';
  }
  return modoToque ? P.tel : P.pc;
}
function alvoPasso(P) {
  if (P.ev !== 'poder') return P.alvo;
  return feiticosJ().length ? 'f1' : classeJ().hab ? 'classe' : 'dash';
}

function iniciarTutorial() {
  tutorial = { passo: 0, t: 0, feito: 0, bau: null };
  // um baú mesmo ao lado do início para aprender a abrir
  const q = typeof pontoPerto === 'function' ? pontoPerto(J.x, J.y, 70, 130, 16) : null;
  const b = { x: q ? q.x : J.x + 90, y: q ? q.y : J.y, tipo: 'madeira', semMimico: true, t: 0 };
  baus.push(b);
  tutorial.bau = b;
}
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
// Chamado pelo jogo quando fazes alguma coisa
function tutorialEvento(ev) {
  if (J && J.remoto) return; // o tutorial é de quem criou a sala
  if (!tutorial) return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  if (P.ev === ev) avancarTutorial();
}
// Toque num botão do ecrã
function tutorialAcao(id) {
  if (!tutorial) return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  if (P.ev === 'poder' && id === alvoPasso(P)) avancarTutorial();
}
function atualizarTutorial(dt) {
  if (!tutorial) return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  tutorial.t += dt;
  if (clicou(BOTAO_SALTAR_TUTORIAL)) { rato.baixo = false; acabarTutorial(); return; }
  if (P.ev === 'mover') {
    const j = toque.joy;
    const aAndar = (j && Math.hypot(j.x - j.cx, j.y - j.cy) > 20) || ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].some(k => teclas[k]);
    if (aAndar) tutorial.feito += dt;
    if (tutorial.feito > 0.6) avancarTutorial();
  } else if (P.ev === 'bau' && tutorial.bau && !baus.includes(tutorial.bau)) avancarTutorial();
  else if (P.ev === 'poder' && ((J.cdClasse || 0) > 0 || Object.values(J.cdFeitico).some(v => v > 0) || J.dashT > 0)) avancarTutorial();
  if (tutorial && tutorial.t > (P.tempo || TEMPO_MAX_PASSO)) avancarTutorial();
}

function desenharTutorial(t) {
  if (!tutorial || estado !== 'jogo') return;
  const P = PASSOS_TUTORIAL[tutorial.passo];
  // entre o painel de vida (esquerda) e o minimapa (direita)
  painel(300, 10, 450, 64, 'rgba(24,18,8,0.96)', '#ffe14d');
  textoCentroAjustado(textoPasso(P), 525, 29, 15, '#fff', 426, false);
  textoEsq(`Tutorial ${tutorial.passo + 1}/${PASSOS_TUTORIAL.length}`, 314, 56, 11, '#aaa', 'normal');
  if (P.tempo) barra(410, 52, 220, 6, 1 - tutorial.t / P.tempo, '#ffe14d', '#3a3020');
  botao(BOTAO_SALTAR_TUTORIAL, 'Saltar', '#ff8080');
  const pulso = Math.sin(t * 6) * 5;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffe14d';
  // seta por cima do baú do tutorial
  if (P.ev === 'bau' && tutorial.bau && baus.includes(tutorial.bau)) {
    const x = ecraX(tutorial.bau.x), y = ecraY(tutorial.bau.y) - 44 + pulso;
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath(); ctx.moveTo(x - 12, y - 14); ctx.lineTo(x + 12, y - 14); ctx.lineTo(x, y + 4); ctx.closePath(); ctx.fill();
  }
  if (!modoToque) return;
  // no telemóvel realça o botão que é preciso tocar
  const alvo = alvoPasso(P);
  if (alvo === 'joy') {
    const c = centroJoystick();
    ctx.beginPath();
    ctx.arc(c.x, c.y, RAIO_JOYSTICK + 12 + pulso, 0, Math.PI * 2);
    ctx.stroke();
    const dx = Math.sin(t * 2.5) * 40;
    circuloEcra(c.x + dx, c.y, 14, 'rgba(255,225,77,0.8)', '#fff', 2);
  } else if (alvo) {
    const b = botoesToque().find(x => x.id === alvo);
    if (!b) return;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 10 + pulso, 0, Math.PI * 2);
    ctx.stroke();
  }
}

requestAnimationFrame(loop);

// ---------------------------------------------------------------------
//  Botão "voltar" do Android (na app da Play Store): no jogo põe em pausa,
//  nos menus fecha-os (como o Esc) e no menu inicial sai da app
// ---------------------------------------------------------------------
try {
  const C = window.Capacitor;
  const App = C && naAppAndroid() ? (C.registerPlugin ? C.registerPlugin('App') : C.Plugins && C.Plugins.App) : null;
  if (App) {
    App.addListener('backButton', () => {
      if (estado === 'jogo') { estado = 'pausa'; rato.baixo = false; return; }
      if (estado === 'titulo') { App.exitApp(); return; }
      premidas['escape'] = true;
    });
    // ao voltar à app, o som recomeça
    App.addListener('appStateChange', s => { if (s.isActive && actx && actx.state === 'suspended') actx.resume().catch(() => {}); });
  }
} catch (e) { /* no browser não há botão voltar */ }
