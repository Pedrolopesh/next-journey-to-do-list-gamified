import type { CharacterLayers } from '@nextjourney/contracts';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { putCharacter } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys, showNextPending, useMe } from '@/api/queries';
import { CharacterForm } from '@/components/character-form';
import { CharacterPreview } from '@/components/character-preview';
import { toast } from '@/features/feedback/toast-store';
import { characterLayers } from '@/features/qg/character-layers';
import { colors, radius, size, space } from '@/theme';

/** Editar o personagem (RF-37). Cosméticos de conquista aparecem liberados aqui. */
export default function EditCharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CharacterLayers | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Banner de ponta a ponta no topo, como na Home: as opções rolam embaixo */}
      <View>
        <CharacterPreview layers={preview ?? characterLayers(me?.character ?? null)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => {
            router.back();
          }}
          style={styles.back}
        >
          <IconChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
        </Pressable>
      </View>
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
                void showNextPending(queryClient);
                toast.success(t('character.saved'));
                router.back();
              })
              .catch((cause: unknown) => {
                const message = toApiError(cause)?.message ?? t('character.saveFailed');
                setError(message);
                toast.error(message);
              })
              .finally(() => {
                setSaving(false);
              });
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  form: { padding: space.screenMargin, paddingBottom: 40, gap: space[12] },
  back: {
    position: 'absolute',
    top: space[8],
    left: space[8],
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 25, 0.55)',
  },
});
