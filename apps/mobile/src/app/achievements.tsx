import type { Achievement } from '@nextjourney/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useAchievements } from '@/api/queries';
import { AchievementCard } from '@/components/achievement-card';
import { AchievementSheet } from '@/components/achievement-sheet';
import { ScreenFrame } from '@/components/screen-frame';
import { ErrorState, SkeletonList } from '@/components/states';
import { space } from '@/theme';

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
        <View style={styles.grid}>
          {achievements.data.map((achievement) => (
            <AchievementCard
              key={achievement.slug}
              achievement={achievement}
              onPress={setSelected}
            />
          ))}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
