import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { putCharacter } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys, useMe } from '@/api/queries';
import { CharacterForm } from '@/components/character-form';
import { ScreenFrame } from '@/components/screen-frame';
import { toast } from '@/features/feedback/toast-store';

/** Editar o personagem (RF-37). Cosméticos de conquista aparecem liberados aqui. */
export default function EditCharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <ScreenFrame title={t('profile.customize')}>
      <CharacterForm
        initial={me?.character ?? null}
        submitLabel={t('character.save')}
        submitting={saving}
        error={error}
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
    </ScreenFrame>
  );
}
