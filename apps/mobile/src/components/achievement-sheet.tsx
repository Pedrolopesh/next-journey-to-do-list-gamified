import type { Achievement } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { tierColor } from '@/features/achievements/tier';
import { colors, fontSize, radius, space } from '@/theme';

import { CelebrationModal } from './celebration-modal';
import { Insignia } from './pixel-art';

type Props = { achievement: Achievement | null; onClose: () => void };

/**
 * Detalhes da conquista no mesmo modal de quando ela é ganha (topo colorido, raios e insígnia):
 * conquistada pinta na cor da classe; bloqueada fica neutra, com o critério e o progresso.
 */
export function AchievementSheet({ achievement, onClose }: Props) {
  const { t } = useTranslation();
  if (!achievement) return null;
  const progress = achievement.progress ?? null;
  const percent = progress
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : 0;
  const state = achievement.unlocked
    ? achievement.unlockedAt
      ? t('achievements.unlockedAt', {
          date: new Date(achievement.unlockedAt).toLocaleDateString('pt-BR'),
        })
      : t('achievements.unlocked')
    : t('achievements.locked');

  return (
    <CelebrationModal
      visible
      tone={achievement.unlocked ? tierColor(achievement.tier) : colors.bg.raised}
      art={
        <View style={!achievement.unlocked && styles.dimmed}>
          <Insignia glyph={achievement.glyph} size={92} />
        </View>
      }
      headline={achievement.unlocked ? t('feedback.achievementUnlocked') : t('achievements.locked')}
      title={achievement.name}
      description={achievement.description ?? t('achievements.secretHint')}
      primaryLabel={t('common.close')}
      onPrimary={onClose}
      onClose={onClose}
    >
      <Text style={[styles.tier, { color: tierColor(achievement.tier) }]}>
        {t(`achievements.tier.${achievement.tier}`)}
      </Text>
      {achievement.unlocked ? <Text style={styles.state}>{state}</Text> : null}
      {progress && !achievement.unlocked ? (
        <View
          style={styles.progress}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('achievements.progress', {
            current: progress.current,
            target: progress.target,
          })}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t('achievements.progress', { current: progress.current, target: progress.target })}
          </Text>
        </View>
      ) : null}
    </CelebrationModal>
  );
}

const styles = StyleSheet.create({
  dimmed: { opacity: 0.45 },
  state: {
    color: colors.brand.gold,
    fontSize: fontSize[13],
    fontWeight: '600',
    textAlign: 'center',
  },
  tier: { fontSize: fontSize[13], fontWeight: '700', textAlign: 'center' },
  progress: { gap: space[4] },
  bar: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.brand.primary },
  progressText: {
    color: colors.brand.primaryLight,
    fontSize: fontSize[12],
    textAlign: 'center',
  },
});
