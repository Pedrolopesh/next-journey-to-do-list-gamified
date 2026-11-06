import type { CharacterLayers } from '@nextjourney/contracts';
import { useMemo } from 'react';

import { BannerView, type InitMessage, QG_ASPECT_RATIO } from '@/banner/banner-view';
import { useQgPrefs } from '@/features/qg/qg-store';
import { useTimeOfDay } from '@/features/qg/use-time-of-day';

/** Character preview in the QG scene; changes right away with the appearance, the scenery and the time. */
export function CharacterPreview({ layers }: { layers: CharacterLayers }) {
  const { scenario, timeMode } = useQgPrefs();
  const time = useTimeOfDay(timeMode);
  const initMessage = useMemo<InitMessage>(
    () => ({
      v: 1,
      type: 'INIT',
      payload: { scene: 'qg', character: layers, sceneKey: scenario, progress: 0, timeOfDay: time },
    }),
    [layers, scenario, time],
  );
  return <BannerView initMessage={initMessage} aspectRatio={QG_ASPECT_RATIO} />;
}
