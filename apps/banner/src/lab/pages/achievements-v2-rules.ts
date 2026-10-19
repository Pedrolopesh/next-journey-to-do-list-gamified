/**
 * Critérios das conquistas para o simulador de ritmo: `agora` espelha as regras do app; `proposta`
 * espaça os limites. Só o laboratório usa isto; a regra de verdade mora na API.
 */
export type Metric =
  | 'checks'
  | 'dailyChecks'
  | 'dailyDays'
  | 'tasksDone'
  | 'habitChecks'
  | 'habitDays'
  | 'activeDays'
  | 'streakDays'
  | 'itemsCreated'
  | 'itemsActive'
  | 'notesItems'
  | 'maxItemsDay'
  | 'maxHabitsDay'
  | 'balanced3Days'
  | 'balanced5Days'
  | 'podiumDays'
  | 'perfectDays'
  | 'dailyStreak'
  | 'habitStreak'
  | 'hardTasks'
  | 'onTimeTasks'
  | 'level'
  | 'coins'
  | 'chapters'
  | 'stories'
  | 'dailiesCreated'
  | 'tasksCreated'
  | 'habitsCreated'
  | 'lookChanges'
  | 'categoriesCreated'
  | 'reminder'
  | 'achievements';

export type Criterion = (
  | { m: Metric; t: number; desc: string }
  | { m: 'manual'; t: 0; desc: string }
  | { m: 'trail' | 'secrets'; t: 0; desc: string }
) & { name?: string };

const c = (m: Metric, t: number, desc: string, name?: string): Criterion => ({
  m,
  t,
  desc,
  ...(name ? { name } : {}),
});
const manual = (desc: string): Criterion => ({ m: 'manual', t: 0, desc });

