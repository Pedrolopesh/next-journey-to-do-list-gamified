import { describe, expect, it } from 'vitest';

import { isOnboardingComplete, nextOnboardingStep } from './next-step';

const flags = (tutorialSeen: boolean, hasCharacter: boolean, hasStory: boolean) => ({
  tutorialSeen,
  hasCharacter,
  hasStory,
});

describe('onboarding', () => {
  it('retoma do passo onde parou', () => {
    expect(nextOnboardingStep(flags(false, false, false))).toBe('tutorial');
    expect(nextOnboardingStep(flags(true, false, false))).toBe('character');
    expect(nextOnboardingStep(flags(true, true, false))).toBe('story');
    expect(nextOnboardingStep(flags(true, true, true))).toBe('done');
  });

  it('só libera as abas com personagem e história (o tutorial é pulável)', () => {
    expect(isOnboardingComplete(flags(false, true, true))).toBe(true);
    expect(isOnboardingComplete(flags(true, true, false))).toBe(false);
    expect(isOnboardingComplete(flags(true, false, true))).toBe(false);
  });
});
