# Armadilhas, enigmas, minijogos e mobília da casa (TIPO; VAR / COR quando há variantes)
from kit import R, humanoide, andar
import os, math, random
TIPO = os.environ.get('TIPO', 'alavanca'); VAR = os.environ.get('VAR', '0'); COR = os.environ.get('COR', '')
random.seed(len(TIPO) * 7 + int(VAR) if VAR.isdigit() else 3)
ANIMS = {}
CENA = {'ortho': 2.0, 'alvo_z': 0.4, 'inclinacao': 25}
def construir(k):
    r = k.vazio('r'); globals()['f_' + TIPO](k, r)
    if not ANIMS: ANIMS['f'] = (1, lambda k, i, n: None)

def f_alavanca(k, r):
    k.cubo((0, 0, 0.12), (1.0, 0.6, 0.24), '#4a4f5e', r, bevel=0.04)
    k.cubo((0, -0.31, 0.12), (0.6, 0.02, 0.06), k.mat('#e04848' if VAR == '0' else '#5dff7a', emit=2), r)
    a = k.vazio('a', (0, 0, 0.24), r, rot=(0, 40 if VAR == '0' else -40, 0))
    k.cil((0, 0, 0.35), (0.09, 0.09, 0.7), '#9aa3b8', a, lados=6)
    k.bola((0, 0, 0.75), (0.24, 0.24, 0.24), '#e04848' if VAR == '0' else '#5dff7a', a)
    CENA.update(ortho=1.6, alvo_z=0.4)
def f_placa(k, r):
    ativa = VAR == '1'
    k.cubo((0, 0, 0.0), (1.9, 1.9, 0.12), '#3a3448', r, bevel=0.04)
    k.cubo((0, 0, 0.06 if not ativa else 0.02), (1.5, 1.5, 0.1), k.mat('#3a8aff', emit=0.8) if ativa else '#6a6478', r, bevel=0.05)
    k.cubo((0, 0, 0.1 if not ativa else 0.06), (1.0, 1.0, 0.1), k.mat('#9fdcff', emit=1.2) if ativa else '#7a7488', r, bevel=0.04)
    k.cubo((0, 0, 0.14 if not ativa else 0.1), (0.45, 0.45, 0.1), k.mat('#3a8aff', emit=1.5) if ativa else '#6a6478', r, bevel=0.03)
    CENA.update(ortho=2.1, alvo_z=0.0, inclinacao=60)
def f_estatua(k, r):
    v = humanoide(k, '#8a8796', '#7a7786', '#6a6776', '#5a5766', cab=1.0)
    olho = '#5dff7a' if VAR == '1' else '#ffd23f'
    rot = {'frente': 0, 'costas': 180, 'lado': 90}[COR]
    v['corpo'].rotation_euler.z = R(rot)
    for x in (-0.15, 0.15): k.bola((x, -0.43, 0.32), (0.14, 0.05, 0.12), k.mat(olho, emit=3), v['cabeca'])
    base = k.vazio('base'); k.cubo((0, 0, 0.0), (1.3, 1.1, 0.25), '#5a5766', base, bevel=0.04)
    k.v['braco_e'].rotation_euler.y = R(10); k.v['braco_d'].rotation_euler.y = R(-10)
    CENA.update(ortho=2.4, alvo_z=0.9, inclinacao=18)
def f_pedra(k, r):
    m = k.mat('#7a6aa8', rough=0.6)
    k.bola((0, 0, 0.7), (0.9, 0.7, 1.5), m, r)
    k.cubo((0, 0, 0.05), (1.2, 1.0, 0.12), '#4a4058', r, bevel=0.04)
    for z, s in ((0.95, 0.3), (0.6, 0.22)): k.cubo((0, -0.33, z), (s, 0.04, 0.06), k.mat('#d0a8ff', emit=2.5 if VAR == '0' else 1.2), r)
    k.cubo((0, -0.33, 0.78), (0.06, 0.04, 0.4), k.mat('#d0a8ff', emit=2.5 if VAR == '0' else 1.2), r)
    CENA.update(ortho=2.0, alvo_z=0.8, inclinacao=15)
