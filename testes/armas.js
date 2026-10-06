'use strict';
// Campo de treino das armas: cada arma ataca bonecos parados (1 perto, 8 à volta,
// 4 em linha e 1 longe) e mede-se o dano por segundo. Avisa se alguma arma dá
// muito mais (ou muito menos) dano do que as outras da mesma raridade.
// Uso: node testes/armas.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 960, height: 640 } });
  await c.addInitScript(() => { localStorage.clear(); localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true })); localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false })); });
  const p = await c.newPage(); const erros = []; p.on('pageerror', e => erros.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    meta.dicas = Object.fromEntries(Object.keys(DICAS).map(k => [k, true]));
    escolhaClasse = 'aventureiro'; escolhaRaca = 'humano'; novoJogo(); tutorial = null; falas = [];
    andar = 9; proximoAndar(); falas = [];
    const sala = mapa.salas.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0];
    const cx = (sala.x + sala.w / 2) * TILE, cy = (sala.y + sala.h / 2) * TILE;
    const armas = ITENS.filter(i => i.tipo === 'arma');
    const out = [];
    const cenario = (nome, pos, seg) => {
      inimigos = []; projeteis = []; perigos = []; objetos = []; armadilhas = []; baus = []; drops = [];
      for (const [x, y] of pos) { const e = criarInimigo('slime', cx + x, cy + y); e.hp = e.maxHp = 1e9; e.dano = 0; e.vel = 0; e.fx = cx + x; e.fy = cy + y; e.acordado = true; inimigos.push(e); }
      J.x = cx; J.y = cy; J.cdAtaque = 0; let tot = 0, golpes = 0, atingidos = new Set();
      for (let f = 0; f < seg * 60; f++) {
        J.hp = S.maxHp; J.invuln = 99; J.mana = S.maxMana;
        let alvo = null, md = 1e9; for (const e of inimigos) { const d = Math.hypot(e.x - J.x, e.y - J.y); if (d < md) { md = d; alvo = e; } }
        const antes = inimigos.map(e => e.hp);
        if (J.cdAtaque <= 0) golpes++;
        atacar(alvo.x - J.x, alvo.y - J.y);
        atualizar(1 / 60);
        if (estado !== 'jogo') { estado = 'jogo'; escolha = null; J.escolhasPendentes = 0; }
        inimigos.forEach((e, i) => { const d = antes[i] - e.hp; if (d > 0) { tot += d; atingidos.add(i); } e.hp = 1e9; e.x = e.fx; e.y = e.fy; e.kbx = e.kby = 0; e.morto = false; });
        J.x = cx; J.y = cy;
      }
      return { dps: Math.round(tot / seg), atingidos: atingidos.size, golpes };
    };
    for (const m of armas) {
      const it = criarItem(m, 10, true); J.arma = it; S = stats();
      const anel = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4) * 60, Math.sin(k * Math.PI / 4) * 60]);
      const linha = [[50, 0], [80, 0], [110, 0], [140, 0]];
      out.push({ nome: m.nome, r: m.r, classe: classeArma(it), dano: S.dano, cd: +S.cdAtaque.toFixed(2), alc: Math.round(S.alcance),
        solo: cenario('solo', [[45, 0]], 15), anel: cenario('anel', anel, 6), linha: cenario('linha', linha, 6), longe: cenario('longe', [[240, 0]], 6) });
    }
    return out;
  });
  const ord = ['lixo', 'comum', 'raro', 'epico', 'lendario', 'mitico'];
  r.sort((a, b) => ord.indexOf(a.r) - ord.indexOf(b.r) || a.solo.dps - b.solo.dps);
  for (const x of r) console.log(`${x.r.padEnd(8)} ${x.classe.padEnd(7)} ${x.nome.padEnd(26)} solo ${String(x.solo.dps).padStart(5)} · 8 à volta ${String(x.anel.dps).padStart(5)} (${x.anel.atingidos}/8) · linha ${String(x.linha.dps).padStart(5)} (${x.linha.atingidos}/4) · longe ${String(x.longe.dps).padStart(5)}`);
  // a Espada de Treino é a arma do início: pode ser mais fraca
  const problemas = [];
  for (const k of ord.slice(1)) {
    const g = r.filter(x => x.r === k && !/Treino/.test(x.nome)), v = g.map(x => x.solo.dps).sort((a, b) => a - b), med = v[Math.floor(v.length / 2)];
    for (const x of g) if (x.solo.dps > med * 1.5 || x.solo.dps < med * 0.6) problemas.push(`${x.nome} (${k}): ${(x.solo.dps / med).toFixed(2)}x a mediana`);
  }
  console.log(problemas.length ? 'DESEQUILIBRADAS:\n  ' + problemas.join('\n  ') : 'todas as armas equilibradas');
  console.log(erros.length ? 'ERROS: ' + erros.slice(0, 5).join(' | ') : 'sem erros de JavaScript');
  await b.close();
  process.exit(problemas.length || erros.length ? 1 : 0);

})();
