'use strict';
// =====================================================================
//  JOGAR A 2 (co-op em dois telemóveis)
//  Quem cria a sala corre o jogo (monstros, dano, baús...) e envia o estado
//  do jogo ao outro telemóvel 20 vezes por segundo; o outro desenha tudo
//  sozinho, com a imagem perfeita, e mexe o seu herói logo quando toca
//  (sem esperar pela rede). Os sons também vão.
//  A ligação é direta entre os dois aparelhos (WebRTC, com a biblioteca
//  PeerJS): o jogo não precisa de servidor próprio.
//  - os monstros atacam o herói mais perto
//  - a câmara segue os dois (não se podem afastar demasiado)
//  - a XP e o ouro são partilhados; cada baú dá também um prémio ao outro
//  - quem cai pode ser reanimado pelo outro; só perdem se caírem os dois
//  - cada um tem os seus menus (baús, lojas, mochila...) no seu telemóvel
//    e o mundo não para enquanto um deles está num menu (só a pausa para)
// =====================================================================

const coop = {
  papel: null,        // 'anfitriao' | 'convidado' | null
  ecra: 'menu',       // ecrã da sala: menu | criar | entrar | classe | ligando
  codigo: '',
  msg: null,          // mensagem de erro ou de estado na sala
  peer: null, conn: null, connEst: null,
  p2: null,           // o herói do convidado (só no anfitrião)
  escolhaP2: null,    // { classe, raca, skin } que o convidado escolheu
  entrada: { mx: 0, my: 0, forca: 1, atk: false },
  acoes: [],          // botões carregados pelo convidado (esquiva, poção...)
  principal: null,    // o herói de quem criou a sala (enquanto se joga com o outro)
  principalS: null,
  // os menus do convidado correm no anfitrião, com estas variáveis no lugar das tuas
  ctxP2: { estado: 'jogo', roleta: null, escolha: null, loja: null, mesa: null, mochilaUI: null, cidade: null, menuMeta: null,
    rato: { x: 0, y: 0, baixo: false, movido: -1e9 }, premidas: {} },
  menuP2: false,      // a correr um menu do convidado
  usar: false,        // o convidado carregou em USAR
  menu: 'jogo', ultRato: '', confirmarSair: false,
  partilhando: false,
  // réplica (anfitrião): o que já foi enviado
  env: {}, proxId: 0, seq: 0, sons: [], mortos: [], estT: 0, posRep: null, vistaConv: null,
  // réplica (convidado)
  pronto: false, mv: -1, ultN: 0, tpLocal: null, petOutro: null, metaGuardada: null, espera: false, pausa: false, fim: false, vistaHost: null, posT: 0,
  classeConvidado: 'aventureiro',
  // voltar a entrar: o anfitrião dá uma senha ao convidado; com ela, o convidado volta ao mesmo herói
  senhaP2: null, senha: null, religar: null,
};
const TENTATIVAS_RELIGAR = 10;
const PREFIXO_SALA = 'masmorra-do-destino-';
const LETRAS_SALA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CLASSES_CONVIDADO = ORDEM_CLASSES;
// Menus do convidado e estados em que o mundo continua (a jogar a 2 só a pausa para os dois)
const MENUS_P2 = ['bau', 'loja', 'encantar', 'mochila', 'nivel', 'personagem', 'cidade', 'mapa'];
const ESTADOS_MUNDO_VIVO = MENUS_P2;
// Objetos que mudam o sítio dos dois (usam-se sempre com o teu herói)
const OBJETOS_DA_EQUIPA = ['portal', 'saidaPortal', 'portaDupla', 'escadaCidade', 'escadaMasmorra', 'gaiola', 'aldeao', 'estatua'];
const DIST_REANIMAR = 56, TEMPO_REANIMAR = 2.5;

// ---------------------------------------------------------------------
//  Trocar de herói: o código do jogo usa sempre J e S, por isso para
//  mexer no parceiro trocamo-los por um bocadinho
// ---------------------------------------------------------------------
function comHeroi(h, fn) {
  if (!h || h === J) return fn();
  const J0 = J, S0 = S;
  if (J0 && !J0.remoto) { coop.principal = J0; coop.principalS = S0; }
  // o ouro é da equipa e cada um tem o seu exército de sombras
  const par = J0 && (h.remoto || J0.remoto);
  if (par) { h.ouro = J0.ouro; J0.sombrasMundo = sombras; sombras = h.sombrasMundo || (h.sombrasMundo = []); }
  J = h;
  S = h.remoto ? (h._S || stats()) : stats();
  try { return fn(); } finally {
    h._S = S;
    if (par) { J0.ouro = h.ouro; h.sombrasMundo = sombras; sombras = J0.sombrasMundo; }
    J = J0; S = S0;
  }
}

// Corre fn com o herói do convidado e com os menus dele (estado, roleta, loja, rato...)
function comContextoP2(fn) {
  const p2 = coop.p2, C = coop.ctxP2;
  if (!p2) return;
  return comHeroi(p2, () => {
    const guarda = { estado, roleta, escolha, loja, mesa, mochilaUI, cidade, menuMeta };
    const rato0 = Object.assign({}, rato), prem0 = Object.assign({}, premidas);
    const usar = C => { estado = C.estado; roleta = C.roleta; escolha = C.escolha; loja = C.loja; mesa = C.mesa; mochilaUI = C.mochilaUI; cidade = C.cidade; menuMeta = C.menuMeta; };
    usar(C);
    Object.assign(rato, C.rato);
    for (const k in premidas) delete premidas[k];
    Object.assign(premidas, C.premidas);
    coop.menuP2 = true;
    try { return fn(); } finally {
      coop.menuP2 = false;
      Object.assign(C, { estado, roleta, escolha, loja, mesa, mochilaUI, cidade, menuMeta });
      if (!MENUS_P2.includes(C.estado)) C.estado = 'jogo'; // (por ex. "guardar e sair" não é para o convidado)
      C.rato = Object.assign({}, rato);
      usar(guarda);
      Object.assign(rato, rato0);
      for (const k in premidas) delete premidas[k];
      Object.assign(premidas, prem0);
    }
  });
}
const heroiPrincipal = () => (J && J.remoto ? coop.principal : J);
const parceiroAtivo = () => (coop.p2 && coop.conn && coop.p2.mapa === mapa && coop.p2.dono === heroiPrincipal() ? coop.p2 : null);

// Os heróis de pé (os monstros, as flechas e as armadilhas só lhes acertam a eles)
function heroisVivos() {
  const P1 = heroiPrincipal(), p2 = parceiroAtivo();
  if (!p2) return [P1];
  const l = [];
  if (!P1.caido && !P1.emMenu) l.push(P1);
  if (!p2.caido && !p2.emMenu) l.push(p2); // quem está num menu não leva dano
  return l.length ? l : [P1];
}

// O convidado pode jogar? (não quando estás na pausa, no menu inicial ou morreste)
const mundoAtivoCoop = () => !!(parceiroAtivo() && (estado === 'jogo' || ESTADOS_MUNDO_VIVO.includes(estado)));

// Cada monstro persegue o herói mais perto
function alvoDe(e) {
  const l = heroisVivos();
  if (l.length < 2) return l[0];
  return Math.hypot(l[0].x - e.x, l[0].y - e.y) <= Math.hypot(l[1].x - e.x, l[1].y - e.y) ? l[0] : l[1];
}

function focoCamara() {
  const p2 = parceiroAtivo();
  return p2 ? { x: (J.x + p2.x) / 2, y: (J.y + p2.y) / 2 } : J;
}

// ---------------------------------------------------------------------
//  O herói do convidado (criado ao nível do teu, com equipamento do andar)
// ---------------------------------------------------------------------
// Atributo principal de cada caçador (os pontos de cada nível vão para ele e para a Vitalidade)
const ATRIBUTO_CLASSE = { aventureiro: 'for', sombras: 'for', espada: 'agi', fogo: 'int', besta: 'for', titan: 'vit', cura: 'int', vento: 'agi', arqueiro: 'agi', cronos: 'agi' };
function distribuirPontos() {
  const a = ATRIBUTO_CLASSE[J.classe] || 'for';
  if (!J.atributos) J.atributos = {};
  while (J.pontos > 0) {
    const id = (J.atributos[a] || 0) <= (J.atributos.vit || 0) * 2 ? a : 'vit';
    J.atributos[id] = (J.atributos[id] || 0) + 1;
    J.pontos--;
  }
}
function perkAleatorio() {
  const l = PERKS.filter(p => nPerk(p.id) < p.max && !p.unica);
  if (!l.length) return;
  const p = escolher(l);
  J.perks[p.id] = nPerk(p.id) + 1;
}

function criarParceiro() {
  const P1 = J, E = coop.escolhaP2;
  const h = criarJogador();
  Object.assign(h, {
    raca: RACAS[E.raca] ? E.raca : 'humano', skin: SKINS[E.skin] ? E.skin : 'azul', classe: CLASSES_CONVIDADO.includes(E.classe) ? E.classe : 'aventureiro',
    dificuldade: P1.dificuldade, pacto: Object.assign({}, P1.pacto || {}), modo: P1.modo, remoto: true, dono: P1, mapa: null, reviver: 0,
    tp: Math.floor(Math.random() * 1e6), // muda sempre que o jogo mexe o herói (o telemóvel do convidado segue)
  });
  if (h.skin === P1.skin) h.skin = Object.keys(SKINS).find(k => k !== P1.skin && !SKINS[k].recorde && !SKINS[k].conquista) || h.skin; // para não serem iguais
  comHeroi(h, () => {
    aplicarClasseInicial();
    while (J.nivel < P1.nivel) { // apanha o nível do parceiro
      J.nivel++;
      J.hpBase += 10; J.atkBase += 2; J.defBase += 1;
      J.pontos += PONTOS_POR_NIVEL;
      perkAleatorio();
    }
    distribuirPontos();
    if (andar > 1) { // equipamento à altura do andar
      const base = ITENS.find(i => i.nome === J.arma.nomeBase);
      if (base) J.arma = criarItem(base, andar, true);
      const r = P1.armadura ? P1.armadura.r : 'comum';
      const ars = ITENS.filter(i => i.tipo === 'armadura' && i.r === r && !i.inicial);
      if (ars.length) J.armadura = criarItem(escolher(ars), andar, true);
    }
    S = stats();
    J.hp = S.maxHp;
    J.mana = S.maxMana;
  });
  coop.p2 = h;
  return h;
}

// Põe o parceiro ao teu lado (ao mudar de andar, entrar num portal, na cidade...)
function juntarParceiro(p2) {
  p2.mapa = mapa;
  p2.tp = (p2.tp || 0) + 1;
  p2.caido = false; p2.reviver = 0;
  p2.kbx = p2.kby = 0; p2.dashT = 0; p2.golpe = null;
  for (const [ox, oy] of [[30, 0], [-30, 0], [0, 30], [0, -30], [24, 24], [-24, 24]]) {
    if (!colideCirculo(mapa, J.x + ox, J.y + oy, p2.r)) { p2.x = J.x + ox; p2.y = J.y + oy; return; }
  }
  p2.x = J.x; p2.y = J.y;
}

