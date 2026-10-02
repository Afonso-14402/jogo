// Service worker: guarda o jogo para jogar sem internet.
// Primeiro tenta a rede (para receber atualizações) e, se falhar, usa a cópia guardada.
const CACHE = 'masmorra-v30';
const FICHEIROS = [
  './', 'index.html', 'manifest.webmanifest', 'fontes/Nunito.woff2',
  'icones/icone-180.png', 'icones/icone-192.png', 'icones/icone-512.png',
  'js/dados.js', 'js/idioma.js', 'js/idioma_es.js', 'js/idioma_br.js', 'js/mapa.js', 'js/sprites.js', 'js/biomas.js', 'js/conteudo.js', 'js/bossesFinais.js', 'js/extras.js', 'js/cacador.js', 'js/classes.js', 'js/portais.js', 'js/historia.js', 'js/aventura.js', 'js/polimento.js', 'js/cenario.js', 'js/guia.js', 'js/combos.js', 'js/animacao.js', 'js/modos.js', 'js/cidade.js', 'js/templo.js', 'js/armadilhas.js', 'js/andares.js', 'js/enigmas.js', 'js/almas.js', 'js/cidade_extra.js', 'js/desenho.js',
  'js/ecras.js', 'js/meta.js', 'js/jogo.js', 'js/musica.js', 'js/toque.js', 'js/comando.js', 'js/coop.js', 'js/lib/peerjs.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
