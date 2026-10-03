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

## 2. O que NUNCA vai para este repositório

O repositório pode ser público ou ser visto por terceiros (colaboradores, forks, histórico). Por isso ficam **fora** dele, no Obsidian ou no gerenciador de segredos:
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
| Visibilidade do repositório no GitHub | **Público** (o plano prevê privado) |

Achado: documentos da fase de planejamento citavam dados da infraestrutura real. Foram removidos e o histórico do Git foi reescrito (ver ações abaixo).

Ações:
1. Tornar o repositório privado (Fase 0, passo 5 do plano).
2. Corrigir o problema na infraestrutura, que é o que de fato elimina o risco. Detalhes e checklist ficam no Obsidian.
3. Decidir se o histórico será reescrito (força push). Reescrever limpa a `main`, mas não apaga forks, caches nem clones que já existam.
4. Passar a rodar `pnpm run security` no CI (feito neste PR).

Observação sobre ferramentas: o `.npmrc` do usuário contém token do npm. Ele não está no repositório, mas apareceu em saída de terminal durante a sessão de 2026-10-02; recomendou-se revogar e gerar outro.

## 4. Próximas auditorias (checklist)

- [ ] Fase 4: revisão de auth (argon2, JWT, refresh com rotação, rate limit, enumeração de contas) antes do primeiro deploy.
- [ ] Fase 4: revisão dos DTOs de saída (nenhum model do Prisma inteiro) e dos guards de cada rota.
- [ ] Fase 7: helmet, CORS com allowlist, throttler, `pnpm audit` no CI, revisão de logs.
- [ ] Fase 7: teste de exclusão de conta e de restauração de backup.
- [ ] Antes de cada submissão às lojas: revisão de permissões, `EXPO_PUBLIC_*`, deep links e WebView.
- [ ] Adicionar um scanner dedicado de segredos (gitleaks) ao CI quando o repositório tiver mais código.
