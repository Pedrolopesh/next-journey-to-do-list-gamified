import { describe, expect, it } from 'vitest';

import catalog from '../../../../web/lab/catalog.json';
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
  PRESETS,
  randomLook,
  resolveTime,
  SCENARIOS,
  SKIN_TONES,
  STORY_SCENARIOS,
  timeOfDayFor,
  TORSO_PARTS,
} from './options';

const partIds = new Set(catalog.parts.map((part) => part.id));
const bodyColors = Object.keys(catalog.palettes.body.colors);
const hairColors = Object.keys(catalog.palettes.hair.colors);
const clothColors = Object.keys(catalog.palettes.cloth.colors);

describe('QG options match the banner catalog', () => {
  it('every piece and color offered in the app exists in the catalog', () => {
    for (const id of [...HAIR_PARTS, ...TORSO_PARTS, ...LEGS_PARTS, ...FEET_PARTS])
      expect(partIds.has(id), id).toBe(true);
    for (const color of SKIN_TONES) expect(bodyColors, color).toContain(color);
    for (const color of HAIR_COLORS) expect(hairColors, color).toContain(color);
    for (const color of CLOTH_COLORS) expect(clothColors, color).toContain(color);
  });

  it('the default look uses only offered options', () => {
    expect(SKIN_TONES).toContain(DEFAULT_LOOK.skin);
    expect(HAIR_PARTS).toContain(DEFAULT_LOOK.hair);
    expect(TORSO_PARTS).toContain(DEFAULT_LOOK.torso);
    expect(HAIR_COLORS).toContain(DEFAULT_LOOK.hairColor);
  });
});

describe('time of day', () => {
  it('morning, afternoon and night by the clock', () => {
    expect(timeOfDayFor(new Date(2026, 9, 11, 4, 59))).toBe('night');
    expect(timeOfDayFor(new Date(2026, 9, 11, 5, 0))).toBe('morning');
    expect(timeOfDayFor(new Date(2026, 9, 11, 11, 59))).toBe('morning');
    expect(timeOfDayFor(new Date(2026, 9, 11, 12, 0))).toBe('afternoon');
    expect(timeOfDayFor(new Date(2026, 9, 11, 17, 59))).toBe('afternoon');
    expect(timeOfDayFor(new Date(2026, 9, 11, 18, 0))).toBe('night');
  });

  it('fixed mode ignores the clock; automatic uses the clock', () => {
    const noon = new Date(2026, 9, 11, 12, 0);
    expect(resolveTime('night', noon)).toBe('night');
    expect(resolveTime('auto', noon)).toBe('afternoon');
  });
});

describe('validations and simple keys', () => {
  it('recognizes a valid scenery and time mode', () => {
    expect(SCENARIOS.every(isScenario)).toBe(true);
    expect(STORY_SCENARIOS).not.toContain('cabin');
    expect(STORY_SCENARIOS).toHaveLength(SCENARIOS.length - 1);
    expect(isScenario('lua')).toBe(false);
    expect(isTimeMode('auto')).toBe(true);
    expect(isTimeMode('meio-dia')).toBe(false);
  });

  it('maps LPC skin and hair to the sign-up simple key', () => {
    expect(legacySkin('amber')).toBe('tan');
    expect(legacySkin('black')).toBe('dark');
    expect(legacyHair(null)).toBe('bald');
    expect(legacyHair('hair-curly-short')).toBe('curly-red');
  });
});

describe('ready-made looks and draw', () => {
  const valid = (look: ReturnType<typeof randomLook>): void => {
    expect(SKIN_TONES).toContain(look.skin);
    expect(
      look.hair === null || HAIR_PARTS.includes(look.hair as (typeof HAIR_PARTS)[number]),
    ).toBe(true);
    expect(HAIR_COLORS).toContain(look.hairColor);
    expect(TORSO_PARTS).toContain(look.torso);
    expect(LEGS_PARTS).toContain(look.legs);
    expect(FEET_PARTS).toContain(look.feet);
    for (const color of [look.torsoColor, look.legsColor, look.feetColor])
      expect(CLOTH_COLORS).toContain(color);
  };

  it('every ready-made look uses only offered options and has unique ids', () => {
    expect(new Set(PRESETS.map((preset) => preset.id)).size).toBe(PRESETS.length);
    for (const preset of PRESETS) valid(preset.look as ReturnType<typeof randomLook>);
  });

  it('the draw always returns offered options, at the generator extremes', () => {
    for (const value of [0, 0.05, 0.5, 0.999]) valid(randomLook(() => value));
  });
});
