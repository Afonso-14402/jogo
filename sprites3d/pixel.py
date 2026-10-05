"""Converte os renders de um modelo em pixel art do tamanho pedido (estilo do jogo).

    python3 pixel.py render/slime 32 24 saida/slime.png [--cores 20] [--extra '#ff0000,#ffffff'] [--ancora baixo|centro]

Todas as frames usam o mesmo enquadramento (a caixa que junta todas), a mesma
paleta e levam o contorno escuro de 1 pixel do jogo. A folha fica numa linha,
pela ordem das animações, e ao lado vai um .json com {anim: [inicio, n]}.
"""
from PIL import Image
from collections import Counter, OrderedDict
import argparse, glob, json, os, re

CONTORNO = (0x14, 0x0f, 0x1c, 255)

ap = argparse.ArgumentParser()
ap.add_argument('pasta'); ap.add_argument('W', type=int); ap.add_argument('H', type=int); ap.add_argument('saida')
ap.add_argument('--cores', type=int, default=20)
ap.add_argument('--extra', default='')
ap.add_argument('--ancora', default='baixo')
ap.add_argument('--ordem', default='')
ap.add_argument('--alfa', type=int, default=140)
ap.add_argument('--sem-toon', action='store_true')
ap.add_argument('--caixa', default='')
ap.add_argument('--fixo', action='store_true')
ap.add_argument('--quadro', action='store_true')  # enquadramento fixo (a imagem toda), mas com contorno  # sem enquadramento automático nem contorno (ladrilhos)  # x,y,w,h: zona da imagem onde o desenho tem de caber
ap.add_argument('--limiar', default='0.28,0.55,0.93')
a = ap.parse_args()
a.limiar = [float(v) for v in a.limiar.split(',')]

ap2 = None
def toon(f):
    """Junta a cor lisa com a luz em 3 níveis (sombra / meio / luz): aspeto de pixel art desenhada."""
    im = Image.open(f).convert('RGBA')
    fc, fl = f[:-4] + '.cor.png', f[:-4] + '.luz.png'
    if not (os.path.exists(fc) and os.path.exists(fl)) or a.sem_toon: return im
    cor = Image.open(fc).convert('RGB'); luz = Image.open(fl).convert('L')
    cp, lp, ip = cor.load(), luz.load(), im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, al = ip[x, y]
            if al == 0: continue
            l = lp[x, y] / 255
            k = 0.52 if l < a.limiar[0] else 0.78 if l < a.limiar[1] else 1.0 if l < a.limiar[2] else 1.12
            cr, cg, cb = cp[x, y]
            ip[x, y] = (min(255, int(cr * k)), min(255, int(cg * k)), min(255, int(cb * k)), al)
    return im

# frames por animação, pela ordem pedida (ou alfabética)
fich = sorted(f for f in glob.glob(os.path.join(a.pasta, '*_*.png')) if not f.endswith(('.cor.png', '.luz.png')))
anims = OrderedDict()
for f in fich:
    m = re.match(r'(.+)_(\d+)\.png$', os.path.basename(f))
    anims.setdefault(m.group(1), []).append((int(m.group(2)), f))
ordem = a.ordem.split(',') if a.ordem else list(anims)
frames = []
meta = OrderedDict()
for nome in ordem:
    lst = [f for _, f in sorted(anims[nome])]
    meta[nome] = [len(frames), len(lst)]
    frames += [toon(f) for f in lst]

# caixa que junta todas as frames
caixa = None
for im in frames:
    b = im.getchannel('A').point(lambda v: 255 if v > a.alfa else 0).getbbox()
    if b: caixa = b if not caixa else (min(caixa[0], b[0]), min(caixa[1], b[1]), max(caixa[2], b[2]), max(caixa[3], b[3]))
if a.fixo or a.quadro: caixa = (0, 0, frames[0].width, frames[0].height)
bw, bh = caixa[2] - caixa[0], caixa[3] - caixa[1]
if a.caixa:
    cx_, cy_, cw_, ch_ = [int(v) for v in a.caixa.split(',')]
else:
    cx_, cy_, cw_, ch_ = 0, 0, a.W, a.H
esc = (a.W / bw) if (a.fixo or a.quadro) else min((cw_ - 2) / bw, (ch_ - 2) / bh)  # 1 pixel de margem para o contorno
tw, th = bw * esc, bh * esc
ox = cx_ + (cw_ - tw) / 2
oy = cy_ + ((ch_ - 1 - th) if a.ancora == 'baixo' else (ch_ - th) / 2)
if a.fixo or a.quadro: ox = oy = 0

# paleta comum
amostra = Image.new('RGB', (frames[0].width, frames[0].height * len(frames)))
for i, im in enumerate(frames):
    fundo = Image.new('RGB', im.size, (128, 128, 128))
    fundo.paste(im, mask=im.getchannel('A').point(lambda v: 255 if v > 200 else 0))
    amostra.paste(fundo, (0, i * im.height))
base = amostra.quantize(colors=a.cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
cores = base.getpalette()[:a.cores * 3]
for h in [c for c in a.extra.split(',') if c]:
    cores += [int(h[i:i + 2], 16) for i in (1, 3, 5)]
pal = Image.new('P', (1, 1)); pal.putpalette(cores + [0] * (768 - len(cores)))


def reduzir(im):
    q = im.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
    qp, ap_ = q.load(), im.getchannel('A').load()
    out = Image.new('RGBA', (a.W, a.H)); op = out.load()
    for y in range(a.H):
        for x in range(a.W):
            # retângulo da imagem grande que cai neste pixel
            sx0 = caixa[0] + (x - ox) / esc; sx1 = caixa[0] + (x + 1 - ox) / esc
            sy0 = caixa[1] + (y - oy) / esc; sy1 = caixa[1] + (y + 1 - oy) / esc
            ix0, ix1 = max(0, int(sx0)), min(im.width, max(int(sx0) + 1, int(round(sx1))))
            iy0, iy1 = max(0, int(sy0)), min(im.height, max(int(sy0) + 1, int(round(sy1))))
            if ix0 >= ix1 or iy0 >= iy1: continue
            cont = Counter(); tot = 0; opac = 0
            for yy in range(iy0, iy1):
                for xx in range(ix0, ix1):
                    tot += 1
                    if ap_[xx, yy] > a.alfa: opac += 1; cont[qp[xx, yy]] += 1
            if opac >= tot * 0.42 or (a.fixo and opac):
                op[x, y] = cont.most_common(1)[0][0] + (255,)
    if a.fixo: return out
    # contorno
    marcar = []
    for y in range(a.H):
        for x in range(a.W):
            if op[x, y][3] == 0 and any(0 <= x + dx < a.W and 0 <= y + dy < a.H and op[x + dx, y + dy][3]
                                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                marcar.append((x, y))
    for p in marcar: op[p] = CONTORNO
    return out


folha = Image.new('RGBA', (a.W * len(frames), a.H))
for i, im in enumerate(frames):
    folha.alpha_composite(reduzir(im), (i * a.W, 0))
os.makedirs(os.path.dirname(a.saida) or '.', exist_ok=True)
folha.save(a.saida)
json.dump({'w': a.W, 'h': a.H, 'anims': meta}, open(a.saida[:-4] + '.json', 'w'))
print(a.saida, a.W, a.H, dict(meta))
