import { useFocusEffect, useNavigation } from 'expo-router';
import { type ReactNode, useCallback, useEffect } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { colors, fontSize, space } from '@/theme';

import { useKeyboardVisible } from './use-keyboard-visible';

type Props = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  /** Fixed at the bottom (primary button and secondary actions). */
  footer?: ReactNode;
  /** Shown above the title and kept fixed (banner preview). It brings its own back button. */
  preview?: ReactNode;
  /** No back button (first screens of a flow). */
  hideBack?: boolean;
  /**
   * No way back at all: no button, no swipe and no Android back button. For the steps after a point
   * of no return (the character is already created).
   */
  noReturn?: boolean;
};

function useNoReturn(enabled: boolean): void {
  const navigation = useNavigation();
  useEffect(() => {
    if (enabled) navigation.setOptions({ gestureEnabled: false });
  }, [enabled, navigation]);
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      // Returning true tells Android the press was handled, so the screen stays
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => {
        subscription.remove();
      };
    }, [enabled]),
  );
}

/**
 * Common layout of the onboarding steps: back button, title, scrolling content and a fixed footer
 * with the actions.
 */
export function OnboardingScreen({
  title,
  subtitle,
  children,
  footer,
  preview,
  hideBack: hideBackProp,
  noReturn = false,
}: Props) {
  const hideBack = hideBackProp || noReturn;
  useNoReturn(noReturn);
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  // The preview takes a third of the screen: with the keyboard open it would leave no room for
  // the field, so it steps aside until the keyboard closes
  const showPreview = preview && !keyboard;
  return (
    // The footer (primary action) rises with the keyboard instead of hiding behind it
    <KeyboardAvoidingView
      style={[styles.container, showPreview ? null : { paddingTop: insets.top + space[8] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {showPreview ? (
        <View style={{ paddingTop: insets.top }}>
          {preview}
          {hideBack ? null : (
            <View style={styles.overlayBack}>
              <BackButton overlay />
            </View>
          )}
        </View>
      ) : hideBack ? null : (
        <View style={styles.backRow}>
          <BackButton />
        </View>
      )}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {title ? (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            // The home-indicator area sits under the keyboard: keep only a small gap to its edge
            { paddingBottom: keyboard ? space[8] : insets.bottom + space[16] },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bg.base },
  backRow: { paddingHorizontal: space.screenMargin, paddingBottom: space[8] },
  overlayBack: { position: 'absolute', left: space[8], top: space[8] + 44 },
  content: { padding: space.screenMargin, gap: space[12], paddingBottom: space[24] },
  title: { color: colors.text.primary, fontSize: fontSize[24], fontWeight: '700' },
  subtitle: { color: colors.text.secondary, fontSize: fontSize[14] },
  footer: { paddingHorizontal: space.screenMargin, paddingTop: space[12], gap: space[8] },
});
