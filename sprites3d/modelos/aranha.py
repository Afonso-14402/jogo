from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.45))
    k.bola((0, 0.35, 0.1), (1.1, 1.0, 0.8), '#5a3a7a', c)
    k.bola((0, -0.35, 0), (0.7, 0.6, 0.55), '#7a52a0', c)
    k.bola((0, 0.35, 0.42), (0.5, 0.4, 0.12), '#a43a3a', c)
    for x in (-0.12, 0.12, -0.24, 0.24):
        k.bola((x, -0.62, 0.08 if abs(x) < 0.2 else 0.0), (0.1, 0.06, 0.1), k.mat('#ff3b3b', emit=3), c)
    for lado in (1, -1):
        for j in range(4):
            p = k.vazio(f'pe{lado}{j}', (0.28 * lado, -0.3 + j * 0.22, 0), c, rot=(0, 0, (-30 + j * 22) * lado))
            seg = k.vazio(f'pe{lado}{j}b', (0.6 * lado, 0, 0.18), p)
            k.cil((0.3 * lado, 0, 0.09), (0.08, 0.08, 0.66), '#3b2a4c', p, rot=(0, 75 * lado, 0), lados=6)
            k.cil((0.1 * lado, 0, -0.3), (0.07, 0.07, 0.66), '#3b2a4c', seg, rot=(0, -20 * lado, 0), lados=6)

def pose(k, i, n):
    f = i / n * 2 * math.pi
    for lado in (1, -1):
        for j in range(4):
            k.v[f'pe{lado}{j}'].rotation_euler.x = R(14) * math.sin(f + j * math.pi / 2 * lado)
    k.v['corpo'].location.z = 0.45 + 0.03 * math.sin(2 * f)

ANIMS = {'f': (4, pose)}
CENA = {'ortho': 3.6, 'alvo_z': 0.35, 'inclinacao': 35}
