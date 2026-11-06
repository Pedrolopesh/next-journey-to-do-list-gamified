## ADDED Requirements

### Requirement: Histórias por cenário

O sistema SHALL oferecer uma história por cenário do banner (praia, cidade, zumbi, castelo, floresta, inferno), cada uma com 5 capítulos.

#### Scenario: Escolher uma história

- **WHEN** o usuário ativa uma história
- **THEN** o banner das abas passa a usar o cenário dessa história e o progresso das outras histórias é preservado

### Requirement: Capítulo por nível

O servidor SHALL concluir um capítulo da história ativa para cada nível ganho, até o último capítulo.

#### Scenario: Subir de nível

- **WHEN** um check faz o jogador subir de nível e a história ativa não está concluída
- **THEN** o capítulo atual é concluído, o próximo é aberto e o resultado do check traz `completedChapter`

#### Scenario: Desfazer o check que subiu de nível

- **WHEN** o usuário tenta desfazer o check que concluiu o capítulo
- **THEN** a API responde `CAPITULO_FECHADO` e nada muda

### Requirement: Capítulos desbloqueados por história

O sistema SHALL listar os capítulos de qualquer história com o estado de cada um para o usuário.

#### Scenario: Ver outra história

- **WHEN** o usuário pede `GET /v1/stories/:slug/timeline`
- **THEN** recebe concluídos (com texto), o atual e os bloqueados daquela história; slug inexistente responde 404
