## ADDED Requirements

### Requirement: Insígnias 24×24 compartilhadas

A arte das 45 insígnias SHALL viver em um pacote de dados único, usado pelo app e pelo laboratório. O app MUST desenhar a insígnia pelo `glyph` do catálogo, e MUST NOT usar a arte antiga de 12×12 para conquistas.

#### Scenario: Mesma arte nos dois lugares

- **WHEN** o laboratório e o app mostram `primeiro-passo`
- **THEN** ambos usam a mesma grade de pixels e a mesma paleta

### Requirement: Galeria

A tela de conquistas SHALL listar por trilha, com a insígnia, o nome, a descrição, o progresso quando houver e a moldura na cor da classe. Conquista bloqueada SHALL aparecer apagada; surpresa bloqueada SHALL mostrar só uma pista.

#### Scenario: Surpresa bloqueada

- **WHEN** a galeria mostra uma surpresa bloqueada
- **THEN** aparece "Conquista surpresa" no lugar da descrição, vindo do i18n

#### Scenario: Estado de carregando e de erro

- **WHEN** a lista carrega ou falha
- **THEN** a tela mostra carregando e, no erro, mensagem com tentar de novo (RN-FB)

### Requirement: Modal único de conquista desbloqueada

Todo aviso de conquista SHALL usar o mesmo componente, com a classe e o `glyph` vindos do servidor, os botões "Continuar" e "Ver todas as conquistas". Várias conquistas pendentes SHALL entrar numa fila, uma por vez.

#### Scenario: Duas conquistas de uma vez

- **WHEN** uma ação desbloqueia duas conquistas
- **THEN** o modal aparece para a primeira e, ao continuar, para a segunda

#### Scenario: Ver todas

- **WHEN** o usuário toca em "Ver todas as conquistas"
- **THEN** o modal fecha, a conquista é confirmada e a galeria abre

### Requirement: Sem peças de recompensa no personagem

O formulário do personagem MUST NOT oferecer peças de conquista e o banner MUST NOT ter as roupas de recompensa.

#### Scenario: Formulário

- **WHEN** o usuário abre o personagem
- **THEN** só aparecem as peças livres e não há cadeado de conquista
