# Política de segurança

O Next Journey é um projeto aberto. Segurança é prioridade: se você encontrou uma vulnerabilidade, **não abra uma issue pública**.

## Como reportar

Use o reporte privado do GitHub: aba **Security** do repositório → **Report a vulnerability**. Descreva o impacto, os passos para reproduzir e, se possível, uma sugestão de correção.

Você receberá uma resposta em até 7 dias. Pedimos que não divulgue publicamente antes da correção estar disponível.

## Escopo

- Código deste repositório (API, app, banner, pacotes compartilhados).
- Configurações de exemplo (`.env.example`, workflows de CI).

Fora de escopo: a infraestrutura de produção (servidores, domínios) e serviços de terceiros.

## Se você replicar o projeto

Gere os seus próprios segredos (JWT, banco, e-mail, chaves de login social). Nunca reutilize valores de exemplo em produção.

## Para quem contribui

Antes de abrir PR, rode `pnpm run security` e siga o checklist de `docs/SEGURANCA.md`. Nunca commite segredos, `.env` ou dados de infraestrutura.
