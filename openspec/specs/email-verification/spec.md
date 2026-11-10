# email-verification Specification

## Purpose

TBD - created by archiving change verificacao-de-email-no-cadastro. Update Purpose after archive.

## Requirements

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

### Requirement: Login social vincula só com e-mail verificado pelo provedor

O sistema SHALL criar conta ou vincular a uma conta existente somente quando o provedor (Google ou Apple) informa `email_verified` verdadeiro. Ao vincular a uma conta ainda não confirmada (criada por código e nunca confirmada), o sistema SHALL confirmar a conta e revogar as sessões e os códigos abertos.

#### Scenario: Provedor não verificou o e-mail

- **WHEN** o ID token traz e-mail não verificado
- **THEN** a API não cria nem vincula conta e responde `400 EMAIL_NOT_VERIFIED_BY_PROVIDER`

#### Scenario: Conta pendente criada por código

- **WHEN** o e-mail verificado pelo provedor coincide com uma conta pendente criada por código
- **THEN** a conta é vinculada ao provedor, marcada como confirmada, e os códigos e sessões antigos deixam de valer

#### Scenario: Conta já confirmada

- **WHEN** o e-mail verificado pelo provedor coincide com uma conta confirmada
- **THEN** a conta é vinculada ao provedor e continua com as mesmas formas de entrada
