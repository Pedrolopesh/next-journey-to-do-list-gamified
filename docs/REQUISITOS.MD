Next Journey — Especificação do MVP v1
Sep 28, 2026 · @Pedro Lopes
Visão geral e escopo
A v1 é um to-do list de uso pessoal em que cada item concluído rende EXP e moedas e faz o personagem LPC avançar por uma história em capítulos. Ela sai para iOS e Android e é formada por três projetos: back-end (NestJS + PostgreSQL), front-end web da camada de jogo (o banner que roda dentro de um WebView) e o aplicativo (React Native + Expo).
Mudança em relação ao design: na v1 não existem botões + e − nos hábitos. Diários, tarefas e hábitos usam o mesmo componente de check, e todo check dispara o mesmo evento ITEM_CHECKED no banner. O que muda entre os tipos é só a regra de recorrência e o destino do item depois de marcado (veja Regras de negócio).
Princípios da v1
• Uma só ação central: marcar um item. Todo o resto (EXP, nível, moedas, conquistas, avanço de capítulo) é consequência calculada no back-end.
• O servidor é a fonte da verdade da progressão. O app mostra o resultado de forma otimista, mas quem calcula EXP, nível e capítulo é o back-end.
• Camada de jogo e camada funcional separadas: o banner só recebe eventos e nunca altera dados.
• Dark mode nativo, pt-BR, sem funcionalidades sociais, sem loja e sem penalidades.
Requisitos funcionais
São 40 requisitos em 10 módulos. Obrigatório bloqueia o lançamento; Desejável entra se couber no prazo e não bloqueia a publicação nas lojas.
ID
Módulo
Requisito
Prioridade
RF-01
Autenticação
Cadastro com nome, e-mail, senha e confirmação. A senha exige 8+ caracteres, maiúscula, número e caractere especial, com checklist visível até o envio.
Obrigatório
RF-02
Autenticação
Login com e-mail e senha, com opção de mostrar ou ocultar a senha.
Obrigatório
RF-03
Autenticação
Login com Google.
Obrigatório
RF-04
Autenticação
Login com Apple (exigência da App Store quando há login social).
Obrigatório
RF-05
Autenticação
Recuperação de senha por e-mail, com link de uso único válido por 30 minutos.
Obrigatório
RF-06
Autenticação
Sessão persistente: o usuário continua logado ao reabrir o app (access + refresh token).
Obrigatório
RF-07
Autenticação
Logout em Perfil › Conta.
Obrigatório
RF-08
Autenticação
Exclusão de conta dentro do app, apagando os dados pessoais (exigência da Apple e do Google Play).
Obrigatório
RF-09
Onboarding
Splash com logo e nome do app enquanto a sessão é verificada.
Obrigatório
RF-10
Onboarding
Tutorial de 3 slides, pulável, exibido só no primeiro acesso.
Obrigatório
RF-11
Onboarding
Criação do personagem: nome, título (Herói, Heroína, Aventureiro), tom de pele, cabelo, roupa e acessório, salvos como chaves de camada LPC.
Obrigatório
RF-12
Onboarding
Escolha de 1 entre 5 histórias.
Obrigatório
RF-13
Onboarding
O onboarding retoma do passo onde parou; o app só libera as abas com personagem e história definidos.
Obrigatório
RF-14
Itens
Criar item com título, tipo (Diário, Tarefa, Hábito), categoria, dificuldade (Fácil, Médio, Difícil) e nota opcional.
Obrigatório
RF-15
Itens
Campos por tipo: Diário tem frequência (todo dia ou dias da semana); Tarefa tem prazo opcional (data e hora); Hábito não tem prazo.
Obrigatório
RF-16
Itens
Editar e excluir item. A exclusão é lógica e mantém o histórico de EXP.
Obrigatório
RF-17
Itens
Marcar item com um check único, igual para os 3 tipos.
Obrigatório
RF-18
Itens
Desmarcar no mesmo dia, revertendo EXP e moedas daquele check.
Obrigatório
RF-19
Itens
Aba Diários: itens do dia, com os atrasados no topo, contagem de sequência e badge de pendentes no menu.
Obrigatório
RF-20
Itens
Aba Tarefas: agrupadas por categoria, com filtro por pills e destaque de atraso. A tarefa sai da lista depois de marcada.
Obrigatório
RF-21
Itens
Aba Hábitos: lista com contador de checks de hoje e da semana.
Obrigatório
RF-22
Itens
Busca por título nas três abas.
Desejável
RF-23
Categorias
5 categorias padrão (Trabalho, Saúde, Estudo, Freela, Pessoal). O usuário pode renomear, criar e excluir até 10, com cor da paleta.
Obrigatório
RF-24
Progressão
Cada check gera EXP e moedas conforme a dificuldade; barra de EXP e badge de nível no Perfil e na Home.
Obrigatório
RF-25
Progressão
Toast de EXP a cada check e modal de subida de nível.
Obrigatório
RF-26
Progressão
Resumo semanal no Perfil (itens concluídos na semana, zerado toda segunda-feira).
Desejável
RF-27
História
Header de progresso com história ativa, capítulo atual e barra "itens para avançar".
Obrigatório
RF-28
História
Ao completar um capítulo: modal com thumbnail, título, texto de 2 a 3 linhas e botão Continuar.
Obrigatório
RF-29
História
Tela Minha história: linha do tempo com capítulos concluídos (check verde), atual (borda roxa + condição) e futuros (cadeado).
Obrigatório
RF-30
História
Trocar de história; o progresso de cada história fica salvo e é retomado ao voltar para ela.
Obrigatório
RF-31
História
Escolha narrativa de 2 opções no fim de alguns capítulos, registrada na linha do tempo.
Backlog (fora da v1, decidido em 2026-10-02)
RF-32
Conquistas
Catálogo de conquistas com critério, progresso e estado (bloqueada ou conquistada).
Obrigatório
RF-33
Conquistas
Modal de conquista (topo dourado, ícone LPC, Continuar) exibido no momento em que ela é desbloqueada.
Obrigatório
RF-34
Conquistas
Conquistas liberam itens cosméticos de customização (ex.: 7 dias seguidos libera uma roupa especial).
Obrigatório
RF-35
Home
Banner QG com cena conforme o horário, saudação, 3 contadores, card da história e lista "Para hoje".
Obrigatório
RF-36
Banner
Banner das abas: caminhada em loop, corrida de 5s a cada check, fade de troca de capítulo e posição do personagem salva entre sessões.
Obrigatório
RF-37
Perfil
Avatar, nome, título, nível, EXP, moedas, atalhos para conquistas, história e personalização.
Obrigatório
RF-38
Perfil
Configurações: cor tema (história), categorias, conta, notificações e sobre.
Obrigatório
RF-39
Notificações
Lembrete diário local em horário escolhido pelo usuário e aviso de diários pendentes à noite.
Obrigatório
RF-40
Offline
Checks feitos sem internet entram numa fila local e são sincronizados quando a conexão volta.
Desejável
Regras de negócio
Todo check vale EXP e moedas pela dificuldade do item, e qualquer tipo de item conta 1 passo para o capítulo. Os valores abaixo são o ponto de partida e ficam em configuração no back-end (tabela game_config), para ajustar sem publicar o app de novo.
Parâmetro
Valor inicial
EXP por check (Fácil / Médio / Difícil)
5 / 10 / 20
Moedas por check (Fácil / Médio / Difícil)
1 / 2 / 4
Bônus ao subir de nível
10 moedas
Checks de hábito por dia
Sem limite: todo check rende EXP e moedas
Checks para completar o capítulo n
10 + 5 × (n − 1), máximo 40
Capítulos por história na v1
5
Virada do dia
00:00 no fuso salvo no perfil do usuário
Faixas da cena do QG
manhã 05h–12h, tarde 12h–18h, noite 18h–05h
EXP necessária para ir do nível n ao n + 1 (nível 1 → 2 = 50; nível 7 → 8 = 500):
\mathrm{EXP}_{n \to n+1} = 75n - 25
Por tipo de item
• Diário: um check por dia agendado. Se um dia agendado termina sem check, o item aparece como atrasado no dia seguinte e a sequência zera. Dias não agendados não quebram a sequência. Marcar um diário atrasado conta para o dia de hoje.
• Tarefa: um check único. Depois de marcada, sai da lista em 600 ms e vai para o histórico. Uma tarefa vencida continua valendo o EXP cheio (sem penalidade na v1).
• Hábito: pode ser marcado várias vezes por dia. Cada check soma no contador e rende EXP, moedas e um passo do capítulo, sem limite diário.
Desmarcar e progressão
• Só é possível desmarcar no mesmo dia do check. A ação reverte o EXP, as moedas e o passo do capítulo daquele check.
• O nível nunca cai: se a reversão passar do início do nível, o EXP para no mínimo do nível atual. Conquistas já ganhas não são removidas, e o banner não anima recuo na v1.
• EXP, nível e moedas são globais. O progresso de capítulo é separado por história.
• A posição do personagem no banner é o progresso do capítulo: 0% na borda direita e 100% na esquerda. Ao chegar a 100%, o capítulo fecha, o banner faz o fade e o modal do capítulo abre.
• Moedas só acumulam na v1, sem loja. O item Stats do Perfil fica bloqueado até o nível 10.
Catálogo inicial de conquistas
Conquista
Critério
Recompensa
Primeiro passo
Primeiro check
—
Chama de 7 dias
Todos os diários agendados concluídos por 7 dias seguidos
Roupa especial
Organizado
Criar 10 itens
—
Maratonista
100 checks no total
Bandana
Aprendiz
Chegar ao nível 5
Espada de prata
Veterano
Chegar ao nível 10
Capa
Novo capítulo
Completar o primeiro capítulo
—
Lenda viva
Completar uma história inteira
Escudo
Madrugador
Um check antes das 07h
—
Equilíbrio
Checks em 3 categorias diferentes no mesmo dia
—
Regras complementares (propostas em 2026-10-02, a confirmar)
Pontos que a especificação deixava abertos. Cada um vira teste no módulo progression e entra no ADR-004.
• Capítulo fechado é definitivo: o check que fechou o capítulo (e os anteriores) não pode ser desmarcado; a API responde 409 com code CHECK_LOCKED. Só checks do capítulo ainda aberto revertem o passo.
• O bônus de 10 moedas por subir de nível não é revertido ao desmarcar, já que o nível nunca cai.
• O EXP que sobra ao subir de nível é carregado para o próximo (exp_in_level); um check pode subir mais de um nível, e o modal mostra o nível final.
• Ao concluir o capítulo 5, a história fica concluída: os checks seguem rendendo EXP e moedas, o progresso de capítulo não avança e o app oferece escolher outra história.
• Hábito sem limite diário (decidido em 2026-10-02): cada check rende EXP, moedas e um passo do capítulo; desmarcar reverte o check específico (checkId).
• Desmarcar diário restaura last_checked_on e a sequência anteriores (campo streak_before em item_checks). Desmarcar tarefa a devolve à lista (completed_at nulo).
• Um diário criado hoje só fica atrasado se um dia agendado terminar depois da criação. Marcar um diário atrasado reinicia a sequência em 1.
• Itens excluídos mantêm o histórico de EXP, mas seus checks não podem mais ser desmarcados.
• Mudar o fuso do perfil vale daqui para frente: checked_on já gravado não é recalculado.
• Conquistas são avaliadas dentro da transação do check e liberadas uma só vez (idempotente). total_checks diminui ao desmarcar, mas conquista já ganha não é removida.
• Chama de 7 dias: 7 dias locais seguidos em que todo diário agendado foi concluído no próprio dia; dias sem diário agendado são neutros.
• Organizado conta itens criados (items_created), mesmo os excluídos depois. Madrugador usa a hora local do perfil (antes das 07h). Equilíbrio conta categorias distintas de checks ativos no mesmo dia local.
• Contador semanal do hábito (RF-21) e resumo semanal (RF-26): semana de segunda a domingo no fuso do perfil, calculada na leitura. GET /items devolve checksToday e checksThisWeek; GET /me devolve o resumo da semana.
• Posição do personagem entre sessões (RF-36): derivada de story_progress (checks_in_chapter / required_checks), devolvida em GET /home. O timeOfDay do QG usa o fuso do perfil.
• Excluir uma categoria com itens ativos exige informar a categoria de destino (moveTo).
• O cadastro envia o aceite de Termos e Política (termsAcceptedAt e termsVersion).

