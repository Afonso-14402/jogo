'use strict';
// =====================================================================
//  ECRÃS EXTRA: Altar das Almas, Coleção, Conquistas, Mochila,
//  controlos de toque, avisos e o companheiro
// =====================================================================

// ---------------------------------------------------------------------
//  Companheiro (desenhado no buffer do mundo)
// ---------------------------------------------------------------------
function desenharPet(t) {
  const tipo = J.pet.tipo, frames = SPR.pet[tipo];
  const voa = !!PETS[tipo].voa;
  const c = frames[voa ? Math.floor(t * 8) % frames.length : 0];
  sombra(pet.x, pet.y + (voa ? 28 : 10), voa ? 6 : 9);
  const y = pet.y + (voa ? 0 : (pet.andando ? -Math.abs(Math.sin(t * 14)) * 3 : 0));
  spr(c, pet.x, y, pet.dir < 0);
}

// ---------------------------------------------------------------------
//  Avisos (conquistas)
// ---------------------------------------------------------------------
function desenharAvisos() {
  const a = avisos[0];
  if (!a) return;
  ctx.globalAlpha = clamp(Math.min(a.t, 4 - a.t) * 3, 0, 1);
  const w = 360, x = (LARGURA - w) / 2, y = 70;
  painel(x, y, w, 46, 'rgba(24,18,8,0.96)', a.cor);
  textoCentro(a.titulo, LARGURA / 2, y + 15, 15, a.cor);
  if (a.sub) textoCentro(a.sub + (avisos.length > 1 ? `   (+${avisos.length - 1})` : ''), LARGURA / 2, y + 33, 11, '#ddd', false);
  ctx.globalAlpha = 1;
}

function desenharAvisoRodar() {
  if (!modoToque || innerHeight <= innerWidth) return;
  painel(180, ALTURA / 2 - 40, 600, 80, 'rgba(20,14,30,0.97)', '#ffe14d');
  textoCentro('Roda o telemóvel', LARGURA / 2, ALTURA / 2 - 12, 26, '#ffe14d');
  textoCentro('O jogo fica muito melhor na horizontal', LARGURA / 2, ALTURA / 2 + 18, 14, '#ddd', false);
}

// ---------------------------------------------------------------------
//  Controlos de toque
// ---------------------------------------------------------------------
let iconeMochila = null;

function circuloEcra(x, y, r, fundo, borda, largura = 3) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fundo;
  ctx.fill();
  ctx.lineWidth = largura;
  ctx.strokeStyle = borda;
  ctx.stroke();
}

