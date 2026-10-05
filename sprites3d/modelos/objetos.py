# Objetos do jogo: TIPO escolhe; algumas variantes por COR / FASE
from kit import R, humanoide
import os, math
TIPO = os.environ.get('TIPO', 'pocao')
COR = os.environ.get('COR', '')
FASE = os.environ.get('FASE', '')
CENA = {'ortho': 2.0, 'alvo_z': 0.5, 'inclinacao': 22}
ANIMS = {}
def estatico(k, i, n): pass
def construir(k):
    c = k.vazio('raiz')
    globals()['f_' + TIPO](k, c)
    if not ANIMS: ANIMS['f'] = (1, estatico)

def f_pocao(k, c):
    vidro = k.mat('#ffd0e0', rough=0.05)
    k.bola((0, 0, 0.42), (0.85, 0.85, 0.8), k.mat('#e8304a', rough=0.15, emit=0.4), c)
    k.bola((-0.18, -0.3, 0.6), (0.18, 0.08, 0.2), k.mat('#ffffff', emit=1.5), c)
    k.cil((0, 0, 0.95), (0.3, 0.3, 0.3), vidro, c, lados=10)
    k.cil((0, 0, 1.15), (0.36, 0.36, 0.16), '#8a5a2a', c, lados=10)
    CENA.update(ortho=1.3, alvo_z=0.6, inclinacao=15)

def f_moeda(k, c):
    o = k.mat('#ffd23f', rough=0.3, metal=0.4)
    k.cil((0, 0, 0.5), (1.0, 1.0, 0.16), o, c, rot=(90, 0, 0), lados=20)
    k.cil((0, -0.09, 0.5), (0.6, 0.6, 0.02), '#c99a1e', c, rot=(90, 0, 0), lados=20)
    k.cubo((0, -0.1, 0.5), (0.12, 0.02, 0.4), '#fff3a8', c)
    CENA.update(ortho=1.1, alvo_z=0.5, inclinacao=10)

def f_mercador(k, c):
    v = humanoide(k, '#f1c8a0', '#2f7a4a', '#3b2a1c', '#2a1a10', cab=0.95)
    cab = v['cabeca']
    k.cone((0, 0, 0.75), (0.95, 0.9, 0.9), '#2f7a4a', cab, lados=12)
    k.bola((0, 0.05, 0.45), (0.95, 0.9, 0.5), '#2f7a4a', cab)
    k.bola((0, -0.25, 0.05), (0.6, 0.4, 0.45), '#e8e2cf', cab)  # barba
    for x in (-0.12, 0.12): k.bola((x, -0.4, 0.33), (0.07, 0.04, 0.07), '#1b1424', cab)
    k.cone((0, -0.42, 0.24), (0.1, 0.12, 0.12), '#e0a880', cab, rot=(90, 0, 0), lados=6)
    for x in (-1, 1):
        k.cubo((0.5 * x, 0.12, 0.2), (0.32, 0.36, 0.5), '#8a5a2a', v['corpo'], bevel=0.04)  # sacos
    k.cubo((0, 0.3, 0.3), (0.7, 0.36, 0.7), '#6b4a2a', v['corpo'], bevel=0.04)  # mochila
    k.cubo((0, -0.2, 0.06), (0.66, 0.04, 0.08), '#ffd23f', v['corpo'])
    CENA.update(ortho=2.5, alvo_z=0.95)

def f_altar(k, c):
    p = '#7a7f8e'
    k.cubo((0, 0, 0.35), (1.8, 0.9, 0.7), p, c, bevel=0.05)
    k.cubo((0, 0, 0.72), (2.0, 1.0, 0.12), '#9aa0ae', c, bevel=0.03)
    k.cubo((0, -0.46, 0.35), (1.2, 0.04, 0.4), '#5a5f6e', c)
    for x in (-0.75, 0.75):
        k.cil((x, 0, 1.0), (0.14, 0.14, 0.45), '#e8e2cf', c, lados=8)
        if FASE != 'usado':
            k.bola((x, 0, 1.32), (0.18, 0.18, 0.3), k.mat('#ffb03a', emit=4), c)
    k.cubo((0, -0.47, 0.42), (0.5, 0.02, 0.1), k.mat('#e04848', emit=2) if FASE != 'usado' else '#4a4f5e', c)
    k.cubo((0, 0, 0.8), (0.8, 0.5, 0.06), '#4a4058', c)
    CENA.update(ortho=2.3, alvo_z=0.65)

