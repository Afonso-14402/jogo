from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.3))
    m = '#5a2a8a'
    k.bola((0, 0, 0.6), (1.4, 1.2, 1.4), m, c)
    k.cone((0, 0, 1.45), (0.9, 0.9, 0.8), m, c, lados=12)
    k.bola((0, -0.3, 0.75), (0.8, 0.5, 0.6), '#140f1c', c)
    for x in (-0.17, 0.17): k.bola((x, -0.55, 0.8), (0.14, 0.05, 0.1), k.mat('#ff6aff', emit=4), c)
    k.v['orb'] = o = k.vazio('orb', (0, 0, 0.6), c)
    for j in range(3):
        a = j / 3 * 2 * math.pi
        k.bola((0.95 * math.cos(a), 0.6 * math.sin(a), 0), (0.22, 0.22, 0.22), k.mat('#c06aff', emit=3), o)
def pose(k, i, n):
    k.v['orb'].rotation_euler.z = i / n * 2 * math.pi / 3
    k.v['corpo'].scale = (1, 1, 1 + 0.04 * math.sin(i / n * 2 * math.pi))
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.7, 'alvo_z': 1.0}
