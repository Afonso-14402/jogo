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
  orc:       { nome: 'Orc',       hp: 60, dano: 13, vel: 75,  r: 16, xp: 20, cor: '#6b8e23', minAndar: 3, peso: 3 },
  fantasma:  { nome: 'Fantasma',  hp: 38, dano: 10, vel: 85,  r: 13, xp: 16, cor: '#bfe6ff', minAndar: 5, peso: 2 },
  mimico:    { nome: 'Mímico',    hp: 70, dano: 14, vel: 150, r: 16, xp: 35, cor: '#8b5a2b', minAndar: 999, peso: 0 },
};

// Um boss a cada 5 andares (5, 10, 15, depois repete mais forte).
const BOSSES = [
  { id: 'reiSlime', nome: 'Rei Slime',       hp: 420, dano: 16, vel: 60, r: 42, xp: 150, cor: '#3fbf3f' },
  { id: 'lich',     nome: 'Lich Necromante', hp: 380, dano: 14, vel: 90, r: 24, xp: 220, cor: '#6a3fb5' },
  { id: 'dragao',   nome: 'Dragão Ancião',   hp: 600, dano: 20, vel: 70, r: 46, xp: 320, cor: '#c0392b' },
];
