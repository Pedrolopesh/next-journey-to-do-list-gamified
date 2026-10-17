import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useMe } from '@/api/queries';
import { nextOnboardingStep } from '@/features/onboarding/next-step';
import { colors } from '@/theme';

/**
 * Abre no passo onde o usuário parou. Sem gesto de voltar: os passos seguem em ordem.
 * Expo Router 58 não tem mais `initialRouteName` dinâmico, então pula para o passo certo uma vez.
 */
export default function OnboardingLayout() {
  const { data: me } = useMe();
  const router = useRouter();
  const jumped = useRef(false);
  useEffect(() => {
    if (!me || jumped.current) return;
    jumped.current = true;
    const step = nextOnboardingStep(me.onboarding);
    // A primeira rota do grupo é `character`; só os outros passos precisam do salto.
    if (step === 'tutorial') router.replace('/tutorial');
    else if (step === 'story' || step === 'done') router.replace('/story');
  }, [me, router]);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
