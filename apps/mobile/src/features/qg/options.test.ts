import { describe, expect, it } from 'vitest';

import catalog from '../../../../banner/lab/catalog.json';
import {
  CLOTH_COLORS,
  DEFAULT_LOOK,
  FEET_PARTS,
  HAIR_COLORS,
  HAIR_PARTS,
  isScenario,
  isTimeMode,
  legacyHair,
  legacySkin,
  LEGS_PARTS,
  resolveTime,
  SCENARIOS,
  SKIN_TONES,
  timeOfDayFor,
  TORSO_PARTS,
} from './options';

const partIds = new Set(catalog.parts.map((part) => part.id));
const bodyColors = Object.keys(catalog.palettes.body.colors);
const hairColors = Object.keys(catalog.palettes.hair.colors);
const clothColors = Object.keys(catalog.palettes.cloth.colors);

describe('opções do QG batem com o catálogo do banner', () => {
  it('toda peça e cor oferecida no app existe no catálogo', () => {
    for (const id of [...HAIR_PARTS, ...TORSO_PARTS, ...LEGS_PARTS, ...FEET_PARTS])
      expect(partIds.has(id), id).toBe(true);
    for (const color of SKIN_TONES) expect(bodyColors, color).toContain(color);
    for (const color of HAIR_COLORS) expect(hairColors, color).toContain(color);
    for (const color of CLOTH_COLORS) expect(clothColors, color).toContain(color);
  });

  it('o look padrão usa só opções oferecidas', () => {
    expect(SKIN_TONES).toContain(DEFAULT_LOOK.skin);
    expect(HAIR_PARTS).toContain(DEFAULT_LOOK.hair);
    expect(TORSO_PARTS).toContain(DEFAULT_LOOK.torso);
    expect(HAIR_COLORS).toContain(DEFAULT_LOOK.hairColor);
  });
});

describe('hora do dia', () => {
  it('manhã, tarde e noite pelo relógio', () => {
    expect(timeOfDayFor(new Date(2026, 9, 11, 4, 59))).toBe('night');
    expect(timeOfDayFor(new Date(2026, 9, 11, 5, 0))).toBe('morning');
    expect(timeOfDayFor(new Date(2026, 9, 11, 11, 59))).toBe('morning');
    expect(timeOfDayFor(new Date(2026, 9, 11, 12, 0))).toBe('afternoon');
    expect(timeOfDayFor(new Date(2026, 9, 11, 17, 59))).toBe('afternoon');
    expect(timeOfDayFor(new Date(2026, 9, 11, 18, 0))).toBe('night');
  });

  it('modo fixo ignora o relógio; automático usa o relógio', () => {
    const noon = new Date(2026, 9, 11, 12, 0);
    expect(resolveTime('night', noon)).toBe('night');
    expect(resolveTime('auto', noon)).toBe('afternoon');
  });
});

describe('validações e chaves simples', () => {
  it('reconhece cenário e modo de hora válidos', () => {
    expect(SCENARIOS.every(isScenario)).toBe(true);
    expect(isScenario('lua')).toBe(false);
    expect(isTimeMode('auto')).toBe(true);
    expect(isTimeMode('meio-dia')).toBe(false);
  });

  it('mapeia pele e cabelo LPC para a chave simples do cadastro', () => {
    expect(legacySkin('amber')).toBe('tan');
    expect(legacySkin('black')).toBe('dark');
    expect(legacyHair(null)).toBe('bald');
    expect(legacyHair('hair-curly-short')).toBe('curly-red');
  });
});
