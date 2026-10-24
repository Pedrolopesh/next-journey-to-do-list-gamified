import { describe, expect, it } from 'vitest';

import { cleanDeviceName } from './device-name.js';

describe('cleanDeviceName', () => {
  it('mantém um nome normal e limita o tamanho', () => {
    expect(cleanDeviceName('Pixel 8 (Android)')).toBe('Pixel 8 (Android)');
    expect(cleanDeviceName('x'.repeat(200))).toHaveLength(80);
  });

  it('tira caracteres de controle e junta espaços', () => {
    expect(cleanDeviceName('iPhone\r\ndo   Pedro\u0000')).toBe('iPhone do Pedro');
  });

  it('decodifica o nome vindo codificado (acentos) e aceita texto simples com %', () => {
    expect(cleanDeviceName(encodeURIComponent('iPhone do João'))).toBe('iPhone do João');
    expect(cleanDeviceName('100% bateria')).toBe('100% bateria');
  });

  it('o corte não parte um emoji ao meio', () => {
    const name = `${'a'.repeat(79)}📱📱`;
    expect(cleanDeviceName(name)).toBe(`${'a'.repeat(79)}📱`);
  });

  it('vazio, só espaços ou só lixo vira nulo', () => {
    expect(cleanDeviceName(undefined)).toBeNull();
    expect(cleanDeviceName('')).toBeNull();
    expect(cleanDeviceName('  \u0007\n ')).toBeNull();
  });
});
