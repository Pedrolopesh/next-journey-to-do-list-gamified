import { StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, space } from '@/theme';

/** A category as it looks in the filters of the item lists (the selected state). Not a button. */
export function CategoryChip({ name, color }: { name: string; color: string }) {
  return (
    <Text style={[styles.chip, { backgroundColor: color, borderColor: color }]} numberOfLines={1}>
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.text.onPrimary,
    fontSize: fontSize[13],
    fontWeight: '600',
  },
});