def f_cristal(k, c):
    cor = {'inativo': '#9a6aff', 'ativo': '#ff4a6a', 'feito': '#9aa3b8'}[FASE]
    m = k.mat(cor, rough=0.08, emit=1.0 if FASE == 'ativo' else 0.35)
    k.cone((0, 0, 1.25), (0.6, 0.6, 0.9), m, c, lados=6)
    k.cone((0, 0, 0.5), (0.6, 0.6, 0.6), m, c, lados=6, rot=(180, 0, 0))
    k.cil((0, 0, 0.12), (0.8, 0.8, 0.12), '#4a4f5e', c, lados=12)
    k.cil((0, 0, 0.03), (1.0, 1.0, 0.08), '#3a3f4e', c, lados=12)
    CENA.update(ortho=2.0, alvo_z=0.85, inclinacao=15)

def f_tocha(k, c):
    cor = COR or '#ff9a2a'
    k.cone((0, 0, 0.45), (0.34, 0.34, 0.9), '#6b4a2a', c, lados=6, rot=(180, 0, 0))
    k.cil((0, 0, 0.88), (0.46, 0.46, 0.16), '#4a4058', c, lados=8)
    k.v['ch'] = ch = k.vazio('ch', (0, 0, 0.95), c)
    k.bola((0, 0, 0.12), (0.5, 0.5, 0.4), k.mat(cor, emit=4), ch)
    k.cone((0, 0, 0.42), (0.46, 0.46, 0.6), k.mat(cor, emit=4), ch, lados=8)
    k.cone((0, -0.05, 0.28), (0.26, 0.26, 0.4), k.mat('#fff3a8', emit=5), ch, lados=8)
    ANIMS['f'] = (2, lambda k, i, n: setattr(k.v['ch'], 'scale', (1.0, 1.0, 1.0) if i == 0 else (0.85, 0.85, 1.2)))
    CENA.update(ortho=1.5, alvo_z=0.75, inclinacao=10)

def f_escada(k, c):
    pedra = '#6a6474'
    for x in (-0.9, 0.9): k.cubo((x, 0, -0.5), (0.2, 1.8, 1.1), pedra, c, bevel=0.03)
    k.cubo((0, -0.9, -0.5), (2.0, 0.2, 1.1), pedra, c, bevel=0.03)
    k.cubo((0, 0.9, -0.5), (2.0, 0.2, 1.1), pedra, c, bevel=0.03)
    k.cubo((0, 0.0, -1.2), (1.6, 1.6, 0.1), '#07060a', c)
    for j in range(5):
        k.cubo((0, -0.65 + j * 0.28, -0.1 - j * 0.2), (1.56, 0.3, 0.1), '#9a92a4' if j % 2 == 0 else '#857d90', c)
    CENA.update(ortho=2.4, alvo_z=-0.4, inclinacao=62)

def f_mesa(k, c):
    k.cubo((0, 0, 0.62), (2.0, 1.0, 0.12), '#8a5a2a', c, bevel=0.03)
    for x in (-0.85, 0.85):
        for y in (-0.38, 0.38): k.cubo((x, y, 0.3), (0.12, 0.12, 0.6), '#6b4a2a', c)
    k.bola((-0.5, 0, 0.82), (0.4, 0.4, 0.3), '#c8c0d8', c)
    k.cil((-0.5, 0, 0.92), (0.2, 0.2, 0.2), k.mat('#6fff6a', emit=1), c, lados=8)
    k.cubo((0.3, 0, 0.72), (0.6, 0.45, 0.08), '#e8e2cf', c)
    k.cil((0.75, 0.2, 0.85), (0.14, 0.14, 0.3), k.mat('#c06aff', emit=1), c, lados=8)
    CENA.update(ortho=2.2, alvo_z=0.45)

