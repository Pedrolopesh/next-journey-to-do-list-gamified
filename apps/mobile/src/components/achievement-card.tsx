import type { Achievement } from '@nextjourney/contracts';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tierColor } from '@/features/achievements/tier';
import { colors, radius, softGlowOutline, space } from '@/theme';

import { Insignia } from './pixel-art';

type Props = { achievement: Achievement; onPress: (achievement: Achievement) => void };

/** Peça da galeria: insígnia no topo e moldura na cor da classe; apagada enquanto bloqueada. */
export function AchievementCard({ achievement, onPress }: Props) {
  const { t } = useTranslation();
  const { unlocked, progress } = achievement;
  const frame = tierColor(achievement.tier);
  const description = achievement.description ?? t('achievements.secretHint');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${achievement.name}. ${description}. ${unlocked ? t('achievements.unlocked') : t('achievements.locked')}`}
      onPress={() => {
        onPress(achievement);
      }}
      style={({ pressed }) => [
        styles.card,
        unlocked ? softGlowOutline(frame) : styles.locked,
        pressed && styles.pressed,
      ]}
    >
      <View style={!unlocked && styles.dimmed}>
        <Insignia glyph={achievement.glyph} size={64} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {achievement.name}
      </Text>
      <Text style={unlocked ? styles.done : styles.status}>
        {unlocked
          ? t('achievements.unlocked')
          : progress
            ? `${progress.current}/${progress.target}`
            : t('achievements.locked')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space[12],
  },
  locked: { borderColor: colors.border.subtle },
  dimmed: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
  name: { color: colors.text.primary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  done: { color: colors.text.primary, fontSize: 12, fontWeight: '600' },
  status: { color: colors.text.secondary, fontSize: 12 },
});
