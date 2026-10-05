"""Kit para modelar bonecos simples no Blender por código e renderizar frames.

Cada modelo (ficheiro em sprites3d/modelos/) define:
    def construir(k): ...            -> monta o boneco com as funções do kit
    ANIMS = {'nome': (n_frames, pose)}  pose(k, i, n) mexe nos vazios do boneco
e o kit renderiza tudo com fundo transparente para render/<sprite>/<anim>_<i>.png
"""
import bpy, math, os, sys, importlib.util
import bmesh

R = math.radians


def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1,)


class Kit:
    def __init__(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.S = bpy.context.scene
        self.mats = {}
        self.v = {}  # vazios (articulações) por nome

    # ---------- materiais ----------
    def mat(self, cor, rough=0.5, metal=0.0, emit=0.0, alpha=1.0):
        chave = (cor, rough, metal, emit, alpha)
        if chave in self.mats: return self.mats[chave]
        m = bpy.data.materials.new(cor); m.use_nodes = True
        b = [n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'][0]
        b.inputs['Base Color'].default_value = srgb(cor)
        b.inputs['Roughness'].default_value = rough
        b.inputs['Metallic'].default_value = metal
        if emit:
            b.inputs['Emission Color'].default_value = srgb(cor)
            b.inputs['Emission Strength'].default_value = emit
        if alpha < 1:
            b.inputs['Alpha'].default_value = alpha
        self.mats[chave] = m
        return m

    # ---------- peças ----------
    def vazio(self, nome, loc=(0, 0, 0), pai=None, rot=(0, 0, 0)):
        e = bpy.data.objects.new(nome, None); self.S.collection.objects.link(e)
        e.parent = pai; e.location = loc; e.rotation_euler = [R(a) for a in rot]
        self.v[nome] = e
        return e

    def _fim(self, o, loc, esc, rot, cor, pai, suave, bevel, **m):
        o.parent = pai; o.location = loc; o.scale = esc; o.rotation_euler = [R(a) for a in rot]
        o.data.materials.append(cor if not isinstance(cor, str) else self.mat(cor, **m))
        if bevel:
            bv = o.modifiers.new('b', 'BEVEL'); bv.width = bevel; bv.segments = 2
        if suave:
            for p in o.data.polygons: p.use_smooth = True
        return o

    def cubo(self, loc, esc, cor, pai=None, rot=(0, 0, 0), bevel=0.0, **m):
        bpy.ops.mesh.primitive_cube_add(size=1)
        return self._fim(bpy.context.object, loc, esc, rot, cor, pai, False, bevel, **m)

    def bola(self, loc, esc, cor, pai=None, rot=(0, 0, 0), **m):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=20, ring_count=10)
        return self._fim(bpy.context.object, loc, esc, rot, cor, pai, True, 0, **m)

    def cil(self, loc, esc, cor, pai=None, rot=(0, 0, 0), lados=12, **m):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=1, vertices=lados)
        return self._fim(bpy.context.object, loc, esc, rot, cor, pai, lados > 8, 0, **m)

    def cone(self, loc, esc, cor, pai=None, rot=(0, 0, 0), lados=12, **m):
        bpy.ops.mesh.primitive_cone_add(radius1=0.5, depth=1, vertices=lados)
        return self._fim(bpy.context.object, loc, esc, rot, cor, pai, lados > 8, 0, **m)

    def toro(self, loc, raio, grossura, cor, pai=None, rot=(0, 0, 0), **m):
        bpy.ops.mesh.primitive_torus_add(major_radius=raio, minor_radius=grossura, major_segments=24, minor_segments=8)
        return self._fim(bpy.context.object, loc, (1, 1, 1), rot, cor, pai, True, 0, **m)

    def placa(self, pontos, cor, pai=None, loc=(0, 0, 0), rot=(0, 0, 0), esp=0.04, **m):
        """Forma plana (asa, chama, folha...) a partir de pontos (x, z), com espessura."""
        me = bpy.data.meshes.new('placa'); bm = bmesh.new()
        f = bm.faces.new([bm.verts.new((x, 0, z)) for x, z in pontos])
        r = bmesh.ops.extrude_face_region(bm, geom=[f])
        for v in [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.y += esp
        for v in bm.verts: v.co.y -= esp / 2
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new('placa', me); self.S.collection.objects.link(o)
        return self._fim(o, loc, (1, 1, 1), rot, cor, pai, False, 0, **m)

    # ---------- cena ----------
    def cena(self, inclinacao=22, sol=3.0, ambiente=0.55, ortho=3.0, alvo_z=0.8, res=256, shift=0.0, res_x=None, res_y=None):
        bpy.ops.object.light_add(type='SUN'); s = bpy.context.object
        s.data.energy = sol; s.data.angle = R(5)
        s.rotation_euler = (R(50), R(-25), R(-30))
        w = bpy.data.worlds.new('w'); self.S.world = w; w.use_nodes = True
        w.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1)
        w.node_tree.nodes['Background'].inputs[1].default_value = ambiente
        bpy.ops.object.camera_add(); cam = bpy.context.object; self.S.camera = cam
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = ortho; cam.data.shift_y = shift
        a = R(inclinacao); d = 20
        cam.location = (0, -d * math.cos(a), alvo_z + d * math.sin(a))
        cam.rotation_euler = (R(90) - a, 0, 0)
        S = self.S
        S.render.engine = 'CYCLES'; S.cycles.device = 'CPU'
        S.render.film_transparent = True
        S.view_settings.view_transform = 'Standard'; S.view_settings.look = 'None'
        S.cycles.max_bounces = 3; S.cycles.samples = 20; S.cycles.use_denoising = False
        S.cycles.filter_width = 0.5
        S.render.resolution_x = res_x or res; S.render.resolution_y = res_y or res
        self.cam = cam

    # ---------- passes para o sombreado "toon" (cores lisas + 3 níveis de luz) ----------
    def preparar_passes(self):
        self.trocas = []  # (slot, normal, cor, luz)
        cache = {}
        for o in self.S.objects:
            if o.type != 'MESH': continue
            for sl in o.material_slots:
                m = sl.material
                if m.name not in cache:
                    b = [n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'][0]
                    cor = tuple(b.inputs['Base Color'].default_value)
                    emit = b.inputs['Emission Strength'].default_value > 0
                    mc = bpy.data.materials.new(m.name + '_cor'); mc.use_nodes = True
                    nt = mc.node_tree; nt.nodes.clear()
                    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = cor; e.inputs[1].default_value = 1.0
                    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], out.inputs[0])
                    ml = bpy.data.materials.new(m.name + '_luz'); ml.use_nodes = True
                    nt = ml.node_tree; nt.nodes.clear()
                    out = nt.nodes.new('ShaderNodeOutputMaterial')
                    if emit:  # o que brilha fica sempre com luz máxima
                        e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (1, 1, 1, 1); e.inputs[1].default_value = 1.0
                        nt.links.new(e.outputs[0], out.inputs[0])
                    else:
                        d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs[0].default_value = (0.8, 0.8, 0.8, 1)
                        nt.links.new(d.outputs[0], out.inputs[0])
                    cache[m.name] = (m, mc, ml)
                self.trocas.append((sl, *cache[m.name]))

    def passe(self, qual):
        i = {'normal': 1, 'cor': 2, 'luz': 3}[qual]
        for t in self.trocas: t[0].material = t[i]
        self.S.cycles.samples = 1 if qual == 'cor' else 48 if qual == 'luz' else 20
        self.S.cycles.use_denoising = qual == 'luz'
        self.S.view_settings.view_transform = 'Standard'

    def render(self, caminho):
        self.S.render.filepath = caminho
        bpy.ops.render.render(write_still=True)


