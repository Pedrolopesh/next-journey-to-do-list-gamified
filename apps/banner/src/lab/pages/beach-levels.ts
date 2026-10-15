import '../engine.css';

import { JOURNEY_STOPS } from '../../qg/engine';
import { BEACH_LEVELS } from '../../qg/scenes/beach-levels';
import { type TimeOfDay, TIMES } from '../../qg/scenes/types';
import { choiceGroup, h, panel, row } from '../dom';
import { createLabEngine, stage } from '../engine-host';
import type { LabPage } from '../page';

type Mode = 'qg' | 'journey';

/** O que muda em cada nível, em frases curtas para validar o desenho. */
const CHANGES: Record<number, string[]> = {
  1: [
    'Uma ilha, um veleiro, três palmeiras.',
    'Toalha, cooler e cadeira; fogueirinha à noite.',
    'Ninguém por perto: o personagem está sozinho.',
  ],
  2: [
    'Duas ilhas e um barco a motor que cruza o mar deixando espuma.',
    'Gaivotas no céu.',
    'Quiosque com toldo, dois guarda-sóis, mais palmeiras.',
    'Duas pessoas: uma olha o mar parada, outra caminha na beira d’água.',
  ],
  3: [
    'Muda a sensação: orla de cidade, com prédios no horizonte (janelas acesas à noite).',
    'Calçadão de ondas pretas e brancas, postes de luz, bancos e quiosque.',
    'Cinco pessoas: um corredor, duas caminhando juntas e um casal parado olhando o mar.',
  ],
  4: [
    'Píer de madeira entrando no mar, com pilares e poste de luz.',
    'Farol no horizonte; à noite o facho gira.',
    'Três barcos de pesca atracados, mais gaivotas.',
    'Dois pescadores parados olhando a água e alguém caminhando.',
  ],
  5: [
    'Festa: bandeirolas, tochas e bar de palha com luzinhas.',
    'Fogueira grande (de dia também) e fogos de artifício à noite.',
    'A turma reunida em volta do fogo, um corredor e quem passeia.',
  ],
};

export const beachLevelsPage: LabPage = {
  id: 'praia-niveis',
  label: 'Praia em 5 níveis',
  async mount(host) {
    const { wrap, canvas } = stage('Praia no nível escolhido');
    const lab = await createLabEngine(canvas);
    const { state } = lab;
    state.sceneId = 'beach';
    state.level = 1;

    const blurb = h('p', 'meta');
    const changes = h('ul', 'v2-list');
    const stops = h('span');
    const show = (): void => {
      const info = BEACH_LEVELS.find((l) => l.level === state.level);
      blurb.textContent = info ? `${info.name}: ${info.blurb}` : '';
      changes.replaceChildren(...(CHANGES[state.level] ?? []).map((text) => h('li', '', text)));
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
    show();

    host.append(
      h('h1', '', 'Praia em 5 níveis'),
      h(
        'p',
        'lead',
        'Proposta: o mesmo cenário da praia muda a cada nível da história (um capítulo por nível), para dar a sensação de passar de fase. Nada disto está no app ainda; é só para validar.',
      ),
      wrap,
      panel(
        'Nível',
        row(
          'Nível',
          choiceGroup(
            BEACH_LEVELS.map((l) => ({ value: String(l.level), label: `${l.level}. ${l.name}` })),
            () => String(state.level),
            (v) => {
              state.level = Number(v);
              show();
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
        h('p', 'hint', 'O que muda neste nível:'),
        changes,
      ),
      panel(
        'Como pensei a sequência',
        h(
          'ul',
          'v2-list',
          h('li', '', 'Níveis 1 e 2 são a mesma praia ganhando vida: do deserto à praia cheia.'),
          h(
            'li',
            '',
            'Nível 3 muda de sensação (cidade) e o 4 muda de lugar dentro da praia (píer e farol).',
          ),
          h('li', '', 'Nível 5 é a recompensa: festa, com fogos à noite.'),
          h(
            'li',
            '',
            'Personagens extras ficam só no QG; na jornada o cenário passa e os objetos rolam.',
          ),
          h(
            'li',
            '',
            'Para outros cenários (castelo, cidade...), o mesmo molde serve: nível 1 vazio, nível 5 em festa ou em perigo, conforme o tema.',
          ),
        ),
      ),
    );
    renderStops();
    return lab.destroy;
  },
};
