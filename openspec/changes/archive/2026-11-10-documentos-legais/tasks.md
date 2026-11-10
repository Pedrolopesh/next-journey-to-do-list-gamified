## 1. Contratos

- [x] 1.1 `LEGAL_VERSION`, `LEGAL_SLUGS` e `legalDocumentSchema` em `packages/contracts`, com testes

## 2. API

- [x] 2.1 Textos adaptados de `terms` e `privacy` em `apps/api/src/modules/legal/documents/`
- [x] 2.2 `GET /v1/legal/documents/:slug` (JSON) e `GET /legal/:slug` (HTML com escape), públicos
- [x] 2.3 `LEGAL_CONTACT_EMAIL` opcional no ambiente, `.env.example` e `docs/api/`
- [x] 2.4 Testes unitários dos documentos e e2e das duas rotas

## 3. App

- [x] 3.1 Endpoint, query e tela `legal/[slug]` com carregando, erro e rolagem
- [x] 3.2 Links da tela de entrada e linhas nas Configurações
- [x] 3.3 `TERMS_VERSION` reexporta `LEGAL_VERSION`; textos só em `pt-BR.json`
- [x] 3.4 Testes de componente e fluxo do Maestro

## 4. Documentação e fechamento

- [x] 4.1 `docs/PRIVACIDADE.md`, `docs/HOW-IT-WORKS.md` e `docs/api/` atualizados; idade como dado estatístico
- [x] 4.2 `pnpm run verify`, revisão de código e pendências registradas
