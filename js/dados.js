'use strict';
// =====================================================================
//  DADOS DO JOGO: raridades, baús, itens, inimigos e bosses
//  (edita aqui para balancear o jogo)
// =====================================================================

const TILE = 32;
const LARGURA = 960;
const ALTURA = 640;

const RARIDADES = {
  lixo:     { nome: 'Lixo',     cor: '#8d8d8d', ordem: 0, xpReciclar: 2 },
  comum:    { nome: 'Comum',    cor: '#e8e8e8', ordem: 1, xpReciclar: 5 },
  raro:     { nome: 'Raro',     cor: '#3d9bff', ordem: 2, xpReciclar: 12 },
  epico:    { nome: 'Épico',    cor: '#b44dff', ordem: 3, xpReciclar: 25 },
  lendario: { nome: 'Lendário', cor: '#ffae00', ordem: 4, xpReciclar: 50 },
  mitico:   { nome: 'Mítico',   cor: '#ff3355', ordem: 5, xpReciclar: 100 },
};
const ORDEM_RARIDADES = ['lixo', 'comum', 'raro', 'epico', 'lendario', 'mitico'];

// Probabilidades (%) de cada raridade por tipo de baú. Devem somar 100.
const TIPOS_BAU = {
  madeira: {
    nome: 'Baú de Madeira', corpo: '#8b5a2b', aro: '#c9a15a',
    mimico: 0.08, // 8% de ser um Mímico!
    chances: { lixo: 30, comum: 32, raro: 22, epico: 11, lendario: 4, mitico: 1 },
  },
  maldito: {
    nome: 'Baú Amaldiçoado', corpo: '#4a2a60', aro: '#d9a6ff',
    mimico: 0, maldito: true, // todos os itens vêm com uma maldição
    chances: { lixo: 0, comum: 4, raro: 24, epico: 36, lendario: 28, mitico: 8 },
  },
  ouro: {
    nome: 'Baú Dourado', corpo: '#d9a400', aro: '#fff0a0',
    mimico: 0,
    chances: { lixo: 4, comum: 14, raro: 30, epico: 30, lendario: 17, mitico: 5 },
  },
};

