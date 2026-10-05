# Carrasco: manto com capuz bicudo, caixão à frente e foice; [1] = a ceifar
from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 0))
    m, e = '#3a3248', '#2a2238'
    k.cone((0, 0, 1.2), (1.7, 1.3, 2.4), m, c, lados=16)
    k.bola((0, 0, 2.35), (1.0, 0.9, 0.9), m, c)
    k.cone((0, 0.1, 3.0), (0.8, 0.8, 1.0), m, c, rot=(-15, 0, 0), lados=12)
    k.bola((0, -0.3, 2.3), (0.66, 0.5, 0.66), '#140f1c', c)
    for x in (-0.15, 0.15): k.bola((x, -0.56, 2.32), (0.14, 0.05, 0.1), k.mat('#ff3b3b', emit=4), c)
    for x in (-1, 1): k.bola((0.85 * x, -0.1, 1.85), (0.6, 0.6, 0.5), e, c)
    cx = k.vazio('caixao', (0, -0.75, 1.15), c)
    k.cubo((0, 0, 0), (1.1, 0.35, 1.6), '#6a4a2a', cx, bevel=0.06)
    for z in (-0.5, 0.0, 0.5): k.cubo((0, -0.02, z), (1.12, 0.37, 0.07), '#3b2a1c', cx)
    k.cubo((0, -0.19, 0.25), (0.08, 0.02, 0.5), '#c8b894', cx); k.cubo((0, -0.19, 0.35), (0.3, 0.02, 0.08), '#c8b894', cx)
    for x in (-1, 1): k.bola((0.62 * x, -0.95, 1.3), (0.26, 0.26, 0.26), '#d8d0c0', c)
    k.v['foice'] = f = k.vazio('foice', (1.0, -0.4, 0.2), c)
    k.cil((0, 0, 1.4), (0.08, 0.08, 3.0), '#4a3a2a', f, lados=6)
    k.placa([(0, 0), (-0.9, 0.2), (-1.5, -0.3), (-0.9, -0.05), (-0.1, -0.25)], k.mat('#c8d0e0', rough=0.2), f, loc=(0, 0, 2.85), esp=0.05)
def pose(k, i, n):
    f = k.v['foice']
    if i == 1: f.rotation_euler = (R(-20), R(-70), 0); f.location = (0.6, -0.6, 1.6)
    else: f.rotation_euler = (0, 0, 0); f.location = (1.0, -0.4, 0.2)
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 4.6, 'alvo_z': 1.7, 'res': 512}
