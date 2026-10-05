from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0.6))
    v, b, a = '#c83a3a', '#f1c87a', '#8a2020'
    k.bola((0, 0.2, 0.7), (1.9, 1.8, 1.7), v, c)
    k.bola((0, -0.55, 0.55), (1.2, 0.6, 1.2), b, c)
    for j in range(4): k.cubo((0, -0.85, 0.15 + j * 0.25), (0.8 - j * 0.08, 0.04, 0.04), '#c89a5a', c)
    cab = k.vazio('cab', (0, -0.3, 1.9), c)
    k.bola((0, 0, 0), (1.3, 1.2, 1.1), v, cab)
    k.bola((0, -0.55, -0.15), (0.8, 0.8, 0.6), v, cab)
    for x in (-0.15, 0.15): k.bola((x, -0.95, -0.05), (0.08, 0.05, 0.08), '#1b1424', cab)
    for x in (-0.32, 0.32):
        k.bola((x, -0.48, 0.18), (0.24, 0.1, 0.2), k.mat('#ffd23f', emit=3), cab)
        k.bola((x, -0.53, 0.18), (0.07, 0.05, 0.16), '#1b1424', cab)
        k.cone((x * 1.4, 0.1, 0.65), (0.2, 0.2, 0.7), '#f1ece0', cab, rot=(-20, 35 * (1 if x > 0 else -1), 0), lados=6)
    for j in range(5): k.cone((-0.4 + j * 0.2, -0.82, -0.36), (0.08, 0.05, 0.14), '#ffffff', cab, rot=(180, 0, 0), lados=4)
    for x in (-1, 1):
        asa = k.vazio(f'asa{x}', (0.6 * x, 0.5, 1.2), c)
        pts = [(0, 0), (0.6, 0.9), (1.4, 1.3), (2.0, 1.0), (1.9, 0.4), (1.6, -0.1), (1.2, 0.2), (0.9, -0.3), (0.5, 0.0)]
        k.placa([(px * x, pz) for px, pz in pts], a, asa, esp=0.08, rot=(0, 0, -15 * x))
        for px, pz in ((0.6, 0.9), (1.4, 1.3), (2.0, 1.0)):
            k.cil((px * x / 2, 0, pz / 2), (0.06, 0.06, math.hypot(px, pz)), '#5a1010', asa, rot=(0, math.degrees(math.atan2(px * x, pz)), 0), lados=5)
        k.cubo((0.75 * x, -0.3, -0.25), (0.55, 0.6, 0.7), a, c, bevel=0.15)
        for j in (-1, 0, 1): k.cone((0.75 * x + j * 0.16, -0.62, -0.55), (0.08, 0.14, 0.14), '#f1ece0', c, rot=(90, 0, 0), lados=4)
    cauda = k.vazio('cauda', (0, 1.0, 0.2), c)
    k.cone((0.6, 0.3, -0.2), (0.6, 0.6, 1.6), v, cauda, rot=(90, 0, -60), lados=8)
def pose(k, i, n): pass
ANIMS = {'f': (1, pose)}
CENA = {'ortho': 6.2, 'alvo_z': 1.7, 'res': 512}
