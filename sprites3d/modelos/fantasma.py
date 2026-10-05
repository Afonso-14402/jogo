from kit import R
import math, bpy
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.9))
    m = k.mat('#a9c4ef', rough=0.3, emit=0.2)
    k.bola((0, 0, 0.35), (1.2, 1.0, 1.1), m, c)
    k.cil((0, 0, -0.15), (1.2, 1.0, 0.9), m, c, lados=16)
    for j in range(6):  # pontas da saia
        a = j / 6 * 2 * math.pi
        k.v[f'p{j}'] = k.cone((0.48 * math.cos(a), 0.4 * math.sin(a), -0.68), (0.36, 0.36, 0.34), m, c, rot=(180, 0, 0))
    for x in (-0.24, 0.24):
        k.bola((x, -0.46, 0.4), (0.22, 0.1, 0.3), '#1b1424', c)
    k.bola((0, -0.48, 0.05), (0.2, 0.08, 0.16), '#1b1424', c)
    for lado, nome in ((1, 'm_e'), (-1, 'm_d')):
        b = k.vazio(nome, (0.6 * lado, 0, 0.1), c)
        k.bola((0.18 * lado, -0.1, -0.1), (0.3, 0.26, 0.3), m, b)

def pose(k, i, n):
    f = i / n * 2 * math.pi
    for j in range(6):
        k.v[f'p{j}'].location.z = -0.68 + 0.08 * math.sin(f + j)
    k.v['m_e'].rotation_euler.y = R(15) * math.sin(f)
    k.v['m_d'].rotation_euler.y = R(15) * math.sin(f + 1)
    k.v['corpo'].rotation_euler.y = R(4) * math.sin(f)

ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.8, 'alvo_z': 0.95}
