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
    const levelBox = h('span');
    const changes = h('ul', 'v2-list');
    const stops = h('span');
    const current = () => SCENES.find((scene) => scene.id === state.sceneId);

    const showBlurb = (): void => {
      const def = current();
      const info = def?.levelInfo?.[state.level - 1];
      const base = `${def?.blurb ?? ''}${def?.journey ? '' : ' (sem versão de jornada)'}`;
      blurb.textContent = info ? `Nível ${state.level}, ${info.name}: ${info.blurb}` : base;
      changes.replaceChildren(...(info?.changes ?? []).map((text) => h('li', '', text)));
    };
    const renderLevels = (): void => {
      const infos = current()?.levelInfo ?? [];
      levelBox.replaceChildren(
        ...(infos.length > 0
          ? [
              row(
                'Nível',
                choiceGroup(
                  infos.map((info, i) => ({
                    value: String(i + 1),
                    label: `${i + 1}. ${info.name}`,
                  })),
                  () => String(state.level),
                  (v) => {
                    state.level = Number(v);
                    showBlurb();
                  },
                ),
              ),
            ]
          : []),
      );
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
    renderLevels();
    showBlurb();

    host.append(
      h('h1', '', 'Cenários'),
      h(
        'p',
        'lead',
        'Os cenários do QG (personagem parado, como na Home) e as jornadas (o personagem anda e o cenário rola, como nas abas). Cada um com manhã, tarde e noite e, nos que já têm, os 5 níveis da história (o mesmo lugar ganhando vida a cada capítulo). Os níveis ainda não estão no app; é só para validar.',
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
              state.level = 1;
              renderLevels();
              showBlurb();
            },
          ),
        ),
        levelBox,
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
        changes,
      ),
    );
    renderStops();
    return lab.destroy;
  },
};
