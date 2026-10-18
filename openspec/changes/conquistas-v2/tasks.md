## 1. Catálogo e arte (contratos)

- [ ] 1.1 Criar `packages/insignias` com as grades e a paleta de `insignias-data.ts`; o laboratório passa a importar dele
- [ ] 1.2 Criar `achievement-catalog.ts` em `packages/contracts` com as 69 conquistas (slug, nome, descrição, trilha, classe, glyph, surpresa), vindas de `achievements-v2-data.ts` mais a Maratonista (Ouro); teste de unicidade, trilha e glyph válidos
- [ ] 1.3 Escolher o glyph da Maratonista entre as 45 insígnias e registrar no catálogo
- [ ] 1.4 Atualizar `achievementSchema` (`trail`, `tier`, `glyph`, `secret`, `description` anulável, `notified`) e o item de `achievementsUnlocked` (sem `rewardKey`; com `tier` e `glyph`); atualizar `contracts.test.ts`
- [ ] 1.5 Laboratório lê o catálogo do contrato; apagar `achievements-v2-data.ts`

## 2. Banco e seed

- [ ] 2.1 Migration: colunas `look_changes`, `categories_created`, `reminder_enabled_at` em `user_stats`; `notified_at` em `user_achievements` (as atuais com `unlocked_at`); remover `reward_key`; zerar peças retiradas em `characters`
- [ ] 2.2 Seed grava o catálogo de 69 conquistas a partir do contrato
- [ ] 2.3 Script retroativo (avalia todos os usuários, grava `notified_at = unlocked_at`) com teste

## 3. Regras na API (domínio puro, teste primeiro)

- [ ] 3.1 Contexto novo em `AchievementContext` e critérios das 20 conquistas já medidas (níveis 20 e 30, itens 25 e 50, chama 3, 14 e 30, Coruja, capítulos 5, histórias 3)
- [ ] 3.2 Critérios por consulta: primeiros itens, diários, tarefas e hábitos (contagens, dias distintos, sequências, no prazo, atrasada, difícil, lista zerada)
- [ ] 3.3 Critérios por consulta: constância, moedas, anotações, itens ativos, dia brilhante, dias distintos, pódio e dia perfeito
- [ ] 3.4 Critérios de evento: visual (1 e 5), categoria própria e lembrete
- [ ] 3.5 Critérios de coleção (5, 25, trilha completa, surpresas) em segunda passada
- [ ] 3.6 Progresso `{ current, target }` saindo do critério; surpresa bloqueada sem descrição

## 4. Serviço e rotas

- [ ] 4.1 `AchievementsService.evaluate` central; check passa a usá-lo; teste de idempotência por `checkId` e de desfazer
- [ ] 4.2 Chamar a avaliação em criar item, criar categoria e salvar personagem, incrementando os contadores
- [ ] 4.3 `POST /v1/me/events` (Zod, enum fechado, guard global, marca única) e `POST /v1/achievements/ack`; `GET /v1/achievements` com pendentes; e2e das rotas, incluindo outro usuário e evento inválido
- [ ] 4.4 Remover recompensas: `rewardKey` do serviço, `REWARD_KEYS` e travas de roupa de conquista no `me.controller`; ajustar e2e

## 5. App

- [ ] 5.1 Galeria por trilha com insígnia 24×24, moldura da classe, progresso e surpresa; textos no `pt-BR.json`; carregando e erro (RN-FB)
- [ ] 5.2 Modal usa `tier` e `glyph` do servidor; fila das pendentes com confirmação (`ack`); remover `tier.ts` e a arte 12×12 das conquistas
- [ ] 5.3 Revalidar `GET /achievements` depois das mutações relevantes
- [ ] 5.4 Enviar o evento de lembrete ativado
- [ ] 5.5 Formulário do personagem sem peças de recompensa nem cadeado; teste de componente

## 6. Banner

- [ ] 6.1 Remover `outfit-special` e `outfit-cape` de `OUTFITS`/`REWARD_OUTFITS` e ajustar `character-map.test.ts`

## 7. Documentação e verificação

- [ ] 7.1 Atualizar `AGENTS.md` do mobile, `HANDOFF.md` e `docs/REQUISITOS.MD` (lista de conquistas)
- [ ] 7.2 Verificar no Android e no iOS: galeria, modal, fila, retroativo e personagem sem peça de recompensa
- [ ] 7.3 `pnpm exec turbo run lint typecheck test build` 16/16, e2e da API e `FULL=1 pnpm run security:full`
