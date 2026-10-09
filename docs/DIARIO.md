# Diário do projeto

Uma entrada por dia, a mais recente no topo. Datas em ISO 8601.

## 2026-10-09 (Fase 5)

- Feito: Fase 5. API: histórias por usuário (progresso preservado ao trocar), personagem com cosméticos, categorias, CRUD de itens com exclusão lógica, conquistas na transação do check, Home agregada, PATCH /me, esqueci a senha e login Google/Apple (ID token validado no servidor). App: onboarding, personagem com prévia, escolha de história, Home, Diários, Tarefas por categoria, Hábitos, desfazer, fila de modais (nível, conquista, capítulo), Minha história, Conquistas, Perfil, Configurações, categorias, recuperação de senha e estados de lista. 68 e2e, 74 unitários da API, 19 do app e 6 de componente.
- Decisões: ADR-0009. Seed versionado de 5 histórias (textos provisórios) e 10 conquistas.
- Bloqueios: client ids do Google e da Apple (Fase 0) e API hospedada; passos 16 e 17 da Fase 2.
- Próximo: Fase 6 (conteúdo) e Fase 7 (endurecimento).

## 2026-10-09 (Fase 4)

- Feito: Fase 4, passos 2 a 14. Postgres local no Docker (só em loopback), Prisma 7 e migration, API com ambiente tipado, logs com `requestId` e redact, erros padronizados, health, Swagger, auth (argon2id, JWT, refresh rotativo com detecção de reuso), itens, check idempotente em transação e desfazer. 27 testes e2e. No app: cliente HTTP com refresh em fila, sessão no SecureStore, login, cadastro, tela de Diários com check otimista e banner reagindo, perfil com logout.
- Decisões: ADR-0008 (autenticação e sessão). `generate` do Prisma como tarefa do Turbo. Overrides para as vulnerabilidades altas do CLI do Prisma.
- Bloqueios: teste contra a API hospedada (VPS ainda não auditada); passos 16 e 17 da Fase 2.
- Próximo: Fase 5 (loop completo): login social, onboarding, personagem, histórias, CRUD de itens e demais telas.

## 2026-10-09 (Fase 3)

- Feito: Fase 3, passos 1 a 12. Esqueleto da API NestJS (Fase 4, passo 1, antecipado para destravar), schemas Zod compartilhados (auth, item, check, jogo, personagem, história, erro) e as regras de progressão como funções puras (`aplicarCheck`, `desfazerCheck`, `expParaNivel`, `checksParaCapitulo`, `estaAtrasado`, `calcularStreak`, `diaLocal`) com 51 testes e 100% de cobertura. AGENTS.md da API e dos contratos.
- Decisões: Fase 3 iniciada antes do ADR-003, por decisão do Pedro (risco baixo). NestJS 12 em ESM com Vitest (ADR-0007). Regras de jogo ambíguas implementadas como propostas (ADR-0004, aguardando confirmação).
- Bloqueios: confirmação das regras complementares; passos 16 e 17 da Fase 2 (medição do banner) ainda pendentes.
- Próximo: Fase 4 (primeira fatia ponta a ponta): Postgres e Prisma, auth por e-mail e senha, `POST /v1/items/:id/checks`.

## 2026-10-09

- Feito: Fase 2, passos 1 a 15. App Expo com rotas base e development build rodando no emulador Android; banner em Vite com a cena em CSS (placeholders); protocolo de mensagens em `packages/contracts` (Zod, com testes); o banner responde `READY` e `INIT`, e o build copia o HTML para o app; `BannerView` com WebView nas 5 abas e botões de simulação. Validado no emulador pelo Pedro.
- Decisões: vulnerabilidades altas do Expo aceitas de forma documentada (revisão em 2026-11-03); `lint` passa a depender do build das dependências no Turbo.
- Bloqueios: passos 16 e 17 (medição de desempenho e ADR-003) adiados; precisam de Android intermediário real e iPhone e **devem ser validados antes de concluir todas as implementações**. Conta/time de desenvolvimento da Apple pendente (Fase 0).
- Próximo: refinar o idle do banner (futuro); seguir o plano para a Fase 3 (regras de progressão) mantendo o gate do spike em aberto.

## 2026-10-03

- Feito: Fase 1, passos 8 a 14. ESLint, Prettier, Husky, lint-staged e commitlint; AGENTS.md, CI, README e LICENSE; template de PR, OpenSpec e política de segurança; varredura de segredos; proteção da `main`. Documentos do plano e da especificação reorganizados para leitura. ADRs 0001, 0002, 0005 e 0006 e registro de conclusão da Fase 1.
- Decisões: ADR-0005 (versões de pnpm, TypeScript e ESLint) e ADR-0006 (repositório público e segurança) aceitas.
- Bloqueios: licença do projeto ainda sem escolha; auditoria de segurança da hospedagem em andamento fora do repositório.
- Próximo: Fase 2 (app Expo + banner em CSS no WebView, com medição de desempenho) e, em paralelo, Fase 0 (contas das lojas).

## 2026-10-02

- Feito: Fase 1, passos 1 a 7 (Node e pnpm fixados, workspace, Turborepo, pacotes tsconfig, eslint-config e contracts). Decisões de arquitetura e de produto registradas no plano e na especificação.
- Decisões: nome Next Journey; bundle id `br.com.wetechhub.app`; regras de progressão só no back-end; banner em CSS; hospedagem em VPS própria; e-mail com Resend; escolhas narrativas no backlog; sem limite de checks por hábito.
- Bloqueios: nenhum.
- Próximo: Fase 1, passos 8 a 10.
