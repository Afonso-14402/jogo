# Cidade: edifícios, fonte, candeeiro e árvores (TIPO), cores do tema (TEMA 0-9)
from kit import R
import os, math, random
TIPO = os.environ.get('TIPO', 'casa'); TEMA = int(os.environ.get('TEMA', '0'))
random.seed(TEMA * 31 + len(TIPO))
TEMAS = [  # calc, relva, muralha, fonte, luz, folhas, tronco
 (['#8a8078', '#7a7068', '#5e564e'], ['#3f7a34', '#468a3a', '#6ab050'], ['#4a4458', '#5e5870', '#2a2436'], '#4d9fff', '#ffd27a'),
 (['#6e6a72', '#625e68', '#46424e'], ['#3a4a3a', '#34423a', '#5a6a50'], ['#3a3644', '#4a4656', '#1e1a26'], '#7dffb0', '#9dffcf'),
 (['#5a4a44', '#4e3f3a', '#2e2420'], ['#3a2a24', '#42302a', '#ff7b25'], ['#3a2a26', '#4e3a34', '#1a100c'], '#ff6a1a', '#ff9b45'),
 (['#9aa8b8', '#8a98aa', '#6a788a'], ['#dfeaf5', '#cfdcea', '#ffffff'], ['#5a6a80', '#7486a0', '#34405a'], '#9fdcff', '#cfe8ff'),
 (['#6a5a3a', '#5e4e32', '#3e3220'], ['#2e4a2a', '#344f2c', '#7dff5a'], ['#3a4430', '#4a5640', '#1e2618'], '#6ab04a', '#d0ff7a'),
 (['#c8a870', '#b89860', '#8a6e40'], ['#e0c890', '#d8bc80', '#f0dca0'], ['#a08050', '#b89868', '#6a5030'], '#4dc3ff', '#ffe680'),
 (['#6a6a9a', '#5e5e8a', '#3e3e6a'], ['#3a3a6a', '#44447a', '#9fdcff'], ['#4a4a7a', '#6060a0', '#24244a'], '#ff9ff3', '#9fdcff'),
 (['#3a3044', '#32283c', '#1a1424'], ['#241c30', '#2a2036', '#b44dff'], ['#2a2036', '#3a2e4a', '#100a18'], '#b44dff', '#d08aff'),
 (['#e8e2cf', '#d8d0b8', '#b8ae90'], ['#f4f4ff', '#e8ecff', '#ffffff'], ['#c8c0a8', '#e0d8c0', '#9a9078'], '#ffe680', '#fff0a0'),
 (['#5a4a4a', '#4e4040', '#2e2424'], ['#3a2a2a', '#422e2e', '#ff3b3b'], ['#3a2a2a', '#4e3a3a', '#1a0e0e'], '#ff3b3b', '#ff8a5a')]
CALC, RELVA, MUR, FONTE, LUZ = TEMAS[TEMA]
EDIF = {'casa': ('#ffae00', '#6a4a2a', '#8a2a1a'), 'assoc': ('#4dc3ff', '#2a3a5a', '#1a2a4a'),
        'ferreiro': ('#ff9b45', '#4a3020', '#5a2418'), 'alquimista': ('#5dff7a', '#2a4a30', '#1a3a24')}
ANIMS = {'f': (1, lambda k, i, n: None)}
CENA = {}

