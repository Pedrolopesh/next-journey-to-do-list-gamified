# ADR-0001: hospedagem da API e do banco em VPS própria, com Docker

- Data: 2026-10-02
- Status: aceita
- Fase do plano: Fase 0, passo 7

## Contexto

A API (NestJS) e o PostgreSQL precisam de hospedagem para staging e produção. A We Tech Hub já mantém uma VPS que roda outro projeto e, na medição de 2026-10-02, tinha CPU, memória e disco de sobra para mais um projeto, com carga em repouso.

## Decisão

- Hospedar a API e o Postgres do Next Journey na **VPS própria**, em **Docker**, com um **Postgres próprio** (volume próprio, projeto compose separado `next-journey`) e limites de memória e CPU por container.
- Publicar as portas da API e do banco **somente em loopback** (`127.0.0.1`). O nginx do host recebe 80/443, faz o TLS (certbot) e o proxy para a API.
- Staging e produção na mesma máquina, em projetos compose e portas distintos.
- Backup diário do Postgres com retenção de 7 dias, cópia fora da máquina e teste de restauração.
- Monitoramento externo simples do `GET /health`.
- E-mail transacional: Resend.

## Consequências

- Custo baixo e controle total, sem lock-in de plataforma.
- A máquina é **ponto único de falha** para os projetos hospedados nela; a meta de 99,5% ao mês depende de monitoramento externo e de backup testado.
- O Docker publica portas direto no firewall do sistema e **ignora o UFW**: qualquer porta declarada sem `127.0.0.1` fica aberta. Por isso a regra do loopback é obrigatória.
- Uma auditoria de segurança da máquina é pré-requisito do primeiro deploy (registrada fora do repositório).
- Se o uso crescer, migrar um dos projetos para outra máquina é o primeiro passo.
