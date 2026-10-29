# Processo de PR: da branch ao merge

Objetivo: nenhum PR sobe com erro que uma máquina acharia, e todo PR é fácil de revisar. As etapas abaixo valem para pessoas e para agentes.

## 1. Antes de abrir o PR (local)

1. `git pull origin main` e uma branch `<tipo>/<slug>`.
2. Commits: Conventional Commits **em inglês** e em minúscula, **sem corpo** e **sem atribuição a IA** (conferido por `commitlint`).
3. Mudança de comportamento, contrato ou regra de jogo: proposta no OpenSpec (`/opsx:propose`) antes do código.
4. `pnpm run verify` (ver abaixo). Só segue com tudo verde.
5. `/code-review` na branch. Corrija tudo que for relevante; o que ficar pendente vai para o `HANDOFF.md` com motivo, e para a seção "Riscos e pendências" do PR.
6. Descrição no padrão do `.github/PULL_REQUEST_TEMPLATE.md`, **em inglês** (veja a seção 5).

## 2. O que `pnpm run verify` confere

| # | Etapa | Ferramenta |
|---|---|---|
| 1 | Mensagens dos commits | `commitlint` (`scripts/check-commits.sh`) |
| 2 | Lint, tipos, testes unitários e build de todos os pacotes | Turborepo |
| 3 | Regras de negócio contra o banco (e2e da API) | Vitest + Supertest + Postgres de teste |
| 4 | Propostas do OpenSpec alteradas | `openspec validate` (`scripts/check-openspec.sh`) |
| 5 | Código duplicado (limite 2%) | `jscpd` (`.jscpd.json`) |
| 6 | Segredos, IPs, histórico, autoria e dependências | `scripts/security-scan.sh` (modo completo) |
| 7 | Árvore limpa | `git status` |

`SKIP_E2E=1 pnpm run verify` pula o e2e quando não há Postgres local. A CI roda tudo isso (menos o completo do passo 6) a cada PR.

## 3. CI (`.github/workflows/ci.yml`)

- Job `check`: commits do PR, lint, tipos, testes, build, e2e da API (PostgreSQL que já vem no runner), OpenSpec, duplicação e varredura de segredos.
- Job `descricao`: título no formato `tipo: assunto` e as cinco seções do template; bloqueia citação de ferramenta de IA.
- Ações oficiais com versão fixada; nenhum segredo de repositório no fluxo.
- Fora da CI, por ora: testes de interface (Maestro, precisam de emulador). Rode antes do PR se mexeu em tela (`docs/TESTES.md`).

## 4. Revisão de segurança, em todas as frentes

Percorra o checklist do `AGENTS.md` para o que mudou:

- **API**: rota nasce protegida, entrada e saída com Zod, `select`/DTO (nunca o model inteiro), objeto do próprio usuário (IDOR), transação para contadores, sem dado sensível em log.
- **App**: tokens só no SecureStore, nada sensível em AsyncStorage, URL ou log; validação no cliente é só UX.
- **Banner/laboratório**: sem rede, sem estado, mensagens validadas; o laboratório é só de desenvolvimento.
- **Contratos**: mudança de contrato e de consumidores no mesmo PR.
- **Dependências**: nome exato, versão fixada, lockfile junto, `pnpm audit` sem alta ou crítica (exceções documentadas em `pnpm-workspace.yaml`).
- Não existe app administrativo neste repositório; se vier a existir, entra nesta lista.

## 4.1 Qualidade e duplicação

- Procure no repositório antes de criar (reuso). Trecho repetido em dois lugares vira função ou módulo compartilhado.
- `pnpm run duplicates` falha acima de 2%. Arte gerada (`qg/scenes`) e dados de pixel art ficam de fora.
- Dívida que não cabe no PR vai para o `HANDOFF.md`, com o motivo, nunca fica só na cabeça de alguém.

## 5. Abrir e mesclar

- Só com autorização do Pedro (por PR, ou por pedido explícito no chat para um lote). Sem `git push` antes disso.
- Título e descrição **em inglês**, curtos e declarativos. Os cinco títulos de seção do template ficam em português (`## O que muda`, `## Por quê`, `## Como foi verificado`, `## Riscos e pendências`, `## Segurança`), porque a CI confere esses títulos; o conteúdo de cada seção vai em inglês. A lista de caixas do template pode virar frases curtas (padrão dos PRs da infra). Diga também o que não foi verificado.
- Sem rodapé de ferramenta, sem co-autor e sem menção a IA ou sessão, no título, no corpo e nos commits. A CI bloqueia as formas comuns no título e no corpo do PR e o `commitlint` nos commits; o idioma (inglês) não é conferido por máquina, é regra de revisão.

Exemplo de descrição (conteúdo em inglês, títulos em português):

```md
## O que muda

- The release workflow builds `@nextjourney/contracts` before the smoke tests.

## Por quê

The smoke step failed with `Cannot find module .../contracts/dist/index.js`.

## Como foi verificado

- Reproduced from the run log; not yet exercised on a real release.

## Riscos e pendências

- Nenhum.

## Segurança

- No permission, secret or access change.
```
- Merge por squash, com título `tipo: assunto (#N)` e **corpo vazio** (`gh pr merge --squash --body ""`), depois de CI verde.
- Depois do merge: atualizar a `main` local e apagar a branch.
