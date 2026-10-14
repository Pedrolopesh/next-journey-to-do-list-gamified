import type { Achievement } from '@nextjourney/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAchievements } from '@/api/queries';
import { AchievementCard } from '@/components/achievement-card';
import { AchievementSheet } from '@/components/achievement-sheet';
import { ScreenFrame } from '@/components/screen-frame';
import { ErrorState, SkeletonList } from '@/components/states';

/** Catálogo de conquistas com critério, progresso e estado (RF-32); toque abre os detalhes. */
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
        achievements.data.map((achievement) => (
          <AchievementCard key={achievement.slug} achievement={achievement} onPress={setSelected} />
        ))
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
