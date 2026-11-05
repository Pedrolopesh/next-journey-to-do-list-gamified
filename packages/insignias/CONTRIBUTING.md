# packages/insignias — arte das insígnias de conquista

Regras do monorepo em `../../AGENTS.md`. Dados de pixel art 24×24 (grades de caracteres e paleta), usados pelo app e pelo laboratório do banner.

- Uma grade por insígnia, 24 linhas de 24 caracteres; `.` é transparente e as demais letras existem em `INSIGNIA_PALETTE`.
- O nome da insígnia (`glyph`) vem do catálogo em `@nextjourney/contracts`; o teste confere que todo `glyph` existe aqui.
- Sem lógica e sem dependência de framework. O build (`tsup`) gera ESM e CJS.
