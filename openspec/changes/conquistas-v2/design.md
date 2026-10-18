## Context

Hoje o catálogo vive em `apps/api/src/modules/progression/domain/achievements.ts` (10 conquistas) e é gravado na tabela `achievements` pelo seed. A avaliação roda só em `AchievementsService.evaluateAfterCheck`, a partir do check. O resultado do check traz `achievementsUnlocked` (`slug`, `name`, `rewardKey`). O app tem arte 12×12, um mapa local de classes (`tier.ts`) e um modal único (`AchievementUnlockedModal`). O laboratório tem os dados das 69 conquistas em `apps/banner/src/lab/pages/achievements-v2-data.ts` e as grades das 45 insígnias em `insignias-data.ts`.

Escala medida na lista aprovada: 20 conquistas já medidas (19 mais a Maratonista), 45 por consulta e 4 com evento novo.

## Goals / Non-Goals

**Goals:**

- Uma fonte única do catálogo e da arte, sem cópia entre API, app e laboratório.
- Regras puras, testadas e idempotentes; servidor decide.
- Avisar o jogador uma única vez, sem perder aviso nem duplicar.
- Aposentar recompensas de item sem quebrar personagens existentes.

**Non-Goals:** novas roupas e acessórios (backlog), recompensas de moedas/EXP, push, níveis dos cenários.

## Decisions

1. **Catálogo em `packages/contracts/src/achievement-catalog.ts`** (slug, name, description, trail, tier, glyph, secret) e regras na API por `slug`. Descartado: manter o catálogo só na API (o laboratório e o app divergiriam) e gerar o app por script (mais uma etapa que quebra). O laboratório passa a importar do contrato e apaga `achievements-v2-data.ts`. Um teste confere 70 slugs únicos, trilha e `glyph` existentes.
2. **Arte em um pacote de dados novo, `packages/insignias`** (grades e paleta, vindas de `insignias-data.ts`), usado pelo app e pelo laboratório. Contratos não carregam pixel. Descartado: copiar as grades para o app (duplica) e pôr no contrato (mistura dado de arte com contrato de API).
3. **Avaliação central.** `AchievementsService.evaluate(tx, userId, context)` calcula o contexto uma vez (consultas agrupadas por `userId`, com índices em `item_checks(userId, checkedOn)` e `items(userId, type)` que já existem) e roda a lista de critérios. Os 4 de coleção rodam num segundo laço, repetido até estabilizar (limite de 3 voltas). Chamado por check, item, categoria, personagem, história e evento. Alternativa descartada: avaliar tudo na leitura da galeria (custo em toda abertura e sem aviso no momento).
4. **Contadores e marcas em `UserStats`** (colunas novas, `default 0` ou nulas): `lookChanges`, `categoriesCreated` (só categorias criadas pelo usuário), `reminderEnabledAt`. Descartado: tabela de eventos (mais escrita e sem uso além de contagem).
5. **`POST /v1/me/events`** com `type` em `z.enum(['reminder_enabled'])`, pronto para crescer. Só informa fato do aparelho (o lembrete é local). O servidor grava a marca uma vez e decide a conquista. O app nunca manda "desbloquear".
6. **Aviso pendente por `notifiedAt`** em `user_achievements` (migration: coluna nula; as 10 atuais recebem `notifiedAt = unlockedAt`). Rotas que mudam algo retornam `achievementsUnlocked` quando sabem (check mantém), e o app, depois de qualquer mutação relevante, revalida `GET /achievements` e abre o modal das pendentes. Assim o aviso também chega no retroativo e em ações sem corpo de resposta próprio. `POST /achievements/ack` confirma. Descartado: devolver `achievementsUnlocked` em todas as rotas (muda muitos contratos).
7. **Retroativo** por script no seed/migração de dados: roda `evaluate` para cada usuário e grava `notifiedAt = unlockedAt`.
8. **Surpresas** tratadas no DTO de saída da lista (allowlist): `description: null` quando `secret` e bloqueada.
9. **Fim das recompensas.** Migration nova: remove `reward_key` de `achievements`, zera em `characters` o `outfit` e o `accessory` que forem peças retiradas (volta ao padrão `tunic-purple` e sem acessório), mantém a tabela `user_cosmetics` para o backlog e retira a trava `COSMETIC_LOCKED`, que não tem mais peça para travar. O banner remove `outfit-special` e `outfit-cape` de `OUTFITS`. Nunca editar migration aplicada.
10. **Progresso numérico** (`progressoDaConquista`) deixa de ser um `switch` por slug e passa a sair do próprio critério (`{ current, target }` quando contável).

## Risks / Trade-offs

- [Custo de avaliar 69 critérios a cada check] → um contexto calculado uma vez, consultas por índice, sem N+1; medir com teste de carga simples (1.000 checks) antes do PR.
- [Retroativo libera muitas de uma vez] → entram como já avisadas; a galeria mostra tudo.
- [Contadores novos não existem para o passado] → as 4 conquistas de evento só contam dali em diante (mudar visual, criar categoria, lembrete); registrar no texto de ajuda.
- [Categorias hoje podem não distinguir as padrão das próprias] → incrementar `categoriesCreated` só na rota de criação; as padrão do cadastro não contam.
- [Mudança de contrato quebra app antigo] → app e API saem no mesmo PR; pré-lançamento, sem versões antigas em uso.
- [Trocar o `iconKey` por `glyph`] → seed regrava o catálogo; o app antigo não é mantido.

## Migration Plan

1. Migration: colunas novas em `user_stats`, `notified_at` em `user_achievements`, remove `reward_key`, reseta peças retiradas.
2. Seed grava o catálogo novo (substitui as linhas de `achievements`; slugs antigos continuam).
3. Script retroativo.
4. Rollback: nova migration reversa; os dados de conquistas desbloqueadas não são apagados.

## Open Questions

- Insígnia da Maratonista: escolhida na tarefa 1.3 entre as 45 já desenhadas (decisão delegada pelo Pedro).
- "Troca de ares" ficou de fora desta mudança: será revista quando os níveis de cada cenário entrarem no app (podem virar conquistas).
