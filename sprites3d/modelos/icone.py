# Ícones de itens (32x32). As partes da cor da raridade são cinzento neutro #b0b0b0
# (o jogo pinta-as com a cor da raridade). Armas na diagonal, lâmina para cima à direita.
from kit import R
import os, math
TIPO = os.environ.get('TIPO', 'espada')
RAR = '#b0b0b0'
CENA = {'ortho': 3.4, 'alvo_z': 0.0, 'inclinacao': 0, 'sol': 3.2}
ANIMS = {'f': (1, lambda k, i, n: None)}
MAD, MADE = '#8b5a2b', '#5a3a1c'

def construir(k):
    k.rar = k.mat(RAR, rough=0.35)
    r = k.vazio('raiz')
    if TIPO in ('espada', 'adaga', 'machado', 'lanca', 'martelo', 'foice', 'arco', 'cajado', 'colher', 'galho', 'peixe'):
        r.rotation_euler = (0, R(45), 0)
    globals()['f_' + TIPO](k, r)

def f_espada(k, r, L=1.5):
    k.cubo((0, 0, 0.25 + L / 2), (0.2, 0.07, L), k.rar, r, bevel=0.02)
    k.cone((0, 0, 0.25 + L + 0.1), (0.2, 0.07, 0.2), k.rar, r, lados=4, rot=(0, 0, 45))
    k.cubo((0, -0.04, 0.25 + L / 2), (0.05, 0.02, L * 0.85), k.mat('#e8e8e8', rough=0.2), r)
    k.cubo((0, 0, 0.22), (0.62, 0.12, 0.1), '#c99a1e', r, bevel=0.02)
    k.cil((0, 0, -0.05), (0.1, 0.1, 0.48), MAD, r, lados=8)
    k.bola((0, 0, -0.33), (0.16, 0.16, 0.16), '#c99a1e', r)
def f_adaga(k, r): f_espada(k, r, L=0.9)
def f_machado(k, r):
    k.cil((0, 0, 0.1), (0.13, 0.13, 2.2), MAD, r, lados=8)
    k.placa([(0, 0.35), (0.75, 1.15), (0.95, 0.55), (0.75, -0.05), (0, 0.15)], k.rar, r, loc=(0.02, 0, 0.55), esp=0.12)
    k.placa([(0, 0.35), (-0.4, 0.75), (-0.5, 0.3), (-0.4, -0.05), (0, 0.15)], k.rar, r, loc=(-0.02, 0, 0.55), esp=0.12)
    k.cubo((0, 0, 0.85), (0.2, 0.16, 0.5), '#5a5f6e', r)
def f_lanca(k, r):
    k.cil((0, 0, -0.1), (0.1, 0.1, 2.3), MAD, r, lados=8)
    k.cone((0, 0, 1.35), (0.5, 0.12, 0.9), k.rar, r, lados=4)
    k.cubo((0, 0, 0.92), (0.42, 0.12, 0.1), '#5a5f6e', r)
def f_martelo(k, r):
    k.cil((0, 0, 0.1), (0.12, 0.12, 2.0), MAD, r, lados=8)
    k.cubo((0, 0, 1.1), (0.8, 0.45, 0.45), k.rar, r, bevel=0.05)
    k.cubo((0, 0, 1.1), (0.84, 0.47, 0.1), '#5a5f6e', r)
def f_foice(k, r):
    k.cil((0, 0, 0.0), (0.11, 0.11, 2.3), MAD, r, lados=8)
    pts = [(-math.sin(a) * 1.0, 1.05 + math.cos(a) * 0.35 - a * 0.15) for a in [i / 10 * 2.2 for i in range(11)]]
    for j, ((x0, z0), (x1, z1)) in enumerate(zip(pts, pts[1:])):
        L = math.hypot(x1 - x0, z1 - z0)
        k.cubo(((x0 + x1) / 2, 0, (z0 + z1) / 2), (0.3 * (1 - j / 12), 0.08, L + 0.04), k.rar, r, rot=(0, math.degrees(math.atan2(x1 - x0, z1 - z0)) + 90, 0))
