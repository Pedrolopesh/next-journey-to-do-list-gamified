import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, rgba, space } from '@/theme';

import { PixelArt } from './pixel-art';

type Props = {
  name: string;
  chapter: number;
  chapterTitle: string;
  level: number;
  expInLevel: number;
  expForNextLevel: number;
  completed: boolean;
};

/**
 * Avanço da história na Home: nome, capítulo, nível e uma barra em trechos, um por capítulo.
 * Trechos anteriores ficam cheios; o do capítulo atual enche com a EXP do nível.
 */
export function HomeStoryCard({
  name,
  chapter,
  chapterTitle,
  level,
  expInLevel,
  expForNextLevel,
  completed,
}: Props) {
  const { t } = useTranslation();
  const total = DEFAULT_GAME_CONFIG.chaptersPerStory;
  const ratio = completed ? 1 : Math.min(1, Math.max(0, expInLevel / expForNextLevel));
  const subtitle = completed
    ? t('progress.storyDone')
    : t('home.chapter', { number: chapter, title: chapterTitle });

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t('home.storyCard', { name })}. ${subtitle}. ${t('progress.level', { level })}`}
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
          <Text style={styles.levelText}>{t('progress.level', { level })}</Text>
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
        <Text style={styles.footText}>
          {t('progress.exp', { exp: expInLevel, next: expForNextLevel })}
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
  foot: { flexDirection: 'row', justifyContent: 'space-between' },
  footText: { color: colors.text.muted, fontSize: 12 },
});
