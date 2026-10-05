from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 1.0))
    k.bola((0, 0, 0), (1.3, 1.2, 1.2), '#7a3fa8', c)
    k.bola((0, -0.4, 0), (0.9, 0.5, 0.8), '#f5ecf8', c)
    k.v['iris'] = ir = k.vazio('iris', (0, -0.62, 0), c)
    k.bola((0, 0, 0), (0.46, 0.12, 0.46), k.mat('#ff3b6a', emit=1.5), ir)
    k.bola((0, -0.04, 0), (0.2, 0.08, 0.28), '#1b1424', ir)
    for x in (-0.3, 0, 0.3): k.cone((x, 0, 0.62), (0.18, 0.18, 0.36), '#5a2a80', c, rot=(0, x * 50, 0), lados=6)
    for j in range(5):
        a = math.pi + j / 4 * math.pi
        k.v[f't{j}'] = k.cone((0.55 * math.cos(a), 0.2, -0.55 + 0.1 * math.sin(a)), (0.16, 0.16, 0.6), '#5a2a80', c, rot=(180 + 20 * math.cos(a), 0, 0), lados=6)
def pose(k, i, n):
    f = i / n * 2 * math.pi
    k.v['iris'].location.x = 0.12 * math.sin(f)
    for j in range(5): k.v[f't{j}'].rotation_euler.y = R(15) * math.sin(f + j)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.8, 'alvo_z': 0.9}
