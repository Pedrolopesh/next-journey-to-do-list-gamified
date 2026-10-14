import './achievements.css';

import { ACHIEVEMENT_CATALOG } from '../../../../api/src/modules/progression/domain/achievements';
import { h } from '../dom';
import type { LabPage } from '../page';

type Sample = { unlocked: boolean; progress: [number, number] | null };
type Entry = (typeof ACHIEVEMENT_CATALOG)[number];

/** Estado de exemplo de cada conquista (o catálogo vem da API; o progresso é ilustrativo). */
const SAMPLE: Record<string, Sample> = {
  'primeiro-passo': { unlocked: true, progress: null },
  'chama-7-dias': { unlocked: false, progress: [0, 7] },
  organizado: { unlocked: true, progress: null },
  maratonista: { unlocked: false, progress: [85, 100] },
  aprendiz: { unlocked: true, progress: null },
  veterano: { unlocked: false, progress: [5, 10] },
  'novo-capitulo': { unlocked: true, progress: null },
};
const NONE: Sample = { unlocked: false, progress: null };

function card(entry: Entry, sample: Sample, onOpen: () => void): HTMLElement {
  const button = h('button', `ach${sample.unlocked ? '' : ' locked'}`);
  button.type = 'button';
  button.append(
    h('span', 'name', `${sample.unlocked ? '★ ' : ''}${entry.name}`),
    h('span', 'desc', entry.description),
  );
  if (sample.progress && !sample.unlocked) {
    button.append(h('span', 'prog', `${sample.progress[0]}/${sample.progress[1]}`));
  }
  if (entry.rewardKey) button.append(h('span', 'reward', `Recompensa: ${entry.rewardKey}`));
  button.onclick = onOpen;
  return button;
}

function sheetContent(entry: Entry, sample: Sample, close: () => void): HTMLElement {
  const box = h('div', 'sheet');
  box.append(
    h('div', 'handle'),
    h('h3', 'title', `${sample.unlocked ? '★ ' : ''}${entry.name}`),
    h('span', 'state', sample.unlocked ? 'Desbloqueada em 12/10/2026' : 'bloqueada'),
    h('span', 'desc', entry.description),
  );
  if (sample.progress && !sample.unlocked) {
    const [current, target] = sample.progress;
    const fill = h('i');
    fill.style.width = `${Math.round((current / target) * 100)}%`;
    box.append(h('div', 'bar', fill), h('span', 'prog', `${current} de ${target}`));
  }
  if (entry.rewardKey) box.append(h('span', 'reward', `Recompensa: ${entry.rewardKey}`));
  const closeButton = h('button', 'chip', 'Fechar');
  closeButton.type = 'button';
  closeButton.onclick = close;
  box.append(closeButton);
  return box;
}

export const achievementsPage: LabPage = {
  id: 'conquistas',
  label: 'Conquistas',
  mount(host) {
    const root = h('div', 'sheet-root');
    root.hidden = true;
    const close = (): void => {
      root.hidden = true;
      root.replaceChildren();
    };
    const open = (entry: Entry, sample: Sample): void => {
      const backdrop = h('div', 'sheet-backdrop');
      backdrop.onclick = close;
      root.replaceChildren(backdrop, sheetContent(entry, sample, close));
      root.hidden = false;
    };

    const list = h(
      'div',
      'ach-list',
      ...ACHIEVEMENT_CATALOG.map((entry) => {
        const sample = SAMPLE[entry.slug] ?? NONE;
        return card(entry, sample, () => {
          open(entry, sample);
        });
      }),
    );
    host.append(
      h('h1', '', 'Conquistas'),
      h(
        'p',
        'lead',
        'As conquistas do catálogo da API no formato do app: dourado quando desbloqueada, apagado quando não. Toque numa para ver o modal de detalhes que sobe do rodapé. O progresso mostrado é de exemplo.',
      ),
      h('section', 'style', h('h2', '', 'Cartões de conquista'), h('div', 'app-phone', list)),
      root,
    );
    return close;
  },
};
