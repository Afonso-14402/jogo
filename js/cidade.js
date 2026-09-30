'use strict';
// =====================================================================
//  CIDADE DOS CAÇADORES (entre partidas)
//  - Associação de Caçadores: reavaliação de rank e contratos
//  - Ferreiro: forja a arma inicial e dá uma armadura para começar
//  - Alquimista: mais poções, poções mais fortes e mais mana
//  - Portão: jogo normal, Desafio Diário e Torre
//  Paga-se com Moedas de Caçador, que ganhas no fim de cada partida.
// =====================================================================

function metaCidade() {
  if (meta.moedas == null) meta.moedas = 0;
  if (!meta.cidade) meta.cidade = {};
  if (!meta.contratos) meta.contratos = {};
  if (meta.rankCacador == null) meta.rankCacador = 0;
  if (meta.melhorPoder == null) meta.melhorPoder = 0;
  return meta.cidade;
}
const nCidade = id => (metaCidade()[id] || 0);

// Moedas ganhas numa partida (uma parte do ouro que trazes e o que fizeste)
function calcularMoedas() {
  return Math.max(1, Math.round((J.ouro * 0.15 + andar * 4 + (J.bossesMortos || 0) * 10) * (J.modo === 'torre' ? 1.3 : 1)));
}
function ganharMoedasFim() {
  metaCidade();
  J.moedasGanhas = calcularMoedas();
  meta.moedas += J.moedasGanhas;
  salvarMeta();
}

// ---------------------------------------------------------------------
//  Rank de caçador (reavaliação na Associação)
// ---------------------------------------------------------------------
const bonusRankCacador = () => ({ dano: 0.03 * (meta.rankCacador || 0), hp: 0.03 * (meta.rankCacador || 0) });
// Poder que tens de ter mostrado numa partida para passar ao rank k
const poderParaRank = k => poderReferencia(RANKS[k - 1].ate);

// O melhor poder de sempre fica guardado (visto ao descer cada andar)
function registarPoder() {
  metaCidade();
  const p = poderJogador();
  if (p > meta.melhorPoder) { meta.melhorPoder = p; salvarMeta(); }
}

function reavaliar() {
  const k = (meta.rankCacador || 0) + 1;
  if (k >= RANKS.length) return { txt: 'Já és um Caçador de Nível Nacional!', cor: '#ffe14d' };
  const precisa = poderParaRank(k);
  if (meta.melhorPoder < precisa) return { txt: `O cristal não reage. Precisas de mostrar poder ${precisa} (o teu melhor: ${meta.melhorPoder})`, cor: '#ff8080' };
  meta.rankCacador = k;
  salvarMeta();
  cidade.anim = { t: 0, letra: RANKS[k].letra, cor: RANKS[k].cor };
  fanfarra([392, 523, 659, 784, 1046, 1318, 1568], 0.05);
  if (RANKS[k].letra === 'S' || RANKS[k].letra === 'Nacional') desbloquear('reavaliadoS');
  return { txt: `REAVALIADO! Agora és Caçador de Rank ${RANKS[k].letra}`, cor: RANKS[k].cor };
}

