## ADDED Requirements

### Requirement: Catálogo único de 69 conquistas

O sistema SHALL ter um catálogo fixo de 69 conquistas em `packages/contracts`, com `slug`, `name`, `description`, `trail`, `tier` (1 a 4), `glyph` (insígnia) e `secret`. API, app e laboratório MUST ler esse mesmo catálogo; nenhum deles MAY manter lista própria.

#### Scenario: Catálogo completo

- **WHEN** o catálogo é carregado
- **THEN** ele tem 69 conquistas com slugs únicos, 7 trilhas (Primeiros passos, Diários, Tarefas, Hábitos, Organização e constância, Jornada, Marcos e coleções) e cada conquista aponta para uma trilha e uma insígnia existentes

#### Scenario: Maratonista é Ouro

- **WHEN** o catálogo é lido
- **THEN** `maratonista` ("Faça 100 checks no total") existe na trilha de Organização e constância com classe 3 (Ouro)

### Requirement: Classes

O sistema SHALL ter 4 classes: 1 Bronze, 2 Prata, 3 Ouro e 4 Diamante. A cor da moldura da insígnia e do topo do modal MUST vir da classe da conquista, definida no catálogo.

#### Scenario: Classe vem do servidor

- **WHEN** o app lista as conquistas
- **THEN** cada item traz `tier` e o app não usa mapa próprio de classes

### Requirement: Conquistas surpresa

Uma conquista com `secret` SHALL ter a descrição omitida da resposta enquanto estiver bloqueada.

#### Scenario: Surpresa bloqueada

- **WHEN** o usuário lista as conquistas e uma surpresa está bloqueada
- **THEN** o item vem com `description` nula e o nome e a insígnia apenas como pista

#### Scenario: Surpresa desbloqueada

- **WHEN** a surpresa é desbloqueada
- **THEN** a descrição passa a ser enviada

### Requirement: Sem recompensa de item

As conquistas MUST NOT dar item (roupa ou acessório). `rewardKey` SHALL sair dos contratos, do catálogo e do banco, e as peças de recompensa existentes (`outfit-special`, `outfit-cape`, bandana, espada de prata e escudo) SHALL ser retiradas.

#### Scenario: Personagem que usava peça de recompensa

- **WHEN** a migration roda e um personagem usava uma peça retirada
- **THEN** o personagem volta à roupa e ao acessório padrão e o banner desenha normalmente

#### Scenario: Contrato sem rewardKey

- **WHEN** o catálogo ou o resultado do check é validado com Zod
- **THEN** o campo `rewardKey` não existe
