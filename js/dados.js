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
  { tipo: 'arma', r: 'comum', nome: 'Espada Curta', dano: 7, vel: 1.1, alcance: 44, crit: 0.05, desc: 'Fiável.' },
  { tipo: 'arma', r: 'comum', nome: 'Machadinha', dano: 9, vel: 0.9, alcance: 42, crit: 0.05, desc: 'Para lenha e monstros.' },

  { tipo: 'arma', r: 'raro', nome: 'Espada Longa', dano: 12, vel: 1.0, alcance: 54, crit: 0.06, desc: 'Aço de qualidade.' },
  { tipo: 'arma', r: 'raro', nome: 'Lança de Ferro', dano: 11, vel: 1.0, alcance: 68, crit: 0.05, desc: 'Mantém-nos à distância.' },
  { tipo: 'arma', r: 'raro', nome: 'Martelo de Guerra', dano: 17, vel: 0.7, alcance: 50, crit: 0.08, desc: 'Lento mas esmagador.' },

  { tipo: 'arma', r: 'epico', nome: 'Lâmina Sombria', dano: 19, vel: 1.25, alcance: 52, crit: 0.18, desc: 'Sussurra no escuro.' },
  { tipo: 'arma', r: 'epico', nome: 'Machado Rúnico', dano: 25, vel: 0.85, alcance: 56, crit: 0.10, desc: 'As runas brilham ao golpear.' },

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
  { tipo: 'armadura', r: 'raro', nome: 'Manto do Mago', def: 3, hp: 45, desc: 'Tecido encantado.' },

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

  { tipo: 'amuleto', r: 'lendario', nome: 'Coração da Fénix', regen: 4, danoPct: 0.2, desc: 'Renasce das cinzas.' },

  { tipo: 'amuleto', r: 'mitico', nome: 'Olho de Deus', crit: 0.2, velMov: 0.25, roubo: 0.08, regen: 5, danoPct: 0.45, desc: 'Vê tudo. Pode tudo.' },
];

// Inimigos normais. Os stats escalam com o andar.
const INIMIGOS = {
  slime:     { nome: 'Slime',     hp: 22, dano: 6,  vel: 70,  r: 12, xp: 6,  cor: '#5fd35f', minAndar: 1, peso: 5 },
  morcego:   { nome: 'Morcego',   hp: 14, dano: 5,  vel: 135, r: 10, xp: 7,  cor: '#8a64c0', minAndar: 1, peso: 4 },
  esqueleto: { nome: 'Esqueleto', hp: 28, dano: 8,  vel: 80,  r: 13, xp: 12, cor: '#e8e2cf', minAndar: 2, peso: 3 },
  orc:       { nome: 'Orc',       hp: 60, dano: 13, vel: 75,  r: 14, xp: 20, cor: '#6b8e23', minAndar: 3, peso: 3 },
  fantasma:  { nome: 'Fantasma',  hp: 38, dano: 10, vel: 85,  r: 13, xp: 16, cor: '#bfe6ff', minAndar: 5, peso: 2 },
  aranha:    { nome: 'Aranha',    hp: 16, dano: 7,  vel: 150, r: 9,  xp: 5,  cor: '#7a3f96', minAndar: 21, peso: 3 },
  mimico:    { nome: 'Mímico',    hp: 70, dano: 14, vel: 150, r: 14, xp: 35, cor: '#8b5a2b', minAndar: 999, peso: 0 },
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
  ],
  amuleto: [
    { id: 'sorte',     nome: 'da Sorte',      desc: 'Baús dão itens melhores', sorte: 1, cor: '#3ddc84' },
    { id: 'sabio',     nome: 'do Sábio',      desc: '+25% XP', xp: 0.25, cor: '#7ec8ff' },
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
  // Únicas (aparecem menos vezes)
  { id: 'remoinho',   nome: 'Remoinho',         desc: 'Cada 4.º ataque atinge tudo à tua volta', max: 1, cor: '#ffae00', letra: 'O', unica: true },
  { id: 'laminas',    nome: 'Lâminas Voadoras', desc: 'Cada ataque lança uma lâmina (50% dano)', max: 1, cor: '#b44dff', letra: '>', unica: true },
  { id: 'escudo',     nome: 'Escudo Divino',    desc: 'Bloqueia 1 golpe a cada 10 segundos',     max: 1, cor: '#fff0a0', letra: 'U', unica: true },
  { id: 'explosao',   nome: 'Morte Explosiva',  desc: 'Inimigos explodem ao morrer',             max: 1, cor: '#ff7b25', letra: '*', unica: true },
];