// ---------------------------------------------------------------------
//  Contratos da Associação (acumulam entre partidas)
// ---------------------------------------------------------------------
const CONTRATOS = [
  { id: 'matar',      desc: 'Mata {n} monstros',        n: [100, 300, 800, 2000],  moedas: [40, 80, 150, 300] },
  { id: 'elite',      desc: 'Mata {n} monstros de elite', n: [10, 30, 80, 200],   moedas: [40, 80, 150, 300] },
  { id: 'boss',       desc: 'Derrota {n} bosses',       n: [3, 10, 25, 60],        moedas: [50, 100, 180, 350] },
  { id: 'portalFeito', desc: 'Conquista {n} portais',   n: [2, 8, 20, 50],         moedas: [50, 100, 180, 350] },
  { id: 'baus',       desc: 'Abre {n} baús',            n: [20, 60, 150, 400],     moedas: [30, 60, 120, 250] },
  { id: 'andar',      desc: 'Chega ao andar {n}',       n: [10, 20, 35, 50],       moedas: [40, 90, 180, 400], maximo: true },
];
function estadoContrato(C) {
  const e = metaCidade() && (meta.contratos[C.id] || (meta.contratos[C.id] = { nivel: 0, prog: 0 }));
  const nv = Math.min(e.nivel, C.n.length - 1);
  return { e, nv, alvo: C.n[nv], premio: C.moedas[nv], acabado: e.nivel >= C.n.length, pronto: e.nivel < C.n.length && e.prog >= C.n[nv] };
}
// Chamado por registar() (extras.js)
function progressoContratos(evento, q) {
  for (const C of CONTRATOS) {
    if (C.id !== evento) continue;
    const { e, acabado } = estadoContrato(C);
    if (acabado) continue;
    const antes = e.prog >= C.n[e.nivel];
    e.prog = C.maximo ? Math.max(e.prog, q) : e.prog + q;
    if (!antes && e.prog >= C.n[e.nivel]) avisar('Contrato cumprido!', 'Recebe o prémio na Associação de Caçadores', '#4dc3ff');
  }
}
function receberContrato(C) {
  const { e, pronto, premio } = estadoContrato(C);
  if (!pronto) return false;
  meta.moedas += premio;
  e.nivel++;
  if (!C.maximo) e.prog = 0;
  salvarMeta();
  fanfarra([523, 659, 784, 1046], 0.04);
  return premio;
}

// ---------------------------------------------------------------------
//  Lojas da cidade
// ---------------------------------------------------------------------
const LOJAS_CIDADE = {
  ferreiro: [
    { id: 'forja',    nome: 'Forjar a arma inicial',   desc: 'Começas com a arma +1 (até +5)',            custo: [60, 120, 200, 320, 500] },
    { id: 'armadura', nome: 'Armadura de caçador',     desc: 'Começas com uma armadura Comum, Rara ou Épica', custo: [80, 200, 450] },
  ],
  alquimista: [
    { id: 'pocoes',   nome: 'Bolsa de poções',          desc: '+1 poção no início (até +3)',          custo: [50, 120, 250] },
    { id: 'cura',     nome: 'Receita melhorada',        desc: 'Poções curam +5% (até +15%)',          custo: [80, 180, 350] },
    { id: 'mana',     nome: 'Elixir de mana',           desc: '+15 mana máxima (até +45)',            custo: [60, 140, 280] },
  ],
};
function comprarCidade(o) {
  const nv = nCidade(o.id);
  if (nv >= o.custo.length) return { txt: 'Já está no máximo', cor: '#aaa' };
  if (meta.moedas < o.custo[nv]) { som(140, 0.2, 'square', 0.04); return { txt: 'Não tens moedas suficientes. Joga mais partidas!', cor: '#ff6060' }; }
  meta.moedas -= o.custo[nv];
  meta.cidade[o.id] = nv + 1;
  salvarMeta();
  fanfarra([523, 659, 784], 0.04);
  return { txt: `${o.nome}: nível ${nv + 1}!`, cor: '#5dff7a' };
}

// Bónus da cidade (entra nos stats)
function bonusCidade() {
  const r = bonusRankCacador();
  return { danoPct: r.dano, hpPct: r.hp, cura: 0.05 * nCidade('cura'), mana: 15 * nCidade('mana') };
}

// No início de cada partida
function aplicarCidadeInicial() {
  const f = nCidade('forja');
  for (let k = 0; k < f && J.arma; k++) { J.arma.enc = (J.arma.enc || 0) + 1; melhorarStats(J.arma); }
  if (f && J.arma) renomear(J.arma);
  const a = nCidade('armadura');
  if (a) {
    const r = ['comum', 'raro', 'epico'][a - 1];
    const l = ITENS.filter(i => i.tipo === 'armadura' && i.r === r && !i.inicial);
    if (l.length) J.armadura = criarItem(escolher(l), 1, true);
  }
  J.pocoes += nCidade('pocoes') + ((meta.rankCacador || 0) >= 5 ? 1 : 0);
}

