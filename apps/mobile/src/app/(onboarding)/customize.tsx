import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { CharacterPreview } from '@/components/character-preview';
import { ClassPicker, LookDetails } from '@/components/character-sections';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { layersOfLook, useCharacterDraft } from '@/features/onboarding/character-draft';

/** Character creation, step 2 (optional): detailed appearance and class. */
export default function CustomizeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const look = useCharacterDraft((state) => state.look);
  const setLook = useCharacterDraft((state) => state.setLook);
  const characterClass = useCharacterDraft((state) => state.characterClass);
  const setCharacterClass = useCharacterDraft((state) => state.setCharacterClass);

  return (
    <OnboardingScreen
      preview={<CharacterPreview layers={layersOfLook(look)} />}
      footer={
        <Button
          label={t('character.continue')}
          onPress={() => {
            router.push('/name');
          }}
        />
      }
    >
      <LookDetails look={look} onChange={setLook} />
      <ClassPicker value={characterClass} onChange={setCharacterClass} />
    </OnboardingScreen>
  );
}
