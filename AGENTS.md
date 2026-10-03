# Next Journey — Agent Context

Este arquivo é lido por agents ANTES de qualquer alteração neste repo. Fonte de verdade de stack, regras e checklists. Visão geral em `docs/COMO-FUNCIONA.md`.

## Projeto

To-do list gamificado (diários, tarefas e hábitos rendem EXP e moedas e fazem um personagem LPC avançar por uma história). Monorepo **pnpm + Turborepo**, pacotes no escopo `@nextjourney/*`.

- `apps/api`: NestJS 11 + Prisma + PostgreSQL (a criar, Fase 4)
- `apps/banner`: camada de jogo em Vite + TypeScript + CSS, roda num WebView (a criar, Fase 2)
- `apps/mobile`: React Native + Expo, Expo Router (a criar, Fase 2)
- `packages/contracts`: schemas Zod compartilhados (API, app, banner)
- `packages/tsconfig`, `packages/eslint-config`: configuração compartilhada

Docs: `docs/COMO-FUNCIONA.md`, `docs/TURBOREPO.md`, `docs/PLAN_TODO_APP.md` (fases), `docs/REQUISITOS.MD` (especificação), `docs/SEGURANCA.md`.

## Stack (FATO, não alterar sem confirmar)

- Node 24 (`.nvmrc`), **pnpm 11.28.3** (campo `packageManager`), Turborepo 2.x, TypeScript **~5.9** (a 7.x quebra o `typescript-eslint`)
- ESLint 9 (flat config), Prettier, Husky, lint-staged, commitlint
- **NUNCA** usar `npm` ou `yarn` neste repo, só `pnpm`
- Decisões em `docs/PLAN_TODO_APP.md` (seção "Decisões fechadas") e nos ADRs em `docs/adr/`

## Comandos

- `pnpm install`
- `pnpm run build | lint | typecheck | test | dev` (todos via Turbo)
- `pnpm --filter @nextjourney/<pacote> <script>`: um pacote só
- `pnpm run security`: varredura de dados sensíveis e `pnpm audit` (rodar antes de todo PR)
- Ambiente do Pedro: o hook do `rtk` reescreve `pnpm lint`; use `rtk proxy pnpm run lint`

### O que a CI verifica em todo PR

`pnpm install --frozen-lockfile` → `turbo run lint typecheck test build` → `scripts/security-scan.sh`. Rode os mesmos comandos localmente antes de abrir PR.

## Arquitetura (alvo)

- App ↔ API: REST `/v1` (JWT 15 min + refresh rotativo). App ↔ banner: `postMessage` `{ v: 1, type, payload }`, validado com Zod dos dois lados. O banner nunca acessa a API.
- O **servidor decide a progressão**. Toda regra de EXP, moedas, nível, sequência, capítulo e conquistas mora só em `apps/api/src/modules/progression/domain`, como função pura com teste. O app não calcula EXP.
- Contratos entre projetos só em `packages/contracts`. Nunca duplicar tipos.

## OpenSpec (mudanças com spec)

Mudança que altere comportamento, contrato da API, protocolo do banner ou regra de jogo passa por OpenSpec antes de virar código: `/opsx:propose` (proposal, design, specs, tasks), `/opsx:apply` (implementar as tasks), `/opsx:archive` (arquivar e sincronizar as specs). Specs vivas em `openspec/specs/`, mudanças em `openspec/changes/`. O `openspec/config.yaml` é curto de propósito: a fonte de verdade é este arquivo. Correção pequena e mudança só de documentação não precisam de proposta.

## Regras de implementação (OBRIGATÓRIAS)

