# Chão da cidade (32x32, repete-se): relva0-2, calc0-1, muralha. TEMA 0-9
from kit import R
import os, math, random
TIPO = os.environ.get('TIPO', 'relva0'); TEMA = int(os.environ.get('TEMA', '0'))
import importlib.util, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cidade import TEMAS, clarear
from ladrilho import repetido
CALC, RELVA, MUR, FONTE, LUZ = TEMAS[TEMA]
FLORES = [['#ff7fd0', '#ffe14d', '#ffffff'], ['#b48cff', '#d0d0d0', '#7d9a7d'], ['#ff7b25', '#ffd23f', '#ff3b3b'], ['#9fdcff', '#ffffff', '#cfe8ff'],
          ['#7dff5a', '#ffe14d', '#d0ff7a'], ['#ff7b25', '#ffe680', '#4dc3ff'], ['#ff9ff3', '#9fdcff', '#ffffff'], ['#b44dff', '#d08aff', '#ff4dff'],
          ['#ffe680', '#ffffff', '#9fdcff'], ['#ff3b3b', '#ff8a5a', '#ffd23f']][TEMA]
random.seed(TEMA * 13 + hash(TIPO) % 97)
ANIMS = {'f': (1, lambda k, i, n: None)}
CENA = {'ortho': 2.0, 'alvo_z': 0.0, 'inclinacao': 90, 'sol': 3.0, 'ambiente': 0.5}
def construir(k):
    r = k.vazio('r')
    if TIPO.startswith('relva'):
        k.cubo((0, 0, -0.05), (2.2, 2.2, 0.1), RELVA[0], r)
        for _ in range(26):
            x, y = random.uniform(-1, 1), random.uniform(-1, 1)
            cor = random.choice([RELVA[0], RELVA[1], RELVA[1], RELVA[2]])
            repetido(lambda X, Y: k.cone((X, Y, 0.02), (0.12, 0.12, 0.12), cor, r, lados=4, rot=(random.uniform(-30, 30), random.uniform(-30, 30), 0)), x, y, 0.1)
        if TIPO == 'relva1':
            for _ in range(5): k.bola((random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 0.0), (0.4, 0.3, 0.06), RELVA[1], r)
        if TIPO == 'relva2':
            for j in range(4):
                x, y = random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7)
                k.cil((x, y, 0.03), (0.04, 0.04, 0.06), RELVA[1], r, lados=4)
                k.bola((x, y, 0.08), (0.14, 0.14, 0.08), k.mat(FLORES[j % 3], emit=0.3), r)
    elif TIPO.startswith('calc'):
        k.cubo((0, 0, -0.08), (2.2, 2.2, 0.04), CALC[2], r)
        for gy in range(4):
            for gx in range(4):
                x = -1 + 0.25 + gx * 0.5 + (0.25 if gy % 2 else 0); y = -1 + 0.25 + gy * 0.5
                if x > 1: x -= 2
                cor = CALC[0] if (gx + gy + (TIPO == 'calc1')) % 3 else CALC[1]
                repetido(lambda X, Y: k.cubo((X, Y, random.uniform(-0.01, 0.01)), (0.46, 0.44, 0.1), cor, r, bevel=0.05), x, y, 0.3)
    else:  # muralha (vista de cima com a face a aparecer em baixo)
        k.cubo((0, 0, -0.05), (2.2, 2.2, 0.1), MUR[2], r)
        for gx in range(2):
            repetido(lambda X, Y: k.cubo((X, Y, 0.0), (0.94, 0.94, 0.12), MUR[1], r, bevel=0.06), -0.5 + gx, 0.5, 0.5)
            repetido(lambda X, Y: k.cubo((X, Y, 0.0), (0.94, 0.94, 0.12), MUR[0], r, bevel=0.06), -0.0 + gx - (0.5 if gx else 0) + (0.5 if not gx else 0) - 0.5, -0.5, 0.5)
