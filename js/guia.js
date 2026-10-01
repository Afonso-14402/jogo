'use strict';
// =====================================================================
//  GUIA: dicas da primeira vez e modos que se desbloqueiam aos poucos
//  - Na primeira vez que encontras uma coisa nova (baú, portal, altar...)
//    aparece uma dica curta no topo do ecrã. Cada dica só aparece uma vez.
//  - O menu inicial abre os modos à medida que desces mais fundo.
// =====================================================================

// ---------------------------------------------------------------------
//  Modos desbloqueados pelo andar mais fundo a que já chegaste
// ---------------------------------------------------------------------
const DESBLOQUEIOS = {
  diario:   { andar: 3,  nome: 'Desafio Diário' },
  torre:    { andar: 6,  nome: 'Torre dos 100 Andares' },
  pacto:    { andar: 8,  nome: 'Pacto de Castigo' },
  bossrush: { andar: 11, nome: 'Boss Rush' },
};
const andarMaximo = () => Math.max(meta.andarMax || 0, typeof recorde === 'number' ? recorde : 0);
const modoLivre = id => !DESBLOQUEIOS[id] || andarMaximo() >= DESBLOQUEIOS[id].andar || (id === 'torre' && meta.torreMax > 0) || (id === 'bossrush' && !!meta.bossRush);

// Chamado ao chegar a um andar novo: guarda o recorde e avisa dos modos novos
function progressoDesbloqueios() {
  if (!J || J.remoto || !['normal', 'diario', undefined, null].includes(J.modo)) return;
  if (andar <= andarMaximo()) return;
  const antes = Object.keys(DESBLOQUEIOS).filter(modoLivre);
  meta.andarMax = andar;
  salvarMeta();
  for (const id of Object.keys(DESBLOQUEIOS)) if (!antes.includes(id) && modoLivre(id)) avisar('MODO NOVO NO MENU', DESBLOQUEIOS[id].nome, '#5dff7a');
  if (andar > 1 && ANDARES_ATALHO.includes(andar)) avisar('ATALHO NOVO', `As partidas novas podem começar no andar ${andar}`, '#4dc3ff');
}

// ---------------------------------------------------------------------
//  Atalhos: depois de chegares ao andar 11, 21, 31, 41 ou 51, as partidas
//  novas podem começar lá (com um herói ao nível desse andar)
// ---------------------------------------------------------------------
const ANDARES_ATALHO = [1, 11, 21, 31, 41, 51];
const atalhosLivres = () => ANDARES_ATALHO.filter(a => a === 1 || andarMaximo() >= a);
let andarInicial = 1;
const BOTAO_ATALHO = { x: 506, y: 586, w: 184, h: 40 };

// O herói "típico" do andar n (o mesmo que o bot de equilíbrio usa): nível, atributos,
// equipamento e magias à altura; ganha também 3 melhorias para escolher ao começar
function prepararAtalho(n) {
  prepararParaAndar(n);
  J.ouro += n * 12;
  J.pocoes += 2;
  J.escolhasPendentes += 3;
  J.atalho = n;
  andar = n - 1; // o proximoAndar sobe para o andar n
  S = stats();
  J.hp = S.maxHp; J.mana = S.maxMana;
}

