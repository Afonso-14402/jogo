# Masmorra do Destino

RPG 2D de masmorras que corre direto no browser. Não precisa de instalar nada: é HTML5 Canvas com JavaScript puro, sem bibliotecas e sem imagens (tudo é desenhado com código).

## Como jogar

Abre o ficheiro `index.html` no browser (Chrome, Firefox, Edge…) com duplo clique.

| Tecla | Ação |
|---|---|
| WASD / Setas | Mover |
| Clique do rato / Espaço | Atacar (o rato aponta o golpe) |
| Shift | Dash: esquiva rápida, ficas invencível durante o dash |
| E | Abrir baú / Descer a escada |
| Q | Beber poção (cura 40%) |
| P / Esc | Pausa |
| M | Ligar/desligar o som |

## O que há no jogo

- **Andares infinitos** gerados aleatoriamente. Encontra a escada para descer.
- **Inimigos**: Slime, Morcego, Esqueleto Arqueiro, Orc (faz investidas), Fantasma (atravessa paredes) e Mímico.
- **Bosses a cada 5 andares**:
  - Andar 5: **Rei Slime**. Salta para cima de ti, solta ondas de choque e invoca slimes.
  - Andar 10: **Lich Necromante**. Anéis de magia, teletransporte e invocação de esqueletos.
  - Andar 15: **Dragão Ancião**. Sopro de fogo, investidas e chuva de meteoros.
  - Depois disso os bosses repetem-se, cada vez mais fortes. Abaixo de 50% de vida entram em **fase 2 (enfurecidos)**.
- **Níveis**: ganhas XP ao matar inimigos. Cada nível dá +vida, +ataque e +defesa e cura-te por completo.
- **Baús com probabilidades**: ao abrir um baú roda uma roleta que pode dar desde o PIOR até ao MELHOR item do jogo.

### Probabilidades dos baús

| Raridade | Baú de Madeira | Baú Dourado (boss) |
|---|---|---|
| Lixo (ex: *Colher Enferrujada*, o pior item) | 30% | 4% |
| Comum | 32% | 14% |
| Raro | 22% | 30% |
| Épico | 11% | 30% |
| Lendário | 4% | 17% |
| Mítico (ex: *Espada do Infinito*, o melhor item) | 1% | 5% |
| É um Mímico! | 8% | 0% |

Existem 3 tipos de equipamento: **arma**, **armadura** e **amuleto**. Quando sai um item podes **equipá-lo** (E) ou **reciclá-lo** para ganhar XP (X).

## Estrutura

```
index.html      página do jogo
js/dados.js     itens, raridades, probabilidades, inimigos e bosses (é aqui que se balanceia o jogo)
js/mapa.js      geração das masmorras e colisões
js/desenho.js   gráficos, HUD e a roleta dos baús
js/jogo.js      lógica: combate, IA dos inimigos, bosses, níveis e ciclo do jogo
```

Para mudar as probabilidades ou criar itens novos, edita `js/dados.js`.

## Jogar online (opcional)

No GitHub vai a **Settings → Pages**, escolhe o branch e a pasta `/ (root)`. O jogo fica disponível num link `https://<utilizador>.github.io/jogo/`.
