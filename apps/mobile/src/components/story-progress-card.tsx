import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { IconCoin } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { chapterProgress, useMe } from '@/api/queries';
import { colors, radius, rgba, space } from '@/theme';

import { PixelArt } from './pixel-art';

type Props = {
  /** Mostra o saldo de moedas no rodapé (as abas mostram; a Home já tem o indicador de moedas). */
  showCoins?: boolean;
};

/**
 * Avanço da história, o mesmo na Home e nas abas: cenário, nome, capítulo, nível e uma barra em
 * trechos, um por capítulo. Os anteriores ficam cheios; o do capítulo atual enche com a EXP do
 * nível (a mesma que move o personagem). Cada nível ganho conclui um capítulo.
 */
export function StoryProgressCard({ showCoins = false }: Props) {
  const { t } = useTranslation();
  const { data: me } = useMe();
  if (!me) return null;
  const { player, story } = me;
  const total = DEFAULT_GAME_CONFIG.chaptersPerStory;
  const { completed, chapter } = player.story;
  const ratio = completed ? 1 : chapterProgress(me);
  const subtitle = completed
    ? t('progress.storyDone')
    : t('progress.chapter', { number: chapter, title: story?.chapterTitle ?? '' });
  const name = story?.name ?? t('progress.label');

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t('progress.label')}: ${name}. ${subtitle}. ${t('progress.level', { level: player.level })}. ${t('progress.coins', { count: player.coins })}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
    >
      <View style={styles.top}>
        <PixelArt name="scenery" size={48} />
        <View style={styles.titles}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.chapter} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.level}>
          <Text style={styles.levelText}>{t('progress.level', { level: player.level })}</Text>
        </View>
      </View>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, index) => {
          const fill = completed || index + 1 < chapter ? 1 : index + 1 === chapter ? ratio : 0;
          return (
            <View key={index} style={styles.segment}>
              <View style={[styles.fill, { width: `${Math.round(fill * 100)}%` }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.foot}>
        <Text style={styles.footText}>
          {t('home.chapterOf', { number: Math.min(chapter, total), total })}
        </Text>
        {showCoins ? (
          <View style={styles.coins}>
            <IconCoin size={14} color={colors.brand.gold} strokeWidth={1.75} />
            <Text style={styles.coinsText}>{player.coins}</Text>
          </View>
        ) : null}
        <Text style={styles.footText}>
          {t('progress.exp', { exp: player.expInLevel, next: player.expForNextLevel })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[12],
    borderWidth: 1.5,
    borderColor: rgba(colors.brand.primary, 0.7),
    backgroundColor: rgba(colors.brand.primary, 0.08),
    borderRadius: radius.card,
    padding: space[16],
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  titles: { flex: 1, gap: 2 },
  name: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  chapter: { color: colors.text.secondary, fontSize: 13 },
  level: {
    borderRadius: radius.pill,
    backgroundColor: rgba(colors.brand.primary, 0.3),
    paddingVertical: space[4],
    paddingHorizontal: space[12],
  },
  levelText: { color: colors.brand.primaryLight, fontSize: 12, fontWeight: '700' },
  segments: { flexDirection: 'row', gap: space[4] },
  segment: {
    flex: 1,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.brand.primary },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footText: { color: colors.text.muted, fontSize: 12 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  coinsText: { color: colors.brand.gold, fontSize: 13, fontWeight: '700' },
});
