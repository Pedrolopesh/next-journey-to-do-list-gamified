# Turborepo — como funciona e como está configurado no Next Journey

Atualizado em 2026-10-03, com `turbo` 2.11.6 e `pnpm` 11.28.3. As documentações oficiais da versão instalada ficam em `node_modules/turbo/docs/` e valem mais do que qualquer texto da internet, porque acompanham a versão que o projeto usa.

## Parte 1 — Como o Turborepo funciona (geral)

### 1.1 O problema que ele resolve

Em um monorepo há vários pacotes (API, app, banner, contratos) e várias tarefas (lint, typecheck, test, build). Rodar tudo em todo pacote, na ordem certa, toda hora, é lento. O Turborepo faz três coisas:

1. **Ordena:** roda cada tarefa depois das tarefas das quais ela depende.
2. **Paraleliza:** roda ao mesmo tempo o que não depende um do outro.
3. **Guarda em cache:** se as entradas de uma tarefa não mudaram, ele não roda de novo; restaura o resultado e mostra o log guardado.

Ele **não** instala dependências nem decide quais pastas são pacotes. Isso é do gerenciador de pacotes (aqui, o pnpm).

### 1.2 pnpm e Turborepo, quem faz o quê

| Ferramenta | Responsabilidade | Arquivo |
|---|---|---|
| pnpm | Instalar dependências uma vez, ligar pacotes do workspace por nome, rodar scripts | `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml` |
| Turborepo | Descobrir o grafo de pacotes, ordenar e cachear tarefas | `turbo.json` |

O Turbo lê o workspace do pnpm para saber quais são os pacotes e quem depende de quem (pelo campo `dependencies`/`devDependencies` de cada `package.json`).

### 1.3 Conceitos

**Grafo de pacotes.** Se `apps/api` lista `@nextjourney/contracts` em `dependencies`, existe uma aresta `api → contracts`. Essas arestas vêm só dos `package.json`.

**Tarefa.** Um *script* de `package.json` que o Turbo sabe rodar. Em `turbo.json`, `tasks` declara quais nomes de script são tarefas e como se relacionam. Um pacote que não tem o script simplesmente não participa daquela tarefa.

**Grafo de tarefas.** O Turbo combina o grafo de pacotes com o `dependsOn` das tarefas. Exemplo: `"test": { "dependsOn": ["^build"] }`.

- `^build` (com circunflexo) = o `build` **dos pacotes dos quais eu dependo**.
- `build` (sem circunflexo) = o `build` **do mesmo pacote**.

Logo, `test` da API só roda depois do `build` do `contracts`, e o `test` do banner e do app também. Como os três só dependem do `contracts`, depois que ele compila os três testam em paralelo.

**Hash e cache.** Para cada tarefa de cada pacote o Turbo calcula um hash com: os arquivos do pacote (respeitando `inputs`), o hash das tarefas de que depende, as variáveis de ambiente declaradas, a configuração da tarefa e os arquivos globais (como o lockfile). Hash igual = cache hit: ele restaura os `outputs` e reexibe o log, sem executar nada (a linha final mostra `FULL TURBO`). O cache local fica em `.turbo/` (ignorado pelo Git).

**`outputs`.** Lista de arquivos que a tarefa produz (`dist/**`). Só o que está em `outputs` é restaurado no cache hit. Tarefas sem arquivos (lint, test) podem omitir `outputs`: o log ainda é cacheado.

**`dev` e `persistent`.** Servidores que ficam rodando não terminam, então são `"persistent": true` e `"cache": false`. Nenhuma outra tarefa pode depender de uma tarefa persistente.

**Variáveis de ambiente (modo estrito).** Por padrão o Turbo só repassa às tarefas as variáveis listadas em `env`/`globalEnv` (que também entram no hash). Exceções: a inferência de framework já inclui variáveis como `EXPO_PUBLIC_*` para pacotes Expo. Variáveis que não devem afetar o cache mas precisam existir (tokens do EAS, por exemplo) vão em `passThroughEnv`/`globalPassThroughEnv`. Se uma tarefa falha por variável "sumida", é quase sempre isso.

**Filtros.**

| Comando | Efeito |
|---|---|
| `turbo run test --filter=@nextjourney/contracts` | só esse pacote |
| `turbo run test --filter=@nextjourney/contracts...` | o pacote e quem depende dele |
| `turbo run test --filter="...[origin/main]"` | pacotes alterados em relação à main (e seus dependentes) |
| `turbo run lint test --affected` | forma curta moderna do filtro anterior |

**Remote Cache.** Compartilha o cache entre máquinas (você e o CI). É opcional e fica desativado ("Remote caching disabled" no log). Pode ser ativado depois sem mudar nada nas tarefas.