Requisitos não funcionais
A meta de desempenho mais importante é o check responder na tela em menos de 100 ms, com atualização otimista, mesmo que o servidor demore.
Categoria
Requisito
Plataformas
iOS e Android a partir das versões mínimas do SDK do Expo usado; iPhone e aparelhos Android de 4 GB de RAM como referência.
Desempenho
Feedback do check em menos de 100 ms; p95 da API abaixo de 300 ms em check e listagens; banner a 60 fps; abertura a frio em menos de 3 s.
Segurança
Senhas com argon2id; access token JWT de 15 min + refresh token de 30 dias com rotação e revogação; HTTPS obrigatório; rate limit de 5 tentativas de login por minuto por IP e e-mail; ID tokens do Google e da Apple validados no back-end.
Armazenamento no aparelho
Tokens só no SecureStore (Keychain / Keystore); nada sensível no AsyncStorage.
Privacidade (LGPD)
Aceite de Termos e Política no cadastro; exclusão de conta com remoção dos dados pessoais em até 30 dias; logs sem e-mail, senha ou token.
Disponibilidade
99,5% ao mês; backup diário do PostgreSQL com retenção de 7 dias.
Observabilidade
Logs JSON estruturados com requestId no back-end; captura de erros com Sentry no back-end, no app e no front-end do banner.
Datas e fuso
Tudo em UTC no banco; o "dia" do usuário é calculado no fuso IANA salvo no perfil (ex.: America/Sao_Paulo).
Acessibilidade
Alvos de toque de 44 px ou mais; accessibilityLabel em botões de ícone; texto informativo com contraste mínimo de 4,5:1; suporte a fonte do sistema em até 130%.
Idioma
pt-BR na v1, com todos os textos em arquivos de tradução para facilitar o inglês depois.
Qualidade de código
Lint sem erros nem warnings no CI; cobertura mínima de 80% nas regras de negócio do back-end e de 70% na lógica do app e do front-end.
Arquitetura e organização dos repositórios
Os três projetos ficam num único monorepo com pnpm workspaces e Turborepo, porque API, app e banner compartilham os mesmos contratos Zod. Um schema alterado quebra o typecheck dos três no mesmo PR, e não em produção.
O app fala com a API por REST e com o banner por postMessage; o banner nunca acessa a API. Login com Google e Apple acontece no aparelho, e só o ID token chega à API para validação.
next-journey-to-do-list-gamified/
  apps/
    api/        NestJS + Prisma
    banner/     Vite + TS (camada de jogo)
    mobile/     Expo + React Native
  packages/
    contracts/      schemas Zod e tipos (API, app, banner)
    eslint-config/  regras de lint compartilhadas
    tsconfig/       tsconfig.base.json
  AGENTS.md  turbo.json  pnpm-workspace.yaml  .husky/
