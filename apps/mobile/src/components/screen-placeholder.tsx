import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/theme';

type Props = { title: string };

// Tela vazia com o tema escuro. Cada tela real substitui este componente nas próximas fases.
export function ScreenPlaceholder({ title }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.subtitle}>{t('placeholder.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.base,
    padding: space.screenMargin,
    gap: space[8],
  },
  title: { color: colors.text.primary, fontSize: 22, fontWeight: '600' },
  subtitle: { color: colors.text.secondary, fontSize: 14 },
});
