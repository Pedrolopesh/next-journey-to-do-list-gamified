# API: documentação interna

Como a API (`apps/api`, NestJS + Prisma + PostgreSQL) funciona por dentro. Estes documentos guardam as **regras de negócio e de funcionamento** que antes ficavam em comentários longos no código; o código mantém só comentários curtos, quando o motivo de uma linha não é óbvio (regras 11 e 12 do `AGENTS.md`).

| Documento | Assunto |
|---|---|
| [autenticacao-e-sessoes.md](autenticacao-e-sessoes.md) | cadastro, confirmação de e-mail, login, senha, login social, tokens, sessões, limite de tentativas |
| [progressao-e-jogo.md](progressao-e-jogo.md) | EXP, níveis, moedas, capítulos, sequência, conquistas |
| [itens-e-checks.md](itens-e-checks.md) | itens, categorias, marcar e desmarcar, histórico |
| [conta-e-privacidade.md](conta-e-privacidade.md) | exclusão de conta, purga e exportação de dados |
| [operacao-e-seguranca.md](operacao-e-seguranca.md) | guard, erros, logs, eventos de segurança, variáveis de ambiente |

Complementam, sem repetir:

- decisões e motivos: `docs/adr/` (principalmente o [ADR-0008](../adr/0008-autenticacao-e-sessao.md));
- checklist e auditorias de segurança: [`docs/SEGURANCA.md`](../SEGURANCA.md);
- dados coletados e prazos: [`docs/PRIVACIDADE.md`](../PRIVACIDADE.md);
- requisitos do produto: [`docs/REQUISITOS.MD`](../REQUISITOS.MD);
- comportamento exigido, por capacidade: `openspec/specs/`.

## Mapa dos módulos

| Pasta em `apps/api/src` | Responsabilidade |
|---|---|
| `modules/auth` | cadastro, login, tokens, sessões, limite de tentativas, limpeza diária |
| `modules/progression/domain` | regras de jogo como funções puras (EXP, nível, desfazer, sequência, conquistas, datas) |
| `modules/items` | itens, marcar e desmarcar, histórico, itens de exemplo |
| `modules/achievements` | avaliação e entrega das conquistas |
| `modules/stories`, `modules/me`, `modules/home`, `modules/categories` | histórias, perfil e personagem, tela inicial, categorias |
| `modules/account` | exclusão, purga e exportação |
| `modules/security` | eventos de segurança e alertas |
| `common`, `config`, `prisma` | guard, filtros, pipes, relógio, ambiente, banco |
