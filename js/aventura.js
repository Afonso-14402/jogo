'use strict';
// =====================================================================
//  AVENTURA: conjuntos de equipamento, pets que evoluem, eventos nos
//  andares, mapa grande, efeitos (câmara lenta e clarão), Boss Rush e o
//  código para passar o progresso para outro aparelho.
// =====================================================================

// ---------------------------------------------------------------------
//  Conjuntos de equipamento (2 ou 3 peças do mesmo conjunto dão bónus)
// ---------------------------------------------------------------------
const CONJUNTOS = {
  draconico: { nome: 'Conjunto Dracónico', cor: '#ff7b25', pecas: ['Espada Dracónica', 'Couraça Dracónica', 'Olho Dracónico'],
    b2: { danoPct: 0.15 }, b3: { hpPct: 0.1, queimar: true }, d2: '+15% dano', d3: '+10% vida e os golpes queimam' },
  crepusculo: { nome: 'Conjunto do Crepúsculo', cor: '#b48cff', pecas: ['Adaga do Crepúsculo', 'Manto do Crepúsculo', 'Anel do Crepúsculo'],
    b2: { crit: 0.08 }, b3: { velAtaque: 0.25, vel: 0.1 }, d2: '+8% crítico', d3: '+25% vel. de ataque e +10% velocidade' },
  serafico: { nome: 'Conjunto Seráfico', cor: '#fff0a0', pecas: ['Lança Seráfica', 'Armadura Seráfica', 'Auréola Seráfica'],
    b2: { hpPct: 0.15 }, b3: { regen: 3, cura: 0.2 }, d2: '+15% vida', d3: '+3 vida/s e poções +20%' },
};
const conjuntoDe = it => it && Object.keys(CONJUNTOS).find(k => CONJUNTOS[k].pecas.includes(it.nomeBase || it.nome));
const pecasConjunto = k => ['arma', 'armadura', 'amuleto'].filter(t => conjuntoDe(J[t]) === k).length;

function bonusConjuntos() {
  const b = { danoPct: 0, hpPct: 0, crit: 0, velAtaque: 0, vel: 0, regen: 0, cura: 0, queimar: false };
  if (!J) return b;
  for (const k in CONJUNTOS) {
    const n = pecasConjunto(k), C = CONJUNTOS[k];
    for (const [min, B] of [[2, C.b2], [3, C.b3]]) if (n >= min) for (const x in B) b[x] = typeof B[x] === 'boolean' ? B[x] : b[x] + B[x];
  }
  return b;
}
// Linhas extra na carta de um item de conjunto
function linhasConjunto(it) {
  const k = conjuntoDe(it);
  if (!k) return [];
  const C = CONJUNTOS[k], n = J ? pecasConjunto(k) : 0;
  return [`${C.nome} (${n}/3)`, `2 peças: ${C.d2}`, `3 peças: ${C.d3}`];
}

// ---------------------------------------------------------------------
//  Pets que evoluem no nível 10
// ---------------------------------------------------------------------
const PETS_EVOLUIDOS = { lobo: 'Lobo Alfa', fada: 'Fada Rainha', dragao: 'Dragão Jovem', gato: 'Gato de Guerra', coruja: 'Coruja Anciã', rochinha: 'Rocha Titã', fenix: 'Fénix Solar' };
const NIVEL_EVO_PET = 10;
const petEvoluido = () => !!(J && J.pet && J.pet.nivel >= NIVEL_EVO_PET);
const nomePet = () => (petEvoluido() ? PETS_EVOLUIDOS[J.pet.tipo] : PETS[J.pet.tipo].nome);
function verEvolucaoPet(antes) {
  if (antes < NIVEL_EVO_PET && J.pet.nivel >= NIVEL_EVO_PET) {
    mostrarBanner(`${PETS[J.pet.tipo].nome} EVOLUIU!`, `Agora é ${PETS_EVOLUIDOS[J.pet.tipo]}: +60% dano e mais forte`, PETS[J.pet.tipo].cor);
    if (pet) explosao(pet.x, pet.y, PETS[J.pet.tipo].cor, 40, 240, 6);
    fanfarra([523, 659, 784, 1046, 1318], 0.05);
    desbloquear('petEvo');
  }
}

