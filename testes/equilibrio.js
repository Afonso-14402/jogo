// Bot de equilíbrio: cada caçador luta sozinho numa arena cheia de monstros,
// com o nível e o equipamento típicos do andar, e o bot joga por ele
// (anda, ataca, usa magias, habilidades e poções). Mostra quanto tempo
// demora a limpar a arena e quanta vida perde.
//   node testes/equilibrio.js            (andares 10, 25 e 45; 3 lutas cada)
//   node testes/equilibrio.js 30 5       (só o andar 30, 5 lutas)
//   node testes/equilibrio.js 5,10,20 2  (vários andares)
const { chromium } = require('playwright');
const path = require('path');

const ANDARES = process.argv[2] ? process.argv[2].split(',').map(Number) : [10, 25, 45];
// CLASSES=espada,fogo node testes/equilibrio.js 10,20  (só alguns caçadores)
const SO_CLASSES = process.env.CLASSES ? process.env.CLASSES.split(',') : null;
const LUTAS = Number(process.argv[3] || 3);

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 960, height: 640 } });
  await c.addInitScript(() => { localStorage.clear(); localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true })); localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false })); });
  const p = await c.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForTimeout(500);

  const resultados = {};
  for (const a of ANDARES) {
    for (const classe of SO_CLASSES || await p.evaluate(() => ORDEM_CLASSES)) {
      const r = await p.evaluate(({ a, classe, lutas }) => {
        // prepara um herói típico do andar (como o poder recomendado)
        function preparar() {
          escolhaClasse = classe; escolhaRaca = 'humano'; escolhaDificuldade = 'normal';
          novoJogo(); tutorial = null;
          andar = a;
          const L = Math.round(a * 0.9) + 1;
          J.nivel = L; J.hpBase += 10 * (L - 1); J.atkBase += 2 * (L - 1); J.defBase += (L - 1);
          J.atributos = { for: L - 1, vit: L - 1 };
          J.escolhasPendentes = 0; J.pacto = {};
          J.evoluido = L >= 30;
          const rr = a < 6 ? 'comum' : a < 16 ? 'raro' : a < 36 ? 'epico' : 'lendario';
          const tipoArma = classeArma(J.arma);
          for (const tipo of ['arma', 'armadura', 'amuleto']) {
            let l = ITENS.filter(i => i.tipo === tipo && i.r === rr && !i.inicial);
            if (tipo === 'arma' && l.some(i => classeArma(i) === tipoArma)) l = l.filter(i => classeArma(i) === tipoArma);
            J[tipo] = criarItem(l[Math.floor(Math.random() * l.length)], a, true);
          }
          for (const f of feiticosJ()) J.feiticos[f] = Math.min(3, 1 + Math.floor(a / 15));
          if (classe === 'sombras') J.sombras = Array.from({ length: Math.min(6, 2 + Math.floor(L / 8)) }, () => ({ tipo: 'esqueleto' }));
          S = stats(); J.hp = S.maxHp; J.mana = S.maxMana; J.pocoes = 3;
          // arena com monstros acordados
          mapa = gerarArenaBoss(); mapa.eBoss = false; mapa.escada.ativa = false;
          mapaImg = renderizarMapa(mapa, andar);
          inimigos = []; projeteis = []; baus = []; drops = []; perigos = []; objetos = []; armadilhas = []; ondas = []; raios = [];
          reiniciarBioma(); reiniciarCampo(); boss = null;
          J.fatorAdapt = { hp: 1, dano: 1 };
          J.x = mapa.inicio.x; J.y = mapa.inicio.y;
          levantarExercito();
          const pesos = pesosInimigos();
          for (let k = 0; k < 14; k++) {
            const q = pontoLivreNaSala(mapa, mapa.salas[0], 18);
            const e = criarInimigo(escolherPeso(pesos), q.x, q.y);
            aplicarNivel(e, sortearNivel());
            e.acordado = true;
            inimigos.push(e);
          }
          estado = 'jogo';
        }
        // o bot: decide as teclas deste frame
        const preso = { x: 0, y: 0, t: 0, lado: 0 };
        function bot(dt) {
          for (const k of ['w', 'a', 's', 'd']) teclas[k] = false;
          let alvo = null, md = 1e9;
          for (const e of inimigos) { if (e.morto) continue; const d = Math.hypot(e.x - J.x, e.y - J.y); if (d < md) { md = d; alvo = e; } }
          toque.atacar = false;
          if (!alvo) return;
          const distancia = ['arco', 'cajado'].includes(classeArma(J.arma)) ? 180 : S.alcance + alvo.r;
          const dx = alvo.x - J.x, dy = alvo.y - J.y;
          const sinal = md > distancia ? 1 : md < distancia * 0.6 ? -1 : 0;
          if (preso.lado > 0) { // encravado num pilar: contorna-o durante um bocado
            preso.lado -= dt;
            teclas[Math.abs(dx) > Math.abs(dy) ? (preso.dir ? 's' : 'w') : (preso.dir ? 'd' : 'a')] = true;
          } else if (sinal) {
            if (Math.abs(dx) > 8) teclas[(dx > 0) === (sinal > 0) ? 'd' : 'a'] = true;
            if (Math.abs(dy) > 8) teclas[(dy > 0) === (sinal > 0) ? 's' : 'w'] = true;
            if (Math.hypot(J.x - preso.x, J.y - preso.y) < 2) preso.t += dt; else { preso.t = 0; preso.x = J.x; preso.y = J.y; }
            if (preso.t > 0.5) { preso.lado = 0.6; preso.dir = Math.random() < 0.5; preso.t = 0; }
          }
          J.dirX = dx / md; J.dirY = dy / md;
          if (md < distancia + 90) toque.atacar = true;
          if (J.hp < S.maxHp * 0.35 && J.pocoes > 0) premidas.q = true;
          if (J.hp < S.maxHp * 0.4 && J.cdDash <= 0 && Math.random() < 0.05) premidas.shift = true;
          if (md > 280) return;
          const CL = classeJ();
          if (CL.hab && !(J.cdClasse > 0) && J.mana >= CL.mana) premidas.f = true;
          habsJ().forEach((h, i) => { if (temHabilidade(h) && !((J.cdHab || {})[h.id] > 0) && J.mana >= h.mana) premidas[String(5 + i)] = true; });
          feiticosJ().forEach((f, i) => { if (J.feiticos[f] && !(J.cdFeitico[f] > 0) && J.mana >= custoMana(f) && (f !== 'cura' || J.hp < S.maxHp * 0.6)) premidas[String(i + 1)] = true; });
        }
        const out = [];
        for (let n = 0; n < lutas; n++) {
          preparar();
          const hpMax = S.maxHp;
          let t = 0, menorHp = J.hp;
          const bebidas0 = (meta.stats && meta.stats.pocao) || 0;
          const dt = 1 / 60;
          while (t < 90 && estado === 'jogo' && inimigos.some(e => !e.morto)) {
            bot(dt);
            atualizar(dt);
            for (const k in premidas) delete premidas[k];
            t += dt;
            menorHp = Math.min(menorHp, J.hp);
          }
          const morreu = estado === 'morto' || J.hp <= 0;
          out.push({ t, morreu, vivos: inimigos.filter(e => !e.morto).length, perdeu: 1 - Math.max(0, menorHp) / hpMax, pocoes: ((meta.stats && meta.stats.pocao) || 0) - bebidas0 });
          estado = 'titulo';
        }
        const m = k => out.reduce((s, o) => s + o[k], 0) / out.length;
        return { tempo: m('t'), morreu: out.filter(o => o.morreu).length, perdeu: m('perdeu'), pocoes: m('pocoes'), vivos: m('vivos') };
      }, { a, classe, lutas: LUTAS });
      resultados[`${a}|${classe}`] = r;
      console.log(`andar ${String(a).padStart(2)}  ${classe.padEnd(12)} tempo ${r.tempo.toFixed(1).padStart(5)} s   vida perdida ${(r.perdeu * 100).toFixed(0).padStart(3)}%   poções ${r.pocoes.toFixed(1)}   mortes ${r.morreu}/${LUTAS}   sobram ${r.vivos.toFixed(1)}`);
    }
    // resumo do andar: quem está muito acima ou abaixo da mediana
    const ts = Object.entries(resultados).filter(([k]) => k.startsWith(a + '|')).map(([k, v]) => [k.split('|')[1], v.tempo]);
    const med = ts.map(x => x[1]).sort((x, y) => x - y)[Math.floor(ts.length / 2)];
    const fora = ts.filter(([, v]) => v > med * 1.6 || v < med / 1.6).map(([k, v]) => `${k} (${(v / med).toFixed(2)}x)`);
    console.log(`  mediana ${med.toFixed(1)} s${fora.length ? ' · fora do normal: ' + fora.join(', ') : ' · todos equilibrados'}\n`);
  }
  console.log(erros.length ? 'ERROS: ' + erros.slice(0, 3).join(' | ') : 'sem erros de JavaScript');
  await b.close();
})();