const valorItem = x => (x.dano || 0) + (x.def || 0) + (x.hp || 0) / 5 + (x.regen || 0) * 5;
// Põe o herói ao nível e com o equipamento típicos do andar n (atalhos e Boss Rush).
// Só melhora: o que já tens de melhor fica. Devolve quantos níveis subiu.
function prepararParaAndar(n) {
  const L = Math.round((n - 1) * 0.9) + 1, n0 = J.nivel;
  while (J.nivel < L) { J.nivel++; J.hpBase += 10; J.atkBase += 2; J.defBase += 1; J.pontos += PONTOS_POR_NIVEL; }
  distribuirPontos();
  const rr = n < 16 ? 'raro' : n < 36 ? 'epico' : 'lendario';
  const ordem = r => ORDEM_RARIDADES.indexOf(r);
  const tipoArma = classeArma(J.arma);
  for (const tipo of ['arma', 'armadura', 'amuleto']) {
    if (J[tipo] && ordem(J[tipo].r) > ordem(rr)) continue;
    let l = ITENS.filter(i => i.tipo === tipo && i.r === rr && !i.inicial);
    if (tipo === 'arma') { const base = ITENS.find(i => i.nome === (J.arma && J.arma.nomeBase)); const m = l.filter(i => classeArma(i) === tipoArma); l = m.length ? m : l; if (base && base.r === rr && Math.random() < 0.5) l = [base]; }
    if (!l.length) continue;
    const novo = criarItem(escolher(l), n, true);
    if (J[tipo] && ordem(J[tipo].r) === ordem(rr) && valorItem(J[tipo]) >= valorItem(novo) * 0.9) continue; // o teu ainda é bom
    J[tipo] = novo; registrarItem(novo);
  }
  for (const f of feiticosJ()) J.feiticos[f] = Math.max(J.feiticos[f] || 0, Math.min(3, 1 + Math.floor(n / 15)));
  return J.nivel - n0;
}

