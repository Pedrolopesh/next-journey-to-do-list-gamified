import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type InventoryItem, PAGE_RULES } from './inventario-regras';

const items = JSON.parse(
  readFileSync(resolve(process.cwd(), 'lab/inventario-lpc.json'), 'utf8'),
) as InventoryItem[];

describe('páginas do inventário LPC', () => {
  it('cada peça aparece em exatamente uma página', () => {
    const wrong = items.filter(
      (item) => Object.values(PAGE_RULES).filter((rule) => rule(item)).length !== 1,
    );
    expect(wrong.map((item) => `${item.root}/${item.group}: ${item.name}`)).toEqual([]);
  });

  it('nenhuma peça sumiu: a soma das páginas é o inventário todo', () => {
    const total = Object.values(PAGE_RULES).reduce(
      (sum, rule) => sum + items.filter(rule).length,
      0,
    );
    expect(total).toBe(items.length);
  });
});
