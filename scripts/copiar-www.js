// Copia o jogo para a pasta www/ (o que vai dentro da app Android).
// Só vão os ficheiros do jogo: nada de testes, README ou imagens de testes.
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'www');
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'privacidade.html', 'js', 'fontes', 'icones']) {
  const de = path.join(raiz, f);
  if (fs.existsSync(de)) fs.cpSync(de, path.join(destino, f), { recursive: true });
}
console.log('www/ pronto');
