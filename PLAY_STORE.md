# Pôr a Masmorra do Destino na Play Store

## O que já está feito

- **App Android** (pasta `android/`): o jogo vai dentro da app e funciona sem internet.
  - Ocupa o ecrã todo, sem as barras do Android, e fica sempre deitado.
  - O ecrã não se apaga enquanto jogas.
  - O botão **voltar** do Android põe em pausa, fecha os menus e sai no menu inicial.
- **Ícones e ecrã de arranque** desenhados com os sprites do jogo (`scripts/gerar-icones-android.js`).
- **Construção automática no GitHub** (`.github/workflows/android.yml`). Cada vez que o jogo muda, o GitHub faz:
  - um **APK de teste**, para instalar direto no telemóvel;
  - com a chave nos segredos, o ficheiro **.aab assinado** que se envia para a Play Store.
  - A versão sobe sozinha (1.0.1, 1.0.2...), como a Play Store exige.
- **Imagens da loja** (pasta `loja/`, feitas com `scripts/gerar-loja.js`):
  - ícone 512x512;
  - gráfico de destaque 1024x500;
  - 8 capturas de ecrã 1920x1080 em português e em inglês.
- **Política de privacidade**: `privacidade.html`, em https://afonso-14402.github.io/jogo/privacidade.html
- **Textos da loja** em português e inglês: estão mais abaixo.

## O que tens de fazer (passo a passo)

### 1. Conta de programador Google Play

- Cria-a em https://play.google.com/console. Custa **25 dólares, uma vez só**.
- A conta tem de ser de um **adulto (18 anos ou mais)** e a Google pede um documento de identificação. Se tiveres menos de 18, pede a alguém da família para a criar.
- Escolhe o tipo **Pessoal**.
- **Contas pessoais novas** têm de fazer primeiro um **teste fechado**: pelo menos **12 pessoas** instalam a app e ficam inscritas durante **14 dias seguidos**. Só depois podes pedir para publicar para toda a gente.

### 2. Pôr a chave da app no GitHub

A chave (`masmorra-upload.p12`) e as palavras-passe estão no ficheiro `SEGREDOS-LE-ME.txt`, que te enviei à parte. **Não estão no repositório**, de propósito.

1. Guarda os dois ficheiros num sítio seguro, por exemplo numa pen e no teu Google Drive. Sem a chave não consegues enviar atualizações. A Google consegue trocá-la, mas demora dias.
2. No GitHub, abre o repositório e vai a **Settings → Secrets and variables → Actions → New repository secret**.
3. Cria estes 4 segredos com os valores do `SEGREDOS-LE-ME.txt`:
   - `ANDROID_KEYSTORE_BASE64`: o texto todo do ficheiro `ANDROID_KEYSTORE_BASE64.txt`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`: é `masmorra`
   - `ANDROID_KEY_PASSWORD`
4. Vai a **Actions → App Android → Run workflow**.
5. Quando acabar (uns 3 minutos), abre essa execução e descarrega **masmorra-play-store-N**. Lá dentro está o ficheiro `.aab`.

### 3. Experimentar no teu telemóvel (antes da loja)

1. No telemóvel Android, abre **https://github.com/Afonso-14402/jogo/releases/download/teste/masmorra-do-destino.apk**. É sempre a versão mais recente, e o GitHub atualiza-a sozinho.
2. Abre o ficheiro descarregado. O Android pergunta se deixa instalar apps desta origem: **Definições → Permitir desta origem**, e depois volta atrás.
3. Toca em **Instalar**. Se aparecer um aviso do **Play Protect**, toca em **Mais detalhes → Instalar mesmo assim**. O aviso aparece só porque a app ainda não está na Play Store.

### 4. Criar a app na Play Console

**Criar app**:

| Campo | Valor |
|---|---|
| Nome | Masmorra do Destino |
| Idioma predefinido | Português (Portugal) |
| App ou jogo | Jogo |
| Gratuita ou paga | Gratuita |

### 5. Conteúdo da app (os formulários)

| Formulário | Resposta |
|---|---|
| Política de privacidade | `https://afonso-14402.github.io/jogo/privacidade.html` |
| Anúncios | **Não** tem anúncios |
| Acesso à app | Tudo está disponível sem conta nem login |
| Público-alvo | **13 anos ou mais**. Se escolheres crianças, as regras são muito mais apertadas. |
| Apps de notícias, saúde, governo, finanças | Não |