function desenharControlosToque(t) {
  if (estado !== 'jogo') return;
  // joystick
  const vis = VISIBILIDADES[opcoes.visibilidade] / 0.7; // 1 = normal
  const alfa = a => { ctx.globalAlpha = Math.min(1, a * vis); };
  const j = toque.joy, c0 = centroJoystick();
  const cx = j ? j.cx : c0.x, cy = j ? j.cy : c0.y;
  alfa(j ? 0.6 : 0.3);
  circuloEcra(cx, cy, RAIO_JOYSTICK, 'rgba(20,16,32,0.5)', '#cfc6e0', 3);
  circuloEcra(j ? j.x : cx, j ? j.y : cy, 24, 'rgba(207,198,224,0.6)', '#ffffff', 2);
  ctx.globalAlpha = 1;

  const carregados = Object.values(toque.botoes).map(b => b.id);
  const podeUsar = J.bauPerto || J.objPerto || (J.escadaPerto && mapa.escada.ativa);
  for (const b of botoesToque()) {
    const on = carregados.includes(b.id) || (b.id === 'atacar' && toque.atacar);
    let borda = '#cfc6e0';
    if (b.feitico) borda = FEITICOS[b.feitico].cor;
    if (b.id === 'atacar') borda = RARIDADES[J.arma.r].cor;
    if (b.id === 'usar' && podeUsar) borda = '#ffe14d';
    alfa(on ? 0.95 : 0.7);
    circuloEcra(b.x, b.y, b.r, on ? 'rgba(80,70,110,0.7)' : 'rgba(14,11,22,0.55)', borda, b.id === 'usar' && podeUsar ? 4 : 3);
    alfa(1);
    if (b.id === 'atacar') sprEcra(iconeItem(J.arma), b.x, b.y, b.r > 62 ? 5 : 4);
    else if (b.id === 'dash') {
      textoCentro('»»', b.x, b.y, 22, J.cdDash <= 0 ? '#78aaff' : '#556');
    } else if (b.id === 'pocao') {
      sprEcra(SPR.pocao, b.x, b.y - 2, 3);
      textoCentro(`${J.pocoes}`, b.x + 16, b.y + 16, 13, '#fff');
    } else if (b.id === 'usar') {
      textoCentro('USAR', b.x, b.y, 13, podeUsar ? '#ffe14d' : '#888');
    } else if (b.feitico) {
      const nv = J.feiticos[b.feitico] || 0;
      if (!nv) { textoCentro('?', b.x, b.y, 16, '#666', false); continue; }
      alfa(J.mana < custoMana(b.feitico) ? 0.35 : 1);
      sprEcra(SPR.feitico[b.feitico], b.x, b.y, 2);
      alfa(1);
      const cd = J.cdFeitico[b.feitico] || 0;
      if (cd > 0) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(cd / FEITICOS[b.feitico].cd, 0, 1));
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fill();
      }
      textoCentro(`${custoMana(b.feitico)}`, b.x + 14, b.y + 18, 10, '#c9b0ff');
    } else if (b.id === 'pausa') {
      ctx.fillStyle = '#cfc6e0';
      ctx.fillRect(b.x - 8, b.y - 9, 5, 18);
      ctx.fillRect(b.x + 3, b.y - 9, 5, 18);
    } else if (b.id === 'personagem') {
      sprEcra(framesHeroi(J.raca, J.skin)[0], b.x, b.y, 2);
    } else if (b.id === 'mochila') {
      if (!iconeMochila) iconeMochila = gerarIcone('saco', '#c9a15a');
      sprEcra(iconeMochila, b.x, b.y, 2);
    }
  }
  if (J.dashT <= 0 && J.cdDash > 0) {
    const b = botoesToque().find(x => x.id === 'dash');
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(J.cdDash / S.cdDash, 0, 1));
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  desenharTutorial(t);
}

// ---------------------------------------------------------------------
//  Mochila
// ---------------------------------------------------------------------
function slotItem(r, it, sel, vazio) {
  painel(r.x, r.y, r.w, r.h, sel ? 'rgba(44,38,66,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffffff' : it ? RARIDADES[it.r].cor : '#3a3150');
  if (!it) { textoCentro(vazio, r.x + r.w / 2, r.y + r.h / 2, 12, '#555', false); return; }
  desenharIcone(it, r.x + r.w / 2, r.y + r.h / 2 - 6, 48);
  if (it.enc) textoCentro(`+${it.enc}`, r.x + r.w - 16, r.y + 14, 12, '#d9a6ff');
  if (it.maldicao) { ctx.fillStyle = '#ff5ce0'; ctx.fillRect(r.x + 8, r.y + 8, 8, 8); }
  textoCentroAjustado(it.nomeBase || it.nome, r.x + r.w / 2, r.y + r.h - 14, 11, RARIDADES[it.r].cor, r.w - 8, false);
}

