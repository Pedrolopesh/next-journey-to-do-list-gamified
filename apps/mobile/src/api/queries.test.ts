import type { MeResponse } from '@nextjourney/contracts';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/session-store', () => ({ useSessionStore: () => true }));
vi.mock('./endpoints', () => ({}));

const { chapterProgress } = await import('./queries');

const me = (exp: number, next: number): MeResponse => ({
  user: {
    id: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
    name: 'P',
    email: 'p@exemplo.com',
    timezone: 'UTC',
    notifyAt: null,
  },
  player: {
    level: 1,
    expInLevel: exp,
    expTotal: 0,
    coins: 0,
    totalChecks: 0,
    story: { chapter: 1, completed: false },
    expForNextLevel: next,
  },
  character: null,
  story: null,
  onboarding: { tutorialSeen: false, hasCharacter: false, hasStory: false },
});

describe('chapterProgress', () => {
  it('é a fração de EXP dentro do nível (cada nível conclui um capítulo)', () => {
    expect(chapterProgress(me(25, 50))).toBe(0.5);
    expect(chapterProgress(me(0, 50))).toBe(0);
  });
  it('sem dados vale 0 e nunca passa de 1', () => {
    expect(chapterProgress(undefined)).toBe(0);
    expect(chapterProgress(me(80, 50))).toBe(1);
  });
});
