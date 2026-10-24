## 1. Banco, contrato e token

- [x] 1.1 Migration `device_name` em `refresh_tokens`; schemas `sessionSchema` e `sessionsResponseSchema`
- [x] 1.2 `TokensService`: nome do aparelho na emissão e na rotação, `sid` no token de acesso; guard expõe o id da sessão

## 2. API

- [x] 2.1 Serviço de sessões: listar, encerrar uma (com dono) e encerrar todas
- [x] 2.2 Rotas `GET /me/sessions`, `DELETE /me/sessions/:id`, `DELETE /me/sessions`; cabeçalho `X-Device-Name` em login, confirmação e login social
- [x] 2.3 Testes unitários (nome do aparelho) e e2e (lista, atual, encerrar, IDOR, todas, rotação)

## 3. App

- [x] 3.1 Cabeçalho do aparelho no cliente HTTP e funções em `endpoints.ts`
- [x] 3.2 Tela "Sessões" com carregando, toast e estados de erro/vazio; teste de componente

## 4. Documentação e verificação

- [x] 4.1 `SEGURANCA.md`, ADR-0008, requisições no Bruno
- [x] 4.2 `pnpm run verify` verde, `/code-review` tratado
