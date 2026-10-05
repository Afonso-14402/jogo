# Guardião de pedra com cristais; [1] = a prender o herói
from kit import R
import math
def construir(k):
    p, e = '#7a7f8e', '#5a5f6e'
    c = k.vazio('corpo', (0, 0, 1.0)); k.v['corpo'] = c
    k.bola((0, 0, 0.5), (2.0, 1.5, 1.7), p, c)
    k.bola((0, 0.1, -0.1), (1.6, 1.2, 0.9), e, c)
    cab = k.vazio('cab', (0, -0.15, 1.45), c)
    k.bola((0, 0, 0), (0.9, 0.8, 0.8), p, cab)
    for x in (-0.16, 0.16): k.bola((x, -0.38, 0.02), (0.16, 0.06, 0.1), k.mat('#6fd8ff', emit=4), cab)
    for x, z, s, cor in ((0.0, 1.75, 0.9, '#6fd8ff'), (-0.7, 1.4, 0.7, '#ff8ad8'), (0.7, 1.4, 0.7, '#6fd8ff'), (-0.4, 1.6, 0.6, '#ff8ad8'), (0.4, 1.65, 0.6, '#6fd8ff')):
        k.cone((x, 0.25, z), (0.34, 0.34, s), k.mat(cor, rough=0.08, emit=0.6), c, rot=(-15, x * 35, 0), lados=5)
    k.cone((0, -0.72, 0.5), (0.3, 0.3, 0.5), k.mat('#6fd8ff', rough=0.08, emit=0.6), c, rot=(-80, 0, 0), lados=5)
    for x in (-1, 1):
        b = k.vazio(f'braco{x}', (1.1 * x, 0, 0.9), c); k.v[f'braco{x}'] = b
        k.bola((0, 0, 0), (0.8, 0.8, 0.7), e, b)
        k.bola((0.1 * x, -0.1, -0.65), (0.65, 0.65, 0.8), p, b)
        k.cone((0.1 * x, 0, 0.35), (0.22, 0.22, 0.5), k.mat('#6fd8ff', rough=0.08, emit=0.6), b, lados=5)
        pe = k.vazio(f'pe{x}', (0.45 * x, 0, -0.55), c)
        k.bola((0, 0, -0.25), (0.65, 0.7, 0.55), e, pe)
def pose(k, i, n):
    for x in (-1, 1):
        k.v[f'braco{x}'].rotation_euler = (R(-100), R(25 * x), 0) if i == 1 else (0, R(-8 * x), 0)
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 4.6, 'alvo_z': 1.3, 'res': 512}
