import './lab.css';

import { h } from './dom';
import type { LabPage } from './page';
import { achievementsV2Page } from './pages/achievements-v2';
import { appButtonsPage } from './pages/app-buttons';
import { weaponsPage } from './pages/armas-acessorios';
import { characterPage } from './pages/character';
import { glowPage } from './pages/glow';
import { indicatorsPage } from './pages/indicators';
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
  const host = h('div', 'page');
  view?.append(host);
  const result = await page.mount(host);
  // Se o usuário já foi para outra página enquanto esta carregava, desfaz esta
  if (mine !== token) result?.();
  else cleanup = result ?? undefined;
}

for (const page of PAGES) {
  const button = h('button', '', page.label);
  button.type = 'button';
  button.dataset.page = page.id;
  button.onclick = () => {
    location.hash = page.id;
  };
  side.append(button);
}

const fromHash = (): LabPage =>
  PAGES.find((p) => `#${p.id}` === location.hash) ?? (PAGES[0] as LabPage);
window.addEventListener('hashchange', () => void show(fromHash()));
void show(fromHash());