function desenharMochila() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  if (!iconeMochila) iconeMochila = gerarIcone('saco', '#c9a15a');
  sprEcra(iconeMochila, 58, 44, 3);
  textoEsq('Mochila', 90, 44, 28, '#ffd9a0');
  sprEcra(SPR.moeda, LARGURA - 190, 44, 5);
  textoEsq(`${J.ouro} ouro`, LARGURA - 168, 44, 24, '#ffd23f');

  textoEsq('Equipado', 40, 88, 14, '#aaa');
  SLOTS_EQUIP.forEach((k, i) => slotItem({ x: 40 + i * 110, y: 100, w: 100, h: 100 }, J[k], false, NOME_TIPO[k]));
  textoEsq(`Na mochila (${J.mochila.length}/${TAMANHO_MOCHILA})`, 40, 240, 14, '#aaa');
  for (let i = 0; i < TAMANHO_MOCHILA; i++) slotItem(retMochila(i), J.mochila[i], mochilaUI.sel === i && !!J.mochila[i], 'vazio');

  const it = J.mochila[mochilaUI.sel];
  if (it) {
    desenharCartaItem(it, 400, 88, 'NA MOCHILA');
    const atual = J[it.tipo];
    if (atual) desenharCartaItem(atual, 660, 88, 'EQUIPADO AGORA');
    botao(BOTOES_MOCHILA.equipar, modoToque ? 'Equipar' : '[E] Equipar', '#5dff7a');
    botao(BOTOES_MOCHILA.vender, `${modoToque ? '' : '[X] '}Vender +${valorVenda(it)}`, '#ffd23f');
  } else {
    textoCentro('A mochila está vazia.', 640, 260, 16, '#888', false);
    textoCentro('Quando abrires um baú, escolhe "Mochila" para guardar o item.', 640, 286, 13, '#777', false);
  }
  if (mochilaUI.msg) textoCentro(mochilaUI.msg.txt, 460, 580, 15, mochilaUI.msg.cor);
  if (!modoToque) textoCentro('1-6: escolher  ·  E: equipar  ·  X: vender  ·  I / Esc: fechar', 400, ALTURA - 16, 12, '#888', false);
  botao(BOTAO_FECHAR, 'Fechar', '#ff8080');
}

