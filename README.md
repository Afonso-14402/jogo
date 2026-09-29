# Masmorra do Destino

RPG 2D de masmorras em pixel art que corre direto no browser. Não precisa de instalar nada: é HTML5 Canvas com JavaScript puro, sem bibliotecas e sem ficheiros de imagem. Todos os sprites são desenhados pixel a pixel no código (`js/sprites.js`).

## Como jogar

Abre o ficheiro `index.html` no browser (Chrome, Firefox, Edge…) com duplo clique.

| Tecla | Ação |
|---|---|
| WASD / Setas | Mover |
| Clique do rato / Espaço | Atacar (o rato aponta o golpe) |
| Shift | Dash: esquiva rápida, ficas invencível durante o dash |
| E | Abrir baú, falar com o mercador, usar altar/cristal, descer a escada |
| Q | Beber poção (cura 40%) |
| C | Ecrã de personagem (todos os stats, equipamento e melhorias) |
| P / Esc | Pausa (na pausa, **G** guarda e volta ao menu) |
| M | Ligar/desligar o som |

### Guardar a partida

O jogo guarda sozinho ao entrar em cada andar e quando fechas a página. No menu inicial aparece **Continuar** (ENTER) ou **Novo jogo** (N). Ao continuar recomeças o andar onde estavas, com tudo o que tinhas. Se morreres, a partida guardada é apagada.

## O que há no jogo

- **Andares infinitos** gerados aleatoriamente. Encontra a escada para descer.
- **Inimigos**: Slime, Morcego, Esqueleto Arqueiro, Orc (faz investidas), Fantasma (atravessa paredes) e Mímico.
- **Inimigos de elite**: maiores, com uma aura colorida e um modificador (Veloz, Blindado, Explosivo ou Vampírico). Largam mais ouro e às vezes um baú.
- **Bosses a cada 5 andares**:
  - Andar 5: **Rei Slime**. Salta para cima de ti, solta ondas de choque e invoca slimes.
  - Andar 10: **Lich Necromante**. Anéis de magia, teletransporte e invocação de esqueletos.
  - Andar 15: **Dragão Ancião**. Sopro de fogo, investidas e chuva de meteoros.
  - Andar 20: **Golem de Pedra**. Pisão com onda de choque, atira pedregulhos e faz cair rochas do teto.
  - Andar 25: **Rainha Aranha**. Teias que te prendem, saltos e ninhadas de aranhas.
  - Andar 30: **Rei Demónio**. Pilares de fogo, espirais de balas, teletransporte com investida e fantasmas.
  - Depois disso os bosses repetem-se, cada vez mais fortes. Abaixo de 50% de vida entram em **fase 2 (enfurecidos)**.
- **Níveis e melhorias**: ganhas XP ao matar inimigos. Cada nível dá +vida, +ataque e +defesa, cura-te por completo e deixa-te **escolher 1 de 3 melhorias** (teclas 1, 2, 3 ou clique). Há 16 melhorias, por exemplo:
  - Força Bruta, Fúria, Vitalidade, Olho Certeiro, Trevo da Sorte (baús dão itens melhores)…
  - Únicas: **Remoinho** (cada 4.º ataque atinge à tua volta), **Lâminas Voadoras**, **Escudo Divino** e **Morte Explosiva**.
- **Inimigos inteligentes**: contornam paredes para te apanhar (pathfinding). Os arqueiros só disparam quando te veem.
- **Ouro e loja**: os inimigos largam moedas e vender itens dá ouro. A **Loja do Mercador** aparece sempre nos andares 3, 8, 13… (e às vezes noutros) e vende poções, cura, baús, um item raro ou melhor e o **Pergaminho de Poder** (escolhes uma melhoria).
- **Salas especiais**:
  - **Sala do Tesouro**: vários baús e ouro, guardados por um inimigo de elite.
  - **Altar de Sacrifício**: dás 35% da tua vida máxima e recebes um Baú Dourado.
  - **Sala de Desafio**: tocas no cristal, sobrevives a 3 ondas e ganhas um Baú Dourado.
- **Armadilhas** a partir do andar 2: espinhos que sobem do chão e paredes que disparam flechas.
- **Baús com probabilidades**: ao abrir um baú roda uma roleta que pode dar desde o PIOR até ao MELHOR item do jogo.

### Probabilidades dos baús

| Raridade | Baú de Madeira | Baú Dourado (boss) |
|---|---|---|
| Lixo (ex: *Colher Enferrujada*, o pior item) | 30% | 4% |
| Comum | 32% | 14% |
| Raro | 22% | 30% |
| Épico | 11% | 30% |
| Lendário | 4% | 17% |
| Mítico (ex: *Espada do Infinito*, o melhor item) | 1% | 5% |
| É um Mímico! | 8% | 0% |

A melhoria **Trevo da Sorte** e o afixo **da Sorte** mudam estas percentagens a teu favor (o baú mostra as percentagens atualizadas).

### Atributos aleatórios (afixos)

Os itens podem sair com um atributo extra: *Excalibur **do Trovão***, *Armadura de Ferro **de Espinhos***… Quanto mais raro o item, mais provável é ter afixo (Comum 20%, Raro 45%, Épico 70%, Lendário e Mítico 100%). O Lixo pode vir **da Maldição** (-10% velocidade).

| Tipo | Afixos |
|---|---|
| Arma | de Fogo (queima), de Gelo (abranda), do Trovão (relâmpago em cadeia), do Vampiro, da Fúria, da Rapidez |
| Armadura | de Espinhos (devolve dano), da Muralha, da Vida, do Vento, da Regeneração |
| Amuleto | da Sorte, do Sábio (+XP), da Crueldade (+crítico) |

Existem 3 tipos de equipamento: **arma**, **armadura** e **amuleto**. Quando sai um item podes **equipá-lo** (E) ou **reciclá-lo** para ganhar XP (X).

## Estrutura

```
index.html          página do jogo
js/dados.js         itens, afixos, melhorias, raridades, probabilidades, inimigos, elites, bosses e preços
js/mapa.js          geração das masmorras, colisões, pathfinding e desenho dos ladrilhos
js/sprites.js       toda a pixel art (personagens, bosses, itens, ladrilhos)
js/desenho.js       desenho do mundo em baixa resolução, luz, HUD, roleta, loja e ecrãs
js/jogo.js          lógica: combate, IA, bosses, salas especiais, loja, níveis e gravação
fontes/Tiny5.woff2  fonte pixel Tiny5 (SIL Open Font License, Google Fonts)
```

Para mudar as probabilidades ou criar itens novos, edita `js/dados.js`.

## Jogar online (opcional)

No GitHub vai a **Settings → Pages**, escolhe o branch e a pasta `/ (root)`. O jogo fica disponível num link `https://<utilizador>.github.io/jogo/`.
