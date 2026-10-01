'use strict';
// =====================================================================
//  POLIMENTO: o que torna o jogo melhor de jogar
//  - Golpes com peso (micro-pausa ao acertar, faíscas, som de cada arma)
//  - Herói mais vivo (rasto da esquiva, dor, poção, estocada)
//  - Mira automática melhor e joystick analógico (telemóvel)
//  - Comparar o item novo com o equipado
//  - Monstros mais espertos (fogem feridos, cercam-te, não ficam presos)
//  - Luz mais rápida (manchas de luz desenhadas uma vez e reutilizadas)
// =====================================================================

// ---------------------------------------------------------------------
//  Golpes com peso
// ---------------------------------------------------------------------
let impacto = 0; // micro-pausa (segundos reais) quando acertas com força
function pausaImpacto(s) { impacto = Math.max(impacto, s); }

// Cada tipo de arma soa diferente
const SONS_ARMA = {
  espada: [520, 'square', -260], adaga: [900, 'triangle', -500], machado: [220, 'sawtooth', -120], martelo: [120, 'square', -60],
  lanca: [640, 'triangle', -320], foice: [380, 'sawtooth', -200], cajado: [760, 'sine', -300], arco: [980, 'triangle', -600],
};
function somGolpe(classe, crit, forte) {
  const [f, tipo, sl] = SONS_ARMA[classe] || SONS_ARMA.espada;
  som(f * (crit ? 1.25 : 1), crit ? 0.1 : 0.06, tipo, crit ? 0.045 : 0.03, sl);
  if (typeof ruido === 'function') ruido(forte ? 0.12 : 0.05, forte ? 0.05 : 0.025, crit ? 3000 : 1800);
}

function faiscas(x, y, dx, dy, cor, n = 6) {
  if (particulas.length > 650) return;
  const a0 = Math.atan2(dy, dx);
  for (let k = 0; k < n; k++) {
    const a = a0 + rand(-0.7, 0.7), v = rand(160, 340);
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rand(0.12, 0.25), cor: k % 2 ? '#ffffff' : cor, tam: rand(2, 4) });
  }
}

// Chamado pelo danoInimigo quando o golpe é teu
function sentirGolpe(e, dano, crit, dx, dy) {
  const classe = classeArma(J.arma);
  somGolpe(classe, crit, dano > e.maxHp * 0.25);
  faiscas(e.x, e.y, dx || (e.x - J.x), dy || (e.y - J.y), crit ? '#ffe14d' : RARIDADES[J.arma.r].cor, crit ? 10 : 5);
  pausaImpacto(e.hp <= 0 ? 0.06 : crit ? 0.05 : 0.025);
  if (crit) tremor = Math.max(tremor, 4);
}

// ---------------------------------------------------------------------
//  Herói mais vivo
// ---------------------------------------------------------------------
let rastos = []; // imagens da esquiva
function atualizarHeroiVivo(dt) {
  if (J.dashT > 0 && Math.random() < 0.9) {
    const c = framesHeroi(J.raca, J.skin)[0];
    rastos.push({ c, x: J.x, y: J.y - 4, flip: J.dirX < -0.1, t: 0.22 });
  }
  for (const r of rastos) r.t -= dt;
  rastos = rastos.filter(r => r.t > 0);
  if (J.dorT > 0) J.dorT -= dt;
  if (J.bebeuT > 0) J.bebeuT -= dt;
}
function desenharRastos() {
  for (const r of rastos) {
    ctx.globalAlpha = r.t / 0.22 * 0.5;
    spr(silhueta(r.c, '#78aaff'), r.x, r.y, r.flip);
  }
  ctx.globalAlpha = 1;
}
// Deslocamento e escala do herói (estocada, dor, respiração)
function poseHeroi(t) {
  let ox = 0, oy = 0, sx = 1, sy = 1;
  if (J.golpe) {
    const p = 1 - J.golpe.t / J.golpe.dur, f = Math.sin(p * Math.PI) * 3;
    ox = Math.cos(J.golpe.ang) * f; oy = Math.sin(J.golpe.ang) * f;
  }
  if (J.dorT > 0) { sx = 1.15; sy = 0.87; }
  else if (!J.andando) { const b = Math.sin(t * 3); sy = 1 + b * 0.03; sx = 1 - b * 0.015; }
  return { ox, oy, sx, sy };
}

// ---------------------------------------------------------------------
//  Mira automática melhor: prefere o monstro à tua frente e à vista
// ---------------------------------------------------------------------
function alvoMelhor(raio) {
  let alvo = null, melhor = Infinity;
  for (const e of inimigos) {
    if (e.morto || e.z > 20) continue;
    const dx = e.x - J.x, dy = e.y - J.y, d = Math.hypot(dx, dy);
    if (d > raio) continue;
    const frente = (dx * J.dirX + dy * J.dirY) / (d || 1);
    let custo = d - frente * 50 - (e.boss ? 40 : 0) - (e.hp < e.maxHp * 0.3 ? 20 : 0);
    if (!linhaDeVista(mapa, J.x, J.y, e.x, e.y, 3)) custo += 250;
    if (custo < melhor) { melhor = custo; alvo = e; }
  }
  return alvo;
}

