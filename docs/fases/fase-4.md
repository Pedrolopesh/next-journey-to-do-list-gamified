# Fase 4 — Primeira fatia ponta a ponta (Marco 1): registro de conclusão

- Início: 2026-10-09
- Fim: 2026-10-09
- Status: concluída em código; falta o teste em aparelho físico contra a API hospedada (passo 15)

## Critérios de pronto (Marco 1)

| Critério | Evidência |
|---|---|
| Cadastro, login, listar diários, marcar um diário, ver EXP e banner atualizarem | API: 27 testes e2e; app: telas de login, cadastro e Diários com check otimista ligado ao banner (bundle Android gerado, `expo-doctor` 21/21) |
| Teste e2e do check idempotente passando | `test/items-checks.e2e-spec.ts`: repetir o `checkId` e 6 chamadas paralelas contam uma vez |
| Contra a API real hospedada | **Pendente**: roda local (Postgres no Docker). A hospedagem depende da auditoria da VPS (Fase 0) |
| CI verde | `turbo run lint typecheck test build`, e2e com Postgres de serviço e varredura de segurança |

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 | Projeto NestJS da API | feito na Fase 3 |
| 2 | Postgres local (Docker) e Prisma | feito |
| 3 | Esquema do banco, migration e seed do `game_config` | feito |
| 4 | Ambiente tipado que impede a API de subir sem variável | feito |
| 5 | Logs com `requestId` e dados sensíveis removidos | feito |
| 6 | `GET /health` (Terminus) e Swagger fora de produção | feito |
| 7 | Auth por e-mail e senha: argon2id, JWT de 15 min e refresh rotativo | feito (ADR-0008) |
| 8 | `POST /v1/items/:id/checks` na transação, idempotente, e desfazer | feito |
| 9 | Testes unitários e e2e com Postgres de teste no CI | feito |
| 10 | Cliente HTTP com refresh em fila e tokens no SecureStore | feito |
| 11 | TanStack Query e Zustand | feito |
| 12 | Login e cadastro com react-hook-form + schemas do contrato | feito |
| 13 | Tela de Diários com check otimista | feito |
| 14 | Resultado do check ligado ao banner | feito |
| 15 | Teste em aparelho físico contra a API em staging | pendente |

## Desvios do plano

- Testes de lógica do app em Vitest (Node), não Jest: componentes entram com jest-expo na Fase 5.
- Prisma 7 (client em `src/generated`, adapter `pg`, `prisma.config.ts`) e a tarefa `generate` no Turbo.
- Duas vulnerabilidades altas do CLI do Prisma corrigidas com `overrides`.

## Pendências herdadas

- Passo 15 e a API hospedada (dependem da VPS auditada).
- Atualização do banner com a `Sprite` real e idle (refinamentos).
- Medição do banner (ADR-0003).
