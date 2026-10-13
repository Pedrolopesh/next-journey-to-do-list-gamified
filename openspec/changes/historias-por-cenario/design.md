## Regras

1. Catálogo fixo de 6 histórias (`prisma/seed-data.ts`), `slug` igual ao id do cenário do banner.
2. `aplicarCheck`: `niveisGanhos` conclui `min(niveisGanhos, capítulos restantes)` capítulos da história ativa. Cada capítulo concluído vira um `ChapterCompletion`. O resultado informa o último capítulo concluído (`completedChapter`) para o modal.
3. `CheckRecord.closedChapter` passa a significar "este check subiu de nível e concluiu capítulo(s)". `desfazerCheck` bloqueia esse check e os feitos antes do fechamento (capítulo já mudou), como hoje.
4. `PlayerState.story` = `{ chapter, completed }`.
5. Progresso exibido = `expInLevel / expForNextLevel` do jogador (o mesmo número que move o personagem no banner).
6. Ativar uma história cria o `StoryProgress` dela (capítulo 1) se não existir e a torna a única ativa; as outras mantêm o progresso.

## Alternativas descartadas

- Manter capítulo por quantidade de checks: o personagem e a barra andariam em ritmos diferentes.
- Guardar o cenário da história no aparelho: não acompanha a história que o servidor considera ativa.
