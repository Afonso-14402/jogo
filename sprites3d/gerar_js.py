"""Gera js/sprites_hd.js com todos os sprites HD embutidos (o jogo continua sem ficheiros de imagem).

    python3 gerar_js.py            (lê s32/heroi_folha.png e hd/*.png + hd/*.json)

Cada sprite de hd/ substitui o SPR[nome] antigo com o mesmo formato (lista de frames
ou um canvas só). "bau.ouro" substitui SPR.bau.ouro.
"""
import base64, glob, json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()

entradas = []
for png in sorted(glob.glob(os.path.join(AQUI, 'hd', '*.png'))):
    nome = os.path.basename(png)[:-4]
    m = json.load(open(png[:-4] + '.json'))
    n = sum(c for _, c in m['anims'].values())
    entradas.append(f"  ['{nome}', {m['w']}, {m['h']}, {n}, '{b64(png)}'],")

js = """'use strict';
// =====================================================================
//  SPRITES HD
//  Feitos em 3D no Blender e convertidos em pixel art (ver sprites3d/).
//  Têm o dobro dos pixels dos antigos: ficam do mesmo tamanho no ecrã,
//  com o dobro do detalhe (o mundo é desenhado com DETALHE vezes mais pixels).
//  Cada canvas HD tem c.hd = true; spr() e sprEcra() tratam do tamanho.
//  Enquanto as imagens não carregam (ou se falharem) fica o sprite antigo.
// =====================================================================
const HD_PX = 2; // pixels de um sprite HD por pixel antigo
// Resolução do mundo: 2 = alta (os sprites HD mostram todo o detalhe), 1 = normal (mais leve, para telemóveis fracos)
let DETALHE = (() => { try { const o = JSON.parse(localStorage.getItem('masmorra_opcoes') || '{}'); return o.detalhe === 1 ? 1 : 2; } catch (e) { return 2; } })();
const escSpr = c => (c.hd ? ESCALA / HD_PX : ESCALA); // unidades do mundo por pixel do sprite
const SPR_HD = {};
// maior lado do sprite em pixels "antigos" (para escolher a escala nos ecrãs)
const ladoSpr = c => Math.max(c.width, c.height) / (c.hd ? HD_PX : 1);

function cortarHD(img, w, h, x, y) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; c.hd = true;
  c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
  return c;
}

// ---------- herói: 15 skins x 11 raças (a raça é uma camada por cima + cor da pele e dos olhos) ----------
const DIRECOES_HD = ['baixo', 'esquerda', 'direita', 'cima'];
const SKIN_HD = {}, RACA_HD = {}, cacheHeroiHD = {};
const PELE_RACA = { humano: '#f1c8a0', elfo: '#f6d6b8', anao: '#e8b48a', orc: '#8fb33a', vampiro: '#e8dcd8', gnomo: '#f1c8a0',
  draconato: '#e89a5a', mortoVivo: '#9fd8c0', anjo: '#f6d7b0', demonio: '#d04848', lagarto: '#5aa84a' };
const OLHOS_RACA = { orc: '#ffe14d', draconato: '#ffe14d', mortoVivo: '#5dffea', vampiro: '#ff2040', demonio: '#ffe14d', lagarto: '#ffe14d' };
// ordem das frames de cada folha: parado (b, d, c), anda x8 (b, d, c), ataque x6 (b, d, c)
function indiceHD(anim, dir, i) {
  const d = ['baixo', 'direita', 'cima'].indexOf(dir);
  return anim === 'parado' ? d : anim === 'anda' ? 3 + d * 8 + i : 27 + d * 6 + i;
}
function pintarHeroi(c, pele, olhos) {
  const g = c.getContext('2d'), img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  const P = hexRgb(pele), O = hexRgb(olhos);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    let cor = null, v = 0;
    if (gg < 20 && Math.abs(r - b) < 12 && r > 100) { cor = P; v = r; }        // pele (magenta)
    else if (r < 20 && Math.abs(gg - b) < 12 && gg > 100) { cor = O; v = gg; } // olhos (ciano)
    if (!cor) continue;
    const k = v < 170 ? 0.62 : v < 225 ? 0.82 : 1;
    d[i] = cor[0] * k; d[i + 1] = cor[1] * k; d[i + 2] = cor[2] * k;
  }
  g.putImageData(img, 0, 0);
}
function heroiHD(raca, skin) {
  skin = skin || 'azul';
  const chave = raca + '|' + skin;
  if (cacheHeroiHD[chave]) return cacheHeroiHD[chave];
  const S = SKIN_HD[skin];
  if (!S) return null;
  const L = RACA_HD[raca];
  if (raca !== 'humano' && RACA_HD_ESPERADAS.includes(raca) && !L) return null; // a camada da raça ainda não carregou
  const olhos = OLHOS_RACA[raca] || (SKINS[skin] && SKINS[skin].pal.w) || '#ffffff';
  const frame = (anim, dir, i) => {
    const flip = dir === 'esquerda', j = indiceHD(anim, flip ? 'direita' : dir, i);
    const c = document.createElement('canvas'); c.width = S[j].width; c.height = S[j].height; c.hd = true;
    const g = c.getContext('2d');
    if (flip) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(S[j], 0, 0);
    if (L) g.drawImage(L[j], 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    pintarHeroi(c, PELE_RACA[raca] || PELE_RACA.humano, olhos);
    return c;
  };
  const out = {};
  for (const [anim, n] of [['parado', 1], ['anda', 8], ['ataque', 6]]) {
    out[anim] = {};
    for (const dir of DIRECOES_HD) { out[anim][dir] = []; for (let i = 0; i < n; i++) out[anim][dir].push(frame(anim, dir, i)); }
  }
  // as 3 frames que o resto do jogo usa (menus, cidade...): parado, passo, outro passo
  out.antigo = [out.parado.baixo[0], out.anda.baixo[2], out.anda.baixo[6]];
  return (cacheHeroiHD[chave] = out);
}

// ---------- monstros, baús, objetos: substituem SPR[nome] ----------
function carregarSprHD(nome, w, h, n, dados) {
  const img = new Image();
  img.onload = () => {
    const frames = [];
    for (let i = 0; i < n; i++) frames.push(cortarHD(img, w, h, i * w, 0));
    if (nome.startsWith('heroi.')) { SKIN_HD[nome.slice(6)] = frames; for (const k in cacheHeroiHD) delete cacheHeroiHD[k]; return; }
    if (nome.startsWith('raca.')) { RACA_HD[nome.slice(5)] = frames; for (const k in cacheHeroiHD) delete cacheHeroiHD[k]; return; }
    if (nome.startsWith('ladrilho.')) { // ladrilho.<zona>.<chao0-3|face|faceAlt|topo>
      const [, z, t] = nome.split('.'), L = LADRILHOS_HD[z] || (LADRILHOS_HD[z] = { chaos: [] });
      if (t.startsWith('chao')) L.chaos[+t.slice(4)] = frames[0]; else L[t] = frames[0];
      return;
    }
    if (nome.startsWith('icone.')) { ICONES_HD[nome.slice(6)] = frames[0]; for (const k in cacheIcones) delete cacheIcones[k]; return; }
    const deArt = nome.startsWith('art.'); // art.<nome> substitui ART.<nome> (js/arte_nova.js)
    const partes = (deArt ? nome.slice(4) : nome).split('.'), ultima = partes.pop();
    let alvo = deArt || (typeof ART !== 'undefined' && partes[0] in ART && !(partes[0] in SPR)) ? ART : SPR;
    for (const p of partes) alvo = alvo[p] || (alvo[p] = {});
    alvo[ultima] = Array.isArray(alvo[ultima]) || n > 1 ? frames : frames[0];
  };
  img.src = 'data:image/png;base64,' + dados;
}

// Desenha um canvas (HD ou antigo) num contexto que usa pixels antigos (ex.: o mapa pré-desenhado)
function desenharEm(g, c, x, y) { const k = c.hd ? HD_PX : 1; g.drawImage(c, x, y, c.width / k, c.height / k); }

// Ladrilhos HD por zona (chão x4, face, faceAlt, topo)
const LADRILHOS_HD = {};
const ladrilhosHD = z => { const L = LADRILHOS_HD[z]; return L && L.chaos.length === 4 && L.face && L.faceAlt && L.topo ? L : null; };

// Ícones de itens HD: as partes em cinzento neutro levam a cor da raridade
const ICONES_HD = {};
function iconeHD(nome, cor) {
  const base = ICONES_HD[nome];
  if (!base) return null;
  const c = document.createElement('canvas');
  c.width = base.width; c.height = base.height; c.hd = true;
  const g = c.getContext('2d');
  g.drawImage(base, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  const [r0, g0, b0] = hexRgb(cor), claro = hexRgb(clarear(cor, 0.5));
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    if (!d[i + 3] || Math.abs(r - gg) > 4 || Math.abs(gg - b) > 4 || r <= 60) continue;
    const k = r < 110 ? 0.55 : r < 160 ? 0.8 : 1, base2 = r < 190 ? [r0, g0, b0] : claro;
    d[i] = base2[0] * k; d[i + 1] = base2[1] * k; d[i + 2] = base2[2] * k;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Frame de uma animação HD (os sprites antigos têm menos frames: dá sempre uma válida)
const frameAnim = (lista, t, fps) => lista[Math.floor(t * fps) % lista.length];

const RACA_HD_ESPERADAS = """ + json.dumps(sorted(os.path.basename(f)[5:-4] for f in glob.glob(os.path.join(AQUI, 'hd', 'raca.*.png')))) + """;
const LISTA_HD = [
""" + '\n'.join(entradas) + """
];
// só depois de todos os scripts correrem (alguns criam os sprites antigos ao carregar)
window.addEventListener('load', () => { for (const e of LISTA_HD) carregarSprHD(...e); });
"""
open(os.path.join(AQUI, '..', 'js', 'sprites_hd.js'), 'w').write(js)
print(len(entradas), 'sprites,', len(js) // 1024, 'KB')