Não há pacote de domínio compartilhado: toda regra de progressão (EXP, moedas, nível, capítulo, sequência, conquistas) mora só em apps/api/src/modules/progression/domain. O app mostra o resultado do CheckResult e só estima o progresso do capítulo (checks do capítulo + 1 sobre o necessário) para animar o banner.
A troca é um pouco mais de configuração inicial (Metro com pnpm, cache do Turbo no CI) em troca de não duplicar tipos. Com três repositórios, os contratos teriam que virar um pacote npm versionado.
Projeto 1 — Back-end (apps/api)
O back-end é uma API REST em NestJS que concentra toda a regra de progressão. Um check é uma única transação que devolve EXP, nível, capítulo e conquistas já calculados.
Stack
Camada
Tecnologia
Como é usada
Runtime
Node.js 24 LTS + TypeScript em modo strict
Mesma versão no CI, no Docker e na máquina (.nvmrc).
Framework
NestJS 11
Um módulo por domínio: controller → service → funções de domínio puras → repositório.
Banco
PostgreSQL 16+
UUID como chave, timestamptz para datas, jsonb só para agenda e critérios.
ORM e migrations
Prisma
schema.prisma é a fonte da verdade; prisma migrate versiona o schema; seed com histórias, capítulos, conquistas e game_config.
Validação e contratos
Zod + nestjs-zod
Os schemas ficam em packages/contracts e são importados pela API e pelo app.
Autenticação
@nestjs/jwt, argon2, google-auth-library, jose
JWT próprio; ID token do Google validado pela lib oficial; o da Apple validado com as chaves públicas da Apple via jose.
Configuração
@nestjs/config + schema Zod do .env
A API não sobe se faltar ou estiver inválida alguma variável.
Logs
nestjs-pino (pino + pino-http)
Detalhado em Logs, abaixo.
Segurança HTTP
helmet, CORS restrito, @nestjs/throttler
Rate limit global e mais rígido nas rotas de autenticação.
Rotinas agendadas
@nestjs/schedule
Limpeza de refresh tokens vencidos e remoção definitiva de contas excluídas há 30 dias.
E-mail
Resend
Só para a recuperação de senha na v1.
Documentação
@nestjs/swagger
OpenAPI em /docs, só fora de produção.
Saúde
@nestjs/terminus
GET /health verifica o banco.
Testes
Jest + @nestjs/testing
Detalhado em Padrões comuns.
Módulos
• auth: cadastro, login, Google, Apple, refresh, logout, recuperação de senha.
• users: perfil, fuso, passo do onboarding, preferências de notificação, exclusão de conta.
• characters: chaves das camadas LPC do personagem e cosméticos liberados.
• categories: CRUD com as 5 categorias padrão criadas no cadastro.
• items: CRUD de diários, tarefas e hábitos, check e desmarcar.
• progression: EXP, nível e moedas a partir de game_config, em funções puras.
• stories: catálogo, história ativa, progresso por história, capítulos, escolhas e linha do tempo.
• achievements: catálogo e avaliação dos critérios depois de cada check.
• home: um endpoint agregado para a Home não fazer 5 chamadas.
Fluxo do check
1. O app gera um checkId (UUID v4) e chama POST /v1/items/:id/checks. Esse id torna o check idempotente: repetir a chamada, ou reenviá-la pela fila offline, não duplica EXP.
2. Numa única prisma.$transaction: valida se o check é permitido (diário já marcado hoje, tarefa concluída), grava item_checks, atualiza sequência, user_stats e story_progress, e avalia as conquistas.
3. Responde um CheckResult: expGained, coinsGained, level, leveledUp, chapterProgress, chapterCompleted, achievementsUnlocked[].
4. Registra o evento de domínio item.checked no log. level.up, chapter.completed e achievement.unlocked são logados quando acontecem.
Atraso e sequência dos diários são calculados na leitura e no check, a partir de last_checked_on e do fuso do usuário. Assim não é preciso uma rotina de virada de dia para cada fuso.
Modelo de dados
Tabela
Campos principais
users
id, email (único, opcional para Apple), password_hash, name, timezone, onboarding_step, notify_at, terms_accepted_at, terms_version, created_at, deleted_at
auth_identities
id, user_id, provider (password, google, apple), provider_user_id — único por (provider, provider_user_id)
refresh_tokens
id, user_id, token_hash, family_id, expires_at, revoked_at
password_resets
id, user_id, token_hash, expires_at, used_at
characters
user_id, name, title, skin, hair, outfit, accessory
user_stats
user_id, exp_total, level, exp_in_level, coins, total_checks, items_created
categories
id, user_id, name, color, position, deleted_at
items
id, user_id, category_id, type (daily, todo, habit), title, notes, difficulty, schedule_days, due_at, completed_at, streak_current, streak_best, last_checked_on, position, deleted_at
item_checks
id (checkId do app), item_id, user_id, checked_on (dia local), checked_at, exp, coins, counts_for_chapter, streak_before, reverted_at
stories / chapters
slug, name, theme_color, description, focus_tag, thumbnail_key / story_id, number, title, text, required_checks, scene_key, choice_options
story_progress
user_id, story_id, current_chapter, checks_in_chapter, is_active
chapter_completions
user_id, chapter_id, completed_at, choice
achievements / user_achievements
slug, name, description, icon_key, criterion, reward_key / user_id, achievement_id, unlocked_at
user_cosmetics
user_id, cosmetic_key, source
game_config
key, value (jsonb)
Endpoints (/v1)
Método e rota
O que faz
POST /auth/register · POST /auth/login
Cadastro e login por e-mail; devolvem access e refresh token.
POST /auth/google · POST /auth/apple
Recebem o ID token do provedor, criam ou vinculam o usuário.
POST /auth/refresh · POST /auth/logout
Rotaciona o refresh token (reuso revoga a família inteira) e encerra a sessão.
POST /auth/forgot-password · POST /auth/reset-password
Envia o link e troca a senha. Responde sempre 202, exista ou não o e-mail.
GET /me · PATCH /me · DELETE /me
Perfil, estatísticas, personagem, história ativa e onboarding; edição; exclusão da conta.
PUT /me/character · GET /me/cosmetics
Salva as camadas do personagem; lista os cosméticos liberados.
GET /stories · PUT /me/story
Catálogo; escolhe ou troca a história ativa.
GET /me/story/timeline · POST /me/story/chapters/:id/choice (backlog)
Linha do tempo dos capítulos; registra uma escolha narrativa.
GET /categories · POST · PATCH /:id · DELETE /:id
CRUD de categorias.
GET /items?type=&date= · POST /items · PATCH /items/:id · DELETE /items/:id
Lista já com estado do dia (feito, atrasado, sequência); cria, edita e exclui.
POST /items/:id/checks · DELETE /items/:id/checks/:checkId
Check e desmarcar; os dois devolvem CheckResult.
GET /home
Contadores, história ativa e itens "Para hoje".
GET /achievements
Catálogo com progresso e estado para o usuário.
GET /health
Estado da API e do banco.
Logs
• nestjs-pino como logger global da aplicação (app.useLogger). Em produção grava JSON em uma linha no stdout; em desenvolvimento usa pino-pretty.
• Cada requisição recebe um requestId: o valor de x-request-id quando vier, ou um UUID novo. Ele volta no header da resposta e aparece em todas as linhas de log daquela requisição.
• Campos fixos: level, time, requestId, userId (quando autenticado), method, route, statusCode, durationMs, context (módulo).
• redact remove req.headers.authorization, *.password, *.token, *.refreshToken, *.idToken e *.email. Corpo de requisição nunca é logado.
• Níveis: info para requisições e eventos de domínio, warn para erros 4xx relevantes (login inválido, rate limit), error com stack para 5xx. LOG_LEVEL é configurável por ambiente.
• Um filtro global de exceções padroniza as respostas de erro ({ code, message, requestId }) e envia os 5xx ao Sentry com o requestId.
Estrutura de pastas
apps/api/
  prisma/            schema.prisma, migrations/, seed.ts
  src/
    main.ts          bootstrap, pino, helmet, CORS, versionamento /v1
    config/          schema Zod do .env
    common/          filtros, guards, interceptors, decorators
    modules/
      auth/ users/ characters/ categories/ items/
      progression/ stories/ achievements/ home/
        *.controller.ts  *.service.ts  *.repository.ts
        domain/          funções puras + *.spec.ts
  test/              e2e (supertest)
  AGENTS.md  Dockerfile  .env.example
