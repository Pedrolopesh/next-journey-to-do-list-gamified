import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type InventoryItem, PAGE_RULES } from './inventario-regras';

const items = JSON.parse(
  readFileSync(resolve(process.cwd(), 'lab/inventario-lpc.json'), 'utf8'),
) as InventoryItem[];

describe('LPC inventory pages', () => {
  it('each piece appears on exactly one page', () => {
    const wrong = items.filter(
      (item) => Object.values(PAGE_RULES).filter((rule) => rule(item)).length !== 1,
    );
    expect(wrong.map((item) => `${item.root}/${item.group}: ${item.name}`)).toEqual([]);
  });

  it('no piece went missing: the pages add up to the whole inventory', () => {
    const total = Object.values(PAGE_RULES).reduce(
      (sum, rule) => sum + items.filter(rule).length,
      0,
    );
    expect(total).toBe(items.length);
  });
});
