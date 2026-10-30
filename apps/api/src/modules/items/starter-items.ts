import type { Difficulty, ItemType } from '@nextjourney/contracts';

export type StarterItem = {
  type: ItemType;
  title: string;
  /** Name of a default category; falls back to the account's first category. */
  category: string;
  difficulty: Difficulty;
};

/**
 * Starter items common to most people, created once when the account becomes valid.
 * The titles are Portuguese product content (the app only has Portuguese); dailies run every day.
 */
export const STARTER_ITEMS: readonly StarterItem[] = [
  { type: 'daily', title: 'Beber 2 litros de água', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', title: 'Fazer exercício físico', category: 'Saúde', difficulty: 'medium' },
  { type: 'daily', title: 'Ler por 20 minutos', category: 'Estudo', difficulty: 'easy' },
  { type: 'daily', title: 'Planejar o dia', category: 'Trabalho', difficulty: 'easy' },
  { type: 'daily', title: 'Arrumar a cama', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', title: 'Escovar os dentes', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', title: 'Tomar café da manhã', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', title: 'Caminhar por 20 minutos', category: 'Saúde', difficulty: 'medium' },
  { type: 'daily', title: 'Tomar as vitaminas', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', title: 'Dormir antes das 23h', category: 'Saúde', difficulty: 'medium' },
  { type: 'daily', title: 'Meditar por 10 minutos', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', title: 'Escrever no diário', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', title: 'Organizar o quarto', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', title: 'Lavar a louça', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', title: 'Cozinhar uma refeição', category: 'Pessoal', difficulty: 'medium' },
  { type: 'daily', title: 'Estudar por 1 hora', category: 'Estudo', difficulty: 'medium' },
  { type: 'daily', title: 'Praticar um idioma', category: 'Estudo', difficulty: 'easy' },
  { type: 'daily', title: 'Responder e-mails', category: 'Trabalho', difficulty: 'easy' },
  {
    type: 'daily',
    title: 'Bloco de foco sem distrações',
    category: 'Trabalho',
    difficulty: 'hard',
  },
  { type: 'daily', title: 'Revisar as metas do dia', category: 'Trabalho', difficulty: 'easy' },
  { type: 'todo', title: 'Pagar a conta de luz', category: 'Pessoal', difficulty: 'easy' },
  { type: 'todo', title: 'Marcar consulta médica', category: 'Saúde', difficulty: 'medium' },
  {
    type: 'todo',
    title: 'Enviar o relatório da semana',
    category: 'Trabalho',
    difficulty: 'medium',
  },
  { type: 'todo', title: 'Fazer a lista de compras', category: 'Pessoal', difficulty: 'easy' },
  { type: 'todo', title: 'Estudar para a prova', category: 'Estudo', difficulty: 'hard' },
  { type: 'habit', title: 'Beber um copo de água', category: 'Saúde', difficulty: 'easy' },
  { type: 'habit', title: 'Alongar o corpo', category: 'Saúde', difficulty: 'easy' },
  { type: 'habit', title: 'Respirar fundo por 1 minuto', category: 'Pessoal', difficulty: 'easy' },
  { type: 'habit', title: 'Descansar os olhos da tela', category: 'Saúde', difficulty: 'easy' },
  { type: 'habit', title: 'Agradecer por algo', category: 'Pessoal', difficulty: 'easy' },
];
