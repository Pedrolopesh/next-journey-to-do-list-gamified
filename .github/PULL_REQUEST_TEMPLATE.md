<!--
Título: tipo(escopo opcional): assunto em minúscula  (ex.: feat: histórico de tarefas no perfil)
Seja direto: frases curtas, no presente, sem história do que foi tentado. A CI confere as seções abaixo.
-->

## O que muda

<!-- Lista curta do resultado, por área (API, app, banner, contratos, docs). Uma linha por item. -->

## Por quê

<!-- A necessidade em uma ou duas frases. Cite a proposta do OpenSpec, o ADR ou o passo do plano. -->

## Como foi verificado

<!-- O que rodou e o resultado. Diga também o que NÃO foi verificado (ex.: iPhone físico). -->

- [ ] `pnpm run verify` passou (lint, tipos, testes, build, e2e da API, OpenSpec, duplicação, segurança)
- [ ] `/code-review` rodado e achados tratados antes de abrir o PR
- [ ] Mexeu em tela: fluxos do Maestro (`pnpm --filter @nextjourney/mobile test:ui`) e RN-FB (toda ação mostra carregando e termina em toast)

## Riscos e pendências

<!-- Migration (nome e como aplicar), seed, mudança de contrato, impacto em dados existentes, dívida técnica conhecida. "Nenhum" se não houver. -->

## Segurança

- [ ] Repositório público: sem segredo, token, IP, host ou dado de infraestrutura em código, docs, commits e nesta descrição
- [ ] Rotas novas protegidas, validadas com Zod e devolvendo só os campos necessários; sem acesso a objeto de outro usuário (IDOR)
- [ ] Nada sensível em log, erro, URL ou storage inseguro; dependência nova com nome conferido e lockfile junto
- [ ] Sem atribuição a ferramenta de IA nos commits nem aqui
