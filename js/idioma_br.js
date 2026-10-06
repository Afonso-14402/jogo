'use strict';
// =====================================================================
//  IDIOMA: português do Brasil
//  O jogo está escrito em português de Portugal; no Brasil entende-se tudo,
//  por isso aqui só se trocam as palavras que lá se dizem de outra maneira
//  (celular, tela, salvar, conexão...). Troca sempre palavras inteiras.
// =====================================================================

const BR = {
  // aparelho e opções
  'telemóveis': 'celulares', 'telemóvel': 'celular', 'Telemóvel': 'Celular',
  'Ecrã inteiro': 'Tela cheia', 'ecrã inteiro': 'tela cheia', 'ecrã principal': 'tela inicial',
  'ecrãs': 'telas', 'ecrã': 'tela', 'Ecrã': 'Tela',
  'rato': 'mouse', 'Rato': 'Mouse', 'browser': 'navegador', 'Controlos': 'Controles', 'controlos': 'controles',
  'Poupança de bateria': 'Economia de bateria', 'Partilhar': 'Compartilhar', 'Registo': 'Registro',
  // guardar o jogo
  'Guardar e sair': 'Salvar e sair', 'Guardar o jogo': 'Salvar o jogo', 'guardas o jogo': 'salva o jogo',
  'guarda sozinho': 'salva sozinho', 'o jogo guardado': 'o jogo salvo', 'a gravação': 'o jogo salvo',
  // teclas
  'Carrega': 'Aperte', 'carrega': 'aperte',
  // jogar a 2
  'JOGAR A 2': 'JOGAR EM DUPLA', 'Jogar a 2': 'Jogar em Dupla', 'jogar a 2': 'jogar em dupla',
  'a jogar a 2': 'jogando em dupla', 'Joga a 2': 'Jogue em dupla', 'para a equipa': 'para a equipe', 'de equipa': 'de equipe',
  'Comando ligado': 'Controle conectado',
  'Ligação': 'Conexão', 'ligação': 'conexão', 'Sem ligação': 'Sem conexão', 'Parceiro ligado': 'Parceiro conectado',
  'A ligar à sala': 'Conectando à sala', 'A voltar a ligar à sala': 'Reconectando à sala', 'A voltar a ligar': 'Reconectando',
  // "a + infinitivo" → gerúndio
  'A carregar': 'Carregando', 'A criar': 'Criando', 'A abrir': 'Abrindo', 'A recomeçar': 'Reiniciando',
  'está a entrar': 'está entrando', 'está a olhar': 'está olhando', 'estou à espera': 'estou esperando',
  // ortografia do Brasil
  'Perceção': 'Percepção', 'Bónus': 'Bônus', 'prémio': 'prêmio', 'Prémio': 'Prêmio', 'prémios': 'prêmios', 'PRÉMIO': 'PRÊMIO',
  'Demónio': 'Demônio', 'demónios': 'demônios', 'DEMÓNIO': 'DEMÔNIO', 'Fénix': 'Fênix', 'FÉNIX': 'FÊNIX',
  'Dracónico': 'Dracônico', 'Dracónica': 'Dracônica', 'Gémeas': 'Gêmeas', 'Gémeos': 'Gêmeos',
  // "tu" de Portugal → "você" do Brasil (verbos na 3.ª pessoa)
  'Ainda não tens': 'Você ainda não tem', 'Não tens': 'Você não tem', 'não tens': 'não tem', 'Já tens': 'Você já tem', 'já tens': 'já tem',
  'Tens': 'Você tem', 'tens': 'tem', 'Tu': 'Você', 'tu': 'você', 'para ti': 'para você', 'contigo': 'com você',
  'O teu': 'O seu', 'o teu': 'o seu', 'A tua': 'A sua', 'a tua': 'a sua', 'teu': 'seu', 'tua': 'sua', 'teus': 'seus', 'tuas': 'suas', 'TUA': 'SUA', 'TEU': 'SEU',
  'Estás': 'Você está', 'estás': 'está', 'és': 'é', 'Podes': 'Você pode', 'podes': 'pode', 'Precisas': 'Você precisa', 'precisas': 'precisa',
  'Sentes': 'Você sente', 'sentes': 'sente', 'Ganhas': 'Você ganha', 'ganhas': 'ganha', 'Perdes': 'Você perde', 'perdes': 'perde',
  'Levas': 'Você leva', 'levas': 'leva', 'Ficas': 'Você fica', 'ficas': 'fica', 'Voltas': 'Você volta', 'voltas': 'volta',
  'morres': 'morre', 'queres': 'quer', 'sabes': 'sabe', 'vês': 'vê', 'matas': 'mata', 'consegues': 'consegue', 'vais': 'vai', 'fazes': 'faz',
  'descansas': 'descansa', 'guardas': 'guarda', 'desistes': 'desiste', 'abres': 'abre', 'usas': 'usa', 'escolhes': 'escolhe', 'sobes': 'sobe',
  'desces': 'desce', 'entras': 'entra', 'sais': 'sai', 'compras': 'compra', 'jogas': 'joga', 'chegas': 'chega', 'tocas': 'toca', 'vences': 'vence',
  // futuro do conjuntivo: "quando tiveres" → "quando tiver"
  'tiveres': 'tiver', 'estiveres': 'estiver', 'fores': 'for', 'comprares': 'comprar', 'esquivares': 'esquivar', 'desceres': 'descer',
  'abrires': 'abrir', 'matares': 'matar', 'voltares': 'voltar', 'receberes': 'receber', 'recuperares': 'recuperar', 'tocares': 'tocar',
  'chegares': 'chegar', 'caíres': 'cair', 'entrares': 'entrar', 'saíres': 'sair', 'usares': 'usar', 'ganhares': 'ganhar', 'morreres': 'morrer',
  // pretérito: "morreste" → "você morreu"
  'MORRESTE': 'VOCÊ MORREU', 'Morreste': 'Você morreu', 'morreste': 'morreu', 'SUBISTE': 'VOCÊ SUBIU', 'DESISTISTE': 'VOCÊ DESISTIU',
  'VENCESTE': 'VOCÊ VENCEU', 'Venceste': 'Você venceu', 'venceste': 'venceu', 'CONQUISTASTE': 'VOCÊ CONQUISTOU', 'Conquistaste': 'Você conquistou',
  'Encontraste': 'Você encontrou', 'encontraste': 'encontrou', 'Chegaste': 'Você chegou', 'chegaste': 'chegou', 'Equipaste': 'Você equipou',
  'Voltaste': 'Você voltou', 'voltaste': 'voltou', 'Entraste': 'Você entrou', 'entraste': 'entrou', 'estiveste': 'esteve',
  'Forjaste': 'Você forjou', 'Vendeste': 'Você vendeu', 'vendeste': 'vendeu', 'Ganhaste': 'Você ganhou', 'ganhaste': 'ganhou',
  'Aprendeste': 'Você aprendeu', 'Perdeste': 'Você perdeu', 'perdeste': 'perdeu', 'mataste': 'matou', 'Ficaste': 'Você ficou', 'ficaste': 'ficou',
  'acabaste': 'acabou', 'Recuperaste': 'Você recuperou', 'cumpriste': 'cumpriu', 'descansaste': 'descansou', 'Dormiste': 'Você dormiu',
  'bebeste': 'bebeu', 'jogaste': 'jogou', 'Conseguiste': 'Você conseguiu', 'Apanhaste': 'Você pegou', 'lutaste': 'lutou',
  'pescaste': 'pescou', 'fizeste': 'fez', 'Compraste': 'Você comprou', 'compraste': 'comprou', 'Caíste': 'Você caiu', 'CAÍSTE': 'VOCÊ CAIU',
  'abriste': 'abriu', 'Abriste': 'Você abriu', 'Desbloqueaste': 'Você desbloqueou', 'desbloqueaste': 'desbloqueou',
  // outras palavras
  'sítio': 'lugar', 'depressa': 'rápido', 'Apanha': 'Pega', 'apanha': 'pega', 'apanhado': 'coletado', 'apanhadas': 'coletadas',
};
