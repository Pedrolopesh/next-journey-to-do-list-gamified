import { PASSWORD_RULES } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/theme';

/** Checklist das regras da senha, visível até o envio (RF-01). As regras vêm do contrato. */
export function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.list} accessibilityRole="list">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <Text
            key={rule.id}
            style={[styles.rule, ok && styles.ok]}
            accessibilityLabel={`${t(`auth.passwordRules.${rule.id}`)}: ${ok ? 'atendida' : 'pendente'}`}
          >
            {ok ? '✓' : '•'} {t(`auth.passwordRules.${rule.id}`)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[4] },
  rule: { color: colors.text.secondary, fontSize: 12 },
  ok: { color: colors.status.success },
});