// O exército de sombras do parceiro (se for Caçador das Sombras) aparece à volta dele
function levantarExercitoParceiro(p2) {
  if (p2.classe !== 'sombras') p2.sombras = [];
  p2.sombrasMundo = (p2.sombras || []).map((s, i) => {
    const a = i / Math.max(1, p2.sombras.length) * Math.PI * 2;
    let x = p2.x + Math.cos(a) * 40, y = p2.y + Math.sin(a) * 40;
    if (colideCirculo(mapa, x, y, 10)) { x = p2.x; y = p2.y; }
    return criarSombra(s, x, y);
  });
}
const sombrasParceiro = () => { const p2 = parceiroAtivo(); return p2 && p2.sombrasMundo ? p2.sombrasMundo : []; };
// ---------------------------------------------------------------------
//  Atualização do parceiro (chamada pelo atualizar() com J = o teu herói)
// ---------------------------------------------------------------------
function atualizarCoop(dt) {
  if (coop.papel !== 'anfitriao' || !coop.conn || !coop.escolhaP2 || !mapa) return;
  const P1 = J;
  if (!coop.p2 || coop.p2.dono !== P1) { criarParceiro(); enviarCoop({ t: 'aviso', titulo: 'Entraste no jogo!', sub: 'Luta ao lado do teu parceiro', cor: '#5dff7a' }); }
  const p2 = coop.p2;
  if (p2.mapa !== mapa) { juntarParceiro(p2); levantarExercitoParceiro(p2); }
  conquistaEquipa('coopJuntos');
  const C = coop.ctxP2;
  p2.emMenu = C.estado !== 'jogo';

  // a posição vem do telemóvel do convidado (ele mexe-se sem esperar pela rede)
  const rep = coop.posRep;
  if (rep && rep.tp === p2.tp && !p2.caido && !p2.emMenu) {
    if (Math.hypot(rep.x - p2.x, rep.y - p2.y) < 300 && !colideCirculo(mapa, rep.x, rep.y, p2.r * 0.5)) { p2.x = rep.x; p2.y = rep.y; }
    else p2.tp++; // posição impossível: o telemóvel dele volta para onde o herói está
    if (rep.dx || rep.dy) { p2.dirX = rep.dx; p2.dirY = rep.dy; }
  }
  // o que o convidado carregou desde a última vez (a esquiva move-se lá; aqui só conta para não levar dano)
  const A = coop.acoes; coop.acoes = [];
  const R = { mx: 0, my: 0, forca: 1, atk: !p2.emMenu && coop.entrada.atk, dash: false, pocao: !p2.emMenu && A.includes('pocao') };
  const x0 = p2.x, y0 = p2.y;
  comHeroi(p2, () => {
    S = stats();
    if (A.includes('dash') && !J.caido && !J.emMenu) { J.dashT = 0.16; J.dashVX = 0; J.dashVY = 0; J.cdDash = S.cdDash; }
    if (J.kbx || J.kby) { enviarCoop({ t: 'kb', x: Math.round(J.kbx), y: Math.round(J.kby) }); J.kbx = 0; J.kby = 0; } // o empurrão acontece lá
    atualizarJogador(dt, R);
    J.andando = !!(rep && rep.an && !J.caido && !J.emMenu);
    if (!J.caido && !J.emMenu) {
      atualizarClasse(dt);
      atualizarCacador(dt);
      atualizarVeneno(dt);
      if (J.dorT > 0) J.dorT -= dt;
      if (J.bebeuT > 0) J.bebeuT -= dt;
      for (const a of A) {
        if (a === 'classe') usarHabilidadeClasse();
        else if (a[0] === 'h') usarHabilidade(+a.slice(1));
        else if (a[0] === 'f') { const id = feiticosJ()[+a.slice(1)]; if (id && J.feiticos[id]) lancarFeitico(id); }
      }
      revelar(mapa, J.x, J.y, 7);
      apanharDrops();
    }
  });
  if (Math.hypot(p2.x - x0, p2.y - y0) > 0.5) p2.tp++; // uma habilidade mexeu-o: o telemóvel dele segue
  // os menus do convidado (abrem no telemóvel dele)
  if (!p2.caido && !p2.emMenu) {
    if (A.includes('usar')) coop.usar = true; // trata-se no fim do atualizar()
    else if (A.includes('mochila')) comContextoP2(() => abrirMochila());
    else if (A.includes('personagem')) comContextoP2(() => { estado = 'personagem'; });
    else if (A.includes('mapa')) comContextoP2(() => { estado = 'mapa'; });
    else if (p2.escolhasPendentes > 0) comContextoP2(() => abrirEscolha()); // subiu de nível: escolhe a melhoria
  }
  p2.perto = !!(bauPerto(p2) || objetoPerto(p2) || (mapa.escada.ativa && Math.hypot(mapa.escada.x - p2.x, mapa.escada.y - p2.y) < 40));

  // não se podem afastar demasiado (o telemóvel do convidado já trava; se ficar muito longe, vem para o teu lado)
  const lx = vistaW() - 110, ly = vistaH() - 110;
  if (Math.abs(p2.x - P1.x) > lx * 1.6 || Math.abs(p2.y - P1.y) > ly * 1.6) juntarParceiro(p2);

  // reanimar: fica perto de quem caiu
  for (const [H, O] of [[P1, p2], [p2, P1]]) {
    if (!H.caido) continue;
    if (!O.caido && Math.hypot(H.x - O.x, H.y - O.y) < DIST_REANIMAR) {
      H.reviver += dt;
      if (H.reviver >= TEMPO_REANIMAR) levantarHeroi(H);
    } else H.reviver = Math.max(0, H.reviver - dt * 0.5);
  }

}

const bauPerto = h => { let b = null, md = 46; for (const x of baus) { const d = Math.hypot(x.x - h.x, x.y - h.y); if (d < md) { md = d; b = x; } } return b; };
const objetoPerto = h => { let o = null, md = 52; for (const x of objetos) { const d = Math.hypot(x.x - h.x, x.y - h.y); if (d < md) { md = d; o = x; } } return o; };

// O convidado carregou em USAR (chamado no fim do atualizar(), com J = o teu herói)
function usarParceiroPendente() {
  if (!coop.usar) return;
  coop.usar = false;
  const p2 = parceiroAtivo();
  if (!p2 || p2.caido || p2.emMenu) return;
  const b = bauPerto(p2);
  if (b) { comContextoP2(() => abrirBau(b)); return; }
  const o = objetoPerto(p2);
  if (o) {
    if (OBJETOS_DA_EQUIPA.includes(o.tipo)) usarObjeto(o); // portais, escadas...: vão os dois
    else comContextoP2(() => usarObjeto(o)); // lojas, mesas, altares...: são para ele
    return;
  }
  if (mapa.escada.ativa && Math.hypot(mapa.escada.x - p2.x, mapa.escada.y - p2.y) < 40) proximoAndar();
}

// Os menus do convidado (chamado todas as vezes no loop do anfitrião)
function atualizarMenuParceiro(dt) {
  const p2 = parceiroAtivo();
  if (!p2 || coop.ctxP2.estado === 'jogo') return;
  comContextoP2(() => {
    const F = {
      bau: () => atualizarRoleta(dt), loja: () => atualizarLoja(dt), encantar: () => atualizarMesa(dt), mochila: () => atualizarMochila(dt),
      nivel: () => atualizarEscolha(dt), cidade: () => atualizarCidade(dt), mapa: () => { if (premiu('tab', 'escape', 'rato', 'm')) estado = 'jogo'; },
      personagem: () => { if (premiu('c', 'tab', 'escape', 'rato')) estado = 'jogo'; },
    }[estado];
    if (F) F();
  });
  coop.ctxP2.premidas = {};
  p2.emMenu = coop.ctxP2.estado !== 'jogo';
}

// A jogar a 2, o mundo não para quando abres um menu (o teu herói fica parado e não leva dano)
function mundoEmMenu(dt) {
  if (!ESTADOS_MUNDO_VIVO.includes(estado) || !J || !mapa || !parceiroAtivo()) return false;
  const e0 = estado, prem0 = Object.assign({}, premidas), at = toque.atacar, rb = rato.baixo;
  for (const k in premidas) delete premidas[k];
  toque.atacar = false; rato.baixo = false;
  J.emMenu = true;
  estado = 'jogo';
  try { atualizar(dt * ritmoJogo()); } finally {
    J.emMenu = false;
    if (estado === 'jogo') estado = e0; // se aconteceu alguma coisa (morreste, o fim...), fica o novo estado
    Object.assign(premidas, prem0); toque.atacar = at; rato.baixo = rb;
  }
  return true;
}

// O parceiro também apanha ouro (vai para a equipa) e poções (para ele)
function apanharDrops() {
  for (const d of drops) {
    if (d.morto) continue;
    const dd = Math.hypot(d.x - J.x, d.y - J.y);
    if (d.tipo === 'ouro' && dd < 120 && dd > 1) { d.x += (J.x - d.x) / dd * 380 * (1 / 60); d.y += (J.y - d.y) / dd * 380 * (1 / 60); }
    if (dd >= J.r + 12) continue;
    if (d.tipo === 'ouro') {
      d.morto = true;
      const v = Math.max(1, Math.round(d.valor * S.ouroMult));
      J.ouro += v; // o ouro é da equipa (volta para o teu herói no fim)
      texto(d.x, d.y - 10, `+${v} ouro`, '#ffd23f', 13);
      som(1300, 0.05, 'square', 0.02, 300);
    } else if (d.tipo === 'pocao') {
      d.morto = true;
      J.pocoes++;
      texto(d.x, d.y - 10, '+1 Poção', '#ff6b8a', 15);
      som(660, 0.12, 'triangle', 0.05, 200);
    }
  }
}

function levantarHeroi(H) {
  comHeroi(H, () => {
    J.caido = false; J.reviver = 0;
    J.hp = Math.round(S.maxHp * 0.4);
    J.invuln = 2;
    texto(J.x, J.y - 34, 'DE PÉ!', '#5dff7a', 22);
    explosao(J.x, J.y, '#5dff7a', 30, 200, 5);
    fanfarra([523, 659, 784], 0.04);
  });
  if (H.remoto) enviarCoop({ t: 'aviso', titulo: 'De pé!', sub: 'O teu parceiro reanimou-te', cor: '#5dff7a' });
  conquistaEquipa('coopReanimar');
}