// Mensagem no menu inicial quando tocas num modo fechado
let msgTitulo = null;
function tocarModoFechado(id) {
  msgTitulo = { txt: `Chega ao andar ${DESBLOQUEIOS[id].andar} para abrir: ${traduzir(DESBLOQUEIOS[id].nome)}`, t: 2.8 };
  som(200, 0.12, 'square', 0.03);
}
function desenharMsgTitulo() { // por cima da frase dos baús, ao lado dos botões
  if (!msgTitulo) return;
  ctx.globalAlpha = Math.min(1, msgTitulo.t * 2);
  painel(440, 512, 460, 36, 'rgba(40,14,14,0.97)', '#ff8080');
  textoCentroAjustado(msgTitulo.txt, 670, 530, 14, '#ffd0d0', 440, false);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Dicas da primeira vez
// ---------------------------------------------------------------------
const DICAS = {
  bau:          ['Baú da sorte: a roleta pode dar do Lixo ao Mítico.', 'Os baús dourados têm melhores chances.'],
  mercador:     ['Mercador: gasta aqui o teu ouro.', 'Poções, baús, itens e relíquias.'],
  portal:       ['Portal com rank: uma masmorra extra com prémios.', 'Se ninguém o fechar a tempo, os monstros saem cá para fora!'],
  portaDupla:   ['Porta Antiga: leva ao Santuário do Vigia.', 'Quando os olhos da estátua ficarem vermelhos, NÃO te mexas.'],
  altar:        ['Altar de sangue: dás vida e recebes um Baú Dourado.', 'Usa-o quando tiveres a vida cheia.'],
  mesa:         ['Mesa de Encantamentos: melhora o teu equipamento.', 'Cada encantamento deixa a arma ou armadura mais forte.'],
  cristal:      ['Cristal de desafio: 3 ondas de monstros.', 'Aguenta até ao fim e ganhas um Baú Dourado.'],
  gaiola:       ['Um companheiro preso! Liberta-o.', 'Ele luta ao teu lado e fica mais forte contigo.'],
  estatua:      ['Estátuas do Anjo e do Diabo: presentes com um preço.', 'Do Anjo só podes levar um. O Diabo pede vida máxima.'],
  pedestal:     ['Pedestais: escolhe só um prémio.', 'Quando levas um, os outros desaparecem.'],
  escadaCidade: ['Escadas para cima: a Cidade dos Caçadores.', 'Lá há lojas, a Guilda e pedidos com prémios.'],
  boss:         ['BOSS! Tem muita vida e ataques fortes.', 'Usa a esquiva (»») para passar pelos ataques: ficas invencível.'],
  elite:        ['Monstro de elite: mais forte do que os outros.', 'Dá mais XP e mais ouro quando o derrotas.'],
  vidaBaixa:    ['Vida baixa! Bebe uma poção.', 'No telemóvel é o botão da poção; no PC é a tecla Q.'],
};

let dicaAtual = null;
const BOTAO_DICA = { x: 300, y: 10, w: 450, h: 64 };

function dica(id) {
  if (!DICAS[id] || dicaAtual || tutorial || !J || J.remoto) return;
  if (!meta.dicas) meta.dicas = {};
  if (meta.dicas[id]) return;
  meta.dicas[id] = true;
  salvarMeta();
  dicaAtual = { id, t: 0, dur: 8 };
  som(880, 0.08, 'triangle', 0.03);
}

// Procura coisas novas à volta do herói (chamado a cada frame do jogo)
function atualizarDicas(dt) {
  if (dicaAtual) {
    dicaAtual.t += dt;
    if (dicaAtual.t > dicaAtual.dur || (!modoToque && dicaAtual.t > 0.4 && clicou(BOTAO_DICA))) dicaAtual = null;
    return;
  }
  if (!J || J.remoto || tutorial || estado !== 'jogo') return;
  if (J.bauPerto) dica('bau');
  if (J.objPerto && DICAS[J.objPerto.tipo]) dica(J.objPerto.tipo);
  if (boss && boss.acordado) dica('boss');
  if (J.hp < S.maxHp * 0.3 && J.pocoes > 0) dica('vidaBaixa');
  for (const e of inimigos) if (e.elite && !e.morto && Math.hypot(e.x - J.x, e.y - J.y) < 260) { dica('elite'); break; }
}

function desenharDica() {
  if (!dicaAtual || estado !== 'jogo') return;
  const [l1, l2] = DICAS[dicaAtual.id], r = BOTAO_DICA;
  ctx.globalAlpha = Math.min(1, dicaAtual.t * 4, (dicaAtual.dur - dicaAtual.t) * 2);
  painel(r.x, r.y, r.w, r.h, 'rgba(10,24,34,0.96)', '#4dc3ff');
  textoCentroAjustado(l1, r.x + r.w / 2, r.y + 20, 15, '#fff', r.w - 24, false);
  textoCentroAjustado(l2, r.x + r.w / 2, r.y + 44, 12, '#bfe8ff', r.w - 24, false);
  barra(r.x + 8, r.y + r.h - 7, r.w - 16, 3, 1 - dicaAtual.t / dicaAtual.dur, '#4dc3ff', '#10303a');
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Profundezas (depois do Soberano, andar 61 em diante)
//  De 10 em 10 andares vêm dois bosses ao mesmo tempo; vencê-los dá mais prémios
// ---------------------------------------------------------------------
const ehBossDuplo = () => !!(J && !J.modo && andar > 60 && andar % 10 === 0 && mapa && !mapa.provacao);
function bossDuploProfundezas() {
  if (!ehBossDuplo() || !boss) return;
  const outros = BOSSES.filter(b => b.id !== boss.tipo && b.id !== 'monarca');
  const b2 = criarBoss(escolher(outros).id, 0.75); // são dois: cada um um pouco mais fraco
  boss.hp = boss.maxHp = Math.round(boss.maxHp * 0.75);
  for (const dx of [110, -110, 0]) {
    if (!colideCirculo(mapa, boss.x + dx, boss.y + (dx ? 0 : 90), b2.r)) { b2.x = boss.x + dx; b2.y = boss.y + (dx ? 0 : 90); break; }
  }
  inimigos.push(b2);
  viuMonstro(b2.tipo);
  mostrarBanner(`ANDAR ${andar} — BOSS DUPLO`, `${boss.nome} + ${b2.nome}`, '#ff4d4d');
}
function premioBossDuplo(x, y) {
  if (!ehBossDuplo()) return;
  baus.push({ x: x, y: y + 70, tipo: 'ouro', semMimico: true, t: 0 });
  soltarReliquia(x, y - 60);
  avisar('BOSS DUPLO VENCIDO!', 'Mais um Baú Dourado e uma relíquia', '#ffd23f');
}
