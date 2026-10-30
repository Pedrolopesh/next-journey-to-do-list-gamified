## ADDED Requirements

### Requirement: Servidor cria os itens de exemplo da conta nova

Quando uma conta passa a valer, o servidor SHALL criar, uma única vez, o conjunto de itens de exemplo para ela: na confirmação do e-mail do cadastro por senha e na criação da conta por login social. O servidor MUST criar os itens na mesma transação que confirma ou cria a conta, ligados às categorias padrão da própria conta, e MUST marcá-los como exemplo. O mesmo vale quando um login social vincula uma conta por senha que ainda estava pendente (a conta passa a valer ali). O servidor MUST NOT criar exemplos ao entrar numa conta existente e confirmada, ao vincular um login social a uma conta já confirmada nem ao reenviar o código, e MUST NOT criar exemplos para uma conta que já tem itens.

#### Scenario: Cadastro por senha confirmado

- **WHEN** a pessoa confirma o e-mail com o código correto
- **THEN** a conta recebe os itens de exemplo, a lista de itens já os traz no primeiro acesso e o app não faz chamadas para criá-los

#### Scenario: Conta criada por login social

- **WHEN** um login social cria uma conta nova
- **THEN** a conta recebe os mesmos itens de exemplo, sem passar pela confirmação de e-mail

#### Scenario: Entrar numa conta existente

- **WHEN** a pessoa faz login, ou vincula um login social a uma conta que já estava confirmada
- **THEN** nenhum item de exemplo é criado

#### Scenario: Vincular a uma conta pendente

- **WHEN** um login social vincula uma conta por senha que nunca confirmou o e-mail
- **THEN** a conta é confirmada e recebe os itens de exemplo uma única vez

#### Scenario: Conta que já tem itens

- **WHEN** a semeadura roda para uma conta que já tem itens
- **THEN** nenhum item é criado e nada é duplicado

#### Scenario: Código inválido

- **WHEN** a confirmação do e-mail falha
- **THEN** nenhum item de exemplo é criado e a conta continua pendente

#### Scenario: Falha na semeadura

- **WHEN** a criação dos exemplos falha dentro da transação
- **THEN** a conta não é marcada como confirmada e a pessoa pode tentar de novo com o mesmo código

### Requirement: Itens de exemplo do servidor não contam como criação

Os itens semeados pelo servidor SHALL ter `is_example = true`, SHALL NOT incrementar o contador de itens criados e MUST seguir a regra de `conquistas-sem-itens-de-exemplo`: não contam nas conquistas de criação, de itens criados, de itens ativos nem de anotações. Marcar ou concluir um item de exemplo SHALL contar normalmente nas conquistas por check.

#### Scenario: Conta recém-confirmada

- **WHEN** a conta acaba de ser confirmada e recebeu os exemplos
- **THEN** o contador de itens criados é 0 e nenhuma conquista de criação está liberada

#### Scenario: Primeiro check num exemplo

- **WHEN** a pessoa marca um item de exemplo pela primeira vez
- **THEN** só as conquistas por check são liberadas, como "Primeiro passo"

#### Scenario: Criar de verdade

- **WHEN** a pessoa cria um item por conta própria
- **THEN** a conquista de criação correspondente é liberada

### Requirement: Conteúdo dos exemplos

O conjunto de exemplos SHALL ter diários, tarefas e hábitos de uso comum, cada um com título em português, dificuldade e uma categoria padrão existente na conta (cai na primeira categoria se a padrão não existir). Diários MUST ter frequência em todos os dias da semana. A data de criação de cada item SHALL ser o dia local da pessoa, pelo fuso do perfil.

#### Scenario: Categoria de cada exemplo

- **WHEN** os exemplos são criados
- **THEN** cada um fica na categoria padrão indicada pelo catálogo, ou na primeira categoria da conta se ela não existir

#### Scenario: Dia de criação no fuso da pessoa

- **WHEN** uma conta com fuso de São Paulo é confirmada logo depois da meia-noite em UTC
- **THEN** a data de criação dos exemplos é o dia local de São Paulo, não o de UTC

### Requirement: Semeadura configurável no ambiente

A semeadura SHALL ser controlada pela opção de ambiente `SEED_STARTER_ITEMS`, ligada por padrão em todos os ambientes. Os testes e2e da API que assumem usuário sem itens SHALL desligá-la; os testes da semeadura a ligam explicitamente.

#### Scenario: Opção desligada

- **WHEN** `SEED_STARTER_ITEMS` está desligada e uma conta é confirmada
- **THEN** nenhum exemplo é criado e o restante do cadastro funciona igual

### Requirement: App não cria exemplos

O app SHALL NOT criar itens de exemplo nem guardar marca de exemplos no aparelho; ele SHALL apenas listar os itens que o servidor devolve. O contrato de criação de item MUST NOT aceitar o campo `example`.

#### Scenario: Primeira abertura depois do cadastro

- **WHEN** a pessoa entra pela primeira vez numa conta recém-confirmada
- **THEN** o app não faz chamadas de criação de item e mostra os exemplos já existentes

#### Scenario: Conta antiga com lista vazia

- **WHEN** uma conta existente tem a lista de itens vazia
- **THEN** o app mostra o estado vazio e não cria exemplos
