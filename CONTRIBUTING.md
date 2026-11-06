# Contribuindo com o Next Journey

Leia este arquivo antes de qualquer alteração: stack, regras e checklists. Visão geral em `docs/COMO-FUNCIONA.md`; como rodar, no `README.md`.

## Projeto

To-do list gamificado (diários, tarefas e hábitos rendem EXP e moedas e fazem um personagem LPC avançar por uma história). Monorepo **pnpm + Turborepo**, pacotes no escopo `@nextjourney/*`.

- `apps/api`: NestJS 11 + Prisma + PostgreSQL
- `apps/banner`: camada de jogo em Vite + TypeScript, roda num WebView (Mapa em CSS, QG em canvas)
- `apps/mobile`: React Native + Expo, Expo Router
- `packages/contracts`: schemas Zod compartilhados (API, app, banner)
- `packages/tsconfig`, `packages/eslint-config`: configuração compartilhada

Testes e regressão (camadas, Maestro para a interface do app): `docs/TESTES.md`. Docs: `docs/CENARIOS.md` (regras de construção e checagem dos cenários do banner; leia antes de criar ou mexer em cenário), `docs/COMO-FUNCIONA.md`, `docs/TURBOREPO.md`, `docs/REQUISITOS.MD` (especificação), `docs/SEGURANCA.md`.

## Stack (FATO, não alterar sem confirmar)

- Node 24 (`.nvmrc`), **pnpm 11.28.3** (campo `packageManager`), Turborepo 2.x, TypeScript **~5.9** (a 7.x quebra o `typescript-eslint`)
- ESLint 9 (flat config), Prettier, Husky, lint-staged, commitlint
- **NUNCA** usar `npm` ou `yarn` neste repo, só `pnpm`
- Decisões nos ADRs em `docs/adr/`

## Comandos

- `pnpm install`
- `pnpm run build | lint | typecheck | test | dev` (todos via Turbo)
- `pnpm --filter @nextjourney/<pacote> <script>`: um pacote só
- `pnpm run security`: varredura rápida de dados sensíveis e `pnpm audit`; `pnpm run security:full`: varredura completa com o histórico inteiro (obrigatória antes de todo PR)

### O que a CI verifica em todo PR

`pnpm install --frozen-lockfile` → commits do PR (commitlint) → `turbo run lint typecheck test build` → e2e da API → OpenSpec alterado → duplicação (`jscpd`) → `scripts/security-scan.sh`; mais o job `descricao` (título e seções do PR). Rode tudo localmente com `pnpm run verify`.

## Arquitetura (alvo)

- App ↔ API: REST `/v1` (JWT 15 min + refresh rotativo). App ↔ banner: `postMessage` `{ v: 1, type, payload }`, validado com Zod dos dois lados. O banner nunca acessa a API.
- O **servidor decide a progressão**. Toda regra de EXP, moedas, nível, sequência, capítulo e conquistas mora só em `apps/api/src/modules/progression/domain`, como função pura com teste. O app não calcula EXP.
- Contratos entre projetos só em `packages/contracts`. Nunca duplicar tipos.

## OpenSpec (mudanças com spec)

Mudança que altere comportamento, contrato da API, protocolo do banner ou regra de jogo passa por OpenSpec antes de virar código: `/opsx:propose` (proposal, design, specs, tasks), `/opsx:apply` (implementar as tasks), `/opsx:archive` (arquivar e sincronizar as specs). Specs vivas em `openspec/specs/`, mudanças em `openspec/changes/`. O `openspec/config.yaml` é curto de propósito: a fonte de verdade é este arquivo. Correção pequena e mudança só de documentação não precisam de proposta.

## Regras de implementação (OBRIGATÓRIAS)

