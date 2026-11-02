import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { colors, fontSize, space } from '@/theme';

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
};

/**
 * Common layout of the onboarding steps: back button, title, scrolling content and a fixed footer
 * with the actions.
 */
export function OnboardingScreen({ title, subtitle, children, footer, preview, hideBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    // The footer (primary action) rises with the keyboard instead of hiding behind it
    <KeyboardAvoidingView
      style={[styles.container, preview ? null : { paddingTop: insets.top + space[8] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {preview ? (
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
        <View style={[styles.footer, { paddingBottom: insets.bottom + space[16] }]}>{footer}</View>
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
