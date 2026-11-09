## ADDED Requirements

### Requirement: Critérios medidos pelo servidor

Cada conquista SHALL ter um critério como função pura do domínio de progressão, com teste, decidido só pelo servidor. O app MUST NOT calcular nem informar o que foi desbloqueado.

#### Scenario: Conquista já medida

- **WHEN** o usuário faz o primeiro check
- **THEN** `primeiro-passo` é desbloqueada

#### Scenario: Conquista por consulta

- **WHEN** o usuário conclui a 5ª tarefa
- **THEN** `pe-na-lista` é desbloqueada sem criar contador novo

#### Scenario: Conquistas do mesmo dia

- **WHEN** o usuário marca um diário, uma tarefa e um hábito no mesmo dia local
- **THEN** `no-podio` é desbloqueada

### Requirement: Eventos que o servidor não observa sozinho

O sistema SHALL guardar contadores e marcas para: mudar o visual do personagem (total de mudanças), criar categoria própria e ativar o lembrete diário. Mudar o visual e criar categoria MUST ser detectados nas rotas que já existem. Ativar o lembrete SHALL chegar por `POST /v1/me/events` com o tipo em lista fechada.

#### Scenario: Evento válido

- **WHEN** o app envia `{ type: "reminder_enabled" }`
- **THEN** a marca é gravada uma vez, a conquista `hora-marcada` é avaliada e a resposta devolve as conquistas novas

#### Scenario: Evento inválido

- **WHEN** o corpo tem um tipo fora da lista
- **THEN** a API responde 400 sem gravar nada

#### Scenario: Evento repetido

- **WHEN** o mesmo evento chega duas vezes
- **THEN** o contador de marca única não muda e nada é desbloqueado de novo

### Requirement: Avaliação depois de cada ação relevante

O servidor SHALL avaliar as conquistas, na mesma transação, depois de um check, de criar item, de salvar o personagem, de criar categoria e de um evento. Conquistas de coleção SHALL ser avaliadas depois das demais, repetindo até nada novo sair.

#### Scenario: Cadeia de coleção

- **WHEN** um check desbloqueia a 5ª conquista do usuário
- **THEN** `medalhista` é desbloqueada na mesma passada

#### Scenario: Desbloqueio único

- **WHEN** a mesma conquista é atendida de novo
- **THEN** não há linha duplicada em `user_achievements` nem aviso duplicado

### Requirement: Aviso pendente

Cada conquista desbloqueada SHALL guardar `notifiedAt`, nulo até o app confirmar o aviso. `GET /v1/achievements` SHALL informar as pendentes e `POST /v1/achievements/ack` SHALL confirmar só as do próprio usuário.

#### Scenario: Aviso confirmado

- **WHEN** o app mostra o modal e confirma o `slug`
- **THEN** `notifiedAt` é gravado e a conquista não é mais pendente

#### Scenario: Confirmar conquista de outro usuário ou inexistente

- **WHEN** o `slug` não é do usuário autenticado
- **THEN** nada muda e a API responde sem revelar se existe

### Requirement: Retroativo

No deploy, o sistema SHALL avaliar todos os usuários uma vez e liberar o que já cumprem com `notifiedAt` igual a `unlockedAt`, sem fila de modais.

#### Scenario: Usuário com histórico

- **WHEN** o retroativo roda para quem já fez 100 checks
- **THEN** `maratonista` aparece desbloqueada na galeria e nenhum modal abre

### Requirement: Desfazer check não perde nem duplica

Desfazer um check SHALL manter as conquistas já desbloqueadas. Refazer o check MUST NOT duplicar.

#### Scenario: Desmarcar e marcar de novo

- **WHEN** o usuário desmarca e marca o mesmo item
- **THEN** a conquista segue única e o EXP segue idempotente por `checkId`