def f_duende(k, r):
    from kit import humanoide as H
    v = H(k, '#ffd23f', '#c99a1e', '#a07800', '#6a5000', cab=1.05, alt=0.85, larg=0.9)
    c = v['cabeca']
    for x in (-1, 1):
        k.cone((0.52 * x, 0, 0.36), (0.18, 0.12, 0.5), '#ffd23f', c, rot=(0, 75 * x, 0), lados=6)
        k.bola((0.17 * x, -0.43, 0.36), (0.14, 0.06, 0.14), '#1b1424', c)
    k.cubo((0, -0.43, 0.08), (0.24, 0.05, 0.05), '#1b1424', c)
    s = k.vazio('saco', (0.1, 0.1, -0.3), v['braco_e']); k.bola((0, 0, -0.1), (0.5, 0.5, 0.55), '#8a6a4a', s)
    k.bola((0, -0.05, 0.22), (0.2, 0.2, 0.15), '#ffd23f', s)
    ANIMS['f'] = (1, lambda k, i, n: None); CENA.update(ortho=2.4, alvo_z=0.8)
def f_jaula(k, r):
    k.cubo((0, 0, 0.05), (2.0, 1.4, 0.1), '#4a4f5e', r); k.cubo((0, 0, 1.45), (2.0, 1.4, 0.1), '#4a4f5e', r)
    k.cubo((0, 0.1, 0.4), (1.1, 0.7, 0.55), '#a8743a', r, bevel=0.04); k.cubo((0, -0.26, 0.5), (0.2, 0.04, 0.2), '#ffd23f', r)
    for j in range(7): k.cil((-0.9 + j * 0.3, -0.68, 0.75), (0.07, 0.07, 1.4), k.mat('#9aa3b8', metal=0.4, rough=0.3), r, lados=6)
    CENA.update(ortho=2.3, alvo_z=0.75, inclinacao=15)
def f_arena(k, r):
    p = '#7a7280'
    k.cubo((0, 0, 0.9), (3.6, 0.8, 1.8), p, r, bevel=0.05)
    k.cubo((0, -0.42, 0.7), (2.0, 0.1, 1.4), '#140f1c', r)
    for j in range(6): k.cil((-0.75 + j * 0.3, -0.45, 0.7), (0.06, 0.06, 1.35), '#9aa3b8', r, lados=6)
    k.cubo((0, -0.44, 1.48), (2.2, 0.12, 0.12), '#5a5466', r)
    for x in (-1.45, 1.45):
        k.cubo((x, -0.46, 1.2), (0.2, 0.06, 0.5), '#c0392b', r); k.cone((x, -0.5, 1.6), (0.18, 0.18, 0.3), k.mat('#ff9a2a', emit=3), r, lados=6)
    k.cubo((0, 0, 1.9), (3.8, 0.9, 0.2), '#6a6270', r, bevel=0.03)
    CENA.update(ortho=4.0, alvo_z=1.0, inclinacao=12)
def f_lago(k, r):
    k.cil((0, 0, 0.0), (3.2, 1.4, 0.1), '#c8b890', r, lados=24)
    k.cil((0, 0, 0.04), (2.9, 1.2, 0.1), k.mat('#4d9fff', rough=0.1, emit=0.25), r, lados=24)
    for x, y in ((-0.6, 0.1), (0.5, -0.2), (0.1, 0.3)): k.cubo((x, y, 0.1), (0.35, 0.04, 0.02), '#bfe6ff', r)
    CENA.update(ortho=3.3, alvo_z=0.0, inclinacao=55)
def f_cais(k, r):
    for j in range(7): k.cubo((-1.0 + j * 0.33, 0, 0.2), (0.3, 1.0, 0.08), '#8a5a2a' if j % 2 else '#7a4a1a', r, bevel=0.02)
    for x in (-1.0, 0.9): k.cil((x, -0.45, 0.0), (0.12, 0.12, 0.5), '#5a3a1a', r, lados=6)
    k.cil((0.7, -0.2, 0.75), (0.04, 0.04, 1.2), '#6b4a2a', r, rot=(0, 50, 0), lados=5)
    CENA.update(ortho=2.6, alvo_z=0.3, inclinacao=35)
def f_sapo(k, r):
    cor = ['#5fbf4a', '#4a9fff', '#ffd23f'][int(COR or 0)]
    c = k.vazio('c', (0, 0, 0), r, rot=(0, 0, 90)); k.v['c'] = c
    k.bola((0, 0, 0.35), (1.2, 1.4, 0.7), cor, c)
    for x in (-0.3, 0.3):
        k.bola((x, -0.4, 0.7), (0.3, 0.3, 0.3), cor, c); k.bola((x, -0.52, 0.72), (0.12, 0.08, 0.14), '#1b1424', c)
    for x in (-1, 1): k.bola((0.5 * x, 0.35, 0.15), (0.35, 0.7, 0.25), cor, c)
    ANIMS['f'] = (2, lambda k, i, n: setattr(k.v['c'], 'scale', (1, 1, 1) if i == 0 else (0.9, 1.15, 1.2)))
    CENA.update(ortho=2.0, alvo_z=0.4, inclinacao=20)
