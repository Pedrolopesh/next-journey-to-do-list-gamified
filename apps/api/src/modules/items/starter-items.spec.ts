import { describe, expect, it } from 'vitest';

import { DEFAULT_CATEGORIES } from '../categories/default-categories.js';
import { STARTER_ITEMS } from './starter-items.js';

describe('starter items catalog', () => {
  it('has the three types and at least 20 dailies', () => {
    expect(new Set(STARTER_ITEMS.map((item) => item.type))).toEqual(
      new Set(['daily', 'todo', 'habit']),
    );
    expect(STARTER_ITEMS.filter((item) => item.type === 'daily').length).toBeGreaterThanOrEqual(20);
  });

  it('has titles of 1 to 120 characters with no repeats', () => {
    const titles = STARTER_ITEMS.map((item) => item.title);
    for (const title of titles) {
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(120);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('only cites default categories', () => {
    const names = new Set<string>(DEFAULT_CATEGORIES.map((category) => category.name));
    for (const item of STARTER_ITEMS) expect(names.has(item.category)).toBe(true);
  });
});