export const ANTES: Record<string, Criterion> = {
  'primeiro-passo': c('checks', 1, 'Faça o seu primeiro check'),
  'diario-inaugural': c('dailiesCreated', 1, 'Crie o seu primeiro diário'),
  'primeira-tarefa': c('tasksCreated', 1, 'Crie a sua primeira tarefa'),
  'primeiro-habito': c('habitsCreated', 1, 'Crie o seu primeiro hábito'),
  'rotina-marcada': c('dailyChecks', 1, 'Marque o seu primeiro diário'),
  'tarefa-cumprida': c('tasksDone', 1, 'Conclua a sua primeira tarefa'),
  'habito-em-acao': c('habitChecks', 1, 'Marque o seu primeiro hábito'),
  'cara-nova': c('lookChanges', 1, 'Mude o visual do seu personagem'),
  voltou: c('activeDays', 2, 'Marque itens em 2 dias diferentes'),
  'hora-marcada': c('reminder', 1, 'Ative o lembrete diário'),
  'pena-leve': c('notesItems', 5, 'Escreva anotações em 5 itens'),
  'guarda-roupa': c('lookChanges', 5, 'Mude o visual do personagem 5 vezes'),
  'rotina-em-marcha': c('dailyChecks', 5, 'Marque 5 diários'),
  'rotina-firme': c('dailyChecks', 25, 'Marque 25 diários'),
  'rotina-de-ferro': c('dailyChecks', 100, 'Marque 100 diários'),
  'mestre-da-rotina': c('dailyChecks', 300, 'Marque 300 diários'),
  'dia-perfeito': c(
    'perfectDays',
    1,
    'Conclua todos os diários de um dia (com 3 ou mais agendados)',
  ),
  'chama-3-dias': c(
    'dailyStreak',
    3,
    'Conclua todos os diários agendados por 3 dias seguidos',
    'Chama de 3 dias',
  ),
  'chama-7-dias': c(
    'dailyStreak',
    7,
    'Conclua todos os diários agendados por 7 dias seguidos',
    'Chama de 7 dias',
  ),
  'chama-14-dias': c(
    'dailyStreak',
    14,
    'Conclua todos os diários agendados por 14 dias seguidos',
    'Chama de 14 dias',
  ),
  'chama-30-dias': c(
    'dailyStreak',
    30,
    'Conclua todos os diários agendados por 30 dias seguidos',
    'Chama de 30 dias',
  ),
  'pe-na-lista': c('tasksDone', 5, 'Conclua 5 tarefas'),
  executor: c('tasksDone', 25, 'Conclua 25 tarefas'),
  imparavel: c('tasksDone', 100, 'Conclua 100 tarefas'),
  'maquina-de-entregas': c('tasksDone', 300, 'Conclua 300 tarefas'),
  'lista-zerada': manual('Conclua todas as tarefas abertas (tendo ao menos 3)'),
  'no-prazo': c('onTimeTasks', 5, 'Conclua 5 tarefas antes do vencimento'),
  resgate: manual('Conclua uma tarefa que estava atrasada'),
  'peso-pesado': c('hardTasks', 5, 'Conclua 5 tarefas difíceis'),
  semente: c('habitDays', 10, 'Marque hábitos em 10 dias diferentes'),
  raiz: c('habitDays', 40, 'Marque hábitos em 40 dias diferentes'),
  arvore: c('habitDays', 120, 'Marque hábitos em 120 dias diferentes'),
  floresta: c('habitDays', 365, 'Marque hábitos em 365 dias diferentes'),
  'habito-em-chama': c('habitStreak', 3, 'Mantenha um mesmo hábito por 3 dias seguidos'),
  'habito-de-7': c(
    'habitStreak',
    7,
    'Mantenha um mesmo hábito por 7 dias seguidos',
    'Hábito de 7 dias',
  ),
  'habito-de-30': c(
    'habitStreak',
    30,
    'Mantenha um mesmo hábito por 30 dias seguidos',
    'Hábito de 30 dias',
  ),
  'habito-de-100': c('habitStreak', 100, 'Mantenha um mesmo hábito por 100 dias seguidos'),
  'dia-de-foco': c('maxHabitsDay', 5, 'Marque 5 hábitos diferentes no mesmo dia'),
  organizado: c('itemsCreated', 10, 'Crie 10 itens'),
  planejador: c('itemsCreated', 25, 'Crie 25 itens'),
  'arquiteto-da-rotina': c('itemsCreated', 50, 'Crie 50 itens'),
  maratonista: c('checks', 100, 'Faça 100 checks no total'),
  'semana-inteira': c('streakDays', 7, 'Marque itens em 7 dias seguidos'),
  'mes-de-constancia': c('streakDays', 30, 'Marque itens em 30 dias seguidos'),
  madrugador: manual('Faça um check antes das 07h'),
  coruja: manual('Faça um check depois das 22h'),
  equilibrio: c('balanced3Days', 1, 'Faça checks em 3 categorias no mesmo dia'),
  'vida-em-equilibrio': c('balanced5Days', 1, 'Faça checks em 5 categorias no mesmo dia'),
  'do-meu-jeito': c('categoriesCreated', 1, 'Crie uma categoria própria'),
  'no-podio': c('podiumDays', 1, 'Marque um diário, uma tarefa e um hábito no mesmo dia'),
  'coracao-valente': manual('Volte a marcar itens depois de 7 dias parado'),
  'bolsa-cheia': c('itemsActive', 10, 'Tenha 10 itens ativos ao mesmo tempo'),
  'dia-brilhante': c('maxItemsDay', 10, 'Marque 10 itens no mesmo dia'),
  'diamante-bruto': c('activeDays', 200, 'Marque itens em 200 dias diferentes'),
  aprendiz: c('level', 5, 'Chegue ao nível 5'),
  veterano: c('level', 10, 'Chegue ao nível 10'),
  mestre: c('level', 20, 'Chegue ao nível 20'),
  'lenda-do-nivel': c('level', 30, 'Chegue ao nível 30'),
  'novo-capitulo': c('chapters', 1, 'Complete o primeiro capítulo'),
  'livro-aberto': c('chapters', 5, 'Complete 5 capítulos'),
  'lenda-viva': c('stories', 1, 'Complete uma história inteira'),
  colecionador: c('stories', 3, 'Complete 3 histórias'),
  cofrinho: c('coins', 100, 'Junte 100 moedas'),
  tesouro: c('coins', 500, 'Junte 500 moedas'),
  fortuna: c('coins', 2000, 'Junte 2.000 moedas'),
  'colecionador-de-medalhas': c('achievements', 5, 'Desbloqueie 5 conquistas'),
  'cacador-de-trofeus': c('achievements', 25, 'Desbloqueie 25 conquistas'),
  'primeiro-lugar': c('achievements', 50, 'Desbloqueie 50 conquistas'),
  louros: { m: 'trail', t: 0, desc: 'Desbloqueie todas as conquistas de uma trilha' },
  'cofre-aberto': { m: 'secrets', t: 0, desc: 'Desbloqueie todas as conquistas surpresa' },
};