// Conquistas de equipa: o anfitrião ganha-as e manda-as ao convidado (ganham os dois)
function conquistaEquipa(id) {
  if (coop.papel !== 'anfitriao' || !coop.conn || !coop.conn.open || !coop.p2 || !coop.escolhaP2) return;
  desbloquear(id);
  if (!coop.conqEnviadas) coop.conqEnviadas = {};
  if (coop.conqEnviadas[id]) return;
  coop.conqEnviadas[id] = true;
  enviarCoop({ t: 'conquista', id });
}
// No convidado: as melhorias em uso são as do anfitrião, por isso guarda-se à mão com as tuas
function conquistaNoConvidado(id) {
  const c = CONQUISTAS.find(x => x.id === id);
  if (!c || meta.conquistas[id]) return;
  meta.conquistas[id] = true;
  if (c.almas) meta.almas += c.almas;
  try { localStorage.setItem(CHAVE_META, JSON.stringify(Object.assign({}, meta, { melhorias: coop.metaGuardada || meta.melhorias }))); } catch (e) { /* sem storage */ }
  avisar(`Conquista: ${c.nome}`, c.almas ? `+${c.almas} almas` : '', '#ffe14d');
  fanfarra([784, 1046, 1318, 1568], 0.04);
}

// Chamado pelo danoJogador quando um herói fica sem vida. Devolve true se
// ele só caiu (o outro ainda está de pé e pode reanimá-lo).
function caiuCoop() {
  const p2 = parceiroAtivo();
  if (!p2) return false;
  const P1 = heroiPrincipal(), outro = J === p2 ? P1 : p2;
  if (outro.caido) { // caíram os dois: acabou
    if (J.remoto) { J.caido = false; comHeroi(P1, () => { J.caido = false; morrer(); }); return true; }
    p2.caido = false;
    return false;
  }
  J.caido = true; J.reviver = 0; J.hp = 1;
  J.golpe = null; J.dashT = 0; J.veneno = 0;
  texto(J.x, J.y - 30, 'CAÍDO!', '#ff6060', 20);
  som(120, 0.5, 'sawtooth', 0.05, -60);
  if (J.remoto) enviarCoop({ t: 'aviso', titulo: 'Caíste!', sub: 'Fica quieto: o teu parceiro pode reanimar-te', cor: '#ff6060' });
  else mostrarBanner('CAÍSTE!', 'O teu parceiro pode reanimar-te: tem de ficar ao teu lado', '#ff6060');
  return true;
}

// A XP é de todos: o que um ganha, o outro também ganha
function partilharXp(q) {
  if (coop.partilhando || !parceiroAtivo()) return;
  coop.partilhando = true;
  try { comHeroi(J.remoto ? coop.principal : coop.p2, () => ganharXp(q)); } finally { coop.partilhando = false; }
}

// Subir de nível do parceiro: os pontos de atributo vão sozinhos
function subirNivelParceiro() {
  J.pontos = (J.pontos || 0) + PONTOS_POR_NIVEL;
  distribuirPontos();
  S = stats();
  const h = habsJ().find(x => x.nivel === J.nivel);
  if (h) enviarCoop({ t: 'aviso', titulo: `[Destino] Nova habilidade: ${h.nome}`, sub: h.desc, cor: '#4dc3ff' });
}

// Cada baú aberto dá também um prémio ao outro herói
function presenteParceiro(tipoBau) {
  const p2 = parceiroAtivo();
  if (!p2) return;
  const outro = J.remoto ? heroiPrincipal() : p2;
  comHeroi(outro, () => {
    const it = sortearItem(tipoBau);
    if (!it || !['arma', 'armadura', 'amuleto'].includes(it.tipo)) return;
    if (!J.remoto) { // tu: vai para a mochila (ou é vendido se estiver cheia)
      if (J.mochila.length < TAMANHO_MOCHILA) { J.mochila.push(it); avisar('O teu parceiro abriu um baú', `Também ganhaste ${traduzir(it.nome)} (está na mochila)`, RARIDADES[it.r].cor); }
      else { const v = valorVenda(it); J.ouro += v; avisar('O teu parceiro abriu um baú', `Também ganhaste ${v} ouro`, '#ffd23f'); }
      return;
    }
    const velho = J[it.tipo], antes = poderJogador();
    J[it.tipo] = it; S = stats();
    const depois = poderJogador();
    J[it.tipo] = velho; S = stats();
    if (depois > antes && !it.maldicao) {
      equipar(it);
      texto(J.x, J.y - 34, it.nome, RARIDADES[it.r].cor, 15);
      enviarCoop({ t: 'aviso', titulo: `Novo equipamento: ${traduzir(it.nome)}`, sub: `${traduzir(RARIDADES[it.r].nome)} · ${traduzir('Poder')} +${depois - antes}`, cor: RARIDADES[it.r].cor });
    } else if (J.mochila.length < TAMANHO_MOCHILA) {
      J.mochila.push(it);
      enviarCoop({ t: 'aviso', titulo: `Guardado na mochila: ${traduzir(it.nome)}`, sub: traduzir(RARIDADES[it.r].nome), cor: RARIDADES[it.r].cor });
    } else {
      const v = valorVenda(it);
      J.ouro += v;
      enviarCoop({ t: 'aviso', titulo: `Vendeste ${traduzir(it.nome)}`, sub: `+${v} ouro para a equipa`, cor: '#ffd23f' });
    }
  });
}

// ---------------------------------------------------------------------
//  Desenho (no anfitrião)
// ---------------------------------------------------------------------
function desenharParceiro(t) {
  const p2 = parceiroAtivo();
  if (!p2) return;
  if (!p2.caido) { // um anel da cor do caçador aos pés, para se distinguir
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = (CLASSES[p2.classe] || CLASSES.aventureiro).cor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(alinhar(p2.x), alinhar(p2.y + 13), 14, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  comHeroi(p2, () => {
    desenharJogador(t);
    if (coop.papel === 'convidado' && coop.petOutro && J.pet) { const p0 = pet; pet = coop.petOutro; desenharPet(t); pet = p0; } // o companheiro dele
  });
}

// Um herói caído: deitado, a piscar, com o círculo de reanimar
function desenharCaido(t) {
  const c = framesHeroi(J.raca, J.skin)[0];
  sombra(J.x, J.y + 8, 12);
  ctx.save();
  ctx.translate(alinhar(J.x), alinhar(J.y + 4));
  ctx.rotate(Math.PI / 2);
  ctx.globalAlpha = 0.75;
  spr(c, 0, 0);
  sprCor(c, 0, 0, false, '#6a6a80', 0.5);
  ctx.restore();
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6);
  aro(J.x, J.y, DIST_REANIMAR - 10, '#ff6060', 2);
  ctx.globalAlpha = 1;
  if (J.reviver > 0) {
    ctx.strokeStyle = '#5dff7a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(alinhar(J.x), alinhar(J.y), 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(J.reviver / TEMPO_REANIMAR, 0, 1));
    ctx.stroke();
  }
}

// Nome por cima do parceiro e "Ajuda!" por cima de quem caiu
function desenharEtiquetasCoop(t) {
  const p2 = parceiroAtivo();
  if (!p2 || estado === 'morto') return;
  const conv = coop.papel === 'convidado', cor = CLASSES[p2.classe] ? CLASSES[p2.classe].cor : '#fff';
  const [eu, ele] = conv ? ['J2', 'J1'] : ['J1', 'J2'];
  textoCentro(p2.emMenu ? `${ele} (menu)` : ele, ecraX(p2.x), ecraY(p2.y) - 40, 12, cor);
  if (conv ? coop.menu !== 'jogo' : ESTADOS_MUNDO_VIVO.includes(estado)) textoCentro(`${eu} (menu)`, ecraX(J.x), ecraY(J.y) - 40, 12, '#ffe14d');
  for (const H of [J, p2]) if (H.caido) textoCentro(Math.floor(t * 2) % 2 ? 'AJUDA!' : 'Reanima-me!', ecraX(H.x), ecraY(H.y) - 44, 13, '#ff8080');
}

// Painel do outro herói, por baixo do teu (no canto esquerdo)
function desenharHudParceiro(y, t) {
  if (!coop.papel) return;
  const p2 = J.remoto ? heroiPrincipal() : parceiroAtivo(); // na vista do convidado mostra o teu
  if (!p2) {
    painel(10, y, 250, 30);
    textoEsq(coop.conn ? 'O parceiro está a entrar...' : `À espera do parceiro · sala ${coop.codigo}`, 20, y + 15, 12, '#9fdcff', 'normal');
    return;
  }
  const S2 = (J.remoto ? coop.principalS : p2._S) || S, C = CLASSES[p2.classe] || CLASSES.aventureiro;
  painel(10, y, 250, 52);
  textoEsq(`${J.remoto || coop.papel === 'convidado' ? 'J1' : 'J2'} · Nv ${p2.nivel}`, 20, y + 14, 13, '#ffe14d');
  textoEsq(C.nome, 106, y + 14, 11, C.cor, 'normal');
  barra(20, y + 26, 230, 12, p2.caido ? 0 : p2.hp / S2.maxHp, p2.caido ? '#555' : p2.hp / S2.maxHp < 0.3 ? '#ff2d2d' : '#e0413e');
  textoCentro(p2.caido ? 'CAÍDO' : `${Math.ceil(p2.hp)} / ${S2.maxHp}`, 135, y + 32, 11, '#fff');
  barra(20, y + 41, 230, 5, p2.mana / S2.maxMana, '#8a4dff', '#1e1438');
}

// A luz do parceiro
function luzParceiro(luz, t) {
  const p2 = parceiroAtivo();
  if (p2) luz(p2.x, p2.y, 300 + Math.sin(t * 7 + 1) * 6, 1);
}

// ---------------------------------------------------------------------
//  Rede (PeerJS): dois canais entre os telemóveis
//   - "ctl" (seguro): entrar, botões, menus, mapa, avisos
//   - "est" (rápido; se uma mensagem se perder, vem logo outra): o estado
//     do jogo 20 vezes por segundo e a posição do herói do convidado
// ---------------------------------------------------------------------
function carregarPeer() {
  if (window.Peer) return Promise.resolve();
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'js/lib/peerjs.min.js';
    s.onload = () => (window.Peer ? ok() : falha(new Error('peerjs')));
    s.onerror = () => falha(new Error('peerjs'));
    document.head.appendChild(s);
  });
}
const opcoesPeer = () => Object.assign({ debug: 0 }, window.OPCOES_PEER || {});
function enviarCoop(m) {
  if (!coop.conn || !coop.conn.open) return;
  try { coop.conn.send(m); } catch (e) { /* ligação a fechar */ }
}
function enviarRapido(m) {
  const c = coop.connEst && coop.connEst.open ? coop.connEst : coop.conn;
  if (!c || !c.open) return;
  try { c.send(m); } catch (e) { /* ligação a fechar */ }
}
function erroRede(err) {
  const tipo = err && err.type;
  if (tipo === 'peer-unavailable') return 'Sala não encontrada. Confirma o código.';
  if (tipo === 'browser-incompatible') return 'Este browser não consegue jogar a 2.';
  return 'Sem ligação. Jogar a 2 precisa de internet.';
}
function fecharRede() {
  for (const c of [coop.connEst, coop.conn]) { try { if (c) c.close(); } catch (e) { /* ignora */ } }
  try { if (coop.peer) coop.peer.destroy(); } catch (e) { /* ignora */ }
  coop.conn = null; coop.connEst = null; coop.peer = null;
}

