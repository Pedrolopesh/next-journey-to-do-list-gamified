# Handoff: onde o trabalho parou

Resumo para qualquer agente (ou pessoa) continuar de onde parou. Leia antes o `AGENTS.md` (regras, stack e checklist de segurança). Este arquivo não substitui o `AGENTS.md`; ele conta o **estado atual** e o que falta. Atualize-o ao fim de cada etapa.

Última atualização: 2026-10-19, depois dos PRs #29 a #34 (pontuação v2, histórico, estrelas de dificuldade, conquistas com ritmo e testes de interface), todos na `main`.

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

- **Laboratório web** (`apps/banner/lab.html`, só em desenvolvimento, fora do build; páginas em `apps/banner/src/lab/pages/`, menu lateral: Botões, Botões do aplicativo, Indicadores, Conquistas, Cenários, Personagem e créditos). Valida o personagem LPC e os 7 cenários do QG (modo QG parado e modo jornada), cada um com manhã, tarde e noite: cabana, praia, cidade (antes topo do prédio), apocalipse zumbi, castelo, floresta (antes paraíso, mesmo id `paradise`) e inferno. Cada cenário foi refinado com o Pedro (props desenhados em código, luzes noturnas, animações).
- **Motor do QG** em `apps/banner/src/qg`: `engine.ts` (canvas em escala inteira de 2 a 5, limite de FPS, pausa), `scenes/` (um arquivo por cenário e `draw.ts`/`lighting.ts` com os helpers de pixel art), `compose.ts` (camadas LPC e recolorização de paleta), `character-map.ts` (chaves simples do app para camadas LPC; `look` vence; roupa de conquista sobrepõe), `assets.ts` (arte embutida como data URL: só parado e correndo) e `scene.ts` (cena usada pelo controlador).
- **Banner de produção**: `INIT` com `scene: 'qg'` (`sceneKey` = id do cenário, `timeOfDay`), `SET_TIME_OF_DAY`, `SET_CHARACTER`; `ITEM_CHECKED` faz o personagem comemorar; `CHAPTER_COMPLETED` faz fade e responde `CHAPTER_TRANSITION_DONE`. Bundle com cerca de 570 KB (limite 1,5 MB). O Mapa (`scene: 'map'`, CSS) continua nas outras abas.
- **Contrato e API**: `character.look` opcional (`lpcLookSchema` em `packages/contracts/src/banner-protocol.ts`), guardado em `characters.look` (JSONB, migration `20261011190000_character_look`) e devolvido por `GET /me`.
- **App**: Home com o QG, botões "Ambiente" (cenário e hora) e "Personagem". Hora automática pelo relógio (manhã 5h–11h59, tarde 12h–17h59, noite no resto) ou fixa; cenário e hora ficam só no aparelho (`features/qg/qg-store.ts`, AsyncStorage). Formulário do personagem (`components/character-form.tsx`), usado no cadastro e na edição, com prévia fixa no topo e todas as opções do laboratório; looks prontos, sorteio, cores em bolinhas, título que acompanha o corpo e nome por último. Tela Créditos lista a arte LPC.
- Proposta OpenSpec em `openspec/changes/banner-cena-qg` (tarefas todas marcadas; falta arquivar com `/opsx:archive` se o projeto quiser sincronizar as specs). QA manual em `docs/QA.md` seção 4b.

**Botões com brilho suave (PR dos botões):** a página Botões do laboratório (`apps/banner/src/lab/pages/glow.ts`) mostra 7 estilos de botão com luz e todos os estados. O app usa dois deles, definidos em `apps/mobile/src/theme/glow.ts` (`softGlow` e `softGlowOutline`, com `boxShadow` e `experimental_backgroundImage` do React Native): botão principal cheio com halo, botão secundário contornado, botão flutuante, chips selecionados e check concluído. O botão `ghost` (só texto) e a barra de navegação inferior ficam sem brilho de propósito. Ajustar a intensidade em um lugar só muda o app inteiro. Falta conferir o efeito no iOS e em aparelho de entrada (a propriedade de gradiente é marcada como experimental no React Native).

