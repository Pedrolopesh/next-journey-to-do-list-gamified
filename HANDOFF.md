# Handoff: onde o trabalho parou

Resumo para qualquer agente (ou pessoa) continuar de onde parou. Leia antes o `AGENTS.md` (regras, stack e checklist de segurança). Este arquivo não substitui o `AGENTS.md`; ele conta o **estado atual** e o que falta. Atualize-o ao fim de cada etapa.

Última atualização: 2026-10-13, depois do PR da revisão geral (#24) e durante a jornada das abas (branch `feat/banner-mapa-e-exemplos`, ainda sem PR).

## Combinados com o Pedro (dono do projeto)

- Implementar as fases do plano sem interromper; parar só para decisão crítica. **Um PR por fase** (ou por passo coerente); o Pedro autorizou fazer o merge dos PRs depois do CI. Os PRs servem para documentar o que foi feito.
- Antes de subir qualquer branch: `FULL=1 pnpm run security:full` precisa dar `OK` e `pnpm exec turbo run lint typecheck test build` precisa passar. Nada de segredo, IP ou dado de infraestrutura (repo público).
- **Sem atribuição a IA** em commits e PRs (sem `Co-Authored-By`, sem "Generated with"). Autor é só o Pedro.
- Commits em Conventional Commits, assunto em minúscula, linhas do corpo com no máximo 100 caracteres (o commitlint rejeita).
- Toda ação do usuário no app mostra carregando e termina em toast de sucesso ou erro (RN-FB, `docs/QA.md` seção 7).
- Textos de interface só em `apps/mobile/src/i18n/pt-BR.json`.
- Arte de terceiros só com CC0, OGA-BY ou CC-BY, sempre com crédito (`CREDITS.md`, `apps/banner/lab/CREDITS-LPC.md` e tela Créditos do app).

## O que existe hoje (tudo na `main`)

Monorepo pnpm + Turborepo: `apps/api` (NestJS + Prisma + PostgreSQL), `apps/mobile` (Expo/React Native), `apps/banner` (Vite + TypeScript num WebView), `packages/contracts` (Zod).

**Fases 1 a 5** estão feitas (base, banner/app, API, itens e check, histórias e conquistas). Detalhes em `docs/DIARIO.md` e `docs/fases/`.

**Trabalho recente (PRs #18, #19, #20), a Home com o QG:**

- **Laboratório web** (`apps/banner/lab.html`, só em desenvolvimento, fora do build): valida o personagem LPC e os 7 cenários do QG, cada um com manhã, tarde e noite: cabana, praia, cidade (antes topo do prédio), apocalipse zumbi, castelo, floresta (antes paraíso, mesmo id `paradise`) e inferno. Cada cenário foi refinado com o Pedro (props desenhados em código, luzes noturnas, animações).
- **Motor do QG** em `apps/banner/src/qg`: `engine.ts` (canvas em escala inteira de 2 a 5, limite de FPS, pausa), `scenes/` (um arquivo por cenário e `draw.ts`/`lighting.ts` com os helpers de pixel art), `compose.ts` (camadas LPC e recolorização de paleta), `character-map.ts` (chaves simples do app para camadas LPC; `look` vence; roupa de conquista sobrepõe), `assets.ts` (arte embutida como data URL: só parado e correndo) e `scene.ts` (cena usada pelo controlador).
- **Banner de produção**: `INIT` com `scene: 'qg'` (`sceneKey` = id do cenário, `timeOfDay`), `SET_TIME_OF_DAY`, `SET_CHARACTER`; `ITEM_CHECKED` faz o personagem comemorar; `CHAPTER_COMPLETED` faz fade e responde `CHAPTER_TRANSITION_DONE`. Bundle com cerca de 570 KB (limite 1,5 MB). O Mapa (`scene: 'map'`, CSS) continua nas outras abas.
- **Contrato e API**: `character.look` opcional (`lpcLookSchema` em `packages/contracts/src/banner-protocol.ts`), guardado em `characters.look` (JSONB, migration `20261011190000_character_look`) e devolvido por `GET /me`.
- **App**: Home com o QG, botões "Ambiente" (cenário e hora) e "Personagem". Hora automática pelo relógio (manhã 5h–11h59, tarde 12h–17h59, noite no resto) ou fixa; cenário e hora ficam só no aparelho (`features/qg/qg-store.ts`, AsyncStorage). Formulário do personagem (`components/character-form.tsx`), usado no cadastro e na edição, com prévia fixa no topo e todas as opções do laboratório; looks prontos, sorteio, cores em bolinhas, título que acompanha o corpo e nome por último. Tela Créditos lista a arte LPC.
- Proposta OpenSpec em `openspec/changes/banner-cena-qg` (tarefas todas marcadas; falta arquivar com `/opsx:archive` se o projeto quiser sincronizar as specs). QA manual em `docs/QA.md` seção 4b.

**Botões com brilho suave (PR dos botões):** `apps/banner/buttons.html` (só em desenvolvimento, fora do build) mostra 7 estilos de botão com luz e todos os estados. O app usa dois deles, definidos em `apps/mobile/src/theme/glow.ts` (`softGlow` e `softGlowOutline`, com `boxShadow` e `experimental_backgroundImage` do React Native): botão principal cheio com halo, botão secundário contornado, botão flutuante, chips selecionados e check concluído. O botão `ghost` (só texto) e a barra de navegação inferior ficam sem brilho de propósito. Ajustar a intensidade em um lugar só muda o app inteiro. Falta conferir o efeito no iOS e em aparelho de entrada (a propriedade de gradiente é marcada como experimental no React Native).

**Jornada das abas (OpenSpec `banner-jornada`):** as abas Diários, Tarefas e Hábitos mostram o personagem andando (começa à esquerda, virado para a direita) com o cenário da história principal rolando para a esquerda; a EXP do nível vira 6 paradas e, ao marcar item, ele corre até a próxima; ao subir de nível chega à última, tudo para e um portal abre à direita, e a cena só troca no check seguinte (`INIT` com `scene: 'journey'`). O cenário da história é escolhido em Home > Ambiente (preferência `storyScenario`, só no aparelho; sem cabana; "Topo do prédio" virou "Cidade"). Os seis cenários rolam: praia (areia e objetos), cidade (avenida com carros, postes e ponto de ônibus, prédios passando devagar sobre o rio), zumbi (base militar com cerca e zumbis parados, helicóptero), castelo (tapete real em todo o caminho, cavaleiros com lança, escudo ou espada, espadas na parede, sem trono), floresta (casa e lago passando devagar, árvores em três profundidades) e inferno (lava e vulcão ao fundo, ossos, braseiros e tridentes pelo caminho, sem trono). Primeira abertura sem itens cria 30 itens de exemplo (20 diários) (`features/items/examples.ts`, uma vez por usuário e aparelho).

## Como rodar localmente

- Node 24 e pnpm 11 (versões em `.nvmrc` e `packageManager`). Nunca `npm` ou `yarn`.
- `pnpm install`, depois `pnpm exec turbo run lint typecheck test build` (16 tarefas).
- API: copie `apps/api/.env.example` para `.env`; `pnpm --filter @nextjourney/api db:deploy` aplica migrations e `db:seed` popula histórias e conquistas; `pnpm --filter @nextjourney/api start:dev` sobe a API. Testes e2e: `pnpm --filter @nextjourney/api test:e2e` (precisa do Postgres local e cria o banco `*_test`).
- Banner: `pnpm --filter @nextjourney/banner dev` abre o servidor Vite; use `/lab.html` (laboratório) e `/dev.html` (painel de debug do protocolo, com botão de INIT do QG). `pnpm --filter @nextjourney/banner build` gera o `dist/index.html` e o copia para `apps/mobile/assets/banner/banner.html` (arquivo ignorado pelo Git). **Depois de mudar o banner, rode o build** para o app enxergar.
- App: development build no emulador Android (Metro em execução, `adb reverse` das portas do Metro e da API). Para recarregar o JavaScript, envie `RR` no emulador ou use o menu de desenvolvimento.
- Se o contrato mudar: `pnpm --filter @nextjourney/contracts build` antes de checar tipos na API e no app.
- Créditos e cores de exemplo do app vêm do catálogo do banner: `node apps/banner/scripts/export-credits.mjs` (rode de novo quando `apps/banner/lab/catalog.json` mudar). O catálogo e as camadas LPC são gerados por `apps/banner/scripts/import-lpc.mjs` a partir de clones externos (`LPC_GENERATOR` e `LPC_BASE`).

## Armadilhas conhecidas

- Hooks do Git: o `pre-push` e o `pre-commit` usam `pnpm`; garanta o `pnpm` no `PATH` do shell que roda o `git`. O hook `rtk` pode reescrever `pnpm lint`; use `rtk proxy pnpm run lint` se precisar.
- O repositório não permite auto-merge e faz **squash merge**. Depois de mergear um PR, rebase a próxima branch com `git rebase --onto origin/main <último-commit-já-mergeado> <branch>` para não repetir commits.
- O CI (`pnpm install --frozen-lockfile`, `turbo run lint typecheck test build` e `scripts/security-scan.sh`) leva cerca de 2 minutos.
- No macOS, `sed -i` exige `sed -i ''`.
- O Vite recarrega a página inteira a cada arquivo salvo; o laboratório volta para a cabana. Espere alguns segundos antes de clicar.
- Não editar migrations já aplicadas; migration nova sempre.

## NÃO ESQUECER: medir o banner em aparelho real

Combinado com o Pedro: adiado até terminar as próximas etapas (jornada em todos os cenários), mas **é obrigatório antes da loja**. Fase 2, passos 16 e 17 e o ADR-0003 com os números. O QG e a jornada rodam a 30 quadros por segundo com escala até 3; falta medir em aparelho de entrada (quadros por segundo, memória, bateria), com o app em segundo plano e com "reduzir movimento". A jornada anima o tempo todo e tem mais desenho por quadro que o QG parado, então pesa mais.

## O que falta (em ordem sugerida)

1. **Refinar as jornadas com o Pedro** (praia, cidade, zumbi, castelo, floresta e inferno já rolam; cada uma tem `journey(env)` na sua cena). Falta conferir manhã, tarde e noite de cada uma dentro do app e o portal em cada cenário.
2. Remover a cena Mapa em CSS (`apps/banner/src/scene`) quando a jornada cobrir todos os cenários; as abas já usam a jornada.
3. **Acessórios LPC** (chapéu, cachecol, bandana, espada, escudo): hoje existem no formulário, mas não têm arte importada e o banner os ignora. Também falta usar o título (Herói/Heroína) para o corpo no cadastro antigo e tratar personagem sem `look` (o formulário mostra o visual padrão até salvar de novo).
4. **Auditoria RN-FB do app inteiro** (`docs/QA.md` seção 7), requisito para a loja.
5. **Fase 7** (itens que dependem de conta ou infraestrutura): Sentry, OTA, página pública de exclusão de conta, política de privacidade, auditoria de acessibilidade e agendamento de backup. **Fase 8**: publicação nas lojas.
6. Verificação manual de todas as horas (manhã, tarde, noite) em todos os cenários; algumas só foram conferidas em parte.

## Decisões que ainda dependem do Pedro

- Licença do projeto.
- ADR-0004, regras complementares de jogo.
- Itens de segurança da hospedagem registrados fora do repositório.
- Rotação de senhas e tokens que já circularam.
- Pedido de limpeza ao suporte do GitHub.
- Se o cenário do QG deve continuar sendo escolha do usuário (hoje é, por aparelho) ou passar a depender da história.

## Pontos de atenção de segurança

- `pnpm audit` aponta vulnerabilidades moderadas e baixas em dependências, e 2 altas que o `pnpm audit` do projeto já ignora (ver a configuração do `pnpm audit` e o `docs/SEGURANCA.md`); reavaliar antes da loja.
- A migration `20261011190000_character_look` só adiciona uma coluna opcional (nullable); precisa ser aplicada em todo ambiente antes de usar o app novo.
