# email-code-login Specification

## Purpose

TBD - created by archiving change fluxo-de-entrada-v2. Update Purpose after archive.

## Requirements

### Requirement: Pedido de código por e-mail

O sistema SHALL receber o e-mail em `POST /auth/email/start`, responder sempre `202` sem corpo (exista ou não a conta, esteja ou não confirmada) e enviar ao e-mail um código de 6 dígitos, respeitando o intervalo mínimo de 60 segundos entre envios para o mesmo e-mail. Para e-mail sem conta, o sistema SHALL criar a conta pendente, sem senha, com o fuso e a versão dos Termos informados.

#### Scenario: E-mail novo

- **WHEN** alguém pede o código com um e-mail sem conta
- **THEN** a API cria uma conta pendente sem senha, envia o código e responde `202`

#### Scenario: E-mail de conta existente

- **WHEN** alguém pede o código com o e-mail de uma conta já confirmada
- **THEN** a API envia um código de login e responde `202` idêntico ao do e-mail novo

#### Scenario: Pedido dentro do intervalo

- **WHEN** o pedido chega antes de 60 segundos do último envio
- **THEN** a API responde `202` e não envia outro e-mail

### Requirement: Confirmação do código cria a sessão

O sistema SHALL trocar e-mail e código válidos por uma sessão (`AuthResponse`) em `POST /auth/email/confirm`. O código SHALL valer 15 minutos, ser de uso único e ser invalidado após 5 tentativas erradas. O primeiro código confirmado de uma conta pendente SHALL marcar o e-mail como confirmado e criar os itens de exemplo.

#### Scenario: Código correto de conta pendente

- **WHEN** a pessoa envia e-mail e código válidos de uma conta pendente
- **THEN** a conta passa a confirmada, recebe os itens de exemplo e a API devolve a sessão

#### Scenario: Código correto de conta existente

- **WHEN** a pessoa envia e-mail e código válidos de uma conta já confirmada
- **THEN** a API devolve a sessão sem recriar itens de exemplo

#### Scenario: Código inválido

- **WHEN** o código está errado, expirado, já usado ou o e-mail não tem conta
- **THEN** a API responde `400 INVALID_VERIFICATION_CODE` igual nos quatro casos

### Requirement: Sessão que não expira sozinha

O sistema SHALL manter a sessão do aparelho enquanto a pessoa usar o app: o refresh token SHALL valer 365 dias a contar do último uso (renovado a cada rotação). A sessão SHALL terminar só com "Sair", com revogação em Sessões, com a exclusão da conta ou com o reúso detectado de um refresh token.

#### Scenario: Uso depois de meses

- **WHEN** a pessoa abre o app dentro de 365 dias do último uso
- **THEN** o refresh funciona e a pessoa continua dentro da conta

#### Scenario: Sair explícito

- **WHEN** a pessoa toca em "Sair"
- **THEN** o refresh token é revogado e o app volta às Boas-vindas

### Requirement: Exclusão de conta por código

O sistema SHALL aceitar em `DELETE /me`, além de senha e ID token de provedor, o código de 6 dígitos recebido por e-mail como prova de posse da conta.

#### Scenario: Conta sem senha

- **WHEN** a dona de uma conta criada por e-mail pede a exclusão com um código válido
- **THEN** a conta é marcada para exclusão como hoje

#### Scenario: Código inválido

- **WHEN** o código enviado está errado ou expirado
- **THEN** a API responde `400 INVALID_VERIFICATION_CODE` e a conta continua
