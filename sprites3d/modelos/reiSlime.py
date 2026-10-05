from kit import R
def construir(k):
    c = k.vazio('corpo')
    k.bola((0, 0, 0.9), (2.8, 2.4, 1.8), k.mat('#5fd35f', rough=0.15), c)
    k.bola((-0.6, -0.8, 1.4), (0.5, 0.2, 0.35), k.mat('#ffffff', rough=0.1, emit=0.6), c)
    for x in (-0.5, 0.5):
        k.bola((x, -1.08, 1.0), (0.36, 0.14, 0.5), '#1b1424', c)
        k.bola((x - 0.07, -1.16, 1.1), (0.14, 0.06, 0.14), k.mat('#ffffff', emit=2), c)
    k.cubo((0, -1.1, 0.6), (0.5, 0.06, 0.08), '#1b1424', c)
    cor = k.vazio('coroa', (0, 0, 1.75), c)
    ouro = k.mat('#ffd23f', rough=0.3, metal=0.3)
    k.cil((0, 0, 0.12), (1.0, 1.0, 0.25), ouro, cor, lados=16)
    for j in range(5):
        import math; a = j / 5 * 2 * math.pi - math.pi / 2
        k.cone((0.45 * math.cos(a), 0.45 * math.sin(a), 0.42), (0.24, 0.24, 0.42), ouro, cor, lados=4)
    for x, cr in ((-0.3, '#e04848'), (0.0, '#3a8aff'), (0.3, '#e04848')):
        k.bola((x, -0.5, 0.14), (0.14, 0.08, 0.14), k.mat(cr, emit=1.5), cor)
def pose(k, i, n):
    c = k.v['corpo']
    c.scale = (0.85, 0.85, 1.22) if i == 0 else (1.08, 1.08, 0.86)
ANIMS = {'f': (2, pose)}
CENA = {'ortho': 6.0, 'alvo_z': 1.2, 'res': 512}
