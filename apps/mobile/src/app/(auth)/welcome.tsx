import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { SocialButtons } from '@/components/social-buttons';
import { colors, fontSize, space } from '@/theme';

const logo = require('../../../assets/images/logo-livro.png') as number;

/** First screen without a session: Apple, Google or email (no password anywhere). */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + space[16] },
      ]}
    >
      <View style={styles.hero}>
        <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
        <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
      </View>
      <View style={styles.actions}>
        <Text style={styles.tagline}>{t('entry.tagline')}</Text>
        <SocialButtons showDivider={false} />
        <Button
          label={t('entry.continueEmail')}
          onPress={() => {
            router.push('/email');
          }}
        />
        <Text style={styles.legal}>
          {t('entry.legal.before')}
          <Text
            style={styles.underline}
            accessibilityRole="link"
            onPress={() => {
              router.push({ pathname: '/legal/[slug]', params: { slug: 'terms' } });
            }}
          >
            {t('entry.legal.terms')}
          </Text>
          {t('entry.legal.middle')}
          <Text
            style={styles.underline}
            accessibilityRole="link"
            onPress={() => {
              router.push({ pathname: '/legal/[slug]', params: { slug: 'privacy' } });
            }}
          >
            {t('entry.legal.privacy')}
          </Text>
          {t('entry.legal.after')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.screenMargin,
    backgroundColor: colors.bg.base,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[8] },
  logo: { width: 160, height: 140, marginBottom: space[16] },
  title: { color: colors.brand.primaryLight, fontSize: fontSize[28], fontWeight: '700' },
  subtitle: { color: colors.text.secondary, fontSize: fontSize[14], textAlign: 'center' },
  actions: { gap: space[12] },
  tagline: { color: colors.text.secondary, fontSize: fontSize[14], textAlign: 'center' },
  legal: { color: colors.text.muted, fontSize: fontSize[12], textAlign: 'center' },
  underline: { textDecorationLine: 'underline' },
});
