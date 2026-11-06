import type { MeResponse } from '@nextjourney/contracts';

export type OnboardingStep = 'tutorial' | 'character' | 'story' | 'done';

/** Onboarding resumes at the step where it stopped (RF-13): tutorial, character and story, in that order. */
export function nextOnboardingStep(onboarding: MeResponse['onboarding']): OnboardingStep {
  if (!onboarding.tutorialSeen) return 'tutorial';
  if (!onboarding.hasCharacter) return 'character';
  if (!onboarding.hasStory) return 'story';
  return 'done';
}

/** The app only unlocks the tabs once character and story are set. */
export function isOnboardingComplete(onboarding: MeResponse['onboarding']): boolean {
  return onboarding.hasCharacter && onboarding.hasStory;
}
