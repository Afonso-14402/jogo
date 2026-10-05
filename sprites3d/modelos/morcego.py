from kit import R
import math
def construir(k):
    c = k.vazio('corpo', (0, 0, 1))
    k.bola((0, 0, 0), (0.7, 0.6, 0.66), '#8a64c0', c)
    for x in (-0.18, 0.18):
        k.bola((x, -0.3, 0.06), (0.14, 0.08, 0.12), k.mat('#ff3b3b', emit=3), c)
        k.cone((x * 1.4, 0, 0.38), (0.2, 0.14, 0.32), '#5b3f86', c, lados=6)
    k.bola((0, -0.3, -0.16), (0.24, 0.06, 0.08), '#1b1424', c)
    for lado, nome in ((1, 'asa_e'), (-1, 'asa_d')):
        a = k.vazio(nome, (0.3 * lado, 0, 0.05), c)
        pts = [(0, 0.15), (0.5, 0.4), (1.0, 0.55), (1.35, 0.2), (1.2, -0.05), (0.95, -0.35), (0.7, -0.15), (0.45, -0.35), (0.2, -0.15)]
        k.placa([(x * lado, z) for x, z in pts], '#5b3f86', a)

def pose(k, i, n):
    f = math.cos(i / n * 2 * math.pi)
    k.v['asa_e'].rotation_euler.y = R(-45) * f
    k.v['asa_d'].rotation_euler.y = R(45) * f
    k.v['corpo'].location.z = 1 + 0.08 * f

ANIMS = {'f': (4, pose)}
CENA = {'ortho': 3.6, 'alvo_z': 1.0}