def f_arco(k, r):
    pts = [(math.sin(a) * 0.45 - 0.2, math.cos(a) * 1.1) for a in [i / 12 * math.pi for i in range(13)]]
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, z1 - z0)
        k.cubo(((x0 + x1) / 2, 0, (z0 + z1) / 2), (0.13, 0.1, L + 0.03), MAD, r, rot=(0, math.degrees(math.atan2(x1 - x0, z1 - z0)), 0))
    k.cubo((-0.2, 0, 0), (0.025, 0.025, 2.2), '#e8e2cf', r)
    k.cubo((0.24, 0, 0), (0.12, 0.12, 0.3), k.rar, r)
    k.cubo((0.0, -0.05, 0), (1.3, 0.04, 0.05), '#d8c8a0', r, rot=(0, 90, 0)) if False else None
def f_cajado(k, r):
    k.cil((0, 0, -0.1), (0.13, 0.13, 2.1), MAD, r, lados=8)
    k.bola((0, 0, 1.25), (0.85, 0.85, 0.85), k.mat(RAR, rough=0.1, emit=0.3), r)
    for a in (0, 120, 240): k.cone((0, 0, 0.92), (0.14, 0.14, 0.5), '#c99a1e', r, rot=(0, 30, a), lados=4)
def f_colher(k, r):
    k.cil((0, 0, 0.0), (0.12, 0.08, 1.7), k.rar, r, lados=8)
    k.bola((0, 0, 1.05), (0.55, 0.2, 0.75), k.rar, r)
def f_galho(k, r):
    k.cil((0, 0, 0.1), (0.12, 0.12, 2.2), MAD, r, lados=6, rot=(0, 5, 0))
    k.cil((0.2, 0, 0.8), (0.08, 0.08, 0.7), MAD, r, lados=6, rot=(0, 40, 0))
    k.cil((-0.15, 0, 0.3), (0.07, 0.07, 0.5), MAD, r, lados=6, rot=(0, -40, 0))
    k.bola((0.42, 0, 1.08), (0.22, 0.08, 0.14), k.rar, r)
def f_peixe(k, r):
    r.rotation_euler = (0, 0, 0)
    k.bola((0, 0, 0), (1.5, 0.4, 0.8), k.rar, r)
    k.cone((0.95, 0, 0), (0.6, 0.15, 0.5), k.rar, r, rot=(0, 90, 0), lados=3)
    k.bola((-0.45, -0.18, 0.1), (0.16, 0.06, 0.16), '#ffffff', r); k.bola((-0.47, -0.21, 0.1), (0.08, 0.04, 0.08), '#1b1424', r)
def f_saco(k, r):
    k.bola((0, 0, -0.1), (1.4, 1.1, 1.3), '#8a6a4a', r)
    k.cil((0, 0, 0.62), (0.4, 0.4, 0.3), '#8a6a4a', r, lados=10)
    k.toro((0, 0, 0.55), 0.22, 0.06, k.rar, r)
    CENA.update(inclinacao=15)
def f_cueca(k, r):
    k.cubo((0, 0, 0.3), (1.6, 0.6, 0.35), k.rar, r, bevel=0.08)
    for x in (-1, 1): k.cubo((0.45 * x, 0, -0.05), (0.7, 0.55, 0.5), k.rar, r, rot=(0, 25 * x, 0), bevel=0.08)
    k.cubo((0, -0.31, 0.42), (1.6, 0.04, 0.1), '#e8e8e8', r)
    CENA.update(inclinacao=15)
def f_balde(k, r):
    k.cil((0, 0, 0), (1.25, 1.25, 1.2), k.rar, r, lados=16)
    k.cil((0, 0, -0.35), (1.29, 1.29, 0.1), '#5a5f6e', r, lados=16)
    k.cil((0, 0, 0.55), (1.31, 1.31, 0.12), '#5a5f6e', r, lados=16)
    k.cil((0, 0, 0.6), (1.1, 1.1, 0.04), '#3a3a3a', r, lados=16)
    k.toro((0, 0.0, 0.62), 0.62, 0.04, '#5a5f6e', r, rot=(-60, 0, 0))
    CENA.update(inclinacao=22)
