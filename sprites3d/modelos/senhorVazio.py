from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.4))
    m, e = '#3a2266', '#241640'
    k.cone((0, 0, 1.1), (1.8, 1.5, 2.4), m, c, lados=16)
    k.bola((0, 0, 2.4), (1.3, 1.2, 1.3), m, c)
    k.bola((0, -0.3, 2.35), (1.0, 0.8, 1.0), '#140f1c', c)
    k.bola((0, -0.62, 2.35), (0.85, 0.3, 0.8), '#f5ecf8', c)
    k.bola((0, -0.77, 2.35), (0.42, 0.1, 0.42), k.mat('#ff3b6a', emit=1.5), c)
    k.bola((0, -0.82, 2.35), (0.16, 0.06, 0.24), '#1b1424', c)
    for x in (-1, 1):
        k.bola((0.85 * x, -0.1, 1.6), (0.5, 0.5, 0.5), e, c)
        k.bola((1.3 * x, -0.3, 1.3), (0.3, 0.3, 0.3), k.mat('#c06aff', emit=3), c)
    for j in range(5):
        a = j / 5 * 2 * math.pi
        k.cone((0.7 * math.cos(a), 0.6 * math.sin(a), -0.1), (0.4, 0.4, 0.6), m, c, rot=(180, 0, 0), lados=6)
    k.cone((0, 0, 3.15), (0.3, 0.3, 0.6), e, c, lados=6)
def pose(k, i, n): pass
ANIMS = {'f': (1, pose)}
CENA = {'ortho': 4.6, 'alvo_z': 1.8, 'res': 512}
