from kit import humanoide, andar, R
def construir(k):
    v = humanoide(k, '#e8e2cf', '#d6cfb8', '#d6cfb8', '#b8ae94', magro=True)
    c = v['cabeca']
    for x in (-0.17, 0.17):
        k.bola((x, -0.37, 0.32), (0.22, 0.1, 0.24), '#1b1424', c)
        k.bola((x, -0.42, 0.32), (0.1, 0.04, 0.1), k.mat('#ff3b3b', emit=4), c)
    k.cubo((0, -0.41, 0.08), (0.2, 0.05, 0.05), '#1b1424', c)  # dentes
    for z in (0.12, 0.26, 0.4):  # costelas
        k.cubo((0, -0.11, z), (0.5, 0.06, 0.05), '#1b1424', v['corpo'])
    arco = k.vazio('arco', (0, -0.05, -0.36), v['braco_d'])
    k.toro((0, 0, 0.1), 0.5, 0.04, '#6b4a2a', arco, rot=(90, 0, 90))
    k.cubo((0, 0.02, 0.1), (0.01, 0.01, 0.95), '#e8e2cf', arco)

def pose(k, i, n): andar(k, i, n, perna=28, braco=18)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.4, 'alvo_z': 0.9}