// tipo: arma | armadura | amuleto
// Armas: dano, vel (multiplicador de velocidade de ataque), alcance (px), crit (chance)
// Armaduras: def, hp
// Amuletos: crit, velMov, roubo (roubo de vida), regen (hp/s), danoPct
// Itens "Lixo" não escalam com o andar — são sempre péssimos.
const ITENS = [
  // ----------------------------- ARMAS -----------------------------
  { tipo: 'arma', r: 'comum', nome: 'Espada de Treino', dano: 4, vel: 1.0, alcance: 40, crit: 0.03, inicial: true, desc: 'Madeira pintada de cinzento.' },

  { tipo: 'arma', r: 'lixo', nome: 'Colher Enferrujada', dano: 1, vel: 0.8, alcance: 28, crit: 0, desc: 'Oficialmente o PIOR item do jogo.' },
  { tipo: 'arma', r: 'lixo', nome: 'Galho Podre', dano: 2, vel: 0.9, alcance: 38, crit: 0, desc: 'Parte-se só de olhar para ele.' },
  { tipo: 'arma', r: 'lixo', nome: 'Peixe Morto', dano: 3, vel: 1.0, alcance: 34, crit: 0.02, desc: 'Cheira muito mal.' },

  { tipo: 'arma', r: 'comum', nome: 'Adaga', dano: 5, vel: 1.4, alcance: 36, crit: 0.08, desc: 'Rápida e leve.' },
  { tipo: 'arma', r: 'comum', nome: 'Cajado de Aprendiz', dano: 5, vel: 1.0, alcance: 42, crit: 0.03, magia: 0.2, desc: 'Cheira a livros velhos.' },
  { tipo: 'arma', r: 'comum', nome: 'Espada Curta', dano: 7, vel: 1.1, alcance: 44, crit: 0.05, desc: 'Fiável.' },
  { tipo: 'arma', r: 'comum', nome: 'Machadinha', dano: 9, vel: 0.9, alcance: 42, crit: 0.05, desc: 'Para lenha e monstros.' },

  { tipo: 'arma', r: 'raro', nome: 'Espada Longa', dano: 12, vel: 1.0, alcance: 54, crit: 0.06, desc: 'Aço de qualidade.' },
  { tipo: 'arma', r: 'raro', nome: 'Lança de Ferro', dano: 11, vel: 1.0, alcance: 68, crit: 0.05, desc: 'Mantém-nos à distância.' },
  { tipo: 'arma', r: 'raro', nome: 'Martelo de Guerra', dano: 17, vel: 0.7, alcance: 50, crit: 0.08, desc: 'Lento mas esmagador.' },

  { tipo: 'arma', r: 'epico', nome: 'Cajado Arcano', dano: 13, vel: 1.0, alcance: 50, crit: 0.06, magia: 0.5, desc: 'Zumbe com energia.' },
  { tipo: 'arma', r: 'epico', nome: 'Lâmina Sombria', dano: 19, vel: 1.25, alcance: 52, crit: 0.18, desc: 'Sussurra no escuro.' },
  { tipo: 'arma', r: 'epico', nome: 'Machado Rúnico', dano: 25, vel: 0.85, alcance: 56, crit: 0.10, desc: 'As runas brilham ao golpear.' },

  { tipo: 'arma', r: 'lendario', nome: 'Cetro do Arquimago', dano: 20, vel: 1.05, alcance: 56, crit: 0.1, magia: 0.9, desc: 'Os feitiços obedecem-lhe.' },
  { tipo: 'arma', r: 'lendario', nome: 'Excalibur', dano: 32, vel: 1.15, alcance: 62, crit: 0.15, desc: 'Arrancada da pedra.' },
  { tipo: 'arma', r: 'lendario', nome: 'Foice do Ceifador', dano: 29, vel: 1.0, alcance: 76, crit: 0.25, desc: 'Colhe almas.' },

  { tipo: 'arma', r: 'mitico', nome: 'Espada do Infinito', dano: 70, vel: 1.6, alcance: 84, crit: 0.35, desc: 'O MELHOR item do jogo. Corta a própria realidade.' },

  // --------------------------- ARMADURAS ---------------------------
  { tipo: 'armadura', r: 'lixo', nome: 'Saco de Batatas', def: 0, hp: 0, desc: 'Pelo menos tapa.' },
  { tipo: 'armadura', r: 'lixo', nome: 'Cueca Furada', def: 0, hp: -10, desc: 'Deixa-te MAIS fraco. Parabéns.' },
  { tipo: 'armadura', r: 'lixo', nome: 'Balde na Cabeça', def: 1, hp: 0, desc: 'Não se vê nada.' },

  { tipo: 'armadura', r: 'comum', nome: 'Túnica de Couro', def: 2, hp: 10, desc: 'Básica.' },
  { tipo: 'armadura', r: 'comum', nome: 'Cota de Malha', def: 3, hp: 15, desc: 'Faz barulho a andar.' },

  { tipo: 'armadura', r: 'raro', nome: 'Armadura de Ferro', def: 5, hp: 25, desc: 'Sólida.' },
  { tipo: 'armadura', r: 'raro', nome: 'Manto do Mago', def: 3, hp: 45, mana: 30, desc: 'Tecido encantado.' },

  { tipo: 'armadura', r: 'epico', nome: 'Escamas de Dragão', def: 8, hp: 45, desc: 'Quente ao toque.' },

  { tipo: 'armadura', r: 'lendario', nome: 'Manto Celestial', def: 12, hp: 80, desc: 'Tecido pelas estrelas.' },

  { tipo: 'armadura', r: 'mitico', nome: 'Armadura do Deus Antigo', def: 22, hp: 180, desc: 'Nada te consegue tocar.' },

  // ---------------------------- AMULETOS ---------------------------
  { tipo: 'amuleto', r: 'lixo', nome: 'Anel de Plástico', desc: 'Saiu num ovo de chocolate.' },
  { tipo: 'amuleto', r: 'lixo', nome: 'Pedra Qualquer', velMov: -0.08, desc: 'É só pesada.' },

  { tipo: 'amuleto', r: 'comum', nome: 'Anel de Cobre', crit: 0.05, desc: 'Um pouco de sorte.' },
  { tipo: 'amuleto', r: 'comum', nome: 'Pena Leve', velMov: 0.10, desc: 'Andas mais depressa.' },

  { tipo: 'amuleto', r: 'raro', nome: 'Amuleto do Vampiro', roubo: 0.05, desc: 'Cura-te ao causar dano.' },
  { tipo: 'amuleto', r: 'raro', nome: 'Anel da Força', danoPct: 0.15, desc: 'Mais dano.' },

  { tipo: 'amuleto', r: 'epico', nome: 'Anel do Vento', velMov: 0.22, crit: 0.06, desc: 'Leve como o ar.' },
  { tipo: 'amuleto', r: 'epico', nome: 'Talismã Vital', regen: 2, desc: 'Regenera vida.' },
  { tipo: 'amuleto', r: 'raro', nome: 'Amuleto de Safira', magia: 0.25, mana: 20, desc: 'Guarda energia mágica.' },

  { tipo: 'amuleto', r: 'lendario', nome: 'Coração da Fénix', regen: 4, danoPct: 0.2, desc: 'Renasce das cinzas.' },

  { tipo: 'amuleto', r: 'mitico', nome: 'Olho de Deus', crit: 0.2, velMov: 0.25, roubo: 0.08, regen: 5, danoPct: 0.45, desc: 'Vê tudo. Pode tudo.' },
];