Projeto 2 — Front-end web da camada de jogo (apps/banner)
O front-end web é o banner pixel art: uma página HTML/CSS/TypeScript, sem engine de jogo, que roda dentro do react-native-webview e só reage a mensagens do app. A recomendação é empacotá-la como um único arquivo HTML embarcado no app. Assim ela funciona offline, sai versionada junto com o app e pode ser atualizada por EAS Update sem passar pela loja.
Stack
Item
Tecnologia
Como é usada
Build
Vite + TypeScript (sem framework de UI)
O banner tem poucos elementos; sem React, o bundle fica pequeno e a abertura dentro do WebView é rápida.
Empacotamento
vite-plugin-singlefile
Gera um index.html com JS, CSS e sprites embutidos, copiado para apps/mobile/assets/banner/ no build.
Animação
CSS @keyframes + steps() em spritesheets
Caminhada de 9 frames, corrida, fade de capítulo; só transform e opacity, para rodar na GPU.
Sprites
Folhas LPC de 64 × 64 por frame
Uma camada por parte (corpo, cabelo, roupa, acessório), empilhadas com a mesma animação e image-rendering: pixelated.
Cenários
3 camadas de paralaxe + chão em tiles de 16 px
Cada camada desliza em velocidade diferente enquanto o personagem anda.
Contratos
packages/contracts (Zod)
Os tipos das mensagens são os mesmos do app, validados na entrada.
Testes
Vitest + jsdom
Máquina de estados da cena e tratamento das mensagens.
Erros
Sentry Browser SDK
Erros do WebView enviados com a versão do banner.
Cenas
• QG (Home, 390 × 220): interior da cabana, personagem parado de frente. A cena varia entre manhã, tarde e noite pelo timeOfDay recebido do app.
• Mapa (abas, 390 × 180): cenário lateral do capítulo atual, personagem de lado andando da direita para a esquerda. A posição no eixo X é o progresso do capítulo, com transição de 600 ms.
• Arte nativa em metade da resolução (195 × 90 e 195 × 110), exibida a 2×.
Protocolo de mensagens
Toda mensagem segue o formato { v: 1, type, payload } e é validada com Zod dos dois lados. Uma mensagem inválida é descartada e gera um evento ERROR.
Direção
Tipo
Payload
Efeito
App → Banner
INIT
cena (qg ou map), camadas do personagem, sceneKey, progress (0 a 1), timeOfDay
Monta a cena na posição salva, sem animação de entrada.
App → Banner
ITEM_CHECKED
novo progress
Corrida de 5 s até a nova posição e volta para a caminhada. É o mesmo evento para os 3 tipos de item.
App → Banner
CHAPTER_COMPLETED
próximo sceneKey
Personagem chega à borda esquerda, fade para preto, nova cena carrega e ele entra pela direita.
App → Banner
SET_CHARACTER
camadas do personagem
Troca as camadas sem recarregar a cena.
App → Banner
SET_TIME_OF_DAY
morning, afternoon ou night
Troca a iluminação do QG.
App → Banner
PAUSE / RESUME
—
Pausa as animações quando a aba sai de foco ou o app vai para o fundo.
Banner → App
READY
versão do banner
O app só envia INIT depois disso.
Banner → App
CHAPTER_TRANSITION_DONE
—
O app abre o modal do capítulo.
Banner → App
ERROR
código e mensagem
O app loga e mostra a imagem estática de fallback.
Desenvolvimento
• pnpm --filter banner dev abre a página no navegador com um painel de debug (/dev.html) que dispara cada mensagem, para trabalhar sem o app.
• O banner não faz requisições de rede nem guarda estado próprio: tudo chega do app. Isso facilita os testes e evita divergência com o back-end.
• Se o WebView falhar ou demorar mais de 2 s para mandar READY, o app mostra a imagem PNG estática da cena.
apps/banner/
  src/
    main.ts          escuta mensagens, valida e despacha
    scene/           qg.ts, map.ts, state-machine.ts (+ *.test.ts)
    character/       composição das camadas LPC
    styles/          animações e paralaxe
  public/sprites/    folhas LPC e tilesets (com CREDITS.md)
  dev.html           painel de debug
  AGENTS.md  vite.config.ts
