import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Expo Router 58: the group's initial route comes from here (instead of the `initialRouteName` prop).
export const unstable_settings = { anchor: 'welcome' };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}
    />
  );
}