// ---------------------------------------------------------------------
//  Eventos aleatórios nos andares
// ---------------------------------------------------------------------
const EVENTOS = {
  mercador: 'Um mercador ambulante está à tua espera perto da entrada.',
  chuvaOuro: 'Chuva de ouro! Há moedas espalhadas por todo o andar.',
  escuro: 'Andar escuro: quase não se vê nada, mas os monstros dão +50% XP.',
  luaSangue: 'Lua de sangue: os monstros fazem +30% dano, mas dão +50% XP e ouro.',
  bencao: 'Bênção da deusa: neste andar recuperas vida aos poucos.',
};
function sortearEvento() {
  if (!J || J.modo === 'torre' || J.modo === 'bossrush' || andar < 3 || mapa.eBoss || Math.random() > 0.25) return;
  const ev = escolher(Object.keys(EVENTOS));
  mapa.evento = ev;
  if (ev === 'mercador') {
    const p = pontoLivreNaSala(mapa, mapa.salaInicio, 20, 1);
    objetos.push({ tipo: 'mercador', sala: mapa.salaInicio, stock: null, x: p.x, y: p.y });
  } else if (ev === 'chuvaOuro') {
    for (let k = 0; k < 14; k++) {
      const p = pontoLivreNaSala(mapa, escolher(mapa.salas), 10, 1);
      soltarOuro(p.x, p.y, Math.round(rand(8, 16) * (1 + andar * 0.25)), 1);
    }
  } else if (ev === 'escuro') {
    for (const e of inimigos) e.xp = Math.round(e.xp * 1.5);
  } else if (ev === 'luaSangue') {
    for (const e of inimigos) { e.dano = Math.round(e.dano * 1.3); e.xp = Math.round(e.xp * 1.5); e.ouroExtra = 1.5; }
  }
  falar('sistema', EVENTOS[ev]);
  registar('evento');
}
function atualizarEvento(dt) {
  if (mapa.evento === 'bencao' && J.hp > 0) J.hp = Math.min(S.maxHp, J.hp + S.maxHp * 0.01 * dt);
}
const escuridaoEvento = () => (mapa.evento === 'escuro' ? 0.975 : null);

