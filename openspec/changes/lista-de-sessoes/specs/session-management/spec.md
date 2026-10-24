## ADDED Requirements

### Requirement: Listar as sessões ativas

O sistema SHALL listar, para a pessoa autenticada, apenas as sessões ativas dela (refresh token não revogado e não expirado), com id, nome do aparelho, data de criação, último uso e se é a sessão atual.

#### Scenario: Duas sessões

- **WHEN** a pessoa entrou em dois aparelhos e consulta a lista com o token de um deles
- **THEN** a resposta traz as duas sessões, com `current` verdadeiro só na sessão do token usado

#### Scenario: Sessão de outra pessoa

- **WHEN** existe sessão de outra conta
- **THEN** ela nunca aparece na lista

#### Scenario: Rotação do refresh

- **WHEN** a sessão renova o refresh token
- **THEN** continua sendo uma única sessão, com o mesmo id e o último uso atualizado

### Requirement: Encerrar uma sessão

O sistema SHALL encerrar uma sessão da própria conta, revogando o refresh token dela na hora, e responder `404` para id que não existe ou é de outra conta.

#### Scenario: Encerrar outro aparelho

- **WHEN** a pessoa encerra a sessão de outro aparelho
- **THEN** o refresh token daquela sessão deixa de valer e as demais sessões continuam

#### Scenario: Encerrar a sessão atual

- **WHEN** a pessoa encerra a própria sessão atual
- **THEN** o efeito é o mesmo do logout: o refresh token atual deixa de valer

#### Scenario: Sessão de outra conta

- **WHEN** o id pertence a outra pessoa
- **THEN** a API responde `404` e nada é encerrado

### Requirement: Encerrar todas as sessões

O sistema SHALL encerrar todas as sessões da conta, inclusive a atual, em uma chamada.

#### Scenario: Sair de todos os aparelhos

- **WHEN** a pessoa pede para encerrar todas
- **THEN** nenhum refresh token da conta continua ativo e a lista fica vazia

### Requirement: Nome do aparelho

O sistema SHALL guardar o nome do aparelho enviado em `X-Device-Name` (até 80 caracteres, sem caracteres de controle) no refresh token, mantê-lo na rotação e usar um nome padrão quando ausente ou inválido.

#### Scenario: Cabeçalho ausente ou lixo

- **WHEN** o cabeçalho não vem ou traz só caracteres de controle
- **THEN** a sessão aparece com o nome padrão "Aparelho desconhecido"
