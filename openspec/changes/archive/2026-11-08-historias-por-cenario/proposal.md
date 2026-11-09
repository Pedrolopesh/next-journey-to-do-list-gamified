## Why

Hoje há 5 histórias temáticas (Empreendedor, Estudante...) e o cenário do banner é uma escolha separada, só no aparelho. O capítulo fecha por quantidade de checks, enquanto o personagem avança pela EXP do nível: os dois andam em ritmos diferentes e a cena troca antes de o personagem chegar ao portal. A proposta junta tudo numa regra só: **cada história é um cenário**, e **cada nível ganho conclui um capítulo**.

## What Changes

- **Histórias por cenário.** O catálogo passa a ter 6 histórias, uma por cenário do banner: Praia, Cidade, Apocalipse zumbi, Castelo, Floresta e Inferno (slug = id do cenário: `beach`, `rooftop`, `zombie`, `castle`, `paradise`, `hell`). Cada uma tem 5 capítulos próprios. As 5 histórias antigas saem do catálogo.
- **Capítulo = nível.** Cada nível ganho conclui o capítulo atual da história **ativa** e abre o seguinte (um nível a mais = um capítulo a mais, até o 5º). Ao concluir o 5º, a história fica concluída; níveis seguintes continuam subindo, sem capítulo. O progresso do capítulo é a EXP dentro do nível (`expInLevel / expForNextLevel`). Deixam de existir o contador de checks do capítulo e `requiredChecksInChapter`.
- **Cada história guarda o seu progresso.** Trocar de história (a qualquer momento) preserva capítulos concluídos e o capítulo atual de cada uma. Os capítulos concluídos de uma história ficam desbloqueados para sempre.
- **Cenário do banner = história ativa.** O app deixa de guardar o cenário da história principal no aparelho: a jornada das abas usa o cenário da história ativa. O cenário do QG (Home) continua sendo escolha do aparelho.
- **Minha história.** `GET /v1/stories/:slug/timeline` devolve os capítulos de qualquer história (concluído, atual ou bloqueado, com texto só nos concluídos); `GET /v1/me/story/timeline` segue devolvendo a da história ativa.
- **Desfazer.** O check que sobe de nível (e fecha capítulo) não pode ser desfeito (`CAPITULO_FECHADO`), como já era para o check que fechava o capítulo.
- **Moedas.** O check já devolve `coinsGained` (por dificuldade, mais o bônus de nível); o toast do app passa a mostrar EXP e moedas.
- **Contratos.** `chapterProgress` do resultado do check, `story` da Home, `timeline` e `GET /me` trocam `checksInChapter`/`requiredChecks` por `expInLevel`/`expForNextLevel`; `StorySummary` ganha `currentChapter`.

## Impact

`packages/contracts` (check, home, story, player), `apps/api` (domínio de progressão, checks, stories, me, home, seed, testes unitários e e2e), `apps/mobile` (fluxo do check, abas, Minha história, Home, perfil, personagem). Sem migration: a coluna `checks_in_chapter` fica sem uso (sempre 0) e o catálogo antigo é substituído pelo seed.

## Segurança

Nenhuma rota fica sem autenticação: `GET /stories/:slug/timeline` usa o mesmo guard global e só lê dados do próprio usuário (o slug vem de catálogo fixo; slug desconhecido responde 404). O servidor continua decidindo toda a progressão.

## Decisão a confirmar com o Pedro

Substituir as 5 histórias antigas apaga o progresso delas dos usuários existentes (cascata do banco). Por ser pré-lançamento, o seed remove as histórias fora do catálogo; usuários que tinham uma delas ativa voltam à escolha de história.
