import { characterNameSchema, characterSchema } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { putCharacter } from '@/api/endpoints';
import { queryKeys, showNextPending } from '@/api/queries';
import { Button } from '@/components/button';
import { CharacterPreview } from '@/components/character-preview';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { TextField } from '@/components/text-field';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { layersOfLook, useCharacterDraft } from '@/features/onboarding/character-draft';
import { colors, fontSize, space } from '@/theme';

/** Character creation, step 3: the name (required) and the save of the whole draft. */
export default function NameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const draft = useCharacterDraft();
  const [error, setError] = useState<string | null>(null);
  const { run, loading } = useAction({
    name: 'onboarding.character',
    success: t('character.saved'),
    error: (cause) => describeError(cause, t),
  });

  const submit = async (): Promise<void> => {
    setError(null);
    // Say what is wrong with the name before the generic message
    const nameCheck = characterNameSchema.safeParse(draft.name);
    if (!nameCheck.success && draft.name.trim() !== '') {
      setError(t('character.nameInvalid'));
      toast.error(t('character.nameInvalid'));
      return;
    }
    const parsed = characterSchema.safeParse({
      name: draft.name.trim(),
      title: 'Aventureiro',
      ...(draft.characterClass ? { characterClass: draft.characterClass } : {}),
      ...layersOfLook(draft.look),
    });
    if (!parsed.success) {
      setError(t('character.invalid'));
      toast.error(t('character.invalid'));
      return;
    }
    const ok = await run(async () => {
      await putCharacter(parsed.data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      void showNextPending(queryClient);
    });
    if (ok) router.push('/story');
  };

  return (
    <OnboardingScreen
      preview={<CharacterPreview layers={layersOfLook(draft.look)} />}
      title={t('character.nameTitle')}
      subtitle={t('character.nameText')}
      footer={
        <Button label={t('character.create')} loading={loading} onPress={() => void submit()} />
      }
    >
      <TextField
        label={t('character.name')}
        value={draft.name}
        onChangeText={draft.setName}
        maxLength={40}
        error={error ?? undefined}
      />
      <Text style={{ color: colors.text.muted, fontSize: fontSize[12], marginTop: space[4] }}>
        {t('character.nameHint')}
      </Text>
    </OnboardingScreen>
  );
}
