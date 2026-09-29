# Masmorra do Destino

RPG 2D de masmorras em pixel art que corre direto no browser. Não precisa de instalar nada: é HTML5 Canvas com JavaScript puro, sem bibliotecas e sem ficheiros de imagem. Todos os sprites são desenhados pixel a pixel no código (`js/sprites.js`).

## Como jogar

Abre o ficheiro `index.html` no browser (Chrome, Firefox, Edge…) com duplo clique.

**No telemóvel ou tablet** aparecem controlos de toque: joystick à esquerda, botão grande de ataque (acerta no inimigo mais perto), esquiva, poção, "Usar", os 4 feitiços e botões de pausa, personagem e mochila. Só aparecem em ecrãs táteis; no computador continuas a jogar com teclado e rato. Joga com o telemóvel na horizontal.

No telemóvel há ainda:

- **Ecrã inteiro**: botão ⛶ no canto do menu e da pausa (esconde a barra do browser e roda para a horizontal).
- **Instalar como app**: botão **Instalar app** no menu (Android) ou, no iPhone, *Partilhar → Adicionar ao ecrã principal*. Instalado abre em ecrã inteiro, com ícone próprio, e **funciona sem internet** (quando o jogo está num site, por exemplo no GitHub Pages).
- **Opções**: tamanho dos botões, transparência, **modo canhoto** (joystick à direita), vibração, **poupança de bateria** (30 FPS), som, ecrã inteiro e rever o tutorial.
- **Vibração** ao levar dano, subir de nível, tirar um item Lendário ou Mítico, matar um boss e morrer (só Android; o iPhone não deixa).
- **Pausa automática** quando sais da app, bloqueias o ecrã ou recebes uma chamada.
- **Tutorial** na primeira partida: mostra o joystick, o ataque, a esquiva e os feitiços. Cada passo avança sozinho ao fim de uns segundos e podes saltá-lo.
- O jogo respeita o notch e as bordas curvas do ecrã, e as dicas mostram toques em vez de teclas.
- Com o telemóvel deitado o jogo **ocupa o ecrã todo**: o mundo estica para a largura toda e aparece ampliado, e a vida, o minimapa e os botões ficam encostados às bordas.

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
| I (no menu inicial) | Mudar o idioma entre Português e Inglês |

### Idioma (PT / EN)

No canto superior direito do menu inicial e da pausa há um botão **PT | EN** para jogar em português ou em inglês. A escolha fica guardada. As traduções estão em `js/idioma.js`.

### Guardar a partida

O jogo guarda sozinho ao entrar em cada andar e quando fechas a página. No menu inicial aparece **Continuar** (ENTER) ou **Novo jogo** (N). Ao continuar recomeças o andar onde estavas, com tudo o que tinhas. Se morreres, a partida guardada é apagada.

## O que há no jogo

- **Progressão entre partidas** (menu inicial):
  - **Altar das Almas**: quando morres ou desistes ganhas almas (mais em dificuldades altas) e gastas em melhorias permanentes: vida, dano, mana, ouro e poções iniciais, XP, sorte, começar com o Relâmpago e **Segunda Vida** (revives uma vez por partida).
  - **Coleção de itens**: todos os itens do jogo; os que ainda não encontraste aparecem como "???".
  - **Pacto de Castigo** (inspirado no Hades): antes de jogar escolhes regras mais difíceis (monstros mais fortes, mais elites, poções mais fracas, bosses furiosos…). Cada regra dá **Calor** e cada ponto de Calor dá +10% almas.
  - **Missões diárias**: todos os dias há 3 missões novas (matar monstros, abrir baús, chegar a um andar…) que dão almas.
  - **Estatísticas e histórico**: partidas, mortes, tempo de jogo, monstros mortos… e as últimas 8 partidas, com o que te matou.
  - **Coleção e Bestiário**: separadores com os itens, todos os monstros e bosses (com as habilidades de Veterano e Campeão) e as relíquias que já encontraste.
  - **Conquistas**: 36 conquistas que dão almas ou skins novas (Celestial, Dracónica, Infernal, Cristal, Vazio, Lendária, Magma).
