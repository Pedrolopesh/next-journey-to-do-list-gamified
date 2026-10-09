# Fase 3 — Regras de progressão e contratos: registro de conclusão

- Início: 2026-10-09
- Fim: 2026-10-09
- Status: concluída (as regras complementares aguardam a confirmação do Pedro; ADR-0004 como proposta)

## Critérios de pronto

| Critério | Evidência |
|---|---|
| Cobertura de `progression/domain` ≥ 80% | 100% (instruções, ramos, funções e linhas) com `pnpm --filter @nextjourney/api test:cov`; o `vitest.config.ts` falha abaixo de 80% |
| Todos os exemplos da especificação têm teste | `expParaNivel` (1 → 2 = 50; 7 → 8 = 500), capítulos (10 a 30 e teto de 40), EXP e moedas por dificuldade, bônus de nível, desfazer sem o nível cair, diários e fuso (`*.spec.ts`) |
| Contratos importados por api, mobile e banner sem erro de tipo | `typecheck` verde nos três; o `domain` da API importa tipos de `@nextjourney/contracts` |
| Testes de propriedade | fast-check: aplicar e desfazer volta ao estado original (exceto nível), invariantes de EXP e nível |
| CI verde | `turbo run lint typecheck test build` (14 tarefas) e varredura de segurança passam |

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 | Criar o módulo `progression` na API (pasta `domain/` com funções puras) | feito |
| 2 | Tipos do jogo (config, estado, entrada do check) | feito, vindos do `contracts` |
| 3 | `aplicarCheck`: o que um check rende (EXP, moedas, nível, capítulo) | feito |
| 4 | `expParaNivel` e `checksParaCapitulo` | feito |
| 5 | `desfazerCheck`: reverter um check no mesmo dia, sem o nível cair | feito |
| 6 | `estaAtrasado` e `calcularStreak` dos diários | feito |
| 7 | `diaLocal`: o dia do usuário no fuso dele | feito |
| 8 | Testes de unidade e de propriedade | feito (51 testes) |
| 9 | Schemas Zod compartilhados | feito |
| 10 | Protocolo do banner no mesmo pacote | feito na Fase 2 |
| 11 | AGENTS.md de `contracts` e `progression` | feito |
| 12 | ADR-004 com as regras ambíguas | feito como proposta |

## Desvios do plano

- A Fase 3 começou antes do ADR-003 (medição do banner): decisão intencional do Pedro, risco baixo, porque as regras são do back-end.
- O passo 1 da Fase 4 (criar a API NestJS) foi antecipado, pois a Fase 3 depende dele.
- NestJS 12 em ESM com Vitest, em vez de NestJS 11 com Jest (ADR-0007).
- Os tipos do jogo (`GameConfig`, `PlayerState`...) ficam no `contracts`, e o domínio os importa, para existir uma só definição.

## Pendências herdadas

- Confirmar as regras complementares (ADR-0004 vira "aceita" ou é substituído).
- Conquistas, resumo semanal e contador semanal do hábito: Fase 4 e 5.
- Passos 16 e 17 da Fase 2 (medição do banner e ADR-0003), obrigatórios antes de concluir todas as implementações.
