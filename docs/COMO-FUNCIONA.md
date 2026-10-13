# Next Journey — como o projeto funciona

Atualizado em 2026-10-12. Este documento descreve **o que existe hoje** no repositório e **como as peças conversam**. O estado do trabalho e o que falta ficam no [`HANDOFF.md`](../HANDOFF.md). Fontes: plano de implementação (documento local, fora do Git) (fases), [REQUISITOS.MD](./REQUISITOS.MD) (especificação), [FIGMA-INTERA.md](./FIGMA-INTERA.md) (design) e [TURBOREPO.md](./TURBOREPO.md) (ferramenta de build).

## 1. O produto em uma frase

Um to-do list de uso pessoal para iOS e Android em que cada item marcado rende EXP e moedas e faz um personagem pixel art (LPC) avançar por uma história em 5 capítulos (6 histórias, uma por cenário; cada nível ganho conclui um capítulo). Três tipos de item (diário, tarefa, hábito) usam o mesmo check. Sem social, sem loja, sem penalidades na v1.

## 2. Estado atual do repositório (2026-10-12)

| Item | Estado |
|---|---|
| Plano, especificação e registro do Figma | Prontos, em `docs/` |
| Monorepo pnpm + Turborepo, hooks e CI | Funcionando: ESLint, Prettier, Husky, lint-staged, commitlint e GitHub Actions (lint, typecheck, test, build e varredura de segurança em todo PR) |
| `packages/contracts` | Schemas Zod compartilhados (auth, itens, check, histórias, personagem, protocolo do banner), com testes; build com `tsup` |
| `packages/tsconfig`, `packages/eslint-config` | Prontos |
| `apps/api` | NestJS + Prisma + PostgreSQL: auth, itens, check, progressão, histórias, conquistas, personagem, `GET /home`, exclusão de conta; testes unitários e e2e |
| `apps/banner` | Vite + TypeScript: cena Mapa (CSS) e cena QG (canvas, 7 cenários, personagem LPC); laboratórios de desenvolvimento (`lab.html`, `buttons.html`, `dev.html`) fora do build |
| `apps/mobile` | Expo + React Native: cadastro, onboarding, Home com o QG, abas de itens, perfil, configurações e créditos |
| Hospedagem | Decidida: servidor próprio em contêineres. Ainda sem deploy do Next Journey |

As Fases 1 a 5 estão concluídas em código; a Fase 6 (conteúdo e arte) e a Fase 7 (produção) estão em andamento. O que falta está no `HANDOFF.md`.

## 3. Estrutura de pastas