// Inimigos normais. Os stats escalam com o andar.
const INIMIGOS = {
  // zonas: em que zonas aparece (0 Masmorra, 1 Cemitério, 2 Cavernas de Lava, 3 Abismo Gelado).
  // Depois do andar 20 aparecem todos misturados.
  slime:     { nome: 'Slime',     hp: 22, dano: 6,  vel: 70,  r: 12, xp: 6,  cor: '#5fd35f', minAndar: 1, peso: 5, zonas: [0] },
  morcego:   { nome: 'Morcego',   hp: 14, dano: 5,  vel: 135, r: 10, xp: 7,  cor: '#8a64c0', minAndar: 1, peso: 4, zonas: [0, 1, 2] },
  esqueleto: { nome: 'Esqueleto', hp: 28, dano: 8,  vel: 80,  r: 13, xp: 12, cor: '#e8e2cf', minAndar: 2, peso: 3, zonas: [0, 1, 3] },
  orc:       { nome: 'Orc',       hp: 60, dano: 13, vel: 75,  r: 14, xp: 20, cor: '#6b8e23', minAndar: 3, peso: 3, zonas: [0, 2] },
  fantasma:  { nome: 'Fantasma',  hp: 38, dano: 10, vel: 85,  r: 13, xp: 16, cor: '#bfe6ff', minAndar: 5, peso: 2, zonas: [1, 3] },
  zumbi:     { nome: 'Zumbi',     hp: 50, dano: 11, vel: 48,  r: 13, xp: 13, cor: '#7fa65a', minAndar: 1, peso: 5, zonas: [1] },
  diabrete:  { nome: 'Diabrete',  hp: 26, dano: 9,  vel: 120, r: 11, xp: 14, cor: '#e0403a', minAndar: 1, peso: 4, zonas: [2] },
  slimeLava: { nome: 'Slime de Lava', hp: 30, dano: 9, vel: 75, r: 12, xp: 12, cor: '#ff7b25', minAndar: 1, peso: 4, zonas: [2] },
  loboGelo:  { nome: 'Lobo de Gelo', hp: 34, dano: 10, vel: 165, r: 12, xp: 15, cor: '#cfeaff', minAndar: 1, peso: 4, zonas: [3] },
  elementalGelo: { nome: 'Elemental de Gelo', hp: 30, dano: 9, vel: 70, r: 12, xp: 16, cor: '#9fdcff', minAndar: 1, peso: 3, zonas: [3] },
  aranha:    { nome: 'Aranha',    hp: 16, dano: 7,  vel: 150, r: 9,  xp: 5,  cor: '#7a3f96', minAndar: 21, peso: 3, zonas: [] },
  mimico:    { nome: 'Mímico',    hp: 70, dano: 14, vel: 150, r: 14, xp: 35, cor: '#8b5a2b', minAndar: 999, peso: 0, zonas: [] },
};

// Um boss a cada 5 andares (5, 10, 15, 20, 25, 30, depois repete mais forte).
const BOSSES = [
  { id: 'reiSlime', nome: 'Rei Slime',       hp: 420, dano: 16, vel: 60, r: 42, xp: 150, cor: '#3fbf3f' },
  { id: 'lich',     nome: 'Lich Necromante', hp: 380, dano: 14, vel: 90, r: 24, xp: 220, cor: '#6a3fb5' },
  { id: 'dragao',   nome: 'Dragão Ancião',   hp: 600, dano: 20, vel: 70, r: 46, xp: 320, cor: '#c0392b' },
  { id: 'golem',    nome: 'Golem de Pedra',  hp: 900, dano: 24, vel: 45, r: 46, xp: 420, cor: '#8a8176' },
  { id: 'rainha',   nome: 'Rainha Aranha',   hp: 700, dano: 18, vel: 120, r: 32, xp: 520, cor: '#5b2a6e' },
  { id: 'demonio',  nome: 'Rei Demónio',     hp: 1000, dano: 24, vel: 95, r: 34, xp: 650, cor: '#b3122e' },
];

