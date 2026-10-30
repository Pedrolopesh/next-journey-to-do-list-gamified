# Conta e privacidade na API

Código em `apps/api/src/modules/account`. Dados coletados, direitos e prazos: [`docs/PRIVACIDADE.md`](../PRIVACIDADE.md). Aqui está o mecanismo.

## Exclusão de conta (`DELETE /v1/me`)

1. **Segunda prova** antes de apagar: a senha atual (conta com senha) ou um ID token novo do provedor, de uma identidade ligada à conta (conta só social). O ID token precisa ter sido emitido há no máximo 5 minutos (a dona está presente agora); sem `iat` o token é recusado. Cada tentativa conta (5 a cada 15 minutos). Qualquer falha dá o mesmo `403 REAUTH_FAILED`, nunca `401`, para o app não tratar como sessão encerrada.
2. **Anonimiza na hora:** remove tudo que identifica a pessoa e encerra as sessões. O e-mail original é liberado (a pessoa pode se cadastrar de novo); o restante dos dados some na purga.
3. **Purga diária** (03:00): apaga de vez, em cascata nas tabelas filhas, as contas excluídas há mais de `ACCOUNT_PURGE_DAYS` (30 por padrão) e também os cadastros por senha que nunca confirmaram o e-mail há mais de 7 dias (os códigos saem em cascata).

## Exportação dos dados (`GET /v1/me/export`)

Direito de acesso (LGPD). Cada tabela entra por uma **lista de campos permitidos** (`select` explícito): nunca o model inteiro e nunca hash de senha, token, código ou id no provedor. Tudo filtra pelo `userId` do token. Limite de 3 exportações por hora por conta.
