# ADR-0006: repositório público de propósito e proteções de segurança

- Data: 2026-10-03
- Status: aceita
- Fase do plano: Fase 0, passo 5

## Contexto

O Next Journey é um projeto aberto: a ideia é que qualquer pessoa possa ver o código, entender como foi feito e replicar o projeto. Um repositório público expõe tudo o que for commitado, para sempre (clones, forks, caches). Na Fase 1, informações de infraestrutura chegaram a ser commitadas e precisaram ser removidas com reescrita do histórico.

## Decisão

Manter o repositório **público** e tratar segurança com um nível extra de cuidado:

- Assumir que o atacante lê todo o código; a segurança vem do desenho, nunca do segredo sobre como algo funciona.
- **Nada** de segredo, `.env`, certificado, IP, host ou achado de auditoria no repositório; só `.env.example` com valores falsos. Infraestrutura real e achados ficam fora (cofre de segredos e notas privadas).
- Proteções automáticas: varredura de segredos (`scripts/security-scan.sh`, rápida no CI e completa antes de todo PR), `pnpm audit`, hooks locais, secret scanning e push protection do GitHub, Dependabot, reporte privado de vulnerabilidades (`SECURITY.md`).
- `main` protegida: PR obrigatório e CI verde; sem force-push.
- **Revisão e aprovação do Pedro e varredura completa antes de subir qualquer PR** (`AGENTS.md`).
- Commits e PRs sem atribuição a ferramentas de IA.

## Consequências

- Um pouco mais de atrito em cada PR, em troca de risco muito menor de vazamento.
- Quem replicar o projeto gera os próprios segredos; nenhum valor nosso é necessário.
- Licença do código e da arte ainda precisa ser escolhida (pendência registrada fora do repositório).
