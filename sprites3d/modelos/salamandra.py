from kit import R
import math
def construir(k):
    raiz = k.vazio('corpo', (0, 0, 0.3), rot=(0, 0, 90))
    lar, esc = '#ff8a2a', '#c84a1a'
    k.bola((0, 0, 0), (0.7, 1.4, 0.55), lar, raiz)
    cab = k.vazio('cab', (0, -0.78, 0.08), raiz)
    k.bola((0, -0.1, 0), (0.46, 0.66, 0.34), lar, cab)
    for x in (-0.16, 0.16): k.bola((x, -0.2, 0.14), (0.12, 0.1, 0.12), k.mat('#ffd23f', emit=3), cab)
    k.v['cauda'] = ca = k.vazio('cauda', (0, 0.65, 0), raiz)
    k.cone((0, 0.32, 0), (0.36, 0.3, 0.7), esc, ca, rot=(-90, 0, 0), lados=8)
    for j, y in enumerate((-0.4, 0.0, 0.4, 0.8)):
        k.cone((0, y, 0.25), (0.16, 0.16, 0.3), k.mat('#ffd23f', emit=2), raiz, lados=4)
    for nome, y, x in (('pa_e', -0.4, 0.3), ('pa_d', -0.4, -0.3), ('pt_e', 0.4, 0.3), ('pt_d', 0.4, -0.3)):
        p = k.vazio(nome, (x, y, -0.05), raiz)
        k.cubo((0.08 * (1 if x > 0 else -1), 0, -0.16), (0.14, 0.14, 0.32), esc, p, bevel=0.03)
def pose(k, i, n):
    s = math.sin(i / n * 2 * math.pi)
    k.v['pa_e'].rotation_euler.x = R(30) * s; k.v['pt_d'].rotation_euler.x = R(30) * s
    k.v['pa_d'].rotation_euler.x = -R(30) * s; k.v['pt_e'].rotation_euler.x = -R(30) * s
    k.v['cauda'].rotation_euler.z = R(15) * s
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 3.4, 'alvo_z': 0.3, 'inclinacao': 15}
