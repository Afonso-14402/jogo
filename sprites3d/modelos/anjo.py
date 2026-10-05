# Anjos (anjoGuerreiro com lança / arqueiroCeleste com arco)
from kit import humanoide, andar, R
import os, math
TIPO = os.environ.get('TIPO', 'guerreiro')
def construir(k):
    v = humanoide(k, '#f6d7b0', '#f5f2e8', '#e8e2cf', '#d9b44a', cab=0.95)
    c = v['cabeca']
    k.bola((0, 0.02, 0.5), (0.9, 0.82, 0.4), '#ffd84a', c)  # cabelo
    k.toro((0, 0, 0.92), 0.28, 0.05, k.mat('#ffe680', emit=3), c)
    for x in (-0.15, 0.15): k.bola((x, -0.4, 0.3), (0.08, 0.04, 0.1), '#1b1424', c)
    k.cubo((0, -0.2, 0.3), (0.2, 0.04, 0.3), '#d9b44a', v['corpo'])
    k.cubo((0, -0.0, -0.1), (0.68, 0.42, 0.3), '#f5f2e8', v['corpo'])
    for x in (-1, 1):
        a = k.vazio(f'asa{x}', (0.18 * x, 0.25, 0.4), v['corpo'])
        k.v[f'asa{x}'] = a
        pts = [(0, 0), (0.4, 0.45), (0.9, 0.6), (1.1, 0.3), (0.95, 0.0), (0.75, -0.3), (0.45, -0.25), (0.2, -0.2)]
        k.placa([(px * x, pz) for px, pz in pts], k.mat('#ffffff', rough=0.6, emit=0.3), a, esp=0.06)
    arma = k.vazio('arma', (0, -0.05, -0.36), v['braco_d'])
    if TIPO == 'guerreiro':
        k.cil((0, 0, 0.3), (0.06, 0.06, 1.6), '#d9b44a', arma, lados=6)
        k.cone((0, 0, 1.18), (0.16, 0.06, 0.36), k.mat('#fff3a8', emit=1.5), arma, lados=4)
    else:
        k.toro((0, 0, 0.1), 0.55, 0.045, '#d9b44a', arma, rot=(90, 0, 90))
        k.cubo((0, 0.02, 0.1), (0.01, 0.01, 1.05), k.mat('#fff3a8', emit=2), arma)
def pose(k, i, n):
    andar(k, i, n, perna=14, braco=10, salto=0.08)
    f = math.cos(i / n * 2 * math.pi)
    k.v['asa1'].rotation_euler.z = R(25) * f; k.v['asa-1'].rotation_euler.z = -R(25) * f
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.9, 'alvo_z': 0.95}
