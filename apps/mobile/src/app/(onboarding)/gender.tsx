import { type Gender, GENDERS } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { patchMe } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { Button } from '@/components/button';
import { ChoiceList } from '@/components/choice-list';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { useCharacterDraft } from '@/features/onboarding/character-draft';
import { useOnboardingFlow } from '@/features/onboarding/flow-store';

/** Last optional question; answering or skipping it hands the person over to the Home. */
export default function GenderScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<Gender | null>(null);
  const { run, loading } = useAction({
    name: 'onboarding.gender',
    error: (cause) => describeError(cause, t),
  });

  const finish = (): void => {
    useCharacterDraft.getState().reset();
    useOnboardingFlow.getState().setFinishing(false);
  };

  const next = async (): Promise<void> => {
    if (!value) return;
    const ok = await run(async () => {
      queryClient.setQueryData(queryKeys.me, await patchMe({ gender: value }));
    });
    if (ok) finish();
  };

  return (
    <OnboardingScreen
      title={t('onboarding.gender.title')}
      subtitle={t('onboarding.gender.subtitle')}
      footer={
        <>
          <Button
            label={t('onboarding.continue')}
            loading={loading}
            disabled={!value}
            onPress={() => void next()}
          />
          <Button label={t('onboarding.skip')} variant="ghost" onPress={finish} />
        </>
      }
    >
      <ChoiceList
        label={t('onboarding.gender.title')}
        value={value}
        onChange={setValue}
        options={GENDERS.map((id) => ({ value: id, label: t(`onboarding.gender.options.${id}`) }))}
      />
    </OnboardingScreen>
  );
}
