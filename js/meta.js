'use strict';
// =====================================================================
//  META: o que fica guardado entre partidas
//  (almas, melhorias permanentes, coleção de itens e conquistas)
// =====================================================================

const CHAVE_META = 'masmorra_meta';
let meta = { almas: 0, melhorias: {}, colecao: {}, conquistas: {}, contadores: {}, vistos: {} };
try {
  const m = JSON.parse(localStorage.getItem(CHAVE_META) || 'null');
  if (m) meta = Object.assign(meta, m);
} catch (e) { /* sem storage */ }

function salvarMeta() {
  if (coop.papel === 'convidado' && coop.metaGuardada) return; // a jogar no jogo do parceiro não se guarda nada aqui
  try { localStorage.setItem(CHAVE_META, JSON.stringify(meta)); } catch (e) { /* sem storage */ }
}

const nMeta = id => meta.melhorias[id] || 0;

// Avisos que aparecem no topo do ecrã (conquistas, etc.)
let avisos = [];
function avisar(titulo, sub, cor) {
  avisos.push({ titulo, sub, cor, t: 4 });
}
function atualizarAvisos(dt) { // mostra um de cada vez
  if (!avisos.length) return;
  avisos[0].t -= dt;
  if (avisos[0].t <= 0) avisos.shift();
}

function contar(chave, n = 1) {
  meta.contadores[chave] = (meta.contadores[chave] || 0) + n;
  salvarMeta();
  return meta.contadores[chave];
}

function desbloquear(id) {
  if (meta.conquistas[id]) return;
  const c = CONQUISTAS.find(x => x.id === id);
  if (!c) return;
  meta.conquistas[id] = true;
  let premio = '';
  if (c.almas) { meta.almas += c.almas; premio = `+${c.almas} almas`; }
  if (c.skin) premio = `Nova skin desbloqueada: ${SKINS[c.skin].nome}`;
  salvarMeta();
  avisar(`Conquista: ${c.nome}`, premio, '#ffe14d');
  fanfarra([784, 1046, 1318, 1568], 0.04);
}

// ---------------------------------------------------------------------
//  Coleção
// ---------------------------------------------------------------------
const ITENS_COLECAO = ITENS.filter(i => !i.inicial).sort((a, b) =>
  ['arma', 'armadura', 'amuleto'].indexOf(a.tipo) - ['arma', 'armadura', 'amuleto'].indexOf(b.tipo) ||
  RARIDADES[a.r].ordem - RARIDADES[b.r].ordem);

function registrarItem(it) {
  if (!it || it.inicial) return;
  const nome = it.nomeBase || it.nome;
  if (!meta.colecao[nome]) {
    meta.colecao[nome] = true;
    salvarMeta();
  }
  if (it.r === 'mitico') desbloquear('mitico');
  if (it.r === 'lendario') desbloquear('lendario');
  if (Object.keys(meta.colecao).length >= 25) desbloquear('colecao');
}

// ---------------------------------------------------------------------
//  Almas
// ---------------------------------------------------------------------
function calcularAlmas() {
  const base = andar * 3 + Math.floor(J.kills / 4) + (J.bossesMortos || 0) * 15;
  return Math.max(1, Math.round(base * (dif().almas || 1) * (1 + calorAtual() * 0.1)));
}

function comprarMelhoriaAlma(m) {
  const nv = nMeta(m.id);
  if (nv >= m.max) return 'max';
  const custo = m.custo[nv];
  if (meta.almas < custo) return 'pobre';
  meta.almas -= custo;
  meta.melhorias[m.id] = nv + 1;
  salvarMeta();
  return 'ok';
}

// ---------------------------------------------------------------------
//  Ecrãs do menu: Altar das Almas, Coleção e Conquistas
// ---------------------------------------------------------------------
const BOTAO_VOLTAR = { x: 20, y: 14, w: 120, h: 38 };
let menuMeta = null; // { t, sel, msg }

function abrirMenuMeta(qual) {
  menuMeta = { t: 0, sel: 0, msg: null };
  estado = qual;
}

function retAlma(i) { return { x: 40 + (i % 3) * 300, y: 118 + Math.floor(i / 3) * 158, w: 280, h: 144 }; }
const COLUNAS_COLECAO = 16; // 16 por linha: cabem todos os itens por cima do painel do item
function retColecao(i) { return { x: 48 + (i % COLUNAS_COLECAO) * 54, y: 92 + Math.floor(i / COLUNAS_COLECAO) * 50, w: 48, h: 46 }; }

function atualizarMenuMeta(dt) {
  menuMeta.t += dt;
  if (menuMeta.msg) { menuMeta.msg.t -= dt; if (menuMeta.msg.t <= 0) menuMeta.msg = null; }
  if (menuMeta.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = 'titulo'; menuMeta = null; return; }
  if (estado === 'almas') {
    MELHORIAS_ALMA.forEach((m, i) => {
      if (dentro(retAlma(i))) menuMeta.sel = i;
      if (!(premiu(String(i + 1)) || clicou(retAlma(i)))) return;
      menuMeta.sel = i;
      const r = comprarMelhoriaAlma(m);
      if (r === 'ok') { menuMeta.msg = { txt: `${m.nome} subiu para nível ${nMeta(m.id)}!`, cor: m.cor, t: 2 }; fanfarra([523, 659, 784], 0.04); }
      else if (r === 'pobre') { menuMeta.msg = { txt: 'Não tens almas suficientes. Joga mais partidas!', cor: '#ff6060', t: 2 }; som(140, 0.2, 'square', 0.04); }
      else menuMeta.msg = { txt: 'Já está no nível máximo', cor: '#aaa', t: 2 };
    });
  } else if (estado === 'colecao') {
    if (atualizarColecaoExtra()) return; // abas Monstros e Relíquias
    ITENS_COLECAO.forEach((it, i) => { if (dentro(retColecao(i)) || clicou(retColecao(i))) menuMeta.sel = i; });
    const n = ITENS_COLECAO.length;
    if (premiu('d', 'arrowright')) menuMeta.sel = (menuMeta.sel + 1) % n;
    if (premiu('a', 'arrowleft')) menuMeta.sel = (menuMeta.sel + n - 1) % n;
    if (premiu('s', 'arrowdown')) menuMeta.sel = Math.min(n - 1, menuMeta.sel + COLUNAS_COLECAO);
    if (premiu('w', 'arrowup')) menuMeta.sel = Math.max(0, menuMeta.sel - COLUNAS_COLECAO);
  }
}
