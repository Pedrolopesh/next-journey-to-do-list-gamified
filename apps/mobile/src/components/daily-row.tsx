import type { Item } from '@nextjourney/contracts';
import { IconFlame } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, size, space } from '@/theme';

type Props = { item: Item; onCheck: (item: Item) => void };

const DIFFICULTY_COLOR = {
  easy: colors.status.success,
  medium: colors.status.warning,
  hard: colors.status.danger,
} as const;

/** Linha de um diário: check de 44 pt, título, dificuldade, sequência e marca de atraso. */
export function DailyRow({ item, onCheck }: Props) {
  const { t } = useTranslation();
  const done = item.doneToday;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: done }}
        accessibilityLabel={
          done
            ? t('dailies.doneLabel', { title: item.title })
            : t('dailies.checkLabel', { title: item.title })
        }
        disabled={done}
        onPress={() => {
          onCheck(item);
        }}
        style={[styles.check, done && styles.checkDone]}
      >
        {done ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.chip, { color: DIFFICULTY_COLOR[item.difficulty] }]}>
            {t(`difficulty.${item.difficulty}`)}
          </Text>
          {item.overdue && !done ? (
            <Text style={styles.overdue}>{t('dailies.overdue')}</Text>
          ) : null}
          {item.streak > 0 ? (
            <View
              style={styles.streak}
              accessibilityLabel={t('dailies.streak', { count: item.streak })}
            >
              <IconFlame size={14} color={colors.brand.gold} strokeWidth={1.75} />
              <Text style={styles.streakText}>{item.streak}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.subtle,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space[12],
  },
  check: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkMark: { color: colors.text.onPrimary, fontSize: 20, fontWeight: '700' },
  body: { flex: 1, gap: space[4] },
  title: { color: colors.text.primary, fontSize: 15, fontWeight: '500' },
  titleDone: { color: colors.text.secondary, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  chip: { fontSize: 12, fontWeight: '600' },
  overdue: { color: colors.status.danger, fontSize: 12, fontWeight: '600' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakText: { color: colors.brand.gold, fontSize: 12, fontWeight: '600' },
});
