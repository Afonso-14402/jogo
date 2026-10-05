# Herói (32x32, 3 direções: baixo / direita / cima; a esquerda é a direita espelhada).
# SKIN escolhe a forma (cabeça, corpo, pés) e as cores, como em js/dados.js.
# RACA=<raça> faz só a "camada" da raça (orelhas, barbas, chifres...) com o corpo escondido.
# A pele é magenta (#ff00ff) e os olhos ciano (#00ffff): o jogo pinta-os com as cores da raça.
from kit import R
import os, math
SKIN = os.environ.get('SKIN', 'azul'); RACA = os.environ.get('RACA', '')
PAL = {'r': '#e04848', 's': '#dfe4ef', 'm': '#9aa3b8', 'd': '#5b6480', 'v': '#1b1424', 'w': '#00ffff', 'b': '#3a6ad4', 'B': '#27489c',
       'l': '#6f9bff', 'n': '#6b4a2a', 'y': '#ffd23f', 'p': '#4a4058', 'N': '#3b2a1c', 'f': '#ff00ff', 'h': '#6b4a2a', 'o': '#e8e2cf'}
SKINS = {
  'azul': (('elmo', 'armadura', 'botas'), {}),
  'carmesim': (('samurai', 'armadura', 'botas'), {'b': '#c0392b', 'B': '#8a2219', 'l': '#ff6b5b', 'r': '#ffd23f'}),
  'floresta': (('capuz', 'capa', 'botas'), {'b': '#2f8f5b', 'B': '#1f6040', 'l': '#4fc07f', 's': '#d8c9a3', 'm': '#a89060', 'd': '#6b5a3a', 'r': '#8b5a2b'}),
  'sombra': (('ninja', 'armadura', 'botas'), {'b': '#3a2a4a', 'B': '#221830', 'l': '#5a4470', 's': '#5b6480', 'm': '#3e4458', 'd': '#262a38', 'r': '#b44dff'}),
  'real': (('coroa', 'capa', 'botas'), {'h': '#3a2418', 'b': '#6a3fb5', 'B': '#4a2a80', 'l': '#9a6fe0', 's': '#ffe38a', 'm': '#d9a400', 'd': '#8a6a00', 'r': '#ffffff'}),
  'gelo': (('mago', 'manto', 'manto'), {'h': '#f0f8ff', 'b': '#7fd8ff', 'B': '#3a9ac0', 'l': '#d0f4ff', 's': '#ffffff', 'm': '#bfe6ff', 'd': '#7aa8c8', 'r': '#3d9bff'}),
  'dourado': (('elmo', 'pesada', 'botas'), {'s': '#fff0a0', 'm': '#ffd23f', 'd': '#b88a00', 'b': '#e0b000', 'B': '#a07800', 'l': '#fff6c8', 'r': '#ff3355', 'p': '#8a6a30'}),
  'infinito': (('caveira', 'capa', 'botas'), {'s': '#2a2030', 'm': '#1a1422', 'd': '#0e0a14', 'b': '#ff3355', 'B': '#a01830', 'l': '#ff8095', 'r': '#ff3355'}),
  'celestial': (('aureola', 'manto', 'manto'), {'h': '#ffe38a', 's': '#ffffff', 'm': '#d0f4ff', 'd': '#8ab8d0', 'b': '#f5f0ff', 'B': '#c8bff0', 'l': '#ffffff', 'r': '#ffd23f', 'y': '#4dffea'}),
  'draconica': (('chifres', 'pesada', 'botas'), {'s': '#c0392b', 'm': '#8a2219', 'd': '#5a1410', 'b': '#e8c080', 'B': '#c8a060', 'l': '#f5d8a0', 'r': '#ffd23f'}),
  'infernal': (('chifres', 'capa', 'botas'), {'s': '#3a2a2a', 'm': '#241818', 'd': '#140c0c', 'b': '#ff7b25', 'B': '#b03a10', 'l': '#ffe14d', 'r': '#ff3b3b'}),
  'cristal': (('cristal', 'armadura', 'botas'), {'s': '#d8f8ff', 'm': '#7fe0ff', 'd': '#3a8ab0', 'b': '#bff4ff', 'B': '#5ac0e0', 'l': '#ffffff', 'r': '#ff7fd0'}),
  'vazio': (('capuz', 'manto', 'flutua'), {'s': '#2e1a40', 'm': '#1a1026', 'd': '#07040c', 'b': '#5a2a8a', 'B': '#2e1a40', 'l': '#b44dff', 'r': '#d07fff'}),
  'lendaria': (('coroa', 'pesada', 'botas'), {'h': '#e8e8f0', 's': '#fff6c8', 'm': '#ffd23f', 'd': '#a07800', 'b': '#8a3fc0', 'B': '#5a2a80', 'l': '#d07fff', 'r': '#ffd23f'}),
  'magma': (('caveira', 'pesada', 'botas'), {'s': '#1a1010', 'm': '#0c0606', 'd': '#000000', 'b': '#ff5a1a', 'B': '#a02a08', 'l': '#ffe14d', 'r': '#ffe14d'}),
}
(CAB, CORPO, PES), extra = SKINS[SKIN]
P = dict(PAL, **extra)
CENA = {'ortho': 2.08, 'alvo_z': 0.92, 'shift': 0.1, 'sol': 3.0, 'inclinacao': 22, 'res': 128}

