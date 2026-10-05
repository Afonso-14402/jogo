from kit import humanoide, esticar_pernas, R
def construir(k):
    p, e = '#a8a294', '#7a7468'
    v = humanoide(k, p, p, e, e, larg=1.25, cab=0.7, alt=1.35)
    esticar_pernas(k, 1.5)
    v['corpo'].location.z += 0.3
    v['corpo'].scale = (1.45, 1.45, 1.45); v['corpo'].location.z *= 1.45
    c = v['cabeca']
    k.bola((0, -0.06, 0.08), (0.5, 0.45, 0.42), '#9a9486', c)
    for x in (-0.11, 0.11): k.bola((x, -0.29, 0.28), (0.1, 0.05, 0.06), '#3a362e', c)
    for j in range(5): k.cone((-0.24 + j * 0.12, 0, 0.62), (0.08, 0.08, 0.24 + 0.1 * (j == 2)), '#8a8478', c, lados=4)
    k.cubo((0, -0.28, 0.25), (0.44, 0.1, 0.44), '#8a8478', v['corpo'], bevel=0.02)
    for z in (0.12, 0.25, 0.38): k.cubo((0, -0.34, z), (0.36, 0.02, 0.02), '#4a463e', v['corpo'])
    k.v['braco_e'].rotation_euler = (R(-55), R(-25), 0); k.v['braco_d'].rotation_euler = (R(-55), R(25), 0)
    base = k.vazio('base')
    k.cubo((0, 0.2, 0.0), (2.0, 1.2, 0.3), '#6a655a', base, bevel=0.03)
    k.cubo((0, 0.9, 1.6), (2.2, 0.25, 3.2), '#7a7468', base, bevel=0.05)
    k.cil((0, 0.9, 3.2), (2.2, 0.25, 2.2), '#7a7468', base, rot=(90, 0, 0), lados=20)
def pose(k, i, n): pass
ANIMS = {'f': (1, pose)}
CENA = {'ortho': 4.4, 'alvo_z': 1.9, 'res': 512, 'inclinacao': 12}