// --- quem cria a sala ---
function novoCodigo() {
  let c = '';
  for (let i = 0; i < 4; i++) c += LETRAS_SALA[Math.floor(Math.random() * LETRAS_SALA.length)];
  return c;
}
function criarSala(tentativa = 0) {
  coop.papel = 'anfitriao';
  coop.ecra = 'criar';
  coop.codigo = '';
  coop.msg = { txt: 'A criar a sala...', cor: '#aaa' };
  carregarPeer().then(() => {
    const cod = novoCodigo();
    const peer = new Peer(PREFIXO_SALA + cod, opcoesPeer());
    coop.peer = peer;
    peer.on('open', () => { coop.codigo = cod; coop.msg = null; });
    peer.on('connection', c => receberLigacao(c));
    peer.on('error', err => {
      if (err && err.type === 'unavailable-id' && tentativa < 5) { peer.destroy(); criarSala(tentativa + 1); return; }
      if (err && err.type === 'peer-unavailable') return;
      coop.msg = { txt: erroRede(err), cor: '#ff6060' };
    });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* ignora */ } }); // o servidor de ligação caiu: a sala continua
  }).catch(() => { coop.msg = { txt: 'Jogar a 2 só funciona no site do jogo (com internet).', cor: '#ff6060' }; });
}

function receberLigacao(c) {
  if (c.label === 'est') { // o canal rápido do convidado que já entrou
    if (coop.conn && c.peer === coop.conn.peer) {
      coop.connEst = c;
      c.on('data', m => receberNoAnfitriao(m, coop.conn));
    } else c.on('open', () => setTimeout(() => { // pode ser o convidado a voltar: espera que o canal principal mude
      if (coop.conn && c.peer === coop.conn.peer) { coop.connEst = c; c.on('data', m => receberNoAnfitriao(m, coop.conn)); } else c.close();
    }, 1500));
    return;
  }
  if (coop.conn && coop.conn.open) { // já há um parceiro... a não ser que seja ele a voltar (a ligação antiga ainda não fechou)
    c.on('data', function primeira(m) {
      c.off('data', primeira);
      if (m && m.t === 'ola' && m.senha && m.senha === coop.senhaP2) {
        const velha = coop.conn;
        aceitarLigacao(c);
        receberNoAnfitriao(m, c);
        try { velha.close(); } catch (e) { /* ignora */ }
        return;
      }
      try { c.send({ t: 'cheia' }); } catch (e) { /* ignora */ }
      setTimeout(() => c.close(), 500);
    });
    return;
  }
  aceitarLigacao(c);
}
function aceitarLigacao(c) {
  coop.conn = c;
  coop.connEst = null;
  c.on('data', m => receberNoAnfitriao(m, c));
  c.on('close', () => saiuConvidado(c));
  c.on('error', () => saiuConvidado(c));
}

function receberNoAnfitriao(m, c) {
  if (!m || c !== coop.conn) return;
  if (m.t === 'p') { // onde está o herói do convidado (ele mexe-se no telemóvel dele, sem esperar)
    coop.posRep = { x: +m.x || 0, y: +m.y || 0, dx: +m.dx || 0, dy: +m.dy || 0, an: !!m.an, tp: m.tp };
    coop.entrada.atk = !!m.atk;
    if (m.vw) coop.vistaConv = { w: clamp(+m.vw, 200, 3000), h: clamp(+m.vh, 200, 3000) };
  } else if (m.t === 'acao') {
    if (coop.acoes.length < 20 && typeof m.a === 'string') coop.acoes.push(m.a);
  } else if (m.t === 'rato') { // o dedo (ou o rato) do convidado num menu dele
    const R = coop.ctxP2.rato;
    R.x = clamp(+m.x || 0, -400, LARGURA + 400); R.y = clamp(+m.y || 0, 0, ALTURA); R.movido = performance.now();
    if (m.clique) coop.ctxP2.premidas.rato = true;
  } else if (m.t === 'tecla') {
    if (typeof m.k === 'string' && m.k.length < 12) coop.ctxP2.premidas[m.k] = true;
  } else if (m.t === 'ola') {
    const volta = !!(m.senha && m.senha === coop.senhaP2 && coop.p2);
    const mesma = volta || (coop.escolhaP2 && coop.escolhaP2.classe === m.classe);
    if (!volta) coop.escolhaP2 = { classe: m.classe, raca: m.raca, skin: m.skin };
    if (!mesma) coop.p2 = null; // mudou de caçador: herói novo
    if (!coop.senhaP2 || !volta) coop.senhaP2 = Math.random().toString(36).slice(2, 10);
    coop.env = {}; // volta a enviar tudo (mapa, heróis, menus)
    coop.posRep = null;
    coop.conqEnviadas = {}; // (o convidado guarda as dele; se já as tiver, não conta duas vezes)
    if (coop.p2) coop.p2.tp = (coop.p2.tp || 0) + 1; // o telemóvel dele fica com a posição que o anfitrião tem
    enviarCoop({ t: 'bemvindo', codigo: coop.codigo, melhorias: meta.melhorias, senha: coop.senhaP2, classe: coop.escolhaP2.classe });
    if (volta) avisar('O teu parceiro voltou!', 'Continua com o mesmo herói', '#5dff7a');
    else avisar('O teu parceiro entrou!', `${traduzir((CLASSES[m.classe] || CLASSES.aventureiro).nome)} · joga no telemóvel dele`, '#5dff7a');
  }
}

function saiuConvidado(c) {
  if (c !== coop.conn) return;
  coop.conn = null; coop.connEst = null;
  coop.entrada = { mx: 0, my: 0, forca: 1, atk: false };
  coop.posRep = null;
  coop.ctxP2 = Object.assign(coop.ctxP2, { estado: 'jogo', roleta: null, escolha: null, loja: null, mesa: null, mochilaUI: null, cidade: null, menuMeta: null, premidas: {} });
  if (coop.p2) coop.p2.emMenu = false;
  const P1 = heroiPrincipal();
  if (P1 && P1.caido) { P1.caido = false; P1.hp = Math.max(1, Math.round((S ? S.maxHp : 100) * 0.3)); P1.invuln = 2; }
  avisar('O teu parceiro saiu', `Pode voltar com o código ${coop.codigo} (fica com o mesmo herói)`, '#ffae00');
}

function fecharSala() {
  fecharRede();
  coop.papel = null; coop.p2 = null; coop.escolhaP2 = null; coop.codigo = '';
}

// ---------------------------------------------------------------------
//  Réplica: o que o anfitrião envia e o convidado desenha
// ---------------------------------------------------------------------
const arred = n => Math.round(n * 100) / 100;
// Cópia simples para enviar: sem desenhos (canvas), sem funções e sem o mapa;
// as ligações a outros monstros/objetos passam a ser só o número deles
function copiar(v, prof = 0, raiz = v, max = 4) {
  if (v === null || v === undefined) return v;
  const tipo = typeof v;
  if (tipo === 'number') return Number.isFinite(v) ? arred(v) : 0;
  if (tipo === 'string' || tipo === 'boolean') return v;
  if (tipo !== 'object') return undefined;
  if (v === mapa || v === J || v === coop.p2 || v === coop.principal || ArrayBuffer.isView(v) || v instanceof Set || v instanceof Map) return undefined;
  if (typeof HTMLCanvasElement !== 'undefined' && (v instanceof HTMLCanvasElement || v instanceof HTMLImageElement)) return undefined;
  if (v !== raiz && v._id != null && raiz && raiz._id != null) return { __id: v._id }; // de monstro para monstro: só o número
  if (prof > max) return undefined;
  if (Array.isArray(v)) return v.length > 60 ? undefined : v.map(x => { const c = copiar(x, prof + 1, raiz, max); return c === undefined ? null : c; });
  const o = {};
  for (const k in v) {
    if (k[0] === '_' && k !== '_id') continue;
    const c = copiar(v[k], prof + 1, raiz, max);
    if (c !== undefined) o[k] = c;
  }
  return o;
}
function copiaEntidade(o) {
  if (o._id == null) o._id = ++coop.proxId;
  return copiar(o, 0, o);
}

// Heróis: o que muda a toda a hora vai sempre; o resto (equipamento, melhorias...) só quando muda
const LEVES_HEROI = ['x', 'y', 'hp', 'mana', 'dirX', 'dirY', 'angArma', 'golpe', 'andando', 'invuln', 'dashT', 'cdDash', 'cdAtaque', 'cdFeitico', 'cdHab',
  'cdClasse', 'lentoT', 'veneno', 'venenoDps', 'dorT', 'bebeuT', 'formaBestial', 'escudoTitan', 'furtivo', 'barreira', 'barreiraT', 'caido', 'reviver', 'emMenu',
  'cdPocao', 'feridoT', 'buffSombras', 'grito', 'furia', 'escudoCd', 'pocoes', 'ouro', 'xp', 'nivel', 'pontos', 'escolhasPendentes', 'contaGolpes', 'perto', 'milCortes', 'kbx', 'kby'];
const SET_LEVES = new Set(LEVES_HEROI);
const FORA_HEROI = new Set(['remoto', 'dono', 'mapa', 'sombrasMundo', 'joySuave', 'bauPerto', 'objPerto', 'escadaPerto', 'tp']);
function heroiLeve(h) {
  const o = {};
  for (const k of LEVES_HEROI) if (h[k] !== undefined) { const c = copiar(h[k], 1, h); if (c !== undefined) o[k] = c; }
  return o;
}
function heroiPesado(h) {
  const o = {};
  for (const k in h) {
    if (SET_LEVES.has(k) || FORA_HEROI.has(k) || k[0] === '_') continue;
    const c = copiar(h[k], 1, h, 7);
    if (c !== undefined) o[k] = c;
  }
  return o;
}

// O mapa vai inteiro quando muda (andar novo, portal, cidade, sala secreta aberta)
const GRANDES_MAPA = new Set(['tiles', 'explorado', 'oculto', 'salas', 'tochas', 'luzes', 'lama', 'animados', 'W', 'H', 'salaInicio', 'salaEscada', 'inicio', 'rachada', 'secreta', 'posBoss', 'aldeoes', 'campo']);
function paraBase64(a) {
  let s = '';
  for (let i = 0; i < a.length; i += 4096) s += String.fromCharCode.apply(null, a.subarray(i, i + 4096));
  return btoa(s);
}
function deBase64(s) {
  const b = atob(s), a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}
