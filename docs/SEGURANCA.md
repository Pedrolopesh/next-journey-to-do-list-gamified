# Segurança — checklist por PR e auditorias

Todo PR passa por este checklist. Ele está repetido no `.github/PULL_REQUEST_TEMPLATE.md` (marcado pelo autor) e o resumo por camada está no `AGENTS.md`. A parte automática é `pnpm run security`, que o CI também roda.

## 1. O que verificar a cada PR

**Automático (`pnpm run security`, script `scripts/security-scan.sh`)**
- Padrões de segredo nos arquivos versionados: tokens (npm, GitHub, AWS, Slack, Google), chaves privadas, JWT, `password`/`secret`/`token`/`api_key` atribuídos a texto.
- Arquivos sensíveis versionados: `.env*` (exceto `.env.example`), `.pem`, `.p12`, keystores, chaves SSH, credenciais.
- Endereços IP (fora `127.0.0.1`, `0.0.0.0`, `localhost`): infraestrutura não entra no repositório.
- Segredos nas linhas adicionadas pelos commits novos do PR.
- `pnpm audit --audit-level=high`.

**Manual (revisão do autor e do revisor)**
1. A descrição do PR, os commits, os docs e os testes não citam IP, host, porta aberta, usuário, nome de banco, caminho de servidor ou qualquer achado de auditoria da infraestrutura.
2. Rotas novas: guard no controller, `select` explícito ou DTO de saída, validação Zod de entrada, IDOR checado (o objeto pertence a quem pede).
3. Logs e erros sem e-mail, senha, token, corpo de requisição ou stack trace para o cliente.
4. App e banner: tokens só no SecureStore, WebView sem URL externa, mensagens do banner validadas com Zod, nada sensível em `EXPO_PUBLIC_*`.
5. Dependência nova: nome exato conferido, lockfile no mesmo PR, `pnpm audit` limpo.
6. Nenhuma atribuição a ferramentas de IA em commit ou descrição de PR.

## 2. Repositório público: premissas de segurança

O repositório é **público de propósito** (projeto aberto: qualquer pessoa pode ler, auditar e replicar o código). Isso exige um nível a mais de cuidado:

- **Assuma que o atacante lê todo o código.** A segurança vem do projeto (autorização, validação, rate limit, segredos fora do código), nunca de esconder como algo funciona.
- **Tudo o que é commitado é público para sempre**, inclusive em forks e clones. Apagar depois não resolve; por isso a prevenção (script, hooks, push protection) vem antes do commit.
- **Replicar o projeto não pode exigir segredos nossos:** só `.env.example` com valores de exemplo; cada pessoa gera os próprios segredos.
- **Infraestrutura real fica fora do repositório.** Documentos descrevem o desenho (ex.: "portas só em loopback"), nunca o ambiente real.
- Vulnerabilidade encontrada por terceiros é reportada em privado (ver `SECURITY.md`).

Por isso ficam **fora** do repositório, no Obsidian ou no gerenciador de segredos:
- Credenciais, tokens, chaves, certificados, `.env` reais.
- Endereço, inventário e achados de auditoria da VPS e de qualquer servidor.
- Resultados de varreduras de vulnerabilidade com detalhes que permitam exploração.

Um achado de segurança é registrado fora do repositório; aqui entra só a regra que evita que ele se repita.

## 3. Registro de auditorias

### 2026-10-03: varredura geral do repositório

Escopo: arquivos versionados e não versionados da árvore de trabalho, histórico de todas as branches, `pnpm audit`.

| Verificação | Resultado |
|---|---|
| Segredos em arquivos (padrões de token, chave privada, JWT, credenciais atribuídas) | Nada encontrado |
| Arquivos sensíveis versionados (`.env`, `.pem`, chaves, keystores) | Nenhum |
| Segredos no histórico (todas as branches) | Nada encontrado |
| `pnpm audit` | Nenhuma vulnerabilidade conhecida |
| Endereço de infraestrutura nos docs | **Encontrado e removido** (ver abaixo) |
| Visibilidade do repositório no GitHub | Público, de propósito (projeto aberto). Cuidados da seção 2 |

Achado: documentos da fase de planejamento citavam dados da infraestrutura real. Foram removidos e o histórico do Git foi reescrito (ver ações abaixo).

Ações (2026-10-03):
1. Problema na infraestrutura mitigado no mesmo dia e tarefa aberta no board para fechar na origem. Detalhes e checklist ficam fora do repositório.
2. Histórico do Git reescrito para remover essas informações dos commits e das mensagens; a `main` foi reescrita com push forçado. Commits antigos ainda podem ser acessíveis por SHA direto no GitHub (referências de PRs) até o GitHub coletar o lixo; foi solicitado, quando possível, o apagamento dessas referências ao suporte.
3. `pnpm run security` roda no CI a cada PR.
4. Ativados no GitHub: secret scanning, push protection e alertas do Dependabot; reporte privado de vulnerabilidades.


