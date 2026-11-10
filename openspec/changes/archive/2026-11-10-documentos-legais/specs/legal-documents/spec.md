## ADDED Requirements

### Requirement: Documentos legais como texto na API

O sistema SHALL servir os Termos de Uso (`terms`) e a Política de Privacidade (`privacy`) em português como texto estruturado em `GET /v1/legal/documents/:slug`, sem exigir autenticação. A resposta SHALL trazer `slug`, `version`, `title`, `updatedAt` (data `AAAA-MM-DD`) e `sections`, cada uma com `heading`, `paragraphs` e `bullets`. `version` SHALL ser igual a `LEGAL_VERSION` de `packages/contracts`. Um `slug` fora da lista SHALL dar `404`.

#### Scenario: Pedir a Política de Privacidade

- **WHEN** qualquer cliente, sem sessão, pede `GET /v1/legal/documents/privacy`
- **THEN** a API responde `200` com o documento, que passa no schema `legalDocumentSchema` e traz `version` igual a `LEGAL_VERSION`

#### Scenario: Documento que não existe

- **WHEN** o cliente pede `GET /v1/legal/documents/cookies`
- **THEN** a API responde `404` no formato padrão de erro

### Requirement: Página pública para as lojas

O sistema SHALL servir o mesmo texto em HTML simples em `GET /legal/:slug`, fora do prefixo `/v1`, sem autenticação, para ser usado como URL pública da política de privacidade. Todo texto SHALL sair com escape de HTML, e a página SHALL NOT carregar script nem recurso externo.

#### Scenario: Abrir a política no navegador

- **WHEN** alguém abre `GET /legal/privacy`
- **THEN** a API responde `200` com `content-type` `text/html`, o título e as seções do documento, sem `<script>`

### Requirement: Dado do controlador e contato opcional

Os documentos SHALL identificar a We Tech Hub Technologies Ltda como controladora. A seção de contato SHALL aparecer somente quando `LEGAL_CONTACT_EMAIL` estiver definido, e o e-mail SHALL vir do ambiente, nunca do repositório.

#### Scenario: Contato configurado

- **WHEN** a API sobe com `LEGAL_CONTACT_EMAIL` definido
- **THEN** a Política de Privacidade traz uma seção de contato com esse e-mail

#### Scenario: Contato não configurado

- **WHEN** a API sobe sem `LEGAL_CONTACT_EMAIL`
- **THEN** os documentos não trazem seção de contato nem e-mail

### Requirement: Textos fiéis ao que o app faz

A Política de Privacidade SHALL listar somente dados que o app trata (conta, perfil opcional, uso do jogo, aparelhos conectados e registros técnicos), os terceiros que de fato recebem dados, os direitos do titular com o caminho no app (exportar, excluir, corrigir, aparelhos) e os prazos de retenção de `docs/PRIVACIDADE.md`. SHALL declarar que a faixa etária e o gênero informados são opcionais e usados de forma estatística.

#### Scenario: Direitos com caminho no app

- **WHEN** a pessoa lê a seção de direitos
- **THEN** o texto aponta Configurações › "Exportar meus dados" e "Excluir conta" como os caminhos de acesso e de exclusão

### Requirement: Tela de documentos no app

O app SHALL mostrar o texto devolvido pela API em uma tela própria, aberta pelos links "Termos de Uso" e "Política de Privacidade" da tela de entrada e por linhas nas Configurações. A tela SHALL mostrar carregando enquanto busca, uma mensagem com "Tentar de novo" quando a busca falha e o texto rolável quando chega. Todo título de seção SHALL ter papel de cabeçalho para leitores de tela.

#### Scenario: Abrir os Termos na entrada

- **WHEN** a pessoa, sem sessão, toca em "Termos de Uso" na tela de entrada
- **THEN** o app abre a tela de documentos com o título e as seções do texto de `terms`, e o botão de voltar leva de volta à entrada

#### Scenario: API fora do ar

- **WHEN** a busca do documento falha
- **THEN** a tela mostra o erro com "Tentar de novo", e tocar nele busca de novo
