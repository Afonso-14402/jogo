// Caça aos bugs: joga sozinho os andares 1 a 60 (e passa por todos os
// ecrãs em PT e EN, no PC e no telemóvel) e procura:
//  - erros de JavaScript
//  - baús, objetos, monstros ou o herói dentro de paredes
//  - números estragados (NaN / infinito) na vida, no dano, etc.
//  - textos que saem do ecrã
//   node testes/caca_bugs.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const problemas = [];
  const nota = (tipo, txt) => { if (!problemas.some(p => p.tipo === tipo && p.txt === txt)) problemas.push({ tipo, txt }); };

  for (const [lingua, tocar] of [['pt', false], ['en', false], ['pt', true], ['en', true]]) {
    const c = await b.newContext(tocar ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } : { viewport: { width: 960, height: 640 } });
    await c.addInitScript(l => { localStorage.clear(); localStorage.setItem('masmorra_idioma', l); localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true })); localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false })); }, lingua);
    const p = await c.newPage();
    p.on('pageerror', e => nota('erro JS', `${e.message} ${(e.stack || '').split('\n')[1] || ''}`.trim()));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await p.waitForTimeout(600);
    // vigia os textos: regista os que saem do ecrã
    await p.evaluate(() => {
      window._fora = new Set();
      const orig = CanvasRenderingContext2D.prototype.fillText;
      // os números a flutuar no mundo e a faixa da roleta podem sair do ecrã de propósito
      const dtm = desenharTextosMundo;
      desenharTextosMundo = function (...a) { window._ign = true; try { return dtm.apply(this, a); } finally { window._ign = false; } };
      CanvasRenderingContext2D.prototype.fillText = function (txt, x, y, ...r) {
        if (this.canvas === canvas && !window._ign && txt && String(txt).trim().length > 1 && !(estado === 'bau' && y > 90 && y < 300)) {
          const w = this.measureText(txt).width, m = this.getTransform();
          const esq = this.textAlign === 'center' ? x - w / 2 : this.textAlign === 'right' || this.textAlign === 'end' ? x - w : x;
          const x0 = m.a * esq + m.e, x1 = m.a * (esq + w) + m.e, yy = m.d * y + m.f;
          if ((x0 < -3 || x1 > this.canvas.width + 3) && yy > 0 && yy < this.canvas.height) window._fora.add(`${estado}: "${txt}"`);
        }
        return orig.call(this, txt, x, y, ...r);
      };
    });
    if (tocar) await p.evaluate(() => { modoToque = true; ajustarTela(); });

    // 1) todos os ecrãs
    const ecras = [
      () => { estado = 'titulo'; }, () => abrirCriacao(), () => { criacao.aba = 'raca'; }, () => abrirMenuMeta('almas'), () => abrirMenuMeta('colecao'),
      () => { menuMeta.aba = 'monstros'; }, () => { menuMeta.aba = 'reliquias'; }, () => abrirMenuMeta('conquistas'), () => abrirMenuMeta('pacto'),
      () => abrirMenuMeta('registo'), () => comecarDiario(), () => abrirTransferir(), () => abrirOpcoes(),
      () => { estado = 'titulo'; novoJogo(); tutorial = null; J.escolhasPendentes = 0; estado = 'jogo'; },
      () => { estado = 'pausa'; }, () => { estado = 'personagem'; }, () => { estado = 'jogo'; abrirMochila(); },
      () => { estado = 'mapa'; }, () => { estado = 'jogo'; iniciarRoleta('ouro', 'jogo'); roleta.t = roleta.dur; },
      () => { roleta = null; estado = 'jogo'; abrirLoja({ tipo: 'mercador', stock: null }); },
      () => { estado = 'jogo'; abrirMesa({ tipo: 'mesa' }); }, () => { estado = 'jogo'; J.escolhasPendentes = 1; abrirEscolha(); },
      () => { estado = 'jogo'; entrarCidade(); for (const id of ['casa']) abrirEdificio(id); }, () => abrirEdificio('assoc'),
      () => abrirEdificio('ferreiro'), () => abrirEdificio('alquimista'), () => { estado = 'jogo'; cidade = null; },
      () => { J.hp = 0; morrer(); },
    ];
    for (const f of ecras) {
      try { await p.evaluate(`(${f.toString()})()`); } catch (e) { nota('erro ao abrir ecrã', e.message.split('\n')[0]); }
      await p.waitForTimeout(120);
    }

    // 2) jogar do andar 1 ao 60 (só uma vez, no PC em português)
    if (lingua === 'pt' && !tocar) {
      const r = await p.evaluate(async () => {
        const out = [];
        const noMuro = (x, y, r) => colideCirculo(mapa, x, y, r);
        const fin = v => Number.isFinite(v);
        escolhaClasse = 'aventureiro'; estado = 'titulo'; novoJogo(); tutorial = null;
        J.hpBase = 1e6; J.atkBase = 400; S = stats(); J.hp = S.maxHp;
        const resolver = () => { // fecha menus que se abram
          if (estado === 'bau') { roleta.t = roleta.dur; roleta.fim = true; roleta.brilho = 1; estado = roleta.voltar; roleta = null; }
          if (estado === 'nivel') { J.escolhasPendentes = 0; estado = 'jogo'; }
          if (['loja', 'encantar', 'cidade', 'mochila', 'personagem', 'mapa'].includes(estado)) estado = 'jogo';
        };
        for (let a = 1; a <= 60; a++) {
          try {
            if (a > 1) { andar = a - 1; proximoAndar(); }
            resolver(); J.escolhasPendentes = 0; estado = 'jogo';
            // coisas dentro das paredes
            for (const bb of baus) if (noMuro(bb.x, bb.y, 8)) out.push(`andar ${a}: baú dentro da parede`);
            for (const o of objetos) if (o.tipo !== 'edificio' && noMuro(o.x, o.y, 6)) out.push(`andar ${a}: ${o.tipo} dentro da parede`);
            for (const e of inimigos) if (e.tipo !== 'fantasma' && noMuro(e.x, e.y, Math.min(8, e.r * 0.6))) out.push(`andar ${a}: ${e.tipo} nasceu dentro da parede`);
            if (noMuro(J.x, J.y, 6)) out.push(`andar ${a}: o herói começa dentro da parede`);
            // luta durante 6 segundos de jogo
            for (let k = 0; k < 360 && estado === 'jogo'; k++) {
              const alvo = alvoProximo(600);
              toque.atacar = !!alvo;
              if (alvo) { J.x += (alvo.x - J.x) * 0.02; J.y += (alvo.y - J.y) * 0.02; if (noMuro(J.x, J.y, J.r)) { J.x = mapa.inicio.x; J.y = mapa.inicio.y; } }
              atualizar(1 / 60);
              for (const q in premidas) delete premidas[q];
              resolver();
            }
            toque.atacar = false;
            // números estragados
            for (const [n, v] of [['vida', J.hp], ['vida máx', S.maxHp], ['dano', S.dano], ['defesa', S.def], ['poder', poderJogador()], ['ouro', J.ouro]]) if (!fin(v)) out.push(`andar ${a}: ${n} = ${v}`);
            for (const e of inimigos) if (!e.morto && (!fin(e.hp) || !fin(e.x) || !fin(e.y))) out.push(`andar ${a}: ${e.tipo} com números estragados`);
            // abre todos os baús e usa todos os objetos
            for (const bb of baus.slice()) { abrirBau(bb); resolver(); }
            for (const o of objetos.slice()) {
              if (['portal', 'portaDupla', 'escadaCidade', 'escadaMasmorra', 'saidaPortal'].includes(o.tipo)) continue;
              try { usarObjeto(o); } catch (e) { out.push(`andar ${a}: usar ${o.tipo}: ${e.message}`); }
              resolver();
            }
            // entra num portal e conquista-o
            const pt = objetos.find(o => o.tipo === 'portal');
            if (pt) {
              entrarPortal(pt);
              for (let k = 0; k < 8 && mapa.portal && mapa.portal.fase !== 'feito'; k++) { for (const e of inimigos) if (!e.morto) { e.hp = 0; matarInimigo(e); } atualizar(1 / 60); resolver(); }
              if (mapa.portal && mapa.portal.fase !== 'feito') out.push(`andar ${a}: o portal não acabou`);
              sairPortal();
            }
            // os bosses: mata e sobe à cidade
            if (boss) { danoInimigo(boss, boss.hp + 1, true, 0, 0); resolver(); estado = 'jogo'; }
            const ec = objetos.find(o => o.tipo === 'escadaCidade');
            if (ec) {
              entrarCidade();
              for (const o of objetos.filter(o => o.tipo === 'aldeao')) { falarAldeao(o); resolver(); }
              for (let k = 0; k < 120; k++) atualizar(1 / 60);
              for (const o of objetos) if (o.tipo !== 'aldeao' && o.tipo !== 'edificio' && noMuro(o.x, o.y, 6)) out.push(`cidade: ${o.tipo} dentro da parede`);
              if (estado === 'fim') estado = 'jogo';
            }
            if (estado === 'fim') estado = 'jogo';
            if (J.hp <= 0 || estado === 'morto') { out.push(`andar ${a}: o herói de teste morreu`); J.hp = S.maxHp; estado = 'jogo'; }
          } catch (e) { out.push(`andar ${a}: ${e.message}`); }
          await new Promise(r => setTimeout(r, 0));
        }
        return out;
      });
      for (const x of r) nota('jogo', x);
    }
    const fora = await p.evaluate(() => [...window._fora]);
    for (const f of fora) nota(`texto fora do ecrã (${lingua}${tocar ? ', telemóvel' : ''})`, f);
    await c.close();
  }
  await b.close();

  if (!problemas.length) console.log('Nenhum problema encontrado!');
  const grupos = {};
  for (const p of problemas) (grupos[p.tipo] = grupos[p.tipo] || []).push(p.txt);
  for (const [t, l] of Object.entries(grupos)) {
    console.log(`\n== ${t} (${l.length})`);
    for (const x of l.slice(0, 25)) console.log('  - ' + x);
  }
})();
