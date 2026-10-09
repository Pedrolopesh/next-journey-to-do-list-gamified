import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useAchievements } from '@/api/queries';
import { ScreenFrame } from '@/components/screen-frame';
import { ErrorState, SkeletonList } from '@/components/states';
import { colors, radius, space } from '@/theme';

/** Catálogo de conquistas com critério, progresso e estado (RF-32). */
export default function AchievementsScreen() {
  const { t } = useTranslation();
  const achievements = useAchievements();

  return (
    <ScreenFrame title={t('profile.achievements')}>
      {achievements.isPending ? (
        <SkeletonList rows={4} />
      ) : achievements.isError ? (
        <ErrorState
          message={t('items.load')}
          retryLabel={t('items.retry')}
          onRetry={() => {
            void achievements.refetch();
          }}
        />
      ) : (
        achievements.data.map((achievement) => (
          <View
            key={achievement.slug}
            style={[styles.card, !achievement.unlocked && styles.locked]}
            accessibilityLabel={`${achievement.name}. ${achievement.description}. ${achievement.unlocked ? t('achievements.unlocked') : t('achievements.locked')}`}
          >
            <Text style={styles.name}>
              {achievement.unlocked ? '★ ' : ''}
              {achievement.name}
            </Text>
            <Text style={styles.description}>{achievement.description}</Text>
            {achievement.progress && !achievement.unlocked ? (
              <Text style={styles.progress}>
                {achievement.progress.current}/{achievement.progress.target}
              </Text>
            ) : null}
            {achievement.rewardKey ? (
              <Text style={styles.reward}>
                {t('achievements.reward', { reward: achievement.rewardKey })}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.brand.gold,
    padding: space[12],
  },
  locked: { borderColor: colors.border.subtle, opacity: 0.7 },
  name: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  description: { color: colors.text.secondary, fontSize: 13 },
  progress: { color: colors.brand.primaryLight, fontSize: 12 },
  reward: { color: colors.brand.gold, fontSize: 12 },
});
