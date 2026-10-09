# ADR-0008: autenticação, tokens e sessão

- Data: 2026-10-09
- Status: aceita
- Fase do plano: Fase 4, passos 7 e 10

## Contexto

O app precisa manter o usuário logado com segurança, em um repositório público (o desenho precisa resistir a quem lê todo o código).

## Decisão

- **Senha:** argon2id. Login com e-mail inexistente gasta o mesmo tempo e devolve a mesma resposta que senha errada (sem enumeração).
- **Access token:** JWT HS256 de 15 minutos, algoritmo fixado na verificação (`alg: none` e troca de algoritmo são recusados). Segredo de pelo menos 32 caracteres, vindo do ambiente e validado ao subir.
- **Refresh token:** `<id>.<segredo>` aleatório; só o sha256 do segredo fica no banco, comparado em tempo constante. Validade de 30 dias.
- **Rotação com detecção de roubo:** cada refresh invalida o token usado e emite outro na mesma família. Reusar um token já usado **revoga a família inteira**.
- **No aparelho:** só o refresh token é guardado, no SecureStore (Keychain/Keystore). O access token fica só na memória. O usuário não é salvo: vem da resposta do refresh.
- **Cliente HTTP:** num 401 renova **uma vez** e refaz a chamada; requisições concorrentes compartilham a mesma renovação (fila). Se a renovação falha, a sessão acaba.
- **Toda rota nasce protegida** (guard global); só as marcadas `@Public()` são abertas.
- **Respostas validadas:** o app valida toda resposta da API com os schemas do contrato.

## Consequências

- Roubar o banco não dá sessões: só hashes de refresh token.
- Um refresh token roubado e usado pelo atacante derruba a sessão do dono também (e força novo login): comportamento intencional.
- O cadastro ainda revela se o e-mail existe (limitação registrada em `docs/SEGURANCA.md`).
- Falta rate limit (Fase 7) e login social (Fase 5).