**Classificação de conteúdo** (questionário), categoria **Jogo**:

| Pergunta | Resposta |
|---|---|
| Violência | Sim, de fantasia: um herói em pixel art luta contra monstros, sem sangue realista |
| Linguagem imprópria, conteúdo sexual, drogas | Não |
| Jogo a dinheiro | Não. Os baús usam só moedas do jogo e **não há compras**. |
| Os utilizadores interagem? | Sim, no modo **Jogar a 2**: jogam juntos, **sem chat** e sem trocar dados pessoais |

**Segurança dos dados**:

| Pergunta | Resposta |
|---|---|
| A app recolhe ou partilha dados dos utilizadores? | **Não**. O progresso fica só no telemóvel. |
| Os dados são encriptados em trânsito? | Sim. A ligação do Jogar a 2 é encriptada (WebRTC). |
| Os utilizadores podem pedir para apagar dados? | Não há dados guardados fora do telemóvel. Desinstalar a app apaga tudo. |

### 6. Ficha da loja

| Campo | Ficheiro ou texto |
|---|---|
| Ícone da app | `loja/icone-512.png` |
| Gráfico de destaque | `loja/grafico-destaque-1024x500.png` |
| Capturas de ecrã do telemóvel | as 8 de `loja/capturas-pt/` (e as de `loja/capturas-en/` na ficha em inglês) |
| Categoria | Jogos → **RPG** |
| Email de contacto | o da conta de programador |

Os textos (título e descrições) estão mais abaixo.

### 7. Enviar a app

1. Vai a **Testes → Teste fechado → Criar versão** e envia o ficheiro `.aab`.
2. Na primeira vez, aceita a **Assinatura de apps do Google Play**: a Google guarda a chave final; a tua é só a de envio.
3. Junta os emails dos testadores (pelo menos 12) e manda-lhes o link de adesão.
4. Passados **14 dias** com eles inscritos, pede o **acesso à produção** e publica.

### 8. Atualizações

1. Mudas o jogo e envias para o GitHub.
2. O GitHub constrói sozinho uma versão nova, com número maior.
3. Descarregas o novo `.aab` em Actions e envias na Play Console, em **Criar nova versão**.

---

## Textos da loja

### Português

**Título (máx. 30):** Masmorra do Destino

**Descrição breve (máx. 80):** RPG de masmorras em pixel art: 60 andares, bosses, baús da sorte e co-op a 2!

**Descrição completa:**

> Desce a Masmorra do Destino, um RPG de ação em pixel art feito para jogar no telemóvel.
>
> ⚔️ **10 caçadores diferentes**, cada um com a sua arma, habilidade única e habilidades próprias: do Caçador das Sombras, que ergue um exército dos monstros que derrota, ao Guardião do Tempo, que para o tempo e volta atrás.
>
> 🐉 **60 andares e 12 bosses**: dragões, liches, rainhas aranha, anjos caídos e o Soberano do Vazio no fim de tudo. Cada zona tem monstros, armadilhas e cenários próprios.
>
> 🎁 **Baús da sorte**: cada baú gira uma roleta que pode dar o PIOR ou o MELHOR item do jogo. Há mais de 100 itens para colecionar, do Lixo ao Mítico, com encantamentos e maldições.
>
> 👥 **Jogar a 2**: cria uma sala, diz o código a um amigo e desçam juntos. Os monstros atacam o herói mais perto, a XP é dos dois e quem cai pode ser reanimado. Se a ligação cair, o teu amigo volta sozinho com o mesmo herói.
>
> 🏰 **Portais de rank E a SSS**, a Cidade dos Caçadores, companheiros que evoluem, relíquias, conjuntos de equipamento, mudança de classe no nível 30, Desafio Diário, Torre dos 100 Andares e Boss Rush.
>
> 📱 Controlos de toque pensados para o telemóvel, com joystick analógico e letra grande. Em português, português do Brasil, inglês e espanhol. Funciona sem internet (a internet só é precisa para jogar a 2).
>
> Sem anúncios. Sem compras. Só masmorra.

