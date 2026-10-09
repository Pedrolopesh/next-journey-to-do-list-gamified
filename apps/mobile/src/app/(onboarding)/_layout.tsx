import { Stack } from 'expo-router';

import { useMe } from '@/api/queries';
import { nextOnboardingStep } from '@/features/onboarding/next-step';
import { colors } from '@/theme';

/** Abre no passo onde o usuário parou. Sem gesto de voltar: os passos seguem em ordem. */
export default function OnboardingLayout() {
  const { data: me } = useMe();
  const step = me ? nextOnboardingStep(me.onboarding) : 'tutorial';
  return (
    <Stack
      initialRouteName={step === 'done' ? 'story' : step}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
