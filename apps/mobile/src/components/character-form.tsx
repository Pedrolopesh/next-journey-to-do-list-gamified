import {
  type Character,
  type CharacterClass,
  type CharacterLayers,
  characterSchema,
  type LpcLook,
} from '@nextjourney/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ClassPicker, LookDetails, ReadyLooks } from '@/components/character-sections';
import { TextField } from '@/components/text-field';
import { toast } from '@/features/feedback/toast-store';
import { DEFAULT_LOOK, legacyHair, legacySkin } from '@/features/qg/options';
import { colors, fontSize, space } from '@/theme';

const DEFAULT_OUTFIT = 'tunic-purple';

type Props = {
  initial: Character | null;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (character: Character) => void;
  /** Avisa cada mudança de aparência para a prévia (banner) mostrar a combinação. */
  onPreview?: (character: CharacterLayers) => void;
};

/**
 * Character editing (Profile → "Personalizar personagem"): ready-made looks, details, class and
 * name in one scrolling form. The onboarding uses the same sections, split over three screens.
 */
export function CharacterForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onPreview,
}: Props) {
  const { t } = useTranslation();
  const [look, setLook] = useState<LpcLook>(initial?.look ?? DEFAULT_LOOK);
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(
    initial?.characterClass ?? null,
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  // Validação reprovada também avisa por toast, para o botão nunca "não fazer nada"
  useEffect(() => {
    if (formError) toast.error(formError);
  }, [formError]);

  const outfit = initial?.outfit ?? DEFAULT_OUTFIT;
  const accessory = initial?.accessory;
  const layersFor = (nextLook: LpcLook): CharacterLayers => ({
    skin: legacySkin(nextLook.skin),
    hair: legacyHair(nextLook.hair),
    outfit,
    ...(accessory ? { accessory } : {}),
    look: nextLook,
  });

  const applyLook = (next: LpcLook): void => {
    setLook(next);
    onPreview?.(layersFor(next));
  };

  const submit = (): void => {
    setFormError(null);
    const parsed = characterSchema.safeParse({
      name: name.trim(),
      title: initial?.title ?? 'Aventureiro',
      ...(characterClass ? { characterClass } : {}),
      ...layersFor(look),
    });
    if (!parsed.success) {
      setFormError(t('character.invalid'));
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <View style={styles.container}>
      <ReadyLooks look={look} onChange={applyLook} title={t('character.editTitle')} />
      <LookDetails look={look} onChange={applyLook} />
      <ClassPicker value={characterClass} onChange={setCharacterClass} />
      <TextField label={t('character.name')} value={name} onChangeText={setName} maxLength={40} />
      <Text style={styles.hint}>{t('character.nameHint')}</Text>
      {(formError ?? error) ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {formError ?? error}
        </Text>
      ) : null}
      <Button label={submitLabel} onPress={submit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[16] },
  hint: { color: colors.text.muted, fontSize: fontSize[12] },
  error: { color: colors.status.danger, fontSize: fontSize[13] },
});
