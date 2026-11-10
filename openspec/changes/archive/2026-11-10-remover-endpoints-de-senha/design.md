## Context

`fluxo-de-entrada-v2` deixou os endpoints de senha na API "para não quebrar versões instaladas" e adiou a remoção para uma mudança própria. O app nunca foi publicado nas lojas (os builds de loja são a próxima etapa), então não há versão instalada que dependa deles. `emailConfirm` e o login social já apagam o `passwordHash` ao confirmar uma conta pendente, de modo que só contas antigas e confirmadas ainda têm senha.

## Goals / Non-Goals

**Goals:** remover as seis rotas e todo o código, os e-mails, os limites, os eventos e os dados que só elas usavam; manter a exclusão de conta e a exportação funcionando sem senha; manter os testes e2e cobrindo as mesmas regras de negócio.
**Non-Goals:** mudar o login por código, o login social, a sessão longa ou o aceite dos Termos.

## Decisions

- **Remover em vez de desativar.** Código morto em rota pública é risco. As rotas saem junto com serviço, schemas do contrato, testes e docs, no mesmo PR (regra 4: contrato e consumidores juntos).
- **Migration destrutiva e sem backfill.** `DROP TABLE password_resets` e `ALTER TABLE users DROP COLUMN password_hash`. É segura agora porque não há usuário real dependendo da senha; depois das lojas seria um problema de migração de contas. Migration nova, nunca edição de migration aplicada.
- **Exclusão só por código ou provedor.** `deleteAccountRequestSchema` perde `password`. A tela do app já tem os dois caminhos para contas sem senha; o ramo da senha sai e todos veem os dois.
- **`hasPassword` sai do `/me`** em vez de ficar fixo em `false`: um campo sempre falso engana quem o lê.
- **`signInMethods`** da exportação deixa de ter `password` (o enum do contrato encolhe).
- **Login social.** A regra "vincular a conta por senha não confirmada apaga a senha e as sessões" vira "vincular a uma conta pendente (criada por código) confirma a conta e revoga as sessões e os códigos abertos". O efeito de segurança é o mesmo: quem digitou o e-mail de outra pessoa não herda a conta.
- **Helpers de teste.** `registerUser` passa a entrar pelo código (`email/start` + código capturado + `email/confirm`) e mantém a assinatura, para as dezenas de testes que o usam não mudarem. Testes que só existiam por causa da senha (login, recuperação, reenvio, cadastro pendente) saem; as regras que valem para o código (tentativas, expiração, enumeração, tempo constante, limite) já têm teste em `email-code-login` e `rate-limit` e ganham os casos que faltarem.
- **Textos legais.** A Política de Privacidade para de falar em senha; `LEGAL_VERSION` sobe (regra: mudou o texto, sobe a versão).

## Risks / Trade-offs

- Quem tinha só senha e não acessa o e-mail fica sem entrar → só há contas de teste; documentado.
- Migration apaga dados → a coluna e a tabela não têm uso depois da mudança; os backups diários (7 dias) cobrem um erro de rollout.
- Remoção grande no mesmo PR (API, contrato, app, banco, docs) → regra de contrato e consumidores juntos; mitigado por testes e2e, `verify` completo e Maestro no simulador.