// Inimigos de elite: mais fortes, com um modificador, e largam mais ouro e às vezes um baú
const ELITES = {
  veloz:     { nome: 'Veloz',     cor: '#9dff7a', desc: '+50% velocidade' },
  blindado:  { nome: 'Blindado',  cor: '#b8b8d0', desc: 'Recebe metade do dano' },
  explosivo: { nome: 'Explosivo', cor: '#ff7b25', desc: 'Explode ao morrer' },
  vampirico: { nome: 'Vampírico', cor: '#ff4d6d', desc: 'Cura-se ao acertar-te' },
};

// Salas especiais que podem aparecer em cada andar
const SALAS_ESPECIAIS = {
  loja:    { nome: 'Loja do Mercador',    desc: 'Gasta o teu ouro',                         cor: '#3ddc84' },
  tesouro: { nome: 'Sala do Tesouro',     desc: 'Guardada por um inimigo de elite',         cor: '#ffd23f' },
  altar:   { nome: 'Altar de Sacrifício', desc: 'Troca vida por um Baú Dourado',            cor: '#ff3b3b' },
  desafio: { nome: 'Sala de Desafio',     desc: 'Sobrevive a 3 ondas e ganha um Baú Dourado', cor: '#b44dff' },
  encantamento: { nome: 'Sala de Encantamentos', desc: 'Reforça e encanta o teu equipamento', cor: '#9b5cff' },
  companheiro: { nome: 'Sala do Companheiro', desc: 'Liberta um amigo para lutar contigo', cor: '#ff9ff3' },
};

// Ouro que recebes ao vender um item (multiplicado pelo andar)
const PRECO_VENDA = { lixo: 1, comum: 3, raro: 8, epico: 20, lendario: 45, mitico: 100 };
// Preço base dos itens à venda na loja
const PRECO_ITEM_LOJA = { raro: 70, epico: 140, lendario: 280, mitico: 600 };

// ---------------------------------------------------------------------
//  AFIXOS: atributos aleatórios que um item pode trazer ("Espada Longa de Fogo")
//  multDano/multVel/multDef/multHp alteram os stats do item ao ser criado;
//  o resto soma-se aos stats do jogador enquanto o item estiver equipado.
// ---------------------------------------------------------------------
const AFIXOS = {
  arma: [
    { id: 'fogo',    nome: 'de Fogo',     desc: 'Queima os inimigos', cor: '#ff7b25' },
    { id: 'gelo',    nome: 'de Gelo',     desc: 'Abranda os inimigos 40%', cor: '#7fd8ff' },
    { id: 'trovao',  nome: 'do Trovão',   desc: '25% de relâmpago em cadeia', cor: '#ffe14d' },
    { id: 'vampiro', nome: 'do Vampiro',  desc: '+4% roubo de vida', roubo: 0.04, cor: '#ff4d6d' },
    { id: 'furia',   nome: 'da Fúria',    desc: '+25% dano', multDano: 1.25, cor: '#ff5c5c' },
    { id: 'rapidez', nome: 'da Rapidez',  desc: '+20% velocidade de ataque', multVel: 1.2, cor: '#9dff7a' },
  ],
  armadura: [
    { id: 'espinhos', nome: 'de Espinhos',     desc: 'Devolve 40% do dano recebido', espinhos: 0.4, cor: '#c9a15a' },
    { id: 'muralha',  nome: 'da Muralha',      desc: '+35% defesa', multDef: 1.35, cor: '#a0a0b8' },
    { id: 'vida',     nome: 'da Vida',         desc: '+30% vida', multHp: 1.3, cor: '#ff4d6d' },
    { id: 'vento',    nome: 'do Vento',        desc: '+10% velocidade', velMov: 0.1, cor: '#9dff7a' },
    { id: 'regen',    nome: 'da Regeneração',  desc: '+1.5 vida/s', regen: 1.5, cor: '#5dff7a' },
    { id: 'feiticeiro', nome: 'do Feiticeiro', desc: '+30 mana máxima', manaMax: 30, cor: '#9b5cff' },
  ],
  amuleto: [
    { id: 'sorte',     nome: 'da Sorte',      desc: 'Baús dão itens melhores', sorte: 1, cor: '#3ddc84' },
    { id: 'sabio',     nome: 'do Sábio',      desc: '+25% XP', xp: 0.25, cor: '#7ec8ff' },
    { id: 'arcano',    nome: 'Arcano',        desc: '+25% poder mágico', magia: 0.25, cor: '#b44dff' },
    { id: 'crueldade', nome: 'da Crueldade',  desc: '+10% crítico', crit: 0.1, cor: '#ffe14d' },
  ],
};
const AFIXO_MALDICAO = { id: 'maldicao', nome: 'da Maldição', desc: '-10% velocidade. Que azar.', velMov: -0.1, cor: '#8d8d8d' };
// Probabilidade de um item trazer afixo, por raridade (no Lixo é sempre a Maldição)
const CHANCE_AFIXO = { lixo: 0.25, comum: 0.2, raro: 0.45, epico: 0.7, lendario: 1, mitico: 1 };
// Cada ponto de Sorte multiplica o peso de cada raridade por isto
const EFEITO_SORTE = { lixo: 0.65, comum: 0.85, raro: 1, epico: 1.2, lendario: 1.4, mitico: 1.6 };

