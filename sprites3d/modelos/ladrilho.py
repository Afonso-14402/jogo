# Ladrilhos do mapa (32x32, sem contorno, repetem-se sem costuras).
# TIPO: chao (VAR 0-3) | face | faceAlt | topo ; ZONA: 0-9
from kit import R
import os, math, random
TIPO = os.environ.get('TIPO', 'chao'); ZONA = int(os.environ.get('ZONA', '0')); VAR = int(os.environ.get('VAR', '0'))
ZONAS = [('#2d2640', '#4d4163', '#1a1522', '#3d5a3a', 'grade'), ('#232e2a', '#3e5a4a', '#121c17', '#4a7a3a', 'hera'),
         ('#3a2622', '#6a3a2e', '#200f0c', '#7a3a1a', 'lava'), ('#20283a', '#3a4a70', '#0f1422', '#3a5a7a', 'gelo'),
         ('#26301f', '#3e4a2a', '#11170c', '#5a7a2a', 'musgo'), ('#6a5638', '#9a7a48', '#2a1f10', '#b89a60', 'hieroglifo'),
         ('#1f2a3a', '#34406a', '#0c1020', '#4a8aa8', 'cristal'), ('#1a1026', '#2e1a40', '#07040c', '#4a2a6a', 'runa'),
         ('#6a6488', '#b8b0d8', '#2a2448', '#ffd27a', 'hieroglifo'), ('#120a1a', '#281838', '#040208', '#5a2aff', 'runa')]
CHAO, PAREDE, TOPO, MUSGO, DET = ZONAS[ZONA]
random.seed(ZONA * 100 + VAR * 7 + len(TIPO))
ANIMS = {'f': (1, lambda k, i, n: None)}
CENA = {'ortho': 2.0, 'alvo_z': 0.0, 'inclinacao': 90, 'sol': 3.0, 'ambiente': 0.5}

