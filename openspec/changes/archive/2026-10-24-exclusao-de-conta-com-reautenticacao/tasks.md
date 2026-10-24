## 1. Contrato

- [x] 1.1 `deleteAccountRequestSchema` (senha ou provedor + ID token), `REAUTH_FAILED` e `user.hasPassword` no `/me`; testes do contrato

## 2. API

- [x] 2.1 `requestDeletion` exige a prova (argon2 / ID token da identidade ligada), com limite de 5 em 15 min por conta
- [x] 2.2 Controller com corpo validado; `AuthModule` exporta o verificador e o limite; `/me` informa `hasPassword`
- [x] 2.3 e2e: senha certa/errada, conta só social certa/de outra pessoa, sem corpo, limite de tentativas, sessão intacta após falha

## 3. App

- [x] 3.1 Ajuda compartilhada para obter o ID token do Google/Apple (usada no login e na exclusão)
- [x] 3.2 Tela de confirmação da exclusão com senha (ou provedor), carregando e toast; textos em `pt-BR.json`; teste de componente

## 4. Documentação e verificação

- [x] 4.1 `SEGURANCA.md`, ADR-0008; requisições no Bruno atualizadas
- [x] 4.2 `pnpm run verify` verde, `/code-review` tratado