// ---------------------------------------------------------------------
//  MELHORIAS: ao subir de nível escolhes 1 de 3
// ---------------------------------------------------------------------
const PERKS = [
  { id: 'forca',      nome: 'Força Bruta',      desc: '+15% de dano',                     max: 5, cor: '#ff5c5c', letra: 'F' },
  { id: 'furia',      nome: 'Fúria',            desc: '+15% velocidade de ataque',        max: 5, cor: '#ff9f43', letra: 'A' },
  { id: 'vitalidade', nome: 'Vitalidade',       desc: '+30 vida máxima',                  max: 5, cor: '#ff4d6d', letra: 'V' },
  { id: 'pedra',      nome: 'Pele de Pedra',    desc: '+3 defesa',                        max: 5, cor: '#a0a0b8', letra: 'D' },
  { id: 'olho',       nome: 'Olho Certeiro',    desc: '+8% chance de crítico',            max: 5, cor: '#ffe14d', letra: 'C' },
  { id: 'pes',        nome: 'Pés Ligeiros',     desc: '+12% velocidade',                  max: 3, cor: '#9dff7a', letra: 'P' },
  { id: 'sangue',     nome: 'Sanguessuga',      desc: '+3% roubo de vida',                max: 3, cor: '#d63a5a', letra: 'S' },
  { id: 'regen',      nome: 'Regeneração',      desc: '+1.5 vida por segundo',            max: 3, cor: '#5dff7a', letra: 'R' },
  { id: 'iman',       nome: 'Sabedoria',        desc: '+20% de XP',                       max: 3, cor: '#7ec8ff', letra: 'X' },
  { id: 'sorte',      nome: 'Trevo da Sorte',   desc: 'Baús dão itens melhores',          max: 3, cor: '#3ddc84', letra: 'T' },
  { id: 'esquiva',    nome: 'Esquiva Veloz',    desc: 'Dash recarrega 25% mais rápido',   max: 2, cor: '#78aaff', letra: 'E' },
  { id: 'pocoes',     nome: 'Alquimista',       desc: '+2 poções e curam +15%',           max: 2, cor: '#ff3d6b', letra: 'Q' },
  { id: 'arcano',     nome: 'Mente Arcana',     desc: '+20% poder mágico',                max: 5, cor: '#b44dff', letra: 'M' },
  { id: 'mana',       nome: 'Poço de Mana',     desc: '+25 mana máxima',                  max: 3, cor: '#6a7bff', letra: 'N' },
  { id: 'canal',      nome: 'Canalizador',      desc: '+2 mana por segundo',              max: 3, cor: '#4dd0ff', letra: 'K' },
  // Únicas (aparecem menos vezes)
  { id: 'remoinho',   nome: 'Remoinho',         desc: 'Cada 4.º ataque atinge tudo à tua volta', max: 1, cor: '#ffae00', letra: 'O', unica: true },
  { id: 'laminas',    nome: 'Lâminas Voadoras', desc: 'Cada ataque lança uma lâmina (50% dano)', max: 1, cor: '#b44dff', letra: '>', unica: true },
  { id: 'escudo',     nome: 'Escudo Divino',    desc: 'Bloqueia 1 golpe a cada 10 segundos',     max: 1, cor: '#fff0a0', letra: 'U', unica: true },
  { id: 'explosao',   nome: 'Morte Explosiva',  desc: 'Inimigos explodem ao morrer',             max: 1, cor: '#ff7b25', letra: '*', unica: true },
];

