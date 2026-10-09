import type { Item } from '@nextjourney/contracts';
import { IconFlame } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, size, space } from '@/theme';

type Props = {
  item: Item;
  onCheck: (item: Item) => void;
  onOpen?: (item: Item) => void;
  /** Mostra "Desfazer" (check feito hoje neste aparelho). */
  onUndo?: (item: Item) => void;
  /** Hábito: contador de hoje e da semana em vez de "feito". */
  counters?: boolean;
};

const DIFFICULTY_COLOR = {
  easy: colors.status.success,
  medium: colors.status.warning,
  hard: colors.status.danger,
} as const;

/** Linha de item (diário, tarefa ou hábito): o mesmo componente de check para os 3 tipos. */
export function ItemRow({ item, onCheck, onOpen, onUndo, counters = false }: Props) {
  const { t } = useTranslation();
  const done = item.doneToday;
  // Hábito pode ser marcado várias vezes: o check nunca fica bloqueado
  const locked = done && item.type !== 'habit';

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: locked }}
        accessibilityLabel={
          locked
            ? t('items.doneLabel', { title: item.title })
            : t('items.checkLabel', { title: item.title })
        }
        disabled={locked}
        onPress={() => {
          onCheck(item);
        }}
        style={[styles.check, done && styles.checkDone]}
      >
        {done ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>

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
          <Text style={[styles.chip, { color: DIFFICULTY_COLOR[item.difficulty] }]}>
            {t(`difficulty.${item.difficulty}`)}
          </Text>
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

      {onUndo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feedback.undo')}
          onPress={() => {
            onUndo(item);
          }}
          style={styles.undo}
        >
          <Text style={styles.undoText}>{t('feedback.undo')}</Text>
        </Pressable>
      ) : null}
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
  body: { flex: 1, gap: space[4], minHeight: size.touchTarget, justifyContent: 'center' },
  title: { color: colors.text.primary, fontSize: 15, fontWeight: '500' },
  titleDone: { color: colors.text.secondary, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space[8], flexWrap: 'wrap' },
  chip: { fontSize: 12, fontWeight: '600' },
  overdue: { color: colors.status.danger, fontSize: 12, fontWeight: '600' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakText: { color: colors.brand.gold, fontSize: 12, fontWeight: '600' },
  counters: { color: colors.text.muted, fontSize: 12 },
  undo: { minHeight: size.touchTarget, justifyContent: 'center', paddingHorizontal: space[8] },
  undoText: { color: colors.brand.primaryLight, fontSize: 12, fontWeight: '600' },
});
