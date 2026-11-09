## ADDED Requirements

### Requirement: Itens de exemplo não contam como criação

Itens criados pelo app como exemplo SHALL ser marcados como exemplo e MUST NOT contar nas conquistas de criação (primeiro diário, tarefa e hábito), de itens criados, de itens ativos nem de anotações. Marcar ou concluir um item de exemplo SHALL contar normalmente nas conquistas por check.

#### Scenario: Conta só com exemplos

- **WHEN** uma conta tem 25 itens de exemplo e faz o primeiro check
- **THEN** só "Primeiro passo" é liberada; nenhuma conquista de criação nem "Bolsa cheia"

#### Scenario: Criar de verdade

- **WHEN** o jogador cria uma tarefa por conta própria
- **THEN** "Primeira tarefa" é liberada

#### Scenario: Contador de itens criados

- **WHEN** o app cria 100 itens de exemplo
- **THEN** o contador de itens criados do jogador continua em 0
