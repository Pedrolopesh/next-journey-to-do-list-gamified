import { Redirect } from 'expo-router';

import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { isOnboardingComplete } from '@/features/onboarding/next-step';

/**
 * Expo Router 58 não cai mais sozinho no primeiro grupo liberado quando a rota pedida está
 * protegida (ex.: "/" sem login, ou depois de sair da conta). Leva para o grupo certo.
 */
export default function NotFound() {
  const status = useSessionStore((state) => state.status);
  const me = useMe();
  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (status === 'signedIn' && me.data) {
    return <Redirect href={isOnboardingComplete(me.data.onboarding) ? '/' : '/character'} />;
  }
  return null;
}