function serializarMapa(m) {
  const o = {};
  for (const k in m) {
    const v = m[k];
    if (ArrayBuffer.isView(v)) o[k] = { __u8: paraBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
    else if (v instanceof Set) o[k] = { __set: [...v] };
    else if (k !== 'campo') { const c = copiar(v, 0, m, 6); if (c !== undefined) o[k] = c; }
  }
  return o;
}
function desserializarMapa(o) {
  const m = {};
  for (const k in o) {
    const v = o[k];
    if (v && v.__u8 != null) m[k] = deBase64(v.__u8);
    else if (v && v.__set) m[k] = new Set(v.__set);
    else m[k] = v;
  }
  return m;
}
function somaMapa(m) {
  let s = m.oculto ? 7 : 0;
  for (let i = 0; i < m.tiles.length; i++) s = (s * 31 + m.tiles[i]) | 0;
  return s;
}
function mapaDinamico(m) {
  const o = {};
  for (const k in m) if (!GRANDES_MAPA.has(k)) { const c = copiar(m[k], 1, m); if (c !== undefined) o[k] = c; }
  return o;
}

// Sons: o que toca no teu telemóvel durante o jogo também toca no dele
function capturarSom(args) {
  if (coop.papel !== 'anfitriao' || !coop.conn || !(estado === 'jogo' || coop.menuP2)) return false;
  if (coop.sons.length < 40) coop.sons.push(args);
  return coop.menuP2; // os sons dos menus do convidado só tocam no telemóvel dele
}
// Monstros que morreram (o convidado desfá-los como tu)
function marcarMorto(e) {
  if (coop.papel === 'anfitriao' && coop.conn && e._id != null) coop.mortos.push(e._id);
}

// Números arredondados para enviar (posições em píxeis inteiros, o resto com uma casa)
// (os contadores que já passaram do zero ficam parados: assim não se reenviam)
const ehContador = k => k === 'flash' || k.startsWith('cd') || k.endsWith('T') || k.endsWith('Cd');
const quantizar = (k, v) => (typeof v !== 'number' ? v : k === 'x' || k === 'y' ? Math.round(v)
  : v < -0.5 && ehContador(k) ? -0.5 : Math.round(v * 10) / 10);
// Lista de coisas (monstros, tiros...): as novas vão inteiras; as outras só com o que mudou.
// De 2 em 2 segundos vai tudo inteiro (se alguma mensagem se perdeu, fica certo).
function listaDiff(E, nome, l, completa, comT) {
  const cache = E.ents[nome] || (E.ents[nome] = new Map()), vistos = new Set();
  const out = [];
  for (const o of l) {
    const c = copiaEntidade(o), ant = cache.get(c._id);
    vistos.add(c._id);
    if (!ant || completa) {
      const reg = {};
      for (const k in c) { c[k] = quantizar(k, c[k]); reg[k] = JSON.stringify(c[k]); }
      cache.set(c._id, reg);
      c._f = 1;
      out.push(c);
      continue;
    }
    const d = { _id: c._id };
    for (const k in c) {
      if (k === 't' && !comT) continue; // o tempo das animações conta-se no telemóvel do convidado
      const q = quantizar(k, c[k]), js = JSON.stringify(q);
      if (ant[k] !== js) { d[k] = q; ant[k] = js; }
    }
    out.push(d);
  }
  for (const id of cache.keys()) if (!vistos.has(id)) cache.delete(id);
  return out;
}
// Só as chaves que mudaram (heróis)
function camposDiff(E, nome, o, completa) {
  const cache = E.campos[nome] || (E.campos[nome] = {}), d = {};
  for (const k in o) {
    const q = quantizar(k, o[k]), js = JSON.stringify(q);
    if (completa || cache[k] !== js) { d[k] = q; cache[k] = js; }
  }
  return d;
}
// Coisas que só se enviam quando aparecem (partículas, números a flutuar, ondas): o convidado anima-as
function novos(l, f) {
  const ja = coop.jaEnv || (coop.jaEnv = new WeakSet()), out = [];
  for (const x of l) if (!ja.has(x)) { ja.add(x); if (f(x)) out.push(x); }
  return out;
}

// Chamado no início de cada frame do anfitrião
function atualizarRedeCoop(dt) {
  if (coop.papel !== 'anfitriao' || !coop.conn) return;
  const E = coop.env;
  if (!E.ents) { E.ents = {}; E.campos = {}; E.pes = {}; coop.jaEnv = new WeakSet(); }
  // os menus do convidado: só quando mudam (o tempo das animações conta-se lá)
  const C = coop.ctxP2, menu = { estado: C.estado, roleta: C.roleta, escolha: C.escolha, loja: C.loja, mesa: C.mesa, mochilaUI: C.mochilaUI, cidade: C.cidade, menuMeta: C.menuMeta };
  const cm = JSON.stringify(copiar(menu, 0, menu, 8), (k, v) => (k === 't' || k === 'pos' || k === 'brilho' || k === 'ultimoTick' ? undefined : v));
  if (cm !== E.menu) { E.menu = cm; enviarCoop({ t: 'menu', d: copiar(menu, 0, menu, 8) }); }

  coop.estT = (coop.estT || 0) - dt;
  if (coop.estT > 0) return;
  coop.estT = 1 / 15; // 15 vezes por segundo (o convidado desliza tudo entre as mensagens)
  const p2 = parceiroAtivo(), P1 = heroiPrincipal();
  if (!p2 || !p2._S || !mundoAtivoCoop()) { enviarRapido({ t: 's', espera: true, pausa: estado === 'pausa', fim: estado === 'morto' }); coop.sons = []; coop.mortos = []; return; }

  // o mapa: inteiro quando muda; o que já foi explorado aos bocadinhos
  E.somaT = (E.somaT || 0) - 1;
  const soma = E.somaT <= 0 ? somaMapa(mapa) : E.soma;
  if (E.somaT <= 0) E.somaT = 8;
  if (mapa !== E.mapa || mapaImg !== E.mapaImg || soma !== E.soma) {
    E.mapa = mapa; E.mapaImg = mapaImg; E.soma = soma; E.mv = (E.mv || 0) + 1;
    E.expl = mapa.explorado.slice();
    E.ents = {}; E.campos = {};
    enviarCoop({ t: 'mapa', mv: E.mv, andar, cidade: !!mapa.cidade, d: serializarMapa(mapa) });
  } else {
    const nov = [];
    for (let i = 0; i < mapa.explorado.length; i++) if (mapa.explorado[i] && !E.expl[i]) { nov.push(i); E.expl[i] = 1; }
    if (nov.length) enviarCoop({ t: 'expl', mv: E.mv, i: nov });
  }
  // os heróis: o equipamento e as melhorias só quando mudam (canal seguro)
  P1.emMenu = ESTADOS_MUNDO_VIVO.includes(estado);
  for (const [k, h] of [['eu', p2], ['ou', P1]]) {
    const pes = heroiPesado(h), ant = E.pes[k] || (E.pes[k] = {}), d = {};
    let muda = false;
    for (const c in pes) { const js = JSON.stringify(pes[c]); if (ant[c] !== js) { ant[c] = js; d[c] = pes[c]; muda = true; } }
    if (muda) enviarCoop({ t: 'heroi', q: k, d });
  }
  // o que está à vista dos dois
  const completa = coop.seq % 30 === 0;
  const vw = vistaW(), vh = vistaH(), cv = coop.vistaConv || { w: vw, h: vh };
  const cx = cam.x + vw / 2, cy = cam.y + vh / 2, hw = Math.max(vw, cv.w) / 2 + 160, hh = Math.max(vh, cv.h) / 2 + 160;
  const perto = o => Math.abs(o.x - cx) < hw && Math.abs(o.y - cy) < hh;
  const L = (nome, l, f = perto, comT = false) => listaDiff(E, nome, l.filter(f), completa, comT);
  const cores = [], ic = c => { let i = cores.indexOf(c); if (i < 0) { i = cores.length; cores.push(c); } return i; };
  const pa = [];
  for (const p of novos(particulas, perto).slice(0, 150)) pa.push(Math.round(p.x), Math.round(p.y), Math.round(p.vx), Math.round(p.vy), Math.round(p.t * 100) / 100, Math.round(p.tam * 10) / 10, ic(p.cor));
  const eS = JSON.stringify(p2._S), oS = JSON.stringify(coop.principalS || S);
  const extras = { ban: banner ? copiar(banner) : null, fa: falas.length ? copiar(falas) : null, md: mapaDinamico(mapa) };
  const semTempo = (k, v) => (k === 't' ? undefined : v);
  const m = {
    t: 's', n: ++coop.seq, mv: E.mv, tj: arred(tempoJogo), andar, tr: Math.round(tremor), vw: Math.round(vw), vh: Math.round(vh), c: completa ? 1 : 0,
    eu: camposDiff(E, 'eu', heroiLeve(p2), completa || p2.tp !== E.tpEnv), tp: p2.tp, ou: camposDiff(E, 'ou', heroiLeve(P1), completa),
    ini: L('ini', inimigos, e => !e.morto && (perto(e) || e === boss)), pr: L('pr', projeteis), ob: L('ob', objetos), ba: L('ba', baus), dr: L('dr', drops),
    pe: L('pe', perigos, perto, true), po: L('po', pocas, perto, true), ca: L('ca', cadaveres, perto, true), ar: L('ar', armadilhas, perto, true),
    s1: L('s1', sombras), s2: L('s2', p2.sombrasMundo || []), pet: pet ? L('pet', [pet], () => true) : [],
    on: novos(ondas, perto).map(o => copiar(o)), ra: raios.length ? raios.map(r => copiar(r)) : undefined,
    pa: pa.length ? pa : undefined, co: pa.length ? cores : undefined,
    tx: (() => { const l = novos(textos, perto); return l.length ? l.map(t => [Math.round(t.x), Math.round(t.y), t.txt, t.cor, t.tam, Math.round(t.t * 100) / 100, Math.round(t.vy)]) : undefined; })(),
    boss: boss ? boss._id : null, mo: coop.mortos.length ? coop.mortos : undefined, so: coop.sons.length ? coop.sons : undefined,
  };
  E.tpEnv = p2.tp; // quando o jogo mexe o herói do convidado, a posição vai sempre
  if (flashEcra > 0.05) m.fl = arred(flashEcra);
  // letreiros, falas e o estado do mapa: quando mudam (e nas mensagens completas)
  const je = JSON.stringify(extras, semTempo);
  if (completa || je !== E.extras) { E.extras = je; Object.assign(m, extras); m.ex = 1; }
  if (completa || eS !== E.eS) { E.eS = eS; m.eS = p2._S; }
  if (completa || oS !== E.oS) { E.oS = oS; m.oS = coop.principalS || S; }
  coop.mortos = []; coop.sons = [];
  enviarRapido(m);
}

// --- quem entra na sala ---
function entrarSala() {
  coop.papel = 'convidado';
  coop.ecra = 'ligando';
  coop.msg = { txt: `A ligar à sala ${coop.codigo}...`, cor: '#aaa' };
  carregarPeer().then(() => {
    const peer = new Peer(opcoesPeer());
    coop.peer = peer;
    peer.on('open', () => {
      const c = peer.connect(PREFIXO_SALA + coop.codigo, { reliable: true, label: 'ctl' });
      coop.conn = c;
      c.on('open', () => {
        c.send({ t: 'ola', classe: coop.classeConvidado, raca: escolhaRaca, skin: escolhaSkin, senha: coop.senha });
        const r = peer.connect(PREFIXO_SALA + coop.codigo, { reliable: false, serialization: 'json', label: 'est' });
        coop.connEst = r;
        r.on('data', m => receberNoConvidado(m));
      });
      c.on('data', m => receberNoConvidado(m));
      c.on('close', () => perdeuLigacao());
      c.on('error', () => perdeuLigacao());
    });
    peer.on('error', err => {
      if (estado === 'convidado' || coop.religar) { perdeuLigacao(); return; }
      coop.ecra = 'entrar';
      coop.msg = { txt: erroRede(err), cor: '#ff6060' };
      fecharRede();
    });
  }).catch(() => { coop.ecra = 'entrar'; coop.msg = { txt: 'Jogar a 2 só funciona no site do jogo (com internet).', cor: '#ff6060' }; });
}

function receberNoConvidado(m) {
  if (!m) return;
  if (m.t === 's') { aplicarEstado(m); return; }
  if (m.t === 'bemvindo') {
    estado = 'convidado';
    if (m.senha) coop.senha = m.senha;
    if (m.classe) coop.classeConvidado = m.classe;
    if (coop.religar) avisar('Voltaste à sala!', 'Continuas com o mesmo herói', '#5dff7a');
    coop.religar = null;
    coop.pronto = false; coop.mv = -1; coop.ultN = 0; coop.tpLocal = null; coop.menu = 'jogo';
    if (!coop.metaGuardada) coop.metaGuardada = meta.melhorias;
    meta.melhorias = m.melhorias || {}; // as melhorias das almas de quem criou a sala (os números batem certo)
    J = Object.assign(criarJogador(), { classe: coop.classeConvidado });
    coop.p2 = Object.assign(criarJogador(), { remoto: true });
    S = null; pet = null; sombras = []; mapa = null;
  } else if (m.t === 'cheia') {
    coop.papel = null; // assim o fecho da ligação não troca esta mensagem
    coop.ecra = 'entrar';
    coop.msg = { txt: 'Esta sala já tem 2 jogadores.', cor: '#ff6060' };
    fecharRede();
  } else if (m.t === 'mapa') {
    andar = m.andar;
    mapa = desserializarMapa(m.d);
    mapaImg = m.cidade ? renderizarCidade(mapa) : renderizarMapa(mapa, andar);
    coop.mv = m.mv;
    inimigos = []; projeteis = []; baus = []; drops = []; objetos = []; perigos = []; ondas = []; raios = []; particulas = []; textos = [];
    armadilhas = []; pocas = []; cadaveres = []; restos = []; sombras = [];
    if (J && coop.p2) { J.x = mapa.inicio ? mapa.inicio.x : J.x; J.y = mapa.inicio ? mapa.inicio.y : J.y; }
  } else if (m.t === 'expl') {
    if (mapa && m.mv === coop.mv) for (const i of m.i) mapa.explorado[i] = 1;
  } else if (m.t === 'heroi' && J) {
    const h = m.q === 'eu' ? J : coop.p2;
    Object.assign(h, m.d);
  } else if (m.t === 'menu') {
    aplicarMenu(m.d || {});
  } else if (m.t === 'kb' && J) { // levaste um empurrão
    J.kbx = (J.kbx || 0) + (+m.x || 0); J.kby = (J.kby || 0) + (+m.y || 0);
  } else if (m.t === 'aviso') {
    avisar(m.titulo, m.sub, m.cor);
  } else if (m.t === 'vib') {
    vibrar(m.p);
  } else if (m.t === 'conquista' && typeof m.id === 'string') {
    conquistaNoConvidado(m.id);
  }
}

// O estado do jogo que chegou do anfitrião
const LOCAIS_HEROI = new Set(['x', 'y', 'dirX', 'dirY', 'andando', 'dashT', 'cdDash', 'kbx', 'kby', 'golpe', 'angArma', 'cdAtaque', 'contaGolpes']);
function aplicarEstado(m) {
  if (m.n && m.n <= coop.ultN) return; // chegou atrasada
  if (m.n) coop.ultN = m.n;
  coop.espera = !!m.espera; coop.pausa = !!m.pausa; coop.fim = !!m.fim;
  if (m.espera || !mapa || !J || m.mv !== coop.mv) return;
  if (!coop.pronto && !m.c) return; // começa numa mensagem completa
  andar = m.andar;
  if (Math.abs(tempoJogo - m.tj) > 0.3) tempoJogo = m.tj;
  tremor = Math.max(tremor, m.tr || 0);
  if (m.fl > flashEcra) flashEcra = m.fl;
  coop.vistaHost = { w: m.vw, h: m.vh };
  if (m.eS) S = m.eS;
  if (!S) return;
  // o teu herói: a posição é tua (mexes-te logo); o resto vem do parceiro
  for (const k in m.eu) if (!LOCAIS_HEROI.has(k)) J[k] = m.eu[k];
  if (m.tp !== coop.tpLocal && m.eu.x != null) { // o jogo mexeu-te (habilidade, portal, andar novo...): segue
    J.x = m.eu.x; J.y = m.eu.y; J.kbx = 0; J.kby = 0; J.dashT = 0;
    coop.tpLocal = m.tp;
  }
  // o herói do parceiro
  const O = coop.p2;
  for (const k in m.ou) { if (k === 'x') O._tx = m.ou.x; else if (k === 'y') O._ty = m.ou.y; else O[k] = m.ou[k]; }
  if (O._tx != null && (O.x == null || Math.hypot(O.x - O._tx, O.y - O._ty) > 200)) { O.x = O._tx; O.y = O._ty; }
  if (m.oS) O._S = m.oS;
  O.remoto = true; O.dono = J; O.mapa = mapa;
  // o que morreu desfaz-se
  for (const id of m.mo || []) { const e = inimigos.find(x => x._id === id); if (e) guardarResto(e); }
  inimigos = mesclarDiff(m.ini, inimigos);
  projeteis = mesclarDiff(m.pr, projeteis);
  objetos = mesclarDiff(m.ob, objetos);
  baus = mesclarDiff(m.ba, baus);
  drops = mesclarDiff(m.dr, drops);
  perigos = mesclarDiff(m.pe, perigos); pocas = mesclarDiff(m.po, pocas); cadaveres = mesclarDiff(m.ca, cadaveres); armadilhas = mesclarDiff(m.ar, armadilhas);
  sombras = mesclarDiff(m.s2, sombras); // as tuas sombras
  O.sombrasMundo = mesclarDiff(m.s1, O.sombrasMundo || []); // as do parceiro
  coop.petOutro = mesclarDiff(m.pet, coop.petOutro ? [coop.petOutro] : [])[0] || null;
  if (m.on) ondas = ondas.concat(m.on);
  raios = m.ra || [];
  const pa = m.pa || [], co = m.co || [];
  for (let i = 0; i + 6 < pa.length; i += 7) particulas.push({ x: pa[i], y: pa[i + 1], vx: pa[i + 2], vy: pa[i + 3], t: pa[i + 4], tam: pa[i + 5], cor: co[pa[i + 6]] });
  if (particulas.length > 500) particulas.splice(0, particulas.length - 500);
  for (const t of m.tx || []) textos.push({ x: t[0], y: t[1], txt: t[2], cor: t[3], tam: t[4], t: t[5], vy: t[6] });
  boss = m.boss != null ? inimigos.find(e => e._id === m.boss) || null : null;
  if (m.ex) {
    if (!(banner && m.ban && banner.titulo === m.ban.titulo)) banner = m.ban;
    const f0 = falas[0];
    falas = m.fa || [];
    if (f0 && falas[0] && falas[0].txt === f0.txt) falas[0].t = f0.t; // a fala continua de onde estava
    Object.assign(mapa, m.md || {});
  }
  for (const s of m.so || []) {
    if (s[0] === 'r') ruido(s[1], s[2], s[3]); else som(...s);
  }
  if (m.c) coop.pronto = true;
}

// Junta o que chegou ao que já havia: as coisas novas chegam inteiras; das outras
// só vem o que mudou. Cada coisa desliza de onde estava para onde está agora.
function mesclarDiff(entradas, antigos) {
  const ant = new Map();
  for (const a of antigos || []) if (a && a._id != null) ant.set(a._id, a);
  const out = [];
  for (const d of entradas || []) {
    const o = ant.get(d._id);
    if (d._f) {
      delete d._f;
      d._tx = d.x; d._ty = d.y;
      if (o && o.x != null && Math.hypot(o.x - d.x, o.y - d.y) < 160) { d.x = o.x; d.y = o.y; if (typeof o.t === 'number' && typeof d.t === 'number') d.t = o.t; }
      out.push(d);
    } else if (o) {
      for (const k in d) { if (k === 'x') o._tx = d.x; else if (k === 'y') o._ty = d.y; else o[k] = d[k]; }
      if (o._tx != null && Math.hypot(o.x - o._tx, o.y - o._ty) > 160) { o.x = o._tx; o.y = o._ty; }
      out.push(o);
    } // (ainda não temos esta coisa inteira: aparece na próxima mensagem completa)
  }
  return out;
}

// Os menus do convidado: o anfitrião decide, o convidado desenha (e anima)
function aplicarMenu(d) {
  const ant = { roleta, loja, mesa, mochilaUI, escolha, cidade, menuMeta };
  coop.menu = MENUS_P2.includes(d.estado) ? d.estado : 'jogo';
  const r = d.roleta;
  if (r && roleta && roleta.premio && r.premio && roleta.premio.nome === r.premio.nome && roleta.idx === r.idx && roleta.desvio === r.desvio) {
    if (r.fim && !roleta.fim) { roleta.fim = true; roleta.brilho = 0; roleta.t = roleta.dur; roleta.pos = roleta.idx + 0.5 + roleta.desvio; }
  } else roleta = r || null;
  if (roleta && roleta.faixa) roleta.faixa = roleta.faixa.map(it => it || { nome: '?', r: 'lixo', tipo: 'arma' });
  loja = d.loja || null; mesa = d.mesa || null; mochilaUI = d.mochilaUI || null; cidade = d.cidade || null; menuMeta = d.menuMeta || null;
  escolha = d.escolha || null;
  if (escolha && escolha.opcoes) escolha.opcoes = escolha.opcoes.map(o => PERKS.find(p => p.id === o.id) || o);
  // as animações de entrada continuam de onde estavam
  for (const k of ['loja', 'mesa', 'mochilaUI', 'escolha', 'cidade', 'menuMeta']) {
    const a = ant[k], n = { loja, mesa, mochilaUI, escolha, cidade, menuMeta }[k];
    if (a && n && typeof a.t === 'number') n.t = a.t;
  }
}

function perdeuLigacao() {
  if (coop.papel !== 'convidado') return;
  const noJogo = estado === 'convidado';
  sairDoJogoConvidado();
  estado = 'coop';
  // a meio do jogo (ou já a tentar): volta a ligar sozinho algumas vezes
  if ((noJogo && coop.senha) || coop.religar) {
    const R = coop.religar || (coop.religar = { n: 0, t: 0 });
    if (R.n < TENTATIVAS_RELIGAR) {
      R.t = R.n ? 3 : 0.5; // espera um bocadinho antes de tentar
      coop.ecra = 'ligando';
      coop.msg = { txt: `A ligação caiu. A voltar a ligar... (${R.n + 1}/${TENTATIVAS_RELIGAR})`, cor: '#ffae00' };
      return;
    }
    coop.religar = null;
  }
  coop.ecra = 'entrar';
  coop.msg = { txt: noJogo || coop.senha ? 'A ligação caiu. Podes voltar a entrar com o mesmo código.' : 'Não foi possível entrar na sala.', cor: '#ff6060' };
}
// Tentativas de voltar a entrar (corre no ecrã da sala)
function atualizarReligar(dt) {
  const R = coop.religar;
  if (!R) return;
  if (coop.peer) { // a tentar: se em 10 s não entrou, desiste desta tentativa
    R.espera = (R.espera || 0) + dt;
    if (R.espera > 10 && estado === 'coop') { R.espera = 0; fecharRede(); perdeuLigacao(); }
    return;
  }
  R.espera = 0;
  R.t -= dt;
  if (R.t > 0) return;
  R.n++;
  coop.msg = { txt: `A voltar a ligar à sala ${coop.codigo}... (${R.n}/${TENTATIVAS_RELIGAR})`, cor: '#ffae00' };
  entrarSala();
  coop.msg = { txt: `A voltar a ligar à sala ${coop.codigo}... (${R.n}/${TENTATIVAS_RELIGAR})`, cor: '#ffae00' };
}
function sairDoJogoConvidado() {
  fecharRede();
  if (coop.metaGuardada) { meta.melhorias = coop.metaGuardada; coop.metaGuardada = null; }
  coop.menu = 'jogo'; coop.pronto = false; coop.p2 = null; coop.petOutro = null; coop.confirmarSair = false;
  roleta = loja = mesa = mochilaUI = escolha = cidade = menuMeta = null;
  J = null; mapa = null; boss = null; banner = null; falas = []; sombras = [];
}
function sairConvidado() {
  sairDoJogoConvidado();
  coop.papel = null; coop.senha = null; coop.religar = null;
  estado = 'titulo';
}

// O convidado: mexe o herói logo (sem esperar pela rede), anima tudo entre as
// mensagens e envia os botões
const BOTAO_SAIR_COOP = { x: LARGURA / 2 - 75, y: 6, w: 150, h: 30 };
function atualizarConvidado(dt) {
  if (!convidadoPronto()) { if (clicou(BOTAO_SAIR_COOP)) sairConvidado(); return; }
  tempoJogo += dt;
  const O = coop.p2;
  O.mapa = mapa; O.dono = J;
  // tudo desliza para onde o anfitrião diz
  const k = 1 - Math.exp(-dt * 16);
  const deslizar = e => { if (e && e._tx != null) { e.x += (e._tx - e.x) * k; e.y += (e._ty - e.y) * k; } };
  for (const l of [inimigos, objetos, baus, drops, sombras, O.sombrasMundo || []]) for (const e of l) { deslizar(e); if (typeof e.t === 'number') e.t += dt; if (e.flash > 0) e.flash -= dt; }
  for (const p of projeteis) { if (p._tx != null) { p._tx += (p.vx || 0) * dt; p._ty += (p.vy || 0) * dt; } deslizar(p); }
  deslizar(coop.petOutro);
  if (O._tx != null) { deslizar(O); }
  atualizarEfeitos(dt);
  if (falas.length) falas[0].t += dt;
  atualizarRestos(dt);
  atualizarHeroiVivo(dt);
  atualizarEfeitosEcra(dt);
  // os menus do convidado: animação local; toques e teclas vão para o anfitrião
  if (coop.menu !== 'jogo') {
    if (roleta) {
      roleta.brilho = (roleta.brilho || 0) + dt;
      if (!roleta.fim) {
        roleta.t = (roleta.t || 0) + dt;
        const p = Math.min(1, roleta.t / roleta.dur);
        roleta.pos = (1 - Math.pow(1 - p, 4)) * (roleta.idx + 0.5 + roleta.desvio);
      }
    }
    for (const o of [loja, mesa, mochilaUI, escolha, cidade, menuMeta]) {
      if (!o) continue;
      if (typeof o.t === 'number') o.t += dt;
      if (o.msg && typeof o.msg.t === 'number') { o.msg.t -= dt; if (o.msg.t <= 0) o.msg = null; }
    }
    const clique = premiu('rato'), chave = `${Math.round(rato.x)},${Math.round(rato.y)}`;
    if (clique || chave !== coop.ultRato) { enviarCoop({ t: 'rato', x: Math.round(rato.x), y: Math.round(rato.y), clique }); coop.ultRato = chave; }
    for (const q in premidas) if (q !== 'rato') enviarCoop({ t: 'tecla', k: q });
    enviarPosicao(dt, false, true);
    return;
  }
  // o botão de pausa do convidado pergunta se quer sair (o jogo continua para o parceiro)
  if (premiu('p', 'escape')) coop.confirmarSair = !coop.confirmarSair;
  if (coop.confirmarSair) {
    if (clicou(BOTOES_CONFIRMAR.sim) || premiu('x')) { coop.confirmarSair = false; sairConvidado(); return; }
    if (clicou(BOTOES_CONFIRMAR.nao)) coop.confirmarSair = false;
    J.andando = false;
    enviarPosicao(dt, false, true);
    return;
  }
  if (coop.espera) return;
  // o teu herói mexe-se já (o parceiro confirma depois)
  let mx = 0, my = 0, forca = 1;
  if (teclas['w'] || teclas['arrowup']) my -= 1;
  if (teclas['s'] || teclas['arrowdown']) my += 1;
  if (teclas['a'] || teclas['arrowleft']) mx -= 1;
  if (teclas['d'] || teclas['arrowright']) mx += 1;
  const js = lerJoystick();
  if (js) { mx = js.x; my = js.y; forca = js.forca; }
  const atk = !!(toque.atacar || comando.atacar || teclas[' '] || teclas['j']);
  const acao = a => enviarCoop({ t: 'acao', a });
  J.cdDash = (J.cdDash || 0) - dt;
  J.cdAtaque = (J.cdAtaque || 0) - dt;
  if (J.lentoT > 0) J.lentoT -= dt;
  if (J.caido) { mx = my = 0; J.golpe = null; }
  else {
    if (mx || my) {
      const l = Math.hypot(mx, my);
      mx /= l; my /= l;
      J.dirX = mx; J.dirY = my;
      if (!J.golpe) J.angArma = Math.atan2(my, mx);
      mx *= forca; my *= forca;
    }
    if (premiu('shift') && J.cdDash <= 0) {
      const dx = (mx || my) ? mx : J.dirX, dy = (mx || my) ? my : J.dirY, l = Math.hypot(dx, dy) || 1;
      J.dashT = 0.16; J.dashVX = dx / l * 560; J.dashVY = dy / l * 560; J.cdDash = S.cdDash;
      som(500, 0.12, 'sine', 0.04, -300);
      acao('dash');
    }
    const fLento = (J.lentoT > 0 ? 0.5 : 1) * fatorTerreno();
    if (J.dashT > 0) {
      J.dashT -= dt;
      moverEntidade(mapa, J, J.dashVX * dt, J.dashVY * dt);
    } else moverEntidade(mapa, J, (mx * S.vel * fLento + (J.kbx || 0)) * dt, (my * S.vel * fLento + (J.kby || 0)) * dt);
    J.kbx = (J.kbx || 0) * Math.max(0, 1 - dt * 10);
    J.kby = (J.kby || 0) * Math.max(0, 1 - dt * 10);
    // o golpe vê-se logo (o dano é contado no telemóvel do parceiro)
    if (atk && J.cdAtaque <= 0 && J.arma) {
      const a = alvoMelhor(S.alcance + J.r + 80);
      const ang = a ? Math.atan2(a.y - J.y, a.x - J.x) : Math.atan2(J.dirY, J.dirX);
      const classe = classeArma(J.arma);
      J.cdAtaque = S.cdAtaque;
      J.angArma = ang;
      if (classe !== 'arco') J.golpe = { ang, t: 0.15, dur: 0.15, alcance: S.alcance + J.r, giro: false, estilo: classe };
    }
    if (premiu('q')) acao('pocao');
    if (premiu('f')) acao('classe');
    for (let i = 0; i < 4; i++) if (premiu(String(1 + i))) acao('f' + i);
    for (let i = 0; i < 4; i++) if (premiu(String(5 + i))) acao('h' + i);
    if (premiu('e')) acao('usar');
    if (premiu('i')) acao('mochila');
    if (premiu('c')) acao('personagem');
    if (premiu('tab')) acao('mapa');
  }
  if (J.golpe) { J.golpe.t -= dt; if (J.golpe.t <= 0) J.golpe = null; }
  J.andando = !!(mx || my);
  // não te afastes demasiado do parceiro (os dois têm de caber no ecrã)
  if (O._tx != null) {
    const V = coop.vistaHost || { w: vistaW(), h: vistaH() };
    const lx = Math.min(vistaW(), V.w) - 110, ly = Math.min(vistaH(), V.h) - 110;
    const dx = J.x - O._tx, dy = J.y - O._ty;
    const ex = Math.abs(dx) > lx ? dx - Math.sign(dx) * lx : 0, ey = Math.abs(dy) > ly ? dy - Math.sign(dy) * ly : 0;
    if (ex || ey) moverEntidade(mapa, J, -ex, -ey);
  }
  revelar(mapa, J.x, J.y, 7);
  J.bauPerto = bauPerto(J); J.objPerto = objetoPerto(J);
  J.escadaPerto = !!(mapa.escada && Math.hypot(mapa.escada.x - J.x, mapa.escada.y - J.y) < 40);
  // a câmara fica no meio dos dois
  const fx = O._tx != null ? (J.x + O.x) / 2 : J.x, fy = O._tx != null ? (J.y + O.y) / 2 : J.y;
  const alvoX = clamp(fx - vistaW() / 2, 0, mapa.W * TILE - vistaW()), alvoY = clamp(fy - vistaH() / 2, 0, mapa.H * TILE - vistaH());
  cam.x += (alvoX - cam.x) * Math.min(1, dt * 8);
  cam.y += (alvoY - cam.y) * Math.min(1, dt * 8);
  enviarPosicao(dt, atk, false);
}
function enviarPosicao(dt, atk, parado) {
  coop.posT = (coop.posT || 0) - dt;
  if (coop.posT > 0) return;
  coop.posT = 1 / 40;
  enviarRapido({ t: 'p', x: Math.round(J.x * 10) / 10, y: Math.round(J.y * 10) / 10, dx: arred(J.dirX), dy: arred(J.dirY), an: !parado && !!J.andando,
    tp: coop.tpLocal, atk: !parado && atk, vw: Math.round(vistaW()), vh: Math.round(vistaH()) });
}

// Ecrã do convidado enquanto espera (a ligar, parceiro na pausa...)
function desenharConvidado(t) {
  ctx = ctxTela;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, 0, TELA_W, ALTURA);
  ctx.setTransform(1, 0, 0, 1, MARGEM_X, 0);
  textoCentro(coop.espera ? 'O teu parceiro está nos menus...' : 'A carregar o jogo do teu parceiro...', LARGURA / 2, ALTURA / 2 - 10, 20, '#ddd');
  botao(BOTAO_SAIR_COOP, 'Sair da sala', '#ff8080', 'rgba(18,14,28,0.85)', 'fechar');
}
const convidadoPronto = () => !!(coop.pronto && mapa && J && S && coop.p2);

