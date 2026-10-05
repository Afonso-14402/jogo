from kit import R
import os, math
TIPO = os.environ.get('TIPO', 'gato')
CENA = {'ortho': 2.0, 'alvo_z': 0.5, 'inclinacao': 18}
ANIMS = {}
def construir(k):
    c = k.vazio('corpo')
    globals()['f_' + TIPO](k, c)
    if not ANIMS: ANIMS['f'] = (1, lambda k, i, n: None)
def olhos(k, pai, y, z, dx=0.15, cor='#1b1424', s=0.12):
    for x in (-dx, dx): k.bola((x, y, z), (s, 0.06, s), cor, pai)
def quad(k, c, cor, cor2, comp=1.2, alt=0.5, cab=0.55, orelhas='bico', cauda=0.6):
    raiz = k.vazio('r', (0, 0, alt), c, rot=(0, 0, 90))
    k.bola((0, 0, 0), (0.6, comp, 0.55), cor, raiz)
    h = k.vazio('h', (0, -comp * 0.55, 0.25), raiz)
    k.bola((0, 0, 0), (cab, cab, cab * 0.95), cor, h)
    olhos(k, h, -cab * 0.45, 0.06, cab * 0.28)
    if orelhas == 'bico':
        for x in (-1, 1): k.cone((cab * 0.3 * x, 0.02, cab * 0.5), (0.18, 0.12, 0.3), cor2, h, lados=4)
    k.bola((0, comp * 0.5 + cauda * 0.3, 0.2), (0.2, cauda, 0.2), cor2, raiz, rot=(35, 0, 0))
    for nome, y, x in (('a', -0.3, 0.2), ('b', -0.3, -0.2), ('c', 0.3, 0.2), ('d', 0.3, -0.2)):
        p = k.vazio(nome, (x, y * comp / 1.2, -0.15), raiz); k.v[nome] = p
        k.cubo((0, 0, -0.16), (0.14, 0.14, 0.36), cor, p, bevel=0.03)
    def pose(k, i, n):
        s = math.sin(i / n * 2 * math.pi)
        k.v['a'].rotation_euler.x = R(25) * s; k.v['d'].rotation_euler.x = R(25) * s
        k.v['b'].rotation_euler.x = -R(25) * s; k.v['c'].rotation_euler.x = -R(25) * s
    return pose
def asas(k, c, cor, larg=0.9, pos=(0, 0.1, 0.1)):
    for x in (-1, 1):
        a = k.vazio(f'asa{x}', (pos[0] + 0.3 * x, pos[1], pos[2]), c); k.v[f'asa{x}'] = a
        k.placa([(0, 0), (0.4 * larg * x, 0.35), (0.9 * larg * x, 0.3), (0.75 * larg * x, -0.05), (0.35 * larg * x, -0.15)], cor, a, esp=0.05)
    def pose(k, i, n):
        f = math.cos(i / n * 2 * math.pi)
        k.v['asa1'].rotation_euler.y = -R(35) * f; k.v['asa-1'].rotation_euler.y = R(35) * f
    return pose

def f_lobo(k, c):
    p = quad(k, c, '#8a8f9e', '#5a5f6e', comp=1.3)
    ANIMS['f'] = (1, p); CENA.update(ortho=2.6, alvo_z=0.5, inclinacao=12)
def f_gato(k, c):
    p = quad(k, c, '#f0a050', '#c87a30', comp=1.0, cab=0.6, cauda=0.7)
    ANIMS['f'] = (1, p); CENA.update(ortho=2.2, alvo_z=0.5, inclinacao=12)
def f_fada(k, c):
    b = k.vazio('b', (0, 0, 0.8), c)
    k.bola((0, 0, 0.3), (0.5, 0.45, 0.5), '#ffd6e8', b)
    k.bola((0, 0, -0.1), (0.36, 0.3, 0.5), '#ff8ad8', b)
    olhos(k, b, -0.22, 0.3, 0.1, s=0.08)
    k.bola((0, 0.02, 0.5), (0.5, 0.45, 0.25), '#ffe680', b)
    p = asas(k, b, k.mat('#c8f0ff', emit=1.0), larg=0.8, pos=(0, 0.15, 0.1))
    ANIMS['f'] = (2, lambda k, i, n: p(k, i * 2, 4)); CENA.update(ortho=1.7, alvo_z=0.8)
