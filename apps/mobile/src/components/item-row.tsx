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
  /** Check feito hoje neste aparelho: tocar de novo no check desmarca. */
  onUndo?: (item: Item) => void;
  /** Hábito: contador de hoje e da semana em vez de "feito". */
  counters?: boolean;
};

/** Linha de item (diário, tarefa ou hábito): o mesmo componente de check para os 3 tipos. */
export function ItemRow({ item, onCheck, onOpen, onUndo, counters = false }: Props) {
  const { t } = useTranslation();
  const done = item.doneToday;
  // Feito hoje e ainda desfazível neste aparelho: o check vira "desmarcar"
  const canUndo = done && onUndo !== undefined;
  // Sem como desfazer, diário e tarefa feitos ficam bloqueados; hábito pode ser marcado de novo
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
