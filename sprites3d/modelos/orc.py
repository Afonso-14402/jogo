from kit import humanoide, andar, R
def construir(k):
    v = humanoide(k, '#6fae3c', '#6b4a2a', '#4a4058', '#3b2a1c', larg=1.15)
    c = v['cabeca']
    for x in (-0.18, 0.18):
        k.bola((x, -0.4, 0.38), (0.16, 0.08, 0.12), k.mat('#ffd23f', emit=2.5), c)
        k.cone((x * 0.9, -0.42, 0.14), (0.1, 0.1, 0.22), '#e8e2cf', c, lados=6)
    k.cubo((0, -0.38, 0.5), (0.52, 0.1, 0.07), '#2d4a18', c)
    k.cubo((0, -0.4, 0.06), (0.36, 0.06, 0.08), '#1b1424', c)  # sobrancelha
    k.cubo((0, -0.2, 0.3), (0.3, 0.06, 0.2), '#8a6a3a', v['corpo'])  # placa do peito
    k.cubo((0, 0, 0.06), (0.74, 0.44, 0.1), '#3b2a1c', v['corpo'])
    clava = k.vazio('clava', (0, -0.04, -0.36), v['braco_d'], rot=(70, 0, 0))
    k.cil((0, 0, 0.3), (0.1, 0.1, 0.7), '#6b4a2a', clava)
    k.bola((0, 0, 0.7), (0.26, 0.26, 0.34), '#8a6a3a', clava)

def pose(k, i, n): andar(k, i, n, perna=30, braco=20, salto=0.06)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.5, 'alvo_z': 0.9}
