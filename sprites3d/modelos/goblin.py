from kit import humanoide, andar, R
def construir(k):
    v = humanoide(k, '#7cc04a', '#8a5a2a', '#5a4030', '#3b2a1c', cab=1.05, alt=0.85, larg=0.9)
    c = v['cabeca']
    for x in (-1, 1):
        k.cone((0.52 * x, 0, 0.36), (0.18, 0.12, 0.5), '#7cc04a', c, rot=(0, 75 * x, 0), lados=6)
        k.bola((0.17 * x, -0.43, 0.36), (0.16, 0.06, 0.16), k.mat('#ffd23f', emit=2.5), c)
        k.bola((0.17 * x, -0.47, 0.36), (0.06, 0.03, 0.08), '#1b1424', c)
    k.cone((0, -0.46, 0.22), (0.12, 0.2, 0.14), '#5fa03a', c, rot=(90, 0, 0), lados=6)
    k.cubo((0, -0.43, 0.06), (0.26, 0.05, 0.05), '#1b1424', c)
    adaga = k.vazio('adaga', (0, -0.06, -0.36), v['braco_d'], rot=(80, 0, 0))
    k.cubo((0, 0, 0.26), (0.08, 0.03, 0.4), k.mat('#dfe4ef', rough=0.2), adaga)
    k.cubo((0, 0, 0.05), (0.18, 0.05, 0.04), '#8a6a3a', adaga)
def pose(k, i, n): andar(k, i, n, perna=34, braco=26, salto=0.07)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.4, 'alvo_z': 0.8}
