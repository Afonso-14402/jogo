from kit import R
import math
def construir(k):
    c = k.vazio('corpo')
    v, cl = '#5fbf4a', '#b6e27a'
    k.bola((0, 0, 0.4), (1.5, 1.2, 0.8), v, c)
    k.bola((0, -0.35, 0.3), (1.0, 0.6, 0.5), cl, c)
    for x in (-0.38, 0.38):
        k.bola((x, -0.25, 0.85), (0.4, 0.4, 0.4), v, c)
        k.bola((x, -0.42, 0.88), (0.24, 0.1, 0.24), '#ffffff', c)
        k.bola((x, -0.47, 0.88), (0.12, 0.06, 0.16), '#1b1424', c)
    k.cubo((0, -0.62, 0.42), (0.7, 0.04, 0.05), '#2a5a1a', c)
    for x in (-1, 1):
        k.v[f'pe{x}'] = k.bola((0.62 * x, -0.2, 0.1), (0.5, 0.7, 0.24), v, c)
def pose(k, i, n):
    k.v['corpo'].scale = (1, 1, 1 + 0.06 * math.sin(i / n * 2 * math.pi))
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 2.8, 'alvo_z': 0.5}