**Home com pixel art (2026-10-14):** a Home não tem mais a lista "Para hoje" (o `GET /home` ainda devolve `today`; remover do contrato é decisão futura) e os três botões de ação ficam no fim da tela. botões de ação (`ActionButton`), indicadores (`StatCard`, incluindo moedas) e card de história em trechos (`HomeStoryCard`) usam a pixel art de `components/pixel-art.tsx` (ícones 12x12, tamanhos múltiplos de 12). O banner fica invisível até o primeiro INIT (sem a cena antiga ao abrir) e as abas montam juntas, pausadas fora de foco, com fade na troca. A troca de aba só foi medida no emulador Android; medir em iOS e aparelho de entrada (ADR-0003). A pixel art mora em `apps/mobile/src/components/pixel-art-data.ts` (dados puros); o app (`PixelArt`) e o laboratório usam o mesmo arquivo. Home e abas usam o mesmo `StoryProgressCard`; a tela Conquistas abre os detalhes num `BottomSheet` (modal que sobe do rodapé).

**Histórias por cenário (OpenSpec `historias-por-cenario`, 2026-10-13):** 6 histórias (uma por cenário, slug = id do cenário), 5 capítulos cada; cada nível ganho conclui um capítulo da história ativa; o banner das abas usa o cenário da história ativa; `GET /v1/stories/:slug/timeline` mostra qualquer história. O seed apaga as histórias antigas (e o progresso delas). Rode `pnpm --filter @nextjourney/api db:seed` em todo ambiente e reative uma história para quem ficou sem. Minha história (app) tem banner, escolha da história e capítulos; a Home tem "QG", botões e a barra de progresso fica nas três abas.

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

## NÃO ESQUECER ao publicar em outro ambiente (pontuação v2 e conquistas)