// ---------------------------------------------------------------------
//  Menus do título: Altar das Almas, Coleção, Conquistas
// ---------------------------------------------------------------------
function desenharMenuMeta(t) {
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  if (estado === 'almas') {
    textoCentro('ALTAR DAS ALMAS', LARGURA / 2, 34, 30, '#b48cff');
    textoCentro(`Tens ${meta.almas} almas  ·  Ganhas almas quando morres ou desistes (mais em dificuldades altas)`, LARGURA / 2, 72, 13, '#aaa', false);
    textoCentro('As melhorias são permanentes e valem para todas as partidas novas', LARGURA / 2, 92, 12, '#888', false);
    MELHORIAS_ALMA.forEach((m, i) => {
      const r = retAlma(i), nv = nMeta(m.id), maxd = nv >= m.max, custo = maxd ? 0 : m.custo[nv];
      const sel = menuMeta.sel === i;
      painel(r.x, r.y, r.w, r.h, sel ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', sel ? m.cor : '#3a3150');
      iconePerk({ cor: m.cor, letra: m.letra }, r.x + 34, r.y + 40, 20);
      textoEsq(`${i + 1}. ${m.nome}`, r.x + 64, r.y + 26, 16, m.cor);
      textoEsq(m.desc, r.x + 64, r.y + 50, 12, '#ddd', 'normal');
      for (let k = 0; k < m.max; k++) {
        ctx.fillStyle = k < nv ? m.cor : '#2e2640';
        ctx.fillRect(r.x + 64 + k * 20, r.y + 70, 16, 10);
      }
      if (maxd) textoEsq('NÍVEL MÁXIMO', r.x + 18, r.y + r.h - 24, 13, '#aaa');
      else textoEsq(`Comprar: ${custo} almas`, r.x + 18, r.y + r.h - 24, 14, meta.almas >= custo ? '#b48cff' : '#ff6060');
    });
    if (menuMeta.msg) textoCentro(menuMeta.msg.txt, LARGURA / 2, 606, 16, menuMeta.msg.cor);
  } else if (estado === 'colecao') {
    textoCentro('COLEÇÃO', LARGURA / 2, 28, 28, '#ffd23f');
    desenharAbasColecao();
    if (desenharColecaoExtra()) return;
    ITENS_COLECAO.forEach((it, i) => {
      const r = retColecao(i), tem = meta.colecao[it.nome], sel = menuMeta.sel === i;
      painel(r.x, r.y, r.w, r.h, sel ? 'rgba(44,38,66,0.97)' : 'rgba(18,14,28,0.95)', sel ? '#ffffff' : tem ? RARIDADES[it.r].cor : '#2e2640');
      const c = iconeItem(it);
      if (tem) sprEcra(c, r.x + r.w / 2, r.y + r.h / 2, 3);
      else {
        sprEcra(silhueta(c, '#2a2238'), r.x + r.w / 2, r.y + r.h / 2, 3);
        textoCentro('?', r.x + r.w / 2, r.y + r.h / 2, 16, '#555', false);
      }
    });
    const it = ITENS_COLECAO[menuMeta.sel];
    if (it) {
      const tem = meta.colecao[it.nome], info = RARIDADES[it.r];
      painel(160, 400, 640, 200, 'rgba(14,11,22,0.96)', tem ? info.cor : '#3a3150');
      if (tem) {
        desenharIcone(it, 230, 470, 64);
        textoEsq(it.nome, 300, 432, 20, info.cor);
        textoEsq(`${info.nome} · ${NOME_TIPO[it.tipo]}`, 300, 456, 12, '#bbb', 'normal');
        linhasItem(it).forEach((l, k) => textoEsq(l, 300 + (k % 2) * 220, 486 + Math.floor(k / 2) * 20, 13, '#eee', 'normal'));
        textoEsq(`"${it.desc}"`, 300, 572, 12, '#999', 'normal');
      } else {
        sprEcra(silhueta(iconeItem(it), '#2a2238'), 230, 470, 4);
        textoEsq('???', 300, 440, 22, '#777');
        textoEsq(`Ainda não encontraste este item (${info.nome})`, 300, 474, 13, '#999', 'normal');
        textoEsq('Abre baús, compra na loja ou vence bosses para o descobrir.', 300, 500, 12, '#777', 'normal');
      }
    }
    if (!modoToque) textoCentro('Setas ou rato para ver cada item  ·  Esc: voltar', LARGURA / 2, 620, 12, '#777', false);
  } else {
    const n = Object.keys(meta.conquistas).length;
    textoCentro('CONQUISTAS', LARGURA / 2, 34, 30, '#ffe14d');
    textoCentro(`${n} de ${CONQUISTAS.length} desbloqueadas`, LARGURA / 2, 70, 14, '#aaa', false);
    CONQUISTAS.forEach((c, i) => { // 3 colunas para caberem todas
      const x = 16 + (i % 3) * 312, y = 88 + Math.floor(i / 3) * 45, w = 304, h = 41;
      const tem = meta.conquistas[c.id];
      painel(x, y, w, h, tem ? 'rgba(40,34,14,0.95)' : 'rgba(18,14,28,0.95)', tem ? '#ffe14d' : '#3a3150');
      iconePerk({ cor: tem ? '#ffe14d' : '#4a4060', letra: tem ? '+' : '?' }, x + 20, y + h / 2, 13);
      const premio = c.almas ? `+${c.almas} almas` : `Skin ${SKINS[c.skin].nome}`;
      textoDir(premio, x + w - 8, y + 13, 10, tem ? '#b48cff' : '#666');
      textoEsq(c.nome, x + 40, y + 12, 12, tem ? '#ffe14d' : '#bbb');
      ctx.font = fonte(11, 'normal');
      const larg = ctx.measureText(traduzir(c.desc)).width;
      textoEsq(c.desc, x + 40, y + 29, larg > w - 50 ? 9 : 11, tem ? '#ddd' : '#888', 'normal');
    });
  }
}