1. **Reuso antes de criar.** Procure em `packages/` e nos módulos existentes antes de criar algo novo.
2. **Nunca devolva o model do Prisma inteiro.** `select` explícito ou DTO de saída: allowlist, não denylist.
3. **Toda rota nasce protegida.** Guard mais restritivo que serve, no nível do controller; autenticação não é autorização.
4. **Contrato explícito.** Entrada e saída validadas com Zod (`packages/contracts`); nunca repassar o corpo cru para o Prisma. Mudou contrato? Está no mesmo PR e na spec.
5. **Banco.** `$queryRaw` só com parâmetro vinculado. Migration nova, nunca editar migration aplicada. Índice em toda coluna de filtro ou ordenação.
6. **Textos de interface só via i18n** (`pt-BR.json`). Cores e tamanhos só pelos tokens do design system.
7. **Logs sem dados sensíveis:** nunca e-mail, senha, token ou corpo de requisição.
8. **Datas** em UTC no banco; "dia" do usuário no fuso do perfil; registro em ISO 8601.
9. **Teste novo para regra nova.** Mudança de regra de jogo começa por um teste.

## Checklist de segurança (verificar a CADA PR)

Resumo; a versão completa e o histórico de auditorias estão em `docs/SEGURANCA.md`. O PR template repete estes itens e todos precisam ser marcados.

### Sempre

- **Segredos:** nada de token, senha, chave, `.env`, certificado ou IP/host de infraestrutura em código, docs, testes, commit ou PR. `pnpm run security` precisa passar.
- **Exposição excessiva:** nunca devolver o model do ORM inteiro.
- **IDOR/BOLA:** receber `id` do cliente exige validar que o solicitante pode acessar **aquele objeto**.
- **Autorização ≠ autenticação.**
- **Segredo em log ou erro:** tokens, senhas, e-mails completos e stack traces não vão para log nem resposta.
- **Falha aberta:** em erro, negar. Nunca `catch` que autoriza.

### API (NestJS)

- Mass assignment (campos como `role`, `isBlocked` jamais vêm do cliente), SQL injection (`$queryRaw`), SSRF, path traversal.
- JWT: validar `exp`, algoritmo fixo, segredo forte fora do código. Refresh token rotativo; reuso revoga a família.
- Enumeração de contas: login, esqueci a senha e cadastro respondem igual para e-mail existente e inexistente; com rate limit.
- Comparação de segredo em tempo constante (`crypto.timingSafeEqual`).
- ReDoS, race condition (transação ou constraint única), CORS com allowlist (nunca refletir `Origin` com credenciais), helmet ligado.
- Idempotência do check (`checkId`): repetir não pode duplicar EXP.

### App (Expo/React Native) e banner (WebView)

- Tokens só no SecureStore; nada sensível no AsyncStorage, em log, em URL ou em query string.
- WebView: `originWhitelist` restrito, só HTML local embutido, sem carregar URL externa; toda mensagem do banner validada com Zod e descartada se inválida.
- O banner não faz requisição de rede e não guarda estado.
- Deep links e `scheme`: validar parâmetros; sem open redirect.
- Segredos de build (EAS) só no gerenciador de segredos; `EXPO_PUBLIC_*` é público, nunca colocar segredo nele.
- Validação no cliente é UX; a regra existe no backend também.

### Dependências

- Conferir o nome exato do pacote (typosquatting) antes de instalar; lockfile versionado junto.
- `pnpm audit` limpo para severidade alta ou crítica.
- Ação nova no GitHub Actions: fixar versão e preferir ações oficiais.

## Safety

- NUNCA commitar `.env` com valores reais; só `.env.example`.
- NUNCA push direto em `main` — sempre branch + PR.
- NUNCA editar migrations já aplicadas.
- **NUNCA colocar atribuição ao Claude/IA em commits ou PRs.** Sem `Co-Authored-By`, sem `Claude-Session`, sem "Generated with". O autor é só o Pedro.
- Sempre `git pull origin main` antes de começar.
- **Convenção de branch:** `<tipo>/<slug-em-kebab-case>`. Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`.
- **Commits:** Conventional Commits. O assunto começa em minúscula (o commitlint rejeita maiúscula inicial). Um passo do plano por PR; o corpo cita a fase e o passo.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
