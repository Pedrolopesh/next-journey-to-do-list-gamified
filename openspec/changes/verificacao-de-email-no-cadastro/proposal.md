## Why

Hoje o cadastro por senha cria a conta e já devolve a sessão, sem provar que a pessoa é dona do e-mail. Isso permite cadastrar o e-mail de outra pessoa com uma senha conhecida e, quando a dona entra depois com Google ou Apple, o login social se liga a essa conta. O cadastro também responde `409` quando o e-mail já existe, o que revela quem tem conta. Confirmar a posse do e-mail antes de ativar a conta resolve as duas coisas e é pré-requisito para o lançamento nas lojas (Fase 7, verificação de e-mail, citada em `docs/SEGURANCA.md`).

## What Changes

- **Cadastro estrito.** `POST /auth/register` passa a responder `202` com `{ status: 'verification_sent' }`, **sem sessão**, tanto para e-mail novo quanto para e-mail já usado. A conta nasce com e-mail não confirmado e só entra depois de confirmar.
- **Código de 6 dígitos por e-mail**, válido por 15 minutos, uso único, com no máximo 5 tentativas erradas. Novo `POST /auth/verify-email` (`email`, `code`, `password`) confirma e devolve a sessão. Novo `POST /auth/resend-verification` (`email`) reenvia, sempre `202`, com intervalo mínimo entre envios.
- **Login** com senha correta e e-mail não confirmado responde `403 EMAIL_NOT_VERIFIED` e dispara um código novo; senha errada continua `401` igual a hoje.
- **Login social**: só cria ou vincula conta quando o provedor garante `email_verified`. Ao vincular a uma conta por senha ainda não confirmada, a conta é confirmada, a senha antiga é apagada e as sessões são revogadas.
- **Limpeza**: contas não confirmadas há mais de 7 dias são apagadas pelo expurgo diário.
- **App**: tela de código de verificação (carregando + toast, RN-FB), reenvio com contagem regressiva, tratamento de `EMAIL_NOT_VERIFIED` no login e novo texto no cadastro.
- **BREAKING** (contrato): o cadastro deixa de devolver `AuthResponse`. Não há cliente publicado ainda, só o app deste repositório.

## Capabilities

### New Capabilities

- `email-verification`: confirmação de posse do e-mail no cadastro por senha e regras de vínculo do login social.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de autenticação em openspec/specs/. -->

## Impact

- `packages/contracts`: schemas novos (`registerResponse`, `verifyEmailRequest`, `resendVerificationRequest`) e códigos de erro `EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_CODE` e `EMAIL_NOT_VERIFIED_BY_PROVIDER`.
- `apps/api`: `auth.service.ts`, `auth.controller.ts`, `mailer.ts` (modo desenvolvimento), `account.service.ts` (expurgo), migration (coluna `email_verified_at` em `users` e tabela `email_verifications`), testes unitários e e2e.
- `apps/mobile`: tela `verify-email`, ajustes em `register.tsx` e `login.tsx`, `endpoints.ts`, `pt-BR.json`, fluxo Maestro de entrada.
- Docs: `docs/SEGURANCA.md` (§6, limitação deixa de existir), `docs/adr/0008`, `docs/COMO-FUNCIONA.md`.
- Exige o envio de e-mail funcionando em produção (domínio de envio configurado) antes de ir às lojas.

## Segurança

- Código gerado com `crypto.randomInt`, só o hash no banco, comparação com `timingSafeEqual`, expira e trava por tentativas.
- Cadastro e reenvio respondem igual para e-mail novo, pendente ou já confirmado (sem enumeração); o envio do e-mail não bloqueia a resposta.
- Nenhum e-mail completo, código ou senha em log; a senha nunca vai em URL ou parâmetro de rota no app.
- Rate limit de autenticação (10/min por IP) vale nas rotas novas.

## Fora do escopo

- Rate limit por e-mail e armazenamento compartilhado do limite.
- Tempo de resposta constante do "esqueci a senha".
- Link de confirmação por Universal/App Links.
- Troca de e-mail da conta e reautenticação para excluir conta.
