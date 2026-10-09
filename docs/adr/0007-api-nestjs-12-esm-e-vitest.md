# ADR-0007: API em NestJS 12, ESM e Vitest

- Data: 2026-10-09
- Status: aceita
- Fase do plano: Fase 4, passo 1 (feito antes, para destravar a Fase 3)

## Contexto

A especificação previa NestJS 11, Jest e CommonJS. O gerador atual do Nest (`nest new`) entrega o **NestJS 12**, em **ESM**, com **Vitest** e oxlint.

## Decisão

- Usar o **NestJS 12** como gerado, em **ESM** (`"type": "module"`, imports relativos com `.js`).
- **Vitest** no lugar do Jest, o mesmo executor de testes que o banner e o `contracts` já usam (uma ferramenta só no monorepo).
- **ESLint do monorepo** (regras type-checked e imports ordenados) no lugar do oxlint do gerador, para manter um lint único.
- TypeScript `~6.0` na API (compatível com o typescript-eslint, que aceita abaixo de 6.1).

## Consequências

- ESM facilita consumir o `@nextjourney/contracts` sem a camada CommonJS; o `contracts` ainda gera CJS para qualquer consumidor que precise.
- O esbuild do Vitest não emite metadados de decorator: testes de integração com injeção de dependência do Nest (Fase 4) precisarão de um plugin (ex.: SWC). Os testes do `domain/` não são afetados (funções puras).
- A cobertura mínima de 80% no `domain/` é exigida pelo próprio `vitest.config.ts`.
