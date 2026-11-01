import { AGE_RANGES, type AgeRange } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { patchMe } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { Button } from '@/components/button';
import { ChoiceList } from '@/components/choice-list';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';

/** Optional question: the age range is saved only if the person answers. */
export default function AgeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<AgeRange | null>(null);
  const { run, loading } = useAction({
    name: 'onboarding.age',
    error: (cause) => describeError(cause, t),
  });

  const next = async (): Promise<void> => {
    if (!value) return;
    const ok = await run(async () => {
      queryClient.setQueryData(queryKeys.me, await patchMe({ ageRange: value }));
    });
    if (ok) router.push('/gender');
  };

  return (
    <OnboardingScreen
      title={t('onboarding.age.title')}
      subtitle={t('onboarding.age.subtitle')}
      footer={
        <>
          <Button
            label={t('onboarding.continue')}
            loading={loading}
            disabled={!value}
            onPress={() => void next()}
          />
          <Button
            label={t('onboarding.skip')}
            variant="ghost"
            onPress={() => {
              router.push('/gender');
            }}
          />
        </>
      }
    >
      <ChoiceList
        label={t('onboarding.age.title')}
        value={value}
        onChange={setValue}
        options={AGE_RANGES.map((id) => ({ value: id, label: t(`onboarding.age.options.${id}`) }))}
      />
    </OnboardingScreen>
  );
}