def f_chao(k, r):
    k.cubo((0, 0, -0.08), (2.2, 2.2, 0.04), '#07060a', r)
    for ix in (-0.5, 0.5):
        for iy in (-0.5, 0.5):
            if VAR == '2': continue
            off = (random.uniform(-0.06, 0.06) if VAR == '1' else 0)
            k.cubo((ix + off, iy + off, -0.02 if VAR == '1' else 0), (0.9, 0.9, 0.1), '#3a3448', r, rot=(random.uniform(-4, 4) if VAR == '1' else 0, random.uniform(-4, 4) if VAR == '1' else 0, 0), bevel=0.05)
    if VAR == '1':
        for _ in range(4): k.cubo((random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 0.06), (random.uniform(0.3, 0.7), 0.04, 0.02), '#07060a', r, rot=(0, 0, random.uniform(0, 180)))
    if VAR == '2':
        k.cubo((0, 0, -0.04), (1.9, 1.9, 0.02), '#140f1c', r)
    ANIMS['f'] = (1, lambda k, i, n: None); CENA.update(ortho=2.0, alvo_z=0.0, inclinacao=90)
def f_grelhaGas(k, r):
    k.cubo((0, 0, 0), (1.2, 1.0, 0.1), '#3a5a2a', r, bevel=0.03)
    for y in (-0.3, -0.1, 0.1, 0.3): k.cubo((0, y, 0.06), (1.0, 0.08, 0.04), '#1b2a14', r)
    CENA.update(ortho=1.4, alvo_z=0.0, inclinacao=55)

# ---------- mobília da casa ----------
def f_cama(k, r):
    k.cubo((0, 0, 0.25), (2.0, 1.0, 0.3), '#6b4a2a', r, bevel=0.04)
    k.cubo((0.15, 0, 0.45), (1.6, 0.92, 0.16), '#c0392b', r, bevel=0.05)
    k.cubo((-0.75, 0, 0.5), (0.4, 0.8, 0.14), '#f1ece0', r, bevel=0.05)
    k.cubo((-1.0, 0, 0.5), (0.1, 1.0, 0.8), '#5a3a1a', r, bevel=0.02)
    CENA.update(ortho=2.3, alvo_z=0.35, inclinacao=35)
def f_tapete(k, r):
    k.cubo((0, 0, 0), (2.2, 1.0, 0.04), '#8a3fc0', r)
    k.cubo((0, 0, 0.02), (1.8, 0.7, 0.04), '#ffd23f', r)
    k.cubo((0, 0, 0.04), (1.5, 0.5, 0.04), '#8a3fc0', r)
    for x in (-1.12, 1.12):
        for j in range(5): k.cubo((x, -0.4 + j * 0.2, 0), (0.08, 0.04, 0.02), '#ffd23f', r)
    CENA.update(ortho=2.4, alvo_z=0.0, inclinacao=60)
def f_planta(k, r):
    k.cil((0, 0, 0.25), (0.6, 0.6, 0.5), '#b8682a', r, lados=10)
    for a in range(5):
        g = k.vazio(f'f{a}', (0, 0, 0.5), r, rot=(0, 0, a * 72))
        k.placa([(0, 0), (0.15, 0.5), (0.05, 0.9), (-0.1, 0.5)], '#4f9f3a', g, rot=(0, 25, 0), esp=0.04)
    CENA.update(ortho=1.6, alvo_z=0.6, inclinacao=15)
def f_estante(k, r):
    k.cubo((0, 0, 0.75), (1.6, 0.5, 1.5), '#6b4a2a', r, bevel=0.03)
    cores = ['#e04848', '#4a9bff', '#ffd23f', '#5dff7a', '#c06aff', '#ff9a2a']
    for z in (0.35, 0.8, 1.25):
        k.cubo((0, -0.2, z - 0.2), (1.45, 0.3, 0.05), '#4a2a10', r)
        for j in range(8): k.cubo((-0.6 + j * 0.17, -0.2, z), (0.13, 0.25, 0.32 + 0.05 * (j % 2)), random.choice(cores), r)
    CENA.update(ortho=1.8, alvo_z=0.75, inclinacao=12)
