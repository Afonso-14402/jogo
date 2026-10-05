from kit import humanoide, andar, R
import os
COR = os.environ.get('COR', '#6fd8ff')
def construir(k):
    pedra = '#8a8f9e'
    v = humanoide(k, pedra, pedra, '#6a6f7e', '#5a5f6e', larg=1.4, cab=0.8, alt=0.95)
    for b in (v['braco_e'], v['braco_d']): b.scale = (1.35, 1.35, 1.1)
    c = v['cabeca']
    for x in (-0.12, 0.12): k.bola((x, -0.34, 0.3), (0.1, 0.05, 0.08), k.mat(COR, emit=4), c)
    cr = k.mat(COR, rough=0.08, emit=0.8)
    for x, z, s in ((0.25, 0.55, 0.35), (-0.2, 0.6, 0.28), (0.0, 0.62, 0.4)):
        k.cone((x, 0.1, z), (0.2, 0.2, s), cr, v['corpo'], rot=(-10, x * 40, 0), lados=5)
    for b in (v['braco_e'], v['braco_d']): k.cone((0, 0, 0.12), (0.12, 0.12, 0.24), cr, b, lados=5)
def pose(k, i, n): andar(k, i, n, perna=18, braco=12, salto=0.03)
ANIMS = {'f': (4, pose)}
CENA = {'ortho': 2.9, 'alvo_z': 0.9}
