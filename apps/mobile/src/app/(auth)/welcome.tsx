import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { colors, space } from '@/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={t('auth.submitRegister')}
          onPress={() => {
            router.push('/register');
          }}
        />
        <Button
          label={t('auth.submitLogin')}
          variant="secondary"
          onPress={() => {
            router.push('/login');
          }}
        />
      </View>
      <Link href="/forgot-password" style={styles.link}>
        {t('auth.forgotPassword')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: space.screenMargin,
    paddingVertical: space[40],
    backgroundColor: colors.bg.base,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[8] },
  title: { color: colors.brand.primaryLight, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.text.secondary, fontSize: 14, textAlign: 'center' },
  actions: { gap: space[12] },
  link: {
    color: colors.brand.primaryLight,
    textAlign: 'center',
    marginTop: space[16],
    fontSize: 13,
  },
});
