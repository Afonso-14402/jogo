// Gera os ícones da app Android (normais, redondos e adaptativos) e o ecrã
// de arranque, desenhados com os próprios sprites do jogo (o baú dourado e o
// herói), tal como o ícone da versão web.
//   npm install playwright
//   node scripts/gerar-icones-android.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForTimeout(600);
  // desenha: fundo (sim/não), forma (quadrado/círculo) e o tamanho da arte
  const gerar = (lado, opc) => p.evaluate(([n, o]) => {
    const c = document.createElement('canvas'); c.width = o.w || n; c.height = o.h || n;
    const W = c.width, H = c.height, x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    if (o.circulo) { x.beginPath(); x.arc(W / 2, H / 2, n / 2, 0, Math.PI * 2); x.clip(); }
    if (o.fundo === 'escuro') { x.fillStyle = '#07060a'; x.fillRect(0, 0, W, H); } // cor lisa: a imagem fica levíssima
    else if (o.fundo) {
      const g = x.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, '#3a2a14'); g.addColorStop(1, '#0b0810');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    const desenha = (s, cx, cy, k) => x.drawImage(s, Math.round(cx - s.width * k / 2), Math.round(cy - s.height * k / 2), s.width * k, s.height * k);
    const bau = SPR.bau.ouro, heroi = framesHeroi('humano', 'azul')[0];
    const arte = n * (o.arte || 1);
    const k = Math.max(1, Math.floor(arte * 0.5 / bau.width)), kh = Math.max(1, Math.floor(arte * 0.3 / heroi.height));
    desenha(bau, W / 2, H / 2 + arte * 0.1, k);
    desenha(heroi, W / 2, H / 2 - arte * 0.2, kh);
    return c.toDataURL('image/png');
  }, [lado, opc]);
  const gravar = async (ficheiro, lado, opc) => {
    fs.mkdirSync(path.dirname(ficheiro), { recursive: true });
    fs.writeFileSync(ficheiro, Buffer.from((await gerar(lado, opc)).split(',')[1], 'base64'));
  };
  for (const [d, f] of Object.entries(DENSIDADES)) {
    await gravar(path.join(RES, `mipmap-${d}`, 'ic_launcher.png'), 48 * f, { fundo: true });
    await gravar(path.join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), 48 * f, { fundo: true, circulo: true });
    // ícone adaptativo: 108dp, a arte cabe no círculo central (o Android recorta à volta)
    await gravar(path.join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), 108 * f, { arte: 0.62 });
    // ecrã de arranque (deitado e ao alto)
    await gravar(path.join(RES, `drawable-land-${d}`, 'splash.png'), 160 * f, { fundo: 'escuro', w: 480 * f, h: 320 * f, arte: 0.9 });
    await gravar(path.join(RES, `drawable-port-${d}`, 'splash.png'), 160 * f, { fundo: 'escuro', w: 320 * f, h: 480 * f, arte: 0.9 });
  }
  await gravar(path.join(RES, 'drawable', 'splash.png'), 320, { fundo: 'escuro', w: 960, h: 640, arte: 0.9 });
  // ícone da loja (512x512) e um grande para usar noutros sítios
  await gravar(path.join(__dirname, '..', 'loja', 'icone-512.png'), 512, { fundo: true });
  console.log('ícones e ecrã de arranque gerados');
  await b.close();
})();
