# [1] = golpe com a espada grande
from kit import humanoide, esticar_pernas, R
def construir(k):
    a, b = '#2e2640', '#1e1830'
    v = humanoide(k, a, a, b, '#140f1c', larg=1.3, alt=1.35, cab=0.72)
    esticar_pernas(k, 1.6)
    c = v['cabeca']
    k.cubo((0, -0.3, 0.26), (0.44, 0.06, 0.08), k.mat('#c06aff', emit=4), c)
    for x in (-1, 1):
        k.cone((0.35 * x, 0, 0.8), (0.16, 0.16, 0.6), '#140f1c', c, rot=(0, 30 * x, 0), lados=6)
        k.bola((0.5 * x, 0, 0.44), (0.42, 0.4, 0.3), '#3e3456', v['corpo'])
        k.cone((0.62 * x, 0, 0.66), (0.1, 0.1, 0.3), '#140f1c', v['corpo'], rot=(0, 40 * x, 0), lados=5)
    k.cubo((0, -0.2, 0.26), (0.3, 0.04, 0.34), '#7a3fa8', v['corpo'])
    capa = k.vazio('capa', (0, 0.24, 0.5), v['corpo'])
    k.placa([(-0.6, 0.0), (0.6, 0.0), (0.95, -1.4), (0.5, -1.3), (0, -1.45), (-0.5, -1.3), (-0.95, -1.4)], '#4a2266', capa, esp=0.06)
    esp = k.vazio('esp', (0, -0.05, -0.36), v['braco_d'], rot=(75, 0, 0))
    k.cubo((0, 0, 0.75), (0.2, 0.05, 1.4), k.mat('#b48aff', rough=0.2, emit=0.8), esp)
    k.cubo((0, 0, 0.05), (0.42, 0.08, 0.07), '#140f1c', esp)
def pose(k, i, n):
    if i == 1:
        k.v['braco_d'].rotation_euler = (R(-160), 0, R(-10)); k.v['corpo'].rotation_euler.x = R(-6)
    else:
        k.v['braco_d'].rotation_euler = (R(-20), 0, 0); k.v['corpo'].rotation_euler.x = 0
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 3.8, 'alvo_z': 1.0, 'res': 512}