1. **Reuso antes de criar.** Procure em `packages/` e nos módulos existentes antes de criar algo novo.
2. **Nunca devolva o model do Prisma inteiro.** `select` explícito ou DTO de saída: allowlist, não denylist.
3. **Toda rota nasce protegida.** Guard mais restritivo que serve, no nível do controller; autenticação não é autorização.
4. **Contrato explícito.** Entrada e saída validadas com Zod (`packages/contracts`); nunca repassar o corpo cru para o Prisma. Mudou contrato? Está no mesmo PR e na spec.
5. **Banco.** `$queryRaw` só com parâmetro vinculado. Migration nova, nunca editar migration aplicada. Índice em toda coluna de filtro ou ordenação.
6. **Textos de interface só via i18n** (`pt-BR.json`). Cores e tamanhos só pelos tokens do design system.
7. **Logs sem dados sensíveis:** nunca e-mail, senha, token ou corpo de requisição.
8. **Datas** em UTC no banco; "dia" do usuário no fuso do perfil; registro em ISO 8601.
9. **Teste novo para regra nova.** Mudança de regra de jogo começa por um teste.
10. **Nenhuma ação deixa o usuário no escuro (RN-FB).** Toda ação do usuário no app mostra carregando e termina em toast de sucesso ou de erro; validação reprovada nunca deixa o botão "sem fazer nada". Use `useAction` e `toast` (`apps/mobile/src/features/feedback`). Detalhes em `docs/REQUISITOS.MD` (seção 3) e portão de loja em `docs/QA.md` (seção 7).
11. **Código em inglês.** Nome de variável, função, tipo, arquivo novo, comentário e nome de teste em inglês. Ficam em português só o texto que a pessoa usuária vê (`pt-BR.json`) e o conteúdo do produto (títulos de itens de exemplo, nomes de categoria, cenários). A regra vale para o que você escreve, mesmo dentro de um arquivo antigo em português: identificador e comentário novos em inglês, sem renomear o que já existe (isso é um trabalho à parte, por área). Nomes públicos já estabelecidos (rotas, colunas, chaves de contrato) não mudam por causa desta regra.
12. **Comentário só quando o código não diz sozinho.** Comente o porquê que não é óbvio (restrição, decisão, contorno, motivo de segurança), nunca o que a linha faz; sem código comentado, sem histórico de mudança ("antes fazia X") e sem TODO solto: pendência vira uma issue no GitHub. Explicação longa, decisão de design ou regra de negócio vai para a documentação (`docs/`, `design.md` do OpenSpec) com um link curto no código. Revise os comentários do diff antes de abrir o PR: apague o que repete o código ou envelheceu e mova para a documentação o que merece ficar.

## Checklist de segurança (verificar a CADA PR)

Resumo; a versão completa e o histórico de auditorias estão em `docs/SEGURANCA.md`. O PR template repete estes itens; cada um precisa estar marcado ou confirmado numa frase curta na seção "Security".

### Sempre

- **Este repositório é público de propósito.** Assuma que o atacante lê todo o código; nada do que for commitado pode ser apagado depois. Nunca commitar dados de infraestrutura real (IP, host, porta, inventário) nem achados de auditoria.

- **Segredos:** nada de token, senha, chave, `.env`, certificado ou IP/host de infraestrutura em código, docs, testes, commit ou PR. `pnpm run security` precisa passar.
- **Exposição excessiva:** nunca devolver o model do ORM inteiro.
- **IDOR/BOLA:** receber `id` do cliente exige validar que o solicitante pode acessar **aquele objeto**.
- **Autorização ≠ autenticação.**
- **Segredo em log ou erro:** tokens, senhas, e-mails completos e stack traces não vão para log nem resposta.
- **Falha aberta:** em erro, negar. Nunca `catch` que autoriza.

### API (NestJS)

- Mass assignment (campos como `role`, `isBlocked` jamais vêm do cliente), SQL injection (`$queryRaw`), SSRF, path traversal.
- JWT: validar `exp`, algoritmo fixo, segredo forte fora do código. Refresh token rotativo; reuso revoga a família.
- Enumeração de contas: login, esqueci a senha e cadastro respondem igual para e-mail existente e inexistente; com rate limit.
- Comparação de segredo em tempo constante (`crypto.timingSafeEqual`).
- ReDoS, race condition (transação ou constraint única), CORS com allowlist (nunca refletir `Origin` com credenciais), helmet ligado.
- Idempotência do check (`checkId`): repetir não pode duplicar EXP.

### App (Expo/React Native) e banner (WebView)

