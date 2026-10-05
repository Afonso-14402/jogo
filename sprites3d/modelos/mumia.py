from kit import humanoide, andar, R
def construir(k):
    p = '#e8dcc0'
    v = humanoide(k, p, p, p, '#c8b894', magro=True)
    for z in (0.08, 0.2, 0.32, 0.44):
        k.cubo((0, -0.11 if z % 0.24 else -0.1, z), (0.42, 0.04, 0.03), '#a89a78', v['corpo'], rot=(0, 8 if z > 0.2 else -8, 0))
    c = v['cabeca']
    k.cubo((0, -0.4, 0.33), (0.6, 0.06, 0.14), '#1b1424', c)
    for x in (-0.13, 0.13): k.bola((x, -0.44, 0.33), (0.09, 0.04, 0.09), k.mat('#6fff6a', emit=4), c)
    for z in (0.12, 0.5): k.cubo((0, -0.38, z), (0.66, 0.05, 0.04), '#a89a78', c, rot=(0, 6, 0))
def pose(k, i, n):
    andar(k, i, n, perna=18, braco=6, salto=0.03)
    k.v['braco_e'].rotation_euler.x += R(-75); k.v['braco_d'].rotation_euler.x += R(-75)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.5, 'alvo_z': 0.9}
