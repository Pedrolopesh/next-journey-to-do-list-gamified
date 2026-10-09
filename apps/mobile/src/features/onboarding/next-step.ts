import type { MeResponse } from '@nextjourney/contracts';

export type OnboardingStep = 'tutorial' | 'character' | 'story' | 'done';

/** Onboarding retoma do passo onde parou (RF-13): tutorial, personagem e história, nessa ordem. */
export function nextOnboardingStep(onboarding: MeResponse['onboarding']): OnboardingStep {
  if (!onboarding.tutorialSeen) return 'tutorial';
  if (!onboarding.hasCharacter) return 'character';
  if (!onboarding.hasStory) return 'story';
  return 'done';
}

/** O app só libera as abas com personagem e história definidos. */
export function isOnboardingComplete(onboarding: MeResponse['onboarding']): boolean {
  return onboarding.hasCharacter && onboarding.hasStory;
}