// Por cima do jogo, no telemóvel do convidado: os menus dele e os avisos
function desenharExtrasConvidado(t) {
  const D = { bau: () => roleta && desenharRoleta(t), nivel: () => escolha && desenharEscolha(t), loja: () => loja && desenharLoja(t), encantar: () => mesa && desenharMesa(t),
    personagem: () => desenharPersonagem(), mochila: () => mochilaUI && desenharMochila(), cidade: () => cidade && desenharPainelCidade(t), mapa: () => desenharMapaGrande() }[coop.menu];
  if (D) D();
  if (coop.espera) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
    textoCentro(coop.fim ? 'Fim do jogo! Espera que o teu parceiro recomece' : coop.pausa ? 'O teu parceiro pôs o jogo em pausa' : 'O teu parceiro está nos menus...', LARGURA / 2, ALTURA / 2, 20, '#ffe680');
  }
  if (J.caido && coop.menu === 'jogo' && Math.floor(t * 2) % 2) textoCentro('CAÍSTE! O teu parceiro pode reanimar-te', LARGURA / 2, 150, 18, '#ff6060');
  if (coop.confirmarSair) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-MARGEM_X, 0, TELA_W, ALTURA);
    painel(250, 250, 460, 170);
    textoCentro('Sair da sala?', LARGURA / 2, 290, 24, '#ffe14d');
    textoCentro('O teu parceiro continua a jogar sozinho', LARGURA / 2, 322, 14, '#ccc', false);
    botao(BOTOES_CONFIRMAR.sim, 'Sair da sala', '#ff8080', undefined, 'fechar');
    botao(BOTOES_CONFIRMAR.nao, 'Continuar', '#5dff7a', undefined, 'jogar');
  }
}

