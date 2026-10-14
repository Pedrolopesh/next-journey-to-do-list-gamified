import type { Achievement } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/theme';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';

type Props = { achievement: Achievement | null; onClose: () => void };

/** Detalhes da conquista num modal que sobe do rodapé: critério, progresso, data e recompensa. */
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
          <Text style={styles.description}>{achievement.description}</Text>
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
          {achievement.rewardKey ? (
            <Text style={styles.reward}>
              {t('achievements.reward', { reward: achievement.rewardKey })}
            </Text>
          ) : null}
          <Button label={t('common.close')} variant="secondary" onPress={onClose} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '700' },
  state: { color: colors.brand.gold, fontSize: 13, fontWeight: '600' },
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
  reward: { color: colors.brand.gold, fontSize: 13 },
});
