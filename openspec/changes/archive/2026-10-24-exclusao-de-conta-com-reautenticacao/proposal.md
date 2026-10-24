## Why

Hoje `DELETE /v1/me` apaga a conta só com o token de acesso. Quem tiver um token roubado (aparelho emprestado, desbloqueado ou comprometido) consegue destruir a conta. A exclusão é irreversível depois do prazo de retenção, então pede uma segunda prova de que quem pede é a dona da conta. A exclusão dentro do app continua obrigatória nas lojas.

## What Changes

- `DELETE /v1/me` passa a exigir um corpo com a prova de reautenticação:
  - conta com senha: `{ "password": "<senha atual>" }`;
  - conta só social (sem senha): `{ "provider": "google" | "apple", "idToken": "<ID token novo>" }`, validado no servidor e que precisa pertencer à mesma identidade ligada à conta.
- Prova inválida: `403 REAUTH_FAILED` (código novo, mensagem genérica, nunca `401`, para o app não tratar como sessão encerrada). Limite de 5 tentativas por conta em 15 minutos (`429 RATE_LIMITED`).
- `GET /v1/me` passa a informar `user.hasPassword` para o app saber qual prova pedir.
- App: tela de confirmação da exclusão com campo de senha (ou botões do Google/Apple para conta só social), carregando e toast de sucesso/erro (RN-FB).
- **BREAKING** (contrato): `DELETE /v1/me` sem corpo deixa de funcionar. Não há cliente publicado, só o app deste repositório.

## Capabilities

### New Capabilities

- `account-deletion`: exigência de reautenticação para excluir a conta.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de exclusão de conta. -->

## Impact

- `packages/contracts`: `deleteAccountRequestSchema`, código de erro `REAUTH_FAILED`, `hasPassword` no `/me`.
- `apps/api`: `account.service.ts`, `me.controller.ts`, `auth.module.ts` (exporta verificador e limite), testes unitários e e2e.
- `apps/mobile`: tela de configurações, `endpoints.ts`, `pt-BR.json`, ajuda compartilhada para obter o ID token do Google/Apple.
- Docs: `SEGURANCA.md`, ADR-0008.

## Segurança

- Senha conferida com argon2 (mesmo custo e mesma resposta para qualquer falha); ID token validado no servidor (audiência, emissor) e comparado com a identidade ligada à conta, não com o e-mail.
- Tentativas contadas por conta; falha não revela nada além do erro genérico; nada de senha ou token em log.

## Fora do escopo

- Revogar o token do Sign in with Apple na exclusão, e e-mail de aviso de exclusão.
- Janela de "login recente" (a prova é pedida a cada exclusão).
