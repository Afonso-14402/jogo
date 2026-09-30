'use strict';
// =====================================================================
//  HISTÓRIA E CHEFE FINAL
//  - Falas do [Sistema] e do Monarca do Vazio ao longo da descida
//  - Zonas finais: Cidadela Celeste (41-50) e Trono do Monarca (51-60)
//    (os monstros e bosses delas estão em bossesFinais.js)
//  - Andar 60: o Monarca do Vazio. Vencê-lo mostra o final do jogo.
// =====================================================================

// ---------------------------------------------------------------------
//  Falas (caixa de diálogo em baixo, não pára o jogo)
// ---------------------------------------------------------------------
let falas = [];
const QUEM = {
  sistema: { nome: '[Sistema]', cor: '#4dc3ff' },
  monarca: { nome: 'Monarca do Vazio', cor: '#b44dff' },
  arcanjo: { nome: 'Arcanjo Caído', cor: '#ffe680' },
  anciao: { nome: 'Ancião', cor: '#e8e2cf' },
};
function falar(quem, txt) { falas.push({ quem, txt, t: 0, dur: 3 + txt.length * 0.045 }); }

const HISTORIA = {
  1: [['sistema', 'Bem-vindo, Jogador. Foste escolhido pelo Sistema.'], ['sistema', 'Desce a Masmorra do Destino. No fundo, algo espera por ti.']],
  5: [['monarca', 'Mais um caçador... Vamos ver quanto tempo duras.']],
  10: [['sistema', 'Aviso: a energia do Vazio está a crescer. Os portais abrem cada vez mais.']],
  15: [['monarca', 'Os meus servos dizem que és teimoso. Gosto disso.']],
  20: [['sistema', 'Missão principal: descobre quem controla os portais.']],
  25: [['monarca', 'Cada monstro que matas volta para mim. Estás só a alimentar o Vazio.']],
  30: [['sistema', 'Missão atualizada: o Monarca do Vazio está no andar 60.']],
  35: [['monarca', 'Sinto o teu poder a crescer. Continua... vem até mim.']],
  40: [['monarca', 'Chegaste ao fim do meu reino. Por cima dele, a minha cidadela.']],
  41: [['sistema', 'Entraste na Cidadela Celeste. Os anjos caídos guardam o caminho para o trono.']],
  45: [['arcanjo', 'Humano! O Monarca prometeu-nos o céu. Não passarás!']],
  50: [['arcanjo', 'Eu caí uma vez... não vou cair outra!']],
  51: [['sistema', 'Trono do Monarca. Daqui não há volta.'], ['monarca', 'Sente o chão a tremer? Sou eu a acordar.']],
  55: [['monarca', 'O meu general vai tratar de ti. Não me faças descer.']],
  60: [['monarca', 'Finalmente, frente a frente. Mostra-me o teu verdadeiro poder, Jogador!']],
};

// Chamado ao chegar a cada andar (só no modo normal e no diário)
function historiaDoAndar() {
  if (!J || J.modo === 'torre' || J.modo === 'bossrush') return;
  if (!J.historiaVista) J.historiaVista = {};
  const l = HISTORIA[andar];
  if (!l || J.historiaVista[andar]) return;
  J.historiaVista[andar] = true;
  for (const [q, txt] of l) falar(q, txt);
}

function atualizarFalas(dt) {
  if (!falas.length) return;
  falas[0].t += dt;
  if (falas[0].t > falas[0].dur || (falas[0].t > 0.5 && premiu('enter'))) falas.shift();
}

function desenharFalas() {
  if (!falas.length || (estado !== 'jogo' && estado !== 'convidado')) return;
  const f = falas[0], Q = QUEM[f.quem], a = Math.min(1, f.t * 4, (f.dur - f.t) * 3);
  ctx.globalAlpha = Math.max(0, a);
  const x = LARGURA / 2 - 330, y = 452;
  painel(x, y, 660, 70, 'rgba(8,6,16,0.94)', Q.cor);
  painel(x + 14, y - 14, 220, 24, 'rgba(8,6,16,0.98)', Q.cor);
  textoCentroAjustado(Q.nome, x + 124, y - 2, 13, Q.cor, 210);
  textoCentroAjustado(f.txt, LARGURA / 2, y + 38, 14, '#ffffff', 630, false);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Bosses das zonas finais e o chefe final
// ---------------------------------------------------------------------
function bossHistoria() {
  // os bosses 45, 50 e 55 já são os novos (Arcanjo, General e Carrasco); o 60 é o chefe final
  if (!J || J.modo === 'torre' || J.modo === 'bossrush' || andar !== 60) return null;
  const b = criarBoss('monarca', 1.2);
  b.final = true; b.aura = '#b44dff';
  return b;
}

// ---------------------------------------------------------------------
//  O final
// ---------------------------------------------------------------------
let fimUI = null;
const BOTOES_FIM = { continuar: { x: 250, y: 560, w: 220, h: 44 }, menu: { x: 490, y: 560, w: 220, h: 44 } };

function vitoriaFinal() {
  desbloquear('final');
  meta.finais = (meta.finais || 0) + 1;
  salvarMeta();
  fimUI = { t: 0 };
  estado = 'fim';
  fanfarra([392, 523, 659, 784, 1046, 1318, 1568, 2093], 0.06);
}

function atualizarFim(dt) {
  fimUI.t += dt;
  if (fimUI.t < 3) return;
  if (premiu('enter', 'e') || clicou(BOTOES_FIM.continuar)) { estado = 'jogo'; fimUI = null; falar('sistema', 'Modo infinito: a masmorra continua. Até onde consegues ir?'); }
  else if (premiu('escape') || clicou(BOTOES_FIM.menu)) { guardarJogo(); estado = 'titulo'; fimUI = null; }
}

function desenharFim(t) {
  const a = Math.min(1, fimUI.t / 2);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#05030a'; ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 3 ? '#fff6c8' : '#b44dff'; ctx.fillRect((k * 157 + t * 20 * (k % 5)) % LARGURA, (k * 89 - t * 30 * ((k % 4) + 1) + 2000) % ALTURA, 2, 2); }
  textoCentro('O MONARCA DO VAZIO CAIU', LARGURA / 2, 110, 36, '#ffe14d');
  const linhas = [
    'Os portais começam a fechar-se, um a um.',
    'As pessoas da Cidade dos Caçadores saem à rua para ver o céu limpo.',
    `${traduzir(classeJ().nome)}: o teu nome vai ficar na história.`,
    '',
    '[Sistema] Missão principal concluída.',
    '[Sistema] Recompensa: o título "Vencedor do Vazio".',
  ];
  linhas.forEach((l, i) => { if (fimUI.t > 1 + i * 0.6) textoCentro(l, LARGURA / 2, 190 + i * 34, 17, l.startsWith('[Sistema]') ? '#4dc3ff' : '#ddd', false); });
  if (fimUI.t > 5) {
    textoCentro(`Andar ${andar} · Nível ${J.nivel} · ${J.kills} monstros · ${Math.floor(tempoJogo / 60)} min`, LARGURA / 2, 430, 15, '#aaa', false);
    textoCentro('FIM... ou talvez não.', LARGURA / 2, 480, 22, '#b44dff');
  }
  ctx.globalAlpha = 1;
  if (fimUI.t > 3) {
    botao(BOTOES_FIM.continuar, modoToque ? 'Continuar a descer' : 'ENTER: Continuar', '#5dff7a');
    botao(BOTOES_FIM.menu, modoToque ? 'Menu' : 'Esc: Menu', '#ddd');
  }
}