// ---------------------------------------------------------------------
//  Ecrã da cidade
// ---------------------------------------------------------------------
const EDIFICIOS = [
  { id: 'assoc',      nome: 'Associação de Caçadores', cor: '#4dc3ff', parede: '#2a3a5a', telhado: '#1a2a4a', npc: ['humano', 'real'] },
  { id: 'ferreiro',   nome: 'Ferreiro',                cor: '#ff9b45', parede: '#4a3020', telhado: '#6a2a1a', npc: ['anao', 'dourado'] },
  { id: 'alquimista', nome: 'Alquimista',              cor: '#5dff7a', parede: '#2a4a30', telhado: '#1a3a24', npc: ['elfo', 'gelo'] },
  { id: 'portao',     nome: 'Portão da Masmorra',      cor: '#ffe14d', parede: '#3a3040', telhado: '#241c2c', npc: null },
];
let cidade = null;
const retEdificio = i => ({ x: 24 + i * 232, y: 96, w: 216, h: 300 });
const retLinhaCidade = i => ({ x: 40, y: 450 + i * 46, w: 520, h: 40 });

function abrirCidade() {
  metaCidade();
  cidade = { t: 0, ed: 0, sel: 0, msg: null, anim: null };
  estado = 'cidade';
}

function linhasCidade() {
  const id = EDIFICIOS[cidade.ed].id;
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
  if (id === 'portao') return [
    { tipo: 'novo', txt: 'Masmorra normal' },
    { tipo: 'diario', txt: `Desafio Diário${meta.diario && meta.diario[hojeTexto()] ? ' (já jogado hoje)' : ''}` },
    { tipo: 'torre', txt: 'Torre dos 100 Andares' },
  ];
  return LOJAS_CIDADE[id].map(o => {
    const nv = nCidade(o.id), max = nv >= o.custo.length;
    return { tipo: 'loja', o, txt: `${o.nome}  (${nv}/${o.custo.length})`, preco: max ? null : o.custo[nv] };
  });
}

function atualizarCidade(dt) {
  const C = cidade;
  C.t += dt;
  if (C.msg) { C.msg.t -= dt; if (C.msg.t <= 0) C.msg = null; }
  if (C.anim) { C.anim.t += dt; if (C.anim.t > 3) C.anim = null; }
  if (C.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = 'titulo'; cidade = null; return; }
  EDIFICIOS.forEach((e, i) => { if (premiu(String(i + 1)) || clicou(retEdificio(i))) { if (C.ed !== i) { C.ed = i; C.sel = 0; som(600, 0.05, 'square', 0.02); } } });
  if (premiu('a', 'arrowleft')) { C.ed = (C.ed + 3) % 4; C.sel = 0; }
  if (premiu('d', 'arrowright')) { C.ed = (C.ed + 1) % 4; C.sel = 0; }
  const L = linhasCidade();
  if (premiu('s', 'arrowdown')) C.sel = (C.sel + 1) % L.length;
  if (premiu('w', 'arrowup')) C.sel = (C.sel + L.length - 1) % L.length;
  L.forEach((l, i) => { if (dentro(retLinhaCidade(i))) C.sel = i; });
  let acao = null;
  L.forEach((l, i) => { if (clicou(retLinhaCidade(i))) acao = l; });
  if (premiu('e', 'enter', ' ')) acao = L[C.sel];
  if (!acao) return;
  const msg = t => { C.msg = Object.assign({ t: 2.5 }, t); };
  if (acao.tipo === 'reav') msg(reavaliar());
  else if (acao.tipo === 'contrato') {
    const p = receberContrato(acao.C);
    msg(p ? { txt: `Contrato entregue: +${p} moedas`, cor: '#ffe14d' } : { txt: 'Ainda não cumpriste este contrato', cor: '#aaa' });
  } else if (acao.tipo === 'loja') msg(comprarCidade(acao.o));
  else if (acao.tipo === 'novo') { rato.baixo = false; modoProximo = null; abrirCriacao(); }
  else if (acao.tipo === 'diario') { rato.baixo = false; comecarDiario(); }
  else if (acao.tipo === 'torre') { rato.baixo = false; modoProximo = 'torre'; abrirCriacao(); }
}

