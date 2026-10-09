# Backup e restauração do Postgres

## Fazer um backup

```bash
DATABASE_URL=<url do banco> scripts/backup-db.sh /caminho/dos/backups
```

- Formato custom do `pg_dump`, arquivo `nextjourney-<data>.dump` com permissão 600.
- Apaga backups com mais de `BACKUP_RETENTION_DAYS` dias (padrão 14).
- Use `pg_dump` da mesma versão (ou mais antiga) do servidor. Com cliente mais novo a restauração
  avisa `transaction_timeout`, o que é inofensivo, mas evite.
- Agende no servidor (cron diário) e **copie os dumps para fora da máquina** (outro provedor ou
  armazenamento de objetos). Backup no mesmo disco não protege contra perda do disco.
- Os dumps contêm dados pessoais: nunca vão para o Git (`backups/` e `*.dump` estão no `.gitignore`)
  e devem ser guardados com acesso restrito.

## Testar a restauração (obrigatório a cada mudança de rotina)

```bash
# 1. crie um banco descartável, NUNCA o de produção
# 2. restaure e confira
RESTORE_DATABASE_URL=<url do banco descartável> scripts/restore-test.sh arquivo.dump
```

O script restaura, imprime a contagem das tabelas-chave e falha se o histórico de migrations vier
vazio. Teste feito em 2026-10-09 com o banco de testes local: 513 usuários, 375 itens, 446 checks,
5 histórias, 25 capítulos e 3 migrations restaurados.

## Recuperação de desastre (resumo)

1. Suba um Postgres novo na mesma versão maior.
2. `pg_restore --no-owner --dbname <url> arquivo.dump`.
3. Aponte `DATABASE_URL` da API para ele e suba a API.
4. Contas excluídas há mais de 30 dias voltam do backup antigo: rode a rotina de expurgo (ela roda
   sozinha às 03:00) antes de reabrir o serviço para respeitar a exclusão pedida.
