## ADDED Requirements

### Requirement: Ordem do fluxo de entrada

O app SHALL mostrar, para quem não tem sessão, a Splash, as Boas-vindas, e (no caminho do e-mail) as telas de e-mail e de código; depois, em ordem, a introdução em 3 telas, a meta, os looks prontos, a personalização (opcional), o nome do personagem, a escolha de história, os lembretes, a idade, o gênero e a Home. "Pular" na introdução e "Pular" nos looks prontos SHALL seguir para a próxima etapa da ordem. Apple e Google SHALL seguir direto para a introdução.

#### Scenario: Caminho completo por e-mail

- **WHEN** uma pessoa nova entra por e-mail e confirma o código
- **THEN** o app mostra a introdução e segue a ordem até a Home

#### Scenario: Conta que já terminou o onboarding

- **WHEN** a pessoa entra e já tem personagem, história e tutorial visto
- **THEN** o app vai direto à Home

#### Scenario: Voltar

- **WHEN** a pessoa toca em voltar em qualquer tela do onboarding
- **THEN** o app volta para a tela de onde ela veio, exceto na Splash, nas Boas-vindas e na Home, que não têm voltar

### Requirement: Feedback em toda ação (RN-FB)

Toda ação que chama a API ou o sistema (enviar código, confirmar, criar personagem, ligar notificações, escolher história) SHALL mostrar carregando no botão e terminar em toast de sucesso ou de erro. O botão "Continuar" das perguntas de escolha única SHALL ficar desabilitado até haver uma escolha, com a razão visível. Idade e gênero SHALL ter "Pular".

#### Scenario: Código errado

- **WHEN** a pessoa confirma um código inválido
- **THEN** o botão volta ao normal e um toast de erro explica que o código é inválido ou expirou

#### Scenario: Reenvio

- **WHEN** a pessoa pede um novo código antes de 60 segundos
- **THEN** o botão "Reenviar" fica desabilitado com a contagem regressiva

### Requirement: Criação do personagem em três passos

O app SHALL oferecer looks prontos (5) com prévia fixa, "Sortear aparência" e "Pular"; a personalização opcional (corpo, pele, cabelo, roupa, calça, calçado e classe) e o nome do personagem, que é obrigatório. O rótulo de corpo SHALL ser "Opção 1" e "Opção 2". O título e o acessório SHALL sair do fluxo.

#### Scenario: Pular a personalização

- **WHEN** a pessoa toca em "Pular" nos looks prontos
- **THEN** o app vai ao nome do personagem com o look selecionado

#### Scenario: Nome vazio

- **WHEN** a pessoa toca em "Criar personagem" sem nome
- **THEN** o campo mostra a mensagem de erro e nada é enviado

### Requirement: Escolha de história e Home

O app SHALL mostrar as 6 histórias em cards com cenário, nome na cor da história e descrição; tocar no "i" abre um modal. A Home SHALL ter "Seu QG" com "Mudar personagem" e "Mudar história", sem "Mudar cenário do QG": o cenário do QG é o da história ativa.

#### Scenario: Ver detalhes

- **WHEN** a pessoa toca no "i" de um card
- **THEN** abre o modal da história e "Fechar" (ou tocar no fundo) volta aos cards

#### Scenario: Trocar a história principal

- **WHEN** a pessoa escolhe outra história pela Home
- **THEN** o banner e o cenário do QG passam a ser os da nova história
