import { describe, expect, it } from 'vitest';

import { resolveApiUrl } from './api-url';

const dev = { isProduction: false, platform: 'ios' };
const prod = { isProduction: true, platform: 'ios' };

describe('resolveApiUrl', () => {
  it('em desenvolvimento usa a URL configurada, sem a barra final', () => {
    expect(resolveApiUrl({ ...dev, configured: 'https://api.exemplo.com/' })).toBe(
      'https://api.exemplo.com',
    );
  });

  it('em desenvolvimento cai no servidor local de cada plataforma', () => {
    expect(resolveApiUrl({ ...dev, configured: undefined })).toBe('http://localhost:3000');
    expect(resolveApiUrl({ ...dev, platform: 'android', configured: '  ' })).toBe(
      'http://10.0.2.2:3000',
    );
  });

  it('em desenvolvimento aceita http (aparelho na rede local)', () => {
    const lan = `http://${['192', '168', '0', '10'].join('.')}:3010`;
    expect(resolveApiUrl({ ...dev, configured: lan })).toBe(lan);
  });

  it('em produção exige a URL e ela precisa ser https', () => {
    expect(resolveApiUrl({ ...prod, configured: 'https://api.exemplo.com' })).toBe(
      'https://api.exemplo.com',
    );
    expect(() => resolveApiUrl({ ...prod, configured: undefined })).toThrow(/https/);
    expect(() => resolveApiUrl({ ...prod, configured: '' })).toThrow(/https/);
    expect(() => resolveApiUrl({ ...prod, configured: 'http://api.exemplo.com' })).toThrow(/https/);
    expect(() => resolveApiUrl({ ...prod, configured: 'http://localhost:3000' })).toThrow(/https/);
    expect(() => resolveApiUrl({ ...prod, configured: 'https://' })).toThrow(/https/);
    expect(resolveApiUrl({ ...prod, configured: 'HTTPS://api.exemplo.com' })).toBe(
      'HTTPS://api.exemplo.com',
    );
  });
});
