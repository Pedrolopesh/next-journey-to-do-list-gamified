<!--
Título: tipo(escopo opcional): assunto em inglês e em minúscula  (ex.: feat: add the task history to the profile)
Escreva o conteúdo em inglês, direto: frases curtas, no presente, sem história do que foi tentado. Os cinco títulos de seção ficam em português (a CI os confere). Sem menção a IA ou sessão.
-->

## O que muda

<!-- Lista curta do resultado, por área (API, app, banner, contratos, docs). Uma linha por item. -->

## Por quê

<!-- A necessidade em uma ou duas frases. Cite a proposta do OpenSpec, o ADR ou o passo do plano. -->

## Como foi verificado

<!-- O que rodou e o resultado. Diga também o que NÃO foi verificado (ex.: iPhone físico). -->

- [ ] `pnpm run verify` passed (lint, types, tests, build, API e2e, OpenSpec, duplication, security)
- [ ] `/code-review` run and its findings handled before opening the PR
- [ ] Touched a screen: Maestro flows (`pnpm --filter @nextjourney/mobile test:ui`) and RN-FB (every action shows loading and ends in a toast)

## Riscos e pendências

<!-- Migration (nome e como aplicar), seed, mudança de contrato, impacto em dados existentes, dívida técnica conhecida. "Nenhum" se não houver. -->

## Segurança

- [ ] Public repository: no secret, token, IP, host or infrastructure data in code, docs, commits or this description
- [ ] New routes are protected, validated with Zod and return only the needed fields; no access to another user's object (IDOR)
- [ ] Nothing sensitive in logs, errors, URLs or insecure storage; new dependencies have the exact name checked and the lockfile included
- [ ] No attribution to an AI tool in commits or here
