# Sprites feitos no Blender

Os sprites HD do jogo são modelados em 3D no Blender (por código Python) e convertidos em pixel art
com sombreado "toon" (3 tons por cor) e o contorno escuro do jogo. Ficam embutidos em `js/sprites_hd.js`.

Precisa do Blender como módulo de Python (`pip install bpy`) e da Pillow.

```
python3 lote.py                 # faz tudo (render + pixel art) -> hd/*.png
python3 lote.py slime orc       # só alguns
SO_PIXEL=1 python3 lote.py ...  # refaz só a pixel art (sem voltar a renderizar)
python3 gerar_js.py             # junta tudo em ../js/sprites_hd.js
python3 ver_lote.py <pasta dos antigos> comparar.png slime orc   # antigo vs novo
```

- `kit.py`: peças (cubo, bola, cilindro, placa...), boneco chibi (`humanoide`), câmara e passes de cor/luz.
- `pixel.py`: reduz o render para o tamanho do sprite (cor mais comum de cada bloco), paleta comum e contorno.
- `lote.py`: lista de todos os sprites (modelo, variáveis, tamanho, opções).
- `modelos/`: um ficheiro por modelo (monstros, bosses, objetos, ícones, ladrilhos, cidade, herói...).

Convenções:
- Sprites HD têm o dobro dos pixels dos antigos (mesmo tamanho no ecrã). `c.hd = true` no canvas.
- Ícones de itens: partes em cinzento neutro levam a cor da raridade no jogo.
- Herói: a pele é magenta e os olhos ciano; o jogo pinta-os com as cores da raça (`heroiHD` em `js/sprites_hd.js`).
- Nomes em `lote.py`: `slime` substitui `SPR.slime`, `bau.ouro` substitui `SPR.bau.ouro`, `art.X` substitui `ART.X`,
  `heroi.<skin>` / `raca.<raça>` / `ladrilho.<zona>.<peça>` / `icone.<tipo>` / `cidade.<tema>.<peça>` têm tratamento próprio.
