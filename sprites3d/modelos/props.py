# Objetos e decoração: TIPO escolhe o objeto, COR muda a cor quando faz sentido
from kit import R
import os, math, random
TIPO = os.environ.get('TIPO', 'osso')
COR = os.environ.get('COR', '')
random.seed(hash(TIPO + COR) & 0xffff)
CENA = {'ortho': 2.4, 'alvo_z': 0.4, 'inclinacao': 30}
ANIMS = {}

def estatico(k, i, n): pass

def construir(k):
    c = k.vazio('raiz')
    f = globals()['f_' + TIPO]
    f(k, c)
    if not ANIMS: ANIMS['f'] = (1, estatico)

def f_osso(k, c):
    o = '#e8e2cf'
    for rz, dx in ((20, 0), (-35, 0.25)):
        g = k.vazio('g', (dx, 0, 0.08), c, rot=(0, 0, rz))
        k.cil((0, 0, 0), (0.12, 0.12, 1.1), o, g, rot=(0, 90, 0), lados=8)
        for x in (-0.55, 0.55):
            for y in (-0.06, 0.06): k.bola((x, y, 0), (0.18, 0.18, 0.18), o, g)
    CENA.update(ortho=1.8, alvo_z=0.1, inclinacao=45)

def f_cranio(k, c):
    o = '#ece6d4'
    k.bola((0, 0, 0.35), (0.8, 0.75, 0.7), o, c)
    k.cubo((0, -0.15, 0.08), (0.44, 0.4, 0.2), o, c, bevel=0.05)
    for x in (-0.17, 0.17): k.bola((x, -0.33, 0.36), (0.2, 0.1, 0.22), '#1b1424', c)
    k.cone((0, -0.36, 0.18), (0.1, 0.06, 0.1), '#1b1424', c, rot=(180, 0, 0), lados=3)
    for x in (-0.1, 0, 0.1): k.cubo((x, -0.36, 0.04), (0.06, 0.02, 0.08), '#bdb39b', c)
    CENA.update(ortho=1.3, alvo_z=0.3, inclinacao=25)

def f_pedras(k, c):
    cor = COR or '#6a6878'
    for x, y, s in ((-0.3, 0.05, 0.55), (0.25, -0.05, 0.42), (0.55, 0.2, 0.3)):
        k.bola((x, y, s * 0.3), (s * 1.3, s, s * 0.7), cor, c)
    CENA.update(ortho=1.8, alvo_z=0.15, inclinacao=35)

def f_barril(k, c):
    k.cil((0, 0, 0.5), (0.8, 0.8, 1.0), '#8a5a2a', c, lados=16)
    k.bola((0, 0, 0.5), (0.86, 0.86, 0.8), '#8a5a2a', c)
    for z in (0.18, 0.82): k.cil((0, 0, z), (0.88, 0.88, 0.08), '#4a4058', c, lados=16, rough=0.3)
    for j in range(6):
        a = j / 6 * math.pi
        k.cubo((0.43 * math.cos(a + 3.5), 0.43 * math.sin(a + 3.5), 0.5), (0.02, 0.02, 0.9), '#5a3a1a', c, rot=(0, 0, math.degrees(a)))
    CENA.update(ortho=1.35, alvo_z=0.5, inclinacao=22)

def f_lapide(k, c):
    p = '#8a8f9e'
    k.cubo((0, 0, 0.45), (0.8, 0.22, 0.9), p, c, bevel=0.04)
    k.cil((0, 0, 0.9), (0.8, 0.22, 0.8), p, c, rot=(90, 0, 0), lados=16)
    for z in (0.75, 0.55): k.cubo((0, -0.12, z), (0.4, 0.02, 0.06), '#4a4f5e', c)
    k.cubo((0, -0.1, 0.03), (1.0, 0.5, 0.08), '#5a5040', c)
    if COR == 'musgo':
        for x in (-0.3, 0.25): k.bola((x, -0.1, 0.1), (0.3, 0.2, 0.2), '#4f8a3a', c)
    CENA.update(ortho=1.45, alvo_z=0.6, inclinacao=18)

def f_cruz(k, c):
    m = '#6b4a2a'
    k.cubo((0, 0, 0.6), (0.14, 0.14, 1.3), m, c, bevel=0.02)
    k.cubo((0, 0, 0.9), (0.7, 0.14, 0.14), m, c, bevel=0.02)
    k.bola((0, 0, 0.02), (0.6, 0.4, 0.12), '#5a4030', c)
    CENA.update(ortho=1.6, alvo_z=0.65, inclinacao=15)