def construir(k):
    M = lambda c, **kw: k.mat(P[c] if len(c) == 1 else c, **kw)
    k.M = M
    raiz = k.vazio('raiz')
    corpo = k.vazio('corpo', (0, 0, 0.62), raiz)
    cab = k.vazio('cabeca', (0, 0, 0.58), corpo)
    pe_e = k.vazio('perna_e', (0.19, 0, 0), corpo); pe_d = k.vazio('perna_d', (-0.19, 0, 0), corpo)
    br_e = k.vazio('braco_e', (0.47, 0, 0.42), corpo); br_d = k.vazio('braco_d', (-0.47, 0, 0.42), corpo)
    k.corpo_objs = []
    def add(o): k.corpo_objs.append(o); return o
    # ----- tronco -----
    if CORPO in ('armadura', 'capa', 'pesada'):
        add(k.cubo((0, 0, 0.25), (0.72, 0.42, 0.42), M('b'), corpo, bevel=0.06))
        add(k.cubo((0, -0.17, 0.27), (0.14, 0.06, 0.36), M('B'), corpo, bevel=0.02))
        add(k.cubo((0, 0, 0.05), (0.76, 0.46, 0.1), M('n'), corpo, bevel=0.02))
        add(k.cubo((0, -0.23, 0.05), (0.16, 0.04, 0.11), M('y'), corpo, bevel=0.01))
        add(k.cubo((0, 0, -0.06), (0.66, 0.4, 0.14), M('B'), corpo, bevel=0.03))
        add(k.cubo((-0.12, -0.215, 0.33), (0.08, 0.02, 0.18), M('l'), corpo))
    if CORPO == 'pesada':
        add(k.cubo((0, -0.2, 0.25), (0.6, 0.08, 0.36), M('s'), corpo, bevel=0.03))
        add(k.cubo((0, -0.25, 0.25), (0.1, 0.02, 0.3), M('d'), corpo))
    if CORPO == 'capa':
        capa = k.vazio('capa', (0, 0.22, 0.46), corpo)
        add(k.placa([(-0.42, 0), (0.42, 0), (0.55, -0.95), (0, -1.0), (-0.55, -0.95)], M('r'), capa, esp=0.05))
        add(k.cubo((0, -0.1, 0.46), (0.8, 0.5, 0.08), M('r'), corpo))
    if CORPO == 'manto':
        add(k.cone((0, 0, 0.0), (0.95, 0.75, 1.2), M('b'), corpo, lados=14))
        add(k.cubo((0, -0.3, -0.05), (0.12, 0.04, 0.9), M('l'), corpo))
        add(k.cubo((0, 0, 0.05), (0.66, 0.46, 0.08), M('y'), corpo, bevel=0.02))
    # ----- braços -----
    for b in (br_e, br_d):
        add(k.bola((0, 0, 0), (0.3 + (0.08 if CORPO == 'pesada' else 0),) * 2 + (0.24,), M('m' if CORPO != 'manto' else 'b'), b))
        add(k.cubo((0, 0, -0.18), (0.16, 0.15, 0.26), M('b'), b, bevel=0.03))
        add(k.bola((0, 0, -0.34), (0.18, 0.18, 0.18), M('d') if CORPO in ('armadura', 'pesada') else M('f'), b))
    # ----- pés -----
    if PES == 'botas':
        for p in (pe_e, pe_d):
            add(k.cubo((0, 0, -0.16), (0.21, 0.19, 0.24), M('p'), p, bevel=0.03))
            add(k.cubo((0, -0.04, -0.33), (0.25, 0.3, 0.16), M('N'), p, bevel=0.04))
    elif PES == 'manto':
        for p in (pe_e, pe_d): add(k.cubo((0, -0.08, -0.38), (0.22, 0.26, 0.1), M('N'), p, bevel=0.03))
    elif PES == 'flutua':
        for j, x in enumerate((-0.25, 0, 0.25)): add(k.cone((x, 0, -0.35), (0.22, 0.22, 0.5), M('B'), corpo, rot=(180, 0, 0), lados=8))
    # ----- cabeça -----
    cabeca(k, cab, M, add)
    k.cab = cab
    if RACA:
        for o in k.corpo_objs: o.is_holdout = True
        raca(k, cab, corpo)

