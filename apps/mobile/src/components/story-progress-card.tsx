import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { IconCoin } from '@tabler/icons-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { storyRatio, useMe } from '@/api/queries';
import { colors, fontSize, radius, rgba, space, tonedCard } from '@/theme';

import { LevelInfoModal } from './info-modals';
import { PixelArt } from './pixel-art';

type Props = {
  /** Mostra o saldo de moedas no rodapé (as abas mostram; a Home já tem o indicador de moedas). */
  showCoins?: boolean;
};

type ViewProps = {
  name: string;
  /** Capítulo atual ("Capítulo 1: A chegada") ou "História concluída". */
  subtitle: string;
  chapter: number;
  completed: boolean;
  level: number;
  coins: number;
  expInLevel: number;
  expForNextLevel: number;
  /** Quanto do capítulo atual já está cheio, de 0 a 1. */
  ratio: number;
  showCoins?: boolean;
};

/** Um trecho da barra: o preenchimento anima quando o valor muda (EXP subindo). */
function Segment({ fill }: { fill: number }) {
  const [value] = useState(() => new Animated.Value(fill));
  useEffect(() => {
    Animated.timing(value, { toValue: fill, duration: 450, useNativeDriver: false }).start();
  }, [fill, value]);
  return (
    <View style={styles.segment}>
      <Animated.View
        style={[
          styles.fill,
          { width: value.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

/**
 * Avanço da história, só a parte visual (sem dados do servidor): a Home, as abas e a demonstração
 * da introdução usam este mesmo componente, então a aparência muda em todos de uma vez.
 */
export function StoryProgressView({
  name,
  subtitle,
  chapter,
  completed,
  level,
  coins,
  expInLevel,
  expForNextLevel,
  ratio,
  showCoins = false,
}: ViewProps) {
  const { t } = useTranslation();
  const total = DEFAULT_GAME_CONFIG.chaptersPerStory;
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t('progress.label')}: ${name}. ${subtitle}. ${t('progress.level', { level })}. ${t('progress.coins', { count: coins })}`}
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
        {Array.from({ length: total }, (_, index) => (
          <Segment
            key={index}
            fill={completed || index + 1 < chapter ? 1 : index + 1 === chapter ? ratio : 0}
          />
        ))}
      </View>
      <View style={styles.foot}>
        <Text style={styles.footText}>
          {t('home.chapterOf', { number: Math.min(chapter, total), total })}
        </Text>
        {showCoins ? (
          <View style={styles.coins}>
            <IconCoin size={14} color={colors.brand.gold} strokeWidth={1.75} />
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
        ) : null}
        <Text style={styles.footText}>
          {t('progress.exp', { exp: expInLevel, next: expForNextLevel })}
        </Text>
      </View>
    </View>
  );
}

/** Avanço da história do usuário, o mesmo na Home e nas abas (dados do servidor). */
export function StoryProgressCard({ showCoins = false }: Props) {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  if (!me) return null;
  const { player, story } = me;
  const { completed, chapter } = player.story;
  return (
    <>
      <LevelInfoModal
        visible={open}
        level={player.level}
        expInLevel={player.expInLevel}
        expForNextLevel={player.expForNextLevel}
        chapter={chapter}
        storySlug={story?.slug ?? null}
        onClose={() => {
          setOpen(false);
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityHint={t('info.level.title')}
        onPress={() => {
          setOpen(true);
        }}
      >
        <StoryProgressView
          name={story?.name ?? t('progress.label')}
          subtitle={
            completed
              ? t('progress.storyDone')
              : t('progress.chapter', { number: chapter, title: story?.chapterTitle ?? '' })
          }
          chapter={chapter}
          completed={completed}
          level={player.level}
          coins={player.coins}
          expInLevel={player.expInLevel}
          expForNextLevel={player.expForNextLevel}
          ratio={storyRatio(me)}
          showCoins={showCoins}
        />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[12],
    ...tonedCard(colors.brand.primary),
    borderRadius: radius.card,
    padding: space[16],
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  titles: { flex: 1, gap: 2 },
  name: { color: colors.text.primary, fontSize: fontSize[16], fontWeight: '600' },
  chapter: { color: colors.text.secondary, fontSize: fontSize[13] },
  level: {
    borderRadius: radius.pill,
    backgroundColor: rgba(colors.brand.primary, 0.3),
    paddingVertical: space[4],
    paddingHorizontal: space[12],
  },
  levelText: { color: colors.brand.primaryLight, fontSize: fontSize[12], fontWeight: '700' },
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
  footText: { color: colors.text.muted, fontSize: fontSize[12] },
  coins: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  coinsText: { color: colors.brand.gold, fontSize: fontSize[13], fontWeight: '700' },
});
