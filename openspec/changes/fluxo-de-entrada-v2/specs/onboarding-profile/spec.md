## ADDED Requirements

### Requirement: Dados de perfil do onboarding

O sistema SHALL guardar, por conta, uma ou mais metas (`procrastination`, `fitness`, `discipline`, `wellbeing`, `projects`, `fun`, `learning`), a faixa de idade (`under18`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65plus`), o gênero (`male`, `female`, `other`) e se a pessoa ligou os lembretes (`remindersOptIn`). Idade e gênero SHALL ser opcionais e podem ser limpos com `null`. Os valores SHALL ser validados por enum fechado em `packages/contracts`.

#### Scenario: Salvar a meta

- **WHEN** o app envia `PATCH /me` com `goals: ["fitness", "learning"]`
- **THEN** a API grava e `GET /me` devolve `goals: ["fitness", "learning"]`

#### Scenario: Pular idade e gênero

- **WHEN** a pessoa pula as perguntas
- **THEN** `ageRange` e `gender` continuam `null` e o onboarding termina normalmente

#### Scenario: Valor fora da lista

- **WHEN** o corpo traz `ageRange: "10"`
- **THEN** a API responde `400` e não grava nada

### Requirement: Classe do personagem

O sistema SHALL guardar a classe do personagem entre `mage`, `knight`, `archer`, `rogue`, `goblin`, `slime`, `druid` e `necromancer`, enviada junto ao personagem. A classe SHALL ser opcional para personagens já existentes.

#### Scenario: Criar com classe

- **WHEN** o app salva o personagem com `characterClass: "mage"`
- **THEN** a API grava e `GET /me` devolve a classe no personagem

#### Scenario: Personagem antigo

- **WHEN** a conta tem personagem criado antes desta mudança
- **THEN** `characterClass` vem `null` e nada quebra

### Requirement: Fim do onboarding

O sistema SHALL considerar o onboarding concluído quando a conta tem personagem, história ativa e o tutorial visto. Meta, idade, gênero e lembretes SHALL NOT bloquear o acesso ao app.

#### Scenario: Conta antiga

- **WHEN** uma conta criada antes desta mudança abre o app
- **THEN** vai direto à Home, sem passar pelas perguntas novas

### Requirement: Dados pessoais acompanham a conta

A exportação de dados SHALL incluir meta, faixa de idade, gênero e classe, e a exclusão da conta SHALL apagá-los junto com o restante do perfil.

#### Scenario: Exportar

- **WHEN** a pessoa pede a exportação dos dados
- **THEN** o arquivo traz os campos novos quando preenchidos