**Comandos úteis para entender o que acontece.**

```bash
pnpm exec turbo ls                      # lista os pacotes que ele enxergou
pnpm exec turbo run build --dry=json    # mostra o plano e se cada tarefa seria HIT ou MISS, sem rodar
pnpm exec turbo run build --graph       # desenha o grafo de tarefas
pnpm exec turbo run build --force       # ignora o cache
pnpm exec turbo prune @nextjourney/api --docker   # gera um subconjunto mínimo do repo para o Dockerfile
```

O `turbo prune` será útil no deploy da API na VPS: o Dockerfile copia só a API e o que ela importa, em vez do monorepo inteiro.

## Parte 2 — Como está configurado neste projeto

### 2.1 Arquivos

**`pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Todo diretório dentro de `apps/` e `packages/` com um `package.json` é um pacote.

**`package.json` (raiz)**: `"private": true` (o monorepo nunca é publicado), `"packageManager": "pnpm@11.28.3"` (o corepack usa exatamente essa versão), `"engines": { "node": ">=24" }` e os scripts:

```json
"build": "turbo build",
"lint": "turbo lint",
"typecheck": "turbo typecheck",
"test": "turbo test",
"dev": "turbo dev"
```

Ou seja: `pnpm run test` na raiz vira `turbo test`, que roda o script `test` de cada pacote que o tiver, na ordem do grafo.

**`turbo.json`**

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

Leitura linha a linha:

| Tarefa | Configuração | Por quê |
|---|---|---|
| `build` | depende do `build` das dependências; produz `dist/**` | O `contracts` precisa estar compilado antes de quem o importa. O banner gera o `dist/index.html` que o app embute |
| `typecheck` | depende de `^build` | O `tsc` de um pacote lê os tipos compilados (`dist/*.d.ts`) das dependências |
| `lint` | depende de `^build` | O ESLint com regras que usam tipos (typescript-eslint) lê os tipos compilados (`dist/*.d.ts`) das dependências; sem o build, tudo vira "tipo não resolvido" |
| `test` | depende de `^build` | Os testes importam o código compilado dos contratos |
| `dev` | sem cache, persistente | Servidores de desenvolvimento (API, Vite, Metro) ficam rodando |

**Por que `contracts` precisa de build.** O NestJS roda em CommonJS e não lê TypeScript de dentro de `node_modules`. Por isso o `contracts` será compilado com `tsup` (saída ESM + CJS) na Fase 3. O Metro (app) e o Vite (banner) leem TypeScript direto, mas usam o mesmo pacote compilado para ficar uniforme.

### 2.2 Pacotes que o Turbo enxerga hoje

Saída real de `turbo ls`:

```
3 packages (pnpm9)
  @nextjourney/contracts     packages/contracts
  @nextjourney/eslint-config packages/eslint-config
  @nextjourney/tsconfig      packages/tsconfig
```

| Pacote | Scripts | Papel |
|---|---|---|
| `@nextjourney/contracts` | `build` (placeholder com `echo`), `lint` (`eslint .`), `typecheck` (`tsc --noEmit`) | Futuros schemas Zod. Já exporta `main`, `module`, `types` e `exports` apontando para `dist/` |
| `@nextjourney/tsconfig` | nenhum | Configs de TypeScript reaproveitadas: `base.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, ES2022), `node.json` (NodeNext) e `react-native.json` |
| `@nextjourney/eslint-config` | nenhum | Regras de lint exportadas como `@nextjourney/eslint-config/base`, `/node` e `/react` |

`apps/` está vazia. Os apps nascem nas Fases 2 e 4, porque os geradores (`create-expo-app`, Nest CLI) exigem um diretório novo.

### 2.3 O que acontece quando você roda `pnpm run build`

1. O pnpm executa o script `build` da raiz: `turbo build`.
2. O Turbo lê o workspace e monta o grafo de pacotes (3 pacotes, sem dependências entre si).
3. Só o `contracts` tem script `build`; os outros dois não participam.
4. Ele calcula o hash do `contracts#build`. Na primeira vez, executa o `echo` e guarda o log. Na segunda, o resultado é `Cached: 1 cached, 1 total ... FULL TURBO`, sem executar.

Aviso esperado: `no output files found for task @nextjourney/contracts#build`. O `build` declara `outputs: ["dist/**"]`, mas o placeholder não gera `dist/`. Some quando o `tsup` entrar (Fase 3).

`pnpm run lint` e `pnpm run typecheck` executam no `contracts` (o `typecheck` primeiro espera o `build`, por causa do `^build`, se houver dependências). `pnpm run test` retorna "No tasks were executed", porque nenhum pacote tem esse script ainda. Isso é correto, não é erro.

### 2.4 O que vai mudar nas próximas fases

| Fase | Mudança no Turbo |
|---|---|
| 1, passos 8 a 10 (feito) | `eslint-config` com as regras; `contracts` com `lint` e `typecheck`; Husky: `pre-commit` com lint-staged e `pre-push` com `turbo run typecheck test --filter="...[origin/main]"` |
| 1, passo 12 | CI (GitHub Actions) com `pnpm turbo lint typecheck test build` |
| 2 | `apps/banner` e `apps/mobile` entram. O banner gera `dist/index.html` e um script copia para `apps/mobile/assets/banner/banner.html`. O mobile precisa depender do build do banner: declarando o banner em `devDependencies` do mobile (e o `^build` cuida disso) ou com `dependsOn: ["@nextjourney/banner#build"]` |
| 3 | `contracts` passa a compilar com `tsup`; o aviso de outputs some |
| 4 | `apps/api` entra; `dev` roda API em paralelo ao Metro. `test` da API pode precisar de variáveis (`env`) para o Postgres de teste |
| 7 | Cache remoto opcional para acelerar o CI |

Se alguma tarefa passar a precisar de variáveis de ambiente, declare-as em `env` ou `globalEnv` no `turbo.json`; sem isso o modo estrito as esconde.

### 2.5 Receitas do dia a dia

```bash
pnpm install                                   # instala tudo
pnpm run build                                 # build de todos os pacotes
pnpm --filter @nextjourney/contracts add zod   # dependência só em um pacote
pnpm exec turbo run build --dry=json           # entender o que rodaria
pnpm exec turbo run test --filter="...[origin/main]"   # só o que mudou
```

No ambiente do Pedro, comandos como `pnpm lint` são reescritos pelo `rtk`. Para executar o script real use `rtk proxy pnpm run lint`.

### 2.6 Pegadinhas já encontradas

- **`generate` é uma tarefa do Turbo.** O cliente do Prisma é gerado em `apps/api/src/generated` (ignorado pelo Git). Quando `build`, `typecheck` e `lint` chamavam `prisma generate` cada um, rodavam em paralelo e brigavam pela mesma pasta (falhas intermitentes). Agora `apps/api/turbo.json` declara a tarefa `generate` (com `inputs` no schema e `outputs` na pasta gerada) e as demais dependem dela. Para rodar à mão: `pnpm --filter @nextjourney/api generate`.
- **Variáveis de ambiente em modo estrito.** O Turbo só repassa às tarefas as variáveis declaradas. `DATABASE_URL` e `TEST_DATABASE_URL` estão em `globalPassThroughEnv` (repassadas sem entrar no hash do cache), porque o Prisma 7 lê `DATABASE_URL` até para `prisma generate`, que roda no `lint`, `typecheck` e `build` da API. No CI elas apontam para o Postgres efêmero do job; localmente o `prisma.config.ts` carrega o `apps/api/.env`.
- **`AGENTS.md` na raiz.** O próprio `turbo` escreve um bloco entre `<!-- BEGIN:turborepo-agent-rules -->` e `<!-- END:turborepo-agent-rules -->` quando detecta um agente de IA. Ele foi parar no primeiro commit de pacotes. Mantenha o bloco commitado; o passo 11 da Fase 1 acrescenta o conteúdo do projeto ao redor dele. Para desligar: `"agentGuidance": false` no `turbo.json`.
- **pnpm 12.8.1 não ativa via corepack** nesta máquina (2026-10-02, erro `Cannot find module ... pnpm.cjs`). Por isso o `packageManager` está em 11.28.3.
- **`pnpm init` grava a versão mais nova** no `packageManager` e em `devEngines`; o `package.json` foi reescrito à mão com a versão fixada.
- **`rtk` e `pnpm lint`.** Ver 2.5.
- **ESLint 9 resolve o `eslint.config.js` a partir da pasta atual**, não do arquivo. No lint-staged (que roda da raiz) isso quebraria, então o comando usa `--flag v10_config_lookup_from_file`, que faz o ESLint procurar a config perto de cada arquivo (comportamento padrão do ESLint 10). O `eslint` também precisa estar nas `devDependencies` da raiz para o lint-staged achar o binário.
- **TypeScript 5.9, não 7.** O `typescript-eslint` 8.71 aceita `typescript <6.1`. Como o `npm` já oferece a 7.x, o `pnpm add` instala a 7 se você não fixar a faixa.
- **O aviso "no output files found"** é normal enquanto o `build` do `contracts` for um `echo`.
