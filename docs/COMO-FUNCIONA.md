# Next Journey — como o projeto funciona

Atualizado em 2026-10-03 (após a Fase 1, passos 8 a 10). Este documento descreve **o que existe hoje** no repositório e **como as peças vão conversar** quando estiverem prontas. Onde algo ainda não existe, está marcado como **(planejado)** com a fase do plano. Fontes: [PLAN_TODO_APP.md](./PLAN_TODO_APP.md) (fases), [REQUISITOS.MD](./REQUISITOS.MD) (especificação), [FIGMA-INTERA.md](./FIGMA-INTERA.md) (design) e [TURBOREPO.md](./TURBOREPO.md) (ferramenta de build).

## 1. O produto em uma frase

Um to-do list de uso pessoal para iOS e Android em que cada item marcado rende EXP e moedas e faz um personagem pixel art (LPC) avançar por uma história em 5 capítulos. Três tipos de item (diário, tarefa, hábito) usam o mesmo check. Sem social, sem loja, sem penalidades na v1.

## 2. Estado atual do repositório (2026-10-03)

| Item | Estado |
|---|---|
| Plano, especificação e registro do Figma | Prontos, em `docs/` |
| Monorepo pnpm + Turborepo | Funcionando (Fase 1, passos 1 a 7) |
| `packages/tsconfig` | Pronto: `base.json`, `node.json`, `react-native.json` |
| `packages/contracts` | Esqueleto: `src/index.ts` vazio; `build` ainda é um `echo` (tsup entra na Fase 3); já tem `lint` e `typecheck` reais |
| `packages/eslint-config` | Pronto: `base.js`, `node.js`, `react.js` (ESLint 9 flat config, regras type-checked, imports ordenados, `no-console`) |
| Prettier, Husky, lint-staged, commitlint | Funcionando: `pre-commit` (ESLint `--fix` e Prettier nos arquivos staged), `commit-msg` (Conventional Commits), `pre-push` (typecheck e test dos pacotes alterados) |
| CI no GitHub Actions | Planejado (Fase 1, passo 12) |
| `apps/api`, `apps/banner`, `apps/mobile` | Planejado (Fases 2 e 4) |
| Hospedagem | Decidida: VPS própria, em Docker. Ainda sem deploy |

Nenhuma funcionalidade do app existe ainda. Hoje o repositório só prova que instalação, build, lint, typecheck e os hooks de qualidade funcionam.

## 3. Estrutura de pastas

```
next-journey-to-do-list-gamified/
  apps/                        (vazia; os apps nascem nas Fases 2 e 4)
    api/        NestJS + Prisma + PostgreSQL         (planejado, Fase 4)
    banner/     Vite + TypeScript, camada de jogo    (planejado, Fase 2)
    mobile/     Expo + React Native + Expo Router    (planejado, Fase 2)
  packages/
    contracts/      schemas Zod e tipos compartilhados
    tsconfig/       configurações base do TypeScript
    eslint-config/  regras de lint compartilhadas
  docs/            plano, requisitos, Figma, este documento e o do Turborepo
  .nvmrc           versão do Node (24)
  package.json     raiz: scripts e versão do pnpm
  pnpm-workspace.yaml   quais pastas são pacotes
  pnpm-lock.yaml        versões exatas instaladas
  turbo.json            tarefas e dependências entre elas
  AGENTS.md        regras para agentes de IA (o bloco do Turborepo é escrito pelo próprio turbo)
```

Nome dos pacotes: escopo `@nextjourney/*` (ex.: `@nextjourney/contracts`). Um pacote enxerga o outro pelo nome, sem publicar nada.

## 4. Os três projetos e como conversam

```
┌───────────────┐   REST /v1 (JSON, HTTPS)   ┌───────────────────┐
│ apps/mobile   │ ─────────────────────────▶ │ apps/api          │ ──▶ PostgreSQL
│ Expo / RN     │ ◀───────────────────────── │ NestJS + Prisma   │
└──────┬────────┘      CheckResult           └───────────────────┘
       │ postMessage { v:1, type, payload }
       ▼
┌───────────────┐
│ apps/banner   │  roda dentro de um WebView; nunca acessa a API
│ Vite + CSS    │
└───────────────┘
        └──────── todos importam schemas Zod de packages/contracts ────────┘
```

