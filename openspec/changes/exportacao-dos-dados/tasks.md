## 1. Contrato e API

- [x] 1.1 `dataExportSchema` no contrato e teste
- [x] 1.2 Serviço de exportação (campos permitidos, só da conta) com limite de 3 por hora e evento `data_exported`
- [x] 1.3 Rota `GET /v1/me/export`; e2e (completo, sem segredo, sem dados de outra conta, limite, autenticação)

## 2. App

- [x] 2.1 Botão "Exportar meus dados" em Configurações com folha de compartilhamento, carregando e toast; teste de componente

## 3. Documentação e verificação

- [x] 3.1 `docs/PRIVACIDADE.md` e `SEGURANCA.md`; requisição no Bruno
- [x] 3.2 `pnpm run verify` verde, `/code-review` tratado
