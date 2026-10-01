'use strict';
// =====================================================================
//  COMBINAÇÕES: duas melhorias juntas dão um efeito novo
//  (aparecem nas cartas de subir de nível e no ecrã de personagem)
// =====================================================================

const COMBOS = [
  { id: 'furiaSangue', nome: 'Fúria Sangrenta',       perks: ['forca', 'sangue'],      cor: '#ff3b3b', desc: 'Com menos de metade da vida fazes +30% dano' },
  { id: 'ventania',    nome: 'Ventania',              perks: ['furia', 'pes'],         cor: '#9dff7a', desc: 'A esquiva corta os monstros por onde passas' },
  { id: 'muralha',     nome: 'Muralha Viva',          perks: ['pedra', 'vitalidade'],  cor: '#c0a060', desc: 'Levas -15% dano' },
  { id: 'elixir',      nome: 'Elixir Vivo',           perks: ['pocoes', 'regen'],      cor: '#5dff7a', desc: 'Beber uma poção dá +25% dano durante 6 s' },
  { id: 'tempestade',  nome: 'Tempestade de Lâminas', perks: ['remoinho', 'laminas'],  cor: '#d9a6ff', desc: 'O remoinho lança 8 lâminas à tua volta' },
  { id: 'chuvaOuro',   nome: 'Chuva de Ouro',         perks: ['explosao', 'sorte'],    cor: '#ffd23f', desc: 'Os monstros dão +50% ouro' },
  { id: 'fonte',       nome: 'Fonte Arcana',          perks: ['canal', 'mana'],        cor: '#4dd0ff', desc: 'As magias custam -30% mana' },
  { id: 'bastiao',     nome: 'Bastião',               perks: ['escudo', 'pedra'],      cor: '#fff0a0', desc: 'O Escudo Divino volta em 5 s em vez de 10' },
  { id: 'olhoArcano',  nome: 'Olho Arcano',           perks: ['olho', 'arcano'],       cor: '#b44dff', desc: 'Cada golpe crítico dá-te 2 de mana' },
];
const COMBO = Object.fromEntries(COMBOS.map(c => [c.id, c]));

const comboAtivo = c => !!(J && J.perks && c.perks.every(p => nPerk(p) > 0));
const temCombo = id => comboAtivo(COMBO[id]);
const combosAtivos = () => COMBOS.filter(comboAtivo);
// Combinações que esta melhoria completa (para mostrar na carta)
const combosQueCompleta = p => COMBOS.filter(c => !comboAtivo(c) && c.perks.includes(p.id) && c.perks.every(x => x === p.id || nPerk(x) > 0));

// Depois de escolher uma melhoria: anuncia as combinações novas
function anunciarCombos(antes) {
  for (const c of combosAtivos()) {
    if (antes.includes(c.id)) continue;
    avisar(`COMBINAÇÃO: ${c.nome}!`, c.desc, c.cor);
    texto(J.x, J.y - 50, c.nome + '!', c.cor, 20);
    explosao(J.x, J.y, c.cor, 40, 260, 6);
    fanfarra([659, 784, 988, 1318], 0.05);
  }
}

// Ventania: a esquiva corta os monstros por onde passas (cada um uma vez por esquiva)
function ventaniaNaEsquiva() {
  if (!temCombo('ventania')) return;
  if (!J.dashAtingidos) J.dashAtingidos = [];
  for (const e of inimigos) {
    if (e.morto || e.z > 20 || J.dashAtingidos.includes(e) || Math.hypot(e.x - J.x, e.y - J.y) > e.r + J.r + 14) continue;
    J.dashAtingidos.push(e);
    const { dano, crit } = rolarDano(0.8);
    danoInimigo(e, dano, crit, J.dashVX / 560, J.dashVY / 560, true);
  }
}

// Tempestade de Lâminas: o golpe do remoinho lança 8 lâminas à volta
function tempestadeDeLaminas() {
  if (!temCombo('tempestade')) return;
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    projeteis.push({ x: J.x, y: J.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 7, vida: 0.5,
      cor: '#d9a6ff', tipo: 'lamina', dono: 'jogador', dano: Math.max(1, Math.round(S.dano * 0.6)), perfura: 1, atingidos: [] });
  }
}
