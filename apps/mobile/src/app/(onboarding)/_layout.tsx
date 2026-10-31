import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useMe } from '@/api/queries';
import { useOnboardingFlow } from '@/features/onboarding/flow-store';
import { nextOnboardingStep } from '@/features/onboarding/next-step';
import { colors } from '@/theme';

// Expo Router 58: the group's first route comes from here (instead of `initialRouteName`).
export const unstable_settings = { anchor: 'tutorial' };

/**
 * Opens at the step where the person stopped. Expo Router 58 has no dynamic `initialRouteName`, so
 * it jumps to the right step once. While the optional questions after the story are open
 * (`finishing`), the flow itself navigates and nothing jumps.
 */
export default function OnboardingLayout() {
  const { data: me } = useMe();
  const router = useRouter();
  const jumped = useRef(false);
  useEffect(() => {
    if (!me || jumped.current) return;
    jumped.current = true;
    if (useOnboardingFlow.getState().finishing) return;
    const step = nextOnboardingStep(me.onboarding);
    // The first route of the group is the tutorial; only the later steps need the jump.
    if (step === 'character') router.replace('/character');
    else if (step === 'story' || step === 'done') router.replace('/story');
  }, [me, router]);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