// ---------------------------------------------------------------------
//  Sala (menu "Jogar a 2")
// ---------------------------------------------------------------------
const BOTOES_COOP = {
  criar: { x: 300, y: 340, w: 360, h: 48 },
  entrar: { x: 300, y: 402, w: 360, h: 48 },
  novo: { x: 250, y: 470, w: 220, h: 44 },
  continuar: { x: 490, y: 470, w: 220, h: 44 },
  fechar: { x: 370, y: 530, w: 220, h: 40 },
  apagar: { x: 250, y: 560, w: 200, h: 44 },
  seguinte: { x: 510, y: 560, w: 200, h: 44 },
  entrarJogo: { x: 360, y: 560, w: 240, h: 44 },
};
const retLetraSala = i => ({ x: 176 + (i % 8) * 78, y: 290 + Math.floor(i / 8) * 64, w: 70, h: 56 });
const retClasseCoop = i => ({ x: 30 + (i % 4) * 228, y: 170 + Math.floor(i / 4) * 124, w: 220, h: 110 });

function abrirCoop() {
  estado = 'coop';
  if (coop.papel === 'anfitriao') coop.ecra = 'criar';
  else { coop.ecra = 'menu'; coop.msg = null; }
  rato.baixo = false;
}

function atualizarLobby(dt) {
  const E = coop.ecra;
  atualizarReligar(dt);
  if (premiu('escape') || clicou(BOTAO_VOLTAR)) {
    if (E === 'classe') coop.ecra = 'entrar';
    else if (E === 'entrar' || E === 'ligando') { if (E === 'ligando') fecharRede(); coop.religar = null; coop.senha = null; coop.papel = null; coop.ecra = 'menu'; coop.msg = null; }
    else estado = 'titulo';
    return;
  }
  if (E === 'menu') {
    if (clicou(BOTOES_COOP.criar)) criarSala();
    else if (clicou(BOTOES_COOP.entrar)) { coop.ecra = 'entrar'; coop.codigo = ''; coop.msg = null; }
  } else if (E === 'criar') {
    if (clicou(BOTOES_COOP.novo) && coop.codigo) { modoProximo = null; abrirCriacao(); }
    else if (saveInfo && coop.codigo && clicou(BOTOES_COOP.continuar)) continuarJogo();
    else if (clicou(BOTOES_COOP.fechar)) { fecharSala(); coop.ecra = 'menu'; coop.msg = null; }
  } else if (E === 'entrar') {
    for (let i = 0; i < LETRAS_SALA.length; i++) {
      const L = LETRAS_SALA[i];
      if ((clicou(retLetraSala(i)) || premiu(L.toLowerCase())) && coop.codigo.length < 4) { coop.codigo += L; coop.msg = null; }
    }
    if ((clicou(BOTOES_COOP.apagar) || premiu('backspace')) && coop.codigo.length) coop.codigo = coop.codigo.slice(0, -1);
    if (coop.codigo.length === 4 && (clicou(BOTOES_COOP.seguinte) || premiu('enter'))) {
      coop.ecra = 'classe';
      if (!CLASSES_CONVIDADO.includes(coop.classeConvidado)) coop.classeConvidado = CLASSES_CONVIDADO.includes(escolhaClasse) ? escolhaClasse : 'aventureiro';
    }
  } else if (E === 'classe') {
    CLASSES_CONVIDADO.forEach((id, i) => { if (clicou(retClasseCoop(i))) coop.classeConvidado = id; });
    if (clicou(BOTOES_COOP.entrarJogo) || premiu('enter')) entrarSala();
  }
}

