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

/** "What do you want to change in your life?": one or more goals, saved on the profile. */
export default function GoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const { run, loading } = useAction({
    name: 'onboarding.goal',
    error: (error) => describeError(error, t),
  });

  const next = async (): Promise<void> => {
    if (goals.length === 0) return;
    const ok = await run(async () => {
      queryClient.setQueryData(queryKeys.me, await patchMe({ goals }));
    });
    if (ok) router.push('/age');
  };

  return (
    <OnboardingScreen
      hideBack
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      footer={
        <Button
          label={t('onboarding.continue')}
          loading={loading}
          disabled={goals.length === 0}
          onPress={() => void next()}
        />
      }
    >
      <ChoiceList
        label={t('onboarding.goal.title')}
        multiple
        value={goals}
        onChange={(value) => {
          setGoals((current) =>
            current.includes(value)
              ? current.filter((goal) => goal !== value)
              : [...current, value],
          );
        }}
        options={GOALS.map((value) => ({
          value,
          label: t(`onboarding.goal.options.${value}`),
          art: ICONS[value],
        }))}
      />
    </OnboardingScreen>
  );
}
