## Tarefa

<!-- Fase e passo do plano (ex.: "Fase 2, passo 7"), issue ou proposta OpenSpec. Sem tarefa? Explique o porquê. -->

## O que muda

<!-- O que foi feito e, principalmente, por quê. -->

## Como testar

<!-- Passo a passo. Se a rota mudou, inclua o curl ou o endpoint no Swagger. Se mexeu no app, diga o aparelho/simulador. -->

## Checklist

- [ ] Branch segue o padrão `<tipo>/<slug>` e os commits seguem Conventional Commits
- [ ] `pnpm run lint`, `typecheck`, `test` e `build` passam localmente
- [ ] Regra nova tem teste; mudança de comportamento está descrita acima
- [ ] Se alterou contrato (`packages/contracts`), rota ou protocolo do banner, os consumidores foram atualizados no mesmo PR
- [ ] Se alterou regra de jogo, contrato ou protocolo: há proposta/spec no OpenSpec ou ADR atualizado
- [ ] Se precisa de migration do Prisma, está sinalizado aqui (migration não é aplicada automaticamente)

## Segurança (obrigatório em todo PR)

- [ ] `pnpm run security` passou (segredos, IP/hosts, histórico novo e `pnpm audit`)
- [ ] Nenhum token, senha, chave, `.env`, certificado, IP ou host de infraestrutura no código, docs, testes, commit ou descrição do PR
- [ ] Checklist de segurança do `AGENTS.md` percorrido para o que mudou (API, app/banner ou dependências)
- [ ] Rotas novas nascem protegidas e devolvem só os campos necessários (sem model do ORM inteiro)
- [ ] Nada sensível em log, mensagem de erro, URL ou storage inseguro
- [ ] Dependência nova: nome conferido, lockfile versionado junto
- [ ] Sem atribuição a ferramentas de IA nos commits nem na descrição do PR