Projeto 3 — Aplicativo (apps/mobile)
O app é feito em React Native com Expo, usando development build (e não o Expo Go), porque login com Google, login com Apple, WebView e Sentry precisam de código nativo. Ele implementa as telas do design system (ver lacunas abaixo) e o fluxo de check otimista.
Stack
Item
Tecnologia
Como é usada
Base
Expo SDK estável mais recente + React Native (New Architecture) + TypeScript strict
Projeto criado com create-expo-app, configurado por app.config.ts.
Navegação
Expo Router
Rotas por arquivo, com os grupos (auth), (onboarding) e (tabs). O layout raiz redireciona conforme a sessão e o passo do onboarding.
Dados do servidor
TanStack Query
Cache por tela, update otimista no check, rollback em erro e cache persistido para abrir rápido.
Estado local
Zustand
Sessão, fila offline de checks e fila de modais (nível, conquista, capítulo).
HTTP
axios
Interceptor que injeta o access token e renova pelo refresh token no 401, com uma única renovação por vez.
Formulários
react-hook-form + Zod (packages/contracts)
As mesmas regras de validação da API, incluindo o checklist de senha.
Armazenamento
expo-secure-store (tokens) e AsyncStorage (cache e flags)
Nada sensível fora do SecureStore.
Login social
@react-native-google-signin/google-signin e expo-apple-authentication
O app obtém o ID token e envia para /auth/google ou /auth/apple.
Banner
react-native-webview
Carrega o HTML único do apps/banner e conversa por postMessage (veja o Projeto 2).
Animação e feedback
react-native-reanimated + expo-haptics
Pop do checkbox, toast de EXP, barras de progresso e vibração leve no check.
Visual
Tokens do design system em src/theme, expo-font com Inter e Press Start 2P, @tabler/icons-react-native
Sem biblioteca de UI pronta; os componentes seguem o board de Componentes.
Notificações
expo-notifications
Só lembretes locais agendados na v1 (RF-39).
Conectividade
@react-native-community/netinfo
Dispara a sincronização da fila offline (RF-40).
Idioma
i18next + expo-localization
Textos em src/i18n/pt-BR.json.
Erros
@sentry/react-native
Plugin do Expo, com upload de source maps no EAS Build.
Build e distribuição
EAS Build, EAS Submit e EAS Update
Perfis development, preview e production; OTA para correções de JS e do banner.
Testes
Jest (jest-expo) + React Native Testing Library
Detalhado em Padrões comuns. Maestro para E2E fica como desejável.
Rotas
app/
  _layout.tsx               providers, fontes, splash, redirecionamento
  (auth)/                   welcome, register, login, forgot-password
  (onboarding)/             tutorial, character, story
  (tabs)/_layout.tsx        bottom nav (5 abas, badge em Diários)
  (tabs)/                   index (Home), dailies, todos, habits, profile
  item/new.tsx              bottom sheet de criação
  item/[id].tsx             edição
  story/timeline.tsx        Minha história
  achievements.tsx
  settings/                 theme, categories, account, notifications, about
