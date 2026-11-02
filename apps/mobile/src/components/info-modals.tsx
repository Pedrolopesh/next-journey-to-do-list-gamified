import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { IconTrophy } from '@tabler/icons-react-native';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';

import { STORY_IMAGES } from '@/features/onboarding/story-art';
import { colors, fontSize, radius, space } from '@/theme';

import { CelebrationModal } from './celebration-modal';
import { PixelArt, type PixelArtName } from './pixel-art';

const config = DEFAULT_GAME_CONFIG;

function Section({ art, title, children }: { art: ReactNode; title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.art}>{art}</View>
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const Line = ({ children }: { children: string }) => <Text style={styles.line}>{children}</Text>;
const pixel = (name: PixelArtName) => <PixelArt name={name} size={36} />;

type CoinsProps = { visible: boolean; coins: number; onClose: () => void };

/** What coins are and how they are earned and lost (opened from the "Moedas" card of the Home). */
export function CoinsInfoModal({ visible, coins, onClose }: CoinsProps) {
  const { t } = useTranslation();
  const earned = config.coinsByDifficulty;
  return (
    <CelebrationModal
      visible={visible}
      tone={colors.brand.gold}
      art={<PixelArt name="coin" size={84} />}
      headline={t('info.coins.headline')}
      title={t('info.coins.title')}
      description={t('info.coins.balance', { count: coins })}
      primaryLabel={t('info.close')}
      onPrimary={onClose}
      onClose={onClose}
    >
      <Section art={pixel('check')} title={t('info.coins.earnTitle')}>
        <Line>
          {t('info.coins.earnCheck', {
            easy: earned.easy,
            medium: earned.medium,
            hard: earned.hard,
          })}
        </Line>
        <Line>{t('info.coins.earnLevel', { bonus: config.levelUpBonusCoins })}</Line>
        <Line>{t('info.coins.earnAgain')}</Line>
      </Section>
      <Section art={pixel('streak')} title={t('info.coins.loseTitle')}>
        <Line>
          {t('info.coins.lose', {
            first: config.undoCoinPenalty[0],
            second: config.undoCoinPenalty[1],
          })}
        </Line>
      </Section>
    </CelebrationModal>
  );
}

type LevelProps = {
  visible: boolean;
  level: number;
  expInLevel: number;
  expForNextLevel: number;
  chapter: number;
  storySlug: string | null;
  onClose: () => void;
};

/** What levels are: the EXP now, how it is earned and what the next levels unlock. */
export function LevelInfoModal({
  visible,
  level,
  expInLevel,
  expForNextLevel,
  chapter,
  storySlug,
  onClose,
}: LevelProps) {
  const { t } = useTranslation();
  const exp = config.expByDifficulty;
  const total = config.chaptersPerStory;
  const ratio = expForNextLevel > 0 ? Math.min(1, expInLevel / expForNextLevel) : 0;
  const scene = storySlug ? STORY_IMAGES[storySlug] : undefined;
  return (
    <CelebrationModal
      visible={visible}
      tone={colors.brand.primary}
      art={<IconTrophy size={64} color={colors.brand.primary} strokeWidth={1.75} />}
      headline={t('info.level.headline', { level })}
      title={t('info.level.title')}
      primaryLabel={t('info.close')}
      onPrimary={onClose}
      onClose={onClose}
    >
      <View style={styles.now}>
        <Text style={styles.sectionTitle}>{t('info.level.now')}</Text>
        <View
          style={styles.bar}
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
        >
          <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
        </View>
        <Text style={styles.line}>
          {t('info.level.nowValue', {
            exp: expInLevel,
            next: expForNextLevel,
            nextLevel: level + 1,
          })}
        </Text>
      </View>
      <Section art={pixel('check')} title={t('info.level.expTitle')}>
        <Line>{t('info.level.exp', { easy: exp.easy, medium: exp.medium, hard: exp.hard })}</Line>
      </Section>
      <Section art={pixel('coin')} title={t('info.level.upTitle')}>
        <Line>{t('info.level.up', { bonus: config.levelUpBonusCoins })}</Line>
      </Section>
      <Section art={pixel('scenery')} title={t('info.level.unlockTitle')}>
        <Line>{t('info.level.unlock', { chapters: total })}</Line>
        {scene ? (
          <Image
            source={scene}
            style={styles.scene}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <View
          style={styles.dots}
          accessibilityLabel={t('info.level.chapterOf', { number: chapter, total })}
        >
          {Array.from({ length: total }, (_, index) => (
            <View key={index} style={[styles.dot, index + 1 <= chapter && styles.dotDone]} />
          ))}
        </View>
      </Section>
    </CelebrationModal>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: 'row', gap: space[12], alignItems: 'flex-start' },
  art: { width: 40, alignItems: 'center', paddingTop: space[4] },
  sectionText: { flex: 1, gap: space[4] },
  sectionTitle: { color: colors.text.primary, fontSize: fontSize[14], fontWeight: '700' },
  line: { color: colors.text.secondary, fontSize: fontSize[13] },
  now: { gap: space[4] },
  bar: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.brand.primary },
  scene: { width: '100%', height: 90, borderRadius: radius.md, marginTop: space[4] },
  dots: { flexDirection: 'row', gap: space[4], marginTop: space[4] },
  dot: { flex: 1, height: 8, borderRadius: 3, backgroundColor: colors.bg.sunken },
  dotDone: { backgroundColor: colors.brand.primary },
});
