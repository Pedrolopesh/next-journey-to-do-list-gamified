import { IconChevronLeft } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, size, space } from '@/theme';

type Props = { title: string; children: ReactNode; scroll?: boolean; canGoBack?: boolean };

/** Moldura das telas empilhadas (história, conquistas, configurações): título e botão voltar de 44 pt. */
export function ScreenFrame({ title, children, scroll = true, canGoBack = true }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => {
              router.back();
            }}
            style={styles.back}
          >
            <IconChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
          </Pressable>
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Body style={styles.body} {...(scroll ? { contentContainerStyle: styles.content } : {})}>
        {scroll ? children : <View style={styles.content}>{children}</View>}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[8],
    minHeight: size.touchTarget + space[8],
  },
  back: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    paddingLeft: space[8],
  },
  body: { flex: 1 },
  content: { padding: space.screenMargin, gap: space[12], paddingBottom: space[40] },
});
