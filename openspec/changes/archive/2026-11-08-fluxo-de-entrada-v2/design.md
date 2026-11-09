## Context

Hoje a entrada é cadastro com senha (202, código de 6 dígitos, `verify-email` com a senha) ou login social. O app tem as telas `welcome`, `login`, `register`, `verify-email`, `forgot-password`, `reset-password` e o onboarding `tutorial`, `character`, `story`. O Figma novo (arquivo `Next Journey`, seção "Fluxo de entrada (novo)") troca tudo isso. O servidor decide a progressão; o app só mostra.

## Goals / Non-Goals

**Goals:** login por código sem senha; sessão longa; perfil com meta, idade, gênero, classe e lembretes; fluxo visual novo no app; sem quebrar versões instaladas.
**Non-Goals:** remover os endpoints de senha; arte das classes; agendar lembretes novos; revisão jurídica de menores.

## Decisions

- **Dois endpoints novos em vez de reaproveitar `register`/`verify-email`.** `start` cria a conta pendente sem senha ou apenas envia o código; `confirm` troca código por sessão. Reaproveita `EmailVerificationService` (código, tentativas, intervalo, hash) sem mudar a regra. `resend-verification` e `start` fazem o mesmo; o app chama `start` de novo no reenvio.
- **Conta criada por e-mail** nasce com `name` derivado da parte local do e-mail (até 80 caracteres), `passwordHash` nulo e Termos aceitos na versão enviada pelo app. O nome do personagem é separado e continua pedido na tela própria; `user.name` não é mostrado na Home nova.
- **Mesmo código para quem já tem senha.** Quem tem conta com senha entra com o código do mesmo e-mail; nada é migrado. A senha antiga fica sem uso (os endpoints seguem na API).
- **Sessão longa:** `REFRESH_TOKEN_TTL_DAYS` passa de 30 para 365 (padrão do env). A expiração já é deslizante, porque cada rotação cria um token novo com a validade cheia. A limpeza diária e a detecção de reúso não mudam.
- **Exclusão por código:** `deleteAccountRequestSchema` ganha `{ emailCode }`. O app pede o código em `POST /auth/email/start` e envia no `DELETE /me`. `AccountService.confirmOwner` consome o código com `EmailVerificationService.consume(userId, code, true)` e conta a tentativa errada como `reauth_failed`.
- **Perfil:** colunas novas em `users` (`goals` como lista, `age_range`, `gender`, `reminders_opt_in`) e em `characters` (`character_class`), todas anuláveis, com migration nova e sem backfill. Enums fechados em `packages/contracts`; no banco, texto com os mesmos valores. `PATCH /me` aceita `goals`, `ageRange`, `gender`, `remindersOptIn`; `PUT` do personagem aceita `characterClass`. `GET /me` devolve tudo ao próprio usuário.
- **`onboarding` do `GET /me` não muda:** continua `tutorialSeen`, `hasCharacter`, `hasStory`. As telas de meta, lembretes, idade e gênero rodam no mesmo ciclo do onboarding mas nunca bloqueiam o app para contas antigas.
- **Fluxo no app:** o roteador decide o destino por `onboarding` (como hoje). Telas novas ficam em `(auth)` (welcome, email, code) e `(onboarding)` (intro, goal, looks, customize, name, story, reminders, age, gender). Estado temporário do personagem fica num contexto em memória até "Criar personagem" salvar tudo de uma vez.
- **QG e histórias:** o cenário do QG passa a ser o da história ativa; a escolha manual de cenário deixa de aparecer. O dado de cenário que existe hoje não é apagado.
- **Textos novos só em `pt-BR.json`**, cores e tamanhos só por tokens do tema. Botões com `useAction` (carregando e toast).

## Risks / Trade-offs

- Sessão de 365 dias aumenta o dano de um refresh token vazado → rotativo, reúso revoga a família, SecureStore e tela de Sessões já existem.
- Conta pendente sem senha vira lixo se a pessoa nunca confirma → a limpeza de contas não confirmadas (7 dias) já cobre.
- Spam de e-mails por `start` → rate limit por e-mail e por IP, intervalo de 60 s, resposta constante.
- Classes e o texto dos modais são provisórios → ficam centralizados em um catálogo e no `pt-BR.json`, fáceis de trocar.
- Versões antigas do app seguem funcionando porque nenhum endpoint antigo foi removido.

## Migration Plan

Uma migration aditiva (colunas anuláveis). Deploy normal da API; o app novo sai depois. Rollback da API é seguro (colunas extras ignoradas).

## Open Questions

- Revisão jurídica de menores antes da loja (idade é opcional).
- Arte e nomes finais das 8 classes.