def f_dragao(k, c):
    b = k.vazio('b', (0, 0, 0.7), c)
    k.bola((0, 0, 0), (0.8, 0.7, 0.75), '#e8503a', b)
    k.bola((0, -0.15, 0.45), (0.65, 0.6, 0.55), '#e8503a', b)
    k.bola((0, -0.3, -0.05), (0.5, 0.3, 0.5), '#ffd08a', b)
    olhos(k, b, -0.44, 0.5, 0.14, s=0.1)
    for x in (-1, 1): k.cone((0.18 * x, 0, 0.8), (0.1, 0.1, 0.25), '#f1ece0', b, lados=5)
    p = asas(k, b, '#a8302a', larg=1.0, pos=(0, 0.2, 0.15))
    ANIMS['f'] = (2, lambda k, i, n: p(k, i * 2, 4)); CENA.update(ortho=2.4, alvo_z=0.75)
def f_coruja(k, c):
    k.bola((0, 0, 0.5), (0.9, 0.8, 1.0), '#9a7a4a', c)
    k.bola((0, -0.25, 0.4), (0.6, 0.4, 0.6), '#e8d8b0', c)
    for x in (-0.18, 0.18):
        k.bola((x, -0.32, 0.72), (0.26, 0.1, 0.26), '#ffffff', c); k.bola((x, -0.37, 0.72), (0.12, 0.06, 0.12), '#1b1424', c)
        k.cone((x * 1.6, 0, 1.0), (0.14, 0.12, 0.25), '#6a4a2a', c, lados=4)
    k.cone((0, -0.42, 0.58), (0.1, 0.1, 0.14), '#ffb03a', c, rot=(180, 0, 0), lados=4)
    CENA.update(ortho=1.9, alvo_z=0.55)
def f_rochinha(k, c):
    k.bola((0, 0, 0.4), (1.1, 0.9, 0.8), '#8a8f9e', c)
    k.bola((0.3, 0.1, 0.7), (0.4, 0.4, 0.3), '#6a6f7e', c)
    olhos(k, c, -0.42, 0.45, 0.18, cor=k.mat('#6fd8ff', emit=3), s=0.12)
    CENA.update(ortho=1.8, alvo_z=0.4)
def f_fenix(k, c):
    b = k.vazio('b', (0, 0, 0.8), c)
    k.bola((0, 0, 0), (0.7, 0.7, 0.75), k.mat('#ff7a2a', emit=0.8), b)
    k.bola((0, -0.1, 0.45), (0.5, 0.5, 0.5), k.mat('#ffb03a', emit=0.8), b)
    olhos(k, b, -0.32, 0.5, 0.1, s=0.09)
    k.cone((0, -0.4, 0.42), (0.1, 0.1, 0.18), '#ffd23f', b, rot=(90, 0, 0), lados=4)
    for j in range(3): k.cone((-0.12 + j * 0.12, 0.1, 0.8), (0.1, 0.1, 0.3), k.mat('#ffd23f', emit=2), b, lados=4)
    p = asas(k, b, k.mat('#ff5a1a', emit=1.5), larg=1.1, pos=(0, 0.2, 0.1))
    ANIMS['f'] = (2, lambda k, i, n: p(k, i * 2, 4)); CENA.update(ortho=2.4, alvo_z=0.8)
def f_corvo(k, c):
    r = k.vazio('rc', (0, 0, 0), c, rot=(0, 0, 90))  # de lado, virado para a direita
    k.bola((0, 0, 0.45), (0.55, 1.0, 0.6), '#2a2238', r)
    k.bola((0, -0.45, 0.78), (0.45, 0.5, 0.45), '#2a2238', r)
    k.bola((0.12, -0.6, 0.86), (0.08, 0.06, 0.08), '#ffd23f', r); k.bola((-0.12, -0.6, 0.86), (0.08, 0.06, 0.08), '#ffd23f', r)
    k.cone((0, -0.82, 0.76), (0.14, 0.14, 0.34), '#ffb03a', r, rot=(90, 0, 0), lados=4)
    k.cone((0, 0.62, 0.5), (0.36, 0.12, 0.5), '#1e1830', r, rot=(-100, 0, 0), lados=4)
    k.bola((0, 0.05, 0.55), (0.62, 0.8, 0.35), '#3a3050', r)
    for x in (-0.1, 0.1): k.cil((x, -0.05, 0.1), (0.05, 0.05, 0.25), '#ffb03a', r, lados=4)
    CENA.update(ortho=1.9, alvo_z=0.5, inclinacao=10)
def f_golem(k, c):
    k.bola((0, 0, 0.4), (1.0, 0.8, 0.75), '#8a7a5a', c)
    k.bola((0, -0.05, 0.9), (0.7, 0.6, 0.5), '#9a8a6a', c)
    olhos(k, c, -0.36, 0.95, 0.14, cor=k.mat('#5dff7a', emit=3), s=0.13)
    for x in (-1, 1): k.bola((0.55 * x, -0.05, 0.4), (0.35, 0.35, 0.55), '#7a6a4a', c)
    k.bola((0.25, 0, 1.1), (0.2, 0.2, 0.12), '#5f8a3a', c)
    CENA.update(ortho=1.8, alvo_z=0.6)
