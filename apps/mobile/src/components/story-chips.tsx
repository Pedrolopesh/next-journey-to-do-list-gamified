import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, space } from '@/theme';

type Chip = { slug: string; name: string; color: string };

type Props = {
  stories: readonly Chip[];
  selected: string | null;
  onSelect: (slug: string) => void;
};

/**
 * The story buttons ("Praia", "Cidade", ...): the name in the color of the story, with the outline
 * in that color when selected. Used in "Mudar história" and in the intro, so they look the same.
 */
export function StoryChips({ stories, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {stories.map((story) => {
        const isSelected = story.slug === selected;
        return (
          <Pressable
            key={story.slug}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={story.name}
            onPress={() => {
              onSelect(story.slug);
            }}
            style={[styles.chip, { borderColor: isSelected ? story.color : colors.border.subtle }]}
          >
            <Text style={[styles.label, { color: story.color }]}>{story.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space[8], paddingVertical: space[8] },
  chip: {
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: colors.bg.surface,
  },
  label: { fontSize: fontSize[14], fontWeight: '700' },
});
