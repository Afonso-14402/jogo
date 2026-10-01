// Robô jogador: joga uma partida inteira como uma pessoa normal (anda pelo
// mapa, luta, bebe poções, abre baús, fica com o equipamento melhor e sobe
// as escadas) e diz até onde chegou. Serve para ver se cada modo e cada
// dificuldade estão "normais": nem fáceis demais, nem impossíveis.
//   node testes/robo_jogador.js                     (modo normal, dificuldade normal)
//   MODO=torre DIF=dificil node testes/robo_jogador.js
//   MODO=normal DIF=facil,normal,dificil CLASSES=espada,fogo ANDARES=40 JOGOS=2 node testes/robo_jogador.js
// MODO: normal | diario | torre | bossrush
const { chromium } = require('playwright');
const path = require('path');

const MODO = process.env.MODO || 'normal';
const DIFS = (process.env.DIF || 'normal').split(',');
const CLASSES = (process.env.CLASSES || 'aventureiro,espada,fogo').split(',');
const ANDARES = Number(process.env.ANDARES || (MODO === 'torre' ? 50 : 40));
const JOGOS = Number(process.env.JOGOS || 1);

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 960, height: 640 } });
  await c.addInitScript(() => { localStorage.clear(); localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true })); localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false })); });
  const p = await c.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForTimeout(500);
  await p.evaluate(() => { meta.dicas = Object.fromEntries(Object.keys(DICAS).map(k => [k, true])); });

  const linhas = [];
  for (const dif of DIFS) for (const classe of (MODO === 'diario' ? ['(do dia)'] : CLASSES)) for (let jogo = 0; jogo < JOGOS; jogo++) {
    const r = await p.evaluate(async ({ MODO, dif, classe, ANDARES, jogo }) => {
      // ---------- começar
      escolhaRaca = 'humano'; escolhaDificuldade = dif; escolhaClasse = classe;
      if (MODO === 'diario') { const d0 = hojeTexto; hojeTexto = () => `robo-${jogo}`; iniciarDiario(); hojeTexto = d0; }
      else { modoProximo = MODO === 'normal' ? null : MODO; novoJogo(); }
      tutorial = null;
      comando.ativo = true; comando.mira = null;
      const dt = 1 / 60;
      let t = 0, tAndar = 0, andarAtual = andar, preso = { x: 0, y: 0, t: 0, fuga: 0, dir: [0, 0] };
      const porAndar = []; let menorAndar = 1, bebidas = 0, pocoes0 = J.pocoes;
      // ---------- caminhos (BFS nos tiles)
      let campoAlvo = null, chaveAlvo = '', campoT = 0;
      function fazerCampo(gx, gy) {
        const W = mapa.W, H = mapa.H, d = new Int32Array(W * H).fill(-1), fila = [gy * W + gx];
        d[gy * W + gx] = 0;
        for (let i = 0; i < fila.length; i++) {
          const k = fila[i], x = k % W, y = (k - x) / W;
          for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + ox, ny = y + oy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || solido(mapa, nx, ny)) continue;
            const nk = ny * W + nx;
            if (d[nk] < 0) { d[nk] = d[k] + 1; fila.push(nk); }
          }
        }
        return d;
      }
      function dirPara(x, y) {
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE), chave = `${tx},${ty}`;
        if (chave !== chaveAlvo || t - campoT > 1) { campoAlvo = fazerCampo(tx, ty); chaveAlvo = chave; campoT = t; }
        if (linhaDeVista(mapa, J.x, J.y, x, y, J.r)) { const dx = x - J.x, dy = y - J.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
        const W = mapa.W, cx = Math.floor(J.x / TILE), cy = Math.floor(J.y / TILE);
        let melhor = null, mv = campoAlvo[cy * W + cx];
        if (mv < 0) mv = 1e9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const nx = cx + ox, ny = cy + oy;
          if (solido(mapa, nx, ny) || (ox && oy && (solido(mapa, cx + ox, cy) || solido(mapa, cx, cy + oy)))) continue;
          const v = campoAlvo[ny * W + nx];
          if (v >= 0 && v < mv) { mv = v; melhor = [nx, ny]; }
        }
        if (!melhor) { const dx = x - J.x, dy = y - J.y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
        const dx = (melhor[0] + 0.5) * TILE - J.x, dy = (melhor[1] + 0.5) * TILE - J.y, l = Math.hypot(dx, dy) || 1;
        return [dx / l, dy / l];
      }
      const distCaminho = (x, y) => { if (!campoAlvo) return 0; return 0; };
      // ---------- o que fazer neste frame
      function decidir() {
        comando.mov = null; comando.atacar = false;
        if (preso.fuga > 0) { preso.fuga -= dt; comando.mov = { x: preso.dir[0], y: preso.dir[1], forca: 1 }; return; }
        let alvo = null, md = 1e9;
        for (const e of inimigos) {
          if (e.morto || e.z > 20 || e.enterrado > 0) continue;
          const d = Math.hypot(e.x - J.x, e.y - J.y);
          const perto = d < 170 || (d < 420 && (e.acordado || e.boss) && linhaDeVista(mapa, J.x, J.y, e.x, e.y, 4));
          if (perto && d < md) { md = d; alvo = e; }
        }
        let destino = null;
        if (alvo) {
          const longe = ['arco', 'cajado'].includes(classeArma(J.arma));
          const quero = longe ? 170 : S.alcance + alvo.r - 4;
          if (md > quero) destino = dirPara(alvo.x, alvo.y);
          else if (longe && md < quero * 0.55) { const dx = J.x - alvo.x, dy = J.y - alvo.y, l = Math.hypot(dx, dy) || 1; destino = [dx / l, dy / l]; }
          comando.atacar = md < quero + 110;
          if (J.hp < S.maxHp * 0.35 && J.pocoes > 0 && !(J.cdPocao > 0)) { premidas.q = true; bebidas++; }
          if (J.hp < S.maxHp * 0.5 && J.cdDash <= 0 && md < 90 && Math.random() < 0.06) premidas.shift = true;
          if (md < 300) {
            const C = classeJ();
            if (C.hab && !(J.cdClasse > 0) && J.mana >= (C.mana || 0)) premidas.f = true;
            habsJ().forEach((h, i) => { if (temHabilidade(h) && !((J.cdHab || {})[h.id] > 0) && J.mana >= h.mana) premidas[String(5 + i)] = true; });
            feiticosJ().forEach((f, i) => { if (J.feiticos[f] && !(J.cdFeitico[f] > 0) && J.mana >= custoMana(f) && (f !== 'cura' || J.hp < S.maxHp * 0.6)) premidas[String(i + 1)] = true; });
          }
        } else {
          if (J.hp < S.maxHp * 0.25 && J.pocoes > 2 && !(J.cdPocao > 0)) { premidas.q = true; bebidas++; }
          // baús perto, depois monstros a dormir, depois a escada
          let bau = null, mb = 1e9;
          if (tAndar < 110) for (const x of baus) { const d = Math.hypot(x.x - J.x, x.y - J.y); if (d < mb) { mb = d; bau = x; } }
          if (bau && mb < 1400) {
            destino = dirPara(bau.x, bau.y);
            if (mb < 40) { premidas.e = true; destino = null; }
          } else {
            let dorme = null, mdz = 1e9;
            if (tAndar < 70) for (const e of inimigos) { if (e.morto || e.z > 20) continue; const d = Math.hypot(e.x - J.x, e.y - J.y); if (d < mdz) { mdz = d; dorme = e; } }
            if (dorme && mdz < 900) destino = dirPara(dorme.x, dorme.y);
            else if (mapa.escada.ativa) {
              destino = dirPara(mapa.escada.x, mapa.escada.y);
              if (Math.hypot(mapa.escada.x - J.x, mapa.escada.y - J.y) < 38) { proximoAndar(); return; }
            } else if (boss && !boss.morto) destino = dirPara(boss.x, boss.y);
          }
        }
        window._ult = { alvo: alvo ? [alvo.tipo, Math.round(alvo.x), Math.round(alvo.y), Math.round(md), alvo.hp, alvo.maxHp, !!alvo.invisivel, alvo.fugir] : null, destino };
        if (destino) {
          comando.mov = { x: destino[0], y: destino[1], forca: 1 };
          // não sai do sítio (ou anda para trás e para a frente) há 3 s: foge para um lado ao calhas
          preso.t += dt;
          if (preso.t > 3) {
            if (Math.hypot(J.x - preso.x, J.y - preso.y) < 40) { const a = Math.random() * Math.PI * 2; preso.dir = [Math.cos(a), Math.sin(a)]; preso.fuga = 0.7; }
            preso.t = 0; preso.x = J.x; preso.y = J.y;
          }
        }
      }
      // ---------- ecrãs que se abrem
      function resolverEcras() {
        if (estado === 'nivel' && escolha) { escolha.t = 1; premidas[String(1 + Math.floor(Math.random() * escolha.opcoes.length))] = true; atualizarEscolha(0); }
        if (estado === 'bau' && roleta) {
          roleta.t = roleta.dur; atualizarRoleta(0); roleta.brilho = 1;
          const it = roleta.premio, velho = J[it.tipo];
          const p0 = poderJogador(); J[it.tipo] = it; S = stats(); const p1 = poderJogador(); J[it.tipo] = velho; S = stats();
          premidas[p1 > p0 * 1.01 ? 'e' : 'x'] = true; atualizarRoleta(0);
        }
        if (['loja', 'encantar', 'mochila', 'personagem', 'mapa', 'cidade', 'pausa', 'confirmar'].includes(estado)) estado = 'jogo';
        for (const k in premidas) delete premidas[k];
      }
      // ---------- jogar
      let fim = null;
      while (!fim) {
        if (estado === 'jogo') {
          decidir(); atualizar(dt); for (const k in premidas) delete premidas[k];
          if (estado === 'jogo' && J.escolhasPendentes > 0) abrirEscolha(); // como o loop do jogo faz
        }
        resolverEcras();
        if (!['jogo', 'nivel', 'bau'].includes(estado)) {
          if (estado === 'morto' || J.hp <= 0) fim = 'morreu';
          else if (estado === 'fim' || J.venceuRush) fim = 'venceu';
          else estado = 'jogo';
        }
        t += dt; tAndar += dt;
        menorAndar = Math.min(menorAndar, Math.max(0, J.hp) / S.maxHp);
        if (andar !== andarAtual) {
          porAndar.push({ a: andarAtual, t: Math.round(tAndar), hp: Math.round(menorAndar * 100) });
          andarAtual = andar; tAndar = 0; menorAndar = J.hp / S.maxHp;
        }
        if (tAndar > 236 && Math.floor(t / dt) % 30 === 0) { const u = window._ult && window._ult.alvo; (window._log = window._log || []).push([Math.round(J.x), Math.round(J.y), Math.round(J.hp), J.cdAtaque.toFixed(2), !!J.golpe, comando.atacar, u && u[4], u && u[3], J.emMenu, J.caido, J.formaBestial > 0]); }
        if (tAndar > 240) fim = 'preso';
        if (andar > ANDARES) fim = 'limite';
        if (Math.floor(t / dt) % 600 === 0) await new Promise(r => setTimeout(r, 0));
      }
      if (fim === 'venceu' && MODO === 'bossrush') fim = 'venceu';
      const morte = fim === 'morreu' ? (J.causa || '?') : '';
      const r = { andar: Math.min(andar, ANDARES), fim, morte, nivel: J.nivel, minutos: +(t / 60).toFixed(1), pocoesUsadas: bebidas, raz: +(poderJogador() / Math.max(1, poderRecomendado(andar))).toFixed(2), classe: J.classe,
        diag: fim === 'preso' ? JSON.stringify({ J: [Math.round(J.x), Math.round(J.y)], esc: mapa.escada, boss: boss && !boss.morto ? [boss.tipo, Math.round(boss.x), Math.round(boss.y)] : null, vivos: inimigos.filter(e => !e.morto).map(e => [e.tipo, Math.round(e.x), Math.round(e.y), e.z, e.enterrado]).slice(0, 5), baus: baus.map(x => [Math.round(x.x), Math.round(x.y)]), estado, ev: mapa.evento, ult: window._ult, sombras: sombras.length, dentro: colideCirculo(mapa, J.x, J.y, J.r), dentro1: colideCirculo(mapa, J.x, J.y, 1), tiles: [-1, 0, 1].map(oy => [-1, 0, 1].map(ox => mapa.tiles[(Math.floor(J.y / TILE) + oy) * mapa.W + Math.floor(J.x / TILE) + ox]).join('')).join('/'), r: J.r, sala: (mapa.salas.find(q => J.x / TILE >= q.x && J.x / TILE < q.x + q.w && J.y / TILE >= q.y && J.y / TILE < q.y + q.h) || {}).tipo, perto: objetos.filter(o => Math.hypot(o.x - J.x, o.y - J.y) < 120).map(o => o.tipo), log: (window._log || []).slice(0, 2) }) : '',
        duros: porAndar.filter(x => x.hp < 30).map(x => `${x.a}(${x.hp}%)`).join(' ') };
      window._log = []; estado = 'titulo'; comando.ativo = false; comando.mov = null; comando.atacar = false;
      return r;
    }, { MODO, dif, classe, ANDARES, jogo });
    const l = `${MODO.padEnd(8)} ${dif.padEnd(8)} ${r.classe.padEnd(11)} andar ${String(r.andar).padStart(3)}  ${r.fim.padEnd(7)} nv ${String(r.nivel).padStart(2)}  ${String(r.minutos).padStart(5)} min  poder ${r.raz}  ${r.morte ? 'morto por ' + r.morte : ''}${r.duros ? '  | apertos: ' + r.duros : ''}${r.diag ? '\n   ' + r.diag : ''}`;
    console.log(l); linhas.push(l);
  }
  console.log(erros.length ? 'ERROS: ' + [...new Set(erros)].slice(0, 5).join(' | ') : 'sem erros de JavaScript');
  await b.close();
})();
