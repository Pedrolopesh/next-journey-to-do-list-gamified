import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { CharacterPreview } from '@/components/character-preview';
import { ReadyLooks } from '@/components/character-sections';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { layersOfLook, useCharacterDraft } from '@/features/onboarding/character-draft';

/** Character creation, step 1: ready-made looks with a fixed preview. */
export default function CharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const look = useCharacterDraft((state) => state.look);
  const setLook = useCharacterDraft((state) => state.setLook);

  return (
    <OnboardingScreen
      preview={<CharacterPreview layers={layersOfLook(look)} />}
      footer={
        <>
          <Button
            label={t('character.customizeCta')}
            onPress={() => {
              router.push('/customize');
            }}
          />
          <Button
            label={t('character.skipPresets')}
            variant="ghost"
            onPress={() => {
              router.push('/name');
            }}
          />
        </>
      }
    >
      <ReadyLooks look={look} onChange={setLook} />
    </OnboardingScreen>
  );
}
