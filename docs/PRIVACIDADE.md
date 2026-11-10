# Privacidade: mapa de dados coletados

Base para preencher as *Privacy Nutrition Labels* (App Store) e o *Data Safety* (Google Play).
Revisar a cada funcionalidade nova que colete dado. O repositório é público: aqui ficam só as regras, nunca dados reais nem detalhes de servidor.

| Dado | Para quê | Ligado à identidade | Compartilhado com terceiros |
|---|---|---|---|
| Nome, e-mail | Conta e entrada por código | Sim | Resend (envio dos e-mails de código) |
| ID de login Google/Apple | Login social | Sim | Google/Apple, só na validação do login |
| Fuso horário | Virada do dia | Sim | Não |
| Itens, checks, EXP, nível, conquistas, personagem | Funcionamento do jogo | Sim | Não |
| Horário do lembrete | Notificação local | Sim | Não (agendada no aparelho) |
| Aparelhos conectados (nome do aparelho, datas de entrada e de último uso) | Lista de sessões da conta | Sim | Não |
| Meta, faixa etária e gênero (opcionais) e a escolha de receber lembretes | Personalizar a experiência e estatísticas de uso; a pessoa pode pular as perguntas | Sim | Não |
| Aceite dos Termos (data e versão) | Registro de consentimento | Sim | Não |
| Código de confirmação do e-mail | Provar a posse do e-mail | Sim (guardado só como hash) | Não |
| Contadores de tentativas (pedido e confirmação do código) | Frear abuso | Não (só hash do e-mail) | Não |
| Registros técnicos (requestId, erros, eventos de segurança) | Diagnóstico e detecção de abuso | Sem e-mail ou token; IP com o último número oculto | Sentry (quando ligado) |

## O que o app **não** coleta

Localização, contatos, fotos, identificador de publicidade, rastreamento entre apps e anúncios.

## Seus direitos (LGPD)

- **Acesso e portabilidade:** Configurações › "Exportar meus dados" entrega um arquivo com tudo o que a conta guarda sobre a pessoa (perfil, itens, checks, progresso, conquistas), sem tokens. Até 3 pedidos por hora.
- **Exclusão:** Configurações › "Excluir conta" (veja abaixo).
- **Correção:** nome, fuso e lembrete podem ser alterados no app.
- **Sessões:** Configurações › "Aparelhos conectados" mostra onde a conta está aberta e permite encerrar uma ou todas.

## Exclusão de conta

`DELETE /v1/me` (Configurações › Excluir conta): pede o código recebido por e-mail (ou um novo login com Google/Apple). Nome, e-mail e identidades sociais são
apagados na hora, as sessões são encerradas e o restante é removido de vez em até 30 dias.
A página web pública de pedido de exclusão (exigida pelas lojas) depende da hospedagem.

## Prazos de retenção

| Situação | Prazo |
|---|---|
| Conta excluída | Dados pessoais na hora; o restante em até 30 dias |
| Cadastro que nunca confirmou o e-mail | Apagado em 7 dias |
| Refresh token e código de confirmação expirados | Apagados 7 dias depois de expirar |
| Contadores de limite de tentativas | Até 1 dia |
| Backup do banco | Retenção de 7 dias (`docs/REQUIREMENTS.md`) |

## Incidente de segurança

Se houver incidente com dados pessoais, o responsável avisa as pessoas afetadas e a ANPD em prazo razoável, conforme a LGPD. O passo a passo interno fica fora do repositório.

## Onde os textos ficam

Os Termos de Uso e a Política de Privacidade são servidos pela própria API, em português: `GET /v1/legal/documents/:slug` (texto estruturado, que o app mostra) e `GET /legal/terms` e `GET /legal/privacy` (páginas HTML públicas; a segunda é a URL da política que as lojas pedem). O código dos textos está em `apps/api/src/modules/legal/`; mudou o texto, sobe `LEGAL_VERSION` em `packages/contracts`.

A faixa etária informada no app é um dado estatístico e opcional: a classificação etária de uso é a configurada na loja de aplicativos.

## Pendente antes das lojas

- Definir `LEGAL_CONTACT_EMAIL` nos ambientes hospedados (a seção de contato dos textos só aparece com ele) e conferir os textos com quem responde pelo produto.
- Confirmar a lista final de terceiros quando Sentry e Resend entrarem em produção.
