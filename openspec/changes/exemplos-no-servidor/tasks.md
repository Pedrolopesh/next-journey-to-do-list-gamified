## 1. Catálogo e semeadura na API

- [x] 1.1 Criar `starter-items.ts` com o catálogo (os 30 exemplos atuais do app: tipo, título em português, dificuldade e categoria padrão) e teste de contrato do catálogo (títulos de 1 a 120 caracteres e únicos, categorias existentes em `DEFAULT_CATEGORIES`, diários com os 7 dias)
- [x] 1.2 Criar `StarterItemsService.seed(tx, { userId, timezone, now })` no módulo de itens: `createMany` com `isExample: true`, `createdOn` no fuso do perfil, categoria padrão com queda para a primeira, sem tocar em `items_created` nem em conquistas; teste de unidade/integração
- [x] 1.3 Adicionar a opção `SEED_STARTER_ITEMS` (padrão ligada) à configuração validada do ambiente, com teste da configuração e entrada no `.env.example` da API

## 2. Ligar à criação da conta

- [x] 2.1 `verifyEmail`: transação com a confirmação mais a semeadura; fechar a questão aberta do consumo do código e cobrir a falha da semeadura (conta continua pendente e o código continua válido)
- [x] 2.2 Login social: criar usuário e semear na mesma transação; vincular a conta existente e login comum não semeiam
- [x] 2.3 Desligar a opção em `apps/api/test/setup-env.ts` e fazer `createTestApp` aceitar ligá-la; rodar os e2e existentes sem mudar nenhum teste
- [x] 2.4 Novos e2e: confirmação semeia; social semeia; login e vínculo não semeiam; `items_created` continua 0 e nenhuma conquista de criação sai; primeiro check só libera "Primeiro passo"; opção desligada não semeia

## 3. Contrato e app

- [x] 3.1 Remover `example` de `createItemRequestSchema` e dos testes de contrato; `items.service` grava `isExample: false` fixo; ajustar os e2e de `conquistas-sem-itens-de-exemplo` que enviavam `example: true` para semear pelo serviço
- [x] 3.2 Remover do app `use-starter-examples.ts`, `examples.ts`, seus testes, o uso em `app/(tabs)/_layout.tsx`, os textos `examples.*` do `pt-BR.json` e a chave `nextjourney.examples.v1.*` (sem migração do AsyncStorage: a chave solta é inofensiva)
- [x] 3.3 Conferir no app que nenhuma tela dependia dos exemplos (estado vazio, Home, histórico) e que nenhum texto ficou órfão

## 4. Verificação e documentação

- [x] 4.1 Atualizar `ui-tests.mjs` (comentário sobre os 100 itens de exemplo) e `docs/TESTES.md`; registrar no `HANDOFF.md` a exceção dos textos no servidor e a ordem de publicação (API antes do app)
- [ ] 4.2 Rodar `pnpm run verify` e a suíte Maestro (iOS e Android) contra a API local com a opção ligada para ao menos uma conta confirmada pelo fluxo real
- [ ] 4.3 Abrir o PR com "Riscos e pendências" (ordem de publicação, contas existentes sem reabastecimento, toast removido) e `/code-review` antes
