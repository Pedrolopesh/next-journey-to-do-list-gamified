# Fase 7 — Endurecimento: registro parcial

- Início: 2026-10-09
- Status: em andamento; esta entrega cobre API segura, exclusão de conta e fila offline

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 | Fila offline: checks sem rede ficam guardados no aparelho e são reenviados em ordem, com espera crescente | feito (`apps/mobile/src/features/offline`); falta testar em modo avião no aparelho |
| 2 | Lembretes locais com `expo-notifications` | pendente |
| 3 | Sentry no app, API e banner | pendente (precisa da conta e do DSN da Fase 0) |
| 4 | Exclusão de conta | feito: `DELETE /v1/me` anonimiza na hora e apaga de vez em 30 dias (rotina diária); linha "Excluir conta" em Configurações; falta a página web pública de solicitação, que depende da hospedagem |
| 5 | Segurança da API: helmet, CORS restrito, rate limit mais rígido nas rotas de auth | feito |
| 6 | Backups do Postgres | pendente (depende da VPS) |
| 7 | Acessibilidade | pendente |
| 8 | Performance | pendente |
| 9 | Reduzir movimento no banner | pendente |
| 10 | OTA com `expo-updates` | pendente (precisa da conta Expo) |
| 11 | Privacidade das lojas | pendente |

## Como a fila offline funciona

1. Se o envio do check falha por falta de rede, timeout, limite de taxa (429) ou erro 5xx, o check
   entra na fila (persistida no aparelho) e o item continua marcado na tela.
2. O envio é reenviado ao abrir o app, quando a conexão volta, quando o app volta ao primeiro plano e
   com espera crescente (1 s até 60 s) enquanto sobrar fila.
3. A ordem é preservada: a fila para no primeiro erro que vale repetir.
4. O `checkId` torna o reenvio idempotente: o servidor responde igual se o check já foi aplicado. Erros
   definitivos (4xx, como "já marcado") descartam só aquele item.
5. Desfazer um check que ainda está na fila apenas o tira da fila.
6. Ao sair da conta, a fila é apagada.

## Segurança da API

- `helmet` em todas as respostas (a CSP só relaxa quando o Swagger está ligado, fora de produção).
- CORS desligado por padrão; liga só com `CORS_ORIGINS`.
- Rate limit por IP: 120/min no geral e 10/min nas rotas de autenticação (`THROTTLE_*`). Atrás de proxy
  reverso, ligue `TRUST_PROXY=true`, senão todos os usuários parecem ter o mesmo IP.
- O token de acesso de uma conta excluída continua válido até expirar (15 min), mas todas as consultas
  filtram contas excluídas e as sessões de renovação são revogadas na hora.