def clarear(h, t):
    c = [int(h[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{max(0, min(255, int(v + (255 - v) * t if t > 0 else v * (1 + t)))):02x}' for v in c)

def construir(k):
    r = k.vazio('r')
    globals()['f_' + (TIPO if TIPO in ('fonte', 'candeeiro') or TIPO.startswith('arv_') else 'edificio')](k, r)

def f_edificio(k, r):
    cor, parede, telhado = EDIF[TIPO]
    W, H = 6.0, 3.5
    k.cubo((0, 0, H / 2), (W, 2.0, H), parede, r, bevel=0.05)
    for z in (0.6, 1.05, 2.0, 2.9):  # tábuas / juntas
        k.cubo((0, -1.01, z), (W, 0.02, 0.05), clarear(parede, -0.25), r)
    for x in (-2.9, 2.9): k.cubo((x, -0.9, H / 2), (0.3, 0.3, H), clarear(parede, -0.2), r, bevel=0.03)
    k.cubo((0, -0.9, H), (W + 0.5, 0.4, 0.16), cor, r, bevel=0.02)  # faixa da cor do edifício
    # telhado de duas águas
    import bmesh, bpy
    me = bpy.data.meshes.new('telhado'); bm = bmesh.new()
    a, b, h = W / 2 + 0.25, 1.25, 2.65
    v = [bm.verts.new(p) for p in [(-a, -b, H), (a, -b, H), (0, -b, H + h), (-a, b, H), (a, b, H), (0, b, H + h)]]
    for f in ((v[0], v[1], v[2]), (v[3], v[5], v[4]), (v[0], v[2], v[5], v[3]), (v[1], v[4], v[5], v[2]), (v[0], v[3], v[4], v[1])): bm.faces.new(f)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('telhado', me); k.S.collection.objects.link(o); o.parent = r; o.data.materials.append(k.mat(telhado))
    for j in range(5):  # telhas
        z = H + 0.35 + j * 0.5; L = 2 * a * (1 - (z - H) / h)
        k.cubo((0, -b - 0.02, z), (L, 0.04, 0.07), clarear(telhado, -0.3), r)
    # janelas acesas
    for x in (-1.84, 1.84):
        k.cubo((x, -1.0, 2.37), (1.05, 0.06, 0.95), clarear(parede, -0.35), r)
        k.cubo((x, -1.03, 2.37), (0.92, 0.04, 0.85), k.mat('#ffd278', emit=2.5), r)
        k.cubo((x, -1.06, 2.37), (0.07, 0.03, 0.85), clarear(parede, -0.35), r)
        k.cubo((x, -1.06, 2.37), (0.92, 0.03, 0.07), clarear(parede, -0.35), r)
        k.cubo((x, -1.1, 1.86), (1.1, 0.16, 0.08), clarear(parede, -0.3), r)
    # porta e letreiro
    k.cubo((0, -1.0, 0.48), (1.3, 0.08, 0.96), '#2a1a10', r, bevel=0.03)
    k.bola((0.42, -1.06, 0.45), (0.1, 0.06, 0.1), '#ffd23f', r)
    k.cubo((0, -1.06, 1.31), (5.25, 0.08, 0.62), '#140e08', r, bevel=0.02)
    for z in (1.0, 1.62): k.cubo((0, -1.1, z), (5.25, 0.04, 0.06), k.mat(cor, emit=0.6), r)
    if TIPO == 'casa':
        k.cubo((1.75, 0.0, H + 2.2), (0.45, 0.45, 1.4), '#6a3a1a', r, bevel=0.03)
        k.cubo((1.75, 0.0, H + 2.95), (0.55, 0.55, 0.12), '#4a2a10', r)
    if TIPO == 'assoc':
        k.bola((0, -1.25, H + 1.2), (0.6, 0.15, 0.6), k.mat('#4dc3ff', emit=1.5), r)
    if TIPO == 'alquimista':
        k.bola((0, -1.3, H + 1.15), (0.5, 0.2, 0.5), k.mat('#5dff7a', emit=1.2), r)
    if TIPO == 'ferreiro':
        k.cubo((0, -1.3, H + 1.15), (0.8, 0.12, 0.3), '#555a66', r); k.cubo((0, -1.3, H + 0.95), (0.35, 0.12, 0.3), '#555a66', r)
    CENA.update(ortho=6.5, res_x=832, res_y=800, inclinacao=8, alvo_z=3.125, sol=3.2)

def f_fonte(k, r):
    k.cil((0, 0, 0.25), (2.75, 1.5, 0.5), MUR[1], r, lados=24)
    k.cil((0, 0, 0.52), (2.3, 1.2, 0.06), k.mat(FONTE, rough=0.1, emit=0.25), r, lados=24)
    k.cil((0, 0, 1.2), (0.38, 0.38, 1.4), MUR[0], r, lados=10)
    k.cil((0, 0, 1.6), (1.0, 0.7, 0.14), MUR[1], r, lados=16)
    k.cil((0, 0, 1.68), (0.8, 0.55, 0.04), k.mat(FONTE, rough=0.1, emit=0.25), r, lados=16)
    k.bola((0, 0, 2.05), (0.3, 0.3, 0.45), k.mat(clarear(FONTE, 0.5), emit=0.8), r)
    CENA.update(ortho=2.9, res_x=368, res_y=280, inclinacao=35, alvo_z=0.9)

def f_candeeiro(k, r):
    k.cil((0, 0, 0.8), (0.12, 0.12, 1.6), MUR[2], r, lados=8)
    k.cil((0, 0, 0.05), (0.3, 0.3, 0.1), MUR[2], r, lados=8)
    k.cubo((0, 0, 1.7), (0.36, 0.36, 0.3), k.mat(LUZ, emit=2.5), r, bevel=0.03)
    k.cone((0, 0, 1.95), (0.5, 0.5, 0.2), MUR[2], r, lados=4)
    CENA.update(ortho=2.2, res_x=56, res_y=208, inclinacao=12, alvo_z=1.05)

def f_arv_arvore(k, r):
    k.cil((0, 0, 0.45), (0.3, 0.3, 0.9), '#5a3a1a', r, lados=8)
    for x, z, s in ((0, 1.25, 1.0), (-0.35, 1.0, 0.7), (0.35, 1.05, 0.72), (0.05, 1.6, 0.65)):
        k.bola((x, 0, z), (s, s, s * 0.9), '#3f8a34' if z > 1.2 else '#2f6a2a', r)
def f_arv_pinheiro(k, r):
    k.cil((0, 0, 0.25), (0.25, 0.25, 0.5), '#5a3a1a', r, lados=8)
    for j, (z, s) in enumerate(((0.75, 1.3), (1.2, 1.0), (1.6, 0.7))):
        k.cone((0, 0, z), (s, s, 0.8), '#2f5a3a', r, lados=10)
        k.cone((0, 0, z + 0.15), (s * 0.85, s * 0.85, 0.5), '#ffffff', r, lados=10)
def f_arv_morta(k, r):
    k.cil((0, 0, 0.6), (0.28, 0.28, 1.2), '#4a3a32', r, lados=7)
    for ang, l, z in ((40, 0.7, 1.0), (-35, 0.6, 1.15), (10, 0.5, 1.3), (-60, 0.4, 0.75)):
        k.cil((math.sin(math.radians(ang)) * l / 2, 0, z + math.cos(math.radians(ang)) * l / 2), (0.08, 0.08, l), '#4a3a32', r, rot=(0, ang, 0), lados=6)
def f_arv_rocha(k, r):
    k.bola((0, 0, 0.35), (1.4, 1.0, 0.8), '#3a2a26', r); k.bola((0.3, -0.1, 0.65), (0.7, 0.6, 0.5), '#4e3a34', r)
    for x in (-0.3, 0.2): k.cubo((x, -0.45, 0.4), (0.3, 0.02, 0.05), k.mat('#ff7b25', emit=3), r, rot=(0, 30, 0))
def f_arv_salgueiro(k, r):
    k.cil((0, 0, 0.45), (0.3, 0.3, 0.9), '#4a3a22', r, lados=8)
    k.bola((0, 0, 1.15), (1.5, 1.2, 0.8), '#4a6a2a', r)
    for j in range(7):
        x = -0.6 + j * 0.2
        k.cubo((x, -0.5, 0.75), (0.12, 0.05, 0.6), '#5a7a3a', r)
def f_arv_palmeira(k, r):
    for j in range(6): k.cil((0.04 * j, 0, 0.12 + j * 0.24), (0.22 - j * 0.01, 0.22, 0.24), '#8a6a3a' if j % 2 else '#a07a4a', r, lados=8)
    for a in range(6):
        g = k.vazio(f'f{a}', (0.24, 0, 1.5), r, rot=(0, 0, a * 60))
        k.placa([(0, 0), (0.4, 0.15), (0.9, -0.15), (0.5, 0.0)], '#3f8a34', g, rot=(90, 0, 0), esp=0.04)
    k.bola((0.22, -0.05, 1.42), (0.18, 0.18, 0.18), '#6a4a2a', r)
def f_arv_cristal(k, r):
    m = k.mat('#9fdcff', rough=0.08, emit=0.4); m2 = k.mat('#ff9ff3', rough=0.08, emit=0.4)
    for x, h, mm in ((-0.3, 1.0, m), (0.05, 1.5, m2), (0.38, 0.9, m)): k.cone((x, 0, h / 2), (0.4, 0.4, h), mm, r, lados=5)
def f_arv_obelisco(k, r):
    k.cubo((0, 0, 0.7), (0.5, 0.5, 1.4), '#2a2036', r, bevel=0.03); k.cone((0, 0, 1.55), (0.55, 0.55, 0.3), '#2a2036', r, lados=4, rot=(0, 0, 45))
    for z in (0.5, 0.9): k.cubo((0, -0.26, z), (0.2, 0.02, 0.06), k.mat('#b44dff', emit=3), r)
    k.cubo((0, 0, 0.05), (0.8, 0.8, 0.1), '#1a1424', r)
def f_arv_coluna(k, r):
    k.cil((0, 0, 0.7), (0.5, 0.5, 1.4), '#e8e2cf', r, lados=12)
    for x in range(8):
        a = x / 8 * 2 * math.pi; k.cubo((0.26 * math.cos(a), 0.26 * math.sin(a), 0.7), (0.04, 0.04, 1.4), '#c8c0a8', r)
    k.cubo((0, 0, 1.45), (0.75, 0.75, 0.14), '#d8d0b8', r, bevel=0.02); k.cubo((0, 0, 0.05), (0.75, 0.75, 0.12), '#d8d0b8', r, bevel=0.02)
def f_arv_ruina(k, r):
    k.cubo((-0.3, 0, 0.45), (0.5, 0.5, 0.9), '#5a4a4a', r, bevel=0.04); k.cubo((0.35, 0, 0.25), (0.45, 0.45, 0.5), '#4e4040', r, bevel=0.04)
    k.cubo((0.05, -0.2, 0.08), (0.4, 0.3, 0.16), '#4e4040', r, rot=(0, 0, 20))

for _n in ('arvore', 'pinheiro', 'morta', 'rocha', 'salgueiro', 'palmeira', 'cristal', 'obelisco', 'coluna', 'ruina'):
    if TIPO == 'arv_' + _n: CENA.update(ortho=2.4, alvo_z=0.9, inclinacao=15)
