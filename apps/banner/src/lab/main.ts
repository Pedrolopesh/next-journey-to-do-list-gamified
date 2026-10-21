import './lab.css';

import { h } from './dom';
import type { LabPage } from './page';
import { accessoriesPage } from './pages/acessorios';
import { achievementsV2Page } from './pages/achievements-v2';
import { appButtonsPage } from './pages/app-buttons';
import { weaponsPage } from './pages/armas-acessorios';
import { hairPage } from './pages/cabelos';
import { characterPage } from './pages/character';
import { glowPage } from './pages/glow';
import { indicatorsPage } from './pages/indicators';
import { modifiersPage } from './pages/modificadores';
import { petsPage } from './pages/pets-montarias';
import { clothesPage } from './pages/roupas-acessorios';
import { scenesPage } from './pages/scenes';
import { scoringPage } from './pages/scoring';

/** Páginas do laboratório, na ordem do menu lateral. */
const PAGES: LabPage[] = [
  glowPage,
  appButtonsPage,
  indicatorsPage,
  achievementsV2Page,
  scenesPage,
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
  // A seção da página aberta fica aberta no menu
  side?.querySelectorAll<HTMLDetailsElement>('details').forEach((group) => {
    if (group.dataset.section === page.section) group.open = true;
  });
  const host = h('div', 'page');
  view?.append(host);
  const result = await page.mount(host);
  // Se o usuário já foi para outra página enquanto esta carregava, desfaz esta
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

// Páginas da mesma seção viram sub-itens de um único item do menu, na posição da primeira
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

// No celular o menu é uma barra de botões: todas as seções ficam abertas
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
