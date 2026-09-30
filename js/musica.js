'use strict';
// =====================================================================
//  MÚSICA (gerada no momento com WebAudio, sem ficheiros)
//  Cada zona, o boss, os portais, a cidade e o menu têm a sua música.
//  A tecla M muda entre: tudo ligado / só efeitos / tudo desligado.
// =====================================================================

let musicaLigada = true;
try {
  const g = JSON.parse(localStorage.getItem('masmorra_som') || 'null');
  if (g) { somLigado = g.som !== false; musicaLigada = g.musica !== false; }
} catch (e) { /* sem storage */ }
function guardarSom() {
  try { localStorage.setItem('masmorra_som', JSON.stringify({ som: somLigado, musica: musicaLigada })); } catch (e) { /* sem storage */ }
}
function mudarSom() {
  if (somLigado && musicaLigada) musicaLigada = false;
  else if (somLigado) somLigado = false;
  else { somLigado = true; musicaLigada = true; }
  guardarSom();
}
const nomeSom = () => (!somLigado ? 'desligado' : musicaLigada ? 'tudo' : 'só efeitos');

// Escalas (meios-tons a partir da nota base)
const ESCALAS = {
  menor: [0, 2, 3, 5, 7, 8, 10], maior: [0, 2, 4, 5, 7, 9, 11], dorico: [0, 2, 3, 5, 7, 9, 10],
  frigio: [0, 1, 3, 5, 7, 8, 10], harmonica: [0, 2, 3, 5, 7, 8, 11], tons: [0, 2, 4, 6, 8, 10, 12],
};
// bpm, nota base (MIDI), escala, acordes (graus), ondas, bateria, densidade da melodia
const FAIXAS = {
  titulo:  { bpm: 88,  base: 57, esc: 'menor',     acordes: [0, 5, 3, 4], mel: 'triangle', bx: 'triangle', bat: 0, dens: 0.55, sem: 11 },
  cidade:  { bpm: 104, base: 60, esc: 'maior',     acordes: [0, 3, 4, 0], mel: 'square',   bx: 'triangle', bat: 1, dens: 0.7,  sem: 23 },
  zona0:   { bpm: 92,  base: 57, esc: 'dorico',    acordes: [0, 3, 0, 4], mel: 'triangle', bx: 'square',   bat: 1, dens: 0.5,  sem: 31 },
  zona1:   { bpm: 84,  base: 55, esc: 'menor',     acordes: [0, 6, 5, 4], mel: 'triangle', bx: 'triangle', bat: 0, dens: 0.45, sem: 37 },
  zona2:   { bpm: 100, base: 52, esc: 'frigio',    acordes: [0, 1, 0, 6], mel: 'square',   bx: 'sawtooth', bat: 1, dens: 0.5,  sem: 41 },
  zona3:   { bpm: 78,  base: 62, esc: 'menor',     acordes: [0, 3, 5, 4], mel: 'sine',     bx: 'triangle', bat: 0, dens: 0.4,  sem: 43 },
  zona4:   { bpm: 96,  base: 54, esc: 'harmonica', acordes: [0, 5, 3, 4], mel: 'square',   bx: 'square',   bat: 1, dens: 0.55, sem: 47 },
  zona5:   { bpm: 110, base: 50, esc: 'frigio',    acordes: [0, 1, 6, 0], mel: 'sawtooth', bx: 'sawtooth', bat: 1, dens: 0.6,  sem: 53 },
  zona6:   { bpm: 80,  base: 59, esc: 'dorico',    acordes: [0, 4, 3, 1], mel: 'sine',     bx: 'triangle', bat: 0, dens: 0.4,  sem: 59 },
  zona8:   { bpm: 96,  base: 60, esc: 'maior',     acordes: [0, 4, 5, 3], mel: 'triangle', bx: 'sine',     bat: 1, dens: 0.5,  sem: 79 },
  zona9:   { bpm: 118, base: 47, esc: 'harmonica', acordes: [0, 1, 5, 4], mel: 'sawtooth', bx: 'sawtooth', bat: 2, dens: 0.55, sem: 83 },
  final:   { bpm: 150, base: 45, esc: 'frigio',    acordes: [0, 1, 6, 4], mel: 'square',   bx: 'sawtooth', bat: 2, dens: 0.85, sem: 89 },
  zona7:   { bpm: 72,  base: 49, esc: 'tons',      acordes: [0, 2, 4, 1], mel: 'triangle', bx: 'sine',     bat: 0, dens: 0.35, sem: 61 },
  boss:    { bpm: 144, base: 52, esc: 'harmonica', acordes: [0, 5, 6, 4], mel: 'square',   bx: 'sawtooth', bat: 2, dens: 0.8,  sem: 67 },
  portal:  { bpm: 126, base: 53, esc: 'frigio',    acordes: [0, 1, 0, 3], mel: 'sawtooth', bx: 'square',   bat: 2, dens: 0.65, sem: 71 },
  templo:  { bpm: 66,  base: 48, esc: 'tons',      acordes: [0, 3, 0, 5], mel: 'sine',     bx: 'triangle', bat: 0, dens: 0.3,  sem: 73 },
};

