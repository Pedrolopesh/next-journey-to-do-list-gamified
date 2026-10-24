## ADDED Requirements

### Requirement: Cadastro por senha não cria sessão

O sistema SHALL responder o cadastro por senha com `202` e `{ status: "verification_sent" }`, sem tokens, tanto para e-mail novo quanto para e-mail já cadastrado (pendente ou confirmado), e SHALL mandar a mensagem adequada ao e-mail.

#### Scenario: E-mail novo

- **WHEN** alguém se cadastra com um e-mail que não existe
- **THEN** a API cria a conta com e-mail não confirmado, envia um código de 6 dígitos e responde `202` sem tokens

#### Scenario: E-mail já confirmado

- **WHEN** alguém se cadastra com um e-mail de conta já confirmada
- **THEN** a API responde `202` idêntico, não altera a conta e envia ao e-mail um aviso sem código

#### Scenario: E-mail pendente

- **WHEN** alguém se cadastra com um e-mail de conta ainda não confirmada
- **THEN** a API substitui nome, senha, fuso e aceite dos termos pela solicitação nova, invalida o código anterior, envia um código novo e responde `202`

### Requirement: Confirmação por código

O sistema SHALL confirmar o e-mail com um código numérico de 6 dígitos, válido por 15 minutos, de uso único, e SHALL exigir também a senha escolhida no cadastro. O código SHALL ser invalidado depois de 5 tentativas erradas.

#### Scenario: Código correto

- **WHEN** a pessoa envia e-mail, senha e código válidos de uma conta pendente
- **THEN** a conta passa a confirmada e a API devolve a sessão (`AuthResponse`)

#### Scenario: Código errado ou expirado

- **WHEN** o código está errado, expirado ou já usado
- **THEN** a API responde `400 INVALID_VERIFICATION_CODE`, sem dizer qual dos casos ocorreu, e conta a tentativa errada

#### Scenario: Muitas tentativas

- **WHEN** a quinta tentativa errada acontece no mesmo código
- **THEN** o código é invalidado e só um reenvio gera outro

#### Scenario: Senha diferente da cadastrada

- **WHEN** o código está certo mas a senha não confere com a da conta pendente
- **THEN** a API responde `400 INVALID_VERIFICATION_CODE` e a conta continua pendente

### Requirement: Reenvio do código

O sistema SHALL reenviar um código novo por `POST /auth/resend-verification`, responder sempre `202` (exista ou não a conta, esteja ou não confirmada) e respeitar um intervalo mínimo de 60 segundos entre envios para o mesmo e-mail.

#### Scenario: Reenvio para conta pendente

- **WHEN** a pessoa pede o reenvio e passou o intervalo mínimo
- **THEN** o código anterior é invalidado e um novo é enviado

#### Scenario: Reenvio dentro do intervalo

- **WHEN** o pedido chega antes de 60 segundos do último envio
- **THEN** a API responde `202` e não envia outro e-mail

#### Scenario: E-mail sem conta pendente

- **WHEN** o e-mail não existe ou já está confirmado
- **THEN** a API responde `202` idêntico e não envia código

### Requirement: Login exige e-mail confirmado

O sistema SHALL recusar o login por senha de conta com e-mail não confirmado, sem revelar a existência da conta a quem não sabe a senha.

#### Scenario: Senha certa, e-mail não confirmado

- **WHEN** a senha confere mas o e-mail não foi confirmado
- **THEN** a API responde `403 EMAIL_NOT_VERIFIED`, envia um código novo (respeitando o intervalo) e não devolve tokens

#### Scenario: Senha errada ou e-mail inexistente

- **WHEN** a senha não confere ou o e-mail não existe
- **THEN** a API responde `401` igual a hoje, independentemente de a conta estar confirmada

### Requirement: Login social só com e-mail verificado pelo provedor

O sistema SHALL criar conta ou vincular a uma conta existente somente quando o provedor (Google ou Apple) informa `email_verified` verdadeiro. Ao vincular a uma conta por senha não confirmada, o sistema SHALL confirmar a conta, apagar a senha dela e revogar as sessões abertas.

#### Scenario: Provedor não verificou o e-mail

- **WHEN** o ID token traz e-mail não verificado
- **THEN** a API não cria nem vincula conta e responde `400 EMAIL_NOT_VERIFIED_BY_PROVIDER`

#### Scenario: Conta por senha ainda pendente

- **WHEN** o e-mail verificado pelo provedor coincide com uma conta por senha pendente
- **THEN** a conta é vinculada ao provedor, marcada como confirmada, sem senha, e os códigos e sessões antigos deixam de valer

#### Scenario: Conta por senha já confirmada

- **WHEN** o e-mail verificado pelo provedor coincide com uma conta confirmada
- **THEN** a conta é vinculada como hoje e a senha continua valendo

### Requirement: Contas não confirmadas expiram

O sistema SHALL apagar contas que continuam sem confirmação 7 dias depois da criação, junto com os códigos delas.

#### Scenario: Expurgo diário

- **WHEN** o expurgo diário roda e existe conta não confirmada criada há mais de 7 dias
- **THEN** a conta e os códigos são apagados, e contas confirmadas ou mais recentes ficam intactas

### Requirement: Códigos protegidos

O sistema SHALL guardar apenas o hash do código, comparar em tempo constante e NÃO SHALL registrar em log o código, a senha ou o e-mail completo.

#### Scenario: Banco ou log lido

- **WHEN** alguém consulta a tabela de verificações ou os logs da API
- **THEN** não encontra o código em texto puro nem o e-mail completo
