import './inventario.css';
import './cenarios.css';

import { h, panel } from '../dom';
import type { LabPage } from '../page';
import { SCENERY_RULES, type SceneryItem } from './cenarios-regras';

let data: Promise<SceneryItem[]> | undefined;

/** Scenery inventory of the lab, downloaded once and shared across pages. */
function loadScenery(): Promise<SceneryItem[]> {
  data ??= fetch('/lab/inventario-cenarios.json')
    .then((r) => r.json() as Promise<SceneryItem[]>)
    .catch((error: unknown) => {
      // Failed: the next page tries again instead of keeping the error
      data = undefined;
      throw error;
    });
  return data;
}

/** Name of each pack folder, for the section titles. */
const GROUP_NAMES: Record<string, string> = {
  'Casas (LPC original)': 'Casas (LPC original)',
  'Terreno externo (LPC original)': 'Terreno externo (LPC original)',
  'Lava (LPC original)': 'Lava (LPC original)',
  'Interiores (LPC original)': 'Interiores (LPC original)',
  'Masmorra e esgoto (LPC original)': 'Masmorra e esgoto (LPC original)',
  'Objetos (LPC original)': 'Objetos (LPC original)',
  'Sombras (LPC original)': 'Sombras (LPC original)',
  Bridges: 'Pontes',
  'Doors / 32x48px Doors': 'Portas 32x48',
  'Doors / 32x64px Doors': 'Portas 32x64',
  'Doors / 64x64px Arched Doors': 'Portas em arco 64x64',
  Fences: 'Cercas',
  Floor: 'Pisos e tapetes',
  Misc: 'Fontes e diversos',
  Pillars: 'Pilares',
  Platforms: 'Plataformas',
  Roofing: 'Telhados',
  Signs: 'Placas',
  Stairs: 'Escadas',
  Structures: 'Casas prontas',
  'Wall Borders': 'Bordas de parede',
  Walls: 'Paredes',
  Windows: 'Janelas',
  FX: 'Efeitos de água',
  Furniture: 'Móveis',
  'Furniture / Beds': 'Camas',
  'Furniture / Rugs': 'Tapetes',
  'Furniture / Seating': 'Assentos',
  'Furniture / Sewing & Weaving': 'Costura e tecelagem',
  'Furniture / Smithing': 'Ferraria',
  Moveable: 'Itens móveis',
  'Small Items': 'Itens pequenos',
  'Small Items / Fabric': 'Tecidos',
  'Small Items / Food': 'Comida',
  'Small Items / Ores & Ingots': 'Minérios e lingotes',
  'Wall Items': 'Itens de parede',
};

/** The terrain pack is one flat folder, so its pieces are grouped by the kind of art in the name. */
const TERRAIN_KINDS: [RegExp, string][] = [
  [/^trees_/i, 'Árvores das estações'],
  [/^plants_/i, 'Arbustos e plantas das estações'],
  [/^wildflowers_/i, 'Flores silvestres das estações'],
  [/^flowers/i, 'Flores'],
  [/^mushrooms/i, 'Cogumelos'],
  [/^cliff_/i, 'Penhascos das estações'],
  [/^terrain_/i, 'Terreno das estações'],
  [/^rocks/i, 'Rochas'],
  [/^(ice-shallows|tilled_soil)/i, 'Gelo e solo arado'],
  [/waterfall/i, 'Cachoeira'],
];

const groupTitle = (item: SceneryItem): string => {
  if (item.top === 'Terrain') {
    return TERRAIN_KINDS.find(([pattern]) => pattern.test(item.name))?.[1] ?? 'Terreno';
  }
  return GROUP_NAMES[item.group] ?? item.group;
};

/** Enlarges small sheets so the pixel art is readable. */
const zoomFor = (width: number): number => (width <= 96 ? 3 : width <= 200 ? 2 : 1);

function card(item: SceneryItem): HTMLElement {
  const wrap = h('div', 'cen-card');
  const thumb = h('div', 'cen-thumb');
  const img = document.createElement('img');
  img.src = `/lab/cenarios/${item.thumb}`;
  img.alt = item.name;
  img.loading = 'lazy';
  img.width = item.width * zoomFor(item.width);
  thumb.append(img);
  const license = h('span', 'badge ok', item.license);
  license.title = `Licença da peça: ${item.license}`;
  const source = h('div', 'inv-authors', `${item.source} · ${item.authors.join(', ')}`);
  wrap.append(
    thumb,
    h('div', 'inv-name', item.name),
    h('div', 'cen-size', `${item.width} × ${item.height} px`),
    h('div', 'chips', license),
    source,
  );
  return wrap;
}

