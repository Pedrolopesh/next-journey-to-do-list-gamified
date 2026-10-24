## ADDED Requirements

### Requirement: Exclusão exige reautenticação

O sistema SHALL exigir, junto do pedido de exclusão de conta, uma prova de que a pessoa é a dona da conta, além do token de acesso. Conta com senha SHALL provar com a senha atual; conta sem senha SHALL provar com um ID token novo do provedor (Google ou Apple) da identidade ligada à conta.

#### Scenario: Conta com senha, senha certa

- **WHEN** a pessoa pede a exclusão com a senha atual correta
- **THEN** a conta é excluída (anonimizada na hora, apagada de vez depois do prazo) e a API responde `204`

#### Scenario: Senha errada

- **WHEN** o pedido traz uma senha errada
- **THEN** a API responde `403 REAUTH_FAILED` sem excluir nada

#### Scenario: Conta só social, ID token da identidade ligada

- **WHEN** a conta não tem senha e o pedido traz um ID token válido do provedor cuja identidade está ligada a ela
- **THEN** a conta é excluída e a API responde `204`

#### Scenario: Conta só social, ID token de outra pessoa

- **WHEN** o ID token é válido mas pertence a outra identidade
- **THEN** a API responde `403 REAUTH_FAILED` sem excluir nada

#### Scenario: Conta só social, ID token antigo

- **WHEN** o ID token foi emitido há mais de 5 minutos ou não informa quando foi emitido
- **THEN** a API responde `403 REAUTH_FAILED` sem excluir nada, porque o token não prova que a dona está presente agora

#### Scenario: Pedido sem prova

- **WHEN** o pedido não traz corpo ou traz uma prova do tipo errado para a conta
- **THEN** a API responde `400` (validação) ou `403 REAUTH_FAILED`, sem excluir nada

### Requirement: Tentativas de reautenticação limitadas

O sistema SHALL limitar a 5 tentativas de exclusão a cada 15 minutos por conta e responder `429 RATE_LIMITED` ao passar disso, sem nunca devolver `401` por prova errada.

#### Scenario: Muitas senhas erradas

- **WHEN** a sexta tentativa em 15 minutos chega, certa ou errada
- **THEN** a API responde `429 RATE_LIMITED` e a conta continua intacta

### Requirement: App informa o tipo de prova

O sistema SHALL informar em `GET /v1/me` se a conta tem senha (`user.hasPassword`), sem expor o hash.

#### Scenario: Conta por senha e conta só social

- **WHEN** o app consulta `/me`
- **THEN** `user.hasPassword` é verdadeiro para conta com senha e falso para conta só social
