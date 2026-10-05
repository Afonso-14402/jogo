# Projéteis (vistos de cima, a apontar para a direita: o jogo roda-os na direção do voo)
from kit import R
import os, math, random
TIPO = os.environ.get('TIPO', 'fogo')
ANIMS = {}
CENA = {'ortho': 2.0, 'alvo_z': 0.0, 'inclinacao': 90, 'sol': 3.0}
def construir(k):
    r = k.vazio('r'); globals()['f_' + TIPO](k, r)
    if not ANIMS: ANIMS['f'] = (1, lambda k, i, n: None)

def f_fogo(k, r):
    k.v['ch'] = ch = k.vazio('ch', (0, 0, 0), r)
    k.bola((0.45, 0, 0.1), (0.55, 0.55, 0.55), k.mat('#fff3a8', emit=5), ch)
    k.bola((0.35, 0, 0), (0.85, 0.85, 0.7), k.mat('#ffd23f', emit=4), ch)
    k.bola((0.2, 0, -0.1), (1.05, 1.0, 0.6), k.mat('#ff8a2a', emit=3), ch)
    for j in range(3):
        k.v[f'c{j}'] = c = k.vazio(f'c{j}', (-0.2, 0, -0.15), ch)
        k.cone((-0.55, 0, 0), (0.75 - j * 0.15, 0.55 - j * 0.12, 1.1 - j * 0.15), k.mat(['#ff5a1a', '#e8401a', '#ff7a2a'][j], emit=2.5), c, rot=(0, -90, 0), lados=8)
    def pose(k, i, n):
        for j in range(3):
            k.v[f'c{j}'].rotation_euler.z = math.radians(14 * math.sin(i * 1.6 + j * 2.1))
    ANIMS['f'] = (4, pose)
    CENA.update(ortho=2.6)

def f_flecha(k, r):
    k.cil((0, 0, 0), (0.06, 0.06, 1.7), '#d8c9a3', r, rot=(0, 90, 0), lados=6)
    k.cone((0.95, 0, 0), (0.22, 0.12, 0.3), '#dfe4ef', r, rot=(0, 90, 0), lados=4)
    for s in (-1, 1): k.placa([(0, 0), (0.3, 0.0), (0.12, 0.2 * s), (-0.1, 0.22 * s)], '#ffffff', r, loc=(-0.85, 0, 0.02), rot=(90, 0, 0), esp=0.02)
    CENA.update(ortho=2.1)

def f_rocha(k, r):
    k.v['p'] = p = k.vazio('p', (0, 0, 0), r)
    k.bola((0, 0, 0), (1.6, 1.4, 1.3), '#8a7a6a', p)
    for x, y, s in ((0.3, 0.3, 0.6), (-0.4, 0.1, 0.5), (0.1, -0.45, 0.45)): k.bola((x, y, 0.35), (s, s, s * 0.6), '#7a6a5a', p)
    ANIMS['f'] = (4, lambda k, i, n: setattr(k.v['p'].rotation_euler, 'z', i * math.pi / 2))
    CENA.update(ortho=1.9)

def f_lamina(k, r):
    k.v['p'] = p = k.vazio('p', (0, 0, 0), r)
    m = k.mat('#c8d0e0', metal=0.4, rough=0.2)
    for j in range(3):
        g = k.vazio(f'g{j}', (0, 0, 0), p, rot=(0, 0, j * 120))
        k.placa([(0.1, -0.1), (0.95, 0.1), (0.45, 0.25), (0.05, 0.2)], m, g, rot=(90, 0, 0), esp=0.06)
    k.cil((0, 0, 0), (0.4, 0.4, 0.12), '#5a5f6e', p, lados=10)
    ANIMS['f'] = (4, lambda k, i, n: setattr(k.v['p'].rotation_euler, 'z', i * math.pi * 2 / 3 / 4))
    CENA.update(ortho=2.1)

def f_gelo(k, r):  # estilhaço de gelo (Nova de Gelo / inimigos de gelo)
    m = k.mat('#9fe0ff', rough=0.08, emit=0.6)
    k.cone((0.2, 0, 0), (0.5, 0.35, 1.4), m, r, rot=(0, 90, 0), lados=4)
    k.cone((-0.55, 0, 0), (0.5, 0.35, 0.3), m, r, rot=(0, -90, 0), lados=4)
    CENA.update(ortho=1.9)