// ---------------------------------------------------------------------
//  Efeitos: câmara lenta e clarão
// ---------------------------------------------------------------------
let camLenta = 0, flashEcra = 0;
function efeitoBossMorto() { camLenta = 1.4; flashEcra = 0.7; }
function efeitoGolpeForte() { flashEcra = Math.max(flashEcra, 0.18); }
const ritmoJogo = () => (impacto > 0 ? 0.08 : camLenta > 0 ? 0.3 : 1);
function atualizarEfeitosEcra(dt) {
  if (impacto > 0) impacto -= dt;
  if (camLenta > 0) camLenta -= dt;
  if (flashEcra > 0) flashEcra -= dt * 1.5;
}
function desenharClarao() {
  if (luaDeSangue()) { ctx.fillStyle = 'rgba(120,0,0,0.08)'; ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA); }
  if (flashEcra <= 0) return;
  ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, flashEcra)})`;
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
}
const luaDeSangue = () => !!(mapa && mapa.evento === 'luaSangue' && ['jogo', 'pausa'].includes(estado));

// ---------------------------------------------------------------------
//  Os monstros que morrem desfazem-se (piscam a branco, esticam e somem)
// ---------------------------------------------------------------------
let restos = [];
function guardarResto(e) {
  try {
    const s = spriteInimigo(e, tempoJogo);
    restos.push({ c: s.c, x: e.x, y: e.y + (s.y || 0), flip: !!s.flip, t: e.boss ? 1.2 : 0.45, dur: e.boss ? 1.2 : 0.45, boss: e.boss, cor: e.cor });
    if (restos.length > 40) restos.shift();
  } catch (erro) { /* sprite especial: sem animação de morte */ }
}
function atualizarRestos(dt) {
  for (const r of restos) r.t -= dt;
  restos = restos.filter(r => r.t > 0);
}
function desenharResto(r) {
  const k = r.t / r.dur, h = r.c.height * ESCALA, pe = r.y + h / 2;
  ctx.save();
  ctx.translate(r.x, pe);
  ctx.scale(1 + (1 - k) * 0.5, k);
  ctx.translate(-r.x, -pe);
  ctx.globalAlpha = k;
  spr(r.c, r.x, r.y, r.flip);
  ctx.globalAlpha = k * (Math.floor(r.t * 20) % 2 ? 0.9 : 0.5);
  spr(silhueta(r.c, k > 0.5 ? '#ffffff' : r.cor), r.x, r.y, r.flip);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Mapa grande (Tab, ou tocar no minimapa)
// ---------------------------------------------------------------------
function retMinimapa() {
  const esc = 3, w = mapa.W * esc, h = mapa.H * esc;
  return { x: LARGURA + MARGEM_X - w - 22, y: 10, w: w + 12, h: h + 40 };
}
function atualizarMapaGrande() {
  if (premiu('tab', 'escape', 'rato')) { estado = 'jogo'; rato.baixo = false; }
}
function desenharMapaGrande() {
  ctx.fillStyle = 'rgba(4,3,8,0.96)';
  ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
  const esc = Math.floor(Math.min(880 / mapa.W, 540 / mapa.H)), w = mapa.W * esc, h = mapa.H * esc;
  const x0 = Math.round(LARGURA / 2 - w / 2), y0 = Math.round(66 + (540 - h) / 2);
  textoCentro(naCidade() ? 'CIDADE DOS CAÇADORES' : `ANDAR ${andar} · ${NOMES_ZONAS[zonaAtual()]}`, LARGURA / 2, 34, 24, '#ffe14d');
  for (let y = 0; y < mapa.H; y++) for (let x = 0; x < mapa.W; x++) {
    const i = y * mapa.W + x;
    if (!mapa.explorado[i]) continue;
    ctx.fillStyle = mapa.tiles[i] ? 'rgba(200,190,230,0.45)' : 'rgba(90,80,120,0.5)';
    ctx.fillRect(x0 + x * esc, y0 + y * esc, esc, esc);
  }
  for (const s of mapa.salas) {
    if (!s.tipo || !mapa.explorado[(s.y + 1) * mapa.W + s.x + 1]) continue;
    ctx.globalAlpha = 0.35; ctx.fillStyle = SALAS_ESPECIAIS[s.tipo].cor;
    ctx.fillRect(x0 + s.x * esc, y0 + s.y * esc, s.w * esc, s.h * esc); ctx.globalAlpha = 1;
  }
  const vis = (px, py) => mapa.explorado[Math.floor(py / TILE) * mapa.W + Math.floor(px / TILE)];
  const ponto = (px, py, cor, tam) => { ctx.fillStyle = cor; ctx.fillRect(Math.round(x0 + px / TILE * esc - tam / 2), Math.round(y0 + py / TILE * esc - tam / 2), tam, tam); };
  const legenda = [];
  if (vis(mapa.escada.x, mapa.escada.y)) { ponto(mapa.escada.x, mapa.escada.y, mapa.escada.ativa ? '#ffe680' : '#ff5050', 12); legenda.push(['#ffe680', 'Escada']); }
  for (const b of baus) if (vis(b.x, b.y)) ponto(b.x, b.y, b.tipo === 'ouro' ? '#ffd23f' : '#c98a4a', 8);
  if (baus.length) legenda.push(['#c98a4a', 'Baús']);
  for (const o of objetos) {
    if (o.tipo === 'portal') { ponto(o.x, o.y, o.vermelho ? '#ff2a2a' : RANKS_PORTAL[o.gi].cor, 14); continue; }
    if (vis(o.x, o.y)) ponto(o.x, o.y, '#9fdcff', 10);
  }
  if (objetos.some(o => o.tipo === 'portal')) legenda.push(['#ff4dff', 'Portais']);
  for (const e of inimigos) if (!e.morto && vis(e.x, e.y) && Math.hypot(e.x - J.x, e.y - J.y) < 500) ponto(e.x, e.y, e.boss ? '#ff4040' : '#ff8080', e.boss ? 12 : 5);
  ponto(J.x, J.y, '#5da8ff', 12);
  legenda.push(['#5da8ff', 'Tu'], ['#ff8080', 'Monstros perto']);
  legenda.forEach(([c, n], i) => { ctx.fillStyle = c; ctx.fillRect(40 + i * 150, ALTURA - 30, 12, 12); textoEsq(n, 58 + i * 150, ALTURA - 24, 13, '#ccc', 'normal'); });
  textoDir(modoToque ? 'Toca para fechar' : 'Tab / Esc para fechar', LARGURA - 30, ALTURA - 24, 12, '#777', 'normal');
}

// ---------------------------------------------------------------------
//  Boss Rush: os 8 bosses seguidos, contra o relógio
// ---------------------------------------------------------------------
function andarBossRush() { // no Boss Rush só há andares de boss
  andar = Math.ceil(andar / 5) * 5;
  if (J.hp > 0) J.hp = Math.min(S.maxHp, J.hp + S.maxHp * 0.3); // recupera um pouco entre bosses
}
function bossRushVencido() {
  if (J.modo !== 'bossrush' || andar < BOSSES.length * 5) return false;
  J.venceuRush = true;
  const t = Math.round(tempoJogo);
  J.recordeRush = !meta.bossRush || t < meta.bossRush;
  meta.bossRush = Math.min(meta.bossRush || Infinity, t);
  desbloquear('bossrush');
  salvarMeta();
  setTimeout(() => { if (J && J.venceuRush && estado === 'jogo') morrer(true); }, 2500);
  mostrarBanner('BOSS RUSH COMPLETO!', `Tempo: ${relogioRush(t)}`, '#ffe14d');
  return true;
}
const relogioRush = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------------------------------------------------------------------
//  Código de transferência (passar o progresso para outro aparelho)
// ---------------------------------------------------------------------
const CHAVES_TRANSFERIR = ['masmorra_meta', 'masmorra_save', 'masmorra_opcoes', 'masmorra_personagem', 'masmorra_recorde', 'masmorra_idioma', 'masmorra_som'];
const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s); };
const deB64 = txt => Uint8Array.from(atob(txt), c => c.charCodeAt(0));
async function transformar(bytes, tipo) {
  const s = new Blob([bytes]).stream().pipeThrough(tipo === 'c' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

async function gerarCodigo() {
  guardarSeAJogar();
  const d = {};
  for (const k of CHAVES_TRANSFERIR) { const v = localStorage.getItem(k); if (v != null) d[k] = v; }
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  if (typeof CompressionStream === 'function') return 'MDZ' + b64(await transformar(bytes, 'c'));
  return 'MDJ' + b64(bytes);
}
async function lerCodigo(txt) {
  txt = (txt || '').replace(/\s+/g, '');
  let bytes;
  if (txt.startsWith('MDZ')) bytes = await transformar(deB64(txt.slice(3)), 'd');
  else if (txt.startsWith('MDJ')) bytes = deB64(txt.slice(3));
  else throw new Error('código inválido');
  const d = JSON.parse(new TextDecoder().decode(bytes));
  if (!d || typeof d !== 'object' || !d.masmorra_meta) throw new Error('código inválido');
  return d;
}

let transfUI = null;
const BOTOES_TRANSF = { copiar: { x: 230, y: 250, w: 500, h: 56 }, colar: { x: 230, y: 330, w: 500, h: 56 } };
function abrirTransferir() { transfUI = { t: 0, msg: null }; estado = 'transferir'; }

async function copiarCodigo() {
  try {
    const c = await gerarCodigo();
    try { await navigator.clipboard.writeText(c); transfUI.msg = { txt: `Código copiado! (${c.length} letras) Cola-o no outro aparelho.`, cor: '#5dff7a' }; }
    catch (e) { prompt(traduzir('Copia este código:'), c); transfUI.msg = { txt: 'Copia o código que apareceu.', cor: '#5dff7a' }; }
  } catch (e) { transfUI.msg = { txt: 'Não foi possível criar o código.', cor: '#ff6060' }; }
}
async function colarCodigo() {
  const txt = prompt(traduzir('Cola aqui o código do outro aparelho (substitui o progresso deste):'));
  if (!txt) return;
  try {
    const d = await lerCodigo(txt);
    for (const k of CHAVES_TRANSFERIR) { if (d[k] != null) localStorage.setItem(k, d[k]); else localStorage.removeItem(k); }
    transfUI.msg = { txt: 'Progresso carregado! A recomeçar o jogo...', cor: '#5dff7a' };
    setTimeout(() => location.reload(), 900);
  } catch (e) { transfUI.msg = { txt: 'Esse código não é válido.', cor: '#ff6060' }; }
}

function atualizarTransferir(dt) {
  transfUI.t += dt;
  if (transfUI.t < 0.1) return;
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) { estado = 'titulo'; transfUI = null; return; }
  if (premiu('1') || clicou(BOTOES_TRANSF.copiar)) { rato.baixo = false; copiarCodigo(); }
  else if (premiu('2') || clicou(BOTOES_TRANSF.colar)) { rato.baixo = false; colarCodigo(); }
}
function desenharTransferir() {
  botao(BOTAO_VOLTAR, '< Voltar', '#aaa');
  textoCentro('TRANSFERIR PROGRESSO', LARGURA / 2, 60, 30, '#4dc3ff');
  textoCentro('Passa as tuas almas, conquistas, coleção e o jogo guardado para outro aparelho.', LARGURA / 2, 110, 14, '#ccc', false);
  textoCentro('No aparelho antigo copia o código; no novo cola-o.', LARGURA / 2, 136, 14, '#ccc', false);
  botao(BOTOES_TRANSF.copiar, modoToque ? 'Copiar o meu código' : '1: Copiar o meu código', '#5dff7a');
  botao(BOTOES_TRANSF.colar, modoToque ? 'Colar um código' : '2: Colar um código', '#ffe14d');
  textoCentro('Atenção: colar um código substitui o progresso deste aparelho.', LARGURA / 2, 420, 13, '#ff8080', false);
  if (transfUI.msg) textoCentro(transfUI.msg.txt, LARGURA / 2, 470, 16, transfUI.msg.cor);
}
