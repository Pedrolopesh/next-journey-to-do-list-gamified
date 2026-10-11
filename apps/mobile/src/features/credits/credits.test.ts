import { describe, expect, it } from 'vitest';

import { ALLOWED_LICENSES, CREDITS } from './credits';

describe('créditos', () => {
  it('toda entrada tem ativo, autor e licença', () => {
    expect(CREDITS.length).toBeGreaterThan(0);
    for (const credit of CREDITS) {
      expect(credit.asset).not.toBe('');
      expect(credit.author).not.toBe('');
      expect(credit.license).not.toBe('');
    }
  });

  it('só tem licença permissiva (nada de CC-BY-SA ou GPL)', () => {
    for (const credit of CREDITS) {
      expect(ALLOWED_LICENSES as readonly string[], credit.asset).toContain(credit.license);
    }
  });

  it('inclui os créditos da arte LPC', () => {
    expect(CREDITS.length).toBeGreaterThan(20);
    expect(CREDITS.some((credit) => credit.author.includes('Sharm'))).toBe(true);
  });
});
