import { BEACH_LEVEL_COUNT, beachExtras, beachLights, renderBeach } from './beach-levels';
import type { SceneDef } from './types';

export const beach: SceneDef = {
  id: 'beach',
  name: 'Praia',
  blurb: 'Areia, mar e palmeiras; o nascer e o pôr do sol aparecem no horizonte.',
  groundY: 176,
  levels: BEACH_LEVEL_COUNT,
  back: renderBeach,
  journey: renderBeach,
  extrasFor: beachExtras,
  lights: beachLights,
  tint: {
    morning: { color: '#ffd9b3', alpha: 0.22 },
    afternoon: { color: '#fffbe8', alpha: 0.05 },
    night: { color: '#4a62b8', alpha: 0.36 },
  },
};