Tudo isto já está na `main` (#29 a #34). Ao publicar em outro ambiente, **reler esta lista e aplicar cada ponto**:

1. **Migration `20261019120000_pontuacao_v2`** (troca `levelExpSlope/levelExpOffset` por `levelExpTable` e `undoCoinPenalty` no `game_config`): em qualquer outro ambiente rodar `db:deploy`. O seed **não** sobrescreve o `game_config` (`update: {}`), então sem a migration a API falha ao carregar a config.
2. **EXP maior, nível mantido:** quem já está num nível mantém o `expInLevel`; só o teto cresceu (200, 400, 600, 800, 1000 e depois 1000). Ninguém perde nível. Avisar o Pedro antes de publicar.
3. **Brecha das moedas** (anotada na página "Moedas e EXP" do laboratório): no capítulo 1, marcar, desmarcar e marcar de novo um item difícil rende +1 moeda por volta. Medir e decidir se endurece (moedas uma vez por item e dia).
4. **Desmarcar vale a qualquer momento** (sem `CHECK_LOCKED` nem recusa de outro dia). Confirmar com o Pedro que `UNDO_NOT_ALLOWED` só sobra para item excluído.
5. **O desfazer agora vem do servidor** (`lastCheckId` em `GET /items` e `checkId` no histórico). Conferir no aparelho real, com o app reaberto, que desmarcar funciona.
6. **Histórico de tarefas** (`GET /items/history`, tela no Perfil): conferir paginação com muitas tarefas e o aviso no rodapé de Tarefas.
7. **Personagem no capítulo 5 concluído:** fica no fim do cenário, sem portal. Não verificado no aparelho (só o capítulo 2).
8. **Migrations desta leva:** `20261019120000_pontuacao_v2`, `20261019170000_indice_historico` e `20261019180000_item_de_exemplo` (`db:deploy`). A `wip/teste-integrado` era só para teste local e nunca sobe.
9. **70ª conquista (`habito-de-100`, Diamante):** ao publicar, rodar `db:seed` (cria a linha no catálogo) e `db:backfill-achievements` (libera para quem já tem 100 dias seguidos de um hábito, sem reabrir modal).
10. **Ainda não verificado:** pontuação e histórico no iPhone físico (e a permissão de "Rede local" do iOS); modal com o botão X no iPhone físico.

## NÃO ESQUECER ao publicar: endurecimento da conta e da sessão (2026-10-24, #36 a #47)

Tudo isto já está na `main`. Detalhes de cada regra em `docs/SEGURANCA.md`, `docs/PRIVACIDADE.md` e nas specs vivas em `openspec/specs/` (`email-verification`, `account-deletion`, `session-management`, `data-export`).

1. **Migrations novas, nesta ordem (`db:deploy`):** `20261024120000_verificacao_de_email`, `20261024150000_indice_expiracao_tokens`, `20261024170000_limite_de_tentativas`, `20261024190000_nome_do_aparelho_na_sessao`. Contas por senha que já existiam ficam **pendentes** de confirmação do e-mail (hoje só há contas de teste).
2. **O cadastro não devolve mais sessão:** o e-mail de código precisa chegar. Antes de publicar, conferir o envio real (Resend com chave e domínio de envio com SPF/DKIM/DMARC) e o `MAIL_FROM`.
3. **Variáveis novas (todas com padrão):** `AUTH_MIN_RESPONSE_MS` (piso de tempo das rotas de conta; a API **não sobe com 0 em produção**), `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_KEY_ID` e, só durante a troca do segredo, `JWT_ACCESS_SECRET_PREVIOUS` + `JWT_PREVIOUS_KEY_ID` (procedimento em `docs/SEGURANCA.md`, seção 8); `SECURITY_ALERT_WEBHOOK_URL` (https, opcional). Variável opcional vazia (`CHAVE=`) vale como ausente.
4. **No deploy**, os tokens de acesso emitidos antes (até 15 min) deixam de valer; o app renova sozinho pelo refresh token.
5. **`TRUST_PROXY=true` atrás do proxy reverso:** sem isso o limite por IP enxerga só o IP do proxy.
6. **App e API sobem juntos:** `DELETE /v1/me` agora exige corpo (senha ou ID token) e o cadastro mudou de contrato.
7. **Ainda não verificado em aparelho real:** tela do código de confirmação, exclusão de conta com Google/Apple (o ID token precisa ter até 5 min), lista de aparelhos (nome do aparelho), folha de compartilhar da exportação de dados, e o Maestro destes fluxos.
8. **Em aberto (cards no Plane):** nonce no login social (o SDK do Google instalado não expõe), Universal/App Links (precisa de domínio), backup com teste de restauração, TLS/firewall e segredos em produção.

## Ritmo das conquistas (aprovado e na `main`, 2026-10-19)

A página "Conquistas v2" do laboratório (seção "Ritmo") compara as regras de hoje com uma proposta mais espaçada (simulação de 30 dias). **Já está no app (#33).** O que foi feito: (1) um modal por ação, com o resto pendente nas ações seguintes (servidor devolve só uma na resposta do check; o app mostra uma pendente por vez); (2) novos limites e nomes (por exemplo "Chama de 5 dias"), em `achievement-catalog.ts` e `progression/domain/achievements.ts`, com migration que renomeia os slugs que mudam de nome só no texto (os slugs ficam); (3) OpenSpec `conquistas-ritmo`; (4) retroativo sem reabrir modais (quem já tem a conquista continua com ela).

## Itens de exemplo e conquistas (2026-10-19)

Os ~100 itens de exemplo que o app cria não contam como criação do usuário (coluna `items.is_example`, migration `20261019180000_item_de_exemplo`). Contas antigas têm exemplos já criados **sem a marca**: ao publicar, marcar à mão (ou aceitar que já tenham as conquistas de criação). Conta de teste local do Pedro já corrigida.

## Testes de interface (Maestro), 2026-10-19

Camadas e como rodar em `docs/TESTES.md`. Resumo: `pnpm --filter @nextjourney/mobile test:ui` (emulador Android, Metro e API no ar). O Maestro está em `~/.maestro` (instalado pelo zip oficial; o `brew install maestro` é outro produto). **Falta:** rodar no CI (runner macOS com emulador) e validar os fluxos no iOS; hoje só no Android. Ao mexer em texto ou fluxo de tela, ajuste os fluxos em `apps/mobile/.maestro/`.

## NÃO ESQUECER: medir o banner em aparelho real

Combinado com o Pedro: adiado até terminar as próximas etapas (jornada em todos os cenários), mas **é obrigatório antes da loja**. Fase 2, passos 16 e 17 e o ADR-0003 com os números. O QG e a jornada rodam a 30 quadros por segundo com escala até 3; falta medir em aparelho de entrada (quadros por segundo, memória, bateria), com o app em segundo plano e com "reduzir movimento". A jornada anima o tempo todo e tem mais desenho por quadro que o QG parado, então pesa mais.

## O que falta (em ordem sugerida)

1. **Estudo de roupas, chapéus, trajes e acessórios do personagem (primeiro do backlog; as conquistas v2 já estão no app).** Hoje o catálogo LPC do app só tem camisas, calças e sapatos; as roupas de recompensa foram retiradas com a mudança `conquistas-v2` (eram de teste). Estudar para a sequência: (a) o que o pacote LPC traz (chapéus, capacetes, capas, trajes completos, armas, escudos, cachecol e bandana) e a licença/crédito de cada arte; (b) importar a arte e ligar ao `compose` do banner, onde acessórios hoje são ignorados (`selectionFromLayers`); (c) como o jogador ganha cada peça (conquista de classe alta, nível, capítulo ou moedas) e se uma peça "completa" bloqueia as camadas de baixo; (d) tela de personagem com peças bloqueadas e desbloqueadas; (e) cuidado com desempenho (mais camadas por quadro) e com o custo de arte no pacote do app. Conhecido: a tabela `user_cosmetics` e a rota `GET /me/cosmetics` continuam; a trava `COSMETIC_LOCKED` foi retirada com as recompensas de teste e volta junto com as peças novas.

2. **Refinar as jornadas com o Pedro** (praia, cidade, zumbi, castelo, floresta e inferno já rolam; cada uma tem `journey(env)` na sua cena). Falta conferir manhã, tarde e noite de cada uma dentro do app e o portal em cada cenário.
3. Remover a cena Mapa em CSS (`apps/banner/src/scene`) quando a jornada cobrir todos os cenários; as abas já usam a jornada.
4. **Acessórios LPC** (parte do estudo do item 1: chapéu, cachecol, bandana, espada, escudo): hoje existem no formulário, mas não têm arte importada e o banner os ignora. Também falta usar o título (Herói/Heroína) para o corpo no cadastro antigo e tratar personagem sem `look` (o formulário mostra o visual padrão até salvar de novo).
5. **Auditoria RN-FB do app inteiro** (`docs/QA.md` seção 7), requisito para a loja.
6. **Fase 7** (itens que dependem de conta ou infraestrutura): Sentry, OTA, página pública de exclusão de conta, política de privacidade, auditoria de acessibilidade e agendamento de backup. **Fase 8**: publicação nas lojas.
7. Verificação manual de todas as horas (manhã, tarde, noite) em todos os cenários; algumas só foram conferidas em parte.

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

## Dívidas conhecidas (registradas no review dos PRs #33 e #34)

- Marcar itens de exemplo ainda rende EXP e conquistas de hábito e rotina (só a criação é ignorada). Decidir com o Pedro.
- `example: true` vem do cliente; o pior efeito é a própria pessoa perder conquistas de criação.
- Slugs de conquistas mantêm o número antigo no nome (`chama-7-dias` exige 10); só o texto mudou.
- Mudanças OpenSpec antigas inválidas (`banner-cena-qg`, `banner-jornada`, `historias-por-cenario`); a CI valida só as alteradas.
- Duplicação: formulários de login e cadastro; `appId` repetido nos fluxos do Maestro.
- Fluxos do Maestro só no Android, fora da CI; app não verificado no iPhone físico.
