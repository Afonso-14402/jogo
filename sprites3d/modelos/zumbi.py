from kit import humanoide, andar, R
def construir(k):
    v = humanoide(k, '#7fb05a', '#4a6a8a', '#4a4058', '#3b2a1c')
    c = v['cabeca']
    for x, s in ((-0.17, 0.14), (0.17, 0.11)):
        k.bola((x, -0.4, 0.34), (s, 0.06, s), k.mat('#ff3b3b', emit=3), c)
    k.bola((0, 0.05, 0.62), (0.7, 0.6, 0.2), '#3a5a2a', c)
    k.cubo((0.02, -0.39, 0.12), (0.28, 0.06, 0.08), '#1b1424', c)
    k.cubo((0.12, -0.2, 0.1), (0.2, 0.04, 0.16), '#2a3a5a', v['corpo'])  # rasgão
    k.cubo((-0.14, -0.2, 0.32), (0.16, 0.04, 0.1), '#7fb05a', v['corpo'])

def pose(k, i, n):
    andar(k, i, n, perna=22, braco=8, salto=0.03)
    k.v['braco_e'].rotation_euler = (R(-55), R(-25), 0)  # braços para a frente e para os lados
    k.v['braco_d'].rotation_euler = (R(-55), R(25), 0)
    k.v['cabeca'].rotation_euler.y = R(8)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.5, 'alvo_z': 0.9}
