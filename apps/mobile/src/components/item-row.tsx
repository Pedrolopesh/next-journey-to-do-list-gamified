import type { Item } from '@nextjourney/contracts';
import { IconFlame } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckBox } from '@/components/check-box';
import { DifficultyIcon } from '@/components/difficulty-icon';
import { colors, fontSize, radius, size, space } from '@/theme';

type Props = {
  item: Item;
  onCheck: (item: Item) => void;
  onOpen?: (item: Item) => void;
  /** Check done today on this device: tapping the check again unchecks. */
  onUndo?: (item: Item) => void;
  /** Habit: today and week counter instead of "done". */
  counters?: boolean;
};

/** Item row (daily, task or habit): the same check component for the 3 kinds. */
export function ItemRow({ item, onCheck, onOpen, onUndo, counters = false }: Props) {
  const { t } = useTranslation();
  const done = item.doneToday;
  // Done today and still undoable on this device: the check becomes "uncheck"
  const canUndo = done && onUndo !== undefined;
  // With no way to undo, a done daily or task is locked; a habit can be checked again
  const locked = done && !canUndo && item.type !== 'habit';

  return (
    <View style={styles.row}>
      <CheckBox
        checked={done}
        disabled={locked}
        label={
          canUndo
            ? t('items.uncheckLabel', { title: item.title })
            : locked
              ? t('items.doneLabel', { title: item.title })
              : t('items.checkLabel', { title: item.title })
        }
        onPress={() => {
          if (canUndo) onUndo(item);
          else onCheck(item);
        }}
      />

      <Pressable
        style={styles.body}
        accessibilityRole="button"
        accessibilityLabel={t('items.openLabel', { title: item.title })}
        onPress={() => {
          onOpen?.(item);
        }}
      >
        <Text style={[styles.title, locked && styles.titleDone]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.meta}>
          {item.overdue && !done ? <Text style={styles.overdue}>{t('items.overdue')}</Text> : null}
          {item.streak > 0 ? (
            <View
              style={styles.streak}
              accessibilityLabel={t('items.streak', { count: item.streak })}
            >
              <IconFlame size={14} color={colors.brand.gold} strokeWidth={1.75} />
              <Text style={styles.streakText}>{item.streak}</Text>
            </View>
          ) : null}
          {counters ? (
            <Text style={styles.counters}>
              {t('items.counters', { today: item.checksToday, week: item.checksThisWeek })}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View
        style={styles.difficulty}
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('items.difficultyLabel', {
          level: t(`difficulty.${item.difficulty}`),
        })}
      >
        <DifficultyIcon difficulty={item.difficulty} />
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
  body: { flex: 1, gap: space[4], minHeight: size.touchTarget, justifyContent: 'center' },
  title: { color: colors.text.primary, fontSize: fontSize[15], fontWeight: '500' },
  titleDone: { color: colors.text.secondary, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space[8], flexWrap: 'wrap' },
  overdue: { color: colors.status.danger, fontSize: fontSize[12], fontWeight: '600' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakText: { color: colors.brand.gold, fontSize: fontSize[12], fontWeight: '600' },
  counters: { color: colors.text.muted, fontSize: fontSize[12] },
  difficulty: { width: size.touchTarget / 1.5, alignItems: 'center', justifyContent: 'center' },
});
