import {
  type Character,
  type CharacterLayers,
  characterSchema,
  type LpcLook,
} from '@nextjourney/contracts';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Pills } from '@/components/pills';
import { QgControls } from '@/components/qg-controls';
import { Swatches } from '@/components/swatches';
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
  PRESETS,
  randomLook,
  SKIN_TONES,
  TORSO_PARTS,
} from '@/features/qg/options';
import palettes from '@/features/qg/palettes.json';
import { colors, radius, space } from '@/theme';

const ACCESSORIES = ['none', 'hat-straw', 'scarf-red'] as const;
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
  const [look, setLook] = useState<LpcLook>(initial?.look ?? DEFAULT_LOOK);
  const [outfit, setOutfit] = useState(initial?.outfit ?? DEFAULT_OUTFIT);
  const [accessory, setAccessory] = useState(initial?.accessory ?? 'none');
  const [name, setName] = useState(initial?.name ?? '');
  const [title, setTitle] = useState<Character['title']>(initial?.title ?? 'Aventureiro');
  // O título acompanha o corpo (Herói/Heroína) até a pessoa escolher um título à mão
  const [titleTouched, setTitleTouched] = useState(initial !== null);
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

  const applyLook = (next: LpcLook): void => {
    if (!titleTouched && next.bodyType !== look.bodyType) {
      setTitle(next.bodyType === 'female' ? 'Heroína' : 'Herói');
    }
    setLook(next);
    onPreview?.(layersFor(next, outfit, accessory));
  };
  const changeLook = (patch: Partial<LpcLook>): void => {
    applyLook({ ...look, ...patch });
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
  const swatchOptions = (material: 'body' | 'hair' | 'cloth', values: readonly string[]) =>
    values.map((value) => ({
      value,
      color: (palettes[material] as Record<string, string>)[value] ?? '#888888',
      label: t(`character.options.${material === 'body' ? '' : 'color-'}${value}`),
    }));

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
      <Text style={styles.heading}>{t('character.quickStart')}</Text>
      <Group label={t('character.presets')}>
        <Pills
          scroll
          label={t('character.presets')}
          value={null}
          onChange={(id) => {
            const preset = PRESETS.find((candidate) => candidate.id === id);
            if (!preset) return;
            applyLook(preset.look);
            toast.success(t('character.presetApplied'));
          }}
          options={PRESETS.map((preset) => ({
            value: preset.id,
            label: t(`character.presetNames.${preset.id}`),
          }))}
        />
        <Button
          label={t('character.randomize')}
          variant="primary"
          onPress={() => {
            applyLook(randomLook());
            toast.success(t('character.randomized'));
          }}
        />
      </Group>

      <Text style={styles.heading}>{t('character.environment')}</Text>
      <QgControls />

      <Text style={styles.heading}>{t('character.details')}</Text>
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
        <Swatches
          label={t('character.skinTone')}
          value={look.skin}
          onChange={(value) => {
            changeLook({ skin: value });
          }}
          options={swatchOptions('body', SKIN_TONES)}
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
        <Swatches
          label={t('character.hairColor')}
          value={look.hairColor}
          onChange={(value) => {
            changeLook({ hairColor: value });
          }}
          options={swatchOptions('hair', HAIR_COLORS)}
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
        <Swatches
          label={t('character.torsoColor')}
          value={look.torsoColor}
          onChange={(value) => {
            changeLook({ torsoColor: value });
          }}
          options={swatchOptions('cloth', CLOTH_COLORS)}
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
        <Swatches
          label={t('character.legsColor')}
          value={look.legsColor}
          onChange={(value) => {
            changeLook({ legsColor: value });
          }}
          options={swatchOptions('cloth', CLOTH_COLORS)}
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
        <Swatches
          label={t('character.feetColor')}
          value={look.feetColor}
          onChange={(value) => {
            changeLook({ feetColor: value });
          }}
          options={swatchOptions('cloth', CLOTH_COLORS)}
        />
      </Group>

      <Text style={styles.heading}>{t('character.extras')}</Text>
      <Group label={t('character.accessory')}>
        <Pills
          scroll
          label={t('character.accessory')}
          value={accessory}
          onChange={(value) => {
            changeExtras(outfit, value);
          }}
          options={ACCESSORIES.map((value) => option(value))}
        />
      </Group>

      <Text style={styles.heading}>{t('character.identity')}</Text>
      <Group label={t('character.title')}>
        <Pills
          label={t('character.title')}
          value={title}
          onChange={(value) => {
            setTitleTouched(true);
            setTitle(value);
          }}
          options={[
            { value: 'Herói', label: 'Herói' },
            { value: 'Heroína', label: 'Heroína' },
            { value: 'Aventureiro', label: 'Aventureiro' },
          ]}
        />
      </Group>
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
