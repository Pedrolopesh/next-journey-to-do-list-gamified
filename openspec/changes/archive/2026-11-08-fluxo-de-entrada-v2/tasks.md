## 1. Contratos

- [x] 1.1 Enums de meta, idade, gênero e classe em `packages/contracts` e testes
- [x] 1.2 Schemas `emailStart`/`emailConfirm`, `emailCode` na exclusão, campos novos em `PATCH /me`, `GET /me`, personagem e exportação

## 2. API

- [x] 2.1 Migration com colunas novas em `users` e `characters`
- [x] 2.2 `POST /auth/email/start` e `POST /auth/email/confirm` com rate limit e testes e2e
- [x] 2.3 Exclusão de conta por código e teste e2e
- [x] 2.4 `REFRESH_TOKEN_TTL_DAYS` 365 e documentação em `docs/api/`
- [x] 2.5 Perfil novo em `PATCH /me`, `GET /me`, personagem e exportação, com testes

## 3. App: base

- [x] 3.1 Cliente da API, textos `pt-BR.json` e roteador do novo fluxo
- [x] 3.2 Estado temporário do personagem e componentes (botão voltar, pílulas, cards)

## 4. App: telas

- [x] 4.1 Splash, Boas-vindas, E-mail, Código
- [x] 4.2 Introdução (3 telas) e Meta
- [x] 4.3 Looks prontos, Personalizar, Nome do personagem
- [x] 4.4 Escolha de história com modal
- [x] 4.5 Lembretes, Idade e Gênero
- [x] 4.6 Home com "Seu QG" e "Mudar história"; Configurações com exclusão por código

## 5. Fechamento

- [x] 5.1 Maestro: fluxos de entrada atualizados (fluxo 00 passa; o 01 falha ao digitar o título do item, pendência registrada)
- [x] 5.2 `pnpm run verify`, revisão de código e pendências registradas (2026-11-08: verify verde; pendências no Plane, NJ-31 a NJ-41)
