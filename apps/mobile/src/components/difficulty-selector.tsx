import type { Difficulty } from '@nextjourney/contracts';
import { IconStarFilled } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, size, softGlow, space } from '@/theme';

const OPTIONS: { value: Difficulty; stars: number; color: string }[] = [
  { value: 'easy', stars: 1, color: colors.status.success },
  { value: 'medium', stars: 2, color: colors.status.warning },
  { value: 'hard', stars: 3, color: colors.status.danger },
];

type Props = { value: Difficulty; onChange: (value: Difficulty) => void };

/**
 * Seletor de dificuldade do Figma: três botões iguais com estrelas (1, 2 ou 3 acesas) e o nome.
 * O selecionado enche na cor da dificuldade com o brilho suave dos demais botões.
 */
export function DifficultySelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        const label = t(`difficulty.${option.value}`);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t('itemForm.difficulty')}: ${label}`}
            onPress={() => {
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.button,
              selected && {
                backgroundColor: option.color,
                borderColor: option.color,
                ...softGlow(option.color, { pressed, strength: 0.6 }),
              },
            ]}
          >
            <View style={styles.stars}>
              {[1, 2, 3].map((star) => (
                <IconStarFilled
                  key={star}
                  size={12}
                  color={
                    selected
                      ? star <= option.stars
                        ? colors.text.onPrimary
                        : 'rgba(255, 255, 255, 0.35)'
                      : star <= option.stars
                        ? colors.text.secondary
                        : colors.border.strong
                  }
                />
              ))}
            </View>
            <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // folga em volta: o brilho do selecionado não é cortado pela lista
  row: { flexDirection: 'row', gap: space[8], paddingBottom: space[8] },
  button: {
    flex: 1,
    minHeight: size.touchTarget + 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
  },
  stars: { flexDirection: 'row', gap: space[4] },
  text: { color: colors.text.secondary, fontSize: 14, fontWeight: '500' },
  textSelected: { color: colors.text.onPrimary, fontWeight: '700' },
});
