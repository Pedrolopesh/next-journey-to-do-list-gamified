import type { CreateItemRequest, Difficulty, ItemType } from '@nextjourney/contracts';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type Example = {
  type: ItemType;
  /** Chave do título em `examples.<tipo>.<chave>` no pt-BR.json. */
  key: string;
  /** Nome de uma categoria padrão; sem ela, usa a primeira categoria do usuário. */
  category: string;
  difficulty: Difficulty;
};

/** Itens de exemplo comuns à maioria das pessoas, criados uma vez para quem ainda não tem itens. */
export const EXAMPLES: readonly Example[] = [
  { type: 'daily', key: 'water', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', key: 'exercise', category: 'Saúde', difficulty: 'medium' },
  { type: 'daily', key: 'read', category: 'Estudo', difficulty: 'easy' },
  { type: 'daily', key: 'planDay', category: 'Trabalho', difficulty: 'easy' },
  { type: 'daily', key: 'makeBed', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', key: 'brushTeeth', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', key: 'breakfast', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', key: 'walk', category: 'Saúde', difficulty: 'medium' },
  { type: 'daily', key: 'vitamins', category: 'Saúde', difficulty: 'easy' },
  { type: 'daily', key: 'sleepEarly', category: 'Saúde', difficulty: 'medium' },
  { type: 'daily', key: 'meditate', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', key: 'journal', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', key: 'tidyRoom', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', key: 'dishes', category: 'Pessoal', difficulty: 'easy' },
  { type: 'daily', key: 'cookMeal', category: 'Pessoal', difficulty: 'medium' },
  { type: 'daily', key: 'study', category: 'Estudo', difficulty: 'medium' },
  { type: 'daily', key: 'language', category: 'Estudo', difficulty: 'easy' },
  { type: 'daily', key: 'checkEmails', category: 'Trabalho', difficulty: 'easy' },
  { type: 'daily', key: 'focusBlock', category: 'Trabalho', difficulty: 'hard' },
  { type: 'daily', key: 'reviewGoals', category: 'Trabalho', difficulty: 'easy' },
  { type: 'todo', key: 'bill', category: 'Pessoal', difficulty: 'easy' },
  { type: 'todo', key: 'doctor', category: 'Saúde', difficulty: 'medium' },
  { type: 'todo', key: 'report', category: 'Trabalho', difficulty: 'medium' },
  { type: 'todo', key: 'shopping', category: 'Pessoal', difficulty: 'easy' },
  { type: 'todo', key: 'exam', category: 'Estudo', difficulty: 'hard' },
  { type: 'habit', key: 'glass', category: 'Saúde', difficulty: 'easy' },
  { type: 'habit', key: 'stretch', category: 'Saúde', difficulty: 'easy' },
  { type: 'habit', key: 'breathe', category: 'Pessoal', difficulty: 'easy' },
  { type: 'habit', key: 'rest', category: 'Saúde', difficulty: 'easy' },
  { type: 'habit', key: 'gratitude', category: 'Pessoal', difficulty: 'easy' },
];

type Category = { id: string; name: string };

/** Monta as requisições de criação, na ordem do catálogo. Sem nenhuma categoria, não há o que criar. */
export function buildExampleRequests(
  categories: readonly Category[],
  title: (type: ItemType, key: string) => string,
): CreateItemRequest[] {
  const fallback = categories[0];
  if (!fallback) return [];
  return EXAMPLES.map((example) => {
    const base = {
      title: title(example.type, example.key),
      difficulty: example.difficulty,
      categoryId: categories.find((c) => c.name === example.category)?.id ?? fallback.id,
    };
    if (example.type === 'daily') return { ...base, type: 'daily', scheduleDays: EVERY_DAY };
    if (example.type === 'todo') return { ...base, type: 'todo' };
    return { ...base, type: 'habit' };
  });
}
