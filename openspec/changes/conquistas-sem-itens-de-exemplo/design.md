## Decisions

1. **Flag no item, enviada na criação.** Alternativa descartada: o servidor deduzir exemplo pelo título ou pelo ritmo de criação (frágil). O app já sabe quando está criando exemplos (`useStarterExamples`).
2. **Só o que mede "criação" ignora exemplos.** Checks em itens de exemplo continuam valendo para EXP e para as conquistas de hábito, diário e tarefa, porque são ações do jogador.
3. **Contas antigas.** A migration só cria a coluna (padrão falso). Itens de exemplo antigos de contas de desenvolvimento foram marcados à mão no banco local; não há usuários em produção.
