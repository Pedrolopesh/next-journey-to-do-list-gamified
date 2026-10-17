import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Expo Router 58: a rota inicial do grupo vem daqui (no lugar da prop `initialRouteName`).
export const unstable_settings = { anchor: 'welcome' };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}
    />
  );
}
