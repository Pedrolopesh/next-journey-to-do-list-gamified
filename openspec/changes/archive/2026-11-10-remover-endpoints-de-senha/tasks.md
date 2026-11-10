## 1. Contratos

- [x] 1.1 Tirar de `packages/contracts` os schemas de cadastro, verificação, login e recuperação; `password` de `deleteAccountRequestSchema`; `user.hasPassword` de `/me`; `password` de `signInMethods`; testes

## 2. API e banco

- [x] 2.1 Migration que apaga `password_resets` e `users.password_hash`
- [x] 2.2 Remover as seis rotas e os métodos do `AuthService`, o e-mail de recuperação, o aviso de cadastro, limites, piso de tempo e eventos dessas rotas
- [x] 2.3 Exclusão de conta sem senha; login social confirmando a conta pendente; exportação e `/me` sem senha
- [x] 2.4 Remover as variáveis `PASSWORD_RESET_*` e o expurgo de `password_resets`

## 3. Testes

- [x] 3.1 `registerUser` e os helpers entrando pelo código
- [x] 3.2 Reescrever ou remover os e2e que dependiam das rotas removidas, mantendo a cobertura das regras que continuam
- [x] 3.3 Testes unitários dos serviços tocados

## 4. App

- [x] 4.1 Tela de exclusão sem o ramo da senha; textos de senha fora do `pt-BR.json`; testes de componente
- [x] 4.2 Fluxos do Maestro rodando no simulador (2026-11-09: 6 de 6 fluxos no iOS, com o `ui-tests.mjs` entrando por código)

## 5. Documentação e fechamento

- [x] 5.1 `docs/api/`, `docs/PRIVACIDADE.md`, `docs/HOW-IT-WORKS.md`, `.env.example` e texto da Política de Privacidade (`LEGAL_VERSION`)
- [x] 5.2 `pnpm run verify`, revisão de código e pendências registradas (2026-11-09: verify verde; pendências no Plane, NJ-31 a NJ-41)
