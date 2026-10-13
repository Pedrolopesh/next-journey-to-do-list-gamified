import { IconCoin } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { chapterProgress, useMe } from '@/api/queries';
import { colors, radius, space } from '@/theme';

/**
 * Progresso da história, embaixo do banner das abas: capítulo atual, a barra (EXP dentro do nível,
 * a mesma que move o personagem), nível e moedas. Cada nível ganho conclui um capítulo.
 */
export function StoryProgressBar() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  if (!me) return null;
  const { player, story } = me;
  const progress = chapterProgress(me);
  const percent = Math.round((player.story.completed ? 1 : progress) * 100);
  const chapter = player.story.completed
    ? t('progress.storyDone')
    : t('progress.chapter', { number: player.story.chapter, title: story?.chapterTitle ?? '' });

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t('progress.label')}: ${chapter}. ${t('progress.level', { level: player.level })}. ${t('progress.coins', { count: player.coins })}`}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View style={styles.top}>
        <Text style={styles.chapter} numberOfLines={1}>
          {chapter}
        </Text>
        <View style={styles.coins}>
          <IconCoin size={16} color={colors.brand.gold} strokeWidth={1.75} />
          <Text style={styles.coinsText}>{player.coins}</Text>
        </View>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.bottom}>
        <Text style={styles.level}>{t('progress.level', { level: player.level })}</Text>
        <Text style={styles.exp}>
          {t('progress.exp', { exp: player.expInLevel, next: player.expForNextLevel })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: space[8],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  chapter: { color: colors.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  coinsText: { color: colors.brand.gold, fontSize: 14, fontWeight: '700' },
  bar: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.brand.primary, borderRadius: radius.pill },
  bottom: { flexDirection: 'row', justifyContent: 'space-between' },
  level: { color: colors.brand.primaryLight, fontSize: 12, fontWeight: '600' },
  exp: { color: colors.text.muted, fontSize: 12 },
});
