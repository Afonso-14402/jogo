# Masmorra do Destino

RPG 2D de masmorras em pixel art que corre direto no browser. Não precisa de instalar nada: é HTML5 Canvas com JavaScript puro, sem bibliotecas e sem ficheiros de imagem. Todos os sprites são desenhados pixel a pixel no código (`js/sprites.js`).

## Como jogar

Abre o ficheiro `index.html` no browser (Chrome, Firefox, Edge…) com duplo clique.

**No telemóvel ou tablet** aparecem controlos de toque: joystick à esquerda, botão grande de ataque (acerta no inimigo mais perto), esquiva, poção, "Usar", os 4 feitiços e botões de pausa, personagem e mochila. Só aparecem em ecrãs táteis; no computador continuas a jogar com teclado e rato. Joga com o telemóvel na horizontal.

| Tecla | Ação |
|---|---|
| WASD / Setas | Mover |
| Clique do rato / Espaço | Atacar (o rato aponta o golpe) |
| 1 2 3 4 | Feitiços: Bola de Fogo, Relâmpago, Nova de Gelo, Cura Divina (gastam mana) |
| Shift | Dash: esquiva rápida, ficas invencível durante o dash |
| E | Abrir baú, falar com o mercador, usar altar/cristal, descer a escada |
| Q | Beber poção (cura 40%) |
| C | Ecrã de personagem (todos os stats, equipamento e melhorias) |
| I | Mochila (guarda até 6 itens, equipa ou vende) |
| P / Esc (ou o botão ⏸ no canto) | Pausa, com botões **Continuar**, **Guardar e sair** (G) e **Desistir** (X, pede confirmação) |
| M | Ligar/desligar o som |

### Guardar a partida

O jogo guarda sozinho ao entrar em cada andar e quando fechas a página. No menu inicial aparece **Continuar** (ENTER) ou **Novo jogo** (N). Ao continuar recomeças o andar onde estavas, com tudo o que tinhas. Se morreres, a partida guardada é apagada.

## O que há no jogo

- **Progressão entre partidas** (menu inicial):
  - **Altar das Almas**: quando morres ou desistes ganhas almas (mais em dificuldades altas) e gastas em melhorias permanentes: vida, dano, mana, ouro e poções iniciais, XP, sorte, começar com o Relâmpago e **Segunda Vida** (revives uma vez por partida).
  - **Coleção de itens**: todos os itens do jogo; os que ainda não encontraste aparecem como "???".
  - **Conquistas**: 14 conquistas que dão almas ou skins novas (Celestial, Dracónica, Infernal).
- **Mochila**: ao abrir um baú podes equipar, guardar na mochila ou vender. Ao equipar, o item antigo vai para a mochila.
- **Zonas**: a cada 5 andares muda a zona, com cores e inimigos próprios:
  - Masmorra (1–5): slimes, morcegos, esqueletos, orcs.
  - Cemitério (6–10): **zumbis** (levantam-se uma vez depois de morrer), fantasmas, esqueletos.
  - Cavernas de Lava (11–15): **diabretes** que atiram bolas de fogo, **slimes de lava** que explodem ao morrer.
  - Abismo Gelado (16–20): **lobos de gelo** e **elementais de gelo** que te abrandam.
  - Depois do 20 aparece tudo misturado.
- **Maldições**: a partir do andar 3 aparecem **Baús Amaldiçoados**, com itens muito melhores mas que trazem sempre uma maldição (Frágil, Sangrento, Pesado, Avareza, Vazio ou Vulnerável). Podes **purificar** o item na Mesa de Encantamentos.
- **Companheiros**: na **Sala do Companheiro** (sempre no andar 2 se ainda não tiveres um) libertas um **Lobo** (morde), uma **Fada** (cura-te e dispara magia) ou um **Mini-Dragão** (cospe fogo). O companheiro sobe de nível com as tuas vitórias.

