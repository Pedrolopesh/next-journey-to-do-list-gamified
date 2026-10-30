## Context

- O usuário é criado no `register` já com as categorias padrão (`DEFAULT_CATEGORIES`, `auth.service.ts`), mas pendente: só passa a valer em `verifyEmail`, que grava `emailVerifiedAt`. No login social a conta nasce confirmada, em `socialLogin`.
- Hoje o app cria os exemplos (`use-starter-examples.ts` e `examples.ts`, 137 linhas): uma `POST /items` por item, com `example: true`, depois de ver três listas vazias, e guarda a marca no AsyncStorage por usuário e aparelho. Cada criação chama `refreshGameData` (seis invalidações), que gerou a rajada de 429 no proxy.
- `items.service` já trata `isExample` (coluna `is_example`, sem incrementar `items_created`), e as conquistas já ignoram exemplos (`conquistas-sem-itens-de-exemplo`).
- `AuthModule` não importa `ItemsModule` e `ItemsModule` não importa `AuthModule`: não há ciclo ao ligar os dois.
- Os e2e usam `registerUser` (`apps/api/test/helpers.ts`), que passa pelo cadastro e pela confirmação do e-mail. Com a semeadura ligada, todo usuário de teste ganharia ~30 itens e quebraria contagens de lista.
- `ui-tests.mjs` confirma o e-mail direto no banco (`confirm-test-email.ts`), sem passar por `verifyEmail`; nesse caminho nada é semeado.

## Goals / Non-Goals

**Goals:**

- Conta nova já nasce com os exemplos, sem nenhuma chamada do app e sem 429.
- Criação atômica: a conta confirmada sempre tem o conjunto completo, ou a confirmação falha inteira.
- Remover do app o código e a marca por aparelho; manter o comportamento de conquistas e de contadores.

**Non-Goals:**

- Migrar contas existentes, mudar o catálogo, internacionalizar os exemplos, reduzir as invalidações do app.

## Decisions

1. **Quando semear: na confirmação do e-mail e na criação social, não no `register`.** O `register` cria contas pendentes que podem nunca ser confirmadas; semear ali enche o banco com itens que ninguém vai ver e a limpeza de contas pendentes teria de apagá-los. A confirmação é um evento de uma vez só (o código é consumido), o que dá a idempotência de graça.
2. **Onde fica o código:** um catálogo puro em `apps/api/src/modules/items/starter-items.ts` (constante tipada, com o texto, o tipo, a dificuldade e o nome da categoria padrão) e uma função `seedStarterItems(tx, { userId, timezone, now })` no módulo de itens, exportada por um provider (`StarterItemsService`). `AuthService` a chama dentro da transação. Alternativa descartada: chamar `ItemsService.create` 30 vezes, que avalia conquistas e escreve estatística a cada item.
3. **Como inserir:** buscar as categorias da conta dentro da transação, montar as linhas e fazer um `createMany` em lote. `createdOn` vem de `diaLocal(now, timezone)`; `isExample: true`; `userStats.itemsCreated` não muda; `achievements.evaluate` não é chamado (nada que o exemplo faz conta para conquista). A categoria padrão que não existir cai na primeira categoria da conta, como hoje no app.
4. **Cadastro por senha:** `verifyEmail` hoje faz `user.update` e depois emite os tokens. Passa a ser uma transação (`$transaction`) com `update` mais `seedStarterItems`; falha na semeadura desfaz a confirmação e o mesmo código continua valendo (o consumo do código entra na mesma transação ou é revertido, a definir na implementação com teste).
5. **Login social:** a criação do usuário e a semeadura ficam na mesma transação (criar usuário com categorias, depois semear). Vincular a uma conta já confirmada (`linkIdentity`) não semeia; vincular a uma conta pendente a confirma e semeia na mesma transação. A semeadura só roda para conta sem itens, o que a torna segura contra repetição, e cada item recebe o `createdAt` do catálogo mais um milissegundo por posição, para a lista manter a ordem.
6. **Contrato:** remover `example` de `createItemRequestSchema`. O esquema é `z.object` sem `strict`, então um app antigo que ainda envie `example: true` tem o campo descartado; esse app, aliás, só criaria exemplos se as listas estivessem vazias, o que contas novas não têm mais. `items.service` passa a gravar `isExample: false` fixo no `create`.
7. **Textos no servidor, em português.** A fonte única dos títulos passa do `pt-BR.json` do app para o catálogo da API. Aceitável porque o produto é só em português; o custo de um segundo idioma fica registrado como fora do escopo.
8. **Opção `SEED_STARTER_ITEMS`** (booleana, padrão ligada) na configuração validada do ambiente (`apps/api/src/config`). `apps/api/test/setup-env.ts` a desliga; os testes de semeadura a ligam por `createTestApp`. Preferida a reescrever os 150 e2e, mas a troca existe: o ambiente de teste difere do de produção nesse ponto, e por isso os testes de semeadura cobrem o caminho real.
9. **Toast:** removido. Não há mais um evento no app para dispará-lo. Hipótese registrada: o estado inicial com itens já preenchidos basta como explicação; se a Home precisar de uma dica de boas-vindas, vira outro change.
10. **Contas existentes:** sem migração nem reabastecimento. Uma conta pendente que existir no momento da publicação e for confirmada depois ganha os exemplos, o que é o comportamento desejado.

## Risks / Trade-offs

- **Falha da semeadura trava a confirmação:** por ser atômica, um erro ao criar os exemplos deixa a conta pendente e o código válido, e a pessoa vê erro até a causa sumir. Escolha consciente: exemplos são opcionais, mas uma conta confirmada sem eles nunca seria reabastecida.
- **Duas conexões na confirmação:** a transação interativa segura uma conexão e as tentativas do código usam outra, de propósito, para valer mesmo se a transação desfizer. Sob carga alta a confirmação pode esperar por conexão.
- **App antigo com conta sem itens:** o `example: true` é descartado e os itens que esse app criar contam como criação do usuário. Só acontece com um app antigo numa conta vazia.
- **Ordem de publicação:** publicar a API primeiro (novas confirmações já semeiam); o app novo, que não cria mais exemplos, depois. Um app antigo com conta nova encontra itens e não recria; um app novo com conta antiga vazia só mostra o estado vazio.
- **Transação maior no `verifyEmail`:** um `createMany` de ~30 linhas, desprezível diante do `argon2` já pago na rota. O limite de tentativas continua valendo.
- **Ambiente de teste diferente do de produção** pela opção do item 8, mitigado por e2e dedicados da semeadura (senha, social, vínculo, falha).
- **Textos fora do `pt-BR.json`:** a regra "textos de interface só via i18n" é sobre texto de tela. Aqui os textos são dados de conteúdo gravados no banco; é uma exceção consciente a registrar no `HANDOFF.md`.
- **Testes de interface (Maestro):** como o utilitário de teste confirma o e-mail direto no banco, as contas do `ui-tests.mjs` não recebem exemplos e o "Item inicial" continua necessário; mudar esse script para exercitar a semeadura fica fora do escopo.

## Open Questions

- O consumo do código de confirmação entra na mesma transação da semeadura, ou a falha da semeadura reverte o consumo? A decisão depende de como `EmailVerificationService.consume` grava hoje e será fechada na tarefa 2.1 com teste.
