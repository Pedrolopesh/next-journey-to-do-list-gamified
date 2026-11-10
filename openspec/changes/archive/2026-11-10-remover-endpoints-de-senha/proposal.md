## Why

O app novo entra só por código de e-mail, Google ou Apple (mudança `fluxo-de-entrada-v2`). Os endpoints de cadastro e login por senha ficaram na API só para não quebrar versões instaladas, mas o app ainda não foi publicado nas lojas: nenhuma versão instalada os usa. Eles são superfície de ataque sem uso (força bruta de senha, enumeração, recuperação por link), cobrem metade dos testes e mantêm código, e-mails, limites e eventos que ninguém mais exercita. O Pedro pediu a remoção pelo processo normal.

## What Changes

- **BREAKING (API).** Saem `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/login`, `/auth/forgot-password` e `/auth/reset-password`. Ficam `/auth/email/start`, `/auth/email/confirm`, `/auth/refresh`, `/auth/logout`, `/auth/google` e `/auth/apple`.
- **Exclusão de conta.** `DELETE /me` deixa de aceitar a senha como prova: ficam o código de e-mail e o ID token novo do provedor.
- **`GET /me`.** O campo `user.hasPassword` sai do contrato (o app não precisa mais escolher o tipo de prova pela senha).
- **Exportação.** A forma de entrada `password` sai de `signInMethods`.
- **Banco.** Uma migration apaga a tabela `password_resets` e a coluna `users.password_hash`. Contas antigas entram pelo código, que prova a posse do e-mail.
- **Limpeza.** Saem o e-mail de recuperação de senha e o aviso de "e-mail já cadastrado", os limites de tentativas e o piso de tempo dessas rotas, os eventos `password_reset_requested` e `password_reset_completed`, as variáveis `PASSWORD_RESET_URL` e `PASSWORD_RESET_TTL_MINUTES` e o expurgo de `password_resets`.
- **App.** A tela de exclusão perde o ramo da senha e os textos de senha deixam de existir no `pt-BR.json`.
- **Textos legais.** A frase "Senhas, quando existem" sai da Política de Privacidade (sobe `LEGAL_VERSION`).

## Capabilities

### New Capabilities

<!-- Nenhuma. -->

### Modified Capabilities

- `email-verification`: sai o cadastro, o reenvio e o login por senha; o login social passa a confirmar a conta pendente criada por código.
- `account-deletion`: a prova passa a ser o código de e-mail ou o ID token do provedor; sai o tipo de prova informado em `/me`.
- `email-code-login`: a exclusão por código deixa de ser "além da senha".
- `data-export`: a exportação não lista mais a entrada por senha.

## Fora do escopo

- Trocar o e-mail da conta ou adicionar outra forma de entrada.
- Remover a coluna `termsVersion` ou mudar o aceite dos Termos.
- Apagar de contas existentes os códigos antigos: o expurgo diário já cuida deles.

## Segurança

- Reduz a superfície pública: seis rotas a menos, sem hash de senha no banco, sem link de recuperação e sem argon2 no caminho de exclusão.
- A prova de exclusão continua forte: código de uso único com 15 minutos e 5 tentativas, ou ID token emitido há no máximo 5 minutos; `403 REAUTH_FAILED` igual para qualquer falha e limite de 5 tentativas a cada 15 minutos.
- Conta que só tinha senha e não tem acesso ao e-mail não consegue mais entrar. Como o app não está nas lojas, isso afeta apenas contas de teste.