/** Só o que muda na proposta; o resto herda de ANTES. */
const MUDANCAS: Record<string, Criterion> = {
  'rotina-marcada': c('dailyDays', 4, 'Marque diários em 4 dias diferentes'),
  'tarefa-cumprida': c('tasksDone', 6, 'Conclua 6 tarefas'),
  'habito-em-acao': c('habitChecks', 8, 'Marque hábitos 8 vezes'),
  voltou: c('activeDays', 3, 'Marque itens em 3 dias diferentes'),
  'pena-leve': c('notesItems', 10, 'Escreva anotações em 10 itens'),
  'guarda-roupa': c('lookChanges', 10, 'Mude o visual do personagem 10 vezes'),
  'rotina-em-marcha': c('dailyChecks', 30, 'Marque 30 diários'),
  'rotina-firme': c('dailyChecks', 60, 'Marque 60 diários'),
  'rotina-de-ferro': c('dailyChecks', 250, 'Marque 250 diários'),
  'mestre-da-rotina': c('dailyChecks', 600, 'Marque 600 diários'),
  'dia-perfeito': c(
    'perfectDays',
    8,
    'Conclua todos os diários (3 ou mais agendados) em 8 dias diferentes',
  ),
  'chama-3-dias': c(
    'dailyStreak',
    5,
    'Conclua todos os diários agendados por 5 dias seguidos',
    'Chama de 5 dias',
  ),
  'chama-7-dias': c(
    'dailyStreak',
    10,
    'Conclua todos os diários agendados por 10 dias seguidos',
    'Chama de 10 dias',
  ),
  'chama-14-dias': c(
    'dailyStreak',
    21,
    'Conclua todos os diários agendados por 21 dias seguidos',
    'Chama de 21 dias',
  ),
  'chama-30-dias': c(
    'dailyStreak',
    45,
    'Conclua todos os diários agendados por 45 dias seguidos',
    'Chama de 45 dias',
  ),
  'pe-na-lista': c('tasksDone', 12, 'Conclua 12 tarefas'),
  executor: c('tasksDone', 50, 'Conclua 50 tarefas'),
  imparavel: c('tasksDone', 200, 'Conclua 200 tarefas'),
  'maquina-de-entregas': c('tasksDone', 500, 'Conclua 500 tarefas'),
  'lista-zerada': manual('Conclua todas as tarefas abertas (tendo ao menos 5)'),
  'no-prazo': c('onTimeTasks', 15, 'Conclua 15 tarefas antes do vencimento'),
  'peso-pesado': c('hardTasks', 15, 'Conclua 15 tarefas difíceis'),
  semente: c('habitDays', 14, 'Marque hábitos em 14 dias diferentes'),
  raiz: c('habitDays', 60, 'Marque hábitos em 60 dias diferentes'),
  arvore: c('habitDays', 180, 'Marque hábitos em 180 dias diferentes'),
  'habito-em-chama': c('habitStreak', 6, 'Mantenha um mesmo hábito por 6 dias seguidos'),
  'habito-de-7': c(
    'habitStreak',
    21,
    'Mantenha um mesmo hábito por 21 dias seguidos',
    'Hábito de 21 dias',
  ),
  'habito-de-30': c(
    'habitStreak',
    45,
    'Mantenha um mesmo hábito por 45 dias seguidos',
    'Hábito de 45 dias',
  ),
  'dia-de-foco': c('maxHabitsDay', 6, 'Marque 6 hábitos diferentes no mesmo dia'),
  organizado: c('itemsCreated', 15, 'Crie 15 itens'),
  planejador: c('itemsCreated', 40, 'Crie 40 itens'),
  'arquiteto-da-rotina': c('itemsCreated', 100, 'Crie 100 itens'),
  maratonista: c('checks', 250, 'Faça 250 checks no total'),
  equilibrio: c(
    'balanced3Days',
    10,
    'Faça checks em 3 categorias no mesmo dia, em 10 dias diferentes',
  ),
  'vida-em-equilibrio': c(
    'balanced5Days',
    18,
    'Faça checks em 5 categorias no mesmo dia, em 18 dias diferentes',
  ),
  'no-podio': c(
    'podiumDays',
    16,
    'Marque um diário, uma tarefa e um hábito no mesmo dia, em 16 dias diferentes',
  ),
  'bolsa-cheia': c('itemsActive', 20, 'Tenha 20 itens ativos ao mesmo tempo'),
  'dia-brilhante': c('maxItemsDay', 15, 'Marque 15 itens no mesmo dia'),
  veterano: c('level', 8, 'Chegue ao nível 8'),
  mestre: c('level', 12, 'Chegue ao nível 12'),
  'lenda-do-nivel': c('level', 20, 'Chegue ao nível 20'),
  'livro-aberto': c('chapters', 3, 'Complete 3 capítulos'),
  cofrinho: c('coins', 200, 'Junte 200 moedas'),
  tesouro: c('coins', 800, 'Junte 800 moedas'),
  fortuna: c('coins', 3000, 'Junte 3.000 moedas'),
  'colecionador-de-medalhas': c('achievements', 14, 'Desbloqueie 14 conquistas'),
  'cacador-de-trofeus': c('achievements', 35, 'Desbloqueie 35 conquistas'),
};

export const AGORA: Record<string, Criterion> = { ...ANTES, ...MUDANCAS };
