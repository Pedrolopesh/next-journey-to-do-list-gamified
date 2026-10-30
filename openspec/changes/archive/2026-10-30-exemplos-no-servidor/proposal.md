## Why

Hoje o app cria cerca de 30 itens de exemplo por API na primeira abertura de uma conta sem itens: uma chamada por item, e cada criação recarrega seis consultas. No teste contra o ambiente de dev isso passou do limite do proxy (429) logo depois do onboarding. A marca "já criei os exemplos" fica só no aparelho, então um aparelho novo com a conta vazia recria tudo, e uma falha no meio deixa a conta com metade dos exemplos. O servidor já cria as categorias padrão junto com a conta; os exemplos pertencem ao mesmo lugar.

## What Changes

- O servidor cria os itens de exemplo uma única vez, quando a conta passa a valer: na confirmação do e-mail (cadastro por senha) e na criação da conta por login social. Mesma transação que marca a conta como confirmada ou cria o usuário.
- Os exemplos nascem com `is_example = true`: não contam em `items_created` nem nas conquistas de criação (regra já definida em `conquistas-sem-itens-de-exemplo`).
- O app deixa de criar exemplos: saem `use-starter-examples.ts`, `examples.ts`, o teste correspondente, a marca por aparelho (AsyncStorage) e os textos `examples.*` do `pt-BR.json`.
- O campo `example` sai do contrato de criação de item (`createItemRequestSchema`), e o servidor deixa de aceitá-lo. Clientes antigos que ainda o enviem têm o campo ignorado e as contas novas já nascem com itens, então o app antigo não recria nada.
- O toast "Adicionamos alguns itens de exemplo" deixa de existir.
- Uma opção de ambiente (`SEED_STARTER_ITEMS`, ligada por padrão) permite desligar a semeadura nos testes e2e da API, que assumem usuário novo sem itens.
- Contas que já existem não são migradas nem reabastecidas.

## Capabilities

### New Capabilities

- `starter-items`: quando e como o servidor cria os itens de exemplo de uma conta nova, e o que eles não contam.

### Modified Capabilities

<!-- Nenhuma: as regras de contagem de conquistas continuam as de conquistas-sem-itens-de-exemplo. -->

## Impact

- `apps/api`: catálogo de exemplos (constante com teste), função de semeadura no módulo de itens chamada por `auth.service` (confirmação do e-mail e login social), opção `SEED_STARTER_ITEMS`, ajuste dos e2e. Sem migration: a coluna `is_example` já existe.
- `packages/contracts`: remoção de `example` do `createItemRequestSchema` e dos testes de contrato.
- `apps/mobile`: remoção do hook, do catálogo, dos textos e do toast; o app lista os itens que já vêm do servidor.
- Testes de interface (Maestro): `ui-tests.mjs` confirma o e-mail direto no banco e não passa pela semeadura; continua criando o "Item inicial". Sem mudança de fluxo.
- Documentação: `HANDOFF.md` e `docs/TESTES.md` (comentários sobre os exemplos).

## Segurança

- Nenhuma rota nova e nenhuma entrada do usuário no catálogo: os itens vêm de constantes do servidor, ligados ao `userId` da conta que acabou de ser criada (sem IDOR).
- A semeadura roda dentro da transação da confirmação: se falhar, a conta não é confirmada pela metade. O limite de tentativas da confirmação e o custo constante da resposta continuam como estão.
- Sem dado sensível em log: o log registra só a quantidade semeada, sem e-mail nem título.
- Remover `example` do contrato reduz o que o cliente controla.

## Fora do escopo

- Reabastecer ou migrar contas existentes; marcar exemplos antigos.
- Exemplos em outros idiomas (os textos ficam em português no servidor; se o app ganhar outro idioma, o cadastro precisará enviar o idioma).
- Mudar o conteúdo ou o tamanho do catálogo de exemplos.
- Remover a coluna `is_example` ou mudar as regras de conquista.
- Reduzir o número de consultas que `refreshGameData` recarrega (item de otimização à parte).
