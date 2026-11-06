import { describe, expect, it } from 'vitest';

import { ALLOWED_LICENSES, CREDITS } from './credits';

describe('credits', () => {
  it('every entry has an asset, an author and a license', () => {
    expect(CREDITS.length).toBeGreaterThan(0);
    for (const credit of CREDITS) {
      expect(credit.asset).not.toBe('');
      expect(credit.author).not.toBe('');
      expect(credit.license).not.toBe('');
    }
  });

  it('has only permissive licenses (no CC-BY-SA or GPL)', () => {
    for (const credit of CREDITS) {
      expect(ALLOWED_LICENSES as readonly string[], credit.asset).toContain(credit.license);
    }
  });

  it('includes the LPC art credits', () => {
    expect(CREDITS.length).toBeGreaterThan(20);
    expect(CREDITS.some((credit) => credit.author.includes('Sharm'))).toBe(true);
  });
});
