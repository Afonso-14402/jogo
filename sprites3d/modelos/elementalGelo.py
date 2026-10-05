from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 1.0))
    gelo = k.mat('#9fe0ff', rough=0.08, emit=0.6)
    claro = k.mat('#e8fbff', rough=0.05, emit=1.0)
    k.cone((0, 0, 0.35), (0.9, 0.9, 0.9), gelo, c, lados=6)
    k.cone((0, 0, -0.35), (0.9, 0.9, 0.9), gelo, c, rot=(180, 0, 0), lados=6)
    for x in (-0.16, 0.16):
        k.bola((x, -0.36, 0.05), (0.12, 0.06, 0.16), '#1b4a7a', c)
    k.v['orbita'] = o = k.vazio('orbita', (0, 0, 0), c)
    for j in range(3):
        a = j / 3 * 2 * math.pi
        k.cone((0.85 * math.cos(a), 0.6 * math.sin(a), 0.1 * j - 0.1), (0.24, 0.24, 0.44), claro, o, rot=(0, 20 * j, 30 * j), lados=4)

def pose(k, i, n):
    f = i / n * 2 * math.pi
    k.v['orbita'].rotation_euler.z = f / 3
    k.v['corpo'].rotation_euler.z = R(10) * math.sin(f)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.9, 'alvo_z': 1.0}
