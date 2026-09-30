'use strict';
// =====================================================================
//  SANTUÁRIO DO VIGIA: o templo da estátua gigante e as suas três regras
//  Uma Porta Antiga rara leva a um templo com uma estátua gigante.
//  As regras: "Ajoelha-te. Não te mexas quando ele olhar. Aguenta."
//  - Os olhos da estátua ficam vermelhos: NÃO TE MEXAS (ou és castigado)
//  - Raios, chuvas de pedra e guardiões de pedra
//  Sobrevive 50 segundos e a estátua desfaz-se: prémios enormes.
// =====================================================================

const DURACAO_TEMPLO = 50;
const REGRAS_TEMPLO = ['Regra 1: Ajoelha-te perante o Vigia.', 'Regra 2: Quando ele olhar, não te mexas.', 'Regra 3: Aguenta até a pedra se partir.'];

// Às vezes (a partir do andar 6) aparece uma Porta Antiga numa sala normal
function criarPortaDupla(salas) {
  if (andar < 6 || Math.random() > 0.07) return;
  const livres = salas.filter(s => !s.tipo && s !== mapa.salaEscada && !s.oculto);
  if (!livres.length) return;
  const p = pontoLivreNaSala(mapa, escolher(livres), 22, 1);
  objetos.push({ tipo: 'portaDupla', x: p.x, y: p.y, t: 0 });
}

function entrarTemplo(o) {
  guardaAndar = { mapa, mapaImg, inimigos, baus, drops, objetos, armadilhas, x: J.x, y: J.y };
  objetos = objetos.filter(x => x !== o);
  guardaAndar.objetos = objetos;
  mapa = gerarArenaBoss();
  mapa.escada = { x: -9999, y: -9999, ativa: false };
  mapa.templo = { t: 0, prox: 4, olhar: 0, olharCd: 9, regra: 0, feito: false, px: 0, py: 0 };
  mapaImg = renderizarMapa(mapa, andar);
  inimigos = []; projeteis = []; baus = []; drops = []; perigos = []; objetos = []; armadilhas = []; ondas = []; raios = [];
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = mapa.posBoss.x; J.y = mapa.posBoss.y + 150; J.invuln = 1.5; // começa à frente da estátua
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  levantarExercito();
  criarPetEntidade();
  mostrarBanner('SANTUÁRIO DO VIGIA', REGRAS_TEMPLO[0], '#e8e2cf');
  tremor = 14;
  som(40, 2, 'sawtooth', 0.06, 30);
}

const danoTemplo = () => Math.round(S.maxHp * 0.28);

function atualizarTemplo(dt) {
  const T = mapa.templo;
  if (!T || T.feito) return;
  T.t += dt;
  // as regras aparecem uma a uma
  const r = Math.min(2, Math.floor(T.t / 4));
  if (r > T.regra) { T.regra = r; mostrarBanner('SANTUÁRIO DO VIGIA', REGRAS_TEMPLO[r], '#e8e2cf'); }
  const fase = Math.min(1, T.t / DURACAO_TEMPLO); // fica mais difícil com o tempo
  // Olhos vermelhos: não te podes mexer
  if (T.olhar > 0) {
    T.olhar -= dt;
    const mexeu = Math.hypot(J.x - T.px, J.y - T.py) > 6;
    if (mexeu && T.olhar < 2.3 && !(J.invuln > 0)) {
      J.causaProxima = 'o Vigia de Pedra';
      danoJogador(danoTemplo(), mapa.posBoss.x, mapa.posBoss.y);
      raios.push({ x1: mapa.posBoss.x, y1: mapa.posBoss.y - 40, x2: J.x, y2: J.y, t: 0.3 });
      T.px = J.x; T.py = J.y;
    }
    if (T.olhar <= 0) { T.olharCd = rand(8, 12) - fase * 3; mostrarBanner('Os olhos apagam-se...', 'Podes mexer-te', '#9fdcff'); }
  } else {
    T.olharCd -= dt;
    if (T.olharCd <= 0) {
      T.olhar = 2.8;
      T.px = J.x; T.py = J.y;
      perigos = [];
      mostrarBanner('NÃO TE MEXAS!', 'A estátua está a olhar para ti', '#ff3b3b');
      som(90, 0.8, 'square', 0.06, 0);
      vibrar([60, 40, 60]);
      return;
    }
    T.prox -= dt;
    if (T.prox <= 0) { T.prox = 3.2 - fase * 1.6; ataqueTemplo(fase); }
  }
  if (T.t >= DURACAO_TEMPLO) temploVencido();
}

