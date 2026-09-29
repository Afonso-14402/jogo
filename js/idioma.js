'use strict';
// =====================================================================
//  IDIOMA: português (original) ou inglês
//  Os textos do jogo estão escritos em português. Em inglês, cada texto
//  desenhado passa por traduzir(), que troca as frases conhecidas pela
//  tradução (das mais compridas para as mais curtas). Assim os nomes
//  compostos também se traduzem: "Espada Longa do Vampiro +3" ->
//  "Longsword of the Vampire +3". O resultado fica em cache.
// =====================================================================

let idioma = 'pt';
try { if (localStorage.getItem('masmorra_idioma') === 'en') idioma = 'en'; } catch (e) { /* sem storage */ }

const EN = {
  // ---------------- raridades e baús
  'Lixo': 'Junk', 'Comum': 'Common', 'Raro': 'Rare', 'Épico': 'Epic', 'Lendário': 'Legendary', 'Mítico': 'Mythic',
  'Baú de Madeira': 'Wooden Chest', 'Baú Amaldiçoado': 'Cursed Chest', 'Baú Dourado': 'Golden Chest',

  // ---------------- armas
  'Espada de Treino': 'Training Sword', 'Madeira pintada de cinzento.': 'Wood painted grey.',
  'Colher Enferrujada': 'Rusty Spoon', 'Oficialmente o PIOR item do jogo.': 'Officially the WORST item in the game.',
  'Galho Podre': 'Rotten Stick', 'Parte-se só de olhar para ele.': 'Breaks if you look at it.',
  'Peixe Morto': 'Dead Fish', 'Cheira muito mal.': 'Smells really bad.',
  'Adaga': 'Dagger', 'Rápida e leve.': 'Fast and light.',
  'Cajado de Aprendiz': 'Apprentice Staff', 'Cheira a livros velhos.': 'Smells like old books.',
  'Espada Curta': 'Short Sword', 'Fiável.': 'Reliable.',
  'Machadinha': 'Hatchet', 'Para lenha e monstros.': 'For firewood and monsters.',
  'Espada Longa': 'Longsword', 'Aço de qualidade.': 'Quality steel.',
  'Lança de Ferro': 'Iron Spear', 'Mantém-nos à distância.': 'Keeps them at a distance.',
  'Martelo de Guerra': 'War Hammer', 'Lento mas esmagador.': 'Slow but crushing.',
  'Cajado Arcano': 'Arcane Staff', 'Zumbe com energia.': 'Hums with energy.',
  'Lâmina Sombria': 'Shadow Blade', 'Sussurra no escuro.': 'Whispers in the dark.',
  'Machado Rúnico': 'Runic Axe', 'As runas brilham ao golpear.': 'The runes glow when it strikes.',
  'Cetro do Arquimago': 'Archmage Scepter', 'Os feitiços obedecem-lhe.': 'Spells obey it.',
  'Arrancada da pedra.': 'Pulled from the stone.',
  'Foice do Ceifador': 'Reaper\'s Scythe', 'Colhe almas.': 'Harvests souls.',
  'Espada do Infinito': 'Infinity Sword', 'O MELHOR item do jogo. Corta a própria realidade.': 'The BEST item in the game. Cuts reality itself.',
  // ---------------- armaduras
  'Saco de Batatas': 'Potato Sack', 'Pelo menos tapa.': 'At least it covers you.',
  'Cueca Furada': 'Holey Underpants', 'Deixa-te MAIS fraco. Parabéns.': 'Makes you WEAKER. Congrats.',
  'Balde na Cabeça': 'Bucket Helmet', 'Não se vê nada.': 'You can\'t see a thing.',
  'Túnica de Couro': 'Leather Tunic', 'Básica.': 'Basic.',
  'Cota de Malha': 'Chainmail', 'Faz barulho a andar.': 'Noisy when you walk.',
  'Armadura de Ferro': 'Iron Armor', 'Sólida.': 'Solid.',
  'Manto do Mago': 'Wizard Robe', 'Tecido encantado.': 'Enchanted cloth.',
  'Escamas de Dragão': 'Dragon Scales', 'Quente ao toque.': 'Warm to the touch.',
  'Manto Celestial': 'Celestial Mantle', 'Tecido pelas estrelas.': 'Woven by the stars.',
  'Armadura do Deus Antigo': 'Armor of the Old God', 'Nada te consegue tocar.': 'Nothing can touch you.',
  // ---------------- amuletos
  'Anel de Plástico': 'Plastic Ring', 'Saiu num ovo de chocolate.': 'Came in a chocolate egg.',
  'Pedra Qualquer': 'Random Rock', 'É só pesada.': 'It\'s just heavy.',
  'Anel de Cobre': 'Copper Ring', 'Um pouco de sorte.': 'A little luck.',
  'Pena Leve': 'Light Feather', 'Andas mais depressa.': 'You walk faster.',
  'Amuleto do Vampiro': 'Vampire Amulet', 'Cura-te ao causar dano.': 'Heals you when you deal damage.',
  'Anel da Força': 'Ring of Strength', 'Mais dano.': 'More damage.',
  'Anel do Vento': 'Wind Ring', 'Leve como o ar.': 'Light as air.',
  'Talismã Vital': 'Vital Talisman', 'Regenera vida.': 'Regenerates health.',
  'Amuleto de Safira': 'Sapphire Amulet', 'Guarda energia mágica.': 'Stores magic energy.',
  'Coração da Fénix': 'Phoenix Heart', 'Renasce das cinzas.': 'Rises from the ashes.',
  'Olho de Deus': 'Eye of God', 'Vê tudo. Pode tudo.': 'Sees all. Can do anything.',

  // ---------------- inimigos e bosses
  'Morcego': 'Bat', 'Esqueleto': 'Skeleton', 'Fantasma': 'Ghost', 'Zumbi': 'Zombie', 'Diabrete': 'Imp',
  'Slime de Lava': 'Lava Slime', 'Lobo de Gelo': 'Frost Wolf', 'Elemental de Gelo': 'Frost Elemental',
  'Rainha Aranha': 'Spider Queen', 'Aranha': 'Spider', 'Mímico': 'Mimic',
  'Rei Slime': 'Slime King', 'Lich Necromante': 'Necromancer Lich', 'Dragão Ancião': 'Ancient Dragon',
  'Golem de Pedra': 'Stone Golem', 'Rei Demónio': 'Demon King',
  // ---------------- elites
  'Veloz': 'Swift', '+50% velocidade': '+50% speed', 'Blindado': 'Armored', 'Recebe metade do dano': 'Takes half damage',
  'Explosivo': 'Explosive', 'Explode ao morrer': 'Explodes on death', 'Vampírico': 'Vampiric', 'Cura-se ao acertar-te': 'Heals when it hits you',
  // ---------------- salas
  'Loja do Mercador': 'Merchant\'s Shop', 'Gasta o teu ouro': 'Spend your gold',
  'Sala do Tesouro': 'Treasure Room', 'Guardada por um inimigo de elite': 'Guarded by an elite enemy',
  'Altar de Sacrifício': 'Sacrifice Altar', 'Troca vida por um Baú Dourado': 'Trade health for a Golden Chest',
  'Sala de Desafio': 'Challenge Room', 'Sobrevive a 3 ondas e ganha um Baú Dourado': 'Survive 3 waves and win a Golden Chest',
  'Sala de Encantamentos': 'Enchanting Room', 'Reforça e encanta o teu equipamento': 'Upgrade and enchant your gear',
  'Sala do Companheiro': 'Companion Room', 'Liberta um amigo para lutar contigo': 'Free a friend to fight by your side',
  // ---------------- afixos
  'de Fogo': 'of Fire', 'Queima os inimigos': 'Burns enemies', 'de Gelo': 'of Frost', 'Abranda os inimigos 40%': 'Slows enemies by 40%',
  'do Trovão': 'of Thunder', '25% de relâmpago em cadeia': '25% chain lightning', 'do Vampiro': 'of the Vampire',
  '+4% roubo de vida': '+4% life steal', 'da Fúria': 'of Fury', '+25% dano': '+25% damage', 'da Rapidez': 'of Haste',
  '+20% velocidade de ataque': '+20% attack speed', 'de Espinhos': 'of Thorns', 'Devolve 40% do dano recebido': 'Returns 40% of damage taken',
  'da Muralha': 'of the Wall', '+35% defesa': '+35% defense', 'da Vida': 'of Life', '+30% vida': '+30% health',
  'do Vento': 'of Wind', '+10% velocidade': '+10% speed', 'da Regeneração': 'of Regeneration', '+1.5 vida/s': '+1.5 health/s',
  'do Feiticeiro': 'of the Sorcerer', '+30 mana máxima': '+30 max mana', 'da Sorte': 'of Luck', 'Baús dão itens melhores': 'Chests give better items',
  'do Sábio': 'of the Sage', '+25% XP': '+25% XP', 'Arcano': 'Arcane', '+25% poder mágico': '+25% magic power',
  'da Crueldade': 'of Cruelty', '+10% crítico': '+10% crit', 'da Maldição': 'of the Curse', '-10% velocidade. Que azar.': '-10% speed. Bad luck.',
  // ---------------- melhorias
  'Força Bruta': 'Brute Force', '+15% de dano': '+15% damage', '+15% velocidade de ataque': '+15% attack speed',
  'Vitalidade': 'Vitality', '+30 vida máxima': '+30 max health', 'Pele de Pedra': 'Stone Skin', '+3 defesa': '+3 defense',
  'Olho Certeiro': 'Keen Eye', '+8% chance de crítico': '+8% crit chance', 'Pés Ligeiros': 'Light Feet', '+12% velocidade': '+12% speed',
  'Sanguessuga': 'Leech', '+3% roubo de vida': '+3% life steal', '+1.5 vida por segundo': '+1.5 health per second',
  'Sabedoria': 'Wisdom', '+20% de XP': '+20% XP', 'Trevo da Sorte': 'Lucky Clover', 'Esquiva Veloz': 'Quick Dodge',
  'Dash recarrega 25% mais rápido': 'Dash recharges 25% faster', 'Alquimista': 'Alchemist', '+2 poções e curam +15%': '+2 potions and they heal +15%',
  'Mente Arcana': 'Arcane Mind', '+20% poder mágico': '+20% magic power', 'Poço de Mana': 'Mana Well', '+25 mana máxima': '+25 max mana',
  'Canalizador': 'Channeler', '+2 mana por segundo': '+2 mana per second', 'Remoinho': 'Whirlwind',
  'Cada 4.º ataque atinge tudo à tua volta': 'Every 4th attack hits all around you', 'Lâminas Voadoras': 'Flying Blades',
  'Cada ataque lança uma lâmina (50% dano)': 'Each attack throws a blade (50% damage)', 'Escudo Divino': 'Divine Shield',
  'Bloqueia 1 golpe a cada 10 segundos': 'Blocks 1 hit every 10 seconds', 'Morte Explosiva': 'Explosive Death', 'Inimigos explodem ao morrer': 'Enemies explode on death',
  // ---------------- raças
  'Humano': 'Human', 'Versátil e com sorte.': 'Versatile and lucky.', '+20% XP': '+20% XP', '+1 poção ao começar': '+1 potion at start',
  'Começa com 40 ouro': 'Starts with 40 gold', 'Elfo': 'Elf', 'Rápido e nascido para a magia.': 'Fast and born for magic.',
  '+15% velocidade': '+15% speed', '+30% poder mágico': '+30% magic power', '+20 mana': '+20 mana', '-15 vida': '-15 health',
  'Anão': 'Dwarf', 'Duro como pedra e adora ouro.': 'Tough as stone and loves gold.', '+40 vida': '+40 health', '+4 defesa': '+4 defense',
  '+30% ouro': '+30% gold', '-10% velocidade': '-10% speed', 'Força bruta, pouca paciência para livros.': 'Brute strength, little patience for books.',
  '+20 vida': '+20 health', '-30% poder mágico': '-30% magic power', 'Vive do sangue dos inimigos.': 'Lives on the blood of enemies.',
  '+6% roubo de vida': '+6% life steal', '+1 sorte nos baús': '+1 chest luck', '-20 vida': '-20 health', 'Poções curam -15%': 'Potions heal -15%',
  // ---------------- skins
  'Cavaleiro Azul': 'Blue Knight', 'Carmesim': 'Crimson', 'Floresta': 'Forest', 'Sombra': 'Shadow', 'Real': 'Royal',
  'Dourado': 'Golden', 'Infinito': 'Infinity', 'Dracónica': 'Draconic',
  // ---------------- feitiços
  'Bola de Fogo': 'Fireball', 'Explode e queima os inimigos à volta': 'Explodes and burns nearby enemies',
  'Relâmpago': 'Lightning', 'Atinge o inimigo mais próximo e salta para outros': 'Hits the nearest enemy and jumps to others',
  'Nova de Gelo': 'Frost Nova', 'Fere e congela tudo à tua volta': 'Hurts and freezes everything around you',
  'Cura Divina': 'Divine Heal', 'Recupera muita vida': 'Restores a lot of health',
  // ---------------- dificuldade
  'Fácil': 'Easy', 'Inimigos mais fracos. Bom para aprender.': 'Weaker enemies. Good for learning.',
  'O jogo como foi pensado.': 'The game as intended.', 'Difícil': 'Hard',
  'Inimigos mais fortes e mais elites. Mais XP e ouro.': 'Stronger enemies and more elites. More XP and gold.',
  'Pesadelo': 'Nightmare', 'Só para os corajosos. Muito mais XP e ouro.': 'Only for the brave. Much more XP and gold.',
  // ---------------- zonas
  'Masmorra': 'Dungeon', 'Cemitério': 'Graveyard', 'Cavernas de Lava': 'Lava Caves', 'Abismo Gelado': 'Frozen Abyss', ' (Profundezas)': ' (Depths)',
  // ---------------- maldições
  'Frágil': 'Fragile', '-25% vida máxima': '-25% max health', 'Sangrento': 'Bleeding', 'Perdes 1 vida por segundo': 'Lose 1 health per second',
  'Pesado': 'Heavy', '-15% velocidade': '-15% speed', 'Avareza': 'Greed', '-40% ouro': '-40% gold', 'Vazio': 'Empty',
  '-30 mana máxima': '-30 max mana', 'Vulnerável': 'Vulnerable', 'Recebes +25% de dano': 'You take +25% damage',
  // ---------------- companheiros
  'Lobo': 'Wolf', 'Corre até aos inimigos e morde-os': 'Runs to enemies and bites them', 'Fada': 'Fairy',
  'Cura-te e dispara magia': 'Heals you and shoots magic', 'Mini-Dragão': 'Mini Dragon', 'Cospe bolas de fogo que explodem': 'Spits exploding fireballs',
  // ---------------- almas
  'Coração Forte': 'Strong Heart', '+10 vida máxima': '+10 max health', 'Braço de Ferro': 'Iron Arm', '+5% dano': '+5% damage',
  'Alma Arcana': 'Arcane Soul', '+10 mana máxima': '+10 max mana', 'Herança': 'Inheritance', 'Começa com +25 ouro': 'Start with +25 gold',
  'Bolsa de Poções': 'Potion Pouch', 'Memória Antiga': 'Ancient Memory', '+10% XP': '+10% XP', 'Estrela da Sorte': 'Lucky Star',
  'Aprendiz de Mago': 'Wizard\'s Apprentice', 'Começa a saber Relâmpago': 'Start knowing Lightning', 'Segunda Vida': 'Second Life',
  'Revives 1 vez por partida': 'Revive once per run',
  // ---------------- conquistas
  'Caçador de Reis': 'King Hunter', 'Derrota o Rei Slime': 'Defeat the Slime King', 'Explorador': 'Explorer', 'Aventureiro': 'Adventurer',
  'Tesouro Lendário': 'Legendary Treasure', 'Encontra um item Lendário': 'Find a Legendary item', 'Sorte Divina': 'Divine Luck',
  'Encontra um item Mítico': 'Find a Mythic item', 'Pesadelo Vivo': 'Living Nightmare', 'Mata o Dragão Ancião no Pesadelo': 'Kill the Ancient Dragon on Nightmare',
  'Fim do Demónio': 'End of the Demon', 'Derrota o Rei Demónio': 'Defeat the Demon King', 'Caçador de Mímicos': 'Mimic Hunter',
  'Mata 5 Mímicos (no total)': 'Kill 5 Mimics (in total)', 'Mestre Encantador': 'Master Enchanter', 'Reforça um item até +5': 'Upgrade an item to +5',
  'Arquimago': 'Archmage', 'Aprende os 4 feitiços numa partida': 'Learn all 4 spells in one run', 'Milionário': 'Millionaire',
  'Tem 1000 ouro ao mesmo tempo': 'Have 1000 gold at once', 'Amaldiçoado': 'Cursed', 'Equipa um item amaldiçoado': 'Equip a cursed item',
  'Melhor Amigo': 'Best Friend', 'Sobe o teu companheiro ao nível 5': 'Level your companion to 5', 'Colecionador': 'Collector',
  'Encontra 25 itens diferentes': 'Find 25 different items', 'Chega ao andar ': 'Reach floor ',

  // ---------------- interface
  'Armadura': 'Armor', 'Amuleto': 'Amulet', 'Arma': 'Weapon',
  'Dano: ': 'Damage: ', 'Velocidade: ': 'Speed: ', 'Alcance: ': 'Range: ', 'Crítico: ': 'Crit: ', 'Poder mágico: ': 'Magic power: ',
  'Defesa: ': 'Defense: ', 'Vida: ': 'Health: ', 'Roubo de vida: ': 'Life steal: ', 'Regeneração: ': 'Regeneration: ',
  'Não faz absolutamente nada.': 'Does absolutely nothing.', 'Nv ': 'Lv ', '[Q] Poção': '[Q] Potion', 'Equipado': 'Equipped',
  ' (por aprender)': ' (not learned)', ' (nível ': ' (level ', ' · Recarga ': ' · Cooldown ', 'Encontra um Livro de Feitiço': 'Find a Spellbook',
  '[C] Personagem': '[C] Character', '[I] Mochila': '[I] Bag', '[M] Som: ligado': '[M] Sound: on', '[M] Som: desligado': '[M] Sound: off',
  ' (Enfurecido)': ' (Enraged)', 'Usar: Descer': 'Use: Go down', '[E] Descer': '[E] Go down', 'Derrota o boss para abrir': 'Defeat the boss to open',
  'ANDAR ': 'FLOOR ', ' aplicada': ' applied', 'Todos os itens trazem': 'All items come with', 'uma maldição!': 'a curse!',
  'Usar: Abrir': 'Use: Open', '[E] Abrir': '[E] Open', 'Mercador': 'Merchant', '[E] Ver a loja': '[E] See the shop',
  'O altar já foi usado': 'The altar has been used', '[E] Sacrificar ': '[E] Sacrifice ', ' de vida': ' health',
  'e receber um Baú Dourado': 'and get a Golden Chest', ': Libertar ': ': Free ', 'Mesa de Encantamentos': 'Enchanting Table',
  '[E] Encantar equipamento': '[E] Enchant gear', '[E] Começar o desafio': '[E] Start the challenge',
  '3 ondas de inimigos · prémio: Baú Dourado': '3 waves of enemies · prize: Golden Chest', 'Onda ': 'Wave ',
  'Desafio concluído': 'Challenge complete', 'Maldição: ': 'Curse: ', 'A abrir: ': 'Opening: ',
  'Todos os itens deste baú trazem uma maldição!': 'Every item in this chest comes with a curse!',
  'Probabilidades': 'Odds', '[E] Saltar animação': '[E] Skip animation', 'Que azar... isto é LIXO!': 'Bad luck... this is JUNK!',
  'Épico!': 'Epic!', 'LENDÁRIO!': 'LEGENDARY!', 'MÍTICO!!! O MELHOR DO JOGO!': 'MYTHIC!!! THE BEST IN THE GAME!',
  'EQUIPADO AGORA': 'EQUIPPED NOW', 'Nada equipado': 'Nothing equipped', 'NOVO': 'NEW', '[E] Equipar': '[E] Equip', 'Equipar': 'Equip',
  'Mochila cheia': 'Bag full', 'Vender também dá +': 'Selling also gives +', ' · ao equipar, o item antigo vai para a mochila': ' · when you equip, the old item goes to your bag',
  'Vender +': 'Sell +', 'PERGAMINHO DE PODER': 'SCROLL OF POWER', 'SUBISTE DE NÍVEL!': 'LEVEL UP!', 'Escolhe uma melhoria': 'Choose an upgrade',
  'ÚNICA': 'UNIQUE', 'Carrega 1, 2 ou 3 (ou clica numa carta)': 'Press 1, 2 or 3 (or click a card)',
  '"Tudo tem um preço, aventureiro..."': '"Everything has a price, adventurer..."', 'ESGOTADO': 'SOLD OUT', 'À VENDA': 'FOR SALE',
  '% da vida e 40% da mana': '% health and 40% mana', '% da vida máxima': '% of max health', 'Sair': 'Exit',
  ' ou clique: comprar': ' or click: buy', 'E / Esc: sair': 'E / Esc: exit', 'PERSONAGEM': 'CHARACTER',
  'Poder mágico': 'Magic power', 'Ataques/segundo': 'Attacks/second', 'Roubo de vida': 'Life steal', 'Bónus de XP': 'XP bonus',
  'Sorte nos baús': 'Chest luck', 'Espinhos': 'Thorns', 'Cura das poções': 'Potion healing', 'Recarga do dash': 'Dash cooldown',
  ' (dano x2)': ' (damage x2)', ' dano)': ' damage)', 'Inimigos: ': 'Enemies: ', 'Baús: ': 'Chests: ', 'Tempo: ': 'Time: ',
  'Melhor item:': 'Best item:', 'Melhorias: ainda nenhuma. Sobe de nível!': 'Upgrades: none yet. Level up!', 'Melhorias': 'Upgrades',
  'Segunda Vida pronta': 'Second Life ready', 'C / Esc para voltar': 'C / Esc to go back',
  'Reforça um item (+1 até +5) ou dá-lhe um encantamento novo': 'Upgrade an item (+1 to +5) or give it a new enchantment',
  ': nada equipado': ': nothing equipped', 'Sem encantamento': 'No enchantment', '[E] Reforçar para +': '[E] Upgrade to +',
  'Reforço máximo (+5)': 'Max upgrade (+5)', 'Chance de sucesso: ': 'Success chance: ', 'Se falhar perdes o ouro': 'If it fails you lose the gold',
  '[R] Trocar o encantamento': '[R] Change the enchantment', '[R] Encantar (afixo aleatório)': '[R] Enchant (random affix)',
  'Ex.: de Fogo, do Trovão, de Espinhos, Arcano...': 'E.g.: of Fire, of Thunder, of Thorns, Arcane...',
  'ENCANTADO +': 'ENCHANTED +', 'Purificar (tira a maldição ': 'Purify (removes the curse ',
  '1-3: item  ·  E: reforçar  ·  R: encantar  ·  P: purificar  ·  Esc: sair': '1-3: item  ·  E: upgrade  ·  R: enchant  ·  P: purify  ·  Esc: exit',
  'CRIA A TUA PERSONAGEM': 'CREATE YOUR CHARACTER', '< Voltar': '< Back', 'Todas começam com a Bola de Fogo': 'Everyone starts with Fireball',
  'Conquista': 'Achievement', 'Dificuldade: ': 'Difficulty: ', 'Dificuldade ': 'Difficulty ', 'ENTER: Começar': 'ENTER: Start',
  'W/S: raça   A/D: skin   1-4: dificuldade   Esc: voltar': 'W/S: race   A/D: skin   1-4: difficulty   Esc: back',
  'MASMORRA DO DESTINO': 'DUNGEON OF DESTINY', 'Um RPG de masmorras, bosses e baús da sorte': 'A dungeon RPG of bosses and lucky chests',
  'Como jogar': 'How to play', 'Joystick (esquerda)': 'Joystick (left)', 'Mover': 'Move', 'Botão grande': 'Big button',
  'Atacar o inimigo mais perto': 'Attack the nearest enemy', 'Esquiva': 'Dodge', 'Abrir baús, lojas, escadas...': 'Open chests, shops, stairs...',
  'Beber poção': 'Drink potion', 'Feitiços (usam mana)': 'Spells (use mana)', 'Botões à direita': 'Buttons on the right',
  'Pausa, personagem, mochila': 'Pause, character, bag', 'WASD / Setas': 'WASD / Arrows', 'Clique / Espaço': 'Click / Space',
  'Atacar': 'Attack', 'Dash (esquiva)': 'Dash (dodge)', 'Abrir / Usar / Descer': 'Open / Use / Go down', 'Personagem / Mochila': 'Character / Bag',
  'Cada baú pode dar o PIOR ou o MELHOR item do jogo!': 'Every chest can give the WORST or the BEST item in the game!',
  'Recorde: Andar ': 'Record: Floor ', 'Almas: ': 'Souls: ', 'Coleção: ': 'Collection: ', 'Conquistas: ': 'Achievements: ',
  'ENTER: jogar · N: novo · A: almas · L: coleção · T: conquistas · I: idioma': 'ENTER: play · N: new · A: souls · L: collection · T: achievements · I: language',
  'PAUSA': 'PAUSED', 'Continuar (P)': 'Continue (P)', 'Guardar e sair (G)': 'Save and quit (G)', 'Desistir (X)': 'Give up (X)',
  'As tuas melhorias': 'Your upgrades', 'Ainda não tens melhorias. Sobe de nível!': 'No upgrades yet. Level up!',
  'O jogo guarda sozinho ao entrar em cada andar': 'The game saves automatically on every floor',
  'Desistir desta partida?': 'Give up this run?', 'A partida termina e a gravação é apagada.': 'The run ends and the save is deleted.',
  'O andar a que chegaste conta para o recorde.': 'The floor you reached counts for your record.', 'Sim, desistir (X)': 'Yes, give up (X)',
  'Não (Esc)': 'No (Esc)', 'DESISTISTE': 'YOU GAVE UP', 'MORRESTE': 'YOU DIED', 'Andar alcançado: ': 'Floor reached: ', 'Nível: ': 'Level: ',
  'Inimigos derrotados: ': 'Enemies defeated: ', 'Baús abertos: ': 'Chests opened: ', 'Melhor item encontrado:': 'Best item found:',
  'NOVO RECORDE!': 'NEW RECORD!', ' almas  (tens ': ' souls  (you have ', 'Gasta-as no Altar das Almas, no menu inicial': 'Spend them at the Soul Altar in the main menu',
  'Tentar outra vez': 'Try again', 'ENTER: Outra vez': 'ENTER: Again', 'Esc: Menu': 'Esc: Menu',
  'Roda o telemóvel': 'Rotate your phone', 'O jogo fica muito melhor na horizontal': 'The game is much better in landscape',
  'USAR': 'USE', 'Mochila (': 'Bag (', 'Na mochila (': 'In the bag (', 'NA MOCHILA': 'IN THE BAG', 'Mochila': 'Bag',
  'A mochila está vazia.': 'The bag is empty.', 'Quando abrires um baú, escolhe "Mochila" para guardar o item.': 'When you open a chest, choose "Bag" to keep the item.',
  '1-6: escolher  ·  E: equipar  ·  X: vender  ·  I / Esc: fechar': '1-6: choose  ·  E: equip  ·  X: sell  ·  I / Esc: close', 'Fechar': 'Close',
  'ALTAR DAS ALMAS': 'SOUL ALTAR', 'Tens ': 'You have ', ' almas  ·  Ganhas almas quando morres ou desistes (mais em dificuldades altas)': ' souls  ·  You earn souls when you die or give up (more on higher difficulties)',
  'As melhorias são permanentes e valem para todas as partidas novas': 'Upgrades are permanent and apply to every new run',
  'NÍVEL MÁXIMO': 'MAX LEVEL', 'Comprar: ': 'Buy: ', 'COLEÇÃO DE ITENS': 'ITEM COLLECTION', 'Encontraste ': 'You found ', ' itens': ' items',
  'Ainda não encontraste este item (': 'You haven\'t found this item yet (', 'Abre baús, compra na loja ou vence bosses para o descobrir.': 'Open chests, shop or beat bosses to discover it.',
  'Setas ou rato para ver cada item  ·  Esc: voltar': 'Arrows or mouse to see each item  ·  Esc: back', 'CONQUISTAS': 'ACHIEVEMENTS',
  ' desbloqueadas': ' unlocked', ' foi para a mochila': ' went to your bag', 'Mochila cheia: vendeste ': 'Bag full: you sold ',
  ' — BOSS': ' — BOSS', 'Nova zona: ': 'New zone: ', 'Cuidado... o próximo andar tem um BOSS!': 'Careful... the next floor has a BOSS!',
  'Encontra a escada para descer': 'Find the stairs to go down', 'Levanta-se...': 'Rising...', 'BOSS DERROTADO!': 'BOSS DEFEATED!',
  'Abre os baús e desce a escada': 'Open the chests and take the stairs', 'BLOQUEADO!': 'BLOCKED!', 'SEGUNDA VIDA!': 'SECOND LIFE!',
  'As almas trouxeram-te de volta': 'The souls brought you back', '+1 Poção': '+1 Potion', 'DESAFIO CONCLUÍDO!': 'CHALLENGE COMPLETE!',
  'Ganhaste um Baú Dourado': 'You won a Golden Chest', ' juntou-se a ti!': ' joined you!', 'Precisas de mais vida!': 'You need more health!',
  'ONDA ': 'WAVE ', 'Derrota todos os inimigos': 'Defeat all enemies', 'Poção de Vida': 'Health Potion', 'Cura parte da tua vida': 'Heals part of your health',
  'Cura Completa': 'Full Heal', 'Recupera toda a vida': 'Restores all health', 'Roda a roleta (nunca é Mímico)': 'Spin the wheel (never a Mimic)',
  'Roleta com as melhores chances': 'Wheel with the best odds', ' · equipa logo': ' · equips right away', 'Pergaminho de Poder': 'Scroll of Power',
  'Escolhe 1 de 3 melhorias': 'Choose 1 of 3 upgrades', 'Livro: ': 'Book: ', 'Sobe o feitiço para nível ': 'Raises the spell to level ',
  'Aprende um feitiço novo': 'Learn a new spell', 'Não tens ouro suficiente': 'Not enough gold', 'Já tens a vida cheia': 'Your health is already full',
  'Vida recuperada': 'Health restored', 'Equipaste ': 'You equipped ', ': nível ': ': level ', ' ENFURECEU-SE!': ' IS ENRAGED!', 'Fase 2': 'Phase 2',
  'PRESO NA TEIA!': 'STUCK IN THE WEB!', 'Ainda não sabes este feitiço': 'You don\'t know this spell yet', 'Sem mana!': 'No mana!',
  'Nenhum inimigo à vista': 'No enemy in sight', 'Já dominas ': 'You already mastered ', ' nível ': ' level ', 'Aprendeste: ': 'You learned: ',
  'O feitiço ficou mais forte': 'The spell got stronger', 'Carrega ': 'Press ', ' para lançar': ' to cast', 'Novo feitiço!': 'New spell!',
  'Este item já está no máximo (+5)': 'This item is already maxed (+5)', 'Sucesso! ': 'Success! ', 'O encantamento falhou... perdeste o ouro.': 'The enchantment failed... you lost the gold.',
  'Novo encantamento: ': 'New enchantment: ', 'A maldição foi quebrada!': 'The curse is broken!', 'Vendeste ': 'You sold ', ' por ': ' for ',
  'Continuar': 'Continue', 'Novo jogo': 'New game', 'Começar': 'Start', 'Altar das Almas (': 'Soul Altar (', 'Coleção de itens': 'Item collection',
  'Conquistas': 'Achievements', 'Desbloqueia com a conquista ': 'Unlock with the achievement ', ' para desbloquear esta skin': ' to unlock this skin',
  'É UM MÍMICO!': 'IT\'S A MIMIC!', 'Guardado na mochila': 'Stored in your bag', 'Nova skin desbloqueada: ': 'New skin unlocked: ',
  'Conquista: ': 'Achievement: ', ' subiu para nível ': ' went up to level ', 'Não tens almas suficientes. Joga mais partidas!': 'Not enough souls. Play more runs!',
  'Já está no nível máximo': 'Already at max level', 'Personagem': 'Character', 'Pausa': 'Pause', 'Poção': 'Potion', 'Usar': 'Use',
  'Vida': 'Health', 'Dano': 'Damage', 'Crítico': 'Crit', 'Alcance': 'Range', 'Defesa': 'Defense', 'Velocidade': 'Speed', 'Regeneração': 'Regeneration',
  'Nível ': 'Level ', 'Andar ': 'Floor ', ' ouro': ' gold', ' almas': ' souls', 'Skin ': 'Skin ', 'Menu': 'Menu', 'SUBIU DE NÍVEL!': 'LEVEL UP!',
  'Vampiro': 'Vampire', 'Gelo': 'Ice', 'Fúria': 'Fury', 'Cura ': 'Heals ', 'Sorte +': 'Luck +', ' de ': ' of ',
  'ARMADURA': 'ARMOR', 'ARMA': 'WEAPON', 'AMULETO': 'AMULET',
};

const LISTA_EN = Object.entries(EN).filter(([a, b]) => a !== b).sort((a, b) => b[0].length - a[0].length);
const cacheTraducao = new Map();

function traduzir(txt) {
  if (idioma === 'pt' || txt == null) return txt;
  txt = String(txt);
  let r = cacheTraducao.get(txt);
  if (r !== undefined) return r;
  r = txt;
  for (const [a, b] of LISTA_EN) if (r.includes(a)) r = r.split(a).join(b);
  if (cacheTraducao.size > 4000) cacheTraducao.clear();
  cacheTraducao.set(txt, r);
  return r;
}

function mudarIdioma() {
  idioma = idioma === 'pt' ? 'en' : 'pt';
  try { localStorage.setItem('masmorra_idioma', idioma); } catch (e) { /* sem storage */ }
  document.documentElement.lang = idioma;
  document.title = idioma === 'en' ? 'Dungeon of Destiny' : 'Masmorra do Destino';
}
document.documentElement.lang = idioma;
if (idioma === 'en') document.title = 'Dungeon of Destiny';

// Botão PT | EN (no menu inicial e na pausa)
const BOTAO_IDIOMA = { x: LARGURA - 128, y: 14, w: 112, h: 36 };
