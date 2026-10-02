'use strict';
// =====================================================================
//  DUELO (versus a 2)
//  No menu do Jogar a 2, com o parceiro ligado, o anfitrião escolhe
//  "Duelo". Os dois heróis (nível 20, equipamento à altura) lutam numa
//  arena, à melhor de 3 rondas. Não há monstros.
//  Como funciona por dentro: cada herói tem um "alvo" invisível que o segue
//  (um monstro falso). Os ataques do outro acertam-lhe como num monstro
//  e o dano passa para o herói verdadeiro. Assim TODOS os ataques, magias
//  e habilidades funcionam no duelo sem mexer em cada um.
// =====================================================================

const NIVEL_DUELO = 20, RONDAS_GANHAR = 2, FATOR_DANO_DUELO = 0.35, TEMPO_CONTAGEM = 3;
let atacanteProj = null; // quem disparou o projétil que está a acertar agora

function prepararVersus() {
  andar = NIVEL_DUELO;
  prepararParaAndar(NIVEL_DUELO);
  J.escolhasPendentes = 0;
  S = stats(); J.hp = S.maxHp; J.mana = S.maxMana;
  mapa = gerarArenaBoss();
  mapa.eBoss = false;
  mapa.escada = { x: -9999, y: -9999, ativa: false };
  mapa.versus = { pontos: [0, 0], ronda: 1, contagem: TEMPO_CONTAGEM, fim: 0 };
  mapaImg = renderizarMapa(mapa, 35);
  inimigos = []; projeteis = []; baus = []; drops = []; particulas = []; textos = []; perigos = []; objetos = []; armadilhas = []; ondas = []; restos = []; raios = [];
  reiniciarBioma(); reiniciarCampo();
  boss = null;
  J.x = 8 * TILE; J.y = 13 * TILE;
  cam.x = J.x - vistaW() / 2; cam.y = J.y - vistaH() / 2;
  revelar(mapa, J.x, J.y, 40);
  levantarExercito();
  criarPetEntidade();
  mostrarBanner('DUELO!', 'À melhor de 3 rondas · espera pelo parceiro', '#ff8080');
}

const emDuelo = () => !!(mapa && mapa.versus);
const rivalDe = H => inimigos.find(e => e.ehRival && e.rival === H);

function criarRival(H) {
  const e = { tipo: 'rival', ehRival: true, rival: H, nome: '', x: H.x, y: H.y, r: H.r || 12, hp: 1e9, maxHp: 1e9, dano: 0, vel: 0, xp: 0,
    cor: '#ffffff', t: 0, cd: 0, acordado: true, kbx: 0, kby: 0, flash: 0, boss: false, morto: false, z: 0, nv: 1, hab: new Set() };
  inimigos.push(e);
  return e;
}

// Posições do início de cada ronda
function comecarRonda() {
  const V = mapa.versus, p2 = parceiroAtivo(), P1 = heroiPrincipal();
  V.contagem = TEMPO_CONTAGEM;
  projeteis = []; perigos = []; ondas = []; raios = [];
  for (const [H, x] of [[P1, 8], [p2, 28]]) {
    if (!H) continue;
    comHeroi(H, () => { S = stats(); J.hp = S.maxHp; J.mana = S.maxMana; J.veneno = 0; J.barreira = 0; J.caido = false; J.cdHab = {}; J.cdFeitico = {}; J.cdClasse = 0; });
    H.x = x * TILE; H.y = 13 * TILE; H.kbx = H.kby = 0; H.invuln = TEMPO_CONTAGEM; H.tp = (H.tp || 0) + 1;
  }
  mostrarBanner(`RONDA ${V.ronda}`, placarVersus(), '#ffe14d');
}
const placarVersus = () => `${nomeHeroiVersus(0)} ${mapa.versus.pontos[0]} - ${mapa.versus.pontos[1]} ${nomeHeroiVersus(1)}`;
const nomeHeroiVersus = i => { const H = i === 0 ? heroiPrincipal() : parceiroAtivo(); return H ? traduzir(CLASSES[H.classe] ? CLASSES[H.classe].nome : 'Herói') : '?'; };

