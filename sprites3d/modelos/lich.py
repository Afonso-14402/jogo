from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.3))
    roxo, esc = '#5a3a9a', '#3a2a6a'
    k.cone((0, 0, 1.2), (1.8, 1.5, 2.6), roxo, c, lados=16)
    for j in range(7):
        a = j / 7 * 2 * math.pi
        k.cone((0.75 * math.cos(a), 0.6 * math.sin(a), -0.02), (0.36, 0.36, 0.3), roxo, c, rot=(180, 0, 0), lados=5)
    k.bola((0, 0, 2.45), (1.25, 1.15, 1.25), roxo, c)
    k.cone((0, 0.15, 3.15), (0.7, 0.7, 0.9), roxo, c, rot=(-20, 0, 0), lados=10)
    k.bola((0, -0.3, 2.35), (0.9, 0.7, 0.9), '#140f1c', c)
    k.bola((0, -0.52, 2.2), (0.5, 0.3, 0.42), '#d8d0bc', c)  # queixo da caveira
    for x in (-0.2, 0.2):
        k.bola((x, -0.66, 2.42), (0.18, 0.06, 0.12), k.mat('#6ff8ff', emit=4), c)
    k.cubo((0, -0.62, 1.4), (0.16, 0.05, 1.6), esc, c)
    for z in (1.9, 1.5, 1.1): k.cubo((0, -0.66, z), (0.3, 0.04, 0.06), '#ffd23f', c)
    for x in (-1, 1):
        k.bola((0.78 * x, 0, 1.95), (0.65, 0.6, 0.55), esc, c)
        b = k.vazio(f'b{x}', (0.68 * x, -0.25, 1.85), c, rot=(-30, 0, 0))
        k.cone((0.08 * x, 0, -0.4), (0.5, 0.5, 0.9), roxo, b, rot=(0, 0, 0), lados=8)
        k.bola((0.08 * x, -0.05, -0.9), (0.22, 0.22, 0.22), '#d8d0bc', b)
    bast = k.vazio('bast', (-1.05, -0.35, 0.9), c)
    k.cil((0, 0, 0.6), (0.12, 0.12, 3.0), '#4a3a2a', bast, lados=6)
    k.bola((0, 0, 2.2), (0.48, 0.48, 0.48), k.mat('#3fd8ef', emit=1.5), bast)
    for x in (-1, 1): k.cone((0.25 * x, 0, 2.05), (0.12, 0.12, 0.5), '#4a3a2a', bast, rot=(0, 30 * x, 0), lados=5)
def pose(k, i, n): pass
ANIMS = {'f': (1, pose)}
CENA = {'ortho': 4.8, 'alvo_z': 1.8, 'res': 512}
