# Masmorra do Destino

RPG 2D de masmorras em pixel art que corre direto no browser. Não precisa de instalar nada: é HTML5 Canvas com JavaScript puro, sem ficheiros de imagem e sem bibliotecas (só o modo a 2 usa a PeerJS para ligar os telemóveis). Todos os sprites são desenhados pixel a pixel no código (`js/sprites.js`).

## Como jogar

Abre o ficheiro `index.html` no browser (Chrome, Firefox, Edge…) com duplo clique.

**No telemóvel ou tablet** aparecem controlos de toque: joystick à esquerda, botão grande de ataque (acerta no inimigo mais perto), esquiva, poção, "Usar", os 4 feitiços e botões de pausa, personagem e mochila. Só aparecem em ecrãs táteis; no computador continuas a jogar com teclado e rato. Joga com o telemóvel na horizontal.

No telemóvel há ainda:

- **Ecrã inteiro**: botão ⛶ no canto do menu e da pausa (esconde a barra do browser e roda para a horizontal).
- **Instalar como app**: botão **Instalar app** no menu (Android) ou, no iPhone, *Partilhar → Adicionar ao ecrã principal*. Instalado abre em ecrã inteiro, com ícone próprio, e **funciona sem internet** (quando o jogo está num site, por exemplo no GitHub Pages).
- **Opções**: tamanho dos botões, transparência, **modo canhoto** (joystick à direita), vibração, **poupança de bateria** (30 FPS), som, ecrã inteiro e rever o tutorial.
- **Vibração** ao levar dano, subir de nível, tirar um item Lendário ou Mítico, matar um boss e morrer (só Android; o iPhone não deixa).
- **Pausa automática** quando sais da app, bloqueias o ecrã ou recebes uma chamada.
- **Tutorial** no andar 1 da primeira partida (no PC e no telemóvel): andar, atacar, abrir um baú (aparece um ao teu lado, com uma seta), abrir a mochila, beber uma poção e usar a magia ou habilidade do teu caçador. Cada passo acaba quando fazes o que ele pede e podes saltá-lo.
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
| F | Habilidade única do teu caçador |
| 5 6 7 8 | Habilidades de Caçador (desbloqueiam nos níveis 5, 10, 15 e 20) |
| P / Esc (ou o botão ⏸ no canto) | Pausa, com botões **Continuar**, **Guardar e sair** (G) e **Desistir** (X, pede confirmação) |
| M | Ligar/desligar o som |
| I (no menu inicial) | Mudar o idioma (Português, Português do Brasil, Inglês, Espanhol) |

### Profundezas (depois do andar 60)

Depois de vencer o Soberano do Vazio, a masmorra continua. Nas Profundezas:
- a dificuldade sobe devagar (o bot de equilíbrio aguenta até ao andar ~100; no 120 já é muito difícil);
- de 10 em 10 andares (70, 80, 90...) vêm **dois bosses de uma vez**; vencê-los dá mais um Baú Dourado e uma relíquia;
- os baús dão mais lendários e míticos quanto mais fundo fores;
- conquistas novas nos andares 70 e 100.

### Combinações

Duas melhorias juntas dão um efeito novo (a carta mostra **+ COMBINAÇÃO** quando a completa): Fúria Sangrenta (Força Bruta + Sanguessuga), Ventania (Fúria + Pés Ligeiros), Muralha Viva (Pele de Pedra + Vitalidade), Elixir Vivo (Alquimista + Regeneração), Tempestade de Lâminas (Remoinho + Lâminas Voadoras), Chuva de Ouro (Morte Explosiva + Trevo da Sorte), Fonte Arcana (Canalizador + Poço de Mana), Bastião (Escudo Divino + Pele de Pedra) e Olho Arcano (Olho Certeiro + Mente Arcana). Estão em `js/combos.js`.

### Atalhos por zona

Quando chegas aos andares 11, 21, 31, 41 ou 51, as partidas novas podem começar lá: no ecrã de criação aparece o botão **Começar no andar N**. O herói começa ao nível desse andar (nível, atributos, equipamento e magias) e escolhe logo 3 melhorias.

### Idioma (PT / BR / EN / ES)

No canto superior direito do menu inicial e da pausa há um botão **PT | BR | EN | ES**: português, português do Brasil, inglês e espanhol. A escolha fica guardada.

- `js/idioma.js`: o `traduzir()` e o inglês;
- `js/idioma_es.js`: o espanhol (as chaves são os textos em português);
- `js/idioma_br.js`: só as palavras que no Brasil se dizem de outra maneira (celular, tela, salvar, conexão...).

As palavras curtas soltas ("Tu", "Não") só se trocam quando são palavras inteiras, e um texto já traduzido não volta a ser traduzido.

### Guardar a partida

O jogo guarda sozinho ao entrar em cada andar e quando fechas a página. No menu inicial aparece **Continuar** (ENTER) ou **Novo jogo** (N). Ao continuar recomeças o andar onde estavas, com tudo o que tinhas. Se morreres, a partida guardada é apagada.

## Jogar a 2 (co-op em dois telemóveis)

