## Why

A pessoa não tem como ver em quais aparelhos está logada nem encerrar uma sessão esquecida ou suspeita (aparelho perdido, emprestado). Hoje só o logout do aparelho atual e a troca de senha encerram sessões. Dar esse controle faz parte de uma conta segura e é a resposta natural a "alguém mais está usando minha conta?".

## What Changes

- Novas rotas autenticadas, sempre restritas às sessões do próprio usuário:
  - `GET /v1/me/sessions`: lista as sessões ativas (id, nome do aparelho, criada em, último uso, `current`);
  - `DELETE /v1/me/sessions/:id`: encerra uma sessão (se for a atual, funciona como logout);
  - `DELETE /v1/me/sessions`: encerra todas, inclusive a atual.
- Sessão = família de refresh tokens. O token de acesso passa a levar o id da sessão (`sid`) para a API saber qual é a atual. Token antigo sem `sid` continua valendo (sem marcar nenhuma como atual).
- O nome do aparelho vem do cabeçalho opcional `X-Device-Name` (até 80 caracteres, texto limpo), guardado no refresh token e mantido na rotação.
- App: tela "Sessões" em Configurações, com "Este aparelho", encerrar uma e "Sair de todos os aparelhos" (carregando e toast em toda ação, RN-FB).
- Migration: coluna `device_name` em `refresh_tokens`.

## Capabilities

### New Capabilities

- `session-management`: listar e encerrar as sessões da própria conta.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de sessão em openspec/specs/. -->

## Impact

- `packages/contracts`: `sessionSchema`, `sessionsResponseSchema`.
- `apps/api`: `tokens.service.ts` (nome do aparelho, `sid`), guard (id da sessão), serviço e controller de sessões, migration, testes unitários e e2e.
- `apps/mobile`: tela de sessões, cabeçalho do aparelho no cliente HTTP, `pt-BR.json`, teste de componente.
- Docs: `SEGURANCA.md`, ADR-0008.

## Segurança

- IDOR: toda busca filtra por `userId`; id de sessão de outra pessoa dá 404, sem revelar que existe.
- A lista nunca devolve segredo, hash nem id de token; só o id da família.
- O token de acesso de uma sessão encerrada vale até expirar (até 15 minutos), como no logout de hoje; o refresh token cai na hora.
- Nome do aparelho é dado do cliente: limpo, limitado e mostrado como texto.

## Fora do escopo

- Localização ou IP das sessões, e encerrar o acesso dos tokens de acesso na hora.
