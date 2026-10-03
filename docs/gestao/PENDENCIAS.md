# Gestão: pendências, decisões e próximos passos

Atualizado em 2026-10-03. Este documento reúne o que ficou **pendente** e o que **depende de decisão**, para ser feito depois, e termina com o status atual e os próximos passos do projeto.

> O repositório é público. Aqui entram só tarefas e regras gerais. Endereços, inventário e achados de auditoria da infraestrutura ficam no Obsidian e no board de tarefas, nunca neste arquivo (ver `docs/SEGURANCA.md`, seção 2).

## 1. Resumo

| # | Pendência | Quem decide/faz | Prioridade | Estado |
|---|---|---|---|---|
| 1 | Fechar na origem o achado de portas publicadas pelo Docker no servidor de hospedagem | Pedro | Alta | Mitigado; falta fechar (tarefa WEPARTY-185) |
| 2 | Trocar a senha do Postgres e os segredos do servidor | Pedro | Alta | Pendente |
| 3 | Revisar os logs do banco e do backend por acesso suspeito | Pedro | Alta | Pendente |
| 4 | Backup do Postgres: agendamento, cópia externa e teste de restauração | Pedro | Alta | Parcial |
| 5 | Revogar o token do npm exposto e gerar um novo | Pedro | Alta | Pendente |
| 6 | Escolher a licença do projeto aberto | Pedro | Média | Aguardando decisão |
| 7 | Apagar de vez os commits antigos no GitHub (suporte ou recriar o repositório) | Pedro | Média | Aguardando decisão |
| 8 | Confirmar as regras complementares da especificação | Pedro | Média | Aguardando decisão |
| 9 | Fase 0: contas e credenciais do projeto | Pedro | Média | Em paralelo |
| 10 | Desenhar no Figma as telas que faltam | Pedro | Média | Pendente |
| 11 | Escrever os ADRs 001, 002 e o do pnpm 11/TypeScript 5.9 | Pedro e agente | Baixa | Pendente |

## 2. Segurança da hospedagem (itens 1 a 4)

Detalhes e checklist completo estão no Obsidian (`IA/outputs/2026-10-02 - VPS We Party - correcoes e auditoria de seguranca.md`) e na tarefa **WEPARTY-185** do board. Aqui fica o resumo do que fazer e por quê.

### 2.1 Fechar a exposição de portas na origem (item 1)
- **Contexto.** O Docker publica portas direto no firewall do sistema (iptables) e **ignora o UFW**. Uma porta declarada como `5432:5432` no compose fica aberta para a internet mesmo com o UFW mostrando só 22/80/443.
- **Já feito (2026-10-03).** Mitigação por regras na cadeia `DOCKER-USER`, persistente no boot, com uma lista provisória de origens permitidas para não quebrar consumidores que ainda não foram identificados.
- **A fazer.**
  1. Identificar todos os consumidores das portas (agentes, projetos vizinhos, acessos manuais ao banco) e migrá-los para um caminho privado (túnel SSH, VPN ou rede privada).
  2. Esvaziar a lista provisória de origens permitidas.
  3. Corrigir o compose do backend, no repositório do projeto e no servidor, para publicar só em loopback (`127.0.0.1:<porta>:<porta>`). Sem isso, um novo deploy pode reabrir as portas se a regra de firewall for removida.
  4. Para o Next Journey, já nascer assim: portas só em `127.0.0.1` e nginx na frente.
- **Pronto quando.** As portas falham de fora sem depender da lista de origens e os consumidores funcionam por caminho privado.

### 2.2 Rotacionar segredos (item 2)
- Trocar a senha do usuário do Postgres e atualizar o `.env` do backend, seguida de reinício controlado (o backend roda as migrations ao subir e demora para ficar saudável).
- Revisar os demais segredos do `.env` do servidor (JWT, chaves de integração, e-mail) e trocar os que estiveram em um ambiente exposto.
- Registrar a data da troca no Obsidian.

### 2.3 Revisar logs (item 3)
- Procurar no log do Postgres e do backend acessos de endereços desconhecidos, tentativas de login e erros de autenticação do período em que a porta esteve aberta.
- Se aparecer login bem-sucedido de origem desconhecida, tratar como incidente: trocar todos os segredos, revisar os dados e avisar quem for afetado.

