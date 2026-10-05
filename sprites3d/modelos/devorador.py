from kit import R
import math
def construir(k):
    c = k.vazio('corpo')
    m = '#4a2a6a'
    k.bola((0, 0, 0.75), (1.7, 1.4, 1.5), m, c)
    k.v['boca'] = b = k.vazio('boca', (0, -0.6, 0.6), c)
    k.bola((0, 0, 0), (1.1, 0.3, 0.5), '#1b0a14', b)
    for j in range(6):
        x = -0.45 + j * 0.18
        k.cone((x, -0.05, 0.2), (0.14, 0.08, 0.22), '#f1ece0', b, rot=(180, 0, 0), lados=4)
        k.cone((x + 0.09, -0.05, -0.2), (0.14, 0.08, 0.22), '#f1ece0', b, lados=4)
    for x in (-0.3, 0.3): k.bola((x, -0.58, 1.15), (0.2, 0.08, 0.16), k.mat('#ffd23f', emit=3), c)
    for x in (-1, 1): k.cone((0.4 * x, 0, 1.45), (0.2, 0.2, 0.4), '#2a1a3a', c, rot=(0, 30 * x, 0), lados=6)
def pose(k, i, n):
    s = math.sin(i / n * 2 * math.pi)
    k.v['boca'].scale = (1, 1, 1 + 0.35 * s)
    k.v['corpo'].scale = (1 + 0.04 * s, 1, 1 - 0.04 * s)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.6, 'alvo_z': 0.75}
