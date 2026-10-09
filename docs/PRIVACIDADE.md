# Privacidade: mapa de dados coletados

Base para preencher as *Privacy Nutrition Labels* (App Store) e o *Data Safety* (Google Play).
Revisar a cada funcionalidade nova que colete dado.

| Dado | Para quê | Ligado à identidade | Compartilhado com terceiros |
|---|---|---|---|
| Nome, e-mail | Conta e recuperação de senha | Sim | Resend (envio do e-mail de recuperação) |
| Senha | Login (guardada só como hash argon2id) | Sim | Não |
| ID de login Google/Apple | Login social | Sim | Google/Apple, só na validação do login |
| Fuso horário | Virada do dia | Sim | Não |
| Itens, checks, EXP, nível, conquistas, personagem | Funcionamento do jogo | Sim | Não |
| Horário do lembrete | Notificação local | Sim | Não (agendada no aparelho) |
| Registros técnicos (requestId, erros) | Diagnóstico | Sem dados pessoais nos logs | Sentry (quando ligado) |

## O que o app **não** coleta

Localização, contatos, fotos, identificador de publicidade, rastreamento entre apps e anúncios.

## Exclusão de conta

`DELETE /v1/me` (Configurações › Excluir conta): nome, e-mail, senha e identidades sociais são
apagados na hora, as sessões são encerradas e o restante é removido de vez em até 30 dias.
A página web pública de pedido de exclusão (exigida pelas lojas) depende da hospedagem.

## Pendente antes das lojas

- Política de privacidade publicada em URL pública.
- Confirmar a lista final de terceiros quando Sentry e Resend entrarem em produção.
