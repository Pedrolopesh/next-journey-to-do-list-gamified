import '../engine.css';

import { JOURNEY_STOPS } from '../../qg/engine';
import { SCENES } from '../../qg/scenes';
import { type TimeOfDay, TIMES } from '../../qg/scenes/types';
import { choiceGroup, h, panel, row } from '../dom';
import { createLabEngine, stage } from '../engine-host';
import type { LabPage } from '../page';

type Mode = 'qg' | 'journey';

export const scenesPage: LabPage = {
  id: 'cenarios',
  label: 'Cenários',
  async mount(host) {
    const { wrap, canvas } = stage('Cenário com o personagem');
    const lab = await createLabEngine(canvas);
    const { state } = lab;
    state.sceneId = SCENES[1]?.id ?? state.sceneId;

    const blurb = h('p', 'meta');
    const stops = h('span');
    const showBlurb = (): void => {
      const def = SCENES.find((scene) => scene.id === state.sceneId);
      blurb.textContent = `${def?.blurb ?? ''}${def?.journey ? '' : ' (sem versão de jornada)'}`;
    };
    const renderStops = (): void => {
      stops.replaceChildren(
        row(
          'Parada',
          choiceGroup(
            Array.from({ length: JOURNEY_STOPS + 1 }, (_, n) => ({
              value: String(n),
              label: String(n),
            })),
            () => String(state.stop),
            (v) => {
              state.stop = Number(v);
            },
          ),
        ),
      );
      stops.hidden = !state.journey;
    };
    showBlurb();

    host.append(
      h('h1', '', 'Cenários'),
      h(
        'p',
        'lead',
        'Os cenários do QG (personagem parado, como na Home) e as jornadas (o personagem anda e o cenário rola, como nas abas). Cada um com manhã, tarde e noite.',
      ),
      wrap,
      panel(
        'Cenário',
        row(
          'Lugar',
          choiceGroup(
            SCENES.map((def) => ({ value: def.id, label: def.name })),
            () => state.sceneId,
            (v) => {
              state.sceneId = v;
              showBlurb();
            },
          ),
        ),
        row(
          'Hora',
          choiceGroup<TimeOfDay>(
            TIMES,
            () => state.time,
            (v) => {
              state.time = v;
            },
          ),
        ),
        row(
          'Modo',
          choiceGroup<Mode>(
            [
              { value: 'qg', label: 'QG (parado no lugar)' },
              { value: 'journey', label: 'Jornada (anda e o cenário rola)' },
            ],
            () => (state.journey ? 'journey' : 'qg'),
            (v) => {
              state.journey = v === 'journey';
              state.anim = state.journey ? 'walk' : 'idle';
              renderStops();
            },
          ),
        ),
        stops,
        blurb,
      ),
    );
    renderStops();
    return lab.destroy;
  },
};