### 2.4 Backup do Postgres (item 4)
- Já existe um script de backup no servidor (`pg_dump` compactado). Falta confirmar:
  - agendamento (cron ou timer) e que ele realmente roda todo dia;
  - retenção de 7 dias, como pede a especificação (RNF de disponibilidade);
  - **cópia fora do servidor** (um backup só na mesma máquina não protege contra perda da máquina);
  - **teste de restauração**: restaurar um backup em um banco de teste e conferir os dados. Backup nunca restaurado não é backup.
- Para o Next Journey, repetir o desenho com job próprio (Fase 7, passo 6 do plano).

## 3. Token do npm: revogar e gerar um novo (item 5)

**Por quê.** Durante a sessão de 2026-10-02 o conteúdo do `~/.npmrc` apareceu em saída de terminal, incluindo um token de autenticação do npm. Ele não está no repositório, mas deve ser tratado como comprometido.

**Primeiro, revogar o antigo.**
1. Entre em npmjs.com, abra o avatar → **Access Tokens**.
2. Localize o token em uso (compare o prefixo e a data de criação) e clique em **Delete/Revoke**.
3. Se não tiver certeza de qual é, revogue todos os tokens antigos e gere só os que for usar.

**Precisa mesmo de um novo?** Instalar pacotes públicos (todo o Next Journey) **não exige token**. Só gere um novo se for **publicar pacotes** ou **instalar pacotes privados**. Se não precisar, remova a linha `_authToken` do `~/.npmrc` e pronto.

**Se precisar, gere assim.**
1. npmjs.com → avatar → Access Tokens → **Generate New Token** → **Granular Access Token**.
2. Dê um nome que diga o uso (ex.: `notebook-pedro-leitura`).
3. Permissão mínima: **Read-only**, limitada aos pacotes/escopos necessários. Use **Read and write** só se for publicar.
4. Defina **validade curta** (30 a 90 dias) e, se possível, restrinja por IP.
5. Se a conta pedir autenticação em dois fatores para publicar, mantenha ligada.

**Onde guardar e como usar.**
- **Gerenciador de senhas** (Bitwarden): salve o token lá, com a data de criação e de validade. É o único lugar onde ele fica em texto.
- **No computador**: não cole o valor no `~/.npmrc`. Use uma variável de ambiente e referencie no arquivo:
  ```
  //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  ```
  e exporte `NPM_TOKEN` a partir do gerenciador de senhas ou do Keychain do macOS quando precisar.
- **No CI (GitHub Actions)**: Settings do repositório → **Secrets and variables** → **Actions** → **New repository secret** (nome `NPM_TOKEN`) e use `${{ secrets.NPM_TOKEN }}` no workflow. Só crie o secret se um workflow realmente precisar dele (o CI atual não precisa).
- **Nunca** em: código, `.env` versionado, docs, commits, descrição de PR, conversa com agente, saída de terminal. Antes de listar um arquivo de credenciais, filtre os valores.
- Registre no Obsidian a data da troca e quando o novo expira.

O mesmo vale para os demais tokens do projeto quando existirem (`EXPO_TOKEN`, Sentry, Resend, chaves OAuth): cofre de senhas como origem, GitHub Secrets/EAS Secrets como destino, nunca o repositório.

## 4. Decisões que dependem de você

### 4.1 Licença do projeto (item 6)
O `LICENSE` atual diz "todos os direitos reservados", o que contradiz um projeto aberto. Opções para o **código**:

| Licença | O que permite | Quando escolher |
|---|---|---|
| MIT | Usar, copiar, modificar e vender, mantendo o aviso de copyright | Máxima liberdade; é a mais comum em projetos abertos |
| Apache-2.0 | Parecida com a MIT, com concessão explícita de patentes | Quer proteção de patente para quem usa e para você |
| AGPL-3.0 | Quem modificar e oferecer como serviço precisa abrir o código | Quer impedir que alguém feche e venda como serviço |

A **arte LPC** (sprites e tiles) costuma vir sob CC-BY-SA ou GPL, que exigem créditos e podem exigir compartilhar igual. Por isso o plano manda manter um `CREDITS.md` e verificar a compatibilidade antes de congelar a arte (Fase 6, passo 6). Recomendação: código sob MIT (ou Apache-2.0) e a pasta de arte com licença e créditos próprios, em arquivo separado. Depois de escolher, trocar o `LICENSE`, o campo `license` dos `package.json` e o README.