src/
  api/        cliente axios + hooks do TanStack Query por recurso
  features/   auth, items, progression, story, achievements (lógica + testes)
  components/ Button, Input, Checkbox, TaskCard, HabitCard, ProgressBar,
              FilterPill, Fab, BottomSheet, ExpToast, LevelBadge,
              StoryHeader, AchievementModal, ChapterModal, BottomNav
  banner/     BannerView + bridge tipada
  theme/      tokens de cor, tipografia e espaçamento
  store/      Zustand (sessão, fila offline, fila de modais)
  i18n/
Fluxo do check no app
1. O toque no checkbox dispara a vibração e a animação de 180 ms, e aplica o update otimista no cache (só o item marcado; o app não calcula EXP).
2. O app envia ITEM_CHECKED ao banner com o progresso previsto e chama POST /items/:id/checks com o checkId.
3. Com a resposta, o cache é reconciliado pelo CheckResult e o toast de EXP aparece. Subida de nível e conquistas entram na fila de modais, exibidos um de cada vez.
4. Se chapterCompleted vier verdadeiro, o app manda CHAPTER_COMPLETED e abre o modal do capítulo quando receber CHAPTER_TRANSITION_DONE.
5. Em erro de rede, o check vai para a fila offline e continua marcado. Em erro de regra (4xx), o app desfaz o otimismo e mostra o motivo.
Padrões comuns: AGENTS.md, lint, testes e pre-commit
Os três projetos compartilham a mesma base de qualidade, configurada uma vez na raiz do monorepo e estendida em cada app. Nenhum commit entra sem passar por lint e formatação, e nenhum push sai sem typecheck e testes dos pacotes afetados.
Item
Ferramenta
Configuração
Lint
ESLint 9 (flat config) + typescript-eslint
Config base em packages/eslint-config (regras type-checked, simple-import-sort, eslint-config-prettier). A API estende com regras de Node, o app com eslint-config-expo e o banner com globais de navegador.
Formatação
Prettier
.prettierrc único na raiz: aspas simples, vírgula final, 100 colunas.
Tipos
tsc --noEmit
tsconfig.base.json com strict, noUncheckedIndexedAccess e exactOptionalPropertyTypes.
Testes (API)
Jest + @nestjs/testing
Unitários em domain/*.spec.ts (progressão, sequência, capítulo, conquistas) e services com repositório mockado. E2E com supertest + Testcontainers (Postgres real) é desejável. Cobertura mínima de 80% em domain/.
Testes (app)
Jest (jest-expo) + React Native Testing Library
Componentes do design system, hooks de check (otimismo e rollback), fila offline e bridge do banner. Cobertura mínima de 70% em src/features.
Testes (banner)
Vitest + jsdom
Máquina de estados das cenas e validação de mensagens.
Pre-commit
Husky + lint-staged
eslint --fix e prettier --write só nos arquivos em stage.
Mensagem de commit
commitlint (Conventional Commits)
Hook commit-msg: feat(api): ..., fix(mobile): ..., chore(banner): ....
Pre-push
Husky
turbo run typecheck test --filter=...[origin/main], só nos pacotes alterados.
CI
GitHub Actions
Em todo PR: lint, typecheck, testes e build dos afetados; prisma validate e checagem de migrations na API; expo-doctor no app.
Configuração do pre-commit
// package.json (raiz)
{
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
# .husky/pre-commit
pnpm lint-staged
# .husky/commit-msg
pnpm commitlint --edit "$1"
# .husky/pre-push
pnpm turbo run typecheck test --filter="...[origin/main]"
AGENTS.md
Há um AGENTS.md na raiz, com as regras do monorepo, e um em cada app, com o que é específico dele. Um CLAUDE.md com a linha @AGENTS.md faz o Claude Code ler o mesmo arquivo. Modelo da raiz:
# AGENTS.md

## Projeto
App de produtividade gamificado. Monorepo pnpm + Turborepo:
- apps/api: NestJS + Prisma + PostgreSQL
- apps/banner: camada de jogo (Vite + TS) que roda no WebView
- apps/mobile: React Native + Expo (Expo Router)
- packages/contracts: schemas Zod compartilhados (API, app, banner)

## Comandos
- pnpm install | pnpm dev | pnpm lint | pnpm typecheck | pnpm test
- pnpm --filter api prisma migrate dev

## Regras
- Toda regra de progressão (EXP, nível, sequência, capítulo, conquistas)
  mora em apps/api/src/modules/*/domain como função pura, com teste.
