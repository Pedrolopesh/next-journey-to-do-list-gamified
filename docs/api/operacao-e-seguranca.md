# Operação e segurança da API

Código em `apps/api/src/common`, `config`, `modules/security`, `app.module.ts` e `setup-app.ts`. Checklist por PR e auditorias: [`docs/SEGURANCA.md`](../SEGURANCA.md).

## Guard global (`JwtAuthGuard`)

Toda rota nasce **protegida**; `@Public()` marca a exceção. O guard valida o JWT de acesso (algoritmo fixo HS256) e confere que a conta ainda existe (busca por chave primária, sem cache), então conta excluída perde o acesso na hora, sem esperar os 15 minutos do token.

- O id do usuário e o da sessão são UUIDs: qualquer outra coisa nem chega ao banco.
- Com `sid`, a sessão precisa continuar ativa: encerrar um aparelho (ou trocar a senha, ou sair) derruba o token de acesso na hora, na mesma consulta. Token antigo sem `sid` só confere a conta.
- Erro de banco no guard **não vira 401**: nega com 5xx, porque uma falha temporária não pode deslogar o app, que trata 401 como sessão encerrada.

## Erros e validação

- Toda resposta de erro tem o formato `{ code, message, requestId }`. Erro de regra de negócio (`AppError`) tem código estável: o app escolhe a mensagem pelo `code`. **5xx nunca vaza detalhes**; o erro inesperado é registrado com a stack, sem o corpo da requisição.
- A entrada é validada com o schema Zod do contrato; o erro nunca devolve o valor recebido (senhas).

## Logs

- Pino, um `requestId` por requisição: usa o `x-request-id` recebido, se for válido, ou gera um UUID, e o devolve no cabeçalho.
- Só **metadados** (id, método, URL sem query, status): o corpo da requisição nunca é logado.
- Defesa em profundidade: mesmo que algo seja logado por engano, `authorization`, `cookie`, `password`, `token`, `refreshToken`, `accessToken` e `idToken` são censurados.
- O destinatário de e-mail nunca é logado; o texto (com código ou link) só vai para o log com `NODE_ENV=development` e sem `RESEND_API_KEY`, onde nenhum e-mail sai; nos outros ambientes sem chave só sai o aviso de que o e-mail não foi enviado.

## Eventos de segurança

`SecurityEvents` grava uma linha estruturada por evento (campo `security`), conta por tipo em janela deslizante e alerta quando passa do limite. Os eventos têm nome fixo e **nunca** carregam e-mail, senha, token nem corpo de requisição; o IP vai mascarado (IPv4 perde o último número, IPv6 fica com os dois primeiros grupos).

| Evento | Alerta quando passa de | Janela |
|---|---|---|
| `login_failed` | 30 | 5 min |
| `rate_limited` | 100 | 5 min |
| `refresh_reuse_detected` | 5 | 10 min |
| `reauth_failed` | 10 | 10 min |
| `password_reset_requested` | 30 | 10 min |

O alerta sai no log em nível `error` com `alert: true` (uma vez por janela) e, se `SECURITY_ALERT_WEBHOOK_URL` estiver definido, num POST com texto curto (tipo, quantidade, janela), sem dado pessoal. Falha do webhook não afeta a API. A contagem é **por instância**.

## Camada HTTP

- Throttler por IP por minuto: geral (`THROTTLE_LIMIT`, 120) e, só nas rotas de autenticação, um mais rígido (`THROTTLE_AUTH_LIMIT`, 10).
- `helmet` ligado. A página do Swagger usa scripts inline, então a CSP só relaxa quando ele está ligado.
- CORS com lista explícita (`CORS_ORIGINS`); sem lista, nenhuma origem web é aceita (o app nativo não precisa).
- Atrás de proxy reverso, `TRUST_PROXY=true` faz a API confiar no primeiro salto, para o limite enxergar o IP real.
- Versionamento `/v1`; o health fica na raiz e é público, sem dado sensível.

## Variáveis de ambiente

A API **não sobe** se faltar ou estiver inválida alguma obrigatória, e a mensagem de erro lista só os **nomes**, nunca os valores. Modelo comentado: `apps/api/.env.example`. Opcional deixada vazia (`CHAVE=`) vale como ausente.

| Variável | Para que serve | Padrão |
|---|---|---|
| `DATABASE_URL`, `JWT_ACCESS_SECRET` (32+ caracteres) | obrigatórias | (nenhum) |
| `NODE_ENV`, `HOST`, `PORT`, `LOG_LEVEL` | execução | `development`, `127.0.0.1`, `3000`, `info` |
| `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_KEY_ID` | emissor, audiência e `kid` da chave atual | `nextjourney-api`, `nextjourney-app`, `k1` |
| `JWT_ACCESS_SECRET_PREVIOUS`, `JWT_PREVIOUS_KEY_ID` | chave anterior, válida até o fim do token na troca do segredo | vazio |
| `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS` | validade dos tokens | 900, 30 |
| `RESEND_API_KEY`, `MAIL_FROM` | e-mail transacional; sem chave nada é enviado (desenvolvimento) | vazio |
| `PASSWORD_RESET_URL`, `PASSWORD_RESET_TTL_MINUTES` | deep link e validade do link de nova senha | `nextjourney://reset-password`, 30 |
| `GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_ID` | ids públicos do login social; vazio = recurso indisponível | vazio |
| `CORS_ORIGINS`, `TRUST_PROXY` | camada HTTP | vazio, `false` |
| `THROTTLE_LIMIT`, `THROTTLE_AUTH_LIMIT` | requisições por minuto por IP | 120, 10 |
| `AUTH_MIN_RESPONSE_MS` | piso de tempo das rotas anti-enumeração (0 só fora de produção, teto de 5000) | 250 |
| `ACCOUNT_PURGE_DAYS` | dias até a remoção definitiva de uma conta excluída | 30 |
| `SECURITY_ALERT_WEBHOOK_URL` | aviso opcional de contagem anormal (https) | vazio |
| `SEED_STARTER_ITEMS` | cria os itens de exemplo quando a conta passa a valer | `true` |
