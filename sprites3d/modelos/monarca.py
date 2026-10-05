from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.3))
    m = '#2a1f42'
    k.placa([(-1.6, -0.3), (-1.2, 1.8), (0, 2.2), (1.2, 1.8), (1.6, -0.3), (0.8, -0.1), (0, -0.3), (-0.8, -0.1)], '#4a2266', c, loc=(0, 0.5, 0), esp=0.06)
    k.cone((0, 0, 1.1), (1.7, 1.3, 2.4), m, c, lados=16)
    k.bola((0, 0, 2.25), (1.1, 0.8, 0.6), '#3a2a56', c)
    for x in (-1, 1):
        k.bola((0.85 * x, 0, 2.2), (0.6, 0.55, 0.45), '#3a2a56', c)
        k.cone((0.95 * x, 0, 2.45), (0.14, 0.14, 0.4), '#140f1c', c, rot=(0, 30 * x, 0), lados=5)
        b = k.vazio(f'b{x}', (0.85 * x, -0.1, 2.0), c, rot=(-30, 15 * x, 0))
        k.cil((0, 0, -0.45), (0.3, 0.3, 0.9), '#3a2a56', b, lados=8)
    k.bola((0, 0, 2.75), (0.8, 0.75, 0.82), '#140f1c', c)
    for x in (-0.16, 0.16): k.bola((x, -0.37, 2.76), (0.16, 0.05, 0.08), k.mat('#c06aff', emit=5), c)
    cor = k.vazio('coroa', (0, 0, 3.08), c)
    ouro = k.mat('#ffd23f', metal=0.3, rough=0.3)
    k.cil((0, 0, 0.06), (0.75, 0.72, 0.16), ouro, cor, lados=14)
    for j in range(7):
        a = j / 7 * 2 * math.pi - math.pi / 2
        k.cone((0.34 * math.cos(a), 0.32 * math.sin(a), 0.32), (0.12, 0.12, 0.4 + 0.18 * (j == 0)), ouro, cor, lados=4)
    k.bola((0, -0.37, 0.07), (0.12, 0.05, 0.12), k.mat('#c06aff', emit=3), cor)
    k.bola((0, -0.62, 1.7), (0.3, 0.1, 0.3), k.mat('#c06aff', emit=2), c)
    k.cubo((0, -0.6, 1.0), (0.14, 0.04, 1.0), k.mat('#9a6aff', emit=1), c)
    k.v['orbs'] = o = k.vazio('orbs', (0, 0, 1.4), c)
    for x in (-1, 1): k.bola((1.5 * x, -0.3, 0), (0.36, 0.36, 0.36), k.mat('#a04aef', emit=0.8), o)
def pose(k, i, n): k.v['orbs'].location.z = 1.4 + (0.12 if i else -0.12)
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 5.2, 'alvo_z': 1.9, 'res': 512}
