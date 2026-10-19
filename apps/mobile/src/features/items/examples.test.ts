import { createItemRequestSchema } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import ptBR from '../../i18n/pt-BR.json';
import { buildExampleRequests, EXAMPLES } from './examples';

const categories = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Trabalho' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Saúde' },
];

const titleOf = (type: 'daily' | 'todo' | 'habit', key: string): string =>
  (ptBR.examples[type] as Record<string, string>)[key] ?? '';

describe('itens de exemplo', () => {
  it('todo exemplo tem título no pt-BR.json e vira uma requisição válida', () => {
    const requests = buildExampleRequests(categories, titleOf);
    expect(requests).toHaveLength(EXAMPLES.length);
    for (const request of requests) {
      expect(request.title).not.toBe('');
      expect(createItemRequestSchema.safeParse(request).success).toBe(true);
    }
  });

  it('cobre os três tipos', () => {
    const types = new Set(buildExampleRequests(categories, titleOf).map((r) => r.type));
    expect(types).toEqual(new Set(['daily', 'todo', 'habit']));
  });

  it('usa a categoria de mesmo nome e, na falta dela, a primeira', () => {
    const requests = buildExampleRequests(categories, titleOf);
    const water = requests.find((r) => r.title === titleOf('daily', 'water'));
    const bill = requests.find((r) => r.title === titleOf('todo', 'bill'));
    expect(water?.categoryId).toBe(categories[1]?.id);
    expect(bill?.categoryId).toBe(categories[0]?.id);
  });

  it('tem pelo menos 20 diários para testar', () => {
    expect(EXAMPLES.filter((example) => example.type === 'daily').length).toBeGreaterThanOrEqual(
      20,
    );
  });

  it('sem categorias não cria nada', () => {
    expect(buildExampleRequests([], titleOf)).toEqual([]);
  });

  it('todo exemplo é marcado como exemplo, para não contar como criação do usuário', () => {
    const requests = buildExampleRequests(categories, titleOf);
    expect(requests.every((request) => request.example === true)).toBe(true);
  });
});