def olhos(k, cab, M, add, y=-0.51, z=0.27, dx=0.18, s=0.15):
    for x in (-dx, dx): add(k.bola((x, y, z), (s, 0.05, s), k.mat('#00ffff', emit=0.0), cab))

def cabeca(k, cab, M, add):
    if CAB in ('elmo', 'samurai', 'chifres', 'cristal', 'caveira'):
        add(k.bola((0, 0, 0.3), (1.0, 0.86, 0.78), M('s'), cab))
        add(k.cubo((0, -0.05, 0.08), (0.96, 0.8, 0.08), M('d'), cab, bevel=0.03))
        if CAB == 'caveira':
            add(k.bola((0, -0.25, 0.26), (0.66, 0.5, 0.56), M('o'), cab))
            for x in (-0.15, 0.15): add(k.bola((x, -0.5, 0.3), (0.2, 0.06, 0.2), M('v'), cab))
            olhos(k, cab, M, add, y=-0.53, z=0.3, dx=0.15, s=0.1)
            add(k.cubo((0, -0.5, 0.1), (0.24, 0.04, 0.06), M('v'), cab))
        else:
            add(k.cubo((0, -0.4, 0.27), (0.84, 0.22, 0.3), M('v'), cab, bevel=0.04))
            olhos(k, cab, M, add)
    if CAB == 'elmo':
        add(k.cubo((0, 0, 0.66), (0.08, 0.5, 0.12), M('d'), cab, bevel=0.02))
        for y, z, sz in ((-0.02, 0.78, 0.24), (0.16, 0.8, 0.2), (0.3, 0.72, 0.16)): add(k.bola((0, y, z), (0.2, 0.26, sz), M('r'), cab))
    if CAB == 'samurai':
        for x in (-1, 1): add(k.cone((0.28 * x, -0.25, 0.75), (0.12, 0.06, 0.6), M('r'), cab, rot=(0, -35 * x, 0), lados=4))
        add(k.bola((0, -0.38, 0.6), (0.18, 0.06, 0.18), M('r'), cab))
        add(k.cil((0, 0, 0.12), (1.3, 1.1, 0.06), M('m'), cab, lados=16))
    if CAB == 'chifres':
        for x in (-1, 1): add(k.cone((0.42 * x, 0, 0.72), (0.18, 0.18, 0.6), M('r'), cab, rot=(0, 40 * x, 0), lados=8))
    if CAB == 'cristal':
        for x, h in ((-0.3, 0.4), (0, 0.6), (0.3, 0.4)): add(k.cone((x, 0, 0.6 + h / 2), (0.18, 0.18, h), k.mat(P['m'], rough=0.1, emit=0.4), cab, lados=5))
    if CAB in ('capuz', 'ninja'):
        add(k.bola((0, 0.02, 0.32), (1.02, 0.9, 0.86), M('b'), cab))
        add(k.cone((0, 0.15, 0.78), (0.4, 0.4, 0.4), M('b'), cab, rot=(-25, 0, 0), lados=10)) if CAB == 'capuz' else None
        add(k.bola((0, -0.25, 0.27), (0.66, 0.5, 0.42), M('v') if CAB == 'capuz' else M('f'), cab))
        if CAB == 'ninja':
            add(k.cubo((0, -0.36, 0.14), (0.7, 0.2, 0.2), M('b'), cab))
            add(k.cil((0, 0, 0.5), (1.04, 0.92, 0.12), M('r'), cab, lados=16))
        olhos(k, cab, M, add, y=-0.48, z=0.28, dx=0.15, s=0.12)
    if CAB in ('coroa', 'mago', 'aureola'):
        add(k.bola((0, 0, 0.3), (0.86, 0.8, 0.76), M('f'), cab))
        add(k.bola((0, 0.06, 0.46), (0.92, 0.84, 0.56), M('h'), cab))
        for x in (-0.15, 0.15): add(k.bola((x, -0.36, 0.28), (0.1, 0.05, 0.12), k.mat('#00ffff'), cab))
        add(k.cubo((0, -0.39, 0.12), (0.14, 0.03, 0.03), '#8a3a3a', cab))
        if CAB == 'coroa':
            add(k.cil((0, 0, 0.68), (0.66, 0.6, 0.14), M('m'), cab, lados=12))
            for j in range(5):
                a = j / 5 * 2 * math.pi - math.pi / 2
                add(k.cone((0.3 * math.cos(a), 0.27 * math.sin(a), 0.84), (0.12, 0.12, 0.22), M('m'), cab, lados=4))
            add(k.bola((0, -0.31, 0.68), (0.08, 0.04, 0.08), M('r'), cab))
        if CAB == 'mago':
            add(k.cil((0, 0, 0.6), (1.2, 1.1, 0.06), M('b'), cab, lados=16))
            add(k.cone((0, 0.05, 1.0), (0.66, 0.6, 0.85), M('b'), cab, rot=(-12, 0, 0), lados=12))
            add(k.bola((0, -0.25, 0.08), (0.5, 0.36, 0.4), M('s'), cab))
        if CAB == 'aureola':
            add(k.toro((0, 0, 0.88), 0.3, 0.05, k.mat(P['r'], emit=2), cab))

