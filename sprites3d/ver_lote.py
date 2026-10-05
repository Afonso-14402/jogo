"""Folha de comparação: sprite antigo (do jogo) ao lado das frames novas, ampliado."""
from PIL import Image, ImageDraw
import json, sys, os
ANT = sys.argv[1]  # pasta com os antigos exportados (nome.png = frame 0)
nomes = sys.argv[3:]
Z = 4
linhas = []
for n in nomes:
    f = Image.open(f'hd/{n}.png'); m = json.load(open(f'hd/{n}.json'))
    w, h = m['w'], m['h']; nf = f.width // w
    ant = Image.open(os.path.join(ANT, n + '.png')) if os.path.exists(os.path.join(ANT, n + '.png')) else None
    z = 4 if max(w, h) <= 40 else 2
    fr = [f.crop((i * w, 0, i * w + w, h)) for i in range(nf)]
    fr = [c.resize((w * z // 4 * 4 // 4, h * z // 4 * 4 // 4), Image.NEAREST) for c in fr] if False else fr
    linhas.append((n, ant, fr, w, h, z))
W = max(40 + (2 + len(fr)) * (w * z + 16) for _, _, fr, w, _, z in linhas) + 120
H = sum(h * z + 30 for *_, h, z in linhas) + 20
out = Image.new('RGBA', (W, H), (38, 32, 48, 255)); d = ImageDraw.Draw(out)
y = 10
for n, ant, fr, w, h, Z in linhas:
    d.text((8, y + 2), n, fill=(255, 255, 255))
    x = 130
    if ant:
        out.alpha_composite(ant.resize((ant.width * Z * 2, ant.height * Z * 2), Image.NEAREST), (x, y + 18))
    x += w * Z + 40
    for c in fr:
        out.alpha_composite(c.resize((w * Z, h * Z), Image.NEAREST), (x, y + 18)); x += w * Z + 16
    y += h * Z + 30
out.convert('RGB').save(sys.argv[2])
