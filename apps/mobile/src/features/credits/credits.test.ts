import { describe, expect, it } from 'vitest';

import { CREDITS } from './credits';

describe('créditos', () => {
  it('toda entrada tem ativo, autor e licença', () => {
    expect(CREDITS.length).toBeGreaterThan(0);
    for (const credit of CREDITS) {
      expect(credit.asset).not.toBe('');
      expect(credit.author).not.toBe('');
      expect(credit.license).not.toBe('');
    }
  });
});