def raca(k, cab, corpo):
    pele = k.mat('#ff00ff')
    if RACA == 'elfo':
        for x in (-1, 1): k.cone((0.54 * x, 0, 0.36), (0.14, 0.1, 0.45), pele, cab, rot=(0, 70 * x, 0), lados=6)
    elif RACA == 'anao':
        k.bola((0, -0.42, 0.06), (0.62, 0.3, 0.46), '#c9602a', cab); k.bola((0, -0.44, -0.12), (0.36, 0.22, 0.3), '#8a3f1a', cab)
    elif RACA == 'orc':
        for x in (-1, 1):
            k.cone((0.53 * x, 0, 0.32), (0.16, 0.12, 0.28), pele, cab, rot=(0, 75 * x, 0), lados=6)
            k.cone((0.14 * x, -0.53, 0.12), (0.07, 0.05, 0.14), '#fffbe6', cab, lados=5)
    elif RACA == 'gnomo':
        k.cone((0, 0, 1.0), (0.6, 0.6, 0.65), '#e04040', cab, lados=12); k.cil((0, 0, 0.72), (0.66, 0.66, 0.08), '#a02020', cab, lados=12)
        k.bola((0, -0.42, 0.06), (0.6, 0.28, 0.4), '#f0f0f0', cab)
    elif RACA == 'draconato':
        for x in (-1, 1):
            k.cone((0.32 * x, 0.05, 0.78), (0.14, 0.14, 0.42), '#f0e0c0', cab, rot=(-20, 30 * x, 0), lados=6)
            k.bola((0.42 * x, -0.25, 0.3), (0.14, 0.1, 0.12), '#ff9b2a', cab)
    elif RACA == 'mortoVivo':
        for x in (-1, 1): k.bola((0.44 * x, -0.25, 0.12), (0.12, 0.1, 0.1), '#e8e2cf', cab)
    elif RACA == 'vampiro':
        capa = k.vazio('capa', (0, 0.22, 0.46), corpo)
        k.placa([(-0.5, 0.05), (0.5, 0.05), (0.62, -0.95), (0, -0.9), (-0.62, -0.95)], '#6a0f1f', capa, esp=0.05)
        for x in (-1, 1): k.cone((0.4 * x, -0.05, 0.5), (0.2, 0.2, 0.3), '#8a1a2a', corpo, rot=(0, 20 * x, 0), lados=4)
    elif RACA == 'anjo':
        k.toro((0, 0, 0.98), 0.28, 0.05, k.mat('#ffe680', emit=2), cab)
        for x in (-1, 1):
            a = k.vazio(f'asa{x}', (0.2 * x, 0.22, 0.4), corpo)
            k.placa([(0, 0), (0.35 * x, 0.3), (0.75 * x, 0.32), (0.65 * x, 0.0), (0.4 * x, -0.2)], k.mat('#ffffff', emit=0.3), a, esp=0.05)
    elif RACA == 'demonio':
        for x in (-1, 1): k.cone((0.35 * x, 0.05, 0.75), (0.15, 0.15, 0.4), '#c02020', cab, rot=(-15, 30 * x, 0), lados=6)
        c = k.vazio('cauda', (0, 0.22, 0.0), corpo); k.cil((0.15, 0.2, -0.12), (0.06, 0.06, 0.55), '#a01818', c, rot=(50, 30, 0), lados=6)
        k.cone((0.3, 0.42, 0.06), (0.16, 0.05, 0.16), '#a01818', c, lados=3)
    elif RACA == 'lagarto':
        for x in (-1, 1): k.bola((0.44 * x, -0.2, 0.3), (0.14, 0.1, 0.14), '#4aa83a', cab)
        c = k.vazio('cauda', (0, 0.22, -0.02), corpo); k.cone((0, 0.3, -0.15), (0.3, 0.3, 0.7), '#3a8a2a', c, rot=(-110, 0, 0), lados=8)

