## MODIFIED Requirements

### Requirement: Exclusão de conta por código

O sistema SHALL aceitar em `DELETE /me`, como prova de posse da conta, o código de 6 dígitos recebido por e-mail (pedido em `POST /auth/email/start`), valendo para qualquer conta.

#### Scenario: Conta sem senha

- **WHEN** a dona de uma conta criada por e-mail pede a exclusão com um código válido
- **THEN** a conta é marcada para exclusão como hoje

#### Scenario: Código inválido

- **WHEN** o código enviado está errado ou expirado
- **THEN** a API responde `403 REAUTH_FAILED` e a conta continua
