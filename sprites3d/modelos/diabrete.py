from kit import humanoide, R
import math
def construir(k):
    v = humanoide(k, '#d84040', '#b83030', '#9a2828', '#5a1a1a', cab=1.1)
    c = v['cabeca']
    for x in (-0.3, 0.3):
        k.cone((x, 0, 0.72), (0.14, 0.14, 0.34), '#f1ece0', c, rot=(0, 25 if x > 0 else -25, 0), lados=8)
        k.bola((x * 0.6, -0.46, 0.38), (0.16, 0.06, 0.14), k.mat('#ffd23f', emit=3), c)
    k.cubo((0, -0.45, 0.16), (0.32, 0.06, 0.08), '#1b1424', c)
    for x in (-0.08, 0.08): k.cone((x, -0.47, 0.13), (0.06, 0.03, 0.08), '#ffffff', c, rot=(180, 0, 0), lados=4)
    cauda = k.vazio('cauda', (0, 0.2, 0.0), v['corpo'])
    k.cil((0, 0.25, -0.1), (0.06, 0.06, 0.6), '#b83030', cauda, rot=(60, 0, 0), lados=6)
    k.cone((0, 0.55, 0.1), (0.2, 0.06, 0.2), '#b83030', cauda, lados=3)
    for lado, nome in ((1, 'asa_e'), (-1, 'asa_d')):
        a = k.vazio(nome, (0.2 * lado, 0.2, 0.36), v['corpo'])
        pts = [(0, 0), (0.4, 0.4), (0.8, 0.45), (0.7, 0.15), (0.55, 0.0), (0.4, -0.15), (0.15, -0.1)]
        k.placa([(x * lado, z) for x, z in pts], '#7a2020', a)

def pose(k, i, n):
    f = math.cos(i / n * 2 * math.pi)
    k.v['asa_e'].rotation_euler.z = R(-35) * f
    k.v['asa_d'].rotation_euler.z = R(35) * f
    k.v['perna_e'].rotation_euler.x = R(20)
    k.v['perna_d'].rotation_euler.x = R(-10)
    k.v['braco_e'].rotation_euler.y = R(20)
    k.v['braco_d'].rotation_euler.y = R(-20)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.6, 'alvo_z': 0.9}
