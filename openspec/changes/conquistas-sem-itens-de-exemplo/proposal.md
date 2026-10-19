## Why

O app cria cerca de 100 itens de exemplo para quem ainda não tem itens. As conquistas de criação e de itens ativos contavam esses itens como se o jogador os tivesse criado: no primeiro check saíam Primeiro diário, Primeira tarefa, Primeiro hábito, Bolsa cheia (e Organizado, que usa o contador de itens criados) sem o jogador criar nada. Achado pelo Pedro ao marcar hábitos numa conta recém-zerada.

## What Changes

- Itens de exemplo passam a ser marcados (`items.is_example`); o app envia `example: true` ao criá-los.
- Itens de exemplo **não** contam em: Primeiro diário, Primeira tarefa, Primeiro hábito, Organizado, Planejador e Arquiteto da rotina (itens criados), Bolsa cheia (itens ativos) e Pena leve (anotações).
- Marcar, concluir e todas as conquistas por check continuam contando normalmente nos itens de exemplo (o jogador age neles de verdade).

## Capabilities

### New Capabilities

- `achievement-creation`: o que conta como "criar item" nas conquistas.

### Modified Capabilities

<!-- Nenhuma. -->

## Impact

- Prisma: coluna `is_example` (migration `20261019180000_item_de_exemplo`, padrão falso).
- `packages/contracts`: `createItemRequestSchema` aceita `example: true`.
- `apps/api`: `items.service` (não incrementa `items_created` para exemplo) e `achievements.service` (contadores sem exemplos); e2e.
- `apps/mobile`: `buildExampleRequests` marca `example: true`.

## Segurança

- A flag só pode ser enviada pelo próprio usuário para os próprios itens e só reduz o que conta para ele; nenhuma rota nova nem dado de outro usuário.

## Fora do escopo

- Marcar itens de exemplo antigos de contas existentes (só dados de desenvolvimento; ver tarefa de publicação).
