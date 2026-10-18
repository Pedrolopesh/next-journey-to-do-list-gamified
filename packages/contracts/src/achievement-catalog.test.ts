import { describe, expect, it } from 'vitest';

import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_TRAILS } from './achievement-catalog';
import { achievementSchema, appEventSchema } from './achievements';

describe('catálogo de conquistas', () => {
  it('tem 69 conquistas com slugs únicos', () => {
    const slugs = ACHIEVEMENT_CATALOG.map((a) => a.slug);
    expect(slugs).toHaveLength(69);
    expect(new Set(slugs).size).toBe(69);
  });

  it('toda conquista aponta para uma trilha existente e tem texto', () => {
    const trails = new Set(ACHIEVEMENT_TRAILS.map((t) => t.id));
    for (const a of ACHIEVEMENT_CATALOG) {
      expect(trails.has(a.trail), a.slug).toBe(true);
      expect(a.name.length, a.slug).toBeGreaterThan(0);
      expect(a.description.length, a.slug).toBeGreaterThan(0);
    }
  });

  it('a Maratonista é Ouro na trilha de constância', () => {
    const marathon = ACHIEVEMENT_CATALOG.find((a) => a.slug === 'maratonista');
    expect(marathon?.tier).toBe(3);
    expect(marathon?.trail).toBe('constancia');
  });

  it('as conquistas surpresa existem e a lista não tem recompensa de item', () => {
    expect(ACHIEVEMENT_CATALOG.some((a) => 'secret' in a)).toBe(true);
    expect(Object.keys(ACHIEVEMENT_CATALOG[0] ?? {})).not.toContain('rewardKey');
  });
});

describe('contrato de conquistas', () => {
  const base = {
    slug: 'a',
    name: 'A',
    description: null,
    trail: 'inicio',
    tier: 2,
    glyph: 'pegada',
    secret: true,
    unlocked: false,
    unlockedAt: null,
    pending: false,
    progress: null,
  };

  it('aceita surpresa bloqueada sem descrição', () => {
    expect(achievementSchema.safeParse(base).success).toBe(true);
  });

  it('rejeita classe fora de 1 a 4', () => {
    expect(achievementSchema.safeParse({ ...base, tier: 5 }).success).toBe(false);
  });

  it('o evento do app só aceita tipos da lista', () => {
    expect(appEventSchema.safeParse({ type: 'reminder_enabled' }).success).toBe(true);
    expect(appEventSchema.safeParse({ type: 'unlock_everything' }).success).toBe(false);
  });
});
