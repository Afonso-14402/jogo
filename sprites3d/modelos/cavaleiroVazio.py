from kit import humanoide, andar, R
def construir(k):
    a, b = '#3a3050', '#2a2238'
    v = humanoide(k, a, a, b, '#1b1424', larg=1.15)
    c = v['cabeca']
    k.cubo((0, -0.4, 0.3), (0.62, 0.06, 0.1), k.mat('#ff3b3b', emit=4), c)
    for x in (-1, 1): k.cone((0.32 * x, 0, 0.75), (0.12, 0.12, 0.4), '#1b1424', c, rot=(0, 25 * x, 0), lados=6)
    k.cubo((0, -0.2, 0.26), (0.3, 0.04, 0.3), '#7a3fa8', v['corpo'])
    for x in (-1, 1): k.bola((0.46 * x, 0, 0.42), (0.36, 0.34, 0.26), '#4a3f66', v['corpo'])
    capa = k.vazio('capa', (0, 0.22, 0.48), v['corpo'])
    k.cubo((0, 0.04, -0.4), (0.7, 0.06, 0.95), '#4a2266', capa)
    esp = k.vazio('esp', (0, -0.05, -0.36), v['braco_d'], rot=(75, 0, 0))
    k.cubo((0, 0, 0.5), (0.1, 0.04, 0.9), k.mat('#b48aff', rough=0.2, emit=0.6), esp)
    k.cubo((0, 0, 0.05), (0.26, 0.06, 0.05), '#1b1424', esp)
def pose(k, i, n): andar(k, i, n, perna=24, braco=16, salto=0.04)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.7, 'alvo_z': 0.9}
