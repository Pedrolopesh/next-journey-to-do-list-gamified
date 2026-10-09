# Registro de decisões (ADR)

Cada decisão técnica ou de produto difícil de reverter vira um arquivo `NNNN-titulo.md`. Um ADR **nunca é editado depois de aceito**: uma nova decisão o substitui e aponta para o antigo.

## Modelo

```markdown
# ADR-NNNN: título curto

- Data: AAAA-MM-DD
- Status: proposta | aceita | substituída por ADR-XXXX
- Fase do plano: (ex.: Fase 1, passo 14)

## Contexto
O problema e as restrições.

## Decisão
O que foi decidido.

## Consequências
O que melhora, o que piora e o que precisa ser feito depois.
```

Dados de infraestrutura (endereços, portas, nomes de servidor) **nunca** entram em ADR: este repositório é público (ver `docs/SEGURANCA.md`).

## Índice

| ADR | Título | Status |
|---|---|---|
| [0001](./0001-hospedagem-em-vps-propria.md) | Hospedagem da API e do banco em VPS própria, com Docker | Aceita |
| [0002](./0002-monorepo-com-pnpm-e-turborepo.md) | Monorepo com pnpm + Turborepo | Aceita |
| 0003 | WebView para o banner | Reservada (Fase 2, depende do spike) |
| [0004](./0004-regras-de-jogo-ambiguas.md) | Regras de jogo ambíguas e como foram resolvidas | Proposta (implementada; aguarda confirmação) |
| [0005](./0005-versoes-pnpm-typescript-e-eslint.md) | Versões de pnpm, TypeScript e configuração do ESLint | Aceita |
| [0006](./0006-repositorio-publico-e-seguranca.md) | Repositório público de propósito e proteções de segurança | Aceita |
| [0007](./0007-api-nestjs-12-esm-e-vitest.md) | API em NestJS 12, ESM e Vitest | Aceita |
| [0008](./0008-autenticacao-e-sessao.md) | Autenticação, tokens e sessão | Aceita |
| [0009](./0009-fase-5-decisoes.md) | Decisões da Fase 5 (loop completo) | Aceita |
