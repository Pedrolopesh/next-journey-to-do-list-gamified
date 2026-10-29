# Laboratório na Vercel: publicação pelo Git

O laboratório (`apps/banner/lab.html`: roupas, cenários, botões, conquistas) é um site estático de revisão. O projeto da Vercel do laboratório fica **ligado a este repositório**: a Vercel observa os pushes e publica sozinha. Não há token, workflow nem segredo no GitHub.

## O que acontece

| Evento | Resultado |
|---|---|
| Push em qualquer branch | **Preview** na Vercel (a URL aparece no commit/PR do GitHub) |
| Push (merge de PR) na `main` | **Produção** |

A configuração do build mora em `apps/banner/vercel.json` (a Vercel lê o arquivo na pasta raiz do projeto): compila, pelo Turbo, os pacotes compartilhados de que o banner depende (hoje `contracts` e `insignias`), roda `build:lab` e serve `dist-lab`, com o `lab.html` na raiz.

## Configuração única (quem tem acesso à Vercel)

No projeto do laboratório, na Vercel:

1. **Settings → Git → Connect Git Repository:** escolha este repositório (a Vercel pede para instalar o app dela no GitHub, só para este repositório).
2. **Settings → General → Root Directory:** `apps/banner`, com "Include source files outside of the Root Directory" ligado (o laboratório usa pacotes de `packages/`).
3. **Settings → Git → Production Branch:** `main`.
4. **Settings → Environment Variables:** `ENABLE_EXPERIMENTAL_COREPACK=1`, para a Vercel usar o pnpm fixado no `packageManager` do `package.json` (o padrão dela pode ser outra versão e não ler o lockfile).
5. **Settings → Deployment Protection:** deixe a proteção ligada para **previews**. Eles são públicos por padrão em alguns planos, e uma branch pode ter arte ainda sem revisão de licença.

O resto (comando de build, pasta de saída, rota da raiz) vem do `vercel.json` do repositório.

## Observações

- A Vercel constrói a cada push, mesmo quando só o app ou a API mudou. O build do laboratório leva segundos, mas conta nos minutos de build e na fila do plano da Vercel; se os deploys travarem, olhe o uso do plano.
- Esse build só roda na Vercel: nenhuma CI do repositório o exercita. O primeiro deploy depois de conectar é o teste; se falhar, o log está no projeto da Vercel.
- Preferimos não filtrar por pasta (o "Ignored Build Step" da Vercel): um filtro mal feito deixaria o laboratório desatualizado sem aviso.
- O laboratório é público: só entra arte CC0, OGA-BY ou CC-BY, com crédito (regra do `AGENTS.md`). Peças só CC-BY-SA ou GPL não podem ter imagem no site.

## Voltar atrás

Na Vercel (projeto do laboratório → Deployments), escolha um deploy anterior e use "Promote to Production". Ou reverta o commit na `main`: o push seguinte publica o estado revertido.