- **Mochila**: ao abrir um baú podes equipar, guardar na mochila ou vender. Ao equipar, o item antigo vai para a mochila.
- **Zonas (biomas)**: a cada 5 andares muda a zona. Cada uma tem o seu cenário (cores, decoração no chão e nas paredes, tochas de cor própria, partículas no ar e luz) e os seus monstros:

  | Andares | Zona | Cenário | Monstros |
  |---|---|---|---|
  | 1–5 | Masmorra | ossos, barris, grades, poeira | slimes, morcegos, esqueletos, orcs, **Goblin Ladrão** (rouba ouro e foge) |
  | 6–10 | Cemitério | lápides, cruzes, hera, nevoeiro, chamas verdes | zumbis, fantasmas, esqueletos, **Necromante** (levanta esqueletos) |
  | 11–15 | Cavernas de Lava | fendas de lava a brilhar, brasas no ar | diabretes, slimes de lava, orcs, **Salamandra** (rasto de fogo) |
  | 16–20 | Abismo Gelado | estalagmites de gelo, neve a cair, chamas azuis | lobos e elementais de gelo, **Yeti** (bolas de neve e pisão) |
  | 21–25 | Pântano Venenoso | cogumelos que brilham, juncos, **lama que te abranda**, vaga-lumes | **Sapo Venenoso**, **Planta Carnívora**, aranhas, zumbis |
  | 26–30 | Templo do Deserto | vasos, colunas partidas, hieróglifos, areia no vento | **Múmia** (ligaduras que te puxam), **Escorpião** (enterra-se), esqueletos |
  | 31–35 | Caverna de Cristal | cristais coloridos a brilhar | **Golem de Cristal** (solta estilhaços), **Espírito de Cristal** (teletransporta-se) |
  | 36–40 | Reino do Vazio | runas roxas, fragmentos a flutuar, muito escuro | **Olho do Vazio** (raio laser: sai da linha vermelha!), **Sombra** (quase invisível) |

  Depois do andar 40 as zonas repetem-se (Profundezas), com monstros cada vez mais fortes. Na primeira vez que vês um monstro novo aparece um aviso a explicar o que ele faz.
- **Nível dos monstros**: cada monstro pode nascer normal, **Veterano** (uma divisa prateada por cima) ou **Campeão** (duas divisas douradas). Quanto mais fundo estás na zona e na masmorra, mais aparecem. Veteranos e Campeões têm mais vida e dano e ganham **habilidades novas**, por exemplo:
  - Slime: divide-se em dois ao morrer / deixa gosma que te abranda.
  - Morcego: suga vida / faz investidas.
  - Esqueleto: dispara em leque / dispara rajadas.
  - Orc: fica furioso com pouca vida / grito de guerra que acelera os aliados.
  - Fantasma: fica invisível / teletransporta-se.
  - Zumbi: mordida venenosa / nuvem tóxica ao morrer.
  - Lobo de Gelo: uivo que chama a matilha / investida.
  - …e cada monstro novo tem as suas (ver `hab` em `INIMIGOS`, em `js/dados.js`).
- **Veneno**: alguns monstros envenenam-te (a barra de vida fica verde e perdes vida aos poucos). O veneno nunca te mata sozinho.
- **Maldições**: a partir do andar 3 aparecem **Baús Amaldiçoados**, com itens muito melhores mas que trazem sempre uma maldição (Frágil, Sangrento, Pesado, Avareza, Vazio ou Vulnerável). Podes **purificar** o item na Mesa de Encantamentos.
- **Companheiros**: na **Sala do Companheiro** (sempre no andar 2 se ainda não tiveres um) aparecem 3 de 7 companheiros e escolhes um. O companheiro sobe de nível com as tuas vitórias.
  - **Lobo** (morde), **Fada** (cura-te e dispara magia), **Mini-Dragão** (cospe fogo)
  - **Gato** (arranha e vai buscar o ouro do chão), **Coruja** (penas que atravessam e mostra o mapa à tua volta)
  - **Rochinha** (fica entre ti e os monstros, bloqueia tiros e esmaga à volta), **Fénix** (fogo e, uma vez por andar, cura-te quando estás quase a morrer)
- **Tipos de arma**: cada tipo ataca de maneira diferente (aparece na carta do item):
  | Tipo | Como ataca |
  |---|---|
  | Espada | golpe em arco à tua frente |
  | Adaga | muito rápida; os críticos fazem dano x2.5 |
  | Machado | golpe largo que empurra os monstros para longe |
  | Lança | estocada comprida que atravessa todos em linha |
  | Martelo | esmaga tudo à tua volta e abranda |
  | Foice | varre quase tudo à tua volta e rouba vida |
  | Cajado | golpe e também dispara uma bola de magia |
  | Arco | dispara flechas de longe que atravessam um monstro |

  Há 51 itens: arcos (Fisga, Arco Curto, Arco Longo, Arco Élfico, Arco das Estrelas e o mítico **Arco do Fim do Mundo**), Katana, Adagas Gémeas, Adagas da Sombra, Martelo do Trovão, Lança do Dragão, Tridente do Mar…
- **Relíquias** (inspiradas em jogos como Isaac e Risk of Rain): objetos passivos que ficam contigo até ao fim da partida. Há 20, por exemplo Trevo de 4 Folhas, Coração de Ouro, Ampulheta (feitiços mais rápidos), Dente de Vampiro, Pena de Fénix (revives uma vez), Dado da Sorte (dano x3), Coleira Dourada (companheiro com o dobro do dano)… Aparecem nos bosses, nos Baús Dourados, na Sala de Desafio e à venda na loja. Vês as tuas relíquias no ecrã de jogo (por baixo das melhorias) e na pausa.

