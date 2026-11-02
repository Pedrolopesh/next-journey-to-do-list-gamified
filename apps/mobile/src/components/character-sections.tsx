import { CHARACTER_CLASSES, type CharacterClass, type LpcLook } from '@nextjourney/contracts';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Pills } from '@/components/pills';
import { Swatches } from '@/components/swatches';
import { toast } from '@/features/feedback/toast-store';
import { LOOK_IMAGES } from '@/features/onboarding/story-art';
import {
  BODY_TYPES,
  CLOTH_COLORS,
  FEET_PARTS,
  HAIR_COLORS,
  HAIR_PARTS,
  LEGS_PARTS,
  PRESETS,
  randomLook,
  SKIN_TONES,
  TORSO_PARTS,
} from '@/features/qg/options';
import palettes from '@/features/qg/palettes.json';
import { colors, fontSize, radius, space } from '@/theme';

export function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

type LookProps = { look: LpcLook; onChange: (look: LpcLook) => void };

/** Ready-made looks as cards (character image and name); the selected one gets the outline. */
export function LookCards({ look, onChange }: LookProps) {
  const { t } = useTranslation();
  const selectedId = PRESETS.find(
    (preset) => JSON.stringify(preset.look) === JSON.stringify(look),
  )?.id;
  // Vertical room for the glow of the selected card
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cards}
      showsVerticalScrollIndicator={false}
    >
      {PRESETS.map((preset) => {
        const selected = preset.id === selectedId;
        const name = t(`character.presetNames.${preset.id}`);
        return (
          <Pressable
            key={preset.id}
            accessibilityRole="button"
            accessibilityLabel={`${t('character.presets')}: ${name}`}
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(preset.look);
            }}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <Image
              source={LOOK_IMAGES[preset.id]}
              style={styles.cardImage}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.cardName}>{name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Ready-made looks plus "Sortear aparência". `title` replaces the default heading. */
export function ReadyLooks({ look, onChange, title }: LookProps & { title?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionGap}>
      <Text style={styles.heading}>{title ?? t('character.quickStart')}</Text>
      <Text style={styles.label}>{t('character.presets')}</Text>
      <LookCards look={look} onChange={onChange} />
      <Button
        label={t('character.randomize')}
        onPress={() => {
          onChange(randomLook());
          toast.success(t('character.randomized'));
        }}
      />
    </View>
  );
}

/** Detailed appearance: body, skin, hair, clothes, trousers and shoes with their colors. */
export function LookDetails({ look, onChange }: LookProps) {
  const { t } = useTranslation();
  const change = (patch: Partial<LpcLook>): void => {
    onChange({ ...look, ...patch });
  };
  const option = (value: string) => ({ value, label: t(`character.options.${value}`) });
  const optional = (values: readonly string[]) => [
    { value: 'none', label: t('character.options.none') },
    ...values.map(option),
  ];
  const pick = (value: string | null): string => value ?? 'none';
  const swatches = (material: 'body' | 'hair' | 'cloth', values: readonly string[]) =>
    values.map((value) => ({
      value,
      color: (palettes[material] as Record<string, string>)[value] ?? '#888888',
      label: t(`character.options.${material === 'body' ? '' : 'color-'}${value}`),
    }));

  return (
    <View style={styles.sectionGap}>
      <Text style={styles.heading}>{t('character.details')}</Text>
      <Group label={t('character.body')}>
        <Pills
          label={t('character.body')}
          value={look.bodyType}
          onChange={(value) => {
            change({ bodyType: value === 'female' ? 'female' : 'male' });
          }}
          options={BODY_TYPES.map(option)}
        />
      </Group>
      <Group label={t('character.skinTone')}>
        <Swatches
          label={t('character.skinTone')}
          value={look.skin}
          onChange={(value) => {
            change({ skin: value });
          }}
          options={swatches('body', SKIN_TONES)}
        />
      </Group>
      <Group label={t('character.hairStyle')}>
        <Pills
          scroll
          label={t('character.hairStyle')}
          value={pick(look.hair)}
          onChange={(value) => {
            change({ hair: value === 'none' ? null : value });
          }}
          options={optional(HAIR_PARTS)}
        />
      </Group>
      <Group label={t('character.hairColor')}>
        <Swatches
          label={t('character.hairColor')}
          value={look.hairColor}
          onChange={(value) => {
            change({ hairColor: value });
          }}
          options={swatches('hair', HAIR_COLORS)}
        />
      </Group>
      <Group label={t('character.torso')}>
        <Pills
          scroll
          label={t('character.torso')}
          value={pick(look.torso)}
          onChange={(value) => {
            change({ torso: value === 'none' ? null : value });
          }}
          options={optional(TORSO_PARTS)}
        />
        <Swatches
          label={t('character.torsoColor')}
          value={look.torsoColor}
          onChange={(value) => {
            change({ torsoColor: value });
          }}
          options={swatches('cloth', CLOTH_COLORS)}
        />
      </Group>
      <Group label={t('character.legs')}>
        <Pills
          scroll
          label={t('character.legs')}
          value={pick(look.legs)}
          onChange={(value) => {
            change({ legs: value === 'none' ? null : value });
          }}
          options={optional(LEGS_PARTS)}
        />
        <Swatches
          label={t('character.legsColor')}
          value={look.legsColor}
          onChange={(value) => {
            change({ legsColor: value });
          }}
          options={swatches('cloth', CLOTH_COLORS)}
        />
      </Group>
      <Group label={t('character.feet')}>
        <Pills
          scroll
          label={t('character.feet')}
          value={pick(look.feet)}
          onChange={(value) => {
            change({ feet: value === 'none' ? null : value });
          }}
          options={optional(FEET_PARTS)}
        />
        <Swatches
          label={t('character.feetColor')}
          value={look.feetColor}
          onChange={(value) => {
            change({ feetColor: value });
          }}
          options={swatches('cloth', CLOTH_COLORS)}
        />
      </Group>
    </View>
  );
}

type ClassProps = {
  value: CharacterClass | null;
  onChange: (value: CharacterClass) => void;
};

/** Provisional class list (no art of its own yet). */
export function ClassPicker({ value, onChange }: ClassProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionGap}>
      <Text style={styles.heading}>{t('character.classTitle')}</Text>
      <Group label={t('character.classHint')}>
        <Pills
          scroll
          label={t('character.classTitle')}
          value={value}
          onChange={onChange}
          options={CHARACTER_CLASSES.map((id) => ({
            value: id,
            label: t(`character.classes.${id}`),
          }))}
        />
      </Group>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionGap: { gap: space[12] },
  heading: { color: colors.text.primary, fontSize: fontSize[16], fontWeight: '600' },
  group: {
    gap: space[8],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    padding: space[12],
  },
  label: { color: colors.text.secondary, fontSize: fontSize[13], fontWeight: '500' },
  cards: { gap: space[12], paddingVertical: space[8] },
  card: {
    width: 120,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
  },
  cardSelected: { borderWidth: 2, borderColor: colors.brand.primaryLight },
  cardImage: { width: '100%', height: 130, marginTop: space[8] },
  cardName: {
    color: colors.text.primary,
    fontSize: fontSize[13],
    fontWeight: '600',
    textAlign: 'center',
    padding: space[8],
  },
});
