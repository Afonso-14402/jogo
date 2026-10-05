# [0] boca aberta (a morder), [1] fechada
from kit import R
import math
def construir(k):
    c = k.vazio('corpo')
    k.cil((0, 0, 0.55), (0.18, 0.18, 1.1), '#3a9a3a', c, lados=8)
    for x in (-1, 1):
        k.placa([(0, 0), (0.4 * x, 0.25), (0.75 * x, 0.15), (0.55 * x, -0.05)], '#4fbf4a', c, loc=(0, 0, 0.3), esp=0.05)
    k.cil((0, 0, 0.04), (0.8, 0.8, 0.08), '#5a4030', c)
    cab = k.vazio('cab', (0, 0, 1.2), c)
    k.v['sup'] = sup = k.vazio('sup', (0, 0.2, 0.0), cab)
    k.bola((0, -0.2, 0.15), (1.0, 0.9, 0.55), '#d83a4a', sup)
    for x in (-0.24, 0.2, -0.05): k.bola((x, -0.4, 0.38), (0.14, 0.14, 0.08), '#ffffff', sup)
    k.v['inf'] = inf = k.vazio('inf', (0, 0.2, 0.0), cab)
    k.bola((0, -0.2, -0.12), (0.9, 0.82, 0.45), '#b82a3a', inf)
    k.cubo((0, -0.2, 0.0), (0.7, 0.6, 0.05), '#5a0a1a', cab)
    for j in range(5):
        x = -0.32 + j * 0.16
        k.cone((x, -0.58, 0.02), (0.1, 0.06, 0.16), '#ffffff', sup, rot=(180, 0, 0), lados=4)
        k.cone((x + 0.08, -0.55, -0.02), (0.1, 0.06, 0.14), '#ffffff', inf, lados=4)
def pose(k, i, n):
    ab = 32 if i == 0 else 4
    k.v['sup'].rotation_euler.x = -R(ab)
    k.v['inf'].rotation_euler.x = R(ab * 0.6)
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 2.8, 'alvo_z': 0.95}
