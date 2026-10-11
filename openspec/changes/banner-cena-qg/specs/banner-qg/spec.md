## ADDED Requirements

### Requirement: Cena QG no banner

O banner SHALL desenhar o QG quando receber `INIT` com `scene: 'qg'`, usando `sceneKey` como id do cenário e `timeOfDay` como hora do dia. Um `sceneKey` desconhecido SHALL cair no cenário padrão (`cabin`).

#### Scenario: INIT do QG

- **WHEN** o app envia `INIT` com `scene: 'qg'`, `sceneKey: 'castle'` e `timeOfDay: 'night'`
- **THEN** o banner mostra o castelo à noite com o personagem montado a partir de `character`

#### Scenario: Cenário desconhecido

- **WHEN** o `sceneKey` não é um cenário do QG
- **THEN** o banner mostra o cenário padrão e não envia ERROR

### Requirement: Mensagens no QG

No QG, `SET_TIME_OF_DAY` e `SET_CHARACTER` SHALL atualizar a cena na hora, `ITEM_CHECKED` SHALL fazer o personagem comemorar por alguns instantes, e `CHAPTER_COMPLETED` SHALL escurecer a cena, voltar e responder `CHAPTER_TRANSITION_DONE`.

#### Scenario: Fim de capítulo na Home

- **WHEN** o app envia `CHAPTER_COMPLETED` com o QG ativo
- **THEN** o banner faz fade, volta e envia `CHAPTER_TRANSITION_DONE`

### Requirement: Peso e desempenho

O bundle do banner SHALL ficar abaixo de 1,5 MB. O QG SHALL limitar a 30 quadros por segundo, e PAUSE SHALL parar o laço de animação.