// ---------------------------------------------------------------------
//  RAÇAS: escolhes uma ao criar a personagem. Muda os bónus e o aspeto.
//  Valores: hp/def/mana (somam), dano/velMov/velAtaque/crit/roubo/xp/magia/ouro/cura (percentagens),
//  sorte (pontos), pocoes/ouroInicial (ao começar)
// ---------------------------------------------------------------------
const RACAS = {
  humano:  { nome: 'Humano',  cor: '#f1c8a0', desc: 'Versátil e com sorte.',
             bonus: ['+20% XP', '+1 poção ao começar', 'Começa com 40 ouro'], contra: [],
             xp: 0.2, pocoes: 1, ouroInicial: 40 },
  elfo:    { nome: 'Elfo',    cor: '#9dff7a', desc: 'Rápido e nascido para a magia.',
             bonus: ['+15% velocidade', '+30% poder mágico', '+20 mana'], contra: ['-15 vida'],
             velMov: 0.15, magia: 0.3, mana: 20, hp: -15 },
  anao:    { nome: 'Anão',    cor: '#ff9f43', desc: 'Duro como pedra e adora ouro.',
             bonus: ['+40 vida', '+4 defesa', '+30% ouro'], contra: ['-10% velocidade'],
             hp: 40, def: 4, ouro: 0.3, velMov: -0.1 },
  orc:     { nome: 'Orc',     cor: '#8fb33a', desc: 'Força bruta, pouca paciência para livros.',
             bonus: ['+25% dano', '+20 vida'], contra: ['-30% poder mágico'],
             dano: 0.25, hp: 20, magia: -0.3 },
  vampiro: { nome: 'Vampiro', cor: '#ff4d6d', desc: 'Vive do sangue dos inimigos.',
             bonus: ['+6% roubo de vida', '+10% crítico', '+1 sorte nos baús'], contra: ['-20 vida', 'Poções curam -15%'],
             roubo: 0.06, crit: 0.1, sorte: 1, hp: -20, cura: -0.15 },
};
const ORDEM_RACAS = ['humano', 'elfo', 'anao', 'orc', 'vampiro'];

// ---------------------------------------------------------------------
//  SKINS: cores da armadura do herói. 'recorde' = andar que tens de alcançar para desbloquear.
//  Letras: s/m/d capacete, b/B/l túnica, r pluma, w olhos, y fivela, p calças
// ---------------------------------------------------------------------
const SKINS = {
  azul:     { nome: 'Cavaleiro Azul', pal: {} },
  carmesim: { nome: 'Carmesim',       pal: { b: '#c0392b', B: '#8a2219', l: '#ff6b5b', r: '#ffd23f' } },
  floresta: { nome: 'Floresta',       pal: { b: '#2f8f5b', B: '#1f6040', l: '#4fc07f', s: '#d8c9a3', m: '#a89060', d: '#6b5a3a', r: '#8b5a2b' } },
  sombra:   { nome: 'Sombra',         pal: { b: '#3a2a4a', B: '#221830', l: '#5a4470', s: '#5b6480', m: '#3e4458', d: '#262a38', r: '#b44dff', w: '#b44dff' } },
  real:     { nome: 'Real',           pal: { b: '#6a3fb5', B: '#4a2a80', l: '#9a6fe0', s: '#ffe38a', m: '#d9a400', d: '#8a6a00', r: '#ffffff' } },
  gelo:     { nome: 'Gelo',           pal: { b: '#7fd8ff', B: '#3a9ac0', l: '#d0f4ff', s: '#ffffff', m: '#bfe6ff', d: '#7aa8c8', r: '#3d9bff' } },
  dourado:  { nome: 'Dourado',        pal: { s: '#fff0a0', m: '#ffd23f', d: '#b88a00', b: '#e0b000', B: '#a07800', l: '#fff6c8', r: '#ff3355', p: '#8a6a30' }, recorde: 10 },
  infinito: { nome: 'Infinito',       pal: { s: '#2a2030', m: '#1a1422', d: '#0e0a14', b: '#ff3355', B: '#a01830', l: '#ff8095', r: '#ff3355', w: '#ff3355' }, recorde: 20 },
  celestial: { nome: 'Celestial',     pal: { s: '#ffffff', m: '#d0f4ff', d: '#8ab8d0', b: '#f5f0ff', B: '#c8bff0', l: '#ffffff', r: '#ffd23f', y: '#4dffea', w: '#4dffea' }, conquista: 'mitico' },
  draconica: { nome: 'Dracónica',     pal: { s: '#c0392b', m: '#8a2219', d: '#5a1410', b: '#e8c080', B: '#c8a060', l: '#f5d8a0', r: '#ffd23f', w: '#ffe14d' }, conquista: 'pesadelo' },
  infernal:  { nome: 'Infernal',      pal: { s: '#3a2a2a', m: '#241818', d: '#140c0c', b: '#ff7b25', B: '#b03a10', l: '#ffe14d', r: '#ff3b3b', w: '#ff7b25' }, conquista: 'demonio' },
};
const ORDEM_SKINS = ['azul', 'carmesim', 'floresta', 'sombra', 'real', 'gelo', 'dourado', 'infinito', 'celestial', 'draconica', 'infernal'];