```
next-journey-to-do-list-gamified/
  apps/
    api/        NestJS + Prisma + PostgreSQL
    banner/     Vite + TypeScript; Mapa em CSS e QG em canvas (src/qg)
    mobile/     Expo + React Native + Expo Router
  packages/
    contracts/      schemas Zod e tipos compartilhados
    tsconfig/       configurações base do TypeScript
    eslint-config/  regras de lint compartilhadas
  docs/            plano, requisitos, Figma, ADRs, QA, segurança e este documento
  openspec/        propostas e specs de mudanças de comportamento
  scripts/         varredura de segurança e backup
  HANDOFF.md       estado do trabalho para quem for continuar
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
│ Vite + TS     │
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
2. O app gera um `checkId` (UUID v4), manda `ITEM_CHECKED` ao banner na posição atual e chama `POST /v1/items/:id/checks`.
3. A API, em uma única transação (`prisma.$transaction`): valida o check, grava em `item_checks`, atualiza sequência, `user_stats` e `story_progress`, avalia conquistas, e responde um `CheckResult` (EXP, moedas, nível, se subiu de nível, progresso do capítulo (EXP do nível), se concluiu o capítulo, conquistas desbloqueadas).
4. O app reconcilia o cache com o `CheckResult` e mostra o toast de EXP e moedas; o personagem corre até a posição nova (a EXP do nível). Subida de nível e conquistas entram numa fila de modais, um de cada vez.
5. Subiu de nível: o personagem chega ao portal e espera; o modal do capítulo concluído abre junto do de nível. No check seguinte o app envia `CHAPTER_COMPLETED` (fade da troca de cena) e o personagem recomeça na posição da EXP.
6. Erro de rede: o check vai para a fila offline e continua marcado. Erro de regra (4xx): o app desfaz o otimismo e mostra o motivo.

O `checkId` torna o check **idempotente**: repetir a chamada (ou reenviar pela fila offline) não duplica EXP.

Valores iniciais (ficam na tabela `game_config`, ajustáveis sem novo build): EXP 5/10/20 e moedas 1/2/4 por dificuldade (fácil/médio/difícil); EXP de nível n para n+1 = 75n − 25; cada nível ganho conclui um capítulo da história ativa; bônus de 10 moedas ao subir de nível; 5 capítulos por história; hábitos sem limite diário de checks; virada do dia às 00:00 no fuso do perfil. O restante das regras (desfazer, conquistas, casos de borda) está em REQUISITOS.MD, seção "Regras complementares".

## 6. Stack por projeto

| Projeto | Principais tecnologias |
|---|---|
| API | Node 24, NestJS 11, Prisma, PostgreSQL 16+, Zod + nestjs-zod, argon2, JWT, nestjs-pino, helmet, throttler, Terminus (`/health`), Swagger fora de produção, Vitest |
| Banner | Vite, TypeScript; Mapa em CSS (`@keyframes`, só `transform` e `opacity`) e QG em canvas 2D com sprites LPC; Vitest + jsdom |
| App | Expo (development build, não Expo Go), React Native, Expo Router, TanStack Query, Zustand, axios, react-hook-form + Zod, SecureStore, reanimated, i18next (pt-BR), google-signin, expo-apple-authentication, expo-notifications, Sentry, jest-expo |
| Compartilhado | pnpm, Turborepo, TypeScript strict, ESLint 9 (flat config), Prettier, Husky, lint-staged, commitlint, GitHub Actions |

## 7. Como rodar hoje

Pré-requisitos, comandos e armadilhas conhecidas estão no [`HANDOFF.md`](../HANDOFF.md) (seção "Como rodar localmente"). Em resumo: Node 24, pnpm 11 via corepack, `pnpm install` e `pnpm exec turbo run lint typecheck test build`.

## 8. Ambientes e hospedagem

- **Desenvolvimento:** Postgres local via `docker compose` (arquivo na raiz, Fase 4), app em development build contra a API local ou de staging.
- **Staging e produção:** uma VPS própria da We Tech Hub (Ubuntu 24.04), em Docker, com nginx no host (80/443) e certbot. Regras: Postgres próprio do Next Journey em compose project separado, portas publicadas só em `127.0.0.1`, limites de memória e CPU por container, staging e produção em projetos e portas distintos, backup diário do Postgres com 7 dias de retenção, monitor externo no `/health`. Endereço, inventário e achados de auditoria ficam fora do repositório.
- **Pré-requisito de segurança:** concluir a revisão da hospedagem (registrada fora do repositório) antes do primeiro deploy.
- **Builds do app:** EAS Build e EAS Submit, perfis `development`, `preview` e `production`; OTA (EAS Update) para correções de JavaScript e do banner.
- **E-mail:** Resend, só para recuperação de senha.
- **Identidade:** nome Next Journey; bundle id `br.com.wetechhub.app` (dev: `br.com.wetechhub.app.dev`), imutável a partir do primeiro build iOS com credenciais Apple.

## 9. Como o trabalho é conduzido

- Plano em 9 fases (0 a 8) e 3 marcos, com critério de pronto por fase. Estado na tabela de Andamento do plano (documento local, fora do Git).
- Cada passo numerado vira um PR pequeno com Conventional Commits (`feat(mobile): ...`, `chore: ...`). PR só entra com lint, typecheck e testes verdes no CI.
- Decisões difíceis de reverter viram ADR em `docs/adr/`. O diário do projeto fica em `docs/DIARIO.md`. Datas sempre em ISO 8601.
- Regra de ouro do plano: se uma decisão, mudança de escopo ou desvio não está escrito com data, ele não aconteceu.

## 10. Decisões já tomadas (2026-10-02)

- Regras de progressão num único lugar do back-end; sem pacote `@nextjourney/domain`.
- Banner: Mapa em CSS; QG em canvas (decidido na Fase 6, com limite de 30 quadros por segundo e peso máximo de 1,5 MB).
- Login Google com `@react-native-google-signin/google-signin`.
- Rota do check: `POST /v1/items/:id/checks`.
- Sem limite de checks por hábito.
- Escolhas narrativas e escolha de mapa: backlog (fora da v1).
- Excluir conta: sem tela dedicada, linha em Configurações › Conta com diálogo de confirmação (exigência das lojas).
- Hospedagem própria, em contêineres.

## 11. Pendências conhecidas

- Concluir a revisão de segurança da hospedagem antes do primeiro deploy (registrada fora do repositório).
- Confirmar as "Regras complementares" propostas em REQUISITOS.MD.
- Desenhar no Figma: Conquistas, modal de conquista, Minha história, Categorias, Configurações, Termos no cadastro e Créditos.
- Escrever o ADR-0003 (WebView para o banner), depois da medição em aparelho.
