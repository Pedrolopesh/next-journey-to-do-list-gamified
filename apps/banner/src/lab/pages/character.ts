import '../engine.css';

import { type AnimationName, type BodyType, creditsFor, type Direction } from '../../qg/compose';
import { choiceGroup, h, panel, row, select } from '../dom';
import { createLabEngine, stage } from '../engine-host';
import type { LabPage } from '../page';

const SKINS = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'];
const HAIR_COLORS = [
  'black',
  'dark_brown',
  'chestnut',
  'blonde',
  'ginger',
  'redhead',
  'gray',
  'pink',
  'purple',
  'blue',
];
const CLOTH_COLORS = [
  'white',
  'black',
  'red',
  'blue',
  'navy',
  'green',
  'forest',
  'purple',
  'yellow',
  'orange',
  'tan',
  'gray',
];

/** Peças com modelo (`<select>`) e cor: uma linha de controles para cada. */
const PARTS = [
  {
    label: 'Cabelo',
    slot: 'hair',
    part: 'hair',
    color: 'hairColor',
    material: 'hair',
    names: HAIR_COLORS,
  },
  {
    label: 'Camisa',
    slot: 'torso',
    part: 'torso',
    color: 'torsoColor',
    material: 'cloth',
    names: CLOTH_COLORS,
  },
  {
    label: 'Calça',
    slot: 'legs',
    part: 'legs',
    color: 'legsColor',
    material: 'cloth',
    names: CLOTH_COLORS,
  },
  {
    label: 'Calçado',
    slot: 'feet',
    part: 'feet',
    color: 'feetColor',
    material: 'cloth',
    names: CLOTH_COLORS,
  },
] as const;

export const characterPage: LabPage = {
  id: 'personagem',
  label: 'Personagem e créditos',
  section: 'Personagem',
  async mount(host) {
    const { wrap, canvas } = stage('Personagem');
    const lab = await createLabEngine(canvas);
    const { state, catalog } = lab;
    const sel = state.selection;
    const colorsOf = (material: 'body' | 'hair' | 'cloth', name: string): string =>
      catalog.palettes[material].colors[name]?.[3] ?? '#888';

    const swatches = (
      material: 'body' | 'hair' | 'cloth',
      names: string[],
      current: () => string,
      onPick: (name: string) => void,
    ): HTMLElement => {
      const group = h('span', 'chips');
      const render = (): void => {
        group.replaceChildren(
          ...names.map((name) => {
            const button = h('button', 'swatch');
            button.type = 'button';
            button.title = name;
            button.setAttribute('aria-label', name);
            button.setAttribute('aria-pressed', String(current() === name));
            button.style.background = colorsOf(material, name);
            button.onclick = () => {
              onPick(name);
              render();
            };
            return button;
          }),
        );
      };
      render();
      return group;
    };

    const character = panel(
      'Personagem',
      row(
        'Corpo',
        choiceGroup<BodyType>(
          [
            { value: 'male', label: 'Masculino' },
            { value: 'female', label: 'Feminino' },
          ],
          () => sel.bodyType,
          (v) => {
            sel.bodyType = v;
          },
        ),
      ),
      row(
        'Pele',
        swatches(
          'body',
          SKINS,
          () => sel.skin,
          (v) => {
            sel.skin = v;
          },
        ),
      ),
      ...PARTS.map(({ label, slot, part, color, material, names }) =>
        row(
          label,
          select(
            catalog.parts.filter((p) => p.slot === slot).map((p) => ({ id: p.id, name: p.name })),
            sel[part],
            (id) => {
              sel[part] = id;
            },
          ),
          swatches(
            material,
            [...names],
            () => sel[color],
            (v) => {
              sel[color] = v;
            },
          ),
        ),
      ),
    );

    const animation = panel(
      'Animação',
      row(
        'Ação',
        choiceGroup<AnimationName>(
          [
            { value: 'idle', label: 'Parado' },
            { value: 'walk', label: 'Andando' },
            { value: 'run', label: 'Correndo' },
          ],
          () => state.anim,
          (v) => {
            state.anim = v;
          },
        ),
      ),
      row(
        'Direção',
        choiceGroup<Direction>(
          [
            { value: 'down', label: 'Frente' },
            { value: 'left', label: 'Esquerda' },
            { value: 'right', label: 'Direita' },
            { value: 'up', label: 'Costas' },
          ],
          () => state.direction,
          (v) => {
            state.direction = v;
          },
        ),
      ),
    );

    const license = h('div', 'license-banner');
    license.setAttribute('role', 'note');
    license.innerHTML =
      '<strong>Licença:</strong> toda a arte de terceiros só foi incluída por oferecer <strong>OGA-BY 3.0</strong> ou <strong>CC0</strong>. Isso exige <strong>dar crédito aos autores</strong> (lista abaixo, que também vira a tela Créditos do app). Arte só CC-BY-SA ou GPL foi deixada de fora.';

    const body = h('tbody');
    const stats = h('p', 'meta');
    const table = h('table', 'credits');
    table.append(
      h(
        'thead',
        '',
        h('tr', '', h('th', '', 'Arte'), h('th', '', 'Autores'), h('th', '', 'Licença usada')),
      ),
      body,
    );

    const renderCredits = (): void => {
      const ids = [
        'body',
        `head-${sel.bodyType}`,
        'face',
        sel.hair,
        sel.torso,
        sel.legs,
        sel.feet,
      ].filter((id): id is string => !!id);
      const credits = [
        ...creditsFor(catalog, ids),
        ...catalog.credits.filter((credit) => credit.file.startsWith('tileset/')),
      ];
      body.replaceChildren(
        ...credits.map((credit) =>
          h(
            'tr',
            '',
            h('td', '', credit.file.replace(/^.*\/(?=[^/]+\/[^/]+$)/, '')),
            h('td', '', credit.authors.join(', ')),
            h('td', '', h('span', 'badge', credit.licenseUsed)),
          ),
        ),
      );
      const bytes = performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.includes('/lab/assets/'))
        .reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).encodedBodySize, 0);
      stats.textContent = `${lab.requests()} folhas carregadas, ${(bytes / 1024).toFixed(0)} KB de arte até agora (limite do banner: 1,5 MB no total).`;
    };
    const timer = setInterval(renderCredits, 600);
    renderCredits();

    host.append(
      h('h1', '', 'Personagem, licenças e créditos'),
      license,
      wrap,
      character,
      animation,
      panel('Créditos e licenças em uso', table, stats),
    );
    return () => {
      clearInterval(timer);
      lab.destroy();
    };
  },
};
