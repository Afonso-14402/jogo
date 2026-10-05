from kit import humanoide, andar, R
def construir(k):
    v = humanoide(k, '#eef4fb', '#dfe9f5', '#dfe9f5', '#9fb4cc', larg=1.35, cab=1.0, alt=1.05)
    c = v['cabeca']
    k.bola((0, -0.3, 0.22), (0.56, 0.3, 0.5), '#7ab0e0', c)  # cara azul
    for x in (-0.14, 0.14):
        k.bola((x, -0.45, 0.32), (0.13, 0.06, 0.12), k.mat('#ff3b3b', emit=3), c)
    k.cubo((0, -0.46, 0.08), (0.3, 0.06, 0.1), '#1b1424', c)
    for x in (-0.08, 0.08): k.cone((x, -0.49, 0.1), (0.07, 0.04, 0.1), '#ffffff', c, lados=4)
    for b in (v['braco_e'], v['braco_d']):
        b.scale = (1.3, 1.3, 1.15)
def pose(k, i, n): andar(k, i, n, perna=22, braco=18, salto=0.05)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.8, 'alvo_z': 0.9}
