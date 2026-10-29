import { describe, expect, it } from 'vitest';

import { DEFAULT_CATEGORIES } from '../categories/default-categories.js';
import { STARTER_ITEMS } from './starter-items.js';

describe('catálogo de itens de exemplo', () => {
  it('tem os três tipos e pelo menos 20 diários', () => {
    expect(new Set(STARTER_ITEMS.map((item) => item.type))).toEqual(
      new Set(['daily', 'todo', 'habit']),
    );
    expect(STARTER_ITEMS.filter((item) => item.type === 'daily').length).toBeGreaterThanOrEqual(20);
  });

  it('títulos de 1 a 120 caracteres e sem repetição', () => {
    const titles = STARTER_ITEMS.map((item) => item.title);
    for (const title of titles) {
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(120);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('toda categoria citada é uma das categorias padrão', () => {
    const names = new Set<string>(DEFAULT_CATEGORIES.map((category) => category.name));
    for (const item of STARTER_ITEMS) expect(names.has(item.category)).toBe(true);
  });
});
