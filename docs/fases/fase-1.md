# Fase 1 — Fundação do monorepo: registro de conclusão

- Início: 2026-10-02
- Fim: 2026-10-03
- Status: concluída

## O que a fase entregou

Um repositório onde instalação, build, lint, typecheck e os hooks de qualidade funcionam, com CI verde. Nenhuma funcionalidade ainda.

## Critérios de pronto

| Critério | Evidência |
|---|---|
| `pnpm install` e `pnpm run build` passam local e no CI | CI verde na `main` (GitHub Actions, workflow `CI`) |
| `lint` e `typecheck` passam | rodam no `packages/contracts` (único pacote com código por enquanto) e no CI |
| Commit com mensagem fora do padrão é rejeitado | testado: o commitlint barrou a mensagem de teste |
| Commit com erro de lint é corrigido ou barrado | testado: imports fora de ordem foram corrigidos pelo autofix; `console.log` barrou o commit |
| `pre-push` roda typecheck e test dos pacotes alterados | executado no push das branches |
| Primeiro PR aberto, CI verde, merge | PRs #1 a #4 (empilhados) e CI verde na `main` |
| ADR-002 criado | `docs/adr/0002-monorepo-com-pnpm-e-turborepo.md` |

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 a 5 | Node e pnpm fixados; workspace; Turborepo e scripts da raiz | feito |
| 6 | Pacotes compartilhados `tsconfig`, `eslint-config` e `contracts` | feito (sem `apps/*`, ver desvios) |
| 7 | Configurações base do TypeScript | feito |
| 8 | ESLint: ferramenta que aponta erros e padroniza o código | feito |
| 9 | Prettier e `.editorconfig`: formatação única | feito |
| 10 | Husky, lint-staged e commitlint: verificações automáticas ao commitar e dar push | feito |
| 11 | `AGENTS.md` e `CLAUDE.md`: regras para pessoas e agentes de IA | feito (AGENTS.md por app quando cada app existir) |
| 12 | CI no GitHub Actions: roda as verificações em todo PR | feito |
| 13 | `.gitignore`, README, LICENSE | feito (`.env.example` por app quando cada app existir; licença pendente de escolha) |
| 14 | Primeiro PR, merge e ADR-002 | feito |

## Desvios do plano

- `apps/api`, `apps/mobile` e `apps/banner` não foram criadas vazias: os geradores (Nest CLI, `create-expo-app`, Vite) exigem diretório novo. Nascem nas Fases 2 e 4.
- pnpm 11.28.3 no lugar da versão mais recente; TypeScript `~5.9` no lugar da 7.x; flag do ESLint no lint-staged (ADR-0005).
- Foram acrescentados, além do plano: política de segurança, varredura de segredos no CI, template de PR, OpenSpec, `SECURITY.md` e proteção da `main` (ADR-0006).
- O histórico do Git foi reescrito em 2026-10-03 para remover dados de infraestrutura e atribuições de ferramenta dos commits (ver `docs/SEGURANCA.md`).

## Pendências herdadas

- Escolher a licença do projeto (código e arte).
- Fechar a auditoria de segurança da hospedagem antes do primeiro deploy (acompanhada fora do repositório).
- Fase 0: contas Apple, Google Play, Expo, Sentry e Resend; política de privacidade; cofre de segredos.
- Confirmar as regras complementares da especificação (viram testes na Fase 3).
- Desenhar no Figma as telas que faltam (necessário antes da Fase 5).
