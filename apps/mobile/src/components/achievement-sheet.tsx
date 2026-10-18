import type { Achievement } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { tierColor } from '@/features/achievements/tier';
import { colors, radius, space } from '@/theme';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Insignia } from './pixel-art';

type Props = { achievement: Achievement | null; onClose: () => void };

/** Detalhes da conquista num modal que sobe do rodapé: classe, critério, progresso e data. */
export function AchievementSheet({ achievement, onClose }: Props) {
  const { t } = useTranslation();
  const progress = achievement?.progress ?? null;
  const percent = progress
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : 0;

  return (
    <BottomSheet visible={achievement !== null} onClose={onClose}>
      {achievement ? (
        <>
          <View style={[styles.art, !achievement.unlocked && styles.dimmed]}>
            <Insignia glyph={achievement.glyph} size={112} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {achievement.unlocked ? '★ ' : ''}
            {achievement.name}
          </Text>
          <Text style={styles.state}>
            {achievement.unlocked
              ? achievement.unlockedAt
                ? t('achievements.unlockedAt', {
                    date: new Date(achievement.unlockedAt).toLocaleDateString('pt-BR'),
                  })
                : t('achievements.unlocked')
              : t('achievements.locked')}
          </Text>
          <Text style={[styles.tier, { color: tierColor(achievement.tier) }]}>
            {t(`achievements.tier.${achievement.tier}`)}
          </Text>
          <Text style={styles.description}>
            {achievement.description ?? t('achievements.secretHint')}
          </Text>
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
          <Button label={t('common.close')} variant="secondary" onPress={onClose} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center' },
  dimmed: { opacity: 0.45 },
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  state: { color: colors.brand.gold, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  description: { color: colors.text.secondary, fontSize: 15 },
  progress: { gap: space[4] },
  bar: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.brand.primary },
  progressText: { color: colors.brand.primaryLight, fontSize: 12 },
  tier: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