1. No telemóvel de quem vai correr o jogo: **Jogar a 2 → Criar sala**. Aparece um código de 4 letras.
2. No outro telemóvel: **Jogar a 2 → Entrar numa sala**, escreve o código e escolhe o caçador.
3. Quem criou a sala carrega em **Novo jogo** ou **Continuar** (pode começar já; o amigo entra quando quiser).

Como funciona:
- O jogo (monstros, dano, baús...) corre no telemóvel de quem criou a sala, que envia ao outro o **estado do jogo** 15 vezes por segundo: onde está cada monstro, tiro, objeto e herói, e os sons. O telemóvel do convidado **desenha tudo sozinho** (a imagem fica perfeita, com o painel dele, a mochila dele e os menus dele) e faz tudo deslizar entre as mensagens.
- **Sem atraso no herói do convidado**: ele mexe-se, esquiva-se e golpeia logo no telemóvel dele, sem esperar pela rede; o outro telemóvel segue a posição dele. Os empurrões, as habilidades que o fazem saltar e os portais vêm do telemóvel de quem criou a sala.
- Para gastar pouca internet só vai o que mudou (uma cópia completa de 2 em 2 segundos): uns 10 a 30 KB/s, conforme os monstros que houver no ecrã.
- O convidado tem o seu joystick e os seus botões (atacar, esquiva, poção, **usar**, ★, magias, habilidades, **herói** e **mochila**) e controla o **2.º herói** (com anel da cor do caçador e "J2" por cima).
- **Cada um tem os seus menus**: o convidado abre baús (a roleta aparece no telemóvel dele), compra nas lojas, usa a mesa de encantamentos, os altares e os edifícios da cidade, e tem a sua mochila e o seu ecrã de personagem. Portais, escadas e a cidade levam os dois.
- **O mundo não para** quando um de vocês está num menu (só a pausa para os dois). Quem está num menu fica parado e não leva dano, e aparece "(menu)" por cima dele.
- Os **monstros atacam o herói mais perto**. A **câmara segue os dois**, por isso não se podem afastar demasiado.
- A **XP e o ouro são da equipa**: o parceiro sobe de nível contigo e escolhe as melhorias no telemóvel dele.
- Cada **baú** aberto por um dá também um prémio ao outro (vai para a mochila; se estiver cheia, é vendido).
- Se um **cair**, o outro reanima-o ficando ao lado dele uns segundos. Só perdem se caírem os dois.
- Os dois podem ser **Caçador das Sombras**: cada um tem o seu exército.
- O botão de pausa do convidado pergunta se quer sair da sala (o jogo continua para o outro).

- **Duelo (1 contra 1)**: com o parceiro ligado, quem criou a sala pode escolher **Duelo**. Os dois heróis (nível 20, equipamento à altura) lutam numa arena sem monstros, à melhor de 3 rondas. Todos os ataques, magias e habilidades acertam no outro (com o dano reduzido, para os duelos não acabarem num segundo). No fim voltam os dois ao menu do Jogar a 2 e o jogo guardado não muda.