// Joystick analógico: perto do centro andas devagar, e a direção é suavizada
function lerJoystick() {
  const j = toque.joy;
  if (!j) { J.joySuave = null; return comando.mov; } // sem dedo no ecrã: o stick do comando (ou nada)
  const jx = j.x - j.cx, jy = j.y - j.cy, d = Math.hypot(jx, jy);
  if (d < 8) return null;
  const alvo = [jx / d, jy / d];
  const s = J.joySuave || alvo;
  const k = 0.45; // suavização
  let nx = s[0] + (alvo[0] - s[0]) * k, ny = s[1] + (alvo[1] - s[1]) * k;
  const l = Math.hypot(nx, ny) || 1;
  nx /= l; ny /= l;
  J.joySuave = [nx, ny];
  return { x: nx, y: ny, forca: clamp((d - 8) / (RAIO_JOYSTICK * 0.55), 0.4, 1) };
}

// ---------------------------------------------------------------------
//  Comparar itens (setas verdes e vermelhas)
// ---------------------------------------------------------------------
const cacheComparar = new Map();
function compararItens(novo, atual) {
  if (novo === atual) return [];
  atual = atual || {}; // sem nada equipado nesse sítio
  const chave = idioma + '|' + novo.nome + '|' + (atual.nome || '-') + '|' + J.nivel + '|' + (novo.enc || 0) + '|' + (atual.enc || 0);
  if (cacheComparar.has(chave)) return cacheComparar.get(chave);
  const campos = novo.tipo === 'arma' ? [['dano', 'Dano', 1], ['vel', 'Velocidade', 0.01], ['crit', 'Crítico', 0.01, true]]
    : novo.tipo === 'armadura' ? [['def', 'Defesa', 1], ['hp', 'Vida', 1]]
    : [['crit', 'Crítico', 0.01, true], ['danoPct', 'Dano', 0.01, true], ['velMov', 'Velocidade', 0.01, true], ['regen', 'Regeneração', 0.1], ['roubo', 'Roubo de vida', 0.01, true], ['magia', 'Poder mágico', 0.01, true]];
  const l = [];
  for (const [k, nome, min, pct] of campos) {
    const dif = (novo[k] || 0) - (atual[k] || 0);
    if (Math.abs(dif) < min) continue;
    const v = pct ? `${Math.round(dif * 100)}%` : k === 'vel' ? dif.toFixed(2) : `${Math.round(dif * 10) / 10}`;
    l.push({ txt: `${traduzir(nome)} ${dif > 0 ? '+' : ''}${v} ${dif > 0 ? '▲' : '▼'}`, cor: dif > 0 ? '#5dff7a' : '#ff6060' });
  }
  // o que conta mesmo: o poder de combate com um e com o outro
  const guarda = J[novo.tipo], S0 = S;
  const p0 = poderJogador();
  J[novo.tipo] = novo; S = stats();
  const p1 = poderJogador();
  J[novo.tipo] = guarda; S = S0;
  const d = p1 - p0;
  l.unshift({ txt: `${traduzir('Poder')} ${d >= 0 ? '+' : ''}${d} ${d > 0 ? '▲' : d < 0 ? '▼' : '='}`, cor: d > 0 ? '#5dff7a' : d < 0 ? '#ff6060' : '#aaa', grande: true });
  if (cacheComparar.size > 200) cacheComparar.clear();
  cacheComparar.set(chave, l);
  return l;
}

// ---------------------------------------------------------------------
//  Monstros mais espertos
// ---------------------------------------------------------------------
const MONSTROS_COBARDES = ['goblin', 'morcego', 'diabrete', 'esqueleto', 'arqueiroCeleste', 'magoVazio', 'querubim', 'aranha', 'sapo', 'salamandra'];
// Ajusta a velocidade que o monstro escolheu (vx, vy). Devolve a nova.
function iaEsperta(e, dt, d, ux, uy, vx, vy) {
  if (e.boss || e.mini) return [vx, vy];
  e.flanco ??= (Math.random() < 0.5 ? -1 : 1) * rand(0.3, 0.6);
  // feridos: alguns fogem durante um bocado
  if (e.hp < e.maxHp * 0.25 && !e.jaFugiu && MONSTROS_COBARDES.includes(e.tipo)) {
    e.jaFugiu = true; e.fugaT = 2.2;
    texto(e.x, e.y - e.r - 10, '!', '#ffe14d', 16);
  }
  if (e.fugaT > 0) { e.fugaT -= dt; return [-ux * e.vel * 0.9, -uy * e.vel * 0.9]; }
  // cercam-te: aproximam-se um pouco de lado, cada um para o seu
  const vel = Math.hypot(vx, vy);
  if (vel > 1 && d > 55 && d < 260) { vx += -uy * vel * e.flanco; vy += ux * vel * e.flanco; }
  // não ficam presos: se não saírem do sítio, dão um passo de lado
  e.chkT = (e.chkT || 0) - dt;
  if (e.chkT <= 0) {
    if (vel > 1 && e.chkX != null && Math.hypot(e.x - e.chkX, e.y - e.chkY) < 4 && d > 50) e.desvioT = 0.6, e.desvioS = Math.random() < 0.5 ? -1 : 1;
    e.chkT = 0.8; e.chkX = e.x; e.chkY = e.y;
  }
  if (e.desvioT > 0) { e.desvioT -= dt; return [-uy * e.vel * e.desvioS, ux * e.vel * e.desvioS]; }
  return [vx, vy];
}

// ---------------------------------------------------------------------
//  Luz mais rápida: uma mancha de luz feita uma vez e reutilizada
// ---------------------------------------------------------------------
const cacheLuzes = {};
function manchaLuz(rgb) {
  const k = rgb || 'preto';
  if (!cacheLuzes[k]) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    const cor = rgb || '0,0,0';
    if (rgb) { gr.addColorStop(0, `rgba(${cor},1)`); gr.addColorStop(1, `rgba(${cor},0)`); }
    else { gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    cacheLuzes[k] = c;
  }
  return cacheLuzes[k];
}