def clarear(h, t):
    c = [int(h[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{int(v + (255 - v) * t):02x}' for v in c)

def construir(k):
    r = k.vazio('r')
    if TIPO == 'chao': chao(k, r)
    elif TIPO == 'topo': topo(k, r)
    else:
        face(k, r)
        if TIPO == 'faceAlt': detalhe(k, r)
        CENA.update(inclinacao=0, alvo_z=0.0)

def repetido(f, x, y, raio):
    """Põe a peça e as cópias do outro lado quando passa da borda (para o ladrilho se repetir sem costura)."""
    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            if (dx == 0 or abs(x + dx) < 1 + raio) and (dy == 0 or abs(y + dy) < 1 + raio):
                f(x + dx, y + dy)

def chao(k, r):
    # calçada de pedras irregulares
    k.cubo((0, 0, -0.08), (2.2, 2.2, 0.04), '#0c0a12', r)
    pedras = []
    for gy in range(4):
        for gx in range(4):
            x = -1 + 0.25 + gx * 0.5 + (0.25 if gy % 2 else 0) + random.uniform(-0.05, 0.05)
            y = -1 + 0.25 + gy * 0.5 + random.uniform(-0.04, 0.04)
            if x > 1: x -= 2
            sx, sy = random.uniform(0.44, 0.5), random.uniform(0.42, 0.48)
            cor = random.choice([CHAO, CHAO, clarear(CHAO, 0.05), clarear(CHAO, -0.0)])
            rz = random.uniform(-8, 8)
            repetido(lambda X, Y: k.cubo((X, Y, random.uniform(-0.01, 0.01)), (sx, sy, 0.1), cor, r, rot=(0, 0, rz), bevel=0.06), x, y, 0.3)
    if VAR == 1:
        for (x0, y0), (x1, y1) in zip([(-0.6, 0.6), (-0.3, 0.3), (-0.35, -0.1)], [(-0.3, 0.3), (-0.35, -0.1), (-0.1, -0.35)]):
            L = math.hypot(x1 - x0, y1 - y0)
            k.cubo(((x0 + x1) / 2, (y0 + y1) / 2, 0.06), (L, 0.05, 0.02), '#0c0a12', r, rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    if VAR == 2:
        for _ in range(7): k.bola((random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.3), 0.06), (0.2, 0.15, 0.05), MUSGO, r)
    if VAR == 3:
        for dx, rz in ((0.3, 20), (0.45, -30)): k.cil((dx, -0.35, 0.08), (0.06, 0.06, 0.4), '#d8d0c0', r, rot=(0, 90, rz), lados=6)

def face(k, r):
    # tijolos: 4 filas desencontradas, repetem-se na horizontal
    k.cubo((0, 0.08, 0), (2.2, 0.04, 2.2), '#0c0a12', r)
    for fila in range(4):
        z = 0.75 - fila * 0.5
        off = 0.25 if fila % 2 else 0.0
        for j in range(2):
            x = -0.5 + off + j * 1.0
            cor = PAREDE if random.random() > 0.3 else clarear(PAREDE, 0.07)
            dy = random.uniform(-0.015, 0.015)
            repetido(lambda X, Y: k.cubo((X, -0.02 + dy, z), (0.94, 0.12, 0.44), cor, r, bevel=0.04), x, 0, 0.5)
    k.v['r'] = r

def topo(k, r):
    k.cubo((0, 0, 0), (2.2, 2.2, 0.1), TOPO, r)
    for _ in range(5): k.bola((random.uniform(-0.9, 0.9), random.uniform(-0.9, 0.9), 0.05), (0.14, 0.14, 0.04), clarear(TOPO, 0.08), r)

def detalhe(k, r):
    y = -0.12
    if DET == 'grade':
        k.cubo((0, y + 0.06, 0.1), (0.8, 0.02, 0.8), '#0c0a12', r)
        k.cubo((0, y, 0.1), (0.85, 0.06, 0.85), '#2a2432', r) if False else None
        for x in (-0.15, 0.15): k.cil((x, y, 0.1), (0.07, 0.07, 0.75), '#6a6478', r, lados=6)
        for x in (-0.4, 0.4): k.cubo((x, y, 0.1), (0.06, 0.06, 0.85), '#2a2432', r)
        for z in (-0.32, 0.52): k.cubo((0, y, z), (0.86, 0.06, 0.06), '#2a2432', r)
    elif DET == 'hera':
        for x0 in (-0.6, 0.0, 0.5):
            x = x0
            for j in range(9):
                k.bola((x, y, 1.0 - j * 0.13), (0.14, 0.06, 0.12), '#3f7a3a' if j % 3 else '#5aa04a', r); x += random.uniform(-0.06, 0.06)
    elif DET == 'lava':
        for x in (-0.5, 0.4):
            for j in range(7): k.cubo((x + (0.06 if j > 3 else 0), y, 0.95 - j * 0.2), (0.08, 0.04, 0.22), k.mat('#ff7b25' if j % 3 else '#ffe14d', emit=3), r)
    elif DET == 'gelo':
        k.cubo((0, y, -0.8), (2.0, 0.06, 0.1), '#cfeaff', r)
        for x, l in ((-0.75, 0.5), (-0.25, 0.75), (0.15, 0.4), (0.65, 0.6)):
            k.cone((x, y, 0.95 - l / 2), (0.16, 0.08, l), k.mat('#e0f6ff', rough=0.1, emit=0.2), r, rot=(180, 0, 0), lados=4)
    elif DET == 'musgo':
        for j in range(12):
            x = -0.92 + j * 0.167; h = random.uniform(0.25, 0.6)
            k.cubo((x, y, 1.0 - h / 2), (0.17, 0.05, h), '#4a6a2a', r)
        for x, z in ((-0.35, -0.15), (0.4, 0.1)): k.bola((x, y, z), (0.08, 0.04, 0.08), k.mat('#7dff5a', emit=3), r)
    elif DET == 'hieroglifo':
        for z in (0.6, -0.55): k.cubo((0, y, z), (1.2, 0.04, 0.06), '#6a5028', r)
        oro = k.mat('#ffd23f', emit=0.6)
        k.cubo((-0.35, y, 0.0), (0.08, 0.04, 0.4), oro, r); k.cubo((-0.3, y, -0.1), (0.15, 0.04, 0.08), oro, r)
        k.cubo((0.0, y, 0.0), (0.08, 0.04, 0.5), oro, r); k.cubo((0.0, y, 0.22), (0.3, 0.04, 0.08), oro, r)
        k.toro((0.35, y, 0.05), 0.13, 0.03, oro, r, rot=(90, 0, 0))
    elif DET == 'cristal':
        k.cone((-0.25, y - 0.1, -0.35), (0.3, 0.2, 1.2), k.mat('#7fe0ff', rough=0.08, emit=0.4), r, lados=5)
        k.cone((0.25, y - 0.1, -0.55), (0.3, 0.2, 0.8), k.mat('#ff7fd0', rough=0.08, emit=0.4), r, lados=5)
    elif DET == 'runa':
        m = k.mat('#b44dff', emit=3)
        k.toro((0, y, 0.0), 0.5, 0.04, m, r, rot=(90, 0, 0))
        k.cubo((0, y, 0.0), (0.06, 0.04, 0.8), m, r)
        for x in (-1, 1): k.cubo((0.1 * x, y, 0.32), (0.18, 0.04, 0.05), m, r, rot=(0, 40 * x, 0))
