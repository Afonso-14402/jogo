# Slime verde: [0] a saltar (esticado), [1] parado (achatado). Cores mudam com COR.
from kit import R
import os
COR = os.environ.get('COR', 'verde')
P = {'verde': ('#5fd35f', '#3a9a3a'), 'lava': ('#ff7a2a', '#c8401a')}[COR]

def construir(k):
    c = k.vazio('corpo')
    k.v['b'] = k.bola((0, 0, 0.5), (1.5, 1.3, 1.0), k.mat(P[0], rough=0.15), c)
    k.bola((-0.32, -0.42, 0.78), (0.28, 0.12, 0.22), k.mat('#ffffff', rough=0.1, emit=0.6), c)  # brilho
    for x in (-0.28, 0.28):
        k.bola((x, -0.6, 0.55), (0.2, 0.1, 0.26), '#1b1424', c)
        k.bola((x - 0.04, -0.66, 0.6), (0.08, 0.05, 0.08), k.mat('#ffffff', emit=2), c)
    if COR == 'lava':
        for x, z in ((0.45, 0.85), (-0.1, 0.95), (0.6, 0.4)):
            k.bola((x, -0.3, z), (0.16, 0.16, 0.16), k.mat('#ffd23f', emit=3), c)

def pose(k, i, n):
    c = k.v['corpo']
    if i == 0: c.scale = (0.82, 0.82, 1.28)   # a saltar
    else: c.scale = (1.12, 1.12, 0.8)        # achatado no chão

ANIMS = {'f': (2, pose)}
CENA = {'ortho': 3.4, 'alvo_z': 0.6}
