# Next Journey

To-do list gamificado para iOS e Android. Diários, tarefas e hábitos rendem EXP e moedas e fazem um personagem pixel art avançar por uma história em capítulos. O servidor decide toda a progressão; o app só mostra.

## Estado do projeto

| Parte                                       | Situação                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API (`apps/api`)                            | No ar em ambientes de desenvolvimento e produção, com migrations, testes unitários e e2e                                                                      |
| App (`apps/mobile`)                         | Em desenvolvimento: entrada por e-mail com código, criação do personagem, história, itens, conquistas e perfil funcionam; builds de loja ainda não publicados |
| Banner e laboratório (`apps/banner`)        | Cenas do jogo em WebView e um site de revisão de arte (`lab.html`)                                                                                            |
| Infraestrutura (`apps/infra`, `apps/smoke`) | Scripts de provisionamento, deploy e testes de fumaça                                                                                                         |

Não existe aplicativo administrativo neste repositório.

## Como as peças se encaixam

```
apps/mobile (Expo)  ──REST /v1──▶  apps/api (NestJS + Prisma)  ──▶  PostgreSQL
      │
      └─ postMessage ─▶  apps/banner (Vite, dentro de um WebView)

packages/contracts: schemas Zod usados pelas três pontas
```

Detalhes em [docs/COMO-FUNCIONA.md](docs/COMO-FUNCIONA.md).

## Como rodar

Pré-requisitos: Node 24 (`.nvmrc`), Docker e Corepack.

```bash
nvm use && corepack enable
pnpm install                         # instala tudo e ativa os git hooks
cp .env.example .env && cp apps/api/.env.example apps/api/.env   # troque as senhas e o segredo do JWT
docker compose up -d                 # PostgreSQL local, só em 127.0.0.1
pnpm --filter @nextjourney/api db:deploy && pnpm --filter @nextjourney/api db:seed
pnpm --filter @nextjourney/api start:dev   # API em http://127.0.0.1:3000 (docs em /docs)
```

App no simulador ou aparelho (development build, não Expo Go):

```bash
cp apps/mobile/.env.example apps/mobile/.env
cd apps/mobile && npx expo run:ios      # ou run:android
```

Sem `RESEND_API_KEY` configurada, a API local escreve o código de entrada no log em vez de enviar e-mail.

Laboratório de arte e cenários: `pnpm --filter @nextjourney/banner dev` e abra `/lab.html`.

Os arquivos `.env` nunca vão para o Git; só os `.env.example`.

## Qualidade e segurança

```bash
pnpm run verify          # commits, lint, tipos, testes, build, e2e da API, OpenSpec, duplicação e segurança
pnpm run test            # testes unitários de todos os pacotes
pnpm --filter @nextjourney/api test:e2e   # regras de negócio contra o banco de teste
pnpm run security:full   # segredos, IPs, histórico inteiro e dependências
```

A CI repete essas verificações em todo PR. A imagem da API é escaneada (Trivy) e assinada (cosign) antes do deploy, e a análise estática (CodeQL) roda no GitHub. A política de segurança está em [SECURITY.md](SECURITY.md) e o checklist em [docs/SEGURANCA.md](docs/SEGURANCA.md).

## Documentação

- [Como o projeto funciona](docs/COMO-FUNCIONA.md)
- [Como contribuir](CONTRIBUTING.md) e [processo de PR](docs/PROCESSO-DE-PR.md)
- [Especificação do MVP](docs/REQUISITOS.MD)
- [Testes e regressão](docs/TESTES.md) e [QA](docs/QA.md)
- [Decisões de arquitetura (ADRs)](docs/adr/README.md)
- [Referência da API](docs/api/README.md)
- [Turborepo](docs/TURBOREPO.md)
- [Design no Figma](docs/FIGMA-INTERA.md)

## Contribuindo

Commits em Conventional Commits (validados pelo hook `commit-msg`), um assunto por PR, `pnpm run verify` verde antes de abrir. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE). A arte baseada no Liberated Pixel Cup (LPC) segue a licença de cada autora ou autor, listada em [CREDITS.md](CREDITS.md).
