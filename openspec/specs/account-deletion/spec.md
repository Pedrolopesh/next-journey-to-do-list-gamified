# account-deletion Specification

## Purpose

TBD - created by archiving change exclusao-de-conta-com-reautenticacao. Update Purpose after archive.

## Requirements

### Requirement: Exclusão exige prova de posse por código ou provedor

O sistema SHALL exigir, junto do pedido de exclusão de conta, uma prova de que a pessoa é a dona da conta, além do token de acesso. A prova SHALL ser o código de 6 dígitos recebido por e-mail ou um ID token novo do provedor (Google ou Apple) de uma identidade ligada à conta. A senha SHALL NOT ser aceita como prova.

#### Scenario: Código de e-mail certo

- **WHEN** a pessoa pede a exclusão com o código válido recebido por e-mail
- **THEN** a conta é excluída (anonimizada na hora, apagada de vez depois do prazo) e a API responde `204`

#### Scenario: Código errado

- **WHEN** o pedido traz um código errado, expirado ou já usado
- **THEN** a API responde `403 REAUTH_FAILED` sem excluir nada

#### Scenario: ID token da identidade ligada

- **WHEN** o pedido traz um ID token válido do provedor cuja identidade está ligada à conta
- **THEN** a conta é excluída e a API responde `204`

#### Scenario: ID token de outra pessoa

- **WHEN** o ID token é válido mas pertence a outra identidade
- **THEN** a API responde `403 REAUTH_FAILED` sem excluir nada

#### Scenario: ID token antigo

- **WHEN** o ID token foi emitido há mais de 5 minutos ou não informa quando foi emitido
- **THEN** a API responde `403 REAUTH_FAILED` sem excluir nada, porque o token não prova que a dona está presente agora

#### Scenario: Senha ou pedido sem prova

- **WHEN** o pedido traz uma senha, não traz corpo ou traz uma prova do tipo errado
- **THEN** a API responde `400` (validação) ou `403 REAUTH_FAILED`, sem excluir nada

### Requirement: Tentativas de prova limitadas

O sistema SHALL limitar a 5 tentativas de exclusão a cada 15 minutos por conta e responder `429 RATE_LIMITED` ao passar disso, sem nunca devolver `401` por prova errada.

#### Scenario: Muitas provas erradas

- **WHEN** a sexta tentativa em 15 minutos chega, certa ou errada
- **THEN** a API responde `429 RATE_LIMITED` e a conta continua intacta