function desenharLobby(t) {
  botao(BOTAO_VOLTAR, '< Voltar', '#ddd');
  textoCentro('JOGAR A 2', LARGURA / 2, 60, 36, '#ffe14d');
  const E = coop.ecra;
  if (E === 'menu') {
    painel(170, 110, 620, 210);
    textoCentro('Dois telemóveis, a mesma masmorra', LARGURA / 2, 140, 18, '#9fdcff');
    [
      'Quem cria a sala joga no seu telemóvel.',
      'O outro vê o jogo no telemóvel dele e controla o 2.º herói.',
      'Os monstros atacam o herói mais perto e a XP é dos dois.',
      'Se um cair, o outro reanima-o ficando ao lado dele.',
      'Precisam os dois de internet.',
    ].forEach((l, i) => textoCentro(l, LARGURA / 2, 178 + i * 26, 14, '#ddd', false));
    botao(BOTOES_COOP.criar, 'Criar sala', '#ffe14d', undefined, 'novo');
    botao(BOTOES_COOP.entrar, 'Entrar numa sala', '#5dff7a', undefined, 'jogar');
  } else if (E === 'criar') {
    painel(170, 110, 620, 330);
    if (coop.codigo) {
      textoCentro('Código da sala', LARGURA / 2, 146, 18, '#ccc', false);
      coop.codigo.split('').forEach((L, i) => {
        const x = LARGURA / 2 - 150 + i * 80 + 30;
        painel(x - 32, 170, 64, 76, 'rgba(10,8,18,0.95)', '#ffe14d');
        textoCentro(L, x, 210, 44, '#ffe14d');
      });
      textoCentro('Diz este código ao teu amigo.', LARGURA / 2, 282, 15, '#ddd', false);
      textoCentro('No telemóvel dele: Jogar a 2 → Entrar numa sala.', LARGURA / 2, 306, 15, '#ddd', false);
      const p = coop.conn ? (coop.escolhaP2 ? `Parceiro ligado: ${traduzir((CLASSES[coop.escolhaP2.classe] || CLASSES.aventureiro).nome)}` : 'O parceiro está a entrar...') : `À espera do parceiro${'.'.repeat(Math.floor(t * 2) % 4)}`;
      textoCentro(p, LARGURA / 2, 350, 17, coop.conn ? '#5dff7a' : '#ffae00');
      textoCentro('Podes começar já: ele entra quando quiser.', LARGURA / 2, 390, 13, '#999', false);
      botao(BOTOES_COOP.novo, 'Novo jogo', '#ffe14d', undefined, 'novo');
      if (saveInfo) botao(BOTOES_COOP.continuar, 'Continuar', '#5dff7a', undefined, 'jogar');
    }
    if (coop.msg) textoCentro(coop.msg.txt, LARGURA / 2, coop.codigo ? 430 : 260, 16, coop.msg.cor, false);
    botao(BOTOES_COOP.fechar, 'Fechar sala', '#ff8080', undefined, 'fechar');
  } else if (E === 'entrar' || E === 'ligando') {
    textoCentro('Escreve o código da sala', LARGURA / 2, 110, 18, '#ccc', false);
    for (let i = 0; i < 4; i++) {
      const x = LARGURA / 2 - 150 + i * 80 + 30, L = coop.codigo[i];
      painel(x - 32, 136, 64, 76, 'rgba(10,8,18,0.95)', L ? '#5dff7a' : i === coop.codigo.length && Math.floor(t * 2) % 2 ? '#ffffff' : '#3a3150');
      if (L) textoCentro(L, x, 176, 44, '#5dff7a');
    }
    if (coop.msg) textoCentro(coop.msg.txt, LARGURA / 2, 250, 16, coop.msg.cor, false);
    if (E === 'entrar') {
      for (let i = 0; i < LETRAS_SALA.length; i++) {
        const r = retLetraSala(i);
        painel(r.x, r.y, r.w, r.h, dentro(r) ? 'rgba(40,34,60,0.97)' : 'rgba(18,14,28,0.95)', dentro(r) ? '#ffffff' : '#3a3150');
        textoCentro(LETRAS_SALA[i], r.x + r.w / 2, r.y + r.h / 2, 24, '#eee');
      }
      botao(BOTOES_COOP.apagar, 'Apagar', '#ddd', undefined, 'voltar');
      botao(BOTOES_COOP.seguinte, 'Seguinte', coop.codigo.length === 4 ? '#5dff7a' : '#555', undefined, 'jogar');
    }
  } else if (E === 'classe') {
    textoCentro(`Escolhe o teu caçador (sala ${coop.codigo})`, LARGURA / 2, 110, 18, '#ccc', false);
    CLASSES_CONVIDADO.forEach((id, i) => desenharCartaoClasse(retClasseCoop(i), id, coop.classeConvidado === id));
    botao(BOTOES_COOP.entrarJogo, 'Entrar no jogo', '#5dff7a', undefined, 'jogar');
  }
}
