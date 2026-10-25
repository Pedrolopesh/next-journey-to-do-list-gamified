## ADDED Requirements

### Requirement: Exportar os dados da própria conta

O sistema SHALL devolver, para a pessoa autenticada, um JSON com os dados dela: perfil, progresso, personagem, categorias, itens, checks, conquistas, cosméticos e histórias, e a data da exportação.

#### Scenario: Exportação completa

- **WHEN** a pessoa pede a exportação
- **THEN** a resposta traz os itens (inclusive os excluídos logicamente), os checks, as categorias, as conquistas e o perfil dela

#### Scenario: Dados de outras contas

- **WHEN** existem dados de outra conta
- **THEN** nada deles aparece na exportação

### Requirement: Nada de segredo na exportação

O sistema SHALL NOT incluir na exportação hash de senha, refresh tokens, códigos de confirmação, links de recuperação, contadores de limite nem identificadores internos de provedores.

#### Scenario: Conteúdo sensível

- **WHEN** a exportação é gerada para uma conta com senha, sessões abertas e login social
- **THEN** o JSON não contém hash, token, código, nem o identificador do provedor; só quais formas de entrada a conta tem

### Requirement: Limite de pedidos

O sistema SHALL aceitar até 3 exportações por hora por conta e responder `429 RATE_LIMITED` ao passar disso.

#### Scenario: Quarto pedido na mesma hora

- **WHEN** a pessoa pede a quarta exportação em uma hora
- **THEN** a API responde `429` e não gera o arquivo

### Requirement: Exportação deixa rastro

O sistema SHALL registrar um evento de segurança `data_exported` com o id da conta, sem o conteúdo exportado.

#### Scenario: Log

- **WHEN** a exportação é entregue
- **THEN** o log traz o evento com o id da conta e nenhum dado do arquivo
