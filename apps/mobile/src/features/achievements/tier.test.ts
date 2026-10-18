import { describe, expect, it } from 'vitest';

import { tierColor, tierOf } from './tier';

describe('tierOf', () => {
  it('usa a classe do catálogo e bronze quando a conquista é nova', () => {
    expect(tierOf('lenda-viva')).toBe('gold');
    expect(tierOf('chama-7-dias')).toBe('silver');
    expect(tierOf('conquista-que-ainda-nao-existe')).toBe('bronze');
  });

  it('cada classe tem uma cor do design system', () => {
    expect(tierColor('gold')).toBe('#facc15');
    expect(tierColor('diamond')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