def f_fenda(k, c):
    k.cubo((0, 0, 0), (2.0, 1.4, 0.02), '#2a1414', c)
    pts = [(-0.9, 0.1), (-0.5, -0.1), (-0.1, 0.15), (0.3, -0.05), (0.7, 0.15), (0.95, -0.05)]
    if COR == 'b': pts = [(-0.95, -0.1), (-0.4, 0.1), (0.0, -0.05), (0.5, 0.12), (0.95, 0.0)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        k.cubo(((x0 + x1) / 2, (y0 + y1) / 2, 0.03), (L + 0.05, 0.12, 0.04), k.mat('#ff8a2a', emit=3), c, rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    k.v['raiz'].scale = (1, 1, 1)
    CENA.update(ortho=2.0, alvo_z=0.0, inclinacao=60)

def f_espinhosGelo(k, c):
    g = k.mat('#a8e4ff', rough=0.1, emit=0.3)
    for x, h in ((-0.3, 0.7), (0.0, 1.1), (0.3, 0.8)) if COR != 'b' else ((-0.25, 0.9), (0.15, 0.6), (0.4, 0.4)):
        k.cone((x, 0, h / 2), (0.32, 0.32, h), g, c, lados=5, rot=(0, x * 20, 0))
    CENA.update(ortho=1.4, alvo_z=0.5, inclinacao=20)

def f_neve(k, c):
    k.bola((0, 0, 0), (1.6, 0.9, 0.5), '#eef4fb', c)
    k.bola((0.3, 0.1, 0.05), (0.8, 0.6, 0.4), '#ffffff', c)
    CENA.update(ortho=1.8, alvo_z=0.05, inclinacao=35)

def f_cogumelo(k, c):
    cor = COR or '#6fdd4a'
    k.cil((0, 0, 0.3), (0.24, 0.24, 0.6), '#efe6d0', c, lados=10)
    k.bola((0, 0, 0.62), (1.0, 1.0, 0.6), cor, c)
    for x, y in ((-0.25, -0.3), (0.2, -0.32), (0.0, -0.1)): k.bola((x, y, 0.82), (0.14, 0.14, 0.08), '#ffffff', c)
    k.cil((0.45, 0.1, 0.15), (0.12, 0.12, 0.3), '#efe6d0', c, lados=8)
    k.bola((0.45, 0.1, 0.32), (0.4, 0.4, 0.26), cor, c)
    CENA.update(ortho=1.5, alvo_z=0.45, inclinacao=25)

def f_juncos(k, c):
    for j, (x, h) in enumerate(((-0.35, 0.9), (-0.12, 1.2), (0.1, 1.0), (0.32, 1.25))):
        k.cil((x, 0, h / 2), (0.06, 0.06, h), '#4f8a3a', c, rot=(0, (x) * 25, 0), lados=5)
        if j % 2: k.cil((x + x * 0.1, 0, h - 0.1), (0.12, 0.12, 0.25), '#6b4a2a', c, lados=6)
    CENA.update(ortho=1.5, alvo_z=0.6, inclinacao=15)

def f_vaso(k, c):
    k.bola((0, 0, 0.45), (0.9, 0.9, 0.85), '#d9883a', c)
    k.cil((0, 0, 0.92), (0.45, 0.45, 0.2), '#d9883a', c, lados=12)
    k.cil((0, 0, 1.02), (0.55, 0.55, 0.06), '#b8682a', c, lados=12)
    k.cil((0, 0, 0.5), (0.92, 0.92, 0.1), '#ffd23f', c, lados=16)
    CENA.update(ortho=1.3, alvo_z=0.5, inclinacao=20)

def f_pilar(k, c):
    k.cil((0, 0, 0.6), (0.5, 0.5, 1.2), '#d8c8a0', c, lados=10)
    k.cil((0, 0, 1.22), (0.62, 0.62, 0.1), '#c8b890', c, lados=10)
    k.cil((0, 0, 0.05), (0.66, 0.66, 0.1), '#c8b890', c, lados=10)
    k.cone((0.1, -0.1, 1.38), (0.18, 0.18, 0.3), '#a89a78', c, lados=5)
    CENA.update(ortho=1.5, alvo_z=0.65, inclinacao=15)

def f_areia(k, c):
    k.bola((0, 0, 0), (1.8, 0.7, 0.35), '#e8c888', c)
    k.bola((-0.3, 0.1, 0.05), (0.9, 0.5, 0.3), '#d8b070', c)
    CENA.update(ortho=1.9, alvo_z=0.05, inclinacao=30)

def f_cristais(k, c):
    cor = COR or '#6fd8ff'
    m = k.mat(cor, rough=0.08, emit=0.5)
    for x, h, rz in ((-0.3, 0.8, -15), (0.0, 1.2, 0), (0.28, 0.9, 12), (0.45, 0.5, 25)):
        k.cone((x, 0, h / 2), (0.3, 0.3, h), m, c, lados=5, rot=(0, rz, 0))
    CENA.update(ortho=1.5, alvo_z=0.55, inclinacao=20)

def f_runa(k, c):
    m = k.mat(COR or '#c06aff', emit=2.5)
    if os.environ.get('TRACO') == '1':
        for j in range(12):
            a = j / 12 * 2 * math.pi
            k.cubo((0.7 * math.cos(a), 0.45 * math.sin(a), 0.02), (0.18, 0.07, 0.03), m, c, rot=(0, 0, math.degrees(a) + 90))
    else:
        k.toro((0, 0, 0.02), 0.7, 0.05, m, c)
        k.c = k.cubo((0, 0, 0.02), (1.3, 0.06, 0.03), m, c)
        k.cubo((0, 0, 0.02), (0.06, 0.06, 0.03), m, c)
        k.cubo((0, 0, 0.02), (0.06, 1.0, 0.03), m, c)
    c.scale = (1, 0.7, 1)
    CENA.update(ortho=1.7, alvo_z=0.0, inclinacao=55)

def f_obelisco(k, c):
    k.cone((0, 0, 0.75), (0.5, 0.5, 0.7), k.mat('#6a3aa8', rough=0.1, emit=0.5), c, lados=4)
    k.cone((0, 0, 0.35), (0.5, 0.5, 0.4), k.mat('#6a3aa8', rough=0.1, emit=0.5), c, lados=4, rot=(180, 0, 0))
    k.cil((0, 0, 0.0), (0.8, 0.5, 0.06), '#140f1c', c, lados=12)
    CENA.update(ortho=1.4, alvo_z=0.5, inclinacao=20)

def f_estalagmite(k, c):
    cor = COR or '#e8d890'
    k.cone((0, 0, 0.55), (0.6, 0.6, 1.1), cor, c, lados=8)
    k.cone((0.25, 0.1, 0.25), (0.3, 0.3, 0.5), cor, c, lados=6)
    CENA.update(ortho=1.4, alvo_z=0.55, inclinacao=18)
