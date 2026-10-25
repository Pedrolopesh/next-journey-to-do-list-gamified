# Privacidade: mapa de dados coletados

Base para preencher as *Privacy Nutrition Labels* (App Store) e o *Data Safety* (Google Play).
Revisar a cada funcionalidade nova que colete dado. O repositório é público: aqui ficam só as regras, nunca dados reais nem detalhes de servidor.

| Dado | Para quê | Ligado à identidade | Compartilhado com terceiros |
|---|---|---|---|
| Nome, e-mail | Conta, confirmação do e-mail e recuperação de senha | Sim | Resend (envio dos e-mails de código e de recuperação) |
| Senha | Login (guardada só como hash argon2id) | Sim | Não |
| ID de login Google/Apple | Login social | Sim | Google/Apple, só na validação do login |
| Fuso horário | Virada do dia | Sim | Não |
| Itens, checks, EXP, nível, conquistas, personagem | Funcionamento do jogo | Sim | Não |
| Horário do lembrete | Notificação local | Sim | Não (agendada no aparelho) |
| Aparelhos conectados (nome do aparelho, datas de entrada e de último uso) | Lista de sessões da conta | Sim | Não |
| Aceite dos Termos (data e versão) | Registro de consentimento | Sim | Não |
| Código de confirmação do e-mail, link de nova senha | Provar a posse do e-mail | Sim (guardados só como hash) | Não |
| Contadores de tentativas (login, cadastro, recuperação) | Frear abuso | Não (só hash do e-mail) | Não |
| Registros técnicos (requestId, erros, eventos de segurança) | Diagnóstico e detecção de abuso | Sem e-mail, senha ou token; IP com o último número oculto | Sentry (quando ligado) |

## O que o app **não** coleta

Localização, contatos, fotos, identificador de publicidade, rastreamento entre apps e anúncios.

## Seus direitos (LGPD)

- **Acesso e portabilidade:** Configurações › "Exportar meus dados" entrega um arquivo com tudo o que a conta guarda sobre a pessoa (perfil, itens, checks, progresso, conquistas), sem senha nem tokens. Até 3 pedidos por hora.
- **Exclusão:** Configurações › "Excluir conta" (veja abaixo).
- **Correção:** nome, fuso e lembrete podem ser alterados no app.
- **Sessões:** Configurações › "Aparelhos conectados" mostra onde a conta está aberta e permite encerrar uma ou todas.

## Exclusão de conta

`DELETE /v1/me` (Configurações › Excluir conta): pede a senha atual (ou um novo login com Google/Apple, em conta só social). Nome, e-mail, senha e identidades sociais são
apagados na hora, as sessões são encerradas e o restante é removido de vez em até 30 dias.
A página web pública de pedido de exclusão (exigida pelas lojas) depende da hospedagem.

## Prazos de retenção

| Situação | Prazo |
|---|---|
| Conta excluída | Dados pessoais na hora; o restante em até 30 dias |
| Cadastro que nunca confirmou o e-mail | Apagado em 7 dias |
| Refresh token, link de recuperação e código de confirmação expirados | Apagados 7 dias depois de expirar |
| Contadores de limite de tentativas | Até 1 dia |
| Backup do banco | Retenção de 7 dias (`docs/REQUISITOS.MD`) |

## Incidente de segurança

Se houver incidente com dados pessoais, o responsável avisa as pessoas afetadas e a ANPD em prazo razoável, conforme a LGPD. O passo a passo interno fica fora do repositório.

## Pendente antes das lojas

- Política de privacidade publicada em URL pública.
- Confirmar a lista final de terceiros quando Sentry e Resend entrarem em produção.
