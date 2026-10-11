import type { CharacterLayers } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { putCharacter } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys, useMe } from '@/api/queries';
import { CharacterForm } from '@/components/character-form';
import { CharacterPreview } from '@/components/character-preview';
import { ScreenFrame } from '@/components/screen-frame';
import { toast } from '@/features/feedback/toast-store';
import { characterLayers } from '@/features/qg/character-layers';

/** Editar o personagem (RF-37). Cosméticos de conquista aparecem liberados aqui. */
export default function EditCharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CharacterLayers | null>(null);

  return (
    <ScreenFrame title={t('profile.customize')} scroll={false}>
      {/* Prévia fixa no topo: as opções rolam embaixo */}
      <CharacterPreview layers={preview ?? characterLayers(me?.character ?? null)} />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <CharacterForm
          initial={me?.character ?? null}
          submitLabel={t('character.save')}
          submitting={saving}
          error={error}
          onPreview={setPreview}
          onSubmit={(character) => {
            setSaving(true);
            setError(null);
            putCharacter(character)
              .then(async () => {
                await queryClient.invalidateQueries({ queryKey: queryKeys.me });
                toast.success(t('character.saved'));
                router.back();
              })
              .catch((cause: unknown) => {
                const apiError = toApiError(cause);
                const message =
                  apiError?.code === 'COSMETIC_LOCKED'
                    ? t('character.locked')
                    : (apiError?.message ?? t('character.saveFailed'));
                setError(message);
                toast.error(message);
              })
              .finally(() => {
                setSaving(false);
              });
          }}
        />
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({ form: { paddingBottom: 40 } });