### 2026-10-12: revisão geral (código, dependências e documentação)

Escopo: API (guards, validação, logs, CORS, rate limit), app (armazenamento, WebView, logs), banner (sem rede), dependências, documentação e arquivos versionados.

| Verificação | Resultado |
|---|---|
| Rotas da API | Guard global de JWT com `@Public()` explícito nas rotas abertas (padrão seguro); throttler global com limite menor em `/auth` |
| Entrada e saída | Zod em toda rota; nada cru para o Prisma; `GET /me` devolve só campos explícitos; `character.look` só aceita chaves `[a-z0-9_-]{1,40}` |
| Logs | Pino só com metadados; corpo de requisição nunca logado; campos sensíveis redigidos; o app redige dados antes de logar |
| App | Tokens no SecureStore; preferência de cenário (não sensível) no AsyncStorage; WebView só com HTML local, `originWhitelist` restrito e sem DOM storage; mensagens do banner validadas com Zod |
| Banner | Sem rede e sem estado; chave desconhecida cai no padrão |
| Arquivos versionados e histórico | Sem `.env` real, chaves ou endereços de infraestrutura (`security:full`) |
| Dependências | `uuid`, `decode-uri-component` e `esbuild` atualizados por `overrides` (versão corrigida publicada); restam 1 moderada (`sprintf-js`, sem correção) e as 2 altas aceitas da seção 5 |

Mudanças desta revisão: cache de folhas do QG com limite (evita crescimento de memória no WebView), código morto removido, documentação alinhada ao estado real.

## 5. Riscos aceitos (vulnerabilidades sem correção)

Exceções ao `pnpm audit --audit-level=high` são **sempre documentadas**: ficam em `pnpm-workspace.yaml` (`auditConfig.ignoreGhsas`) com a justificativa, aparecem aqui e têm data de revisão. Vulnerabilidade nova, sem registro, continua barrando o CI.

| Data | Gravidade | Pacote (GHSA) | Origem | Motivo da aceitação | Revisar em |
|---|---|---|---|---|---|
| 2026-10-03 | Alta | `node-forge` (GHSA-86w9-cpqp-85rv) | CLI do Expo (certificados de assinatura) | Só ferramenta de desenvolvimento; sem versão corrigida; não vai para o app | 2026-11-03 |
| 2026-10-03 | Alta | `braces` (GHSA-vfj7-8cjw-p6xm) | Metro (empacotador) | Só ferramenta de desenvolvimento; sem versão corrigida; não vai para o app | 2026-11-03 |

A moderada que resta (`sprintf-js`, só em ferramenta de desenvolvimento do Expo) não bloqueia o CI e não tem versão corrigida; `uuid`, `decode-uri-component` e `esbuild` foram resolvidos por `overrides` em 2026-10-12.

## 6. Limitações conhecidas (a resolver)

| Tema | Situação | Quando |
|---|---|---|
| Cadastro revela se o e-mail já existe (`409 EMAIL_UNAVAILABLE`) | O e-mail transacional já existe (recuperação de senha), mas o cadastro ainda não exige verificação de e-mail. Login, refresh e "esqueci a senha" não vazam essa informação | Fase 7, com verificação de e-mail no cadastro |
| Rate limit | Feito: limite geral por IP e limite menor nas rotas de autenticação (`@nestjs/throttler`, ajustável por variável de ambiente). Limite por e-mail no login ainda não existe | Avaliar na Fase 7 |
| `helmet` e CORS com allowlist | Feitos (`apps/api/src/setup-app.ts`); sem lista de origens o CORS fica desligado | Concluído |
| HTTPS | Obrigatório em produção; o app em desenvolvimento usa HTTP para o emulador | Antes do primeiro deploy |

## 7. Próximas auditorias (checklist)

- [ ] Fase 4: revisão de auth (argon2, JWT, refresh com rotação, rate limit, enumeração de contas) antes do primeiro deploy.
- [ ] Fase 4: revisão dos DTOs de saída (nenhum model do Prisma inteiro) e dos guards de cada rota.
- [x] helmet, CORS com allowlist, throttler, `pnpm audit` no CI e redação de dados sensíveis nos logs (revisados em 2026-10-12).
- [ ] Fase 7: teste de exclusão de conta e de restauração de backup.
- [ ] Antes de cada submissão às lojas: revisão de permissões, `EXPO_PUBLIC_*`, deep links e WebView.
- [ ] Adicionar um scanner dedicado de segredos (gitleaks) ao CI quando o repositório tiver mais código.