def f_manto(k, r):
    k.placa([(-0.45, 0.75), (0.45, 0.75), (0.95, -0.9), (0.45, -1.0), (0, -0.9), (-0.45, -1.0), (-0.95, -0.9)], k.rar, r, esp=0.25)
    k.bola((0, 0.0, 0.85), (0.9, 0.6, 0.7), k.rar, r)
    k.bola((0, -0.12, 0.8), (0.5, 0.4, 0.42), '#1b1424', r)
    k.cubo((0, -0.14, 0.0), (0.06, 0.04, 1.4), '#5a5f6e', r)
    k.bola((0, -0.25, 0.48), (0.16, 0.06, 0.16), '#ffd23f', r)
    CENA.update(inclinacao=5)
def f_peitoral(k, r):
    k.bola((0, 0, 0.0), (1.3, 0.7, 1.5), k.rar, r)
    for x in (-1, 1): k.bola((0.68 * x, 0, 0.5), (0.6, 0.7, 0.45), k.rar, r)
    k.cubo((0, 0, 0.75), (0.5, 0.6, 0.3), '#1b1424', r)
    k.cubo((0, -0.36, 0.05), (0.07, 0.04, 1.0), '#5a5f6e', r)
    k.cubo((0, -0.3, -0.5), (1.1, 0.06, 0.14), '#8b5a2b', r)
    CENA.update(inclinacao=10)
def f_anel(k, r):
    k.toro((0, 0, -0.15), 0.55, 0.14, k.rar, r, rot=(75, 0, 0))
    k.cone((0, 0, 0.6), (0.5, 0.5, 0.5), k.mat(RAR, rough=0.05, emit=0.4), r, lados=6)
    k.cone((0, 0, 0.2), (0.5, 0.5, 0.3), k.mat(RAR, rough=0.05, emit=0.4), r, lados=6, rot=(180, 0, 0))
    CENA.update(inclinacao=10)
def f_pedra(k, r):
    k.bola((0, 0, 0), (1.5, 1.0, 1.1), '#8a8a96', r); k.bola((0.3, -0.2, 0.25), (0.6, 0.6, 0.5), '#9a9aa6', r)
    CENA.update(inclinacao=15)
def f_pena(k, r):
    r.rotation_euler = (0, R(40), 0)
    k.placa([(0, -0.9), (0.18, -0.4), (0.25, 0.3), (0.12, 0.9), (0, 1.05), (-0.12, 0.85), (-0.22, 0.2), (-0.15, -0.4)], k.rar, r, esp=0.08)
    k.cubo((0, -0.05, 0.0), (0.04, 0.04, 2.0), '#e8e2cf', r)
def f_coracao(k, r):
    for x in (-1, 1): k.bola((0.38 * x, 0, 0.3), (0.95, 0.6, 0.9), k.rar, r)
    k.cone((0, 0, -0.35), (1.7, 0.6, 1.0), k.rar, r, rot=(180, 0, 0), lados=4, )
    CENA.update(inclinacao=5)
def f_olho(k, r):
    k.bola((0, 0, 0), (1.6, 0.6, 0.95), '#f1ece0', r)
    k.bola((0, -0.26, 0), (0.6, 0.12, 0.6), k.rar, r); k.bola((0, -0.3, 0), (0.28, 0.08, 0.28), '#1b1424', r)
    k.bola((-0.1, -0.33, 0.1), (0.1, 0.04, 0.1), '#ffffff', r)
    CENA.update(inclinacao=0)
def f_amuleto(k, r):
    for x in (-1, 1):
        for j in range(6):
            t = j / 5
            k.toro((0.55 * x * (1 - t) + 0.05 * x, 0, 0.9 - t * 0.85), 0.07, 0.025, '#c99a1e', r, rot=(90 * (j % 2), 0, 0))
    gem = k.mat(RAR, rough=0.05, emit=0.3)
    k.cone((0, 0, -0.18), (0.6, 0.6, 0.35), gem, r, lados=6)
    k.cone((0, 0, -0.55), (0.6, 0.6, 0.5), gem, r, lados=6, rot=(180, 0, 0))
    k.toro((0, 0, -0.27), 0.3, 0.04, '#c99a1e', r)
    CENA.update(inclinacao=8)
