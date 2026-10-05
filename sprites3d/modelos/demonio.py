from kit import humanoide, R
def construir(k):
    v = humanoide(k, '#c82a3a', '#a01a2a', '#6a1020', '#3a0a10', larg=1.35, cab=1.0)
    c = v['cabeca']
    for x in (-1, 1):
        k.cone((0.38 * x, 0, 0.8), (0.2, 0.2, 0.7), '#f1ece0', c, rot=(0, 40 * x, 0), lados=8)
        k.bola((0.16 * x, -0.42, 0.36), (0.16, 0.06, 0.12), k.mat('#ffd23f', emit=4), c)
    k.cubo((0, -0.42, 0.12), (0.4, 0.05, 0.1), '#1b1424', c)
    for x in (-0.12, 0.0, 0.12): k.cone((x, -0.45, 0.1), (0.06, 0.03, 0.1), '#ffffff', c, rot=(180, 0, 0), lados=4)
    k.cubo((0, -0.2, 0.28), (0.4, 0.04, 0.3), '#7a1020', v['corpo'])
    for x in (-1, 1):
        a = k.vazio(f'asa{x}', (0.25 * x, 0.25, 0.4), v['corpo'])
        pts = [(0, 0), (0.35, 0.6), (0.8, 0.85), (1.1, 0.55), (0.95, 0.1), (0.75, -0.25), (0.55, 0.0), (0.35, -0.25), (0.15, -0.1)]
        k.placa([(px * x, pz) for px, pz in pts], '#5a0a18', a, esp=0.06)
    cauda = k.vazio('cauda', (0, 0.25, 0.0), v['corpo'])
    k.cil((0.3, 0.3, -0.2), (0.08, 0.08, 0.9), '#a01a2a', cauda, rot=(45, 40, 0), lados=6)
    k.v['braco_e'].rotation_euler.y = R(20); k.v['braco_d'].rotation_euler.y = R(-20)
def pose(k, i, n): pass
ANIMS = {'f': (1, pose)}
CENA = {'ortho': 3.6, 'alvo_z': 1.0, 'res': 512}
