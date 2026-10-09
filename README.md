# Next Journey

To-do list gamificado para iOS e Android: cada item marcado rende EXP e moedas e faz o personagem avançar por uma história em capítulos.

Monorepo pnpm + Turborepo com API (NestJS), banner (Vite) e app (Expo). Hoje existe só a base do monorepo; os apps entram nas Fases 2 e 4 do plano.

## Como rodar

```bash
nvm use                # Node 24 (.nvmrc)
corepack enable        # ativa o pnpm fixado em package.json
pnpm install           # instala tudo e ativa os git hooks
pnpm run build         # build de todos os pacotes (Turbo)
pnpm run lint && pnpm run typecheck   # qualidade
```

Se `pnpm run lint` falhar com "eslint not found" no ambiente do Pedro, é o hook do `rtk`: use `rtk proxy pnpm run lint`.

## Rodar tudo localmente (API + banco + app)

```bash
cp .env.example .env && cp apps/api/.env.example apps/api/.env   # troque as senhas e o segredo do JWT
docker compose up -d                                              # Postgres local, só em 127.0.0.1
pnpm --filter @nextjourney/api db:deploy && pnpm --filter @nextjourney/api db:seed
pnpm --filter @nextjourney/api start:dev                          # API em http://127.0.0.1:3000 (docs em /docs)
cp apps/mobile/.env.example apps/mobile/.env
cd apps/mobile && npx expo run:android                            # development build + Metro
```

Testes e2e da API (usam o banco `nextjourney_test`): `pnpm --filter @nextjourney/api test:e2e`.
Os arquivos `.env` nunca vão para o Git; só os `.env.example`.

## Documentação

- [Como o projeto funciona](docs/COMO-FUNCIONA.md)
- [Turborepo: conceitos e configuração](docs/TURBOREPO.md)
- [Especificação do MVP](docs/REQUISITOS.MD)
- [Design no Figma](docs/FIGMA-INTERA.md)

## Convenções

Commits em Conventional Commits (validados pelo hook `commit-msg`). Um passo do plano por PR. Lint, typecheck e testes verdes antes do merge.