- **Feedback de toda ação (RN-FB):** botão com `loading`, toast de sucesso/erro e mensagem de campo em validação reprovada. Tela estática depois de um toque é defeito.
- Tokens só no SecureStore; nada sensível no AsyncStorage, em log, em URL ou em query string.
- WebView: `originWhitelist` restrito, só HTML local embutido, sem carregar URL externa; toda mensagem do banner validada com Zod e descartada se inválida.
- O banner não faz requisição de rede e não guarda estado.
- Deep links e `scheme`: validar parâmetros; sem open redirect.
- Segredos de build (EAS) só no gerenciador de segredos; `EXPO_PUBLIC_*` é público, nunca colocar segredo nele.
- Validação no cliente é UX; a regra existe no backend também.

### Dependências

- Conferir o nome exato do pacote (typosquatting) antes de instalar; lockfile versionado junto.
- `pnpm audit` limpo para severidade alta ou crítica.
- Ação nova no GitHub Actions: fixar versão e preferir ações oficiais.

## Antes de abrir um PR (OBRIGATÓRIO)

### 1. Revisão

- Trabalhe numa branch e abra o PR só depois de rever o próprio diff: o que mudou e por quê, a lista de arquivos e o resultado de `lint`, `typecheck`, `test` e `build`.
- Mudou algo depois da revisão? Revise de novo.

### 2. Verificação completa de chaves, tokens e segredos

Rode `pnpm run security:full` e só prossiga com `OK`. Ele cobre: padrões de segredo em todos os arquivos versionados e novos; arquivos sensíveis (`.env`, `.pem`, keystores, chaves SSH); endereços IP; o **histórico inteiro** de todas as branches; arquivos ignorados que parecem sensíveis; autoria e mensagens dos commits (sem co-autoria nem rodapés gerados por ferramentas); e `pnpm audit`.

Além do script, confira à mão:

- `git status --ignored` e `git diff --cached`: nenhum arquivo inesperado entra (`.env`, dumps, logs, capturas de tela com dados, arquivos de pessoa ou de servidor).
- A descrição do PR e as mensagens de commit: sem token, IP, host, caminho de servidor ou achado de auditoria.
- Docs e testes novos: sem credenciais "de exemplo" que pareçam reais; exemplos usam valores obviamente falsos (`<token>`, `exemplo.com`).
- Dependência nova: nome exato conferido, lockfile junto, `pnpm audit` limpo.

Se achar um segredo (mesmo antigo), **pare**: não faça push, avise quem mantém o projeto, revogue o segredo e só então remova do código e, se já foi commitado, do histórico.

## Higiene de repositório público (OBRIGATÓRIO)

Este repositório é aberto: quem clona vê tudo, e o que entra no Git não sai mais. Estas regras valem para pessoas e para qualquer ferramenta de IA que escreva código aqui. `scripts/check-hygiene.sh` (parte de `pnpm run security`, do `verify` e da CI) confere as cinco primeiras; as demais são de revisão.

