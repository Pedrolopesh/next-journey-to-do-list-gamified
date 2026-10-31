import type { ImageSourcePropType } from 'react-native';

/** Scene art of each story, rendered from the banner (one scenery per story). */
export const STORY_IMAGES: Record<string, ImageSourcePropType> = {
  beach: require('../../../assets/onboarding/scene-beach.png') as ImageSourcePropType,
  rooftop: require('../../../assets/onboarding/scene-rooftop.png') as ImageSourcePropType,
  zombie: require('../../../assets/onboarding/scene-zombie.png') as ImageSourcePropType,
  castle: require('../../../assets/onboarding/scene-castle.png') as ImageSourcePropType,
  paradise: require('../../../assets/onboarding/scene-paradise.png') as ImageSourcePropType,
  hell: require('../../../assets/onboarding/scene-hell.png') as ImageSourcePropType,
};

/** Character-only art of each ready-made look (preset id → transparent image). */
export const LOOK_IMAGES: Record<string, ImageSourcePropType> = {
  adventurer: require('../../../assets/onboarding/look-adventurer.png') as ImageSourcePropType,
  warrior: require('../../../assets/onboarding/look-warrior.png') as ImageSourcePropType,
  explorer: require('../../../assets/onboarding/look-explorer.png') as ImageSourcePropType,
  student: require('../../../assets/onboarding/look-student.png') as ImageSourcePropType,
  legend: require('../../../assets/onboarding/look-legend.png') as ImageSourcePropType,
};