function ataqueTemplo(fase) {
  const E = mapa.posBoss, d = danoTemplo();
  const tipo = escolherPeso({ raio: 3, chuva: 3, anel: 2, guardas: fase > 0.2 ? 2 : 0 });
  if (tipo === 'raio') { // raio dos olhos: linha de explosões até ti
    const dx = J.x - E.x, dy = J.y - E.y, l = Math.hypot(dx, dy) || 1;
    for (let k = 1; k <= 12; k++) perigos.push({ x: E.x + dx / l * k * 50, y: E.y + dy / l * k * 50, r: 30, t: 1 + k * 0.05, dur: 1 + k * 0.05, dano: d, cor: '#ff3b3b', semQueda: true });
  } else if (tipo === 'chuva') { // pedras a cair à tua volta
    for (let k = 0; k < 7 + Math.round(fase * 6); k++) perigos.push({ x: J.x + rand(-170, 170), y: J.y + rand(-130, 130), r: 36, t: rand(0.9, 1.4), dur: 1.4, dano: d, cor: '#e8e2cf' });
  } else if (tipo === 'anel') { // onda que sai da estátua: um anel com um buraco
    const buraco = rand(0, Math.PI * 2), raio = Math.hypot(J.x - E.x, J.y - E.y);
    for (let k = 0; k < 22; k++) {
      const a = k / 22 * Math.PI * 2;
      let da = Math.abs(a - buraco); if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < 0.45) continue;
      perigos.push({ x: E.x + Math.cos(a) * raio, y: E.y + Math.sin(a) * raio, r: 34, t: 1.2, dur: 1.2, dano: d, cor: '#ffae00', semQueda: true });
    }
  } else { // guardiões de pedra acordam
    for (let k = 0; k < 2 + Math.round(fase * 3); k++) {
      const p = pontoLivreNaSala(mapa, mapa.salas[0], 18);
      const e = criarInimigo(escolher(['esqueleto', 'orc', 'golemCristal'].filter(x => INIMIGOS[x])), p.x, p.y);
      e.nome = 'Guardião de Pedra';
      e.cor = '#bfb8a8';
      e.acordado = true;
      inimigos.push(e);
      explosao(p.x, p.y, '#bfb8a8', 14, 140);
    }
    mostrarBanner('Os guardiões acordam!', '', '#e8e2cf');
  }
}

function temploVencido() {
  const T = mapa.templo;
  T.feito = true;
  perigos = []; projeteis = [];
  for (const e of inimigos) if (!e.morto) { e.morto = true; explosao(e.x, e.y, '#bfb8a8', 10); }
  const E = mapa.posBoss;
  explosao(E.x, E.y, '#e8e2cf', 90, 420, 8);
  tremor = 24;
  for (let k = 0; k < 3; k++) baus.push({ x: E.x + (k - 1) * 70, y: E.y + 90, tipo: 'ouro', semMimico: true, t: 0 });
  soltarReliquia(E.x, E.y + 160);
  soltarOuro(E.x, E.y + 130, Math.round(60 * (1 + andar * 0.3)), 10);
  meta.almas += 30;
  salvarMeta();
  J.pocoes += 2;
  objetos.push({ tipo: 'saidaPortal', x: E.x, y: E.y + 220, t: 0 });
  mostrarBanner('O VIGIA DESFEZ-SE!', '+30 almas · a estátua desfez-se: abre os baús e sai', '#ffe14d');
  fanfarra([392, 523, 659, 784, 1046, 1318, 1568], 0.06);
  desbloquear('templo');
}

