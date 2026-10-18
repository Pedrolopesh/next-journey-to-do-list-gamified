## ADDED Requirements

### Requirement: EXP por capítulo

O EXP para concluir cada capítulo SHALL vir de `levelExpTable` do `game_config` (padrão 200, 400, 600, 800 e 1000). Do nível além do tamanho da tabela em diante, o EXP por nível MUST ser o último valor. O EXP e as moedas por check (5/10/20 e 1/2/4) e o bônus de 10 moedas por capítulo MUST NOT mudar.

#### Scenario: Capítulo 1

- **WHEN** o jogador está no nível 1
- **THEN** são necessários 200 de EXP para subir e concluir o capítulo 1

#### Scenario: Depois do capítulo 5

- **WHEN** o jogador conclui o capítulo 5 e continua marcando
- **THEN** o nível continua subindo a cada 1000 de EXP, a história permanece concluída e o capítulo não avança

### Requirement: Desmarcar livre sem perder EXP

O usuário SHALL poder desmarcar um check seu em qualquer dia e em qualquer capítulo. O EXP, o nível e o capítulo MUST NOT diminuir. O servidor SHALL tirar `min(undoCoinPenalty do capítulo atual, moedas)` e MUST NOT deixar o saldo negativo. O bônus de nível não volta.

#### Scenario: Desmarcar no capítulo 2

- **WHEN** o jogador está no capítulo 2 com 40 moedas e desmarca um check
- **THEN** perde 5 moedas, mantém todo o EXP e o resultado traz `coinsGained = -5`

#### Scenario: Saldo curto

- **WHEN** o jogador tem 2 moedas no capítulo 1 e desmarca
- **THEN** perde 2 moedas e o saldo fica em 0

#### Scenario: Check de outro dia ou de capítulo fechado

- **WHEN** o jogador desmarca um check de ontem, ou de um capítulo já concluído
- **THEN** o desmarcar é aceito (sem `CHECK_LOCKED` nem `UNDO_NOT_ALLOWED` por dia)

#### Scenario: Check alheio

- **WHEN** o usuário tenta desmarcar o check de outro usuário
- **THEN** a resposta é 404

### Requirement: EXP uma vez por item e dia

Marcar de novo, no mesmo dia local, um item cujo check do dia foi desmarcado SHALL render as moedas do check e 0 de EXP.

#### Scenario: Marcar, desmarcar e marcar de novo

- **WHEN** o jogador marca uma tarefa média (+10 EXP), desmarca e marca de novo no mesmo dia
- **THEN** o segundo check rende 0 de EXP e as moedas normais; o EXP total fica em 10

### Requirement: Avisos de marcar e desmarcar

O app SHALL mostrar, ao marcar, o EXP e as moedas ganhos (inclusive "+0 EXP"), e, ao desmarcar, um aviso amarelo com as moedas a menos. A tela MUST NOT usar texto fora do i18n.

#### Scenario: Aviso ao desmarcar

- **WHEN** o desmarcar tira 3 moedas
- **THEN** aparece um aviso amarelo "−3 moedas" e o personagem não se move

### Requirement: Jornada acompanha o capítulo

O personagem SHALL andar pela EXP dentro do capítulo e só chegar ao portal ao concluí-lo. Com a história concluída, o personagem SHALL ficar no fim do cenário do capítulo 5, sem portal nem troca de cena.

#### Scenario: Meio do capítulo

- **WHEN** o jogador tem 100 de 200 de EXP no capítulo 1
- **THEN** o personagem está na metade do cenário

#### Scenario: História concluída

- **WHEN** o jogador está no nível 6
- **THEN** o cenário continua o do capítulo 5, o personagem fica no fim e não há portal