/** Simple table of the pieces left out: name, folder and reason. */
function blockedTable(blocked: SceneryItem[]): HTMLElement {
  const table = h('table', 'inv-table');
  table.append(
    h(
      'thead',
      '',
      h('tr', '', h('th', '', 'Peça'), h('th', '', 'Grupo'), h('th', '', 'Por que ficou de fora')),
    ),
    h(
      'tbody',
      '',
      ...blocked.map((item) =>
        h(
          'tr',
          '',
          h('td', '', item.name),
          h('td', '', groupTitle(item)),
          h('td', '', 'Sem entrada de crédito no pacote: sem licença comprovada, não entra'),
        ),
      ),
    ),
  );
  return panel(
    `Peças que ficaram de fora (${blocked.length})`,
    h(
      'p',
      'meta',
      'Sem crédito claro no pacote de origem. Sem prévia e sem arquivo no repositório.',
    ),
    table,
  );
}

export type SceneryPageOptions = {
  id: string;
  label: string;
  title: string;
  intro: string;
  /** Key of `SCENERY_RULES`: decides which pieces the page shows. */
  rule: keyof typeof SCENERY_RULES;
};

/** Lab page that lists scenery pieces of the LPC packs, with license, authors and preview. */
export function sceneryPage(options: SceneryPageOptions): LabPage {
  return {
    id: options.id,
    label: options.label,
    section: 'Cenários e mapas',
    async mount(host) {
      const all = await loadScenery();
      const items = all.filter(SCENERY_RULES[options.rule] as (item: SceneryItem) => boolean);
      const free = items.filter((item) => item.free);
      const blocked = items.filter((item) => !item.free);

      const groups = new Map<string, SceneryItem[]>();
      for (const item of free) {
        const key = groupTitle(item);
        groups.set(key, [...(groups.get(key) ?? []), item]);
      }
      const summary = h(
        'p',
        'meta',
        `${free.length} peças com licença livre · ${blocked.length} ficaram de fora`,
      );
      const filter = document.createElement('input');
      filter.type = 'search';
      filter.placeholder = 'Filtrar por nome';
      filter.setAttribute('aria-label', 'Filtrar peças por nome');
      const filterBox = h('div', 'cen-filter', filter);

      const sections = [...groups].map(([title, group]) => {
        const details = h('details', 'inv-group');
        details.open = groups.size <= 3 || group.length <= 12;
        const cards = group.map((item) => ({ item, node: card(item) }));
        details.append(
          h('summary', '', title, h('span', 'meta', `${group.length} peças`)),
          h('div', 'cen-grid', ...cards.map((entry) => entry.node)),
        );
        return { details, cards };
      });
      filter.oninput = () => {
        const text = filter.value.trim().toLowerCase();
        for (const { details, cards } of sections) {
          let shown = 0;
          for (const { item, node } of cards) {
            const match = !text || item.name.toLowerCase().includes(text);
            node.hidden = !match;
            if (match) shown++;
          }
          details.hidden = shown === 0;
          if (text && shown > 0) details.open = true;
        }
      };

      const license = h('div', 'license-banner');
      license.setAttribute('role', 'note');
      license.innerHTML =
        '<strong>Regra de licença:</strong> só entra peça cuja licença permite o uso sem copyleft: <strong>CC0</strong>, <strong>OGA-BY</strong> ou <strong>CC-BY</strong> (com crédito aos autores). Peça sem crédito claro no pacote de origem, ou com licença que obriga a licenciar igual (<strong>CC-BY-SA</strong>, <strong>GPL</strong>), fica de fora. A arte é só do laboratório: antes de usar uma peça no app, ela precisa entrar na tela de Créditos.';

      host.append(
        h('h1', '', options.title),
        h('p', 'meta', options.intro),
        license,
        panel(
          'Peças dos pacotes LPC',
          summary,
          filterBox,
          h('div', '', ...sections.map((entry) => entry.details)),
        ),
        ...(blocked.length > 0 ? [blockedTable(blocked)] : []),
      );
    },
  };
}
