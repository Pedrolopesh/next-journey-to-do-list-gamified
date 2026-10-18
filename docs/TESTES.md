# Testes: como o Next Journey se protege de regressão

O app é nativo (React Native). Cada camada de teste cobre um tipo de erro, e todas rodam do mais barato para o mais caro.

| Camada | Ferramenta | O que protege | Onde roda |
|---|---|---|---|
| 1. Regras de jogo (puras) | Vitest | EXP, moedas, desmarcar, critério de cada conquista, sequências | local e CI (`pnpm run test`) |
| 2. Componentes do app | Jest + Testing Library | botões, estados vazios, modal de conquista, fila de avisos | local e CI |
| 3. Contrato do catálogo | Vitest | o número no texto de cada conquista é o da regra; o laboratório diz o mesmo | local e CI |
| 4. API de ponta a ponta | Vitest + Supertest + Postgres | regras de negócio reais no banco: check, desmarcar, EXP uma vez só, um modal por ação, histórico, isolamento entre usuários | local e CI (`pnpm --filter @nextjourney/api test:e2e`) |
| 5. Interface do app | **Maestro** | o app de verdade num emulador: entrar, onboarding, criar, marcar, galeria, histórico | local (`pnpm --filter @nextjourney/mobile test:ui`) |

## Regressão retroativa

Regra de jogo nova entra com teste novo **e** os testes antigos continuam rodando. Os da camada 4 recriam o cenário de uso (usuário novo, dias passando pelo relógio falso) a cada execução, então qualquer mudança que quebre uma regra antiga falha na hora. A camada 5 repete a jornada do usuário para pegar o que as outras não veem: botão coberto, texto cortado, modal duplo.

## Por que Maestro e não Playwright

Playwright automatiza **navegadores**. O Next Journey é um app nativo com WebView; no navegador ele não é o mesmo app (sem SecureStore, sem gestos, sem WebView, sem o banner em canvas nativo). Maestro roda no emulador Android e no simulador iOS, com o app real, e os fluxos são arquivos YAML curtos que entram no Git. As alternativas pesadas (Detox, Appium) exigem build específico de teste e muito mais código. O Playwright continua útil para uma coisa: a página do laboratório (web), se um dia quisermos captura visual dela.

## Rodando a interface (Maestro)

Pré-requisitos, uma vez:

- Java 17 ou mais (`java -version`).
- Maestro (`~/.maestro/bin/maestro --version`). Instalação oficial: <https://docs.maestro.dev/getting-started/installing-maestro/macos>. O pacote do Homebrew chamado só `maestro` é outro produto; o certo é `mobile-dev-inc/tap/maestro`.
- Emulador Android aberto com o app de desenvolvimento instalado, Metro rodando e a API no ar (`PORT=3010 HOST=0.0.0.0`).

Comando:

```bash
pnpm --filter @nextjourney/mobile test:ui
```

O script `apps/mobile/scripts/ui-tests.mjs` cria uma conta de teste nova na API a cada execução (e-mail e senha aleatórios, só na memória; nada fica no repositório) e passa para o Maestro. Para rodar só alguns fluxos (o de entrada vai sempre primeiro, porque loga na conta nova):

```bash
UI_FLOW=.maestro/flows/00-entrar-e-onboarding.yaml,.maestro/flows/03-galeria-de-conquistas.yaml \
  pnpm --filter @nextjourney/mobile test:ui
```

## Fluxos (`apps/mobile/.maestro/flows`)

| Fluxo | O que confere |
|---|---|
| 00 entrar e onboarding | sessão antiga, tutorial, personagem, história; **uma** conquista pendente por vez |
| 01 criar e marcar tarefa | seletor de dificuldade com estrelas e botão X, modal depois de criar, EXP e moedas na API |
| 02 desmarcar | o EXP fica e as moedas diminuem (regra de desmarcar) |
| 03 galeria | trilhas, metas novas, progresso vindo do servidor, detalhe de uma conquista |
| 04 histórico e estado vazio | aviso no rodapé de Tarefas, histórico, desfazer, estado vazio |

Convenções:

- Textos e rótulos vêm do `pt-BR.json`; o fluxo usa o mesmo texto que o usuário vê. Mudou o texto, ajuste o fluxo.
- Avisos que somem em poucos segundos (toast) não são conferidos pela tela; o fluxo confere o estado na API (`.maestro/scripts/conferir-jogador.js`).
- Todo fluxo começa por `subflows/inicio.yaml`, que fecha modal, formulário ou tela deixados abertos por uma execução que falhou.
- Os fluxos dependem do anterior (mesma conta, mesma ordem). A ordem fica em `.maestro/config.yaml`.
- Relatório da última execução: `apps/mobile/.maestro/relatorio.xml` (ignorado pelo Git).

## O que falta

- Rodar a camada 5 no CI: precisa de um runner macOS com emulador (lento e caro); por ora é antes de abrir PR.
- Fluxo no iOS: o Maestro roda no simulador iOS, mas os fluxos só foram validados no Android.
- Comparação visual (captura de tela) das telas principais.
