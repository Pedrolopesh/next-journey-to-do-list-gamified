import { IconChevronLeft } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, size } from '@/theme';

type Props = {
  /** Floats over a banner image instead of sitting on the plain background. */
  overlay?: boolean;
  /** Overrides the default of going back in the navigation history. */
  onPress?: () => void;
};

/** Round back button of the onboarding screens; hidden when there is nowhere to go back to. */
export function BackButton({ overlay = false, onPress }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  if (!onPress && !router.canGoBack()) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      onPress={onPress ?? (() => router.back())}
      style={[styles.button, overlay && styles.overlay]}
    >
      <IconChevronLeft size={22} color={colors.text.primary} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  overlay: { backgroundColor: colors.bg.sunken, opacity: 0.85 },
});