function desenharEdificio(E, r, sel, t) {
  const base = r.y + r.h;
  // parede
  ctx.fillStyle = E.parede;
  ctx.fillRect(r.x + 16, r.y + 90, r.w - 32, r.h - 90);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = r.y + 100; y < base; y += 16) ctx.fillRect(r.x + 16, y, r.w - 32, 2);
  // telhado
  ctx.fillStyle = E.telhado;
  ctx.beginPath(); ctx.moveTo(r.x + 4, r.y + 96); ctx.lineTo(r.x + r.w / 2, r.y + 20); ctx.lineTo(r.x + r.w - 4, r.y + 96); ctx.closePath(); ctx.fill();
  ctx.fillStyle = E.cor; ctx.fillRect(r.x + 4, r.y + 92, r.w - 8, 5);
  // janelas acesas
  const luz = 0.7 + Math.sin(t * 2 + r.x) * 0.15;
  ctx.fillStyle = `rgba(255,210,120,${luz})`;
  ctx.fillRect(r.x + 36, r.y + 120, 30, 30); ctx.fillRect(r.x + r.w - 66, r.y + 120, 30, 30);
  ctx.fillStyle = E.parede; ctx.fillRect(r.x + 50, r.y + 120, 2, 30); ctx.fillRect(r.x + r.w - 52, r.y + 120, 2, 30);
  // porta ou portão
  if (E.id === 'portao') {
    ctx.fillStyle = '#07060a'; ctx.fillRect(r.x + 56, r.y + 170, r.w - 112, r.h - 170);
    const R = RANKS_PORTAL[Math.floor(t * 0.7) % 8];
    for (let k = 3; k >= 0; k--) { ctx.globalAlpha = 0.25 + k * 0.15; ctx.fillStyle = k % 2 ? R.cor : '#1a1422'; ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 236, 20 + k * 9 + Math.sin(t * 3 + k) * 2, 30 + k * 12, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(r.x + r.w / 2 - 22, base - 80, 44, 80);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(r.x + r.w / 2 + 12, base - 42, 4, 4);
  }
  // letreiro
  painel(r.x + 10, r.y + 58, r.w - 20, 26, 'rgba(20,14,8,0.95)', sel ? '#ffffff' : E.cor);
  textoCentroAjustado(E.nome, r.x + r.w / 2, r.y + 72, 12, E.cor, r.w - 30);
  // habitante à porta
  if (E.npc) sprEcra(framesHeroi(E.npc[0], E.npc[1])[Math.floor(t * 2 + r.x) % 2 ? 0 : 1], r.x + r.w / 2 - 56, base - 30, 3);
  if (E.id === 'ferreiro') { // bigorna e faíscas
    ctx.fillStyle = '#555a66'; ctx.fillRect(r.x + r.w - 70, base - 22, 40, 12); ctx.fillRect(r.x + r.w - 60, base - 10, 20, 10);
    if (Math.sin(t * 6) > 0.6) { ctx.fillStyle = '#ffe14d'; ctx.fillRect(r.x + r.w - 52 + Math.random() * 12, base - 34 - Math.random() * 10, 3, 3); }
  }
  if (E.id === 'alquimista') for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ff5a5a', '#5dff7a', '#4dc3ff'][k]; ctx.fillRect(r.x + r.w - 72 + k * 16, base - 20, 10, 14); }
  if (E.id === 'assoc') { ctx.fillStyle = '#4dc3ff'; ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3; ctx.beginPath(); ctx.arc(r.x + r.w - 50, base - 22, 12, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (sel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 2, r.y + 14, r.w - 4, r.h - 12); }
}

function desenharCidade(t) {
  // céu, lua e chão
  const g = ctx.createLinearGradient(0, 0, 0, 400);
  g.addColorStop(0, '#0a0a24'); g.addColorStop(1, '#3a2240');
  ctx.fillStyle = g; ctx.fillRect(-MARGEM_X, 0, TELA_W, 400);
  ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(820, 60, 26, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect((k * 173) % LARGURA, (k * 67) % 90, 2, 2); }
  ctx.fillStyle = '#2a2430'; ctx.fillRect(-MARGEM_X, 396, TELA_W, 244);
  ctx.fillStyle = '#3a3240';
  for (let x = -MARGEM_X; x < LARGURA + MARGEM_X; x += 32) for (let y = 400; y < 430; y += 12) ctx.fillRect(x + ((y / 12) % 2) * 16, y, 28, 9);
  EDIFICIOS.forEach((E, i) => desenharEdificio(E, retEdificio(i), cidade.ed === i, t));
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  textoCentro('CIDADE DOS CAÇADORES', LARGURA / 2, 30, 28, '#4dc3ff');
  textoDir(`Moedas: ${meta.moedas}`, LARGURA - 20, 30, 18, '#ffd23f');
  textoDir(`Rank de caçador: ${RANKS[meta.rankCacador || 0].letra}`, LARGURA - 20, 56, 13, RANKS[meta.rankCacador || 0].cor);
  // painel do edifício escolhido
  const E = EDIFICIOS[cidade.ed];
  painel(20, 434, 920, 196, 'rgba(12,10,20,0.95)', E.cor);
  linhasCidade().forEach((l, i) => {
    const r = retLinhaCidade(i), s = cidade.sel === i;
    const cor = l.pronto ? '#ffe14d' : l.tipo === 'contrato' ? '#ddd' : E.cor;
    painel(r.x, r.y, r.w, r.h, s ? 'rgba(50,42,72,0.97)' : 'rgba(18,14,28,0.95)', s ? '#ffffff' : l.pronto ? '#ffe14d' : '#3a3150');
    textoCentroAjustado(l.txt, r.x + r.w / 2 - (l.preco != null || l.premio ? 50 : 0), r.y + r.h / 2 + 1, 14, cor, r.w - (l.preco != null || l.premio ? 120 : 20));
    if (l.preco != null) textoDir(`${l.preco} moedas`, r.x + r.w - 12, r.y + r.h / 2 + 1, 13, meta.moedas >= l.preco ? '#ffd23f' : '#ff8080');
    if (l.premio) textoDir(l.pronto ? `Receber ${l.premio}` : `${l.premio} moedas`, r.x + r.w - 12, r.y + r.h / 2 + 1, 13, l.pronto ? '#ffe14d' : '#887');
  });
  // explicação à direita
  const info = {
    assoc: ['A Associação mede o teu poder.', `O teu melhor poder: ${meta.melhorPoder}`, 'Cada rank dá +3% dano e +3% vida', 'para sempre (Rank S: +1 poção).', 'Contratos dão moedas de caçador.'],
    ferreiro: ['O ferreiro prepara o teu equipamento', 'para a próxima entrada na masmorra.'],
    alquimista: ['O alquimista enche a tua bolsa', 'antes de cada partida.'],
    portao: ['Escolhe como queres entrar:', 'Normal: a masmorra de sempre', 'Diário: mesmo mapa para todos, hoje', 'Torre: 100 andares de arenas'],
  }[E.id];
  const o = E.id === 'ferreiro' || E.id === 'alquimista' ? LOJAS_CIDADE[E.id][Math.min(cidade.sel, LOJAS_CIDADE[E.id].length - 1)] : null;
  (o ? info.concat(['', o.desc]) : info).forEach((l, i) => textoEsq(l, 590, 460 + i * 22, 13, i === 0 ? E.cor : '#ccc', 'normal'));
  if (cidade.msg) textoCentro(cidade.msg.txt, LARGURA / 2, 418, 15, cidade.msg.cor);
  else textoCentro(`Ganhas moedas no fim de cada partida (15% do ouro + andar + bosses)`, LARGURA / 2, 418, 12, '#887', false);
  if (!modoToque) textoCentro('1-4 / A D: edifício · W S: escolher · E: comprar · Esc: voltar', LARGURA / 2, 634, 11, '#777', false);
  // animação da reavaliação
  if (cidade.anim) {
    const a = cidade.anim, al = Math.min(1, a.t * 2) * Math.min(1, (3 - a.t) * 2);
    ctx.globalAlpha = al * 0.8; ctx.fillStyle = '#000'; ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
    ctx.globalAlpha = al;
    ctx.fillStyle = a.cor; ctx.beginPath(); ctx.arc(LARGURA / 2, 280, 60 + Math.sin(t * 8) * 6, 0, Math.PI * 2); ctx.fill();
    textoCentro(a.letra, LARGURA / 2, 284, a.letra.length > 2 ? 30 : 64, '#07060a');
    textoCentro('[Sistema] Reavaliação concluída', LARGURA / 2, 390, 22, '#9fdcff');
    textoCentro(`Rank ${a.letra}`, LARGURA / 2, 424, 28, a.cor);
    ctx.globalAlpha = 1;
  }
}
