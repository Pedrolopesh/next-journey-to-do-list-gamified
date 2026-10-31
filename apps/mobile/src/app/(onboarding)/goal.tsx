import { type Goal, GOALS } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { patchMe } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { Button } from '@/components/button';
import { ChoiceList } from '@/components/choice-list';
import { OnboardingScreen } from '@/components/onboarding-screen';
import type { PixelArtName } from '@/components/pixel-art';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';

const ICONS: Record<Goal, PixelArtName> = {
  procrastination: 'tasks',
  fitness: 'marathon',
  discipline: 'streak',
  wellbeing: 'sprout',
  projects: 'scenery',
  fun: 'coin',
  learning: 'apprentice',
};

/** "What do you want to change in your life?": one goal, saved on the profile. */
export default function GoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [goal, setGoal] = useState<Goal | null>(null);
  const { run, loading } = useAction({
    name: 'onboarding.goal',
    error: (error) => describeError(error, t),
  });

  const next = async (): Promise<void> => {
    if (!goal) return;
    const ok = await run(async () => {
      queryClient.setQueryData(queryKeys.me, await patchMe({ goal }));
    });
    if (ok) router.push('/character');
  };

  return (
    <OnboardingScreen
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      footer={
        <Button
          label={t('onboarding.continue')}
          loading={loading}
          disabled={!goal}
          onPress={() => void next()}
        />
      }
    >
      <ChoiceList
        label={t('onboarding.goal.title')}
        value={goal}
        onChange={setGoal}
        options={GOALS.map((value) => ({
          value,
          label: t(`onboarding.goal.options.${value}`),
          art: ICONS[value],
        }))}
      />
    </OnboardingScreen>
  );
}