// ---------------------------------------------------------------------
//  FEITIÇOS (teclas 1-4). Aprendem-se e sobem de nível (máx. 3) com Livros de Feitiço.
//  O dano usa o "poder mágico" da personagem.
// ---------------------------------------------------------------------
const FEITICOS = {
  fogo:  { nome: 'Bola de Fogo',  mana: 18, cd: 1.0, cor: '#ff7b25', desc: 'Explode e queima os inimigos à volta' },
  raio:  { nome: 'Relâmpago',     mana: 24, cd: 2.2, cor: '#ffe14d', desc: 'Atinge o inimigo mais próximo e salta para outros' },
  gelo:  { nome: 'Nova de Gelo',  mana: 30, cd: 5,   cor: '#7fd8ff', desc: 'Fere e congela tudo à tua volta' },
  cura:  { nome: 'Cura Divina',   mana: 35, cd: 8,   cor: '#5dff7a', desc: 'Recupera muita vida' },
};
const ORDEM_FEITICOS = ['fogo', 'raio', 'gelo', 'cura'];

// ---------------------------------------------------------------------
//  DIFICULDADE: escolhe-se ao criar a personagem.
//  hp/dano multiplicam os inimigos (e bosses e armadilhas); xp/ouro o que ganhas;
//  elite multiplica a chance de aparecer um inimigo de elite; pocoes = poções extra ao começar
// ---------------------------------------------------------------------
const DIFICULDADES = {
  facil:    { nome: 'Fácil',    cor: '#5dff7a', desc: 'Inimigos mais fracos. Bom para aprender.',             hp: 0.65, dano: 0.6,  xp: 1,   ouro: 1,    elite: 0.5, pocoes: 2, almas: 0.5 },
  normal:   { nome: 'Normal',   cor: '#ffe14d', desc: 'O jogo como foi pensado.',                             hp: 1,    dano: 1,    xp: 1,   ouro: 1,    elite: 1,   pocoes: 0, almas: 1 },
  dificil:  { nome: 'Difícil',  cor: '#ff9f43', desc: 'Inimigos mais fortes e mais elites. Mais XP e ouro.',  hp: 1.4,  dano: 1.35, xp: 1.2, ouro: 1.25, elite: 1.5, pocoes: 0, almas: 1.5 },
  pesadelo: { nome: 'Pesadelo', cor: '#ff3355', desc: 'Só para os corajosos. Muito mais XP e ouro.',          hp: 2,    dano: 1.8,  xp: 1.4, ouro: 1.5,  elite: 2.2, pocoes: -1, almas: 2 },
};
const ORDEM_DIFICULDADES = ['facil', 'normal', 'dificil', 'pesadelo'];

// ---------------------------------------------------------------------
//  ZONAS: cada 5 andares mudam as cores e os inimigos
// ---------------------------------------------------------------------
const NOMES_ZONAS = ['Masmorra', 'Cemitério', 'Cavernas de Lava', 'Abismo Gelado'];

// ---------------------------------------------------------------------
//  MALDIÇÕES: os itens dos Baús Amaldiçoados são fortes mas trazem uma destas.
//  Podes purificá-las na Mesa de Encantamentos.
// ---------------------------------------------------------------------
const MALDICOES = [
  { id: 'fragil',     nome: 'Frágil',     desc: '-25% vida máxima',          vidaPct: -0.25 },
  { id: 'sangue',     nome: 'Sangrento',  desc: 'Perdes 1 vida por segundo', regen: -1 },
  { id: 'pesado',     nome: 'Pesado',     desc: '-15% velocidade',           velMov: -0.15 },
  { id: 'avareza',    nome: 'Avareza',    desc: '-40% ouro',                 ouroPct: -0.4 },
  { id: 'vazio',      nome: 'Vazio',      desc: '-30 mana máxima',           manaMax: -30 },
  { id: 'vulneravel', nome: 'Vulnerável', desc: 'Recebes +25% de dano',      danoRecebido: 0.25 },
];

