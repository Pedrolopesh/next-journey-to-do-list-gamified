## Why

O Pedro aprovou no Figma um novo fluxo de entrada, da Splash até a Home: login sem senha (Apple, Google ou código de 6 dígitos enviado por e-mail), introdução em 3 telas, perguntas de meta, idade e gênero, criação do personagem em três passos, escolha de história com cards e pedido de lembretes. O cadastro e o login por senha do app (e "Esqueci minha senha") saem do fluxo. O app e a API precisam guardar os dados novos do perfil e aceitar o login só por código.

## What Changes

- **Login por código de e-mail.** Dois endpoints novos, `POST /auth/email/start` (sempre `202`) e `POST /auth/email/confirm` (devolve a sessão). A mesma conta serve para quem já tinha senha. Sem senha, sem cadastro separado: o primeiro código confirmado cria a conta.
- **Sessão que não expira sozinha.** O refresh token passa a valer 365 dias a cada uso (deslizante); o app só sai da conta quando a pessoa toca em "Sair" ou exclui a conta. O "Sair" das Configurações continua.
- **Exclusão de conta por código.** Conta criada só por e-mail não tem senha nem provedor; `DELETE /me` passa a aceitar também o código recebido por e-mail.
- **Dados novos no perfil.** Meta (7 opções), faixa de idade (7, opcional), gênero (3, opcional), classe do personagem (8) e se a pessoa ligou os lembretes. Entram em `PATCH /me`, `GET /me` e no personagem. O título do personagem (Herói/Heroína/Aventureiro) e o acessório saem do fluxo de criação; o nome é pedido numa tela própria.
- **Novo fluxo no app** (16 telas): Splash, Boas-vindas, e-mail, código, introdução (3), meta, looks prontos, personalizar, nome, escolha de história (cards e modal), notificações, idade, gênero, Home com "Seu QG" e "Mudar história". Voltar em toda tela do onboarding.
- **Home.** "Mudar cenário do QG" sai: o cenário do QG passa a ser o da história escolhida.
- **BREAKING (só para o app antigo).** O app novo para de usar `register`, `login`, `forgot-password` e `reset-password`. Os endpoints seguem na API nesta mudança, para não quebrar versões instaladas; a remoção fica para uma mudança própria.

## Capabilities

### New Capabilities

- `email-code-login`: login e criação de conta por código de e-mail, sessão longa e exclusão por código.
- `onboarding-profile`: meta, idade, gênero, classe e lembretes no perfil, e a regra de quando o onboarding termina.
- `entry-flow-ui`: ordem, conteúdo e comportamento das telas do novo fluxo de entrada.

### Modified Capabilities

<!-- Nenhuma: as specs vivas de e-mail e sessão continuam valendo para os endpoints antigos. -->

## Fora do escopo

- Remover os endpoints de senha (`register`, `login`, `forgot-password`, `reset-password`) e a tabela `password_resets`.
- Arte própria das 8 classes (a lista é provisória) e textos finais dos modais das histórias (são exemplos).
- Revisão jurídica da coleta de idade de menores: idade é opcional (com "Pular") e nada depende dela; a revisão antes da loja fica como pendência no `HANDOFF.md`.
- Lembretes: só se guarda a escolha e se pede a permissão do sistema; o agendamento continua o que já existe (`notifyAt`).

## Segurança

- Rotas novas são públicas (como `register` e `login`): respondem igual para e-mail existente e inexistente (`202`), com rate limit por e-mail e por IP e intervalo de 60 s entre códigos.
- O código de 6 dígitos vale 15 minutos, é de uso único e some após 5 tentativas erradas (mesmo mecanismo de hoje, guardado só como hash).
- `confirm` responde `400 INVALID_VERIFICATION_CODE` igual para código errado, expirado, usado ou e-mail sem conta (sem enumeração).
- Idade e gênero são dados pessoais: opcionais, nunca em log, devolvidos só ao próprio usuário em `GET /me` e incluídos na exportação de dados e apagados com a conta.
- Sessão longa aumenta o valor de um refresh token roubado: ele continua rotativo, com reúso revogando a família, guardado no SecureStore, e a pessoa vê e revoga aparelhos em Sessões.
