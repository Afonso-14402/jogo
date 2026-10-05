# Baú: madeira / ouro / maldito; MIMICO=1 faz o baú com dentes a abrir e fechar
from kit import R
import os, math
TIPO = os.environ.get('TIPO', 'madeira')
CORES = {'madeira': ('#a8743a', '#6b4a2a', '#9aa3b8', '#ffd23f'),
         'ouro': ('#ffd23f', '#c99a1e', '#fff3a8', '#e04848'),
         'maldito': ('#7a3fa8', '#4a2266', '#3b2a4c', '#e04848'),
         'mimico': ('#a8743a', '#6b4a2a', '#9aa3b8', '#ffd23f')}[TIPO]

def construir(k):
    madeira, escuro, metal, fecho = CORES
    c = k.vazio('corpo')
    k.cubo((0, 0, 0.3), (1.6, 1.0, 0.6), madeira, c, bevel=0.05)
    for x in (-0.6, 0.6):
        k.cubo((x, 0, 0.3), (0.14, 1.04, 0.62), metal, c, bevel=0.02, rough=0.3)
    tampa = k.vazio('tampa', (0, 0.5, 0.6), c)
    k.cubo((0, -0.5, 0.18), (1.64, 1.04, 0.36), madeira, tampa, bevel=0.06)
    k.cil((0, -0.5, 0.36), (0.6, 1.04, 1.64), madeira, tampa, rot=(0, 90, 0), lados=16)
    for x in (-0.6, 0.6):
        k.cil((x, -0.5, 0.36), (0.64, 1.08, 0.15), metal, tampa, rot=(0, 90, 0), lados=16, rough=0.3)
    k.cubo((0, -1.03, 0.12), (0.26, 0.08, 0.3), fecho, tampa, bevel=0.03, rough=0.3)
    k.cubo((0, -1.08, 0.12), (0.1, 0.04, 0.1), '#1b1424', tampa)
    k.cubo((0, -0.52, 0.58), (1.62, 0.04, 0.06), '#1b1424', c)
    if TIPO == 'mimico':
        k.cubo((0, 0, 0.58), (1.44, 0.84, 0.06), '#8a1a2a', c)
        for j in range(7):
            x = -0.6 + j * 0.2
            k.cone((x, -0.44, 0.68), (0.14, 0.08, 0.2), '#f1ece0', c, lados=4)
            k.cone((x + 0.1, -0.52, -0.03), (0.14, 0.08, 0.2), '#f1ece0', tampa, rot=(180, 0, 0), lados=4)
        k.bola((0, -0.4, 0.6), (0.6, 0.3, 0.12), '#e04848', tampa)  # língua
        for x in (-0.35, 0.35):
            k.bola((x, -1.05, 0.25), (0.16, 0.06, 0.16), k.mat('#ffd23f', emit=3), tampa)

def pose(k, i, n):
    if TIPO == 'mimico':
        k.v['tampa'].rotation_euler.x = R(-10 - 42 * (0.5 - 0.5 * math.cos(i / n * 2 * math.pi)))

ANIMS = {'f': (4 if TIPO == 'mimico' else 1, pose)}
CENA = {'ortho': 2.6, 'alvo_z': 0.6, 'inclinacao': 26}
