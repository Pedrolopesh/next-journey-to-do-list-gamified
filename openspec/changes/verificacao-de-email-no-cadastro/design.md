## Context

`AuthService.register` cria o usuário e emite tokens na hora (`apps/api/src/modules/auth/auth.service.ts`). Não há campo de e-mail confirmado. `socialLogin` já exige `email_verified` do provedor para **vincular**, mas ainda **cria** conta com e-mail não verificado e vincula a contas por senha que ninguém confirmou. O app (`register.tsx`) grava a sessão assim que o cadastro responde. O `Mailer` já existe (Resend, trocável nos testes) e o expurgo diário já roda em `AccountService.purgeJob`. Decisões do Pedro (2026-10-24): cadastro **estrito** (sem sessão antes de confirmar) e confirmação por **código de 6 dígitos** digitado no app.

## Goals / Non-Goals

**Goals:**

- Só existe sessão para e-mail cuja posse foi provada.
- Cadastro e reenvio não revelam se o e-mail já tem conta.
- Login social não pode tomar nem criar conta com e-mail não verificado.

**Non-Goals:**

- Link de confirmação, troca de e-mail, limite por e-mail em todas as rotas, tempo constante do "esqueci a senha" (cards separados).

## Decisions

**1. Estado no usuário + tabela de códigos.** `users.email_verified_at` (nulo = pendente) e tabela `email_verifications` (`id`, `user_id`, `code_hash`, `expires_at`, `attempts`, `used_at`, `created_at`, índice por `user_id`). Só o código mais recente vale: gerar um novo marca os anteriores como usados, igual ao `password_resets`. Alternativa descartada: guardar o cadastro pendente fora de `users` (tabela de pré-cadastro). Exigiria duplicar a unicidade de e-mail e o expurgo; a coluna resolve com menos código.

**2. Código de 6 dígitos com defesa em camadas.** `crypto.randomInt(0, 1_000_000)` preenchido com zeros; guarda `sha256(userId + ':' + código)`; compara com `timingSafeEqual`. Seis dígitos têm só 1 milhão de combinações, então o que protege é o limite: 15 minutos de validade, 5 tentativas por código (a quinta errada invalida) e o rate limit de auth por IP. Alternativa: token longo de link (mais entropia, mas depende de deep link seguro, fora do escopo).

**3. A confirmação exige a senha também.** `POST /auth/verify-email` recebe `email`, `code` e `password`, confere o código **e** a senha contra o hash da conta pendente. Motivo: cadastrar de novo uma conta pendente sobrescreve os dados (o último cadastro vence, para a dona legítima poder retomar). Sem a senha na confirmação, alguém poderia recadastrar o mesmo e-mail com outra senha entre o cadastro da pessoa e a digitação do código, e a conta ativaria com a senha errada. Com a senha, o código do e-mail só ativa a conta para quem conhece a senha que está nela. Alternativa: congelar a conta pendente enquanto o código vale; deixaria a dona legítima sem conseguir recadastrar.

**4. Respostas iguais, trabalho igual.** Em `register`, o hash argon2 da senha é sempre calculado (como hoje) e o e-mail é enviado **sem esperar** (`void mailer.send(...).catch(...)`), para o tempo de resposta não depender de o e-mail existir. Para e-mail de conta confirmada, o e-mail enviado é um aviso sem código ("alguém tentou cadastrar este e-mail; se foi você, entre ou recupere a senha"). O mesmo intervalo de 60 segundos por destinatário vale para código e aviso, para o endpoint não virar disparador de spam contra um endereço. O intervalo é controlado por `users.verification_mail_sent_at` (timestamptz, nula), atualizada em todo envio relacionado à confirmação (código ou aviso).

**5. Login.** Senha certa + `email_verified_at` nulo ⇒ `403 EMAIL_NOT_VERIFIED` e novo código (respeitando o intervalo). O 403 só aparece para quem sabe a senha, então não enumera contas. Conta criada só por login social (sem senha) nunca fica pendente.

