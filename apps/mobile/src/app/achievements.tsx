import { type Achievement, ACHIEVEMENT_TRAILS } from '@nextjourney/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useAchievements } from '@/api/queries';
import { AchievementCard } from '@/components/achievement-card';
import { AchievementSheet } from '@/components/achievement-sheet';
import { ScreenFrame } from '@/components/screen-frame';
import { ErrorState, SkeletonList } from '@/components/states';
import { colors, space } from '@/theme';

/** Galeria de conquistas em pixel art com critério, progresso e estado (RF-32); toque abre os detalhes. */
export default function AchievementsScreen() {
  const { t } = useTranslation();
  const achievements = useAchievements();
  const [selected, setSelected] = useState<Achievement | null>(null);

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
        <View style={styles.sections}>
          {ACHIEVEMENT_TRAILS.map((trail) => {
            const items = achievements.data.filter((item) => item.trail === trail.id);
            if (items.length === 0) return null;
            const done = items.filter((item) => item.unlocked).length;
            return (
              <View key={trail.id} style={styles.section}>
                <Text style={styles.trail} accessibilityRole="header">
                  {trail.name}
                  <Text style={styles.count}>{`  ${done}/${items.length}`}</Text>
                </Text>
                <Text style={styles.goal}>{trail.goal}</Text>
                <View style={styles.grid}>
                  {items.map((achievement) => (
                    <AchievementCard
                      key={achievement.slug}
                      achievement={achievement}
                      onPress={setSelected}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
      <AchievementSheet
        achievement={selected}
        onClose={() => {
          setSelected(null);
        }}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space[24] },
  section: { gap: space[8] },
  trail: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  count: { color: colors.text.secondary, fontSize: 14, fontWeight: '600' },
  goal: { color: colors.text.secondary, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
