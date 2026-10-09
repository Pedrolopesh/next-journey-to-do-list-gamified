# packages/contracts — contratos compartilhados

Regras do monorepo em `../../AGENTS.md`. Este pacote é a **única fonte** dos formatos de dados entre API, app e banner.

- Schemas Zod + tipos (`z.infer`). Sem lógica de negócio e sem dependência de framework: o app (React Native), o banner (navegador) e a API (Node) importam daqui.
- Nunca duplicar um tipo em outro pacote: importe de `@nextjourney/contracts`.
- Toda mudança de contrato (rota, schema, mensagem do banner) atualiza os consumidores **no mesmo PR** e a proposta/ADR correspondente. O typecheck dos três quebra se algo ficar para trás.
- Todo schema novo tem teste (`*.test.ts`), com casos válidos e inválidos, inclusive limites.
- Schemas de entrada validam o que vem do cliente; nunca inclua no schema de **saída** campo sensível (hash de senha, token de refresh de outro usuário, e-mail de terceiros).
- O build (`tsup`) gera ESM e CJS. O `lint`, o `typecheck` e o `test` dependem do build das dependências (Turbo).
- Protocolo do banner: mensagens `{ v: 1, type, payload }`; mudou o formato, suba a versão `v` e trate as duas durante a transição.