- **Criação de personagem**: ao começar um jogo novo escolhes a **raça**, a **skin** e a **dificuldade**.

  | Dificuldade | Inimigos (vida / dano) | XP / Ouro | Outros |
  |---|---|---|---|
  | Fácil | 65% / 60% | normal | +2 poções, metade das elites |
  | Normal | 100% / 100% | normal | — |
  | Difícil | 140% / 135% | +20% / +25% | +50% elites |
  | Pesadelo | 200% / 180% | +40% / +50% | muito mais elites, -1 poção |
  | Inferno (desbloqueia no andar 30) | 280% / 240% | +70% / +80% | elites por todo o lado, -2 poções, almas x3 |

  Os valores estão em `js/dados.js` (`DIFICULDADES`).

  | Raça | Bónus | Desvantagem |
  |---|---|---|
  | Humano | +20% XP, +1 poção, começa com 40 ouro | — |
  | Elfo | +15% velocidade, +30% poder mágico, +20 mana | -15 vida |
  | Anão | +40 vida, +4 defesa, +30% ouro | -10% velocidade |
  | Orc | +25% dano, +20 vida | -30% poder mágico |
  | Vampiro | +6% roubo de vida, +10% crítico, +1 sorte nos baús | -20 vida, poções curam -15% |
  | Gnomo | +2 sorte nos baús, +25% ouro, começa com um Arco Curto | -20 vida |
  | Draconato | +30 vida, +25% poder mágico, imune ao fogo no chão | -10% velocidade de ataque |
  | Morto-Vivo | imune a veneno, +2 vida por segundo, +10% crítico | poções curam -30%, -10% XP |

  Cada raça muda também o aspeto (orelhas de elfo, barba de anão, dentes de orc, capa de vampiro, chapéu de gnomo, chifres de draconato, olhos brilhantes de morto-vivo). Há 15 skins; **Dourado** desbloqueia ao chegar ao andar 10, **Infinito** ao andar 20 e as outras com conquistas. Os bónus e as cores estão em `js/dados.js` (`RACAS` e `SKINS`).
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
  - Andar 35: **Guardião de Cristal**. Anéis de estilhaços, cristais que nascem do chão à tua volta e espíritos de cristal.
  - Andar 40: **Senhor do Vazio**. Raios que rodam à volta dele, teletransporte com explosão de magia e sombras.
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
- **Salas secretas** (inspiradas no Binding of Isaac): em muitos andares há uma parede com **rachas**. Bate-lhe (ou acerta-lhe com uma flecha ou uma bola de fogo) para abrir um esconderijo com ouro e um Baú Dourado ou uma relíquia. Só aparece no mapa depois de a partires.
- **Sala do Diabo e Sala do Anjo**: aparecem muitas vezes no andar a seguir a um boss. No **Diabo** pagas com vida máxima (15% ou 20%) por relíquias ou por uma arma/armadura lendária ou mítica. No **Anjo** levas um presente de graça, mas os outros desaparecem.
- **Morte com causa**: o ecrã de morte diz quem te matou.
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

### Equilíbrio nos andares altos

A partir do andar 20 os monstros ficam mais fortes cada vez mais depressa, e a defesa vale menos contra monstros de andares fundos (tira no máximo 80% do dano). O roubo de vida tem um limite de 15% e o crítico de 60%. Assim o herói já não fica imortal nem mata tudo com um golpe nos andares 50+. Quanto mais fundo chegares, maior o desafio.

## Estrutura

```
index.html          página do jogo
js/idioma.js        tradução para inglês (botão PT | EN)
js/dados.js         itens, afixos, melhorias, raridades, probabilidades, inimigos, elites, bosses e preços
js/mapa.js          geração das masmorras, colisões, pathfinding e desenho dos ladrilhos
js/sprites.js       toda a pixel art (personagens, bosses, itens, ladrilhos)
js/biomas.js        cenário de cada zona, monstros novos, níveis dos monstros e as suas habilidades
js/conteudo.js      tipos de arma, relíquias, companheiros novos, bosses dos andares 35 e 40, conquistas novas
js/extras.js        Pacto de Castigo, missões diárias, estatísticas, salas secretas, Diabo e Anjo, bestiário
js/desenho.js       desenho do mundo em baixa resolução, luz, HUD, roleta, loja e ecrãs
js/ecras.js         Altar das Almas, Coleção, Conquistas, Mochila, controlos de toque, companheiro
js/meta.js          o que fica guardado entre partidas (almas, coleção, conquistas)
js/jogo.js          lógica: combate, IA, bosses, zonas, salas especiais, loja, mochila, companheiros e gravação
js/toque.js         controlos de toque, opções, tutorial, ecrã inteiro e vibração (só em ecrãs táteis)
manifest.webmanifest, sw.js, icones/   para instalar como app e jogar sem internet
fontes/Tiny5.woff2  fonte pixel Tiny5 (SIL Open Font License, Google Fonts)
```

Para mudar as probabilidades ou criar itens novos, edita `js/dados.js`.

## Testes

`testes/telemovel.js` abre o jogo em vários telemóveis e tablets simulados (com o Playwright) e verifica que o jogo ocupa o ecrã, que os toques funcionam, que os monstros atacam, que o tutorial não fica preso e que a pausa funciona:

```
npm install playwright
npx playwright install chromium
node testes/telemovel.js
```

## Jogar online (opcional)

No GitHub vai a **Settings → Pages**, escolhe o branch e a pasta `/ (root)`. O jogo fica disponível num link `https://<utilizador>.github.io/jogo/`.
