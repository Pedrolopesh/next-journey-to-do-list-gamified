# ADR-0009: decisões da Fase 5 (loop completo)

- Data: 2026-10-09
- Status: aceita
- Fase do plano: Fase 5

## Decisão

- **Progresso por história.** O capítulo vive em `story_progress` (por usuário e história); EXP, nível e moedas ficam em `user_stats`. Trocar de história preserva o progresso de cada uma. O check guarda a `story_id` em que contou, para o desfazer voltar o passo na história certa, mesmo que a ativa tenha mudado. Sem história ativa o check rende EXP e moedas, mas não conta capítulo.
- **Conquistas na mesma transação do check.** Cada conquista é liberada uma só vez (chave primária) e o resultado fica gravado no check, então repetir o `checkId` devolve as mesmas conquistas. A "Chama de 7 dias" e as demais regras são funções puras no domínio.
- **Cosméticos.** Recompensa de conquista só pode ser usada no personagem depois de liberada (`403 COSMETIC_LOCKED`).
- **Onboarding.** A API informa o que falta (`onboarding` em `GET /me`); o app só libera as abas com personagem e história (o tutorial é pulável). O app valida toda resposta com os schemas do contrato.
- **Login social.** O app manda só o ID token; a API valida com o provedor (Google: `google-auth-library`; Apple: `jose` com as chaves públicas). E-mail verificado coincidente vincula à mesma conta; e-mail não verificado nunca vincula nem cria (evita tomada de conta). Sem client id configurado a API responde `503`.
- **Recuperação de senha.** `202` sempre; link de uso único de 30 minutos, só o hash fica no banco; trocar a senha derruba todas as sessões. Envio pelo Resend; sem chave nada é enviado (desenvolvimento).
- **Prazo de tarefa** por atalhos (hoje, amanhã, em 7 dias), fim do dia no fuso do aparelho, sem seletor de data nativo nesta versão.
- **Testes de componente** com jest-expo e Testing Library; a lógica pura continua no Vitest.

## Consequências

- Mais colunas e tabelas; migrations aditivas e uma que troca as colunas de história de `user_stats`.
- O cadastro por e-mail ainda revela se o e-mail existe (limitação em `docs/SEGURANCA.md`); o login, o refresh e o "esqueci a senha" não.
- Notificações locais e a fila offline ficam para a Fase 7; o horário do lembrete já é guardado.
