from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.8))
    m = k.mat('#3e2d5c', rough=0.9)
    k.bola((0, 0, 0.4), (1.1, 0.9, 1.2), m, c)
    for j in range(5):
        a = j / 5 * 2 * math.pi
        k.v[f'p{j}'] = k.cone((0.4 * math.cos(a), 0.3 * math.sin(a), -0.3), (0.4, 0.4, 0.8), m, c, rot=(180, 0, 0), lados=6)
    for x in (-0.2, 0.2): k.bola((x, -0.4, 0.55), (0.18, 0.06, 0.1), k.mat('#c06aff', emit=4), c)
    for x in (-1, 1):
        b = k.vazio(f'b{x}', (0.5 * x, 0, 0.4), c)
        k.cone((0.25 * x, -0.1, -0.2), (0.2, 0.2, 0.7), m, b, rot=(160, -30 * x, 0), lados=6)
def pose(k, i, n):
    f = i / n * 2 * math.pi
    for j in range(5): k.v[f'p{j}'].location.z = -0.3 + 0.08 * math.sin(f + j * 1.3)
    k.v['b1'].rotation_euler.y = R(15) * math.sin(f); k.v['b-1'].rotation_euler.y = -R(15) * math.sin(f)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.6, 'alvo_z': 0.85, 'sol': 3.6, 'ambiente': 0.8}
