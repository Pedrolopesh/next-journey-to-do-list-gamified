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
| 2026-10-24 | Alta | `zod` 3.x (GHSA-mrhx-c7xc-m3w5) | CLI do Expo (cópia interna do zod 3) | Só ferramenta de desenvolvimento; a linha 3 não recebeu correção; o projeto usa zod 4 corrigido | 2026-11-03 |

A moderada que resta (`sprintf-js`, só em ferramenta de desenvolvimento do Expo) não bloqueia o CI e não tem versão corrigida; `uuid`, `decode-uri-component` e `esbuild` foram resolvidos por `overrides` em 2026-10-12.

## 6. Limitações conhecidas (a resolver)

| Tema | Situação | Quando |
|---|---|---|
| Cadastro e posse do e-mail | Feito: o cadastro por senha responde `202` igual para e-mail novo, pendente ou já confirmado e só dá sessão depois do código de 6 dígitos enviado ao e-mail (validade de 15 minutos, 5 tentativas, uso único, junto com a senha). Login social só cria ou vincula conta com e-mail verificado pelo provedor. Contas não confirmadas são apagadas em 7 dias (OpenSpec `verificacao-de-email-no-cadastro`) | Medir o tempo de resposta em produção e validar a entrega do e-mail antes da loja |
| Tempo de resposta igual | Feito: cadastro, reenvio do código e "esqueci a senha" têm um tempo mínimo de resposta (`AUTH_MIN_RESPONSE_MS`, padrão 250 ms, obrigatório em produção) e o e-mail sai em segundo plano, então o tempo não revela se a conta existe. É um piso: se o trabalho real passar dele (banco lento), a diferença volta a aparecer | Medir em produção e ajustar o piso |
| Rate limit | Feito: limite geral por IP e menor nas rotas de autenticação (`@nestjs/throttler`, em memória) e limite por e-mail guardado no banco (tabela com chaves em hash): login 5 senhas erradas por e-mail + IP e teto de 30 por e-mail em 15 min, "esqueci a senha" 3 em 15 min, cadastro e reenvio 5 por hora. O excesso responde 429 igual para conta existente ou não. O limite por IP continua em memória (reinicia no deploy) | Conferir `TRUST_PROXY` e o IP real em produção |
| Exclusão de conta | Feito: `DELETE /v1/me` exige a senha atual (conta com senha) ou um ID token novo do Google/Apple da identidade ligada (conta só social). Prova errada dá `403 REAUTH_FAILED` (nunca 401) e vale o limite de 5 tentativas em 15 min por conta. Não revoga o token do Sign in with Apple | Revogar o token da Apple na exclusão |
| Eventos de segurança | Feito: login falho, limite de tentativas, recuperação de senha pedida e concluída, reuso de refresh token, prova de exclusão recusada e conta excluída viram uma linha estruturada no log (`security`, id do usuário e IP mascarado; nunca e-mail, senha ou token). Passar do limite normal em uma janela gera um alerta no log (`alert: true`, nível `error`) e, se `SECURITY_ALERT_WEBHOOK_URL` estiver definido, um aviso por webhook sem dado pessoal. A contagem é por instância | Escolher onde guardar os logs e quem recebe o alerta |
| Sessões da conta | Feito: `GET /v1/me/sessions` lista os aparelhos com a conta aberta (nome, criada em, último uso, qual é o atual), `DELETE /v1/me/sessions/:id` encerra um e `DELETE /v1/me/sessions` encerra todos. Só da própria conta (id de outra pessoa dá 404). Encerrar derruba o refresh token na hora; o token de acesso vale até expirar (até 15 min) | - |
| `helmet` e CORS com allowlist | Feitos (`apps/api/src/setup-app.ts`); sem lista de origens o CORS fica desligado | Concluído |
| HTTPS | Obrigatório em produção; o app em desenvolvimento usa HTTP para o emulador | Antes do primeiro deploy |

## 7. Próximas auditorias (checklist)

- [ ] Fase 4: revisão de auth (argon2, JWT, refresh com rotação, rate limit, enumeração de contas) antes do primeiro deploy.
- [ ] Fase 4: revisão dos DTOs de saída (nenhum model do Prisma inteiro) e dos guards de cada rota.
- [x] helmet, CORS com allowlist, throttler, `pnpm audit` no CI e redação de dados sensíveis nos logs (revisados em 2026-10-12).
- [ ] Fase 7: teste de exclusão de conta e de restauração de backup.
- [ ] Antes de cada submissão às lojas: revisão de permissões, `EXPO_PUBLIC_*`, deep links e WebView.
- [ ] Adicionar um scanner dedicado de segredos (gitleaks) ao CI quando o repositório tiver mais código.

## 8. Troca do segredo do JWT (sem derrubar os logins)

O token de acesso leva emissor (`iss`), audiência (`aud`) e o identificador da chave (`kid`). A verificação aceita a chave atual e, durante a troca, a anterior. Os tokens de acesso duram 15 minutos, então a janela é curta. Procedimento, sem valores:

1. Gerar um segredo novo (mínimo de 32 caracteres) e guardar no gerenciador de segredos.
2. No ambiente da API: mover o segredo atual para `JWT_ACCESS_SECRET_PREVIOUS` e o `JWT_KEY_ID` atual para `JWT_PREVIOUS_KEY_ID`; colocar o segredo novo em `JWT_ACCESS_SECRET` e um `JWT_KEY_ID` novo (diferente do anterior).
3. Reiniciar a API. Os tokens emitidos com a chave anterior continuam valendo até expirar; os novos já saem com a chave nova.
4. Depois de pelo menos o tempo de vida do token (15 minutos), remover `JWT_ACCESS_SECRET_PREVIOUS` e `JWT_PREVIOUS_KEY_ID` e reiniciar de novo.
5. Se o segredo vazou: pule a espera, remova a chave anterior na hora (todos refazem o login por refresh) e revogue os refresh tokens se houver suspeita de uso indevido.

A troca de `JWT_ISSUER` ou `JWT_AUDIENCE` invalida todos os tokens em circulação; o app renova sozinho pelo refresh token.