### 4.2 Apagar de vez os commits antigos (item 7)
A `main` foi reescrita e a branch padrão corrigida, mas as referências dos PRs antigos ainda deixam os commits antigos acessíveis por SHA direto. Duas saídas:
- **Suporte do GitHub**: abrir um pedido para remover referências e visões em cache de dados sensíveis. Mantém o repositório e os PRs.
- **Recriar o repositório**: apaga tudo de uma vez, incluindo os PRs, e exige reconfigurar proteção de branch, secrets e segurança.
Com a mitigação da infraestrutura já aplicada, o risco restante é baixo; a decisão é de higiene.

### 4.3 Regras complementares (item 8)
Em `docs/REQUISITOS.MD`, seção "Regras complementares", há 15 regras propostas (ex.: capítulo fechado não pode ser desmarcado; bônus de nível não é revertido; definições exatas das conquistas). Confirmar ou ajustar, para virarem testes na Fase 3.

## 5. Outras pendências

- **Fase 0 (paralela, depende de terceiros):** conta Apple Developer e Google Play (a aprovação demora dias), conta Expo/EAS, conta Sentry, conta Resend com domínio de envio verificado, projetos OAuth (Google e Apple), política de privacidade publicada e cofre de segredos compartilhado. Detalhes em `docs/PLAN_TODO_APP.md`, Fase 0.
- **Figma:** desenhar Conquistas, modal de conquista, Minha história, Categorias, Configurações, aceite de Termos no cadastro e Créditos. A exclusão de conta não terá tela dedicada (linha em Configurações › Conta com diálogo de confirmação).
- **ADRs:** ADR-001 (hospedagem, sem endereços), ADR-002 (monorepo com pnpm + Turborepo) e um ADR curto sobre pnpm 11.28.3 e TypeScript ~5.9. O plano pede o ADR-002 no passo 14 da Fase 1.
- **Segurança contínua:** a cada PR, `pnpm run security` e o checklist de `docs/SEGURANCA.md`.

## 6. Status atual (2026-10-03)

| Área | Estado |
|---|---|
| Fase 0 (contas e credenciais) | Não iniciada; só decididos nome (Next Journey), bundle id, hospedagem e e-mail (Resend) |
| Fase 1 (fundação do monorepo) | Passos 1 a 13 concluídos e na `main`; falta o passo 14 (ADR-002) |
| Fases 2 a 8 | Não iniciadas |
| CI | Verde na `main`: lint, typecheck, test, build e varredura de segurança |
| Repositório | Público de propósito; `main` protegida (PR + CI verde); secret scanning, push protection e Dependabot ativos; `SECURITY.md` publicado |
| Hospedagem | Decidida (VPS própria, em Docker); sem deploy; auditoria de segurança em andamento |
| Aguardando sua decisão | Licença (4.1), limpeza do histórico no GitHub (4.2), regras complementares (4.3), revogação do token (seção 3) |

## 7. Próximos passos

1. **Decidir** a licença e as regras complementares (4.1 e 4.3). Com isso, o agente atualiza o `LICENSE`, os `package.json` e a especificação.
2. **Revogar o token do npm** (seção 3) e **trocar a senha do Postgres** (2.2). São rápidos e eliminam riscos conhecidos.
3. **Fechar o WEPARTY-185** (seção 2) antes de qualquer deploy do Next Journey.
4. **Fase 1, passo 14:** escrever o ADR-002 e o ADR do pnpm/TypeScript, e marcar a Fase 1 como concluída na tabela de Andamento.
5. **Fase 0 em paralelo:** abrir as contas Apple Developer e Google Play já, por causa do prazo de aprovação, e criar Expo, Sentry e Resend.
6. **Fase 2:** criar `apps/mobile` (Expo) com o banner em CSS dentro de um WebView e medir o desempenho em um Android intermediário e em um iPhone. O ADR-003 decide se o WebView continua (gate do plano).
7. **Fase 3 e seguintes:** regras de progressão e contratos, primeira fatia ponta a ponta (Marco 1) e o restante conforme o plano.
