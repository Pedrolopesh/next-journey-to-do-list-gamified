import './lab.css';

import { h } from './dom';
import type { LabPage } from './page';
import { accessoriesPage } from './pages/acessorios';
import { achievementsV2Page } from './pages/achievements-v2';
import { appButtonsPage } from './pages/app-buttons';
import { weaponsPage } from './pages/armas-acessorios';
import { hairPage } from './pages/cabelos';
import { characterPage } from './pages/character';
import { dashPage } from './pages/dash';
import { glowPage } from './pages/glow';
import { indicatorsPage } from './pages/indicators';
import { SCENERY_PAGES } from './pages/mapas';
import { modifiersPage } from './pages/modificadores';
import { petsPage } from './pages/pets-montarias';
import { clothesPage } from './pages/roupas-acessorios';
import { scenesPage } from './pages/scenes';
import { scoringPage } from './pages/scoring';

/** Lab pages, in the order of the side menu. */
const PAGES: LabPage[] = [
  dashPage,
  glowPage,
  appButtonsPage,
  indicatorsPage,
  achievementsV2Page,
  scenesPage,
  ...SCENERY_PAGES,
  characterPage,
  clothesPage,
  accessoriesPage,
  hairPage,
  modifiersPage,
  weaponsPage,
  petsPage,
  scoringPage,
];

const side = document.getElementById('menu');
const view = document.getElementById('view');
if (!side || !view) throw new Error('Estrutura do laboratório não encontrada');

let cleanup: (() => void) | undefined;
let token = 0;

async function show(page: LabPage): Promise<void> {
  const mine = ++token;
  cleanup?.();
  cleanup = undefined;
  view?.replaceChildren();
  side?.querySelectorAll('button').forEach((button) => {
    if (button.dataset.page === page.id) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  // The section of the open page stays open in the menu
  side?.querySelectorAll<HTMLDetailsElement>('details').forEach((group) => {
    if (group.dataset.section === page.section) group.open = true;
  });
  const host = h('div', 'page');
  view?.append(host);
  const result = await page.mount(host);
  // If the user already went to another page while this one was loading, undo this one
  if (mine !== token) result?.();
  else cleanup = result ?? undefined;
}

function menuButton(page: LabPage): HTMLButtonElement {
  const button = h('button', '', page.label);
  button.type = 'button';
  button.dataset.page = page.id;
  button.onclick = () => {
    location.hash = page.id;
  };
  return button;
}

// Pages of the same section become sub-items of a single menu item, at the position of the first one
const groups = new Map<string, HTMLDetailsElement>();
for (const page of PAGES) {
  if (!page.section) {
    side.append(menuButton(page));
    continue;
  }
  let group = groups.get(page.section);
  if (!group) {
    group = h('details', 'side-group');
    group.dataset.section = page.section;
    group.append(h('summary', '', page.section));
    groups.set(page.section, group);
    side.append(group);
  }
  group.append(menuButton(page));
}

// On the phone the menu is a button bar: all sections stay open
const phone = window.matchMedia('(max-width: 720px)');
const openAllOnPhone = (): void => {
  if (phone.matches) groups.forEach((group) => (group.open = true));
};
phone.addEventListener('change', openAllOnPhone);
openAllOnPhone();

const fromHash = (): LabPage =>
  PAGES.find((p) => `#${p.id}` === location.hash) ?? (PAGES[0] as LabPage);
window.addEventListener('hashchange', () => void show(fromHash()));
void show(fromHash());
