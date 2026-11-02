import { describe, expect, it } from 'vitest';

import { characterNameSchema } from './character';

describe('characterNameSchema', () => {
  it('aceita apelido com letras, números, acentos, símbolos e emoji', () => {
    for (const name of [
      'Aria',
      'Pedro_77',
      'Zé do Pão',
      'xX_Dragão_Xx',
      'Ana-Lu!',
      '龍',
      'Léo 🐉',
    ]) {
      expect(characterNameSchema.safeParse(name).success, name).toBe(true);
    }
  });

  it('recusa vazio, só espaços e nome acima de 40 caracteres', () => {
    expect(characterNameSchema.safeParse('').success).toBe(false);
    expect(characterNameSchema.safeParse('   ').success).toBe(false);
    expect(characterNameSchema.safeParse('a'.repeat(41)).success).toBe(false);
  });

  it('recusa marcação e script, controle e caracteres invisíveis', () => {
    for (const name of [
      '<script>alert(1)</script>',
      'a<b',
      'x>y',
      'linha\nquebrada',
      'tab\tulado',
      'nome‮invertido',
      'inv​isível',
    ]) {
      expect(characterNameSchema.safeParse(name).success, name).toBe(false);
    }
  });

  it('apara os espaços das pontas', () => {
    expect(characterNameSchema.parse('  Aria  ')).toBe('Aria');
  });
});