// Gera 4 compassos de 8 passos (colcheias) para uma faixa, sempre iguais para a mesma faixa
const cacheFaixas = {};
function padraoFaixa(id) {
  if (cacheFaixas[id]) return cacheFaixas[id];
  const F = FAIXAS[id], esc = ESCALAS[F.esc];
  let s = F.sem;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const nota = grau => F.base + esc[((grau % 7) + 7) % 7] + 12 * Math.floor(grau / 7);
  const mel = [], baixo = [];
  let g = 7 + Math.floor(rnd() * 4);
  for (let c = 0; c < 4; c++) {
    const ac = F.acordes[c];
    for (let p = 0; p < 8; p++) {
      baixo.push(p === 0 || p === 4 || (F.bat === 2 && p % 2 === 0) ? nota(ac) - 12 : null);
      if (rnd() < F.dens || p === 0) {
        // anda pela escala e cai nas notas do acorde nos tempos fortes
        g += Math.floor(rnd() * 5) - 2;
        if (p % 4 === 0) { const alvos = [ac + 7, ac + 9, ac + 11]; g = alvos.reduce((a, b) => (Math.abs(b - g) < Math.abs(a - g) ? b : a)); }
        g = clamp(g, 4, 15);
        mel.push({ n: nota(g), d: rnd() < 0.3 ? 2 : 1 });
      } else mel.push(null);
    }
  }
  return (cacheFaixas[id] = { mel, baixo });
}

let gMusica = null, bufRuido = null;
const musica = { faixa: null, passo: 0, prox: 0 };

function iniciarAudioMusica() {
  if (!actx) return false;
  if (!gMusica) {
    gMusica = actx.createGain();
    gMusica.gain.value = 0.55;
    gMusica.connect(actx.destination);
    bufRuido = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
    const d = bufRuido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return true;
}

const hz = n => 440 * Math.pow(2, (n - 69) / 12);

function notaMusica(freq, t0, dur, onda, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = onda;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(gMusica);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function batida(t0, tipo) {
  if (tipo === 'bombo') {
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.setValueAtTime(140, t0);
    o.frequency.exponentialRampToValueAtTime(40, t0 + 0.12);
    g.gain.setValueAtTime(0.09, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
    o.connect(g).connect(gMusica);
    o.start(t0); o.stop(t0 + 0.17);
  } else {
    const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = bufRuido;
    f.type = 'highpass'; f.frequency.value = 6000;
    g.gain.setValueAtTime(0.025, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    src.connect(f).connect(g).connect(gMusica);
    src.start(t0); src.stop(t0 + 0.06);
  }
}

function tocarPasso(id, passo, t0, colcheia) {
  const F = FAIXAS[id], P = padraoFaixa(id), i = passo % 32;
  const m = P.mel[i];
  if (m) notaMusica(hz(m.n), t0, colcheia * m.d * 0.95, F.mel, F.mel === 'sawtooth' || F.mel === 'square' ? 0.018 : 0.035);
  if (P.baixo[i] != null) notaMusica(hz(P.baixo[i]), t0, colcheia * (F.bat === 2 ? 0.9 : 1.8), F.bx, F.bx === 'sawtooth' ? 0.02 : 0.04);
  if (F.bat >= 1 && i % 2 === 1) batida(t0, 'prato');
  if (F.bat === 2 && i % 4 === 0) batida(t0, 'bombo');
  if (F.bat === 1 && i % 8 === 0) batida(t0, 'bombo');
  // no boss um arpejo rápido por cima
  if (id === 'boss' && i % 2 === 0) notaMusica(hz(F.base + 24 + ESCALAS[F.esc][(F.acordes[Math.floor(i / 8)] + (i / 2) % 3 * 2) % 7]), t0, colcheia * 0.4, 'square', 0.008);
}

// Que música deve estar a tocar agora
function faixaDesejada() {
  if (['titulo', 'criar', 'almas', 'colecao', 'conquistas', 'pacto', 'registo', 'diario'].includes(estado)) return 'titulo';
  if (!mapa || !J) return 'titulo';
  if (estado === 'cidade' || mapa.cidade) return 'cidade';
  if (estado === 'morto') return null;
  if (mapa.templo) return 'templo';
  if (boss && !boss.morto) return boss.final ? 'final' : 'boss';
  if (mapa.portal) return 'portal';
  return 'zona' + zonaAtual();
}

function atualizarMusica() {
  if (!musicaLigada || !somLigado || document.hidden || !actx || actx.state !== 'running') { musica.faixa = null; return; }
  if (!iniciarAudioMusica()) return;
  const quer = faixaDesejada();
  if (!quer) { musica.faixa = null; return; }
  const agora = actx.currentTime;
  if (quer !== musica.faixa) { musica.faixa = quer; musica.passo = 0; musica.prox = agora + 0.05; }
  if (musica.prox < agora - 0.5) musica.prox = agora + 0.05; // voltou de uma pausa longa
  const colcheia = 60 / FAIXAS[quer].bpm / 2;
  while (musica.prox < agora + 0.25) {
    tocarPasso(quer, musica.passo, musica.prox, colcheia);
    musica.prox += colcheia;
    musica.passo++;
  }
}

// Efeito de ruído (explosões, golpes)
function ruido(dur, vol = 0.05, freq = 800) {
  if (!somLigado || !actx || !iniciarAudioMusica()) return;
  try {
    const t0 = actx.currentTime;
    const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = bufRuido;
    f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t0); f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.2), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(actx.destination);
    src.start(t0); src.stop(t0 + dur + 0.02);
  } catch (e) { /* ignora */ }
}