- **App ↔ API:** REST sob `/v1`, com JWT de acesso (15 min) e refresh token rotativo (30 dias). Login Google e Apple acontece no aparelho; só o ID token vai para a API, que o valida.
- **App ↔ banner:** o banner é um único `banner.html` embutido no app (gerado pelo Vite com `vite-plugin-singlefile`) e carregado em um WebView. O app envia mensagens (`INIT`, `ITEM_CHECKED`, `CHAPTER_COMPLETED`, `SET_CHARACTER`, `SET_TIME_OF_DAY`, `PAUSE`/`RESUME`) e o banner responde com `READY`, `CHAPTER_TRANSITION_DONE` e `ERROR`. Toda mensagem é validada com Zod nos dois lados.
- **Contratos:** `packages/contracts` é a única fonte dos formatos de dados. Se um schema muda, o typecheck dos três apps quebra no mesmo PR.

## 5. A regra central: o servidor decide a progressão

Toda a regra de EXP, moedas, nível, capítulo, sequência (streak), desfazer e conquistas fica **só na API**, em `apps/api/src/modules/progression/domain`, como funções puras com teste (decisão de 2026-10-02; não existe pacote de domínio compartilhado). O app **não calcula EXP**.

Fluxo de um check:

1. O usuário toca no checkbox. O app vibra, anima (180 ms) e marca o item no cache **na hora** (otimista, só o estado do check).
2. O app gera um `checkId` (UUID v4), manda `ITEM_CHECKED` ao banner com o progresso estimado do capítulo e chama `POST /v1/items/:id/checks`.
3. A API, em uma única transação (`prisma.$transaction`): valida o check, grava em `item_checks`, atualiza sequência, `user_stats` e `story_progress`, avalia conquistas, e responde um `CheckResult` (EXP, moedas, nível, se subiu de nível, progresso do capítulo, se concluiu o capítulo, conquistas desbloqueadas).
4. O app reconcilia o cache com o `CheckResult` e mostra o toast de EXP. Subida de nível e conquistas entram numa fila de modais, um de cada vez.
5. Se `chapterCompleted` vier verdadeiro, o app envia `CHAPTER_COMPLETED`; quando o banner devolve `CHAPTER_TRANSITION_DONE`, abre o modal do capítulo.
6. Erro de rede: o check vai para a fila offline e continua marcado. Erro de regra (4xx): o app desfaz o otimismo e mostra o motivo.

O `checkId` torna o check **idempotente**: repetir a chamada (ou reenviar pela fila offline) não duplica EXP.

Valores iniciais (ficam na tabela `game_config`, ajustáveis sem novo build): EXP 5/10/20 e moedas 1/2/4 por dificuldade (fácil/médio/difícil); EXP de nível n para n+1 = 75n − 25; checks para fechar o capítulo n = min(10 + 5(n − 1), 40); bônus de 10 moedas ao subir de nível; 5 capítulos por história; hábitos sem limite diário de checks; virada do dia às 00:00 no fuso do perfil. O restante das regras (desfazer, conquistas, casos de borda) está em REQUISITOS.MD, seção "Regras complementares".

## 6. Stack por projeto

| Projeto | Principais tecnologias |
|---|---|
| API | Node 24, NestJS 11, Prisma, PostgreSQL 16+, Zod + nestjs-zod, argon2, JWT, nestjs-pino, helmet, throttler, Terminus (`/health`), Swagger fora de produção, Jest |
| Banner | Vite, TypeScript, CSS `@keyframes` + `steps()` em spritesheets (só `transform` e `opacity`), Vitest + jsdom, Sentry |
| App | Expo (development build, não Expo Go), React Native, Expo Router, TanStack Query, Zustand, axios, react-hook-form + Zod, SecureStore, reanimated, i18next (pt-BR), google-signin, expo-apple-authentication, expo-notifications, Sentry, jest-expo |
| Compartilhado | pnpm, Turborepo, TypeScript strict, ESLint 9 (flat config), Prettier, Husky, lint-staged, commitlint, GitHub Actions |

## 7. Como rodar hoje

Pré-requisitos: Node 24 (`nvm use`, lê o `.nvmrc`) e o pnpm 11.28.3 via corepack.

```bash
corepack enable
corepack prepare pnpm@11.28.3 --activate   # o campo packageManager já fixa a versão
pnpm install
pnpm run build        # roda o build de todos os pacotes que têm esse script (via Turbo)
```