### English

**Title:** Dungeon of Destiny (Masmorra do Destino)

**Short description:** Pixel-art dungeon RPG: 60 floors, bosses, lucky chests and 2-player co-op!

**Full description:**

> Descend into the Dungeon of Destiny, a pixel-art action RPG made for your phone.
>
> ⚔️ **10 different hunters**, each with their own weapon, unique ability and skills: from the Shadow Hunter, who raises an army from defeated monsters, to the Time Guardian, who stops time and rewinds it.
>
> 🐉 **60 floors and 12 bosses**: dragons, liches, spider queens, fallen angels and the Void Sovereign at the very bottom. Every zone has its own monsters, traps and scenery.
>
> 🎁 **Lucky chests**: every chest spins a roulette that can give the WORST or the BEST item in the game. More than 100 items to collect, from Junk to Mythic, with enchantments and curses.
>
> 👥 **2-Player Co-op**: create a room, tell a friend the code and go down together. Monsters attack the closest hero, XP is shared and a fallen hero can be revived.
>
> 🏰 **E to SSS rank portals**, the Hunters' City, pets that evolve, relics, gear sets, class change at level 30, Daily Challenge, Tower of 100 Floors and Boss Rush.
>
> 📱 Touch controls made for phones, with an analog joystick. Works offline (internet is only needed for co-op).
>
> No ads. No purchases. Just dungeon.

### Español

**Título:** Mazmorra del Destino (Masmorra do Destino)

**Descripción breve (máx. 80):** RPG de mazmorras pixel art: 60 pisos, jefes, cofres de la suerte y cooperativo.

**Descripción completa:**

> Baja a la Mazmorra del Destino, un RPG de acción en pixel art hecho para jugar en el móvil.
>
> ⚔️ **10 cazadores diferentes**, cada uno con su arma, habilidad única y habilidades propias: desde el Cazador de las Sombras, que levanta un ejército con los monstruos que derrota, hasta el Guardián del Tiempo, que detiene el tiempo y lo rebobina.
>
> 🐉 **60 pisos y 12 jefes**: dragones, liches, reinas araña, ángeles caídos y el Soberano del Vacío al final de todo.
>
> 🎁 **Cofres de la suerte**: cada cofre gira una ruleta que puede dar el PEOR o el MEJOR objeto del juego. Más de 100 objetos para coleccionar, de Basura a Mítico, y una forja para subir su rareza.
>
> 👥 **Jugar a 2**: crea una sala, dile el código a un amigo y bajad juntos. Si se corta la conexión, vuelve solo con el mismo héroe.
>
> 🏰 Portales de rango E a SSS, la Ciudad de los Cazadores, compañeros que evolucionan, reliquias, misiones diarias y semanales, Desafío Diario, Torre de los 100 Pisos y Boss Rush.
>
> 📱 Controles táctiles con joystick analógico y letra grande opcional. Funciona sin internet (solo el modo a 2 necesita internet).
>
> Sin anuncios. Sin compras.

### Português do Brasil

**Descrição breve (máx. 80):** RPG de masmorras em pixel art: 60 andares, chefes, baús da sorte e jogo em dupla!

Para a descrição completa, usa o texto em português de cima trocando: *telemóvel → celular*, *Jogar a 2 → Jogar em Dupla*, *ecrã → tela*.

---

## Para programadores

- Atualizar o jogo dentro da app no computador: `npm install` e `npm run android`. Copia o jogo para `www/` e depois para `android/`.
- Refazer os ícones e o ecrã de arranque: `node scripts/gerar-icones-android.js` (precisa do Playwright).
- Refazer as imagens da loja: `node scripts/gerar-loja.js`.
- O identificador da app é `io.github.afonso14402.masmorra`. **Depois de publicada não se pode mudar.**
