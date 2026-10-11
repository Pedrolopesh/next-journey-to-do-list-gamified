import {
  type Character,
  type CharacterLayers,
  characterSchema,
  type LpcLook,
} from '@nextjourney/contracts';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useCosmetics } from '@/api/queries';
import { Button } from '@/components/button';
import { Pills } from '@/components/pills';
import { QgControls } from '@/components/qg-controls';
import { TextField } from '@/components/text-field';
import { toast } from '@/features/feedback/toast-store';
import {
  BODY_TYPES,
  CLOTH_COLORS,
  DEFAULT_LOOK,
  FEET_PARTS,
  HAIR_COLORS,
  HAIR_PARTS,
  legacyHair,
  legacySkin,
  LEGS_PARTS,
  SKIN_TONES,
  TORSO_PARTS,
} from '@/features/qg/options';
import { colors, radius, space } from '@/theme';

/** Itens que só existem como recompensa de conquista (bloqueados até conquistar). */
export const REWARD_OUTFITS = ['outfit-special', 'outfit-cape'] as const;
export const ACCESSORIES = [
  'none',
  'hat-straw',
  'scarf-red',
  'accessory-bandana',
  'weapon-silver-sword',
  'accessory-shield',
] as const;
const REWARDS: ReadonlySet<string> = new Set([
  ...REWARD_OUTFITS,
  'accessory-bandana',
  'weapon-silver-sword',
  'accessory-shield',
]);
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
 * Formulário do personagem. As opções de aparência (as mesmas do laboratório do banner) e o ambiente
 * vêm primeiro, com a prévia no topo da tela; o nome e o título ficam por último.
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
  const cosmetics = useCosmetics();
  const owned = new Set(cosmetics.data ?? []);
  const [look, setLook] = useState<LpcLook>(initial?.look ?? DEFAULT_LOOK);
  const [outfit, setOutfit] = useState(initial?.outfit ?? DEFAULT_OUTFIT);
  const [accessory, setAccessory] = useState(initial?.accessory ?? 'none');
  const [name, setName] = useState(initial?.name ?? '');
  const [title, setTitle] = useState<Character['title']>(initial?.title ?? 'Aventureiro');
  const [formError, setFormError] = useState<string | null>(null);
  // Validação reprovada também avisa por toast, para o botão nunca "não fazer nada"
  useEffect(() => {
    if (formError) toast.error(formError);
  }, [formError]);

  const layersFor = (nextLook: LpcLook, nextOutfit: string, nextAccessory: string) => ({
    skin: legacySkin(nextLook.skin),
    hair: legacyHair(nextLook.hair),
    outfit: nextOutfit,
    ...(nextAccessory !== 'none' ? { accessory: nextAccessory } : {}),
    look: nextLook,
  });

  const changeLook = (patch: Partial<LpcLook>): void => {
    const next = { ...look, ...patch };
    setLook(next);
    onPreview?.(layersFor(next, outfit, accessory));
  };
  const changeExtras = (nextOutfit: string, nextAccessory: string): void => {
    setOutfit(nextOutfit);
    setAccessory(nextAccessory);
    onPreview?.(layersFor(look, nextOutfit, nextAccessory));
  };

  const option = (value: string, prefix = '') => ({
    value,
    label: t(`character.options.${prefix}${value}`),
  });
  const optional = (values: readonly string[]) => [
    { value: 'none', label: t('character.options.none') },
    ...values.map((value) => option(value)),
  ];
  const pick = (value: string | null): string => value ?? 'none';

  const submit = (): void => {
    setFormError(null);
    const parsed = characterSchema.safeParse({
      name: name.trim(),
      title,
      ...layersFor(look, outfit, accessory),
    });
    if (!parsed.success) {
      setFormError(t('character.invalid'));
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('character.environment')}</Text>
      <QgControls />

      <Text style={styles.heading}>{t('character.appearance')}</Text>
      <Group label={t('character.body')}>
        <Pills
          label={t('character.body')}
          value={look.bodyType}
          onChange={(value) => {
            changeLook({ bodyType: value === 'female' ? 'female' : 'male' });
          }}
          options={BODY_TYPES.map((value) => option(value))}
        />
      </Group>
      <Group label={t('character.skinTone')}>
        <Pills
          scroll
          label={t('character.skinTone')}
          value={look.skin}
          onChange={(value) => {
            changeLook({ skin: value });
          }}
          options={SKIN_TONES.map((value) => option(value))}
        />
      </Group>
      <Group label={t('character.hairStyle')}>
        <Pills
          scroll
          label={t('character.hairStyle')}
          value={pick(look.hair)}
          onChange={(value) => {
            changeLook({ hair: value === 'none' ? null : value });
          }}
          options={optional(HAIR_PARTS)}
        />
      </Group>
      <Group label={t('character.hairColor')}>
        <Pills
          scroll
          label={t('character.hairColor')}
          value={look.hairColor}
          onChange={(value) => {
            changeLook({ hairColor: value });
          }}
          options={HAIR_COLORS.map((value) => option(value, 'color-'))}
        />
      </Group>
      <Group label={t('character.torso')}>
        <Pills
          scroll
          label={t('character.torso')}
          value={pick(look.torso)}
          onChange={(value) => {
            changeLook({ torso: value === 'none' ? null : value });
          }}
          options={optional(TORSO_PARTS)}
        />
        <Pills
          scroll
          label={t('character.torsoColor')}
          value={look.torsoColor}
          onChange={(value) => {
            changeLook({ torsoColor: value });
          }}
          options={CLOTH_COLORS.map((value) => option(value, 'color-'))}
        />
      </Group>
      <Group label={t('character.legs')}>
        <Pills
          scroll
          label={t('character.legs')}
          value={pick(look.legs)}
          onChange={(value) => {
            changeLook({ legs: value === 'none' ? null : value });
          }}
          options={optional(LEGS_PARTS)}
        />
        <Pills
          scroll
          label={t('character.legsColor')}
          value={look.legsColor}
          onChange={(value) => {
            changeLook({ legsColor: value });
          }}
          options={CLOTH_COLORS.map((value) => option(value, 'color-'))}
        />
      </Group>
      <Group label={t('character.feet')}>
        <Pills
          scroll
          label={t('character.feet')}
          value={pick(look.feet)}
          onChange={(value) => {
            changeLook({ feet: value === 'none' ? null : value });
          }}
          options={optional(FEET_PARTS)}
        />
        <Pills
          scroll
          label={t('character.feetColor')}
          value={look.feetColor}
          onChange={(value) => {
            changeLook({ feetColor: value });
          }}
          options={CLOTH_COLORS.map((value) => option(value, 'color-'))}
        />
      </Group>

      <Text style={styles.heading}>{t('character.rewards')}</Text>
      <Group label={t('character.outfit')}>
        <Pills
          scroll
          label={t('character.outfit')}
          value={outfit}
          onChange={(value) => {
            changeExtras(value, accessory);
          }}
          options={[
            { value: DEFAULT_OUTFIT, label: t('character.options.default') },
            ...REWARD_OUTFITS.map((value) => ({
              ...option(value),
              disabled: !owned.has(value),
            })),
          ]}
        />
      </Group>
      <Group label={t('character.accessory')}>
        <Pills
          scroll
          label={t('character.accessory')}
          value={accessory}
          onChange={(value) => {
            changeExtras(outfit, value);
          }}
          options={ACCESSORIES.map((value) => ({
            ...option(value),
            disabled: REWARDS.has(value) && !owned.has(value),
          }))}
        />
      </Group>
      <Text style={styles.hint}>{t('character.lockedHint')}</Text>

      <Text style={styles.heading}>{t('character.identity')}</Text>
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
      <TextField label={t('character.name')} value={name} onChangeText={setName} maxLength={40} />
      {(formError ?? error) ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {formError ?? error}
        </Text>
      ) : null}
      <Button label={submitLabel} onPress={submit} loading={submitting} />
    </View>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[16] },
  heading: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
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
