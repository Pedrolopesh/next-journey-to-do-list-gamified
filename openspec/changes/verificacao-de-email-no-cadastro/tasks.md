## 1. Contrato e banco

- [x] 1.1 Em `packages/contracts`: `registerResponseSchema`, `verifyEmailRequestSchema` (`email`, `code` de 6 dígitos, `password`), `resendVerificationRequestSchema`; códigos `EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_CODE`, `EMAIL_NOT_VERIFIED_BY_PROVIDER`; teste dos schemas
- [x] 1.2 Migration nova: `users.email_verified_at`, `users.verification_mail_sent_at`, tabela `email_verifications` (índice por `user_id`), backfill de contas sociais e sem senha; atualizar `schema.prisma`

## 2. API: cadastro, confirmação e login

- [x] 2.1 Serviço de verificação: gerar código (`randomInt`), guardar hash, invalidar anteriores, intervalo de 60 s, validade de 15 min; testes unitários (tempo controlado pelo `Clock`)
- [x] 2.2 `register` responde `202` sem sessão para e-mail novo, pendente (sobrescreve dados) e confirmado (aviso sem código); envio sem esperar; remover o `409 EMAIL_UNAVAILABLE` do cadastro por senha
- [x] 2.3 `POST /auth/verify-email` (código + senha, 5 tentativas, uso único, devolve `AuthResponse`) e `POST /auth/resend-verification` (sempre `202`)
- [x] 2.4 `login` devolve `403 EMAIL_NOT_VERIFIED` com senha certa e e-mail pendente, e reenvia código; senha errada segue `401`
- [x] 2.5 `socialLogin`: exigir `email_verified` para criar e vincular; tomada de conta pendente (confirma, apaga senha, revoga sessões); conta nova já confirmada
- [x] 2.6 `purgeExpired` apaga contas não confirmadas há mais de 7 dias; `ResendMailer` imprime a mensagem só em `development` sem chave

## 3. App

- [x] 3.1 `pending-verification-store` (memória), `endpoints.ts` (`verifyEmail`, `resendVerification`) e textos em `pt-BR.json`
- [x] 3.2 Tela `(auth)/verify-email`: campo do código, confirmar com carregando e toast, reenviar com contagem regressiva, mensagens de campo; testes de componente
- [x] 3.3 `register.tsx` vai para a tela de confirmação sem gravar sessão; `login.tsx` trata `EMAIL_NOT_VERIFIED`; remover o tratamento de `EMAIL_UNAVAILABLE` do cadastro
- [x] 3.4 Adaptar o script de testes de interface ao cadastro novo (confirma o e-mail da conta de teste no banco local); o fluxo Maestro de entrada só faz login e não muda

## 4. Testes e2e da API

- [x] 4.1 `FakeMailer.lastVerificationCode`; e2e: cadastro novo/pendente/confirmado respondem igual, confirmação certa, errada, expirada, 5 tentativas, senha diferente, reenvio com intervalo
- [x] 4.2 e2e: login pendente `403`, login com senha errada `401`; social: provedor sem e-mail verificado, tomada de conta pendente (senha apagada e sessões revogadas), conta confirmada vinculada; expurgo de pendentes

## 5. Documentação e verificação

- [x] 5.1 Atualizar `docs/SEGURANCA.md` (§6), `docs/adr/0008-autenticacao-e-sessao.md` e `docs/COMO-FUNCIONA.md`, sem achados de auditoria
- [ ] 5.2 `pnpm run verify` verde, `/code-review` na branch e tratar achados; medir tempo de resposta do cadastro (novo x existente) e registrar o resultado no PR