- **Criação de personagem**: ao começar um jogo novo escolhes a **raça**, a **skin** e a **dificuldade**.

  | Dificuldade | Inimigos (vida / dano) | XP / Ouro | Outros |
  |---|---|---|---|
  | Fácil | 65% / 60% | normal | +2 poções, metade das elites |
  | Normal | 100% / 100% | normal | — |
  | Difícil | 140% / 135% | +20% / +25% | +50% elites |
  | Pesadelo | 200% / 180% | +40% / +50% | muito mais elites, -1 poção |

  Os valores estão em `js/dados.js` (`DIFICULDADES`).

  | Raça | Bónus | Desvantagem |
  |---|---|---|
  | Humano | +20% XP, +1 poção, começa com 40 ouro | — |
  | Elfo | +15% velocidade, +30% poder mágico, +20 mana | -15 vida |
  | Anão | +40 vida, +4 defesa, +30% ouro | -10% velocidade |
  | Orc | +25% dano, +20 vida | -30% poder mágico |
  | Vampiro | +6% roubo de vida, +10% crítico, +1 sorte nos baús | -20 vida, poções curam -15% |

  Cada raça muda também o aspeto (orelhas de elfo, barba de anão, dentes de orc, capa de vampiro). Há 8 skins; **Dourado** desbloqueia ao chegar ao andar 10 e **Infinito** ao andar 20. Os bónus e as cores estão em `js/dados.js` (`RACAS` e `SKINS`).
- **Magia**: tens uma barra de mana (roxa) que se regenera sozinha; as poções também recuperam 40% da mana. Todos começam com a **Bola de Fogo**. Os outros feitiços aprendem-se com **Livros de Feitiço** (largados pelos bosses, na Sala de Desafio e à venda na loja); um livro repetido sobe o feitiço de nível (até 3).
  - **Bola de Fogo**: explode e queima os inimigos à volta.
  - **Relâmpago**: atinge o inimigo mais próximo e salta para outros.
  - **Nova de Gelo**: fere e congela tudo à tua volta.
  - **Cura Divina**: recupera muita vida.
  - O dano mágico usa o **poder mágico**, que sobe com o nível, com os **cajados** (Cajado de Aprendiz, Cajado Arcano, Cetro do Arquimago), com o Amuleto de Safira, com a melhoria **Mente Arcana** e com o afixo **Arcano**.
- **Encantamentos**: na **Sala de Encantamentos** (sempre nos andares 2, 7, 12… e às vezes noutros) há uma Mesa de Encantamentos onde gastas ouro para:
  - **Reforçar** um item de +1 até +5. Cada nível dá mais stats, mas a chance de sucesso vai baixando (95%, 85%, 70%, 55%, 40%) e se falhar perdes o ouro.
  - **Encantar** um item com um afixo aleatório (ou trocar o que tem).
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
| Armadura | de Espinhos (devolve dano), da Muralha, da Vida, do Vento, da Regeneração, do Feiticeiro (+mana) |
| Amuleto | da Sorte, do Sábio (+XP), da Crueldade (+crítico), Arcano (+poder mágico) |

Existem 3 tipos de equipamento: **arma**, **armadura** e **amuleto**. Quando sai um item podes **equipá-lo** (E) ou **reciclá-lo** para ganhar XP (X).

## Estrutura

```
index.html          página do jogo
js/dados.js         itens, afixos, melhorias, raridades, probabilidades, inimigos, elites, bosses e preços
js/mapa.js          geração das masmorras, colisões, pathfinding e desenho dos ladrilhos
js/sprites.js       toda a pixel art (personagens, bosses, itens, ladrilhos)
js/desenho.js       desenho do mundo em baixa resolução, luz, HUD, roleta, loja e ecrãs
js/ecras.js         Altar das Almas, Coleção, Conquistas, Mochila, controlos de toque, companheiro
js/meta.js          o que fica guardado entre partidas (almas, coleção, conquistas)
js/jogo.js          lógica: combate, IA, bosses, zonas, salas especiais, loja, mochila, companheiros e gravação
js/toque.js         controlos de toque (só em ecrãs táteis)
fontes/Tiny5.woff2  fonte pixel Tiny5 (SIL Open Font License, Google Fonts)
```

Para mudar as probabilidades ou criar itens novos, edita `js/dados.js`.

## Jogar online (opcional)

No GitHub vai a **Settings → Pages**, escolhe o branch e a pasta `/ (root)`. O jogo fica disponível num link `https://<utilizador>.github.io/jogo/`.
