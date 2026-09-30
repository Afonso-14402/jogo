// Gera as imagens para a página do jogo na Play Store (pasta loja/):
//  - capturas de ecrã de telemóvel (1920x1080) em português e em inglês
//  - o gráfico de destaque (1024x500)
//   npm install playwright
//   node scripts/gerar-loja.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(RAIZ, 'loja');

// Cada cena prepara o jogo e deixa-o correr um bocadinho antes da foto
const CENAS = [
  ['1_menu', () => { estado = 'titulo'; }],
  ['2_masmorra', () => {
    escolhaClasse = 'espada'; escolhaSkin = 'carmesim'; novoJogo(); tutorial = null; banner = null; falas = [];
    J.nivel = 8; J.hpBase = 400; S = stats(); J.hp = S.maxHp * 0.8; J.escolhasPendentes = 0; estado = 'jogo';
    for (let k = 0; k < 5; k++) { const e = criarInimigo(['esqueleto', 'orc', 'slime', 'morcego', 'goblin'][k], J.x + 120 + k * 36, J.y - 70 + k * 30); if (!colideCirculo(mapa, e.x, e.y, e.r)) { e.acordado = true; e.dano = 0; inimigos.push(e); } }
    toque.atacar = true;
  }],
  ['3_boss', () => {
    escolhaClasse = 'fogo'; escolhaSkin = 'real'; novoJogo(); tutorial = null; falas = [];
    J.nivel = 25; J.hpBase = 3000; J.atkBase = 5; S = stats(); J.hp = S.maxHp * 0.7; J.mana = 999;
    andar = 14; proximoAndar(); banner = null; falas = []; J.escolhasPendentes = 0; estado = 'jogo';
    if (boss) { boss.acordado = true; boss.x = J.x + 170; boss.y = J.y - 20; boss.dano = 0; }
    usarHabilidadeClasse();
  }],
  ['4_bau', () => {
    escolhaClasse = 'aventureiro'; escolhaSkin = 'azul'; novoJogo(); tutorial = null; banner = null; falas = []; J.escolhasPendentes = 0; estado = 'jogo';
    iniciarRoleta('ouro', 'jogo');
    const lend = criarItem(ITENS.find(i => i.nome === 'Excalibur'), 20);
    roleta.premio = lend; roleta.faixa[roleta.idx] = lend; roleta.t = roleta.dur * 0.97;
  }],
  ['5_tempo', () => {
    escolhaClasse = 'cronos'; escolhaSkin = 'gelo'; novoJogo(); tutorial = null; falas = [];
    J.nivel = 20; J.hpBase = 3000; S = stats(); J.hp = S.maxHp; J.mana = 999;
    andar = 21; proximoAndar(); banner = null; falas = []; J.escolhasPendentes = 0; estado = 'jogo';
    for (const e of inimigos) e.morto = true; inimigos = [];
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, e = criarInimigo(['diabrete', 'slimeLava', 'orc'][k % 3], J.x + Math.cos(a) * 110, J.y + Math.sin(a) * 80); if (!colideCirculo(mapa, e.x, e.y, e.r)) { e.acordado = true; e.dano = 0; inimigos.push(e); } }
    usarHabilidadeClasse();
  }],
  ['6_cidade', () => {
    escolhaClasse = 'besta'; escolhaSkin = 'floresta'; novoJogo(); tutorial = null; banner = null; falas = []; J.escolhasPendentes = 0; estado = 'jogo';
    entrarCidade(); banner = null;
  }],
  ['7_cacador', () => { estado = 'titulo'; abrirCriacao(); criacao.aba = 'classe'; escolhaClasse = 'cronos'; }],
  ['8_jogar_a_2', () => { estado = 'titulo'; abrirCoop(); coop.papel = 'anfitriao'; coop.ecra = 'criar'; coop.codigo = 'K7PM'; coop.msg = null; coop.conn = { open: true, send() {} }; coop.escolhaP2 = { classe: 'cronos' }; }],
];

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const lingua of ['pt', 'en']) {
    const c = await b.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await c.addInitScript(l => {
      localStorage.clear();
      localStorage.setItem('masmorra_idioma', l);
      localStorage.setItem('masmorra_opcoes', JSON.stringify({ tutorialFeito: true }));
      localStorage.setItem('masmorra_som', JSON.stringify({ som: false, musica: false }));
      // um jogador com alguma coisa feita (almas e coleção)
      localStorage.setItem('masmorra_meta', JSON.stringify({ almas: 340, melhorias: { vida: 2, dano: 1 }, colecao: {}, conquistas: {}, contadores: {}, vistos: {} }));
    }, lingua);
    const p = await c.newPage();
    p.on('pageerror', e => console.log('erro:', e.message));
    await p.goto('file://' + path.join(RAIZ, 'index.html'));
    await p.waitForTimeout(700);
    await p.evaluate(() => { modoToque = true; ajustarTela(); avisos.length = 0; });
    fs.mkdirSync(path.join(SAIDA, `capturas-${lingua}`), { recursive: true });
    for (const [nome, f] of CENAS) {
      await p.evaluate(`(${f.toString()})()`);
      await p.waitForTimeout(nome === '4_bau' ? 900 : 1300);
      await p.evaluate(() => { avisos.length = 0; toque.atacar = false; });
      await p.screenshot({ path: path.join(SAIDA, `capturas-${lingua}`, `${nome}.png`) });
      await p.evaluate(() => { coop.papel = null; coop.conn = null; coop.escolhaP2 = null; });
    }
    // gráfico de destaque: o mundo sem painéis por baixo do título
    if (lingua === 'pt') {
      await p.evaluate(() => {
        escolhaClasse = 'sombras'; escolhaSkin = 'sombra'; novoJogo(); tutorial = null; falas = []; J.nivel = 30; J.hpBase = 5000; S = stats(); J.hp = S.maxHp;
        andar = 29; proximoAndar(); banner = null; falas = []; J.escolhasPendentes = 0; estado = 'jogo';
        if (boss) { boss.acordado = true; boss.x = J.x + 260; boss.y = J.y - 30; boss.dano = 0; }
        window.desenharHUD = desenharHUD = () => {};
      });
      await p.waitForTimeout(1500);
      await p.evaluate(() => { avisos.length = 0; banner = null; });
      await p.waitForTimeout(100);
      const fundo = await p.screenshot({ type: 'png' });
      const fonte = fs.readFileSync(path.join(RAIZ, 'fontes', 'Tiny5.woff2')).toString('base64');
      const g = await b.newPage({ viewport: { width: 1024, height: 500 } });
      await g.setContent(`<html><head><style>
        @font-face { font-family: 'Tiny5'; src: url(data:font/woff2;base64,${fonte}) format('woff2'); }
        body { margin: 0; width: 1024px; height: 500px; overflow: hidden; background: #07060a; }
        .fundo { position: absolute; inset: 0; background: url(data:image/png;base64,${fundo.toString('base64')}) center / cover; image-rendering: pixelated; filter: brightness(1.15); }
        .sombra { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,6,10,0.85) 0%, rgba(7,6,10,0.15) 45%, rgba(7,6,10,0) 70%, rgba(7,6,10,0.6) 100%); }
        h1 { position: absolute; top: 34px; width: 100%; text-align: center; margin: 0; font: 72px 'Tiny5'; color: #ffae00; text-shadow: 4px 4px 0 #3a1a00, 0 0 24px rgba(255,174,0,0.35); letter-spacing: 2px; }
        p { position: absolute; top: 122px; width: 100%; text-align: center; margin: 0; font: 26px 'Tiny5'; color: #fff0c8; text-shadow: 2px 2px 0 #000; }
      </style></head><body><div class="fundo"></div><div class="sombra"></div><h1>MASMORRA DO DESTINO</h1><p>Bosses, baús da sorte e 60 andares</p></body></html>`);
      await g.evaluate(() => document.fonts.ready);
      await g.waitForTimeout(300);
      await g.screenshot({ path: path.join(SAIDA, 'grafico-destaque-1024x500.png') });
      await g.close();
    }
    await c.close();
  }
  await b.close();
  console.log('imagens da loja em loja/');
})();