- Contratos entre projetos só em packages/contracts. Nunca duplicar tipos.
- Nunca logar e-mail, senha, token ou corpo de requisição.
- Nunca editar migration já aplicada; criar uma nova.
- Textos de interface só via i18n (pt-BR.json).
- Cores e tamanhos só pelos tokens do design system.

## Pronto para PR
lint, typecheck e testes passando; teste novo para regra nova;
Conventional Commits; sem console.log.
Nos arquivos de cada app entram os comandos locais (por exemplo npx expo start --dev-client, pnpm --filter banner dev) e as regras específicas: módulos e logs na API; mensagens do banner sempre validadas pelo contrato; no app, nada sensível fora do SecureStore.
Passo a passo: criar o app com Expo para iOS e Android
O caminho recomendado é Continuous Native Generation: as pastas ios/ e android/ não vão para o Git e são geradas a partir do app.config.ts. Os builds rodam no EAS, então dá para gerar o build de iOS mesmo sem Mac; o Mac só é necessário para rodar o simulador localmente. As versões não estão fixadas aqui: npx expo install escolhe as compatíveis com o SDK instalado.
1. Pré-requisitos
• Node.js 24 LTS e pnpm (corepack enable).
• Conta na Expo (expo.dev) e eas-cli: npm i -g eas-cli && eas login.
• iOS: macOS com Xcode e um simulador (para rodar local); conta paga no Apple Developer Program (para aparelho físico e loja).
• Android: Android Studio com SDK, um emulador e JDK 17; conta no Google Play Console.
2. Monorepo
cd next-journey-to-do-list-gamified   # repositório já criado
pnpm init
printf "packages:\n  - apps/*\n  - packages/*\n" > pnpm-workspace.yaml
echo "node-linker=hoisted" > .npmrc   # recomendado pelo Expo com pnpm
pnpm add -D -w turbo typescript prettier eslint husky lint-staged @commitlint/cli @commitlint/config-conventional
mkdir -p apps packages/contracts packages/eslint-config
3. Criar o projeto Expo
cd apps
pnpm create expo-app@latest mobile --template default   # já vem com Expo Router + TypeScript
cd mobile
pnpm run reset-project   # remove as telas de exemplo e deixa app/ limpo
4. Instalar as dependências
# nativas: sempre via expo install, para pegar a versão compatível com o SDK
npx expo install expo-dev-client expo-secure-store expo-font expo-haptics \
  expo-notifications expo-localization expo-apple-authentication expo-asset expo-file-system \
  react-native-webview react-native-reanimated react-native-svg \
  @react-native-async-storage/async-storage @react-native-community/netinfo \
  @react-native-google-signin/google-signin @sentry/react-native

# só JavaScript
pnpm add @tanstack/react-query zustand axios react-hook-form @hookform/resolvers zod \
  i18next react-i18next @tabler/icons-react-native \
  @expo-google-fonts/inter @expo-google-fonts/press-start-2p

# testes
pnpm add -D jest-expo jest @testing-library/react-native @types/jest
5. Configurar o app.config.ts
import type { ExpoConfig } from 'expo/config';

const IS_PROD = process.env.APP_VARIANT === 'production';

const config: ExpoConfig = {
  name: IS_PROD ? 'Next Journey' : 'Next Journey (dev)',
  slug: 'next-journey',
  scheme: 'nextjourney',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: IS_PROD ? 'br.com.wetechhub.app' : 'br.com.wetechhub.app.dev',
    usesAppleSignIn: true,
    supportsTablet: false,
  },
  android: {
    package: IS_PROD ? 'br.com.wetechhub.app' : 'br.com.wetechhub.app.dev',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#1A1A2E' },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-apple-authentication',
    'expo-notifications',
    ['expo-splash-screen', { image: './assets/splash.png', backgroundColor: '#1A1A2E' }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.SEU_IOS_CLIENT_ID' }],
    '@sentry/react-native/expo',
  ],
  extra: { eas: { projectId: 'preenchido pelo eas init' } },
};