**6. Login social.** (a) E-mail sem `email_verified` ⇒ `400 EMAIL_NOT_VERIFIED_BY_PROVIDER`, sem criar nem vincular. (b) Conta existente pendente: numa transação, `email_verified_at = agora`, `password_hash = null`, códigos pendentes marcados como usados, refresh tokens revogados, identidade criada. (c) Conta existente confirmada: vincula como hoje. (d) Conta nova: nasce com `email_verified_at = agora`.

**7. Migration.** Colunas novas, nulas. Backfill: contas com identidade social e contas sem senha recebem `email_verified_at = created_at`; contas por senha **ficam pendentes** (na próxima entrada recebem o `EMAIL_NOT_VERIFIED` e confirmam). Seguro para quem já usa o app em desenvolvimento e não exige caso especial no código.

**8. App.** `register.tsx` chama o cadastro e navega para `(auth)/verify-email`. E-mail e senha ficam num store em memória (`pending-verification-store`), **nunca** em parâmetro de rota, URL ou armazenamento persistente (checklist do AGENTS). A tela: campo do código (6 dígitos), botão "Confirmar" com carregando e toast, "Reenviar código" com contagem de 60 s. O login trata `EMAIL_NOT_VERIFIED` abrindo a mesma tela com o que a pessoa digitou. Textos só em `pt-BR.json`.

**9. Modo desenvolvimento do e-mail.** Sem `RESEND_API_KEY` e com `NODE_ENV=development`, o `ResendMailer` imprime a mensagem no console da API (para testar no emulador); em `production` e `test` continua sem imprimir nada. Os e2e usam o `FakeMailer`, que ganha `lastVerificationCode(to)`. Alternativa descartada: código fixo em desenvolvimento (cria caminho de bypass).

**10. Expurgo.** `AccountService.purgeExpired` também apaga `users` com `email_verified_at` nulo, sem identidade social, criados há mais de 7 dias (a cascata remove os códigos).

## Risks / Trade-offs

- Depende do envio de e-mail em produção: sem domínio de envio configurado a pessoa não entra → checar a entrega vira critério antes das lojas.
- 6 dígitos são adivinháveis por quem tem muitas tentativas → 5 tentativas por código, 15 min, 60 s entre reenvios e limite por IP; limite por e-mail em todas as rotas fica para outra mudança.
- Quem já tem conta por senha de teste cai em "pendente" depois da migration → aceitável enquanto não há usuários reais nas lojas.
- Enumeração por tempo: o envio assíncrono iguala o tempo, mas não foi medido em produção → registrar a medição na verificação.

- Quem sabe o e-mail de alguém consegue recadastrá-lo e trocar a senha da conta pendente, o que faz a confirmação da pessoa falhar até ela cadastrar de novo (negação de serviço do cadastro, sem tomada de conta, porque o código só chega à caixa de e-mail e vale junto com a senha) → risco aceito: o último cadastro vence, de propósito, e o limite de auth por IP e o intervalo de 60 s reduzem o abuso; o limite por e-mail fica para outra mudança.
- Senha errada na confirmação não gasta as tentativas do código (não revela nada sobre ele), para quem só conhece o e-mail não conseguir travar o código da dona.

## Migration Plan

1. Migration nova (nunca editar as aplicadas): colunas `email_verified_at` e `verification_mail_sent_at` em `users`, tabela `email_verifications`, backfill descrito acima.
2. Subir API e app juntos (o cadastro muda de contrato). Sem cliente publicado ainda.
3. Rollback: reverter o deploy; as colunas nulas não atrapalham a versão anterior, que as ignora.

## Open Questions

- Resolvida (2026-10-24, Pedro): todas as contas existentes são de teste e não há usuários reais; o backfill pode afetá-las sem cuidado extra.
