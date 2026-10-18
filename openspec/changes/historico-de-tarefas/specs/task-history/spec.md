## ADDED Requirements

### Requirement: Check que vale, informado pelo servidor

`GET /v1/items` SHALL devolver `lastCheckId` em cada item: o check mais recente de hoje que não foi desmarcado, ou nulo. O app MUST desmarcar por esse identificador e MUST NOT depender de memória da sessão.

#### Scenario: Dois checks no mesmo dia

- **WHEN** um hábito foi marcado duas vezes hoje
- **THEN** `lastCheckId` é o do segundo check; ao desmarcá-lo, passa a ser o do primeiro

#### Scenario: Dia seguinte

- **WHEN** o dia local muda
- **THEN** `lastCheckId` volta a ser nulo para os checks de ontem

### Requirement: Histórico de tarefas concluídas

O sistema SHALL listar em `GET /v1/items/history` as tarefas concluídas do usuário autenticado, da mais recente para a mais antiga, com `id`, título, categoria, dificuldade, `completedAt` e `checkId`, paginadas por `before` e `limit`. A rota MUST exigir autenticação, MUST validar a consulta e MUST NOT devolver tarefas de outro usuário.

#### Scenario: Ordem e páginas

- **WHEN** o usuário tem três tarefas concluídas e pede `limit=2`
- **THEN** recebe as duas mais recentes e `nextCursor`; ao pedir `before=<nextCursor>`, recebe a terceira e `nextCursor` nulo

#### Scenario: Isolamento

- **WHEN** outro usuário consulta o histórico
- **THEN** a lista dele não contém tarefas do primeiro

#### Scenario: Consulta inválida

- **WHEN** `limit=0` ou `before` não é uma data ISO
- **THEN** a resposta é 400

### Requirement: Desfazer a partir do histórico

A tela de histórico SHALL oferecer "Desfazer" em cada tarefa. O desfazer MUST devolver a tarefa à lista de tarefas, tirar as moedas da regra de desmarcar e manter o EXP, mostrando o aviso amarelo.

#### Scenario: Desfazer uma tarefa

- **WHEN** o usuário desfaz uma tarefa do histórico no capítulo 1
- **THEN** a tarefa sai do histórico, volta à lista, perde até 3 moedas e o EXP continua

### Requirement: Aviso na aba Tarefas

A aba Tarefas SHALL mostrar no rodapé que as tarefas concluídas ficam no histórico, em Perfil, e o toque SHALL abrir o histórico.

#### Scenario: Lista vazia

- **WHEN** todas as tarefas foram concluídas
- **THEN** o aviso do rodapé continua visível junto do estado vazio
