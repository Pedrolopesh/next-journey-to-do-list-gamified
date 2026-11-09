## REMOVED Requirements

### Requirement: Cadastro por senha não cria sessão

**Reason**: O cadastro por senha (`POST /auth/register`) deixa de existir; a conta nasce no primeiro código confirmado de `POST /auth/email/start`.
**Migration**: Usar `email-code-login` (pedido e confirmação do código).

### Requirement: Confirmação por código

**Reason**: O código confirmado junto com a senha (`POST /auth/verify-email`) deixa de existir; a confirmação por código sem senha é a de `POST /auth/email/confirm`, com as mesmas regras de validade, uso único e tentativas.
**Migration**: Usar `email-code-login`.

### Requirement: Reenvio do código

**Reason**: `POST /auth/resend-verification` deixa de existir; o app pede um novo código chamando `POST /auth/email/start`, que já respeita o intervalo de 60 segundos.
**Migration**: Chamar `POST /auth/email/start` de novo.

### Requirement: Login exige e-mail confirmado

**Reason**: O login por senha (`POST /auth/login`) deixa de existir.
**Migration**: Entrar por código, Google ou Apple.

### Requirement: Login social só com e-mail verificado pelo provedor

**Reason**: A regra mudou de alvo: sem conta por senha, o que o login social confirma é a conta pendente criada por código; o requisito é reescrito com outro nome e novos cenários.
**Migration**: Ver o requisito "Login social vincula só com e-mail verificado pelo provedor".

## ADDED Requirements

### Requirement: Login social vincula só com e-mail verificado pelo provedor

O sistema SHALL criar conta ou vincular a uma conta existente somente quando o provedor (Google ou Apple) informa `email_verified` verdadeiro. Ao vincular a uma conta ainda não confirmada (criada por código e nunca confirmada), o sistema SHALL confirmar a conta e revogar as sessões e os códigos abertos.

#### Scenario: Provedor não verificou o e-mail

- **WHEN** o ID token traz e-mail não verificado
- **THEN** a API não cria nem vincula conta e responde `400 EMAIL_NOT_VERIFIED_BY_PROVIDER`

#### Scenario: Conta pendente criada por código

- **WHEN** o e-mail verificado pelo provedor coincide com uma conta pendente criada por código
- **THEN** a conta é vinculada ao provedor, marcada como confirmada, e os códigos e sessões antigos deixam de valer

#### Scenario: Conta já confirmada

- **WHEN** o e-mail verificado pelo provedor coincide com uma conta confirmada
- **THEN** a conta é vinculada ao provedor e continua com as mesmas formas de entrada