`pnpm run lint` e `pnpm run typecheck` já rodam no `contracts`. `test` e `dev` existem como scripts da raiz, mas nenhum pacote tem esses scripts ainda, então o Turbo responde "No tasks were executed".

Git hooks (instalados pelo `pnpm install`, via script `prepare`): commit com mensagem fora do padrão é rejeitado; arquivo `.ts` staged passa por ESLint com `--fix` e Prettier, e o commit é barrado se sobrar erro que não tem correção automática (ex.: `console.log`). O `pre-push` roda `turbo run typecheck test --filter="...[origin/main]"`.

Observação do ambiente do Pedro: o hook do `rtk` reescreve `pnpm lint` para `eslint`. Use `pnpm run lint` com `rtk proxy` na frente (`rtk proxy pnpm run lint`) para testar.

O TypeScript está fixado em `~5.9` (e não na 7.x, que é a mais nova no npm) porque o `typescript-eslint` 8.71 só aceita versões abaixo de 6.1; Expo e Nest também seguem a linha 5.x.

A versão do pnpm está fixada em 11.28.3 (e não na mais nova, 12.8.1) porque o corepack não conseguiu ativar a 12.8.1 nesta máquina em 2026-10-02.

## 8. Ambientes e hospedagem

- **Desenvolvimento:** Postgres local via `docker compose` (arquivo na raiz, Fase 4), app em development build contra a API local ou de staging.
- **Staging e produção:** uma VPS própria da We Tech Hub (Ubuntu 24.04), em Docker, com nginx no host (80/443) e certbot. Regras: Postgres próprio do Next Journey em compose project separado, portas publicadas só em `127.0.0.1`, limites de memória e CPU por container, staging e produção em projetos e portas distintos, backup diário do Postgres com 7 dias de retenção, monitor externo no `/health`. Endereço, inventário e achados de auditoria ficam fora do repositório.
- **Pré-requisito de segurança:** concluir a auditoria da VPS (registrada fora do repositório) antes do primeiro deploy.
- **Builds do app:** EAS Build e EAS Submit, perfis `development`, `preview` e `production`; OTA (EAS Update) para correções de JavaScript e do banner.
- **E-mail:** Resend, só para recuperação de senha.
- **Identidade:** nome Next Journey; bundle id `br.com.wetechhub.app` (dev: `br.com.wetechhub.app.dev`), imutável a partir do primeiro build iOS com credenciais Apple.

## 9. Como o trabalho é conduzido

- Plano em 9 fases (0 a 8) e 3 marcos, com critério de pronto por fase. Estado em `docs/PLAN_TODO_APP.md` (tabela de Andamento).
- Cada passo numerado vira um PR pequeno com Conventional Commits (`feat(mobile): ...`, `chore: ...`). PR só entra com lint, typecheck e testes verdes no CI (o CI chega no passo 12 da Fase 1).
- Decisões difíceis de reverter viram ADR em `docs/adr/`. O diário do projeto fica em `docs/DIARIO.md` (a criar). Datas sempre em ISO 8601.
- Regra de ouro do plano: se uma decisão, mudança de escopo ou desvio não está escrito com data, ele não aconteceu.

## 10. Decisões já tomadas (2026-10-02)

- Regras de progressão num único lugar do back-end; sem pacote `@nextjourney/domain`.
- Banner em CSS (canvas só como plano B, se o spike de desempenho falhar).
- Login Google com `@react-native-google-signin/google-signin`.
- Rota do check: `POST /v1/items/:id/checks`.
- Sem limite de checks por hábito.
- Escolhas narrativas e escolha de mapa: backlog (fora da v1).
- Excluir conta: sem tela dedicada, linha em Configurações › Conta com diálogo de confirmação (exigência das lojas).
- Hospedagem em VPS própria, em Docker; e-mail com Resend; monorepo único.

## 11. Pendências conhecidas

- Concluir a auditoria de segurança da VPS antes do primeiro deploy.
- Confirmar as "Regras complementares" propostas em REQUISITOS.MD.
- Desenhar no Figma: Conquistas, modal de conquista, Minha história, Categorias, Configurações, Termos no cadastro e Créditos.
- Escrever o ADR do pnpm 11 e os ADR-001 (hospedagem) e ADR-002 (monorepo com pnpm + Turborepo).