A ligação é direta entre os dois telemóveis (WebRTC, com a biblioteca [PeerJS](https://peerjs.com), licença MIT, em `js/lib/`). Precisa de internet nos dois e só funciona no site do jogo (não dentro do Claude).

## Novidades: almas, cidades, armadilhas e enigmas

- **Letra nova** (Nunito): redonda e grossa, muito mais fácil de ler no telemóvel.
- **Almas como moeda**: além das melhorias, o **Altar das Almas** tem uma **Loja** (raças, companheiros e móveis) e **Títulos**. Na cidade há também a **Banca**, paga com almas.
  - **Raças novas**: Anjo (auréola e asas; cura e regeneração), Demónio (chifres e cauda; muito dano, pouca vida) e Homem-Lagarto (escamas; defesa, regeneração e imune a veneno).
  - **Companheiros novos**: Corvo (voa até ao ouro mais longe e bica os monstros) e Golem Pequeno (dá-te um escudo de pedra de vez em quando).
  - **Móveis** para a tua casa na cidade (cama, lareira, estante, aquário...): cada um dá +1% XP para sempre. Na Casa, "Ver a tua casa por dentro" mostra os móveis e os troféus dos bosses.
  - **Títulos**: 16, ganhos com conquistas (Matador de Dragões, Sem Medo, Mestre dos Enigmas...). O escolhido aparece por baixo do herói.
- **Cada cidade tem coisas próprias**:
  - **Banca**: equipamento com o poder da cidade (fogo na Forja das Brasas, gelo no Porto Gelado...) e uma relíquia, pagos com almas.
  - **Missão da Capitã Vera**: caçar um monstro raro (marcado a dourado no minimapa) num dos 4 andares seguintes. O prémio é um amuleto único de cada cidade e almas.
  - **Arena**: 3 ondas de monstros que dão almas (uma vez por visita; quem perde volta à cidade sem morrer).
  - **Minijogos**: pesca no Porto Gelado e corrida de sapos na Aldeia das Palafitas.
- **Armadilhas novas**: chão que cai (andar 4+), paredes com lanças (andar 6+) e salas de gás venenoso (andar 8+).
- **Andares especiais**: Andar do Tesouro (muitos baús, alguns mímicos), Andar Gelado (o chão escorrega) e o Andar Escuro.
- **Duende Dourado**: às vezes aparece, não ataca e foge de ti. Se o apanhares antes de fugir, larga ouro, um Baú Dourado e almas.
- **Sala do Enigma** (andar 3+): um Baú Dourado numa jaula. Abre-se pisando todas as placas a tempo, acendendo todas as alavancas (cada uma muda as do lado) ou rodando as estátuas até olharem para a jaula.

## O que há no jogo

- **Progressão entre partidas** (menu inicial):
  - **Altar das Almas**: quando morres ou desistes ganhas almas (mais em dificuldades altas) e gastas em melhorias permanentes: vida, dano, mana, ouro e poções iniciais, XP, sorte, começar com o Relâmpago e **Segunda Vida** (revives uma vez por partida).
  - **Coleção de itens**: todos os itens do jogo; os que ainda não encontraste aparecem como "???".
  - **Pacto de Castigo** (inspirado no Hades): antes de jogar escolhes regras mais difíceis (monstros mais fortes, mais elites, poções mais fracas, bosses furiosos…). Cada regra dá **Calor** e cada ponto de Calor dá +10% almas.
  - **Missões diárias**: todos os dias há 3 missões novas (matar monstros, abrir baús, chegar a um andar…) que dão almas.
  - **Estatísticas e histórico**: partidas, mortes, tempo de jogo, monstros mortos… e as últimas 8 partidas, com o que te matou.
  - **Coleção e Bestiário**: separadores com os itens, todos os monstros e bosses (com as habilidades de Veterano e Campeão) e as relíquias que já encontraste.
  - **Conquistas**: 42 conquistas que dão almas ou skins novas (Celestial, Dracónica, Infernal, Cristal, Vazio, Lendária, Magma).
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

  Cada raça muda também o aspeto (orelhas de elfo, barba de anão, dentes de orc, capa de vampiro, chapéu de gnomo, chifres de draconato, olhos brilhantes de morto-vivo). Há 15 skins e **cada uma tem uma forma diferente** (elmo, samurai, capuz, ninja, coroa, mago, caveira, auréola, chifres, cristal, fantasma) e um corpo próprio (armadura, armadura pesada, manto ou capa); **Dourado** desbloqueia ao chegar ao andar 10, **Infinito** ao andar 20 e as outras com conquistas. Os bónus e as cores estão em `js/dados.js` (`RACAS` e `SKINS`).
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
- **Caçadores jogáveis** (no ecrã de criação, separador **Caçador**): cada um tem a sua arma e uma **habilidade única** (tecla **F**, ou o botão ★ no telemóvel). São inspirados nos caçadores de manhwas como Solo Leveling, com nomes próprios:
  | Caçador | Arma inicial | Habilidade (F) | Passiva |
  |---|---|---|---|
  | Aventureiro | Espada de Treino | — | +10% XP |
  | Caçador das Sombras | Presa Venenosa (paralisa) | **Passo Sombrio**: troca de lugar com a sombra mais longe e o exército fica +50% mais forte | "Serve-me!" desde o nível 1 e +2 sombras |
  | Dançarina da Espada | Espada Celeste | **Dança da Espada**: atravessa os monstros num relâmpago (dano x3) | +15% vel. de ataque, +5% crítico |
  | Imperador das Chamas | Cajado Flamejante | **Chuva de Meteoros** | +60% poder mágico, Bola de Fogo nível 2 |
  | Garra Selvagem | Garras de Tigre | **Forma Bestial**: 8 s com +50% dano, +30% velocidade e roubo de vida | +40 vida |
  | Colosso | Manoplas do Titã | **Punho do Titã**: atordoa tudo à volta e levas -50% dano 4 s | +60 vida, +6 defesa |
  | Curandeiro Supremo | Bastão Sagrado | **Luz Sagrada**: cura 30%, tira o veneno e queima os monstros (x2 em mortos-vivos) | +2 vida/s, poções +15%, +30% poder mágico |
  | Mestre das Lâminas | Espadas Gémeas do Vento | **Corte do Vento**: leque de lâminas que atravessam | +15% velocidade |
  | **Arqueira Lunar** | Arco Lunar | **Chuva de Flechas**: flechas caem do céu sobre o alvo e à volta dele | +20% alcance, +8% crítico, as flechas atravessam mais 1 monstro |
  | **Guardião do Tempo** (único) | Cetro das Horas | **Parar o Tempo**: 3 s em que os monstros e os tiros deles ficam parados e levam +50% dano (os bosses resistem mais) | +20% vel. de ataque, +5% crítico, recargas 15% mais rápidas |

  **Cada caçador só usa as suas magias e habilidades** (as outras nem aparecem):
  | Caçador | Magias (1-4) | Habilidades (5-8, nos níveis 3, 8, 14 e 20) |
  |---|---|---|
  | Aventureiro | Bola de Fogo, Relâmpago, Nova de Gelo | Redemoinho, Investida |
  | Caçador das Sombras | — | Serve-me! (nível 1), Sede de Sangue, Mão Invisível, Furtividade |
  | Dançarina da Espada | — | Mil Cortes, Redemoinho, Investida |
  | Imperador das Chamas | Bola de Fogo, Relâmpago | Rio de Chamas, Supernova |
  | Garra Selvagem | — | Rugido, Investida, Redemoinho |
  | Colosso | — | Investida, Grito de Guerra, Onda de Choque |
  | Curandeiro Supremo | Cura Divina, Relâmpago | Barreira Sagrada, Julgamento |
  | Mestre das Lâminas | — | Redemoinho, Tornado, Furtividade |
  | Arqueira Lunar | Nova de Gelo | **Leque de Flechas** (5 flechas que atravessam), **Flecha Explosiva** (dano x2.5 em área), **Salto Atrás** (foges e empurras os monstros) |
  | Guardião do Tempo | Nova de Gelo | **Acelerar** (5 s a andar e atacar 50% mais depressa), **Rebobinar** (voltas 3 segundos atrás: ao sítio e à vida que tinhas), Tornado |

  Só o Caçador das Sombras tem o Exército das Sombras. Os Livros de Feitiço só trazem magias do teu caçador. Curar-se ficou mais difícil: a Cura Divina é só do Curandeiro e cura menos, as poções curam 35% e têm 3 s de recarga, o roubo de vida vai no máximo a 10% e a regeneração fica a metade enquanto estás em combate.

  Também há armas lendárias de caçador para encontrar: **Mata-Cavaleiros**, **Fúria do Dragão**, **Adagas do Rei Demónio** (mítico) e o amuleto **Orbe da Ganância**.
- **Música e som**: cada zona tem a sua música (gerada no momento, sem ficheiros), e há músicas próprias para o menu, a cidade, os bosses, os portais e o templo. As explosões e os golpes têm sons com ruído. A tecla **M** (ou Opções no telemóvel) muda entre *tudo*, *só efeitos* e *desligado*.
- **Cidade dos Caçadores** (dentro do jogo): depois de cada boss aparece, ao lado dos baús, uma **escada para cima**. Sobes e chegas a uma cidade onde andas à vontade, com praça, fonte, candeeiros, árvores e habitantes a passear. Vais até à porta de cada edifício e carregas **E** (ou USAR):
  - **A tua Casa**: descansar (vida e mana cheias, uma vez por visita) e guardar o jogo.
  - **Guilda dos Caçadores**: **reavaliação de rank** (o cristal mede o melhor poder que já mostraste; cada rank, de E a Nacional, dá +3% dano e +3% vida para sempre, e o Rank S dá +1 poção no início) e **contratos** que acumulam entre partidas e dão almas.
  - **Ferreiro**: afia a arma e reforça a armadura (+1, sem falhar, até +5), pago com ouro.
  - **Alquimista**: poções e elixires de vida (+8%) e de mana (+20), até 3 de cada por partida.
  - A **escada da praça** desce para o andar seguinte. Se guardares na cidade, continuas nesse andar.
  - **Cada zona tem a sua cidade**, com nome, cores, fonte, árvores (ou rochas, cristais, colunas...) e conversas próprias: Vila da Pedra, Vila dos Coveiros, Forja das Brasas, Porto Gelado, Aldeia das Palafitas, Oásis das Areias, Cidade de Cristal, Bastião do Vazio, Cidadela das Nuvens e Último Acampamento.
  - **Pedra de Teletransporte** (na praça): viaja para qualquer cidade onde já estiveste nesta partida. Ao desceres, continuas a partir dessa cidade, por isso podes voltar a andares mais fáceis para treinar ou fazer pedidos. No Desafio Diário a pedra não funciona; a jogar a 2, só quem criou a sala a pode usar (o parceiro vai junto).
- **História e chefe final**: o [Destino] e o vilão, o **Soberano do Vazio**, falam contigo ao longo da descida numa caixa de diálogo, sem parar o jogo. As últimas zonas são a **Cidadela Celeste** (andares 41-50) e o **Trono do Soberano** (51-60), com monstros próprios (Anjo Guerreiro, Arqueiro Celeste, Querubim, Cavaleiro do Vazio, Mago do Vazio e Devorador) e 4 bosses novos, cada um com desenho, animação e ataques próprios:
  - **Arcanjo Caído** (45): leque de penas, pilares de luz e investidas pelo ar.
  - **General do Soberano** (50): ondas de espada, saltos esmagadores e cortes giratórios.
  - **Carrasco do Vazio** (55): ceifa em arco, correntes que te puxam e poças do Vazio.
  - **Soberano do Vazio** (60, chefe final): três fases, anéis de esferas, chuva do Vazio, espirais de lâminas e o seu exército.

  Vencê-lo mostra o **final do jogo**; depois podes continuar a descer (modo infinito).
- **Animações**: todos os monstros e bosses respiram, inclinam-se ao andar, amassam quando levam um golpe, crescem ao preparar um ataque, aparecem a crescer e desfazem-se ao morrer. Os sprites ganharam luz e sombra automáticas e os bosses brilham à volta. Ao matar um boss o tempo abranda e há um clarão; os críticos têm números maiores.
- **Cidade mais viva**: os habitantes dão **pedidos** (matar um tipo de monstro, elites, abrir baús, conquistar um portal) e pagam em ouro, XP e poções. O **Ancião** junto à fonte conta a história. Em tua casa ficam os **troféus** dos bosses que já derrotaste.
- **Conjuntos de equipamento**: Dracónico, Crepúsculo e Seráfico (arma, armadura e amuleto). 2 peças dão um bónus e 3 peças um bónus maior (por exemplo, golpes que queimam).
- **Pets que evoluem**: no nível 10 o companheiro evolui (Lobo Alfa, Fada Rainha, Dragão Jovem...), fica maior, com aura e +60% dano.
- **Eventos nos andares**: mercador ambulante, chuva de ouro, andar escuro (+50% XP), lua de sangue (monstros mais fortes, mais XP e ouro) ou bênção da deusa.
- **Mapa grande**: tecla **Tab**, ou tocar no minimapa no telemóvel.
- **Boss Rush**: os bosses seguidos, contra o relógio (recuperas metade da vida entre bosses). Antes de cada boss o herói sobe um pouco acima do nível do andar, ganha equipamento, uma melhoria por cada nível e fica com 4 a 8 poções; de 2 em 2 bosses ganha uma relíquia (o Caçador das Sombras recebe soldados). Para não ficar fácil, cada boss é mais forte do que o anterior. Guarda o melhor tempo.
- **Transferir progresso**: no menu, copia um código no aparelho antigo e cola-o no novo para levar almas, conquistas, coleção e o jogo guardado.
- **Sombras**: o Exército das Sombras só existe para o Caçador das Sombras.
- **Sensação de jogo (polimento)**:
  - **Golpes com peso**: micro-pausa ao acertar (maior nos críticos e ao matar), faíscas na direção do golpe, recuo maior nos críticos e um som diferente para cada tipo de arma.
  - **Herói mais vivo**: avança um pouco em cada golpe, deixa um rasto azul na esquiva, pisca a vermelho e encolhe quando leva dano, brilha a verde quando bebe uma poção e respira parado.
  - **Telemóvel**: joystick analógico e suavizado (perto do centro anda devagar). A mira automática prefere o monstro à tua frente e à vista, e os bosses.
  - **Comparar itens**: nas cartas do baú, da mochila e da loja aparece quanto **Poder** ganhas ou perdes (▲/▼), e na mochila e na loja também cada atributo.
  - **Prémios melhores**: quanto mais fundo, menos lixo; às vezes saem armas do mesmo tipo da tua.
  - **Monstros mais espertos**: alguns fogem quando estão quase a morrer, os outros aproximam-se de lado para te cercar e já não ficam presos nas paredes.
  - **Curva de dificuldade** afinada com o bot, do andar 1 ao 60 (múmias, golems de cristal e monstros finais mais justos).
  - **Mais rápido**: a luz é calculada a metade da resolução (−60% de tempo), o minimapa é guardado em cache e há um limite de partículas.
- **Monstros que avisam antes de atacar**: cada monstro prepara o golpe à sua maneira. Uns agacham-se e **saltam** (slimes, aranhas, lobos), outros **erguem-se** e desferem um corte branco (esqueletos, orcs, cavaleiros), outros **encolhem como uma mola** e disparam-se, e os que atiram de longe **carregam uma esfera de energia** antes de disparar. Assim dá para ver o ataque a chegar e esquivar.
- **Cenários mais ricos**: paredes com rachas, correntes, estandartes da cor da zona, nichos com caveiras e velas e musgo a pingar. Coisas que mexem em cada zona: poças de **lava** a borbulhar, **água** com ondas, **teias** a abanar, gotas a cair, velas, brilhos e **fendas** do vazio. As tochas **tremeluzem** e iluminam o chão à volta.
- **Interface com um estilo só**: todas as janelas usam a mesma moldura (cantos decorados, brilho em cima, contorno interior), incluindo as janelas do [Destino]. Os botões do menu, da pausa, da morte e os de voltar/fechar têm **ícones**.
- **Morte que ensina**: o ecrã de morte dá uma **dica** conforme o que te matou (cada monstro, boss, armadilha, fogo no chão ou a estátua do templo).
- **Desafio Diário**: todos os dias há um caçador, uma raça e dois pactos, e os mapas saem iguais para toda a gente (semente do dia). Guarda a pontuação de cada dia (andar x1000 + monstros x5 + nível x20 + bosses x300).
- **Torre dos 100 Andares**: cada andar é uma arena com 2 a 5 ondas de monstros. A cada 5 andares há um andar de descanso (loja, mesa de encantamentos e um baú) e a cada 10 um boss. No andar 100 conquistas a Torre.
- **Mudança de classe (nível 30)**: o [Destino] dá-te uma missão e o andar seguinte é a **Provação**, uma arena com um boss. Se ganhares, o teu caçador evolui: Herói Lendário (ganha o Golpe Heróico), Senhor da Legião, Espada Santa, Fénix Eterna, Rei das Feras, Rei Titã, Santo, Senhor da Tempestade ou Senhor do Tempo (o tempo para 5 s na sala toda). Cada evolução tem uma passiva mais forte e melhora a habilidade única.
- **Generais sombra**: com o Caçador das Sombras, os bosses que ergues tornam-se **generais com nome próprio** (Gelatinoso, Asa da Noite, Rocha Eterna...). Podes ter vários (1 + 1 a cada 15 níveis, até 5), e os elites erguidos tornam-se Cavaleiros Sombrios, mais fortes do que os soldados.
- **Santuário do Vigia**: a partir do andar 6 pode aparecer uma **Porta Antiga**. Lá dentro está um templo com uma estátua gigante e três regras: *ajoelha-te, não te mexas quando ele olhar, aguenta*. Quando os olhos da estátua ficam vermelhos **não te podes mexer**. Pelo meio há raios, chuvas de pedra, anéis de fogo e guardiões de pedra. Se sobreviveres 50 segundos, a estátua desfaz-se e ganhas 3 Baús Dourados, uma relíquia, ouro, poções e almas.
- **Portais (Gates) dentro das masmorras**: em **todos os andares** (menos nos de boss) abre pelo menos um portal, às vezes dois, e sentes onde estão: piscam sempre no minimapa. O rank (**E, D, C, B, A, S, SS ou SSS**) **não depende do andar**: um SSS pode abrir logo no andar 1 e podes entrar em qualquer um... se morreres, morreste. O rank e o tempo aparecem por cima e, ao chegares perto, vês o perigo (até MORTAL) e o boss. Se não entrares a tempo (3 minutos) dá-se a **Rutura do Portal**: os monstros do portal saem para a masmorra. Lá dentro enfrentas **3 ondas de monstros e o boss do portal** (cada rank tem o seu boss, do Rei Slime no E ao Senhor do Vazio no SSS). Quanto maior o rank em relação ao andar, mais fortes os monstros e melhores os prémios (Baús Dourados, relíquias e almas). Um **Portal Maldito** fecha-se atrás de ti: só sais depois de matar o boss, mas dá um prémio extra.
- **Caçador** (inspirado em manhwas como Solo Leveling):
  - **Atributos**: em cada nível ganhas 2 pontos, que vão sozinhos para o atributo principal do teu caçador e para a Vitalidade (não há ecrã para os gastar).
  - **Habilidades de Caçador** (teclas **5 a 8**; no telemóvel aparece uma segunda fila de botões):
    | Nível | Habilidade | O que faz |
    |---|---|---|
    | 5 | **Serve-me!** | os monstros que mataste há pouco levantam-se como **soldados sombra** e lutam contigo |
    | 10 | **Sede de Sangue** | os monstros à tua volta ficam paralisados de medo e levam +30% dano |
    | 15 | **Mão Invisível** | uma força invisível esmaga e empurra os monstros à tua frente |
    | 20 | **Furtividade** | ficas invisível 5 s e o golpe seguinte faz dano x3 |
  - **Exército das Sombras**: até 10 soldados (mais com o nível) e 1 sombra de boss. Ficam contigo de andar para andar. Têm vida (barra roxa): os monstros atacam-nas e podem cair; as que caem voltam no andar seguinte.
  - **Poder de combate e Rank de Caçador** (E, D, C, B, A, S, Nacional): o Poder aparece no topo do ecrã (verde = mais forte do que o andar, amarelo = ao nível, vermelho = perigo). Cada andar é um **portal** com um rank e um **poder recomendado** (aparece ao entrar no andar).
  - **Equilíbrio dinâmico**: se ficares muito mais forte do que o andar, os monstros também sobem (até 2x vida e 1.6x dano). Com equipamento normal o jogo continua difícil; só com o melhor equipamento (lendário/mítico e reforçado) é que matas tudo depressa.
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

| Raridade | Baú de Madeira | Baú Dourado (boss) | Baú Amaldiçoado |
|---|---|---|---|
| Lixo (ex: *Colher Enferrujada*, o pior item) | 34% | 6% | 0% |
| Comum | 36% | 22% | 8% |
| Raro | 20% | 36% | 34% |
| Épico | 8% | 26% | 38% |
| Lendário | 1.7% | 8% | 16% |
| Mítico (ex: *Espada do Infinito*, o melhor item) | 0.3% | 2% | 4% |
| É um Mímico! | 8% | 0% | 0% |

Estas são as percentagens a partir do fundo da masmorra. **Nos primeiros andares os Lendários e os Míticos são ainda mais raros**: os Lendários só chegam ao valor da tabela no andar 15 e os Míticos no andar 35 (no andar 1 são 5 e 20 vezes mais raros). Numa partida típica encontras o primeiro Lendário por volta do andar 14 e um Mítico lá para o andar 40. A melhoria **Trevo da Sorte** e o afixo **da Sorte** mudam estas percentagens a teu favor (o baú mostra as percentagens atualizadas).

Há **104 itens** para colecionar: armas de todos os tipos (espadas, adagas, garras, machados, lanças, martelos, foices, cajados, cetros e arcos), armaduras e amuletos, do Lixo ao Mítico.

### Atributos aleatórios (afixos)

Os itens podem sair com um atributo extra: *Excalibur **do Trovão***, *Armadura de Ferro **de Espinhos***… Quanto mais raro o item, mais provável é ter afixo (Comum 20%, Raro 45%, Épico 70%, Lendário e Mítico 100%). O Lixo pode vir **da Maldição** (-10% velocidade).

| Tipo | Afixos |
|---|---|
| Arma | de Fogo (queima), de Gelo (abranda), do Trovão (relâmpago em cadeia), do Vampiro, da Fúria, da Rapidez |
| Armadura | de Espinhos (devolve dano), da Muralha, da Vida, do Vento, da Regeneração, do Feiticeiro (+mana) |
| Amuleto | da Sorte, do Sábio (+XP), da Crueldade (+crítico), Arcano (+poder mágico) |

Existem 3 tipos de equipamento: **arma**, **armadura** e **amuleto**. Quando sai um item podes **equipá-lo** (E) ou **reciclá-lo** para ganhar XP (X).

### Equilíbrio nos andares altos

A XP para subir de nível cresce mais a partir do nível 6, por isso o herói fica mais ou menos ao nível do andar (antes chegava ao andar 60 no nível 140+ e o fim ficava fácil). Os andares 1 a 3 não têm monstros campeões, os 2 primeiros não têm mímicos e o 1.º boss é um pouco mais fraco. Se fores muito mais forte do que o andar, os monstros acompanham-te — mais cedo e com mais força no Difícil, Pesadelo e Inferno. Com o robô jogador, no modo normal e na Torre o Fácil e o Normal chegam ao fim, o Difícil e o Pesadelo têm apertos e algumas mortes, e o Inferno é para quem já conhece bem o jogo.

A partir do andar 20 os monstros ficam mais fortes cada vez mais depressa, e a defesa vale menos contra monstros de andares fundos (tira no máximo 80% do dano). O roubo de vida tem um limite de 15% e cura no máximo 6% da vida por segundo, e o crítico vai até 60%. Se fores muito mais forte do que o andar, os monstros acompanham-te. Assim o herói já não fica imortal nem mata tudo com um golpe nos andares 50+. Quanto mais fundo chegares, maior o desafio.

## Estrutura

```
index.html          página do jogo
js/idioma.js        traduzir() e tradução para inglês (botão PT | BR | EN | ES)
js/idioma_es.js     tradução para espanhol
js/idioma_br.js     palavras do português do Brasil
js/dados.js         itens, afixos, melhorias, raridades, probabilidades, inimigos, elites, bosses e preços
js/mapa.js          geração das masmorras, colisões, pathfinding e desenho dos ladrilhos
js/sprites.js       toda a pixel art (personagens, bosses, itens, ladrilhos)
js/biomas.js        cenário de cada zona, monstros novos, níveis dos monstros e as suas habilidades
js/conteudo.js      tipos de arma, relíquias, companheiros novos, bosses dos andares 35 e 40, conquistas novas
js/extras.js        Pacto de Castigo, missões diárias, estatísticas, salas secretas, Diabo e Anjo, bestiário
js/cacador.js       atributos, habilidades de caçador, exército das sombras, poder, rank e equilíbrio dinâmico
js/classes.js       caçadores jogáveis (arma e habilidade única de cada um)
js/portais.js       portais E a SSS dentro das masmorras (ondas, boss e prémios), Portais Vermelhos
js/modos.js         Desafio Diário (semente do dia) e Torre dos 100 Andares
js/cidade.js        Cidade dos Caçadores (mapa, casas, habitantes): casa, reavaliação de rank, contratos, ferreiro e alquimista
js/templo.js        Santuário do Vigia: o templo da estátua e as suas regras
js/armadilhas.js    armadilhas novas: chão que cai, paredes com lanças e salas de gás
js/andares.js       Andar do Tesouro, Andar Gelado e o Duende Dourado
js/enigmas.js       Sala do Enigma: placas, alavancas e estátuas
js/almas.js         Loja e Títulos do Altar das Almas, raças e companheiros novos
js/cidade_extra.js  casa decorável, arena da cidade, pesca e corrida de sapos
js/versus.js        Duelo (1 contra 1) a jogar a 2
js/historia.js      falas do [Destino] e do Soberano, bosses das zonas finais e o final do jogo
js/bossesFinais.js  bosses e monstros das zonas finais, estátua do templo, luz e sombra dos sprites
js/aventura.js      conjuntos, pets que evoluem, eventos, mapa grande, efeitos, Boss Rush e código de transferência
js/polimento.js     peso dos golpes, herói mais vivo, mira e joystick, comparar itens, monstros mais espertos, luz rápida
js/coop.js          Jogar a 2: sala com código, 2.º herói, câmara dos dois, reanimar, envio do estado do jogo e dos toques
js/lib/peerjs.min.js  biblioteca PeerJS (MIT) para a ligação entre os dois telemóveis
js/cenario.js       animação dos ataques dos monstros, detalhes das paredes, coisas que mexem (lava, água, teias), ícones da interface e dicas de morte
js/musica.js        música gerada no momento para cada zona, boss, portal e cidade
js/desenho.js       desenho do mundo em baixa resolução, luz, HUD, roleta, loja e ecrãs
js/ecras.js         Altar das Almas, Coleção, Conquistas, Mochila, controlos de toque, companheiro
js/meta.js          o que fica guardado entre partidas (almas, coleção, conquistas)
js/jogo.js          lógica: combate, IA, bosses, zonas, salas especiais, loja, mochila, companheiros e gravação
js/toque.js         controlos de toque, opções, tutorial, ecrã inteiro e vibração (só em ecrãs táteis)
manifest.webmanifest, sw.js, icones/   para instalar como app e jogar sem internet
fontes/Nunito.woff2 letra do jogo, Nunito (SIL Open Font License, Google Fonts): redonda e fácil de ler
fontes/Tiny5.woff2  letra pixel Tiny5 (SIL Open Font License), usada só nas imagens da loja
```

Para mudar as probabilidades ou criar itens novos, edita `js/dados.js`.

## Testes

`testes/telemovel.js` abre o jogo em vários telemóveis e tablets simulados (com o Playwright) e verifica que o jogo ocupa o ecrã, que os toques funcionam, que os monstros atacam, que o tutorial não fica preso e que a pausa funciona:

```
npm install playwright
npx playwright install chromium
node testes/telemovel.js
```

`testes/equilibrio.js` é um bot que joga com cada caçador numa arena cheia de monstros (com o nível e o equipamento típicos dos andares 10, 25 e 45). Mostra quanto tempo cada um demora a limpar a arena e quanta vida perde, e avisa se algum ficou muito acima ou abaixo dos outros:

```
node testes/equilibrio.js          # andares 10, 25 e 45
node testes/equilibrio.js 30 5     # só o andar 30, 5 lutas
node testes/equilibrio.js 5,10,20 2   # vários andares
```

`testes/robo_jogador.js` é um robô que joga partidas inteiras como uma pessoa (anda pelo mapa, luta, bebe poções, abre baús, fica com o equipamento melhor, escolhe melhorias e sobe as escadas). Diz até que andar chegou, de que morreu e em que andares ficou com menos de 30% de vida. Serve para ver se cada modo e cada dificuldade estão justos:

```bash
node testes/robo_jogador.js                                   # modo normal, dificuldade normal
MODO=torre DIF=dificil node testes/robo_jogador.js            # Torre no Difícil
MODO=bossrush DIF=facil,normal,dificil node testes/robo_jogador.js
MODO=diario JOGOS=5 node testes/robo_jogador.js               # 5 desafios diários diferentes
CLASSES=espada,fogo ANDARES=30 JOGOS=2 node testes/robo_jogador.js
```

`testes/caca_bugs.js` joga sozinho do andar 1 ao 60 (abre todos os baús, usa todos os objetos, entra em portais e na cidade, fala com os habitantes) e passa por todos os ecrãs em português e inglês, no PC e no telemóvel. Avisa se houver erros de JavaScript, coisas dentro das paredes, números estragados ou textos a sair do ecrã:

```
node testes/caca_bugs.js
```

`testes/jogar_a_2.js` liga dois browsers (um no PC a criar a sala e outro num "telemóvel" a entrar) através de um servidor PeerJS local e verifica o modo a 2: o código, o mapa e os monstros no telemóvel do convidado, o herói dele a mexer-se logo, o som, a internet gasta, mexer e atacar, as habilidades, a XP partilhada, as melhorias escolhidas com um toque, os baús, a loja e a mochila do convidado, o mundo que não para nos menus, a pausa, cair e reanimar, mudar de andar, sala cheia, código errado e o Caçador das Sombras no convidado:

```
npm install playwright peer
node testes/jogar_a_2.js           # inclui uma volta pelos 60 andares com o convidado ligado
node testes/jogar_a_2.js rapido    # sem essa volta
node testes/duelo_a_2.js           # duelo: golpes e tiros entre os dois, rondas e o fim
```

## App Android (Play Store)

O jogo também é uma app Android (pasta `android/`, feita com o Capacitor). O GitHub constrói-a sozinho em cada alteração: um APK de teste e, com a chave de assinatura nos segredos do repositório, o `.aab` para a Play Store. Os passos todos, os textos da loja e as respostas aos formulários da Google estão em **[PLAY_STORE.md](PLAY_STORE.md)**. As imagens da loja estão em `loja/`.

## Jogar online (opcional)

No GitHub vai a **Settings → Pages**, escolhe o branch e a pasta `/ (root)`. O jogo fica disponível num link `https://<utilizador>.github.io/jogo/`.