// Chamado a cada frame (no anfitrião)
function atualizarVersus(dt) {
  if (!emDuelo() || J.remoto) return;
  const V = mapa.versus, P1 = heroiPrincipal(), p2 = parceiroAtivo();
  // os alvos invisíveis seguem os heróis
  for (const H of [P1, p2]) {
    if (!H) continue;
    const e = rivalDe(H) || criarRival(H);
    e.x = H.x; e.y = H.y; e.r = H.r || 12; e.hp = e.maxHp; e.morto = false;
    e.z = H.caido ? 99 : 0;
  }
  inimigos = inimigos.filter(e => !e.ehRival || e.rival === P1 || e.rival === p2);
  if (!p2) { V.esperar = true; return; }
  if (V.esperar) { V.esperar = false; comecarRonda(); }
  if (V.fim > 0) {
    V.fim -= dt;
    if (V.fim <= 0) { V.fim = -1; setTimeout(acabarVersus, 0); } // sai entre dois passos do jogo
    return;
  }
  if (V.fim < 0) return;
  if (V.contagem > 0) {
    const antes = Math.ceil(V.contagem);
    V.contagem -= dt;
    if (Math.ceil(V.contagem) !== antes && V.contagem > 0) som(660, 0.1, 'square', 0.03);
    if (V.contagem <= 0) { mostrarBanner('LUTEM!', placarVersus(), '#ff4d4d'); som(990, 0.25, 'square', 0.05, 200); }
  }
}

// Dano num alvo invisível: passa para o herói verdadeiro (chamado pelo danoInimigo)
function danoNoRival(e, dano, crit, dx, dy) {
  const quem = atacanteProj || J;
  if (!emDuelo() || e.rival === quem || mapa.versus.contagem > 0 || mapa.versus.fim !== 0) return;
  const H = e.rival;
  comHeroi(H, () => {
    const hp0 = J.hp;
    danoJogador(Math.max(1, Math.round(dano * FATOR_DANO_DUELO)), J.x - (dx || 0) * 20, J.y - (dy || 0) * 20);
    if (J.hp < hp0 && crit) texto(J.x, J.y - 36, 'CRÍTICO!', '#ffe14d', 14);
  });
}

// Um herói ficou sem vida (chamado pelo danoJogador): acaba a ronda
function perdeuRondaVersus() {
  if (!emDuelo()) return false;
  const V = mapa.versus, perdedor = J;
  J.hp = 1; J.invuln = 99;
  if (V.fim !== 0 || V.contagem > 0) return true;
  const i = perdedor === heroiPrincipal() ? 1 : 0; // quem ganhou a ronda
  V.pontos[i]++;
  explosao(perdedor.x, perdedor.y, '#ff4d4d', 40, 260, 5);
  if (V.pontos[i] >= RONDAS_GANHAR) {
    V.fim = 4.5;
    mostrarBanner(`${nomeHeroiVersus(i)} GANHA O DUELO!`, placarVersus(), '#ffe14d');
    fanfarra([523, 659, 784, 1046, 1318], 0.05);
    if (i === 0) contar('duelosGanhos');
  } else {
    V.ronda++;
    mostrarBanner(`${nomeHeroiVersus(i)} ganha a ronda!`, placarVersus(), '#ffae00');
    setTimeout(() => { if (emDuelo() && mapa.versus.fim === 0) comecarRonda(); }, 1800);
    V.contagem = 99; // até a ronda seguinte começar ninguém leva dano
  }
  return true;
}

// Fim do duelo: volta ao menu do Jogar a 2 (o parceiro continua ligado)
function acabarVersus() {
  if (!emDuelo()) return;
  inimigos = []; projeteis = [];
  mapa = null; J = null; S = null;
  if (coop.p2) coop.p2.mapa = null;
  abrirCoop();
}

// Placar no ecrã (anfitrião)
function desenharPlacarVersus() {
  if (!emDuelo() || !['jogo', 'convidado'].includes(estado)) return;
  const V = mapa.versus;
  painel(LARGURA / 2 - 180, 8, 360, 44, 'rgba(14,11,22,0.94)', '#ff8080');
  const P1 = heroiPrincipal(), p2 = parceiroAtivo();
  if (P1) sprEcra(framesHeroi(P1.raca, P1.skin)[0], LARGURA / 2 - 160, 30, 2);
  if (p2) sprEcra(framesHeroi(p2.raca, p2.skin)[0], LARGURA / 2 + 160, 30, 2);
  textoCentroAjustado(nomeHeroiVersus(0), LARGURA / 2 - 98, 30, 13, P1 ? CLASSES[P1.classe].cor : '#fff', 92);
  textoCentroAjustado(nomeHeroiVersus(1), LARGURA / 2 + 98, 30, 13, p2 ? CLASSES[p2.classe].cor : '#fff', 92);
  sprEcra(ART.espadas, LARGURA / 2, 30, 2);
  textoCentro(`${V.pontos[0]}`, LARGURA / 2 - 36, 30, 22, '#ffe14d');
  textoCentro(`${V.pontos[1]}`, LARGURA / 2 + 36, 30, 22, '#ffe14d');
  if (V.contagem > 0 && V.contagem < 10 && !V.esperar) textoCentro(`${Math.ceil(V.contagem)}`, LARGURA / 2, ALTURA / 2 - 80, 64, '#ffe14d');
  if (V.esperar) textoCentro('À espera do parceiro...', LARGURA / 2, ALTURA / 2 - 80, 22, '#ffae00');
}