// ---------------------------------------------------------------------
//  Desenho
// ---------------------------------------------------------------------
function desenharEstatuaTemplo(t) {
  const T = mapa.templo;
  if (!T) return;
  const E = mapa.posBoss, x = alinhar(E.x), y = alinhar(E.y);
  if (T.feito) { // escombros
    ctx.fillStyle = '#8a8478';
    for (let k = 0; k < 9; k++) ctx.fillRect(x - 60 + (k * 37) % 120, y + 20 + (k * 13) % 30, 16, 10);
    return;
  }
  const olha = T.olhar > 0, c = SPR.estatuaDeus;
  const tremer = olha ? rand(-1.5, 1.5) : 0, cy = E.y;
  sombra(E.x, E.y + 56, 78);
  spr(c, E.x + tremer, cy);
  if (olha) sprCor(c, E.x + tremer, cy, false, '#ff2020', 0.12 + 0.08 * Math.sin(t * 12));
  // olhos: apagados, a piscar de vez em quando, ou vermelhos quando olha para ti
  const pisca = olha || Math.sin(t * 2) > 0.95;
  const ox = [-8, 8], oy = cy - 44;
  for (const dx of ox) {
    ctx.fillStyle = olha ? '#ff2020' : pisca ? '#ffae00' : '#2a2620';
    ctx.fillRect(alinhar(E.x + tremer + dx - 3), alinhar(oy), 6, 4);
    if (olha || pisca) { ctx.globalAlpha = olha ? 0.35 + 0.2 * Math.sin(t * 20) : 0.25; circulo(E.x + tremer + dx, oy + 2, olha ? 14 : 8, olha ? '#ff2020' : '#ffae00'); ctx.globalAlpha = 1; }
  }
  // pó a cair da estátua
  if (Math.random() < (olha ? 0.6 : 0.12)) particulas.push({ x: E.x + rand(-50, 50), y: cy - rand(20, 70), vx: 0, vy: rand(20, 50), t: 0.8, cor: '#b8b2a4', tam: 3 });
}

// Texto no ecrã: tempo que falta e aviso
function desenharInfoTemplo() {
  const T = mapa.templo;
  if (!T || T.feito) return;
  const falta = Math.ceil(DURACAO_TEMPLO - T.t);
  painel(LARGURA / 2 - 150, 470, 300, 44, 'rgba(24,20,14,0.9)', T.olhar > 0 ? '#ff3b3b' : '#e8e2cf');
  textoCentro(T.olhar > 0 ? 'NÃO TE MEXAS!' : `Sobrevive: ${falta}s`, LARGURA / 2, 492, 20, T.olhar > 0 ? '#ff3b3b' : '#e8e2cf');
}

// Porta Antiga (no andar normal)
function desenharPortaDupla(o, t) {
  const x = alinhar(o.x), y = alinhar(o.y);
  sombra(o.x, o.y + 22, 20);
  ctx.fillStyle = '#4a463e'; ctx.fillRect(x - 22, y - 34, 44, 56);
  ctx.fillStyle = '#6a655a'; ctx.fillRect(x - 18, y - 30, 36, 52);
  ctx.fillStyle = '#1a1814'; ctx.fillRect(x - 12, y - 22, 24, 44);
  ctx.fillStyle = '#e8e2cf'; ctx.fillRect(x - 2, y - 30, 4, 4);
  ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 2); ctx.fillStyle = '#ff2020'; ctx.fillRect(x - 6, y - 10, 3, 3); ctx.fillRect(x + 3, y - 10, 3, 3); ctx.globalAlpha = 1;
}
function desenharInfoPortaDupla(o, sx, sy) {
  textoCentro('Porta Antiga', sx, sy - 36, 16, '#e8e2cf');
  textoCentro('Uma masmorra dentro da masmorra. Sente-se algo a observar...', sx, sy - 18, 12, '#ddd');
  textoCentro(`${modoToque ? 'Usar' : '[E]'}: Entrar (não há volta até ao fim)`, sx, sy, 13, '#ff8080');
}
