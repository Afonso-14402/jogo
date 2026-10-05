# Lobo de gelo visto de lado (o jogo vira-o quando anda para a esquerda)
from kit import R
import math
def construir(k):
    raiz = k.vazio('corpo', (0, 0, 0.62), rot=(0, 0, 90))  # virado para a direita
    m, m2 = '#dfeaf5', '#9fc4e0'
    k.bola((0, 0, 0), (0.62, 1.3, 0.6), m, raiz)
    cab = k.vazio('cab', (0, -0.68, 0.26), raiz)
    k.bola((0, 0, 0), (0.5, 0.52, 0.48), m, cab)
    k.bola((0, -0.32, -0.08), (0.28, 0.4, 0.24), m, cab)
    k.bola((0, -0.52, -0.04), (0.1, 0.08, 0.08), '#1b1424', cab)
    for x in (-0.15, 0.15):
        k.cone((x, 0.06, 0.3), (0.16, 0.12, 0.3), m2, cab, lados=4)
        k.bola((x, -0.22, 0.08), (0.08, 0.06, 0.08), k.mat('#6fd8ff', emit=3), cab)
    cauda = k.vazio('cauda', (0, 0.62, 0.15), raiz)
    k.bola((0, 0.28, 0.14), (0.24, 0.6, 0.24), m2, cauda, rot=(30, 0, 0))
    for nome, y, x in (('pa_e', -0.4, 0.24), ('pa_d', -0.4, -0.24), ('pt_e', 0.4, 0.24), ('pt_d', 0.4, -0.24)):
        p = k.vazio(nome, (x, y, -0.15), raiz)
        k.cubo((0, 0, -0.2), (0.16, 0.16, 0.44), m2 if 't' in nome else m, p, bevel=0.03)
    for j, y in enumerate((-0.3, 0.0, 0.3)):  # espinhos de gelo nas costas
        k.cone((0, y, 0.55), (0.14, 0.14, 0.34), k.mat('#bff0ff', rough=0.1, emit=0.5), raiz, lados=4)

def pose(k, i, n):
    f = i / n * 2 * math.pi
    s = math.sin(f)
    k.v['pa_e'].rotation_euler.x = R(35) * s; k.v['pt_d'].rotation_euler.x = R(35) * s
    k.v['pa_d'].rotation_euler.x = -R(35) * s; k.v['pt_e'].rotation_euler.x = -R(35) * s
    k.v['corpo'].location.z = 0.62 + 0.05 * abs(math.cos(f))
    k.v['cauda'].rotation_euler.x = R(10) * s
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 3.2, 'alvo_z': 0.6, 'inclinacao': 15}