def f_lareira(k, r):
    k.cubo((0, 0, 0.6), (1.7, 0.6, 1.2), '#7a7280', r, bevel=0.04)
    k.cubo((0, -0.26, 0.45), (1.0, 0.12, 0.7), '#140f1c', r)
    k.cubo((0, 0, 1.25), (1.9, 0.7, 0.12), '#5a5466', r)
    ch = k.vazio('ch', (0, -0.4, 0.15), r)
    k.cone((0, 0, 0.25), (0.6, 0.3, 0.5), k.mat('#ff7a2a', emit=3), ch, lados=8)
    k.cone((0, -0.02, 0.18), (0.32, 0.16, 0.3), k.mat('#ffd23f', emit=4), ch, lados=8)
    for x in (-0.25, 0.25): k.cil((x, -0.4, 0.12), (0.12, 0.12, 0.6), '#5a3a1a', r, rot=(0, 90, 20 * x * 4), lados=6)
    ANIMS['f'] = (2, lambda k, i, n: setattr(k.v['ch'], 'scale', (1, 1, 1) if i == 0 else (0.85, 1, 1.25)))
    CENA.update(ortho=2.0, alvo_z=0.65, inclinacao=12)
def f_armas(k, r):
    k.cubo((0, 0.1, 0.6), (1.6, 0.1, 1.0), '#6b4a2a', r, bevel=0.03)
    for x, rz in ((-0.4, 25), (0.4, -25)):
        g = k.vazio('g', (x, -0.05, 0.6), r, rot=(0, rz, 0))
        k.cubo((0, 0, 0.1), (0.12, 0.04, 0.8), '#dfe4ef', g); k.cubo((0, 0, -0.32), (0.32, 0.06, 0.06), '#c99a1e', g)
    k.bola((0, -0.08, 0.6), (0.5, 0.12, 0.6), '#c0392b', r)
    CENA.update(ortho=1.8, alvo_z=0.6, inclinacao=8)
def f_quadro(k, r):
    k.cubo((0, 0, 0.6), (1.4, 0.08, 1.1), '#c99a1e', r, bevel=0.03)
    k.cubo((0, -0.05, 0.6), (1.15, 0.04, 0.85), '#4a9bff', r)
    k.bola((0, -0.08, 0.55), (0.4, 0.04, 0.5), '#f1c8a0', r)
    k.bola((0, -0.09, 0.85), (0.3, 0.04, 0.2), '#6b4a2a', r)
    CENA.update(ortho=1.6, alvo_z=0.6, inclinacao=0)
def f_aquario(k, r):
    k.cubo((0, 0, 0.5), (1.8, 0.8, 0.9), k.mat('#6fc8ff', rough=0.05, emit=0.3), r)
    k.cubo((0, 0, 0.08), (1.86, 0.86, 0.12), '#3a3448', r)
    k.cubo((0, 0, 0.96), (1.86, 0.86, 0.06), '#3a3448', r)
    for x, z, cor in ((-0.4, 0.6, '#ff9a2a'), (0.35, 0.4, '#ffd23f')): k.bola((x, -0.42, z), (0.3, 0.08, 0.18), cor, r)
    k.cubo((0.6, -0.42, 0.3), (0.06, 0.04, 0.4), '#4f9f3a', r)
    CENA.update(ortho=2.0, alvo_z=0.5, inclinacao=10)
# ---------- peixes (minijogo da pesca) ----------
def f_peixe(k, r):
    cor = {'prateado': '#c8d0e0', 'dourado': '#ffd23f'}.get(COR, '#c8d0e0')
    k.bola((0, 0, 0.4), (1.3, 0.4, 0.7), cor, r)
    k.cone((0.8, 0, 0.4), (0.5, 0.15, 0.4), cor, r, rot=(0, 90, 0), lados=3)
    k.bola((-0.4, -0.18, 0.5), (0.12, 0.05, 0.12), '#1b1424', r)
    CENA.update(ortho=1.8, alvo_z=0.4, inclinacao=0)
def f_garrafa(k, r):
    k.bola((0, 0, 0.35), (0.6, 0.6, 0.65), k.mat('#ff7fd0', rough=0.1, emit=0.4), r)
    k.cil((0, 0, 0.75), (0.22, 0.22, 0.35), k.mat('#c8f0ff', rough=0.05), r, lados=8); k.cil((0, 0, 0.95), (0.26, 0.26, 0.1), '#8a5a2a', r, lados=8)
    CENA.update(ortho=1.3, alvo_z=0.5, inclinacao=10)
def f_bota(k, r):
    k.cubo((0, 0, 0.5), (0.45, 0.45, 0.8), '#5a3a1a', r, bevel=0.06); k.cubo((-0.25, 0, 0.12), (0.9, 0.45, 0.25), '#5a3a1a', r, bevel=0.06)
    k.cubo((0, 0, 0.9), (0.5, 0.5, 0.06), '#3b2a1c', r)
    CENA.update(ortho=1.3, alvo_z=0.5, inclinacao=10)