// ---------------------------------------------------------------------
//  COMPANHEIROS: liberta um na Sala do Companheiro. Sobem de nível contigo.
// ---------------------------------------------------------------------
const PETS = {
  lobo:   { nome: 'Lobo',        desc: 'Corre até aos inimigos e morde-os', cor: '#b8c0d0' },
  fada:   { nome: 'Fada',        desc: 'Cura-te e dispara magia',           cor: '#ff9ff3' },
  dragao: { nome: 'Mini-Dragão', desc: 'Cospe bolas de fogo que explodem',  cor: '#ff7b25' },
};
const ORDEM_PETS = ['lobo', 'fada', 'dragao'];

// ---------------------------------------------------------------------
//  ALTAR DAS ALMAS: melhorias permanentes compradas com as almas que ganhas
//  ao morrer ou desistir. custo[i] = preço para passar ao nível i+1.
// ---------------------------------------------------------------------
const MELHORIAS_ALMA = [
  { id: 'vida',    nome: 'Coração Forte',    desc: '+10 vida máxima',          max: 5, custo: [15, 25, 40, 60, 90], cor: '#ff4d6d', letra: 'V' },
  { id: 'dano',    nome: 'Braço de Ferro',   desc: '+5% dano',                 max: 5, custo: [15, 25, 40, 60, 90], cor: '#ff9f43', letra: 'F' },
  { id: 'mana',    nome: 'Alma Arcana',      desc: '+10 mana máxima',          max: 3, custo: [20, 35, 55],         cor: '#9b5cff', letra: 'M' },
  { id: 'ouro',    nome: 'Herança',          desc: 'Começa com +25 ouro',      max: 4, custo: [10, 20, 35, 50],     cor: '#ffd23f', letra: 'O' },
  { id: 'pocao',   nome: 'Bolsa de Poções',  desc: '+1 poção ao começar',      max: 2, custo: [25, 50],             cor: '#ff3d6b', letra: 'P' },
  { id: 'xp',      nome: 'Memória Antiga',   desc: '+10% XP',                  max: 3, custo: [20, 40, 70],         cor: '#7ec8ff', letra: 'X' },
  { id: 'sorte',   nome: 'Estrela da Sorte', desc: '+1 sorte nos baús',        max: 2, custo: [60, 120],            cor: '#3ddc84', letra: 'S' },
  { id: 'feitico', nome: 'Aprendiz de Mago', desc: 'Começa a saber Relâmpago', max: 1, custo: [80],                 cor: '#ffe14d', letra: 'R' },
  { id: 'reviver', nome: 'Segunda Vida',     desc: 'Revives 1 vez por partida', max: 1, custo: [200],               cor: '#fff0a0', letra: '+' },
];

// ---------------------------------------------------------------------
//  CONQUISTAS: recompensa em almas ou uma skin nova
// ---------------------------------------------------------------------
const CONQUISTAS = [
  { id: 'rei',       nome: 'Caçador de Reis',    desc: 'Derrota o Rei Slime',                   almas: 20 },
  { id: 'andar10',   nome: 'Explorador',         desc: 'Chega ao andar 10',                     almas: 25 },
  { id: 'andar20',   nome: 'Aventureiro',        desc: 'Chega ao andar 20',                     almas: 50 },
  { id: 'lendario',  nome: 'Tesouro Lendário',   desc: 'Encontra um item Lendário',             almas: 15 },
  { id: 'mitico',    nome: 'Sorte Divina',       desc: 'Encontra um item Mítico',               skin: 'celestial' },
  { id: 'pesadelo',  nome: 'Pesadelo Vivo',      desc: 'Mata o Dragão Ancião no Pesadelo',      skin: 'draconica' },
  { id: 'demonio',   nome: 'Fim do Demónio',     desc: 'Derrota o Rei Demónio',                 skin: 'infernal' },
  { id: 'mimicos',   nome: 'Caçador de Mímicos', desc: 'Mata 5 Mímicos (no total)',             almas: 20 },
  { id: 'encantar5', nome: 'Mestre Encantador',  desc: 'Reforça um item até +5',                almas: 30 },
  { id: 'arquimago', nome: 'Arquimago',          desc: 'Aprende os 4 feitiços numa partida',    almas: 25 },
  { id: 'rico',      nome: 'Milionário',         desc: 'Tem 1000 ouro ao mesmo tempo',          almas: 20 },
  { id: 'maldito',   nome: 'Amaldiçoado',        desc: 'Equipa um item amaldiçoado',            almas: 10 },
  { id: 'amigo',     nome: 'Melhor Amigo',       desc: 'Sobe o teu companheiro ao nível 5',     almas: 20 },
  { id: 'colecao',   nome: 'Colecionador',       desc: 'Encontra 25 itens diferentes',          almas: 40 },
];
