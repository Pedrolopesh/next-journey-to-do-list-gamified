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

## Documentação

- [Como o projeto funciona](docs/COMO-FUNCIONA.md)
- [Turborepo: conceitos e configuração](docs/TURBOREPO.md)
- [Plano de implementação](docs/PLAN_TODO_APP.md)
- [Especificação do MVP](docs/REQUISITOS.MD)
- [Design no Figma](docs/FIGMA-INTERA.md)

## Convenções

Commits em Conventional Commits (validados pelo hook `commit-msg`). Um passo do plano por PR. Lint, typecheck e testes verdes antes do merge.
