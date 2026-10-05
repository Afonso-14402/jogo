# Golem de pedregulhos com fendas de lava; [1] = pisão (braços no ar)
from kit import R
import math, random
random.seed(3)
def construir(k):
    p, e, lava = '#8f8a80', '#6a655a', k.mat('#ff8a2a', emit=3)
    c = k.vazio('corpo', (0, 0, 1.0)); k.v['corpo'] = c
    k.bola((0, 0, 0.5), (2.2, 1.6, 1.8), p, c)
    for x, z, s in ((-0.6, 1.1, 0.8), (0.55, 1.15, 0.9), (0.0, -0.1, 1.0)):
        k.bola((x, 0.2, z), (s, s * 0.8, s * 0.8), e, c)
    for x, z, rz in ((-0.3, 0.6, 30), (0.3, 0.3, -40), (0.1, 0.9, -10)):
        k.cubo((x, -0.78, z), (0.5, 0.05, 0.07), lava, c, rot=(0, rz, 0))
    cab = k.vazio('cab', (0, -0.2, 1.55), c)
    k.bola((0, 0, 0), (1.0, 0.9, 0.85), p, cab)
    for x in (-0.18, 0.18): k.bola((x, -0.42, 0.04), (0.18, 0.06, 0.1), k.mat('#ffb03a', emit=4), cab)
    k.bola((0.2, 0, 0.32), (0.4, 0.4, 0.2), '#5f8a3a', cab)
    for x in (-1, 1):
        b = k.vazio(f'braco{x}', (1.2 * x, 0, 1.0), c); k.v[f'braco{x}'] = b
        k.bola((0, 0, 0), (0.9, 0.9, 0.8), e, b)
        k.bola((0.1 * x, -0.1, -0.7), (0.75, 0.75, 0.9), p, b)
        k.bola((0.12 * x, -0.15, -1.35), (0.85, 0.8, 0.7), e, b)
        pe = k.vazio(f'pe{x}', (0.5 * x, 0, -0.5), c)
        k.bola((0, 0, -0.25), (0.75, 0.8, 0.6), e, pe)
def pose(k, i, n):
    for x in (-1, 1):
        k.v[f'braco{x}'].rotation_euler = (R(-150), R(15 * x), 0) if i == 1 else (0, R(-8 * x), 0)
    k.v['corpo'].location.z = 1.1 if i == 1 else 1.0
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 5.4, 'alvo_z': 1.3, 'res': 512}
