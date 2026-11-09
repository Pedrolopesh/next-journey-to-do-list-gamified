## MODIFIED Requirements

### Requirement: Nada de segredo na exportação

O sistema SHALL NOT incluir na exportação refresh tokens, códigos de confirmação, contadores de limite nem identificadores internos de provedores. A lista de formas de entrada SHALL conter somente `email` e os provedores sociais ligados à conta.

#### Scenario: Conteúdo sensível

- **WHEN** a exportação é gerada para uma conta com sessões abertas e login social
- **THEN** o JSON não contém token, código, nem o identificador do provedor; só quais formas de entrada a conta tem
