# AGENTS.md

## Projeto

Next Journey: to-do list gamificado (diários, tarefas e hábitos rendem EXP e moedas e fazem um personagem LPC avançar por uma história). Monorepo pnpm + Turborepo.

- `apps/api`: NestJS + Prisma + PostgreSQL (a criar, Fase 4)
- `apps/banner`: camada de jogo em Vite + TypeScript + CSS, roda num WebView (a criar, Fase 2)
- `apps/mobile`: React Native + Expo (Expo Router) (a criar, Fase 2)
- `packages/contracts`: schemas Zod compartilhados (API, app, banner)
- `packages/tsconfig` e `packages/eslint-config`: configuração compartilhada

Documentação: `docs/COMO-FUNCIONA.md` (visão geral), `docs/TURBOREPO.md` (ferramenta), `docs/PLAN_TODO_APP.md` (fases), `docs/REQUISITOS.MD` (especificação).

## Comandos

- `pnpm install`
- `pnpm run build | lint | typecheck | test | dev` (todos via Turbo)
- `pnpm --filter @nextjourney/<pacote> <script>` para um pacote só
- No ambiente do Pedro o hook do `rtk` reescreve `pnpm lint`; use `rtk proxy pnpm run lint`.

## Regras

- Toda regra de progressão (EXP, moedas, nível, sequência, capítulo, conquistas) mora só em `apps/api/src/modules/progression/domain`, como função pura com teste. O app não calcula EXP.
- Contratos entre projetos só em `packages/contracts`. Nunca duplicar tipos.
- Nunca logar e-mail, senha, token ou corpo de requisição.
- Nunca editar migration já aplicada; criar uma nova.
- Textos de interface só via i18n (`pt-BR.json`).
- Cores e tamanhos só pelos tokens do design system.
- Nunca commitar segredos (`.env`, tokens, chaves).
- Datas sempre em ISO 8601 (AAAA-MM-DD). Decisão difícil de reverter vira ADR em `docs/adr/`.

## Pronto para PR

Lint, typecheck e testes passando; teste novo para regra nova; Conventional Commits; sem `console.log`. Cada passo do plano vira um PR pequeno; o corpo cita a fase e o passo.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
