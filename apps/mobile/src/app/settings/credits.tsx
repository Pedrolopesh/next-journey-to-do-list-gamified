import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { CREDITS } from '@/features/credits/credits';
import { colors, radius, space } from '@/theme';

/** Créditos de arte e licenças (Fase 6). A lista vive em features/credits e no CREDITS.md. */
export default function CreditsScreen() {
  const { t } = useTranslation();
  return (
    <ScreenFrame title={t('credits.title')}>
      <Text style={styles.intro}>{t('credits.intro')}</Text>
      {CREDITS.map((credit) => (
        <View key={credit.asset} style={styles.card}>
          <Text style={styles.asset}>{credit.asset}</Text>
          <Text style={styles.meta}>
            {credit.author} · {credit.license}
          </Text>
          {credit.url ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={credit.url}
              onPress={() => void Linking.openURL(credit.url as string)}
            >
              <Text style={styles.link}>{credit.url}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.text.secondary, fontSize: 13 },
  card: {
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: space[16],
  },
  asset: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.text.secondary, fontSize: 12 },
  link: { color: colors.brand.primaryLight, fontSize: 12 },
});
