from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.7))
    k.bola((0, 0.8, 0.3), (2.2, 2.0, 1.6), '#4a2a6a', c)
    k.bola((0, 0.8, 0.95), (1.0, 0.8, 0.3), '#c83a4a', c)
    k.cubo((0, 0.0, 1.05), (0.24, 0.04, 0.4), '#c83a4a', c, rot=(60, 0, 0))
    k.bola((0, -0.5, 0.3), (1.4, 1.2, 1.1), '#6a3a8a', c)
    for x in (-0.18, 0.18, -0.36, 0.36):
        k.bola((x, -1.12, 0.45 if abs(x) < 0.3 else 0.32), (0.18, 0.08, 0.18), k.mat('#ff3b3b', emit=3), c)
    for x in (-1, 1): k.cone((0.18 * x, -1.08, 0.0), (0.12, 0.1, 0.36), '#1b1424', c, rot=(160, 0, 0), lados=5)
    cor = k.vazio('coroa', (0, -0.35, 0.82), c)
    for j in range(5): k.cone((-0.36 + j * 0.18, 0, 0.1), (0.14, 0.14, 0.34), k.mat('#ffd23f', metal=0.3), cor, lados=4)
    for lado in (1, -1):
        for j in range(4):
            p = k.vazio(f'p{lado}{j}', (0.6 * lado, -0.5 + j * 0.45, 0.2), c, rot=(0, 0, (-30 + j * 22) * lado))
            seg = k.vazio(f'p{lado}{j}b', (1.2 * lado, 0, 0.45), p)
            k.cil((0.6 * lado, 0, 0.22), (0.16, 0.16, 1.3), '#2a1a3a', p, rot=(0, 70 * lado, 0), lados=6)
            k.cil((0.15 * lado, 0, -0.55), (0.13, 0.13, 1.2), '#2a1a3a', seg, rot=(0, -15 * lado, 0), lados=6)
def pose(k, i, n):
    for lado in (1, -1):
        for j in range(4):
            k.v[f'p{lado}{j}'].rotation_euler.x = R(12) * (1 if (j + i) % 2 else -1) * lado
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 6.6, 'alvo_z': 0.7, 'res': 512, 'inclinacao': 30}
