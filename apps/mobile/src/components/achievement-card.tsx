import type { Achievement } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '@/theme';

type Props = { achievement: Achievement; onPress: (achievement: Achievement) => void };

/** Cartão da conquista (toque abre os detalhes): dourado quando desbloqueada, apagado quando não. */
export function AchievementCard({ achievement, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${achievement.name}. ${achievement.description}. ${achievement.unlocked ? t('achievements.unlocked') : t('achievements.locked')}`}
      onPress={() => {
        onPress(achievement);
      }}
      style={({ pressed }) => [
        styles.card,
        !achievement.unlocked && styles.locked,
        pressed && styles.pressed,
      ]}
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
    </Pressable>
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
  pressed: { transform: [{ scale: 0.98 }] },
  name: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  description: { color: colors.text.secondary, fontSize: 13 },
  progress: { color: colors.brand.primaryLight, fontSize: 12 },
  reward: { color: colors.brand.gold, fontSize: 12 },
});
