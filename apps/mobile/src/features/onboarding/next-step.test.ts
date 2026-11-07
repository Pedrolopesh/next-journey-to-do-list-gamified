import { describe, expect, it } from 'vitest';

import { isOnboardingComplete, nextOnboardingStep } from './next-step';

const flags = (tutorialSeen: boolean, hasCharacter: boolean, hasStory: boolean) => ({
  tutorialSeen,
  hasCharacter,
  hasStory,
});

describe('onboarding', () => {
  it('resumes at the step where it stopped', () => {
    expect(nextOnboardingStep(flags(false, false, false))).toBe('tutorial');
    expect(nextOnboardingStep(flags(true, false, false))).toBe('character');
    expect(nextOnboardingStep(flags(true, true, false))).toBe('story');
    expect(nextOnboardingStep(flags(true, true, true))).toBe('done');
  });

  it('only unlocks the tabs with a character and a story (the tutorial is skippable)', () => {
    expect(isOnboardingComplete(flags(false, true, true))).toBe(true);
    expect(isOnboardingComplete(flags(true, true, false))).toBe(false);
    expect(isOnboardingComplete(flags(true, false, true))).toBe(false);
  });
});
