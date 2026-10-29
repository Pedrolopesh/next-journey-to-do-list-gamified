import './inventario.css';
import './dash.css';

import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_TIERS } from '@nextjourney/contracts';

import { SCENES } from '../../qg/scenes';
import { h, panel } from '../dom';
import type { LabPage } from '../page';
import { loadLabData } from './inventario';
import { type InventoryItem, PAGE_RULES } from './inventario-regras';
import { PLANNED, STATUS_LABEL } from './pets-montarias-dados';

/** Repositório e laboratório publicados (links públicos). */
const REPO_URL = 'https://github.com/Pedrolopesh/next-journey-to-do-list-gamified';
const LAB_URL = 'https://next-journey-lab.vercel.app';

/** Nome de cada página do inventário, na ordem do menu. */
const INVENTORY_PAGES: [id: string, label: string][] = [
  ['roupas', 'Roupas'],
  ['acessorios', 'Acessórios'],
  ['cabelos', 'Cabelos'],
  ['modificadores', 'Modificadores do personagem'],
  ['armas', 'Armas e ferramentas'],
];

const kpi = (value: number | string, label: string): HTMLElement =>
  h('div', 'dash-kpi', h('strong', '', String(value)), h('span', '', label));

function table(
  head: string[],
  rows: (string | number)[][],
  foot?: (string | number)[],
): HTMLElement {
  const cell = (tag: 'th' | 'td', value: string | number, index: number): HTMLElement =>
    h(tag, index > 0 ? 'num' : '', String(value));
  const el = h('table', 'inv-table');
  el.append(
    h('thead', '', h('tr', '', ...head.map((text, i) => cell('th', text, i)))),
    h('tbody', '', ...rows.map((r) => h('tr', '', ...r.map((v, i) => cell('td', v, i))))),
  );
  if (foot) el.append(h('tfoot', '', h('tr', '', ...foot.map((v, i) => cell('td', v, i)))));
  return el;
}

/** Painel de acompanhamento do laboratório: números das peças, atalhos e links. */
export const dashPage: LabPage = {
  id: 'dash',
  label: 'Dash',
  async mount(host) {
    const [items, catalog] = await loadLabData();

    const perPage = INVENTORY_PAGES.map(([id, label]) => {
      const mine = items.filter(PAGE_RULES[id] as (item: InventoryItem) => boolean);
      const free = mine.filter((item) => item.free).length;
      return { label, free, out: mine.length - free };
    });
    const sum = (key: 'free' | 'out'): number => perPage.reduce((n, p) => n + p[key], 0);

    const tiers = ACHIEVEMENT_TIERS.map(
      (t) => [t.name, ACHIEVEMENT_CATALOG.filter((a) => a.tier === t.tier).length] as const,
    );
    const pets = (Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map(
      (status) =>
        [STATUS_LABEL[status], PLANNED.filter((p) => p.status === status).length] as const,
    );

    // Atalhos: lidos do próprio menu, então acompanham qualquer página nova
    const shortcuts = [...document.querySelectorAll<HTMLButtonElement>('#menu button')]
      .filter((button) => button.dataset.page && button.dataset.page !== 'dash')
      .map((button) => {
        const section = button.closest<HTMLElement>('details')?.dataset.section;
        const link = h(
          'a',
          '',
          section ? `${section} · ${button.textContent}` : (button.textContent ?? ''),
        );
        link.href = `#${button.dataset.page}`;
        return link;
      });
    const external = (text: string, href: string): HTMLAnchorElement => {
      const link = h('a', '', `${text} ↗`);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    };

    host.append(
      h('h1', '', 'Dash'),
      h(
        'p',
        'meta',
        'Visão geral do laboratório: números das peças, atalhos e links. Os números são lidos dos mesmos arquivos das páginas, então não ficam desatualizados.',
      ),
      panel(
        'Resumo',
        h(
          'div',
          'dash-kpis',
          kpi(sum('free'), 'peças com licença livre'),
          kpi(sum('out'), 'peças que ficaram de fora'),
          kpi(catalog.parts.length, 'peças já no jogo'),
          kpi(SCENES.length, 'cenários'),
          kpi(ACHIEVEMENT_CATALOG.length, 'conquistas'),
          kpi(PLANNED.length, 'pets, montarias e veículos listados'),
        ),
      ),
      panel(
        'Peças por página',
        table(
          ['Página', 'Peças livres', 'Ficaram de fora'],
          perPage.map((p) => [p.label, p.free, p.out]),
          ['Total', sum('free'), sum('out')],
        ),
      ),
      panel(
        'Pets, montarias e veículos',
        table(
          ['Situação', 'Itens'],
          pets.map(([a, b]) => [a, b]),
        ),
      ),
      panel(
        'Conquistas por classe',
        table(
          ['Classe', 'Conquistas'],
          tiers.map(([a, b]) => [a, b]),
        ),
      ),
      panel('Atalhos', h('div', 'dash-links', ...shortcuts)),
      panel(
        'Links',
        h(
          'div',
          'dash-links',
          external('Repositório no GitHub', REPO_URL),
          external('Laboratório publicado', LAB_URL),
        ),
        h(
          'p',
          'meta dash-note',
          'Métricas de uso do aplicativo (usuários, tarefas concluídas) ainda não existem aqui: o laboratório não acessa a API.',
        ),
      ),
    );
  },
};
