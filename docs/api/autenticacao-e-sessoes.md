# Autenticação e sessões

Código em `apps/api/src/modules/auth`. As decisões e os motivos estão no [ADR-0008](../adr/0008-autenticacao-e-sessao.md); aqui está o que cada parte faz.

## Cadastro e confirmação do e-mail

1. `POST /v1/auth/register` cria o usuário **pendente** (com as categorias padrão) e envia um código por e-mail. Responde sempre `202 { status: "verification_sent" }`, sem sessão, e **igual** para e-mail novo, pendente ou já confirmado (sem enumeração de contas).
   - Cadastro pendente repetido: o último vence; só quem confirma com o código e a senha ativa entra.
   - E-mail já confirmado: sai um aviso por e-mail, sem código.
2. O código tem 6 dígitos, vale 15 minutos e é de **uso único**. Só o hash (`sha256(userId:código)`) fica no banco. Cinco tentativas erradas invalidam o código. Senha errada na confirmação não gasta tentativas (quem só sabe o e-mail da vítima não consegue invalidar o código dela). Cada tentativa é reservada por um `UPDATE` condicional, então requisições paralelas não passam do limite de 5: não troque por ler e depois gravar. O reenvio respeita um intervalo mínimo de 60 segundos.
3. `POST /v1/auth/verify-email` (`{ email, code, password }`) confirma a conta e devolve a sessão. Numa **única transação**: marca o código como usado, grava `emailVerifiedAt` e cria os itens de exemplo. Se algo falhar, a conta segue pendente e o mesmo código segue válido. Toda falha responde igual e gasta o mesmo tempo (usa um hash fictício de senha).

## Login e senha

- `POST /v1/auth/login`: a tentativa é contada **antes** de conferir a senha, para tentativas paralelas também contarem. Responde igual (e com o mesmo custo) para e-mail inexistente e senha errada.
- "Esqueci a senha": responde sempre `202`, exista ou não o e-mail. O link carrega um segredo de uso único, válido por 30 minutos (`PASSWORD_RESET_TTL_MINUTES`); só o `sha256` dele fica no banco e só o link mais recente vale. O e-mail sai em segundo plano, para o tempo da resposta não depender do provedor.
- Trocar a senha com o link encerra todas as sessões abertas.

## Login social (Google e Apple)

- O app manda só o ID token; a API o valida **no servidor** (emissor, audiência, validade). Token inválido nunca detalha o motivo.
- Primeiro acesso: cria a conta e exige o aceite dos termos. A conta já nasce confirmada e recebe os itens de exemplo.
- Vincula à conta existente quando o e-mail verificado pelo provedor coincide. Se a conta por senha nunca confirmou o e-mail, quem a criou não provou ser dono dele: a conta é confirmada (e recebe os exemplos), a senha antiga some e as sessões e códigos abertos deixam de valer.
- Sem e-mail verificado pelo provedor, nunca cria nem vincula.

## Tokens

- **Acesso:** JWT curto (HS256, 900 s por padrão, `ACCESS_TOKEN_TTL_SECONDS`) com emissor e audiência fixos e o id da sessão (`sid`). O cabeçalho `kid` só escolhe qual chave tentar (a atual ou a anterior, durante a troca do segredo); a assinatura decide. Procedimento de troca: `docs/SEGURANCA.md`, seção 8.
- **Refresh:** `<id>.<segredo>` aleatório, 30 dias por padrão (`REFRESH_TOKEN_TTL_DAYS`); só o `sha256` do segredo fica no banco.
- **Rotação atômica:** a cada refresh o token é trocado. O `UPDATE` condicional (`revokedAt` nulo e ainda válido) deixa passar só **uma** de várias requisições simultâneas com o mesmo token; a que perde é tratada como **reuso** e revoga a família inteira (sinal de token roubado). Conflito de transação sob concorrência nega (falha fechada); outro erro (banco fora) segue como 5xx, para o app não tratar falha temporária como sessão encerrada.
- **Logout** revoga a família do refresh token informado; é silencioso se o token for inválido.

## Sessões (aparelhos)

Uma sessão é uma **família de refresh tokens**: a rotação troca o token e mantém a família, então a lista mostra um item por aparelho. O nome vem do cabeçalho `X-Device-Name` (codificado pelo app; a API decodifica, tira caracteres de controle, junta espaços e limita o tamanho; só vira texto na tela). Tudo filtra pelo dono: o id de outra pessoa é `404`. Encerrar uma sessão é seguro de repetir. Se for a atual, equivale a sair.

## Limite de tentativas

Além do limite por IP do Throttler (`THROTTLE_LIMIT` e `THROTTLE_AUTH_LIMIT`), cada rota de conta tem **dois níveis**, guardados no Postgres (valem entre instâncias e sobrevivem a deploy). O nível por e-mail + IP faz quem abusa travar só a si mesmo; o teto por e-mail, mais alto, protege contra ataque vindo de vários IPs sem deixar um desconhecido trancar a conta de outra pessoa com facilidade. A contagem só depende do e-mail digitado (exista a conta ou não), então o excesso responde igual (`429`). A chave é um hash: nenhum e-mail ou IP fica no banco.

| Rota | por e-mail + IP | por e-mail |
|---|---|---|
| login | 5 em 15 min | 30 em 15 min |
| esqueci a senha | 3 em 15 min | 10 em 1 h |
| cadastro | 5 em 1 h | 15 em 1 h |
| reenvio do código | 5 em 1 h | 15 em 1 h |
| confirmar e-mail | 10 em 15 min | 40 em 15 min |

Login correto zera os erros daquele e-mail + IP.

## Tempo de resposta e enumeração

As rotas que respondem igual para conta existente e inexistente têm um piso de tempo (`AUTH_MIN_RESPONSE_MS`, 250 ms por padrão; `0` só fora de produção): o trabalho a mais de um caso (gravar, enviar e-mail) some dentro do piso. Além disso, o hash de senha fictício gasta o mesmo tempo quando o e-mail não existe.

## Limpeza diária

Todo dia, às 03:30, remove o que só cresce: refresh tokens, links de redefinição e códigos de confirmação **expirados há mais de 7 dias** (um refresh token revogado ainda dentro da validade fica, porque é ele que denuncia o reuso de um token roubado) e os contadores do limite de tentativas com mais de 1 dia. Apaga em lotes e é idempotente, então duas instâncias juntas não atrapalham. No log só vão a classe e o código do erro.
