from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 1.0))
    k.bola((0, 0, 0), (1.1, 1.0, 1.0), '#ffd6c8', c)
    k.bola((0, 0.05, 0.38), (1.0, 0.9, 0.4), '#ffd84a', c)
    k.toro((0, 0, 0.72), 0.3, 0.05, k.mat('#ffe680', emit=3), c)
    for x in (-0.2, 0.2):
        k.bola((x, -0.46, 0.05), (0.14, 0.06, 0.18), '#1b1424', c)
        k.bola((x * 1.5, -0.4, -0.15), (0.18, 0.05, 0.1), '#ff9aa8', c)
    k.bola((0, -0.48, -0.22), (0.18, 0.05, 0.08), '#a83a4a', c)
    for x in (-1, 1):
        a = k.vazio(f'asa{x}', (0.45 * x, 0.1, 0.05), c)
        k.v[f'asa{x}'] = a
        pts = [(0, 0), (0.35, 0.35), (0.7, 0.45), (0.85, 0.15), (0.7, -0.1), (0.4, -0.2)]
        k.placa([(px * x, pz) for px, pz in pts], k.mat('#ffffff', rough=0.6, emit=0.3), a, esp=0.06)
def pose(k, i, n):
    f = math.cos(i / n * 2 * math.pi)
    k.v['asa1'].rotation_euler.y = -R(40) * f; k.v['asa-1'].rotation_euler.y = R(40) * f
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.5, 'alvo_z': 1.0}
