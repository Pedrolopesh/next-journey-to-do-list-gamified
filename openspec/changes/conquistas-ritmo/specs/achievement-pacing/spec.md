## ADDED Requirements

### Requirement: Um modal por ação

O servidor SHALL gravar todas as conquistas que uma ação libera, mas MUST devolver na resposta da ação no máximo uma: a pendente mais antiga (empate: ordem do catálogo). As demais SHALL aparecer, uma por vez, nas ações seguintes. O app MUST NOT abrir mais de um modal de conquista por ação nem ao abrir.

#### Scenario: Várias liberadas de uma vez

- **WHEN** um check libera quatro conquistas
- **THEN** a resposta traz uma; ao confirmar, a ação seguinte traz a próxima, até esvaziar, sem repetir as confirmadas

#### Scenario: Coleção em cadeia

- **WHEN** a conquista número 14 libera Medalhista na mesma avaliação
- **THEN** ela fica pendente e aparece numa ação seguinte, não junto da anterior

### Requirement: Critérios espaçados

Os critérios SHALL seguir a tabela aprovada na página "Conquistas v2" do laboratório: nenhum contador repete o limite de outro, e as regras "no mesmo dia" (Equilíbrio, Vida em equilíbrio, Pódio, Dia perfeito) pedem vários dias.

#### Scenario: Equilíbrio

- **WHEN** o jogador faz checks em 3 categorias no mesmo dia, em 10 dias diferentes
- **THEN** Equilíbrio é liberada no 10º dia, e não antes

#### Scenario: Conquistas já ganhas

- **WHEN** o jogador já tinha uma conquista cujo critério ficou mais difícil
- **THEN** ela continua desbloqueada e não reabre modal
