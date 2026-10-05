from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.3))
    a, e = '#d88a3a', '#a85a2a'
    k.bola((0, 0, 0), (1.0, 1.1, 0.46), a, c)
    k.bola((0, -0.55, 0.05), (0.6, 0.5, 0.36), a, c)
    for x in (-0.12, 0.12): k.bola((x, -0.78, 0.14), (0.08, 0.05, 0.08), '#1b1424', c)
    for x in (-1, 1):
        p = k.vazio(f'pinca{x}', (0.38 * x, -0.65, 0.05), c)
        k.cil((0.12 * x, -0.2, 0), (0.1, 0.1, 0.5), e, p, rot=(90, 0, -25 * x), lados=6)
        k.bola((0.28 * x, -0.5, 0.04), (0.3, 0.36, 0.2), a, p)
        for j in range(3):
            k.cil((0.45 * x, -0.1 + j * 0.25, -0.1), (0.06, 0.06, 0.5), e, c, rot=(0, 70 * x, 0), lados=5)
    k.v['cauda'] = cd = k.vazio('cauda', (0, 0.5, 0.1), c)
    pts = [(0, 0.2, 0.15), (0, 0.4, 0.45), (0, 0.4, 0.8), (0, 0.2, 1.05)]
    for j, (x, y, z) in enumerate(pts):
        k.bola((x, y, z), (0.3 - j * 0.03, 0.3, 0.3), a if j % 2 == 0 else e, cd)
    k.cone((0, -0.05, 1.1), (0.16, 0.16, 0.36), '#3a2a1a', cd, rot=(120, 0, 0), lados=6)
def pose(k, i, n):
    s = math.sin(i / n * 2 * math.pi)
    k.v['cauda'].rotation_euler.x = R(10) * s
    k.v['pinca1'].rotation_euler.z = R(10) * s; k.v['pinca-1'].rotation_euler.z = -R(10) * s
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 3.0, 'alvo_z': 0.5, 'inclinacao': 28}
