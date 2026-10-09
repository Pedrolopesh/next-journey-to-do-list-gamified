import type { Character } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { putCharacter } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys } from '@/api/queries';
import { BannerView, type BannerViewHandle, type InitMessage } from '@/banner/banner-view';
import { CharacterForm } from '@/components/character-form';
import { colors, space } from '@/theme';

const PREVIEW_INIT: InitMessage = {
  v: 1,
  type: 'INIT',
  payload: {
    scene: 'map',
    character: { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' },
    sceneKey: 'preview',
    progress: 0.5,
    timeOfDay: 'night',
  },
};

/** Criação do personagem (RF-11) com a prévia animada no banner. */
export default function CharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const preview = useRef<BannerViewHandle>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (character: Character): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await putCharacter(character);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      const me = queryClient.getQueryData<{ onboarding: { hasStory: boolean } }>(queryKeys.me);
      if (!me?.onboarding.hasStory) router.replace('/story');
    } catch (cause) {
      setError(toApiError(cause)?.message ?? t('character.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BannerView ref={preview} initMessage={PREVIEW_INIT} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <CharacterForm
          initial={null}
          submitLabel={t('character.create')}
          submitting={saving}
          error={error}
          onSubmit={(character) => void save(character)}
          onPreview={(character) => {
            preview.current?.send({ v: 1, type: 'SET_CHARACTER', payload: { character } });
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: space.screenMargin, paddingBottom: space[40] },
});
