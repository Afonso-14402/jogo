from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.2))
    roxo, esc = '#5a3a8a', '#3b2a5a'
    k.cone((0, 0, 0.7), (1.2, 1.0, 1.4), roxo, c, lados=16)
    k.bola((0, 0, 1.45), (0.78, 0.74, 0.8), roxo, c)
    k.bola((0, -0.14, 1.4), (0.6, 0.5, 0.6), '#140f1c', c)  # dentro do capuz
    for x in (-0.13, 0.13):
        k.bola((x, -0.4, 1.42), (0.12, 0.05, 0.08), k.mat('#6ff8ff', emit=4), c)
    k.cubo((0, -0.44, 0.7), (0.12, 0.04, 0.9), esc, c)
    for x in (-1, 1):
        k.bola((0.42 * x, -0.1, 1.0), (0.3, 0.3, 0.36), roxo, c)
    b = k.vazio('bastao', (-0.55, -0.15, 0.8), c)
    k.cil((0, 0, 0.1), (0.07, 0.07, 1.9), '#6b4a2a', b, lados=6)
    k.v['orbe'] = k.bola((0, 0, 1.1), (0.24, 0.24, 0.24), k.mat('#6ff8ff', emit=4), b)
def pose(k, i, n):
    f = i / n * 2 * math.pi
    k.v['orbe'].scale = [0.24 + 0.04 * math.sin(f)] * 3
    k.v['corpo'].rotation_euler.y = R(3) * math.sin(f)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.8, 'alvo_z': 1.0}
