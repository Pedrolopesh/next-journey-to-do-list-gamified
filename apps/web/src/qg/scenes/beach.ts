import {
  BEACH_LEVEL_COUNT,
  BEACH_LEVELS,
  beachExtras,
  beachJourneyExtras,
  beachLights,
  renderBeach,
} from './beach-levels';
import { JOURNEY_PERIOD } from './beach-props';
import type { SceneDef } from './types';

export const beach: SceneDef = {
  id: 'beach',
  name: 'Praia',
  blurb: 'Areia, mar e palmeiras; o nascer e o pôr do sol aparecem no horizonte.',
  groundY: 176,
  levels: BEACH_LEVEL_COUNT,
  levelInfo: BEACH_LEVELS.map(({ name, blurb, changes }) => ({ name, blurb, changes })),
  back: renderBeach,
  journey: renderBeach,
  extrasFor: beachExtras,
  journeyExtrasFor: beachJourneyExtras,
  journeyPeriod: JOURNEY_PERIOD,
  lights: beachLights,
  tint: {
    morning: { color: '#ffd9b3', alpha: 0.22 },
    afternoon: { color: '#fffbe8', alpha: 0.05 },
    night: { color: '#4a62b8', alpha: 0.36 },
  },
};
