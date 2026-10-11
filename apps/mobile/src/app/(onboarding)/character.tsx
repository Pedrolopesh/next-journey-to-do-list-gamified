import type { Character, CharacterLayers } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { putCharacter } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys } from '@/api/queries';
import { CharacterForm } from '@/components/character-form';
import { CharacterPreview } from '@/components/character-preview';
import { toast } from '@/features/feedback/toast-store';
import { DEFAULT_LOOK, legacyHair, legacySkin } from '@/features/qg/options';
import { colors, space } from '@/theme';

const START_LAYERS = {
  skin: legacySkin(DEFAULT_LOOK.skin),
  hair: legacyHair(DEFAULT_LOOK.hair),
  outfit: 'tunic-purple',
  look: DEFAULT_LOOK,
};

/** Criação do personagem (RF-11) com a prévia animada no banner. */
export default function CharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [layers, setLayers] = useState<CharacterLayers>(START_LAYERS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (character: Character): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await putCharacter(character);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      const me = queryClient.getQueryData<{ onboarding: { hasStory: boolean } }>(queryKeys.me);
      toast.success(t('character.saved'));
      if (!me?.onboarding.hasStory) router.replace('/story');
    } catch (cause) {
      const message = toApiError(cause)?.message ?? t('character.saveFailed');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CharacterPreview layers={layers} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <CharacterForm
          initial={null}
          submitLabel={t('character.create')}
          submitting={saving}
          error={error}
          onSubmit={(character) => void save(character)}
          onPreview={setLayers}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: space.screenMargin, paddingBottom: space[40] },
});