1. **Notas, diário, plano pessoal e regras locais ficam em `internal/`** (ignorada pelo Git), junto de `AGENTS.md`, `CLAUDE.md` e `.claude/` locais. Nunca versione `internal/`, `HANDOFF*`, `DIARIO*`, `RESUMO-DA-SESSAO*` nem `docs/gestao/`.
2. **Sem menção a ferramenta, anotação pessoal ou documento fora do Git** em código, docs, comentários ou PR (editores de nota, assistentes de IA, atalhos do ambiente de alguém). Se a informação importa a quem contribui, escreva-a na documentação do repositório, em linguagem neutra.
3. **Sem motivação pessoal nem de público-alvo.** Commit, comentário e descrição de PR dizem o que muda e o motivo técnico; não citam quem vai ler ou avaliar o repositório (liderança, banca, cliente), opinião ou decisão pessoal. A CI confere o título e a descrição do PR.
4. **Sem `TODO` nem `FIXME` em comentário.** Pendência vira issue ou entra em "Risks and pending items" do PR.
5. **Sem co-autoria, rodapé gerado por ferramenta nem URL de sessão** em commit ou PR (a CI barra).
6. **Nunca use `git add -A`, `git add .` nem `git commit -a` às cegas.** Adicione os arquivos pelo nome e confira `git status` e `git diff --cached --stat` antes de cada commit; um arquivo local que ainda não está no `.gitignore` entra sem aviso.
7. **Documentação acompanha o código.** Mudou comportamento, comando, variável de ambiente ou fluxo? Atualize no mesmo PR o `README.md` e o `docs/COMO-FUNCIONA.md` (e o que mais descrever aquilo). Doc que contradiz o código é defeito.
8. **Workflow novo ou alterado do GitHub Actions:** ações fixadas por SHA, `permissions` mínimas declaradas no topo e nenhum segredo em `run:` sem passar por `env:`.
9. **Imagem de contêiner:** a base roda `apt-get upgrade` (ou equivalente) para fechar CVEs do sistema; o Trivy da entrega falha em HIGH ou CRITICAL com correção disponível.
10. **Dependência:** nome exato conferido, lockfile junto, `pnpm audit` limpo e nenhuma licença incompatível com a MIT do projeto. Atualização em lote (Dependabot) só entra depois de `pnpm run verify` e de abrir o app.
11. **Licença e créditos:** arte, fonte ou som de terceiros entra com a licença anotada em `CREDITS.md` no mesmo PR.
12. **Tela nova ou alterada:** botão de voltar do Android (e o gesto) se comporta como o do iOS, todo título tem papel de cabeçalho para leitor de tela, e o nome das rotas não se repete à mão em dois lugares.
13. **OpenSpec:** mudança de comportamento tem proposta com `.openspec.yaml`, `proposal.md`, `tasks.md` e specs (ou `skip_specs: true` quando não houver spec); o `scripts/check-openspec.sh` confere.

## Processo de PR (OBRIGATÓRIO; detalhes em `docs/PROCESSO-DE-PR.md`)

1. **`pnpm run verify` verde** antes de abrir o PR: commits (commitlint), lint, tipos, testes, build, e2e da API, OpenSpec, duplicação (`jscpd`, limite 2%) e `security:full`. A CI repete os passos e ainda confere o título e a descrição do PR.
2. **Revisão de código da branch antes de abrir o PR.** Trate os achados; o que ficar pendente vai para uma issue e para a seção "Risks and pending items" do PR. Nunca suba dívida técnica ou de segurança sem registro.
3. **Título e descrição em inglês**, declarativos e curtos, no padrão do `.github/PULL_REQUEST_TEMPLATE.md`: seções `## What changes`, `## Why`, `## How it was verified`, `## Risks and pending items` e `## Security` (a CI confere). Título `tipo: assunto` em minúscula. Diga também o que não foi verificado. Sem rodapés de ferramenta nem URLs de sessão, no título, no corpo ou nos commits. Exemplo de título: `fix: build the contracts before the release smoke tests`.
4. **Reuso e duplicação:** procure antes de criar; trecho repetido vira função compartilhada. Revise a segurança de todas as frentes que o PR toca (API, app, banner, contratos, dependências).
5. **Merge por squash** com título `tipo: assunto (#N)` e corpo vazio, só com CI verde e aprovação de quem mantém o projeto.

## Não fazer

- Não adicionar corpo aos commits
- Não incluir co-autoria, rodapés gerados por ferramentas nem URLs de sessão em commit ou PR
- Não escrever título, descrição de PR (inclusive os títulos de seção) nem assunto de commit em português: tudo em inglês
- Não escrever nome de variável, de função, de tipo nem comentário novo em português
- Não deixar comentário que repete o código, código comentado ou histórico de mudança no diff

## Safety

- NUNCA commitar `.env` com valores reais; só `.env.example`.
- NUNCA push direto em `main` — sempre branch + PR, com revisão e a varredura completa (seção acima).
- NUNCA editar migrations já aplicadas.
- Sempre `git pull origin main` antes de começar.
- **Convenção de branch:** `<tipo>/<slug-em-kebab-case>`. Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`.
- **Commits:** Conventional Commits. O assunto começa em minúscula (o commitlint rejeita maiúscula inicial). Uma mudança por PR (o commit não tem corpo).
