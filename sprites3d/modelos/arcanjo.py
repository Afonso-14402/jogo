from kit import humanoide, esticar_pernas, R
import math
def construir(k):
    v = humanoide(k, '#f6d7b0', '#f5f2e8', '#e8e2cf', '#d9b44a', cab=0.72, larg=1.1, alt=1.3)
    esticar_pernas(k, 1.5)
    c = v['cabeca']
    k.bola((0, 0.05, 0.36), (0.7, 0.66, 0.4), '#ffd84a', c)
    k.toro((0, 0, 0.75), 0.26, 0.05, k.mat('#ffe680', emit=3), c)
    for x in (-0.11, 0.11): k.bola((x, -0.3, 0.24), (0.08, 0.04, 0.1), k.mat('#3a8aff', emit=2), c)
    for x in (-1, 1): k.bola((0.42 * x, 0, 0.44), (0.34, 0.3, 0.24), k.mat('#ffd23f', metal=0.4, rough=0.3), v['corpo'])
    k.cubo((0, -0.2, 0.28), (0.3, 0.04, 0.34), '#d9b44a', v['corpo'])
    k.cone((0, 0, -0.15), (0.9, 0.6, 0.6), '#f5f2e8', v['corpo'], rot=(180, 0, 0), lados=12)
    for x in (-1, 1):
        for j, (s, rz) in enumerate(((0.75, 0), (0.55, -25))):
            a = k.vazio(f'asa{x}{j}', (0.18 * x, 0.25, 0.45 - j * 0.15), v['corpo'])
            pts = [(0, 0), (0.5, 0.6), (1.2, 0.9), (1.6, 0.6), (1.4, 0.2), (1.1, -0.2), (0.7, -0.1), (0.3, -0.2)]
            k.placa([(px * x * s, pz * s) for px, pz in pts], k.mat('#ffffff', rough=0.6, emit=0.3), a, esp=0.06, rot=(0, rz * x, 0))
    esp = k.vazio('esp', (0, -0.05, -0.36), v['braco_d'], rot=(75, 0, 0))
    k.cubo((0, 0, 0.6), (0.14, 0.05, 1.1), k.mat('#fff3a8', emit=1.5), esp)
    k.cubo((0, 0, 0.05), (0.36, 0.08, 0.06), '#d9b44a', esp)
def pose(k, i, n):
    f = [1, 0, -1][i]
    for x in (-1, 1):
        for j in range(2): k.v[f'asa{x}{j}'].rotation_euler.z = R(25) * f * x
    k.v['perna_e'].rotation_euler.x = R(15); k.v['perna_d'].rotation_euler.x = R(-5)
ANIMS = {'f': (3, pose)}
CENA = {'ortho': 4.2, 'alvo_z': 1.0, 'res': 512}