# ---------- poses ----------
def base(k):
    v = k.v
    for o in ('perna_e', 'perna_d', 'braco_e', 'braco_d', 'corpo', 'cabeca'): v[o].rotation_euler = (0, 0, 0)
    v['corpo'].location.z = 0.62
    v['braco_d'].rotation_euler = (R(-30), 0, R(-12)); v['braco_e'].rotation_euler = (0, R(10), 0)
def anda(k, t):
    v = k.v; a = math.sin(t * 2 * math.pi)
    v['perna_e'].rotation_euler.x = R(32) * a; v['perna_d'].rotation_euler.x = -R(32) * a
    v['braco_e'].rotation_euler.x = -R(24) * a; v['braco_d'].rotation_euler.x = R(-30) + R(10) * a
    v['corpo'].location.z = 0.62 + 0.05 * abs(math.cos(t * 2 * math.pi)); v['cabeca'].rotation_euler.y = R(3) * a
CHAVES = [(-30, 0, -12), (-150, -4, -45), (-175, -6, -55), (-75, 10, 30), (-50, 8, 38), (-30, 0, -12)]
def ataque(k, i):
    v = k.v; ax, cx, az = CHAVES[i]
    v['braco_d'].rotation_euler = (R(ax), 0, R(az)); v['corpo'].rotation_euler.x = R(-cx)
    v['perna_e'].rotation_euler.x = R(-cx * 2); v['perna_d'].rotation_euler.x = R(cx * 2)
    v['braco_e'].rotation_euler = (R(-cx * 2), R(15), 0)
DIRS = {'baixo': 0, 'direita': 90, 'cima': 180}
ANIMS = {}
for d, rz in DIRS.items():
    def p0(k, i, n, rz=rz):  # a respirar
        k.v['raiz'].rotation_euler.z = R(rz); base(k)
        f = math.sin(i / n * 2 * math.pi)
        k.v['corpo'].location.z = 0.62 - 0.02 * (1 - f) / 2
        k.v['cabeca'].location.z = 0.58 - 0.015 * (1 - f) / 2
        k.v['braco_e'].rotation_euler.y = R(10 + 3 * f); k.v['braco_d'].rotation_euler.z = R(-12 - 3 * f)
    def p1(k, i, n, rz=rz): k.v['raiz'].rotation_euler.z = R(rz); base(k); anda(k, i / n)
    def p2(k, i, n, rz=rz): k.v['raiz'].rotation_euler.z = R(rz); base(k); ataque(k, i)
    ANIMS[f'parado-{d}'] = (4, p0); ANIMS[f'anda-{d}'] = (8, p1); ANIMS[f'ataque-{d}'] = (6, p2)
