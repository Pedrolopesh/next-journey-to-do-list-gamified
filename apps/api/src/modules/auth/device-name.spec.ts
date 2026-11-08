import { describe, expect, it } from 'vitest';

import { cleanDeviceName } from './device-name.js';

describe('cleanDeviceName', () => {
  it('keeps a normal name and limits the length', () => {
    expect(cleanDeviceName('Pixel 8 (Android)')).toBe('Pixel 8 (Android)');
    expect(cleanDeviceName('x'.repeat(200))).toHaveLength(80);
  });

  it('strips control characters and collapses spaces', () => {
    expect(cleanDeviceName('iPhone\r\ndo   Pedro\u0000')).toBe('iPhone do Pedro');
  });

  it('decodes the encoded name (accents) and accepts plain text with %', () => {
    expect(cleanDeviceName(encodeURIComponent('iPhone do João'))).toBe('iPhone do João');
    expect(cleanDeviceName('100% bateria')).toBe('100% bateria');
  });

  it('the cut does not split an emoji in half', () => {
    const name = `${'a'.repeat(79)}📱📱`;
    expect(cleanDeviceName(name)).toBe(`${'a'.repeat(79)}📱`);
  });

  it('empty, only spaces or only junk becomes null', () => {
    expect(cleanDeviceName(undefined)).toBeNull();
    expect(cleanDeviceName('')).toBeNull();
    expect(cleanDeviceName('  \u0007\n ')).toBeNull();
  });
});
