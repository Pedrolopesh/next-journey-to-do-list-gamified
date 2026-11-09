## Why

O app tem 10 conquistas, quase todas medidas só por checks, nível e capítulo. O laboratório já desenhou e o Pedro aprovou um catálogo de **69 conquistas** (a lista aprovada de 69, sem "Troca de ares", mais a Maratonista, mantida como Ouro), com 7 trilhas, 4 classes (Bronze, Prata, Ouro, Diamante), 45 insígnias de 24×24 e conquistas surpresa. Falta levar isso para a API e para o app, para dar metas de médio e longo prazo e usar a arte que já existe. Também sobram recompensas de item que o personagem não consegue usar.

## What Changes

- **Catálogo de 69 conquistas** com trilha, classe, insígnia (`glyph`) e marca de surpresa, em uma fonte única em `packages/contracts`, usada pela API, pelo app e pelo laboratório.
- **Regras novas na API** (domínio puro, com teste): 20 conquistas já medidas hoje, 45 que saem de consultas às tabelas atuais e 4 que dependem de evento novo (mudar o visual, mudar 5 vezes o visual, criar categoria própria e ativar o lembrete diário). "Troca de ares" (trocar de história ou de cenário) ficou de fora e será revista quando os níveis dos cenários entrarem no app.
- **Avaliação fora do check.** Hoje só o check avalia conquistas. Passa a avaliar também depois de criar item, salvar personagem, criar categoria e do evento do app. Conquistas de coleção (Medalhista, Caçador de troféus, Louros, Cofre aberto) avaliam depois das demais, na mesma passada.
- **Aviso de conquista pendente.** Cada conquista guarda se o app já avisou o jogador. O app mostra o modal único para as pendentes e confirma em seguida. As que o retroativo libera ficam como já avisadas (aparecem só na galeria).
- **Retroativo.** Quem já tem histórico recebe as conquistas que já cumpria, uma vez, no deploy.
- **Surpresas.** Enquanto bloqueada, a API não manda a descrição de uma conquista surpresa.
- **Galeria no app** com as insígnias 24×24, a moldura na cor da classe, as trilhas e o progresso. O modal de "conquista desbloqueada" passa a usar a classe e a insígnia vindas do servidor, e o mapa local de classes sai.
- **BREAKING — recompensas de item retiradas.** Saem `rewardKey` dos contratos e do catálogo, as roupas `outfit-special` e `outfit-cape` e os acessórios de recompensa. Eram de teste. Uma migration zera nos personagens o que usava essas peças. A tabela `user_cosmetics` e a trava `COSMETIC_LOCKED` ficam para as peças novas (backlog: estudo de roupas e acessórios).
- **Contrato do catálogo (BREAKING).** `Achievement` ganha `trail`, `tier`, `glyph`, `secret`; `iconKey` é substituído por `glyph`; `achievementsUnlocked` do check passa a trazer classe e `glyph`.

## Capabilities

### New Capabilities

- `achievement-catalog`: o catálogo das 69 conquistas (trilhas, classes, insígnias, surpresas), o contrato e o fim das recompensas de item.
- `achievement-rules`: critérios de cada conquista, contadores e eventos novos, avaliação depois de cada ação, retroativo, aviso pendente e idempotência.
- `achievement-ui`: galeria, modal único e a arte das insígnias no app e no laboratório.

### Modified Capabilities

<!-- Nenhuma: não há specs vivas em openspec/specs/ ainda. -->

## Impact

- `packages/contracts` (catálogo, `achievementSchema`, check, eventos), novo pacote de dados da arte das insígnias.
- `apps/api`: domínio `progression/domain/achievements.ts`, `achievements.service.ts`, rotas de itens, categorias, personagem, histórias e `me`, schema Prisma (migration), seed, testes unitários e e2e.
- `apps/mobile`: galeria de conquistas, modal, fila de avisos, formulário de personagem (sem peças de recompensa), lembrete diário (envia o evento).
- `apps/banner`: laboratório passa a ler o catálogo e a arte do pacote novo; mapa de roupas sem as de recompensa.
- Sem dependência externa nova.

## Segurança

- Nenhuma rota fica sem autenticação. As rotas novas (`POST /v1/me/events`, confirmação de aviso) usam o guard global e agem só sobre o usuário autenticado; o corpo é validado com Zod (tipo de evento é enum fechado).
- O servidor decide tudo: o app só informa que algo aconteceu (por exemplo "ativei o lembrete") e o evento só vale uma vez; o cliente nunca manda o que foi desbloqueado.
- Conquista surpresa não vaza a descrição enquanto bloqueada (allowlist no DTO de saída).
- Idempotência: a chave primária de `user_achievements` impede duplicar; o check continua idempotente por `checkId`.
- Migration nova (nunca editar as aplicadas); sem dado sensível em log.

## Fora do escopo

- Novas roupas, chapéus, trajes e acessórios (primeiro item do backlog: estudo de roupas e acessórios).
- Níveis dos cenários no app (próxima etapa, depois das conquistas).
- Recompensas de moedas ou EXP por conquista.
- Notificação push de conquista.
- Redeploy do laboratório na Vercel.
