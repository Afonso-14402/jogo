from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 1.0))
    m = k.mat('#c06aff', rough=0.08, emit=0.7)
    k.cone((0, 0, 0.42), (1.0, 1.0, 0.9), m, c, lados=4, rot=(0, 0, 45))
    k.cone((0, 0, -0.42), (1.0, 1.0, 0.9), m, c, lados=4, rot=(180, 0, 45))
    for x in (-0.14, 0.14): k.bola((x, -0.33, 0.1), (0.12, 0.05, 0.14), k.mat('#ffffff', emit=4), c)
    k.v['o'] = o = k.vazio('o', (0, 0, 0), c)
    for j in range(4):
        a = j / 4 * 2 * math.pi
        k.bola((0.8 * math.cos(a), 0.5 * math.sin(a), 0), (0.14, 0.14, 0.14), k.mat('#ffd2ff', emit=3), o)
def pose(k, i, n):
    k.v['o'].rotation_euler.z = i / n * math.pi / 2
    k.v['corpo'].rotation_euler.z = R(12) * math.sin(i / n * 2 * math.pi)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.6, 'alvo_z': 1.0}
