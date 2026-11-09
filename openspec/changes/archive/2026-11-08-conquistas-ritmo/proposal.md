## Why

Hoje várias conquistas saem juntas: limites iguais (5, 10, 25), regras "no mesmo dia" que saem no primeiro dia de uso e coleções em cadeia, e o app abre vários modais de uma vez. O Pedro aprovou, na página "Conquistas v2" do laboratório, uma proposta mais espaçada validada por simulação de 30 dias.

## What Changes

- **Um modal por ação.** Tudo que uma ação libera continua gravado e visível na galeria, mas a resposta traz só a pendente mais antiga (empate: ordem do catálogo). As outras saem uma por vez nas ações seguintes (check, criar item, categoria, personagem, evento). Ao abrir o app aparece uma pendente, não todas.
- **47 critérios novos e 6 nomes novos** no catálogo (por exemplo Rotina marcada pede diários em 4 dias; Equilíbrio pede 3 categorias no mesmo dia em 10 dias; Organizado pede 15 itens; Veterano, Mestre e Lenda viram os níveis 8, 12 e 20). Os `slug` não mudam.
- **Contadores novos na API:** dias com diário, dias com 3 e com 5 categorias, dias de pódio (diário, tarefa e hábito juntos). Os de hoje (categorias e tipos do dia) saem.
- Retroativo e quem já ganhou: nada é removido nem reabre modal.

## Capabilities

### New Capabilities

- `achievement-pacing`: um modal por ação e os critérios espaçados.

### Modified Capabilities

<!-- Nenhuma: não há spec viva de conquistas em openspec/specs/. -->

## Impact

- `packages/contracts`: textos e nomes do catálogo.
- `apps/api`: `achievements.ts` (critérios), `achievement-stats.ts` (contadores), `achievements.service.ts` (`evaluate` devolve a pendente mais antiga), testes unitários e e2e.
- `apps/mobile`: ao abrir, uma pendente só (`ProgressionModalHost`).
- `apps/banner`: página "Conquistas v2" já traz a proposta e o simulador.
- Sem migration de schema. Rodar `db:seed` (nomes e descrições do catálogo gravados no banco).

## Segurança

- O servidor decide o que está liberado e o que aparece; o app só mostra e confirma (`POST /achievements/ack` só do próprio usuário).
- Sem rota nova; sem dado sensível em log.

## Fora do escopo

- Conquistas novas além da 70ª (Hábito de 100 dias), recompensas e notificação push.
