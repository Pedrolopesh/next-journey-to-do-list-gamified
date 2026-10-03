Next Journey — Plano de implementação
Sep 29, 2026 · @Pedro Lopes
Como usar este plano
O plano tem 9 fases (0 a 8) e 3 marcos. Cada fase traz o objetivo, os passos numerados na ordem em que devem ser feitos e um critério de pronto, que precisa ser verdadeiro antes de a fase seguinte começar. Ele complementa a Especificação do MVP v1, onde estão os requisitos (RF-xx), as regras de negócio e a stack de cada projeto.
Marco
Fecha em
O que você consegue fazer
Marco 1
Fase 4
Marcar um diário no celular contra a API real e ver EXP, nível e o personagem se movendo.
Marco 2
Fase 5
Usar o app inteiro, do cadastro ao capítulo concluído, com todas as telas do design system.
Marco 3
Fase 8
App em beta fechado nas duas lojas e pronto para a submissão de produção.
Ordem e dependências
• A Fase 0 corre em paralelo a tudo, porque depende de prazo de terceiros (verificação das contas).
• As Fases 1 a 5 seguem em sequência. A Fase 6 (conteúdo) corre em paralelo desde a Fase 4. A Fase 7 só começa depois da 5, e a Fase 8 depois da 7.
• O spike do banner não é uma fase separada: ele é o primeiro entregável da Fase 2, dentro do app real, com critério de aprovação próprio.
Regras de execução
• Cada passo numerado vira um PR pequeno, com commit no padrão Conventional Commits (feat(mobile): ...).
• Um PR só é aceito com lint, typecheck e testes verdes no CI.
• Ao concluir uma fase, atualize a tabela de Andamento no fim deste documento e registre no diário do projeto (regras na última seção).
• Este plano não traz estimativas de tempo. Depois da Fase 1 você já terá um ritmo real de trabalho, e aí vale preencher as datas previstas na tabela de Andamento.
Decisões fechadas em 2026-10-02
• Regras de progressão (EXP, moedas, nível, capítulo, streak, desfazer) moram num único lugar do back-end: apps/api/src/modules/progression/domain, como funções puras com teste. Não existe pacote @nextjourney/domain. O app não calcula EXP: marca o item na hora e mostra o que a API devolve (ADR-004).
• Banner em CSS (@keyframes + steps() em spritesheets, só transform e opacity). Canvas com requestAnimationFrame fica como plano B no gate do spike.
• Login Google: @react-native-google-signin/google-signin no app (uma chamada devolve o ID token) e validação do token no módulo auth da API, reaproveitando o que você já tem no back-end atual.
• Rota do check: POST /v1/items/:id/checks (e DELETE /v1/items/:id/checks/:checkId). O arquivo do banner no app é banner.html.
• Nome do app: Next Journey. Bundle id: br.com.wetechhub.app (dev: br.com.wetechhub.app.dev), definidos em 2026-10-02; passam a ser imutáveis no primeiro build iOS com credenciais Apple (Fase 2, passo 5).
• Monorepo único, com pnpm + Turborepo.
• Hospedagem: VPS própria, em Docker; cabe o Next Journey com folga. Ver "Hospedagem na VPS".
• Escolhas narrativas (RF-31) e escolha de mapa ficam no backlog. Na v1 o capítulo só avança e a cena do banner muda conforme a história progride.
• Sem limite de checks por hábito: todo check rende EXP, moedas e um passo do capítulo. E-mail transacional: Resend.
pnpm e Turborepo em 2 minutos
Os três projetos (API, app e banner) e os contratos compartilhados ficam num só repositório. Duas ferramentas fazem isso funcionar.
• pnpm é o gerenciador de pacotes, parecido com o npm. Ele guarda cada dependência uma só vez no disco e liga por links, o que deixa a instalação rápida. Com workspaces, o arquivo pnpm-workspace.yaml diz quais pastas são pacotes (apps/* e packages/*), e eles se enxergam pelo nome, por exemplo @nextjourney/contracts, sem publicar nada.
• Turborepo é quem roda as tarefas (lint, typecheck, test, build) na ordem certa. No turbo.json você declara que uma tarefa depende de outra; ele executa em paralelo o que pode e guarda o resultado em cache. Se nada mudou naquele pacote, a tarefa nem roda de novo.
A notação ^build significa "o build dos pacotes dos quais eu dependo". Como API, app e banner dependem do contracts, o Turbo compila o contracts primeiro e depois testa os três ao mesmo tempo. Atenção: o contracts precisa de build (tsup, saída ESM + CJS), porque o NestJS roda em CommonJS e não lê TypeScript de dentro de node_modules. Já o Metro (app) e o Vite (banner) leem o TypeScript direto.
Comando
O que faz
pnpm install
Instala tudo do monorepo, na raiz.
pnpm dev
Sobe os projetos em modo de desenvolvimento, via Turbo.
pnpm --filter api test
Roda o script test só na API.
pnpm --filter @nextjourney/contracts add zod
Adiciona uma dependência só no pacote de contratos.
pnpm turbo run lint typecheck test
Roda as três tarefas em todos os pacotes, com cache.
pnpm turbo run test --filter="...[origin/main]"
Roda os testes só dos pacotes alterados em relação à main.
O escopo dos pacotes é @nextjourney (ex.: @nextjourney/contracts), derivado do nome Next Journey.
Fase 0 — Contas, identidade e credenciais
Objetivo: ter tudo que depende de burocracia externa (aprovação da Apple, verificação do Google, DNS) andando em paralelo, para não travar as fases técnicas. Esta fase não tem código.
1. Definir o nome do app e o bundle id/package (definido: br.com.wetechhub.app; dev: br.com.wetechhub.app.dev). Não bloqueia as Fases 1 a 3, mas precisa estar fechado antes do primeiro build iOS com credenciais Apple e não muda depois de publicado.
2. Criar a conta Apple Developer Program (paga, anual) e aguardar a aprovação. Se for como empresa, o D-U-N-S pode levar dias; se for pessoa física, costuma ser mais rápido.
3. Criar a conta Google Play Console (taxa única). Contas pessoais novas exigem teste fechado com um número mínimo de testadores por um período antes de produção; confira a regra vigente no console e planeje a Fase 8 em cima dela.
4. Criar a conta Expo (EAS) e o projeto no plano gratuito. Guardar o EXPO_TOKEN para o CI.
5. Criar o repositório no GitHub (privado), com branch main protegida: PR obrigatório, CI verde obrigatório, sem push direto.
6. Criar os projetos OAuth: um no Google Cloud (clientes iOS, Android e Web) e o Sign in with Apple (App ID + Service ID + chave). Anotar os client ids; segredos vão só para o gerenciador de segredos, nunca para o repositório.
7. Hospedagem: a API e o Postgres rodam na VPS própria, em Docker. Antes de subir, concluir a auditoria de segurança da VPS (registrada fora do repositório), seguir a seção "Hospedagem na VPS" abaixo e registrar a decisão no ADR-001, sem endereços nem dados de infraestrutura.
8. Criar a conta Sentry (um projeto por app: api, mobile, banner) e a conta Resend (e-mail de recuperação de senha), verificando o domínio de envio.
9. Registrar o domínio e a página pública de política de privacidade (exigida pelas duas lojas e pela exclusão de conta).
10. Criar o gerenciador de senhas/segredos compartilhado (um cofre para chaves, tokens e certificados) e anotar quem tem acesso.
11. Criar o documento vivo docs/DIARIO.md no repositório (ver Regras de documentação) e registrar a data de cada conta criada.
Critério de pronto: contas Apple e Google aprovadas ou com pedido em andamento datado; repositório criado com main protegida; client ids OAuth anotados; política de privacidade no ar; ADR-001 (hospedagem) registrado.
Fase 1 — Fundação do monorepo
Objetivo: um repositório onde pnpm install, pnpm lint, pnpm typecheck e pnpm test rodam para todos os pacotes, com pré-commit e CI funcionando desde o primeiro commit. Nada de funcionalidade ainda.
1. Instalar Node LTS (via fnm ou nvm) e habilitar o pnpm: corepack enable && corepack prepare pnpm@latest --activate. Fixar as versões em .nvmrc e no campo packageManager do package.json raiz.
2. Clonar o repositório vazio e rodar pnpm init. Marcar "private": true no package.json raiz.
3. Criar pnpm-workspace.yaml:
packages:
  - "apps/*"
  - "packages/*"
4. Instalar o Turborepo na raiz: pnpm add -D -w turbo. Criar turbo.json:
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
5. Scripts do package.json raiz: "build": "turbo build", "lint": "turbo lint", "typecheck": "turbo typecheck", "test": "turbo test", "dev": "turbo dev".
6. Criar as pastas apps/api, apps/banner, apps/mobile, packages/contracts, packages/tsconfig, packages/eslint-config. Cada uma com seu package.json (nome no escopo @nextjourney/...) e scripts lint, typecheck, test (podem ser echo por enquanto; o Turbo ignora pacote sem o script). O packages/contracts já nasce com script build via tsup (ESM + CJS).
7. packages/tsconfig: criar base.json com strict: true, noUncheckedIndexedAccess: true, target: ES2022, moduleResolution: bundler, e variantes node.json e react-native.json que estendem a base.
8. packages/eslint-config: ESLint 9 em flat config, com typescript-eslint, regra de imports ordenados e no-console (exceto no banner e em scripts). Exportar base.js, node.js e react.js.
9. Prettier na raiz (.prettierrc + .prettierignore) e .editorconfig. Um único formato para o repo todo.
10. Husky: pnpm add -D -w husky lint-staged @commitlint/cli @commitlint/config-conventional && pnpm exec husky init. Hooks:
• pre-commit: pnpm exec lint-staged (ESLint --fix e Prettier só nos arquivos alterados).
• commit-msg: pnpm exec commitlint --edit "$1" (Conventional Commits).
• pre-push: pnpm turbo typecheck test (o cache do Turbo torna isso rápido).
11. Criar AGENTS.md na raiz (visão do monorepo, comandos, convenções, o que nunca fazer) e um AGENTS.md em cada app. Criar CLAUDE.md contendo apenas @AGENTS.md. Usar o modelo da seção de padrões comuns da especificação.
12. Criar .github/workflows/ci.yml: checkout, pnpm/action-setup, actions/setup-node com cache do pnpm, pnpm install --frozen-lockfile, pnpm turbo lint typecheck test build. Ativar o cache remoto do Turbo (opcional) depois.
13. Adicionar .gitignore, .env.example em cada app, LICENSE/aviso de licença e um README.md raiz com "como rodar" em 5 comandos.
14. Abrir o primeiro PR (chore: bootstrap monorepo), ver o CI passar, fazer merge e criar o ADR-002 ("monorepo com pnpm + Turborepo").
Critério de pronto: clone limpo + pnpm install + pnpm lint typecheck test passam local e no CI; um commit com mensagem fora do padrão é rejeitado; um commit com erro de lint é corrigido/barrado pelo pré-commit.
Fase 2 — App real com o spike do banner embutido
Objetivo: criar o apps/mobile de verdade (não um projeto descartável) já com o banner rodando dentro de um WebView, com dados fixos. O spike é esta validação: se o banner não rodar bem num Android intermediário, a decisão de usar WebView é revista antes de construir o resto.
Parte A — App base (Expo)
1. Dentro de apps/, rodar pnpm create expo-app mobile --template default e remover o que sobrar do template de exemplo. Ajustar o package.json para o escopo @nextjourney/mobile.
2. Metro em monorepo: no metro.config.js, incluir a raiz do workspace em watchFolders e resolver node_modules da raiz e do app. Conferir que pnpm --filter @nextjourney/mobile start sobe sem erro de resolução.
3. Converter app.json para app.config.ts com name, slug, scheme, ios.bundleIdentifier, android.package, newArchEnabled e extra lendo variáveis de ambiente.
4. Instalar as libs com npx expo install (nunca pnpm add direto para libs nativas): expo-dev-client, react-native-webview, expo-router, react-native-reanimated, expo-haptics, expo-secure-store.
5. Gerar o development build (não Expo Go, porque o WebView e módulos nativos precisam dele): eas build --profile development --platform android e depois iOS. Instalar no aparelho físico.
6. Configurar as rotas base com Expo Router: (auth), (tabs) com as 5 abas (Home, Diários, Tarefas, Hábitos, Perfil) e telas vazias com o tema escuro do design system.
Parte B — Banner (Vite)
7. Em apps/banner, criar projeto Vite + TypeScript e adicionar vite-plugin-singlefile para gerar um único index.html com JS, CSS e sprites embutidos.
8. Criar o contêiner da cena Mapa (390x180, arte nativa em 195x90 exibida a 2x) com image-rendering: pixelated e tiles de 16px. Sem canvas e sem loop em JavaScript: toda a animação é CSS.
9. Implementar o parallax em 3 camadas e o ciclo de caminhada de 9 frames do personagem, com CSS @keyframes + steps() em spritesheets, animando só transform e opacity (roda na GPU), usando os sprites LPC gerados no design.
10. Definir o protocolo em packages/contracts (mínimo agora): mensagens { v: 1, type, payload } para INIT, SET_CHARACTER, ITEM_CHECKED, CHAPTER_COMPLETED, READY, ERROR, validadas por Zod.
11. Enviar READY ao carregar e tratar INIT com dados fixos (personagem e cenário).
12. Script build do banner copia o dist/index.html para apps/mobile/assets/banner/banner.html. Configurar o Turbo para que mobile dependa do build do banner.
Parte C — Integração e medição
13. Criar o componente BannerView no app: WebView que carrega o banner.html com expo-asset + expo-file-system (html em resolver.assetExts no Metro) e passa o conteúdo em source={{ html }}, originWhitelist, JS habilitado, onMessage validando com o Zod do contrato e postMessage tipado para enviar.
14. Colocar o BannerView no topo da Home e das abas, com dados fixos (heroi + biome).
15. Adicionar um botão temporário "simular check" que dispara ITEM_CHECKED e CHAPTER_COMPLETED para exercitar as animações.
16. Medir em pelo menos dois aparelhos: um Android intermediário real (não o topo de linha) e um iPhone. Registrar FPS (Perf Monitor / chrome://inspect), tempo até READY, uso de memória e comportamento ao rolar a lista por cima do banner.
17. Registrar o resultado no ADR-003 ("WebView para o banner") com a data, os aparelhos e os números medidos.
Critérios de aprovação do spike (todos):
• 60 fps sustentados no Android intermediário durante a caminhada e a transição de capítulo.
• READY recebido em até 2 s após a abertura da tela.
• Sprites carregam sem engasgo e sem tela em branco.
• Rolar a lista não derruba o fps nem trava o gesto.
Gate: se algum critério falhar, parar aqui. Alternativas a avaliar, na ordem: otimizar (menos camadas, spritesheet único, will-change), reduzir o fps do banner para 30, trocar a animação CSS por canvas 2D, ou trocar para react-native-skia ou animação nativa. A Fase 3 só começa com o ADR-003 aprovado.
Critério de pronto: dev build rodando em Android e iOS físicos, banner animado dentro do app real, protocolo de mensagens tipado e validado, CI verde, ADR-003 com números.
Fase 3 — Regras de progressão e contratos
Objetivo: concentrar as regras do jogo (EXP, moedas, nível, capítulos, streak, desfazer) em um único lugar do back-end, como funções puras e testadas, e definir os formatos de dados da API em schemas Zod compartilhados. "Puro" significa sem banco, sem rede, sem relógio implícito: recebe dados, devolve dados. O app não calcula EXP nem nível; ele marca o item na hora e reconcilia com o resultado da API.
1. Criar o módulo progression na API: apps/api/src/modules/progression/domain/, com funções puras e arquivos *.spec.ts rodando em Jest (cobertura mínima configurada). Esta fase pode começar antes do esqueleto completo da API: basta o projeto NestJS criado (Fase 4, passo 1).
2. Definir os tipos locais: GameConfig (valores da tabela game_config), PlayerState (nível, EXP, moedas, capítulo atual, checks do capítulo) e CheckInput (item, dificuldade, tipo, checkId, data local do usuário).
3. Implementar aplicarCheck(state, input, config) retornando o novo estado e um resumo { expGanho, moedasGanhas, subiuDeNivel, capituloConcluido }. Regras: EXP 5/10/20 e moedas 1/2/4 por dificuldade; hábito pode ser marcado sem limite no dia e todo check rende EXP e moedas; bônus de 10 moedas ao subir de nível.
4. Implementar expParaNivel(n) = 75n − 25, checksParaCapitulo(n) = min(10 + 5(n−1), 40) e a progressão de 5 capítulos por história.
5. Implementar desfazerCheck(state, input, config): só no mesmo dia local; devolve EXP e moedas mas nunca reduz o nível (regras complementares na especificação).
6. Implementar as funções de diário: estaAtrasado(diario, hoje) e calcularStreak(historico, hoje), sempre recebendo hoje como argumento (nunca new Date() dentro).
7. Implementar diaLocal(instante, timezone) para a virada às 00:00 no fuso do usuário (usar Intl ou date-fns-tz; testar horário de verão e virada de mês/ano).
8. Testes de unidade para cada função: casos normais, limites (nível 1, capítulo 40 checks, vários checks do mesmo hábito no dia), idempotência e propriedade "aplicar e desfazer no mesmo dia volta ao estado original (exceto nível)" com fast-check.
9. Em packages/contracts, criar os schemas Zod de: auth (registro, login, refresh, social), Item (hábito, diário, tarefa), CheckRequest/CheckResponse (com checkId), PlayerState, Character, Story/Chapter, GameConfig e o formato de erro padrão da API. Exportar tipos com z.infer.
10. Incluir o protocolo do banner (Fase 2) no mesmo pacote e garantir que banner e mobile o importam de lá, e a api para os schemas HTTP.
11. Escrever AGENTS.md de contracts e do módulo progression (regra: sem I/O, sem Date.now() no domain, toda mudança de regra começa por um teste).
12. Registrar em ADR-004 as regras que ficaram ambíguas e como foram resolvidas.
Critério de pronto: cobertura de progression/domain ≥ 80% (meta da especificação), todos os exemplos da especificação têm um teste equivalente, contratos importados por api, mobile e banner sem erro de tipo, CI verde.
Fase 4 — Primeira fatia ponta a ponta (Marco 1)
Objetivo: marcar um diário no celular, contra a API real, ver o EXP subir e o banner reagir. É a prova de que app, API, banco e domínio conversam.
API
1. Em apps/api, criar o projeto NestJS 11 (pnpm dlx @nestjs/cli new api --package-manager pnpm), ajustar para o monorepo e importar @nextjourney/contracts. A rota base é /v1.
2. Subir o Postgres local com docker compose (arquivo na raiz) e configurar Prisma: pnpm --filter @nextjourney/api exec prisma init.
3. Modelar o esquema mínimo: User, RefreshToken, Character, PlayerState, Item (tipo, dificuldade, recorrência), CheckLog (com checkId único), GameConfig. Gerar a primeira migration e um seed com o game_config inicial.
4. Configuração tipada de ambiente (Zod) que falha ao iniciar se faltar variável.
5. Logs com nestjs-pino: requestId por requisição, nível por ambiente e redact para authorization, senhas e tokens.
6. GET /health com Terminus (checa o banco) e Swagger em /docs fora de produção.
7. Auth por e-mail e senha: POST /auth/register, /auth/login, /auth/refresh, hash com argon2, JWT de acesso curto + refresh rotativo. Validação de body com os schemas Zod do contrato.
8. POST /v1/items/:id/checks chamando o módulo progression (aplicarCheck) dentro de uma transação; devolver CheckResponse. Repetir o mesmo checkId devolve o mesmo resultado sem duplicar (teste dedicado).
9. Testes: unit dos serviços e e2e com Supertest contra um Postgres de teste (container no CI).
App
10. Cliente axios com interceptor que injeta o token e faz refresh em 401 uma única vez (fila para requisições concorrentes). Tokens no SecureStore.
11. TanStack Query configurado; Zustand para estado de sessão e personagem.
12. Telas de Login e Cadastro com react-hook-form + Zod (reaproveitando o schema do contrato).
13. Tela de Diários lendo GET /items?type=daily e mostrando o check. Ao tocar, gerar checkId (UUID), marcar o item de forma otimista no cache (só o estado do check, sem calcular EXP), enviar ITEM_CHECKED com o progresso estimado (checks do capítulo + 1 sobre o necessário) e chamar a API; com a resposta, reconciliar pelo CheckResult e mostrar o toast de EXP; em erro, reverter e mostrar aviso.
14. Conectar o resultado ao banner: ITEM_CHECKED a cada check e CHAPTER_COMPLETED quando o domínio indicar.
15. Testar em aparelho físico contra a API em staging. Registrar no diário do projeto.
Critério de pronto (Marco 1): cadastro, login, listar diários, marcar um diário, ver EXP e banner atualizarem, tudo contra a API real hospedada; teste e2e do check idempotente passando; CI verde. Marco 1 datado no Andamento.
Fase 5 — Loop completo (Marco 2)
Objetivo: todas as telas e regras da v1 funcionando ponta a ponta: onboarding, criação de personagem, escolha de história, os três tipos de item, progressão, loja e perfil. Cada item é um único check (sem +/− na v1).
1. Login social: POST /auth/google e /auth/apple validando o ID token no servidor; no app, @react-native-google-signin/google-signin (Google: signIn() devolve o ID token, que vai para a API) e expo-apple-authentication (iOS). Reaproveitar no módulo auth a validação de ID token do seu back-end atual. Vincular ao mesmo usuário quando o e-mail coincidir.
2. Onboarding: Splash, Boas-vindas e Tutorial (3 passos) com a arte LPC; flag "tutorial visto" no perfil.
3. Personagem: tela de criação (cabelo, roupa, acessório) com prévia animada; POST /character; o banner recebe SET_CHARACTER.
4. Histórias: GET /stories, escolha da história (5 opções) e troca posterior nas configurações preservando o progresso por história.
5. Itens — CRUD: criar, editar, arquivar e excluir tarefas, diários e hábitos, com dificuldade (Fácil/Médio/Difícil), formulário validado pelo contrato.
6. Tarefas: lista com prazo, check único, concluídas recolhidas.
7. Diários: recorrência (dias da semana), atraso e streak calculados na leitura e no check pelo domínio; badge de pendentes na aba.
8. Hábitos: um check por toque, sem limite diário (todo check rende EXP), contador do dia visível.
9. Desfazer: disponibilidade apenas no mesmo dia; feedback claro quando não for mais possível.
10. Progressão: barra de capítulo no banner e no topo, transição de capítulo (CHAPTER_COMPLETED → CHAPTER_TRANSITION_DONE), fim de história, celebração de nível com háptico.
11. Perfil: nível, EXP, moedas, conquistas, edição de personagem, configurações (fuso horário, notificações, idioma), sair.
12. Fuso horário: enviar o fuso do aparelho no cadastro e permitir alterá-lo; toda regra "do dia" usa esse fuso.
13. i18n: extrair todos os textos para i18next (pt-BR primeiro, en preparado).
14. Estados de tela: vazio, carregando (skeleton) e erro em todas as listas; mensagens de erro vindas do formato padrão da API.
15. Testes: e2e da API para cada regra de negócio; testes de componente das telas principais (jest-expo + Testing Library); um roteiro manual de regressão em docs/QA.md.
16. Revisar o game_config inicial e registrar as decisões no ADR.
17. Recuperação de senha (RF-05): POST /auth/forgot-password e /auth/reset-password (sempre 202), e-mail transacional (Resend) com link de uso único válido por 30 minutos, telas 22 e 22b.
18. Categorias (RF-23): 5 padrão criadas no cadastro, CRUD até 10 com cor da paleta, filtro por pills nas Tarefas; ao excluir uma categoria com itens, pedir a categoria de destino.
19. Conquistas (RF-32 a RF-34): catálogo no seed, avaliação dos critérios dentro da mesma transação do check, modal de conquista e cosméticos liberados em user_cosmetics.
20. Home: GET /home agregado (contadores, história ativa com progresso, itens "Para hoje"), com o banner QG e a cena por horário no fuso do perfil.
21. Minha história (RF-29): GET /me/story/timeline e a tela da linha do tempo.
22. Aceite de Termos e Política no cadastro (LGPD), gravando versão e data do aceite.
Pré-requisito de design: Conquistas, modal de conquista, Minha história, Categorias e Configurações ainda não existem no Figma (ver lacunas na especificação); desenhar antes dos passos 11, 18, 19 e 21.
Critério de pronto (Marco 2): uma pessoa nova instala o app, faz onboarding, cria personagem, escolhe história, cria itens dos três tipos, marca, desfaz, sobe de nível e conclui um capítulo sem ajuda; todos os RFs que a matriz de cobertura atribui às Fases 4 e 5 atendidos (ou justificados); CI verde.
Fase 6 — Conteúdo (paralela a partir da Fase 4)
Objetivo: produzir os 25 capítulos (5 histórias × 5 capítulos), cenas, sprites e textos, com créditos corretos das licenças LPC. Pode andar em paralelo ao código porque é só dado e arte.
1. Fechar o formato de dados de conteúdo em packages/contracts: Story, Chapter, Scene (camadas de parallax, bioma, hora do dia), textos de introdução e fim.
2. Escrever o roteiro curto de cada capítulo (introdução, marco de meio, conclusão) em pt-BR, com no máximo alguns parágrafos.
3. Produzir a arte por bioma: camadas de parallax 16px, miniatura da história (335×120), ícones de conquista 32×32, todos em LPC (contorno, até 16 cores, sem anti-aliasing).
4. Completar os sprites do personagem: cabelos, roupas e acessórios, com ciclo de 9 frames, e exportar em spritesheets únicos por categoria para reduzir requisições.
5. Cadastrar o conteúdo via seed versionado (nada de conteúdo digitado direto no banco de produção).
6. Manter CREDITS.md com autor, licença (CC-BY-SA/GPL/CC0) e link de cada asset LPC usado, e exibir a tela "Créditos" no perfil. Verificar a compatibilidade das licenças com a distribuição nas lojas antes de congelar a arte.
7. Criar um script que valida os assets: dimensões, número máximo de cores por sprite e tamanho total do bundle do banner.
8. Testar cada história no banner (todos os capítulos e transições) em um aparelho físico.
9. Definir o limite de peso do index.html do banner (ex.: abaixo de alguns MB) e medir a cada entrega de arte.
Critério de pronto: 25 capítulos carregam e transitam sem erro, CREDITS.md completo, script de validação de assets passando no CI, peso do banner dentro do limite.
Fase 7 — Endurecimento
Objetivo: deixar o app confiável no mundo real: sem rede, com erros visíveis, seguro, acessível e em conformidade com as lojas.
1. Fila offline: persistir checks pendentes localmente (com checkId), reenviar em ordem ao voltar a conexão (netinfo), com backoff. Conflito resolvido pela idempotência no servidor. Testar em modo avião.
2. Notificações locais: expo-notifications com lembrete diário configurável e pedido de permissão no momento certo (não na abertura).
3. Sentry: SDK no app, na API e no banner, com source maps enviados pelo EAS e pelo CI, e requestId anexado aos eventos da API.
4. Exclusão de conta: endpoint DELETE /v1/me que apaga ou anonimiza todos os dados (remoção definitiva em até 30 dias por rotina do @nestjs/schedule), fluxo no app sem tela dedicada (linha “Excluir conta” em Configurações › Conta, com diálogo de confirmação) e uma página web pública de solicitação (exigida pelas lojas).
5. Segurança da API: rate limit (throttler) mais rígido nas rotas de auth, CORS restrito, headers com helmet, revisão de logs para garantir que nada sensível vaza, pnpm audit no CI.
6. Backups: rotina de backup do Postgres e teste de restauração documentado.
7. Acessibilidade: rótulos em todos os controles, alvos de toque de 44 pt, suporte a fonte maior do sistema, leitor de tela nas listas e nos checks. Corrigir os pontos já sinalizados no design: cor --text-muted sobre a barra de navegação e texto em Press Start 2P de 9px.
8. Performance: revisar re-renders das listas, imagens, tamanho do bundle e tempo de abertura; repetir a medição do banner com o conteúdo final.
9. Reduzir movimento: respeitar a preferência do sistema pausando ou simplificando animações do banner (PAUSE/RESUME e app em segundo plano).
10. Atualizações OTA: configurar expo-updates e o canal por ambiente; definir a regra do que pode ir por OTA e do que exige build novo.
11. Privacidade: preencher o mapa de dados coletados para a App Store (Privacy Nutrition Labels) e o formulário de Data Safety do Google.
Critério de pronto: todo o fluxo principal funciona em modo avião e sincroniza ao voltar; erros aparecem no Sentry com contexto; exclusão de conta testada; checklist de acessibilidade sem pendências críticas; restauração de backup testada.
Fase 8 — Beta e lojas (Marco 3)
Objetivo: colocar o app na mão de pessoas reais, calibrar as regras do jogo com dados de uso e publicar nas duas lojas.
1. Congelar funcionalidades (feature freeze) e abrir a branch de release; só correções entram.
2. Build de produção: eas build --profile production --platform all; conferir versão, buildNumber e versionCode autoincrementados.
3. Enviar para o TestFlight (eas submit -p ios) e para o teste interno/fechado do Google Play (eas submit -p android).
4. Convidar testadores (de 10 a 30 pessoas) e coletar feedback por um formulário único. Rodar o teste por 1 a 2 semanas, respeitando o mínimo exigido pela Play para contas novas.
5. Instrumentar métricas simples (sem dados pessoais): checks por dia, retenção D1/D7, capítulos concluídos, erros por sessão.
6. Calibrar o game_config com os dados: se o nível sobe rápido ou devagar demais, ajustar valores pela tabela (sem novo build) e registrar cada ajuste com data e motivo.
7. Triar bugs do beta por severidade; corrigir tudo que for crítico e alto antes de submeter.
8. Preparar a ficha das lojas: nome, subtítulo, descrição, palavras-chave, capturas de tela nos tamanhos exigidos, ícone, classificação etária, URL de privacidade, URL de exclusão de conta, créditos.
9. Revisar contra as diretrizes: login social exige Sign in with Apple no iOS, texto de permissões claro, sem referências a conteúdo não entregue.
10. Submeter para revisão (App Store e Play). Acompanhar rejeições, corrigir e reenviar; registrar cada envio e resposta com data.
11. Após a aprovação, liberar em etapas (rollout gradual) e monitorar Sentry e métricas nos primeiros dias.
12. Escrever a retrospectiva do MVP e a lista de candidatos para a v1.1 (por exemplo, o +/− dos hábitos, que ficou fora da v1).
Critério de pronto (Marco 3): app aprovado e disponível nas duas lojas, rollout iniciado, monitoramento ativo, retrospectiva registrada.
Hospedagem na VPS
A VPS tem folga de CPU, memória e disco para o Next Journey (prod e staging). Regras para convivência com o outro projeto hospedado na mesma máquina:
• Não compartilhar o Postgres do We Party. Criar um container Postgres próprio, com volume próprio, em um compose project separado (nome next-journey), e limites de memória e CPU por container (mem_limit, cpus).
• Publicar as portas da API e do Postgres só em 127.0.0.1 (ex.: "127.0.0.1:8100:8100"). O nginx do host recebe 80/443 e faz proxy para a API, com um server block novo e certificado do certbot para o subdomínio da API.
• Backup diário do Postgres com retenção de 7 dias (RNF de disponibilidade) em job próprio, com cópia fora da VPS e teste de restauração (Fase 7, passo 6). Não encontrei rotina de backup em /etc/cron.d nem em /root; confirmar se o We Party já tem uma.
• Staging e produção na mesma VPS, em projetos compose distintos e portas distintas. Se o uso crescer, o primeiro passo é migrar o We Party ou o Next Journey para outra máquina, sem reescrever nada.
• A VPS é ponto único de falha para os dois projetos. A meta de 99,5% ao mês exige monitoramento externo simples (ex.: UptimeRobot em GET /health).
Cobertura dos requisitos (RF → fase)
• RF-01, 02, 06, 07 → Fase 4. RF-03, 04 → Fase 5 (passo 1). RF-05 → Fase 5 (passo 17). RF-08 → Fase 7 (passo 4).
• RF-09 a 13 (onboarding) → Fase 5 (passos 2 a 4). RF-14 a 16 (itens) → Fase 5 (passo 5).
• RF-17 → Fase 4. RF-18 → Fase 5 (passo 9). RF-19 a 21 → Fase 5 (passos 6 a 8). RF-22 (busca, desejável) → depois da Fase 5.
• RF-23 → Fase 5 (passo 18). RF-24, 25 → Fases 4 e 5 (passo 10). RF-26 (desejável) → depois da Fase 5.
• RF-27 a 30 → Fase 5 (passos 4, 10 e 21). RF-31 → backlog (fora da v1).
• RF-32 a 34 → Fase 5 (passo 19). RF-35 → Fase 5 (passo 20). RF-36 → Fases 2 e 5. RF-37, 38 → Fase 5 (passo 11).
• RF-39 → Fase 7 (passo 2). RF-40 → Fase 7 (passo 1).
Andamento
Nenhuma fase foi iniciada. Preencha as datas no formato AAAA-MM-DD ao mudar o status; ver as regras de datação logo abaixo.
Fase
Marco
Status
Início planejado
Início real
Fim real
Notas e ADRs
0 · Contas e credenciais

Não iniciada




1 · Fundação do monorepo

Não iniciada




2 · App real + spike do banner
Gate do spike
Não iniciada




3 · Domínio puro e contratos

Não iniciada




4 · Primeira fatia ponta a ponta
Marco 1
Não iniciada




5 · Loop completo
Marco 2
Não iniciada




6 · Conteúdo (paralela)

Não iniciada




7 · Endurecimento

Não iniciada




8 · Beta e lojas
Marco 3
Não iniciada




Regras de documentação e datas
Todo registro do projeto tem data, autor e motivo, para que daqui a meses seja possível reconstruir o que foi decidido e quando. Estas regras valem para pessoas e para agentes de IA.
Formato de data
• Sempre ISO 8601: AAAA-MM-DD (ex.: 2026-09-29). Nunca 29/09 ou "semana passada".
• Horários, quando importam (deploy, incidente), em AAAA-MM-DDTHH:mm com o fuso explicitado (ex.: -03:00).
• A data é a do dia em que o fato aconteceu, não a do dia em que você lembrou de escrever. Se registrar depois, escreva as duas: 2026-10-02 (ocorrido em 2026-09-30).
• Datas de planejamento são revisadas, nunca apagadas: a antiga fica riscada ou em nota, com a nova ao lado.
Onde cada coisa é registrada
Registro
Onde
Quando escrever
Formato
Diário do projeto
docs/DIARIO.md
Ao fim de cada dia de trabalho
Uma entrada por dia, mais recente no topo: ## AAAA-MM-DD + o que foi feito, bloqueios, próximo passo
Log de decisões (ADR)
docs/adr/NNNN-titulo.md
Ao tomar qualquer decisão técnica ou de produto difícil de reverter
Data, status (proposta, aceita, substituída), contexto, decisão, consequências. ADR nunca é editado depois de aceito: uma nova o substitui e aponta para a antiga
Andamento
Tabela deste documento
Ao iniciar e ao concluir uma fase
Status, datas de início e fim reais, ADRs relacionados
Registro de conclusão de fase
docs/fases/fase-N.md
No dia em que a fase termina
Data de início e fim, critérios de pronto com evidência (link de PR, print, números), desvios do plano, pendências herdadas
Changelog
CHANGELOG.md
A cada release e a cada build enviado à loja
Versão + data, com Adicionado, Alterado, Corrigido, Removido
Ajustes do game_config
docs/game-config.md
A cada alteração de valor em produção
Data, valor antigo, valor novo, motivo, dado que justificou
Riscos e bloqueios
docs/RISCOS.md
Ao identificar e ao resolver
Data de abertura, descrição, impacto, dono, data de resolução
Regras de commit, PR e código
1. Commits seguem Conventional Commits (feat:, fix:, docs:, chore:, refactor:, test:); a data já vem do Git, não repita na mensagem.
2. O título do PR diz o que muda; o corpo cita a fase ("Fase 4, passo 8") e links para ADRs e issues.
3. Todo PR que mude regra de jogo, contrato da API ou protocolo do banner atualiza o ADR ou cria um novo, no mesmo PR.
4. Comentários de código com prazo (TODO, FIXME) levam data e dono: // TODO(2026-10-15, pedro): remover após migração.
5. Migrations do Prisma são nomeadas com o prefixo de data gerado pela ferramenta e nunca editadas depois de aplicadas em produção.
6. Tags de release no padrão vX.Y.Z; a data da release fica no CHANGELOG.md e na página de release do GitHub.
Rotina
• Diária: uma entrada no diário (5 minutos) e a tabela de Andamento atualizada se algo mudou de status.
• Ao fim de cada fase: registro de conclusão, revisão dos ADRs pendentes e data de início planejada da próxima fase.
• Ao fim de cada marco: demonstração curta gravada em vídeo, arquivada com a data no nome (marco-1-2026-MM-DD.mp4).
• Regra de ouro: se uma decisão, mudança de escopo ou desvio não está escrito com data, ele não aconteceu.
Modelo de entrada do diário
## 2026-09-29

- Feito: Fase 1, passos 1 a 6 (workspace + Turbo + pastas).
- Decisões: ADR-002 (pnpm + Turborepo) aceita.
- Bloqueios: aguardando aprovação da conta Apple (pedido em 2026-09-27).
- Próximo: Fase 1, passos 7 a 10 (tsconfig, ESLint, Husky).