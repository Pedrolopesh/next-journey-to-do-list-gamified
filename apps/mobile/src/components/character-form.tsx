import { type Character, characterSchema } from '@nextjourney/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useCosmetics } from '@/api/queries';
import { Button } from '@/components/button';
import { Pills } from '@/components/pills';
import { TextField } from '@/components/text-field';
import { colors, radius, space } from '@/theme';

/** Camadas LPC disponíveis. As chaves "reward" só liberam depois da conquista correspondente. */
export const CHARACTER_OPTIONS = {
  skin: ['light', 'tan', 'brown', 'dark'],
  hair: ['short-brown', 'long-black', 'curly-red', 'bald'],
  outfit: ['tunic-purple', 'tunic-green', 'armor-iron', 'outfit-special', 'outfit-cape'],
  accessory: [
    'none',
    'hat-straw',
    'scarf-red',
    'accessory-bandana',
    'weapon-silver-sword',
    'accessory-shield',
  ],
} as const;

/** Chaves que são recompensa de conquista (bloqueadas até conquistar). */
const REWARDS: ReadonlySet<string> = new Set([
  'outfit-special',
  'outfit-cape',
  'accessory-bandana',
  'weapon-silver-sword',
  'accessory-shield',
]);

type Props = {
  initial: Character | null;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (character: Character) => void;
  /** Avisa cada mudança para a prévia (banner) mostrar a combinação. */
  onPreview?: (
    character: Pick<Character, 'skin' | 'hair' | 'outfit'> & { accessory?: string },
  ) => void;
};

export function CharacterForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onPreview,
}: Props) {
  const { t } = useTranslation();
  const cosmetics = useCosmetics();
  const owned = new Set(cosmetics.data ?? []);
  const [name, setName] = useState(initial?.name ?? '');
  const [title, setTitle] = useState<Character['title']>(initial?.title ?? 'Aventureiro');
  const [skin, setSkin] = useState(initial?.skin ?? 'light');
  const [hair, setHair] = useState(initial?.hair ?? 'short-brown');
  const [outfit, setOutfit] = useState(initial?.outfit ?? 'tunic-purple');
  const [accessory, setAccessory] = useState(initial?.accessory ?? 'none');
  const [formError, setFormError] = useState<string | null>(null);

  const optionsFor = (kind: keyof typeof CHARACTER_OPTIONS) =>
    CHARACTER_OPTIONS[kind].map((value) => ({
      value,
      label: t(`character.options.${value}`),
      disabled: REWARDS.has(value) && !owned.has(value),
    }));

  const change = (
    patch: Partial<{ skin: string; hair: string; outfit: string; accessory: string }>,
  ): void => {
    const next = { skin, hair, outfit, accessory, ...patch };
    onPreview?.({
      skin: next.skin,
      hair: next.hair,
      outfit: next.outfit,
      ...(next.accessory !== 'none' ? { accessory: next.accessory } : {}),
    });
  };

  const submit = (): void => {
    setFormError(null);
    const parsed = characterSchema.safeParse({
      name: name.trim(),
      title,
      skin,
      hair,
      outfit,
      ...(accessory !== 'none' ? { accessory } : {}),
    });
    if (!parsed.success) {
      setFormError(t('character.invalid'));
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <View style={styles.container}>
      <TextField label={t('character.name')} value={name} onChangeText={setName} maxLength={40} />
      <Group label={t('character.title')}>
        <Pills
          label={t('character.title')}
          value={title}
          onChange={setTitle}
          options={[
            { value: 'Herói', label: 'Herói' },
            { value: 'Heroína', label: 'Heroína' },
            { value: 'Aventureiro', label: 'Aventureiro' },
          ]}
        />
      </Group>
      <Group label={t('character.skin')}>
        <Pills
          label={t('character.skin')}
          value={skin}
          onChange={(value) => {
            setSkin(value);
            change({ skin: value });
          }}
          options={optionsFor('skin')}
        />
      </Group>
      <Group label={t('character.hair')}>
        <Pills
          label={t('character.hair')}
          value={hair}
          onChange={(value) => {
            setHair(value);
            change({ hair: value });
          }}
          options={optionsFor('hair')}
        />
      </Group>
      <Group label={t('character.outfit')}>
        <Pills
          label={t('character.outfit')}
          value={outfit}
          onChange={(value) => {
            setOutfit(value);
            change({ outfit: value });
          }}
          options={optionsFor('outfit')}
        />
      </Group>
      <Group label={t('character.accessory')}>
        <Pills
          label={t('character.accessory')}
          value={accessory}
          onChange={(value) => {
            setAccessory(value);
            change({ accessory: value });
          }}
          options={optionsFor('accessory')}
        />
      </Group>
      <Text style={styles.hint}>{t('character.lockedHint')}</Text>
      {(formError ?? error) ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {formError ?? error}
        </Text>
      ) : null}
      <Button label={submitLabel} onPress={submit} loading={submitting} />
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[16] },
  group: {
    gap: space[8],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    padding: space[12],
  },
  label: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  hint: { color: colors.text.muted, fontSize: 12 },
  error: { color: colors.status.danger, fontSize: 13 },
});