export default config;
O bundle id e o package acima são exemplos: defina os definitivos antes do primeiro build de produção, porque não dá para mudá-los depois de publicar. A URL da API vem de EXPO_PUBLIC_API_URL, definida por ambiente no EAS (passo 7).
6. EAS: projeto e perfis de build
eas init              # cria o projeto na Expo e grava o projectId
eas build:configure   # gera o eas.json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "ios": { "simulator": true }
    },
    "development-device": { "extends": "development", "ios": { "simulator": false } },
    "preview": { "distribution": "internal", "environment": "preview", "channel": "preview" },
    "production": {
      "environment": "production",
      "channel": "production",
      "autoIncrement": true,
      "env": { "APP_VARIANT": "production" }
    }
  },
  "submit": { "production": {} }
}
7. Variáveis e segredos
eas env:create --name EXPO_PUBLIC_API_URL --value https://api-dev.exemplo.com --environment development
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.exemplo.com --environment production
eas env:create --name SENTRY_AUTH_TOKEN --value *** --environment production --visibility secret
8. Credenciais de login social
1. Apple: no Apple Developer, ative Sign in with Apple no App ID. O usesAppleSignIn e o eas build cuidam do entitlement e dos certificados (eas credentials gerencia tudo).
2. Google: no Google Cloud Console, crie três OAuth Client IDs: Web (o back-end valida o ID token contra ele e o app o usa como webClientId), iOS (bundle id) e Android (package + SHA-1 do keystore, que aparece em eas credentials -p android).
3. Coloque o iOS client no iosUrlScheme do plugin e os IDs em variáveis EXPO_PUBLIC_*.
9. Rodar em desenvolvimento
# opção A: build na nuvem
eas build --profile development --platform ios        # .app para o simulador
eas build --profile development --platform android    # .apk para emulador ou aparelho
eas device:create                                     # cadastra iPhones de teste
eas build --profile development-device --platform ios

# opção B: build local (gera ios/ e android/ temporários)
npx expo run:ios
npx expo run:android

# depois de instalado o dev build, o dia a dia é só:
npx expo start --dev-client
Coloque ios/ e android/ no .gitignore para manter o CNG. Um novo dev build só é necessário quando entra uma dependência nativa ou muda o app.config.ts.
10. Embarcar o banner
1. pnpm --filter banner build gera o index.html único; um script do Turbo copia para apps/mobile/assets/banner/banner.html.
2. No metro.config.js, adicione html em resolver.assetExts.
3. O BannerView carrega o arquivo com expo-asset, lê o conteúdo com expo-file-system e passa ao WebView como source={{ html }}.
11. Lint, testes e Sentry no app
npx expo lint                       # cria o eslint.config.js com eslint-config-expo
npx expo-doctor                     # confere a compatibilidade das dependências
npx @sentry/wizard@latest -i reactNative
No package.json do app: "jest": { "preset": "jest-expo" } e os scripts lint, typecheck (tsc --noEmit) e test, que o Turbo chama a partir da raiz.
12. Publicar nas lojas
eas build --profile production --platform all
eas submit --platform ios       # envia para o App Store Connect / TestFlight
eas submit --platform android   # envia para a trilha interna do Play Console
eas update --channel production --message "correção X"   # OTA de JS e do banner
Antes da primeira submissão:
[ ] Criar o app no App Store Connect e no Play Console com o bundle id e o package definitivos.
[ ] Publicar a URL da Política de Privacidade e dos Termos de Uso.
[ ] Preencher App Privacy (Apple) e Segurança dos dados (Google).
[ ] Confirmar que a exclusão de conta funciona dentro do app (RF-08).
[ ] No Android, se o Play Console exigir, fazer o primeiro upload do .aab manualmente.
Telas previstas na especificação e ausentes do Figma
Pelo registro em FIGMA-INTERA.md (ainda não conferido no arquivo): Conquistas (RF-32), modal de conquista (RF-33, pode partir do Level Up Modal), Minha história (RF-29), Categorias (RF-23), Configurações (RF-38: cor tema, conta, notificações, sobre), aceite de Termos no cadastro (03) e Créditos LPC. Também não há tela de excluir conta (RF-08): a exclusão não terá tela dedicada: será uma linha “Excluir conta” em Configurações › Conta, com diálogo de confirmação.
Fora do escopo e decisões em aberto
Fora da v1
• Fase 2: botões + e − nos hábitos, camada social (feed, seguir, compartilhar), compartilhamento externo, loja e equipamentos, habilidades, evolução da decoração do QG por nível, toque no banner para customizar o QG, animações de celebração e de recuo do personagem, push remoto.
• Backlog: escolhas narrativas e escolha do mapa a seguir (RF-31), HP e penalidades, caixa de diálogo de NPC, animação de tropeço, troca de pontos por recompensas reais, tema claro, painel administrativo de conteúdo.
Decisões em aberto
[x] Nome Next Journey; bundle id br.com.wetechhub.app (dev: .app.dev), decidido em 2026-10-02.
[ ] Validar os valores de game_config: EXP por dificuldade, curva de nível e checks por capítulo.
[x] Sem limite de checks por hábito: decidido em 2026-10-02.
[ ] Capítulos por história na v1 (5 sugeridos): são 25 textos e 25 cenários no total; dá para reaproveitar biomas entre capítulos da mesma história.
[x] Escolhas narrativas (RF-31): fora da v1, no backlog (2026-10-02). Na v1 a cena do banner só muda conforme o capítulo avança.
[x] Hospedagem: VPS própria, em Docker, com Postgres próprio (decidido em 2026-10-02). Provedor de e-mail: Resend.
[x] Monorepo único: decidido em 2026-10-02.
[ ] Confirmar as regras complementares propostas acima.