def correr(ficheiro_modelo, pasta_saida):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    spec = importlib.util.spec_from_file_location('modelo', ficheiro_modelo)
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    k = Kit()
    mod.construir(k)
    k.cena(**getattr(mod, 'CENA', {}))
    os.makedirs(pasta_saida, exist_ok=True)
    toon = os.environ.get('TOON', '1') == '1'
    if toon: k.preparar_passes()
    for nome, (n, pose) in mod.ANIMS.items():
        for i in range(n):
            pose(k, i, n)
            base = os.path.join(pasta_saida, f'{nome}_{i}')
            if toon:
                k.passe('normal'); k.render(base + '.png')
                k.passe('cor'); k.render(base + '.cor.png')
                k.passe('luz'); k.render(base + '.luz.png')
                k.passe('normal')
            else:
                k.render(base + '.png')
    if os.environ.get('GUARDAR_BLEND'):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(pasta_saida, 'modelo.blend'))


if __name__ == '__main__':
    correr(sys.argv[1], sys.argv[2])


# ---------- peças reutilizáveis ----------
def humanoide(k, pele, tronco, calca, pes, cabeca=None, braco=None, larg=1.0, cab=1.0, alt=1.0, magro=False):
    """Boneco chibi: devolve os vazios corpo, cabeca, braco_e/d, perna_e/d (frente = -Y)."""
    cabeca = cabeca or pele; braco = braco or tronco
    g = 0.55 if magro else 1.0
    corpo = k.vazio('corpo', (0, 0, 0.6 * alt))
    k.v['raiz'] = corpo
    k.cubo((0, 0, 0.24 * alt), (0.62 * larg * g, 0.38 * g, 0.46 * alt), tronco, corpo, bevel=0.05)
    cab_ = k.vazio('cabeca', (0, 0, 0.5 * alt), corpo)
    k.bola((0, 0, 0.32 * cab), (0.86 * cab, 0.8 * cab, 0.78 * cab), cabeca, cab_)
    for lado, nome in ((1, 'perna_e'), (-1, 'perna_d')):
        p = k.vazio(nome, (0.16 * larg * lado, 0, 0), corpo)
        k.cubo((0, 0, -0.17), (0.2 * g, 0.2 * g, 0.28), calca, p, bevel=0.03)
        k.cubo((0, -0.04, -0.34), (0.24 * g + 0.04, 0.3, 0.14), pes, p, bevel=0.03)
    for lado, nome in ((1, 'braco_e'), (-1, 'braco_d')):
        b = k.vazio(nome, ((0.36 * larg * g + 0.08) * lado, 0, 0.38 * alt), corpo)
        k.cubo((0, 0, -0.16), (0.16 * g + 0.02, 0.16 * g + 0.02, 0.34), braco, b, bevel=0.03)
        k.bola((0, 0, -0.36), (0.18, 0.18, 0.18), pele, b)
    return k.v


def andar(k, i, n, perna=30, braco=24, salto=0.05, base_z=None):
    a = math.sin(i / n * 2 * math.pi)
    v = k.v
    v['perna_e'].rotation_euler.x = R(perna) * a
    v['perna_d'].rotation_euler.x = -R(perna) * a
    if 'braco_e' in v:
        v['braco_e'].rotation_euler.x = -R(braco) * a
        v['braco_d'].rotation_euler.x = R(braco) * a
    z0 = base_z if base_z is not None else v['corpo'].get('z0', v['corpo'].location.z)
    v['corpo']['z0'] = z0
    v['corpo'].location.z = z0 + salto * abs(math.cos(i / n * 2 * math.pi))


def esticar_pernas(k, f):
    """Pernas mais compridas (bonecos adultos/altos)."""
    v = k.v
    for p in ('perna_e', 'perna_d'): v[p].scale = (1, 1, f)
    v['corpo'].location.z += 0.42 * (f - 1)