def f_gaiola(k, c):
    k.cil((0, 0, 0.05), (1.6, 1.6, 0.1), '#4a4f5e', c, lados=16)
    k.cil((0, 0, 1.75), (1.6, 1.6, 0.1), '#4a4f5e', c, lados=16)
    for j in range(10):
        a = j / 10 * 2 * math.pi
        k.cil((0.78 * math.cos(a), 0.78 * math.sin(a), 0.9), (0.06, 0.06, 1.7), k.mat('#9aa3b8', metal=0.5, rough=0.3), c, lados=6)
    k.cone((0, 0, 1.95), (1.4, 1.4, 0.4), '#4a4f5e', c, lados=16)
    k.toro((0, 0, 2.2), 0.15, 0.04, '#9aa3b8', c, rot=(90, 0, 0))
    CENA.update(ortho=2.5, alvo_z=1.1, inclinacao=15)

def f_livro(k, c):
    cor = {'fogo': '#e8603a', 'raio': '#ffd23f', 'gelo': '#6fc8ff', 'cura': '#5fd35f'}[COR]
    k.cubo((0, 0, 0.6), (0.9, 0.3, 1.1), cor, c, bevel=0.03)
    k.cubo((0.03, 0.02, 0.6), (0.82, 0.28, 1.02), '#f1ece0', c)
    k.cubo((-0.42, 0, 0.6), (0.1, 0.32, 1.12), cor, c)
    k.cubo((0.0, -0.16, 0.65), (0.4, 0.02, 0.4), k.mat('#ffffff', emit=1.5), c)
    k.cubo((0.0, -0.17, 0.65), (0.26, 0.02, 0.26), k.mat(cor, emit=2), c, rot=(0, 45, 0))
    CENA.update(ortho=1.4, alvo_z=0.6, inclinacao=12)

def f_feitico(k, c):
    if COR == 'fogo':
        for x, h, s in ((0, 1.1, 0.7), (-0.3, 0.6, 0.4), (0.3, 0.7, 0.45)):
            k.cone((x, 0, h / 2 + 0.1), (s, s, h), k.mat('#ff7a2a', emit=3), c, lados=8)
        k.cone((0, -0.1, 0.4), (0.4, 0.4, 0.6), k.mat('#ffd23f', emit=4), c, lados=8)
        k.bola((0, 0, 0.3), (0.9, 0.7, 0.5), k.mat('#ff5a1a', emit=3), c)
    elif COR == 'raio':
        pts = [(0.15, 1.3), (-0.35, 0.55), (0.0, 0.55), (-0.2, -0.1), (0.4, 0.75), (0.05, 0.75), (0.35, 1.3)]
        k.placa(pts, k.mat('#ffd23f', emit=3), c, esp=0.15)
    elif COR == 'gelo':
        g = k.mat('#8fe0ff', emit=2)
        for j in range(3): k.cubo((0, 0, 0.6), (0.14, 0.1, 1.2), g, c, rot=(0, j * 60, 0))
        for j in range(6):
            a = math.radians(j * 60)
            k.cubo((0.35 * math.sin(a), 0, 0.6 + 0.35 * math.cos(a)), (0.25, 0.08, 0.08), g, c, rot=(0, j * 60 + 45, 0))
    else:
        g = k.mat('#5fff7a', emit=2.5)
        k.cubo((0, 0, 0.6), (0.36, 0.2, 1.1), g, c, bevel=0.04); k.cubo((0, 0, 0.6), (1.1, 0.2, 0.36), g, c, bevel=0.04)
    CENA.update(ortho=1.5, alvo_z=0.65, inclinacao=0)

def f_espinhos(k, c):
    k.cubo((0, 0, -0.05), (2.0, 2.0, 0.1), '#3a3448', c)
    h = {'0': 0.0, '1': 0.35, '2': 0.9}[FASE]
    for x in (-0.5, 0.5):
        for y in (-0.5, 0.5):
            k.cil((x, y, 0.0), (0.45, 0.45, 0.04), '#140f1c', c, lados=10)
            if h: k.cone((x, y, h / 2), (0.36, 0.36, h), k.mat('#c8d0e0', metal=0.5, rough=0.25), c, lados=6)
    CENA.update(ortho=2.1, alvo_z=0.1, inclinacao=60)
