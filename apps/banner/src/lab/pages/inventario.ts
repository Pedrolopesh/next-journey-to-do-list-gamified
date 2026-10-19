import './inventario.css';

import type { Catalog } from '../../qg/compose';
import { choiceGroup, h, panel } from '../dom';

/** Uma peça do gerador LPC (gerada por `scripts/inventario-lpc.py`). */
export type InventoryItem = {
  id: string;
  root: string;
  group: string;
  name: string;
  /** Todas as licenças da peça permitem o uso no projeto (CC0, OGA-BY, CC-BY). */
  free: boolean;
  walk: boolean;
  license: string[];
  authors: string[];
  thumb: string | null;
};

type Filter = 'all' | 'free' | 'blocked';

/** Nome de cada pasta do gerador, para os títulos das seções. */
const GROUP_NAMES: Record<string, string> = {
  '': 'Geral',
  'hats/athwart': 'Chapéus de lado',
  'hats/caps': 'Bonés',
  'hats/foreaft': 'Chapéus de frente para trás',
  'hats/formal': 'Chapéus formais',
  'hats/holiday': 'Chapéus de festa',
  'hats/magic': 'Chapéus de mago',
  'hats/tricorne': 'Tricórnios',
  'helmets/helmets': 'Capacetes',
  'helmets/visors': 'Viseiras',
  'helmets/accessories': 'Acessórios de capacete',
  'coverings/bandana': 'Bandanas',
  'coverings/headbands': 'Faixas de cabeça',
  'coverings/hoods': 'Capuzes',
  'accessories/glasses': 'Óculos',
  'accessories/monocle': 'Monóculos',
  'accessories/eyepatch': 'Tapa-olhos',
  'accessories/earrings': 'Brincos',
  accessories: 'Acessórios de rosto',
  neck: 'Pescoço',
  'neck/charms': 'Colares e amuletos',
  shoulders: 'Ombreiras',
  wrists: 'Pulsos e braceletes',
  cape: 'Capas',
  backpack: 'Mochilas',
  'backpack/cargo': 'Mochilas de carga',
  armour: 'Armaduras',
  aprons: 'Aventais',
  dresses: 'Vestidos',
  'dresses/kimono': 'Quimonos',
  jacket: 'Jaquetas',
  'jacket/accessory': 'Acessórios de jaqueta',
  shirts: 'Camisas',
  'shirts/longsleeve': 'Camisas de manga longa',
  'shirts/shortsleeve': 'Camisas de manga curta',
  'shirts/sleeveless': 'Regatas',
  'shirts/sleeves': 'Mangas soltas',
  vest: 'Coletes',
  waist: 'Cintos e cintura',
  'waist/obi': 'Faixas obi',
  pants: 'Calças',
  shorts: 'Shorts',
  skirts: 'Saias',
  leggings: 'Leggings',
  boots: 'Botas',
  shoes: 'Sapatos',
  socks: 'Meias',
  accessory: 'Acessórios de pé',
  sword: 'Espadas',
  blunt: 'Armas de impacto',
  magic: 'Armas mágicas',
  polearm: 'Lanças e alabardas',
  ranged: 'Armas de longo alcance',
  'ranged/bow': 'Arcos',
  shields: 'Escudos',
  'shields/engrailed': 'Escudos denteados',
  'shields/heater': 'Escudos heater',
  'shields/heater/pattern': 'Escudos heater, padrões',
  'shields/heater/revised_pattern': 'Escudos heater, padrões revisados',
  'shields/scutum': 'Escudos scutum',
};

const ROOT_NAMES: Record<string, string> = {
  headwear: 'Cabeça e rosto',
  arms: 'Braços e mãos',
  torso: 'Tronco',
  legs: 'Pernas',
  feet: 'Pés',
  weapons: 'Armas e escudos',
  tools: 'Ferramentas',
};

/** Pasta (grupo) de cada peça: tira o prefixo `headwear/` etc. e usa o nome em português. */
const groupTitle = (item: InventoryItem): string =>
  `${ROOT_NAMES[item.root] ?? item.root} · ${GROUP_NAMES[item.group] ?? item.group}`;

export type InventoryPageOptions = {
  id: string;
  label: string;
  title: string;
  intro: string;
  roots: string[];
  /** Conteúdo extra no fim da página (ex.: itens planejados). */
  extra?: () => HTMLElement[];
};

/** Página do laboratório que lista as peças do gerador LPC, com licença e miniatura. */
export function inventoryPage(options: InventoryPageOptions) {
  return {
    id: options.id,
    label: options.label,
    async mount(host: HTMLElement): Promise<void> {
      const [all, catalog] = await Promise.all([
        fetch('/lab/inventario-lpc.json').then((r) => r.json() as Promise<InventoryItem[]>),
        fetch('/lab/catalog.json').then((r) => r.json() as Promise<Catalog>),
      ]);
      const inGame = new Set(catalog.parts.map((part) => part.name));
      const items = all.filter((item) => options.roots.includes(item.root));
      let filter: Filter = 'all';

      const list = h('div');
      const summary = h('p', 'meta');
      const render = (): void => {
        const shown = items.filter(
          (item) => filter === 'all' || (filter === 'free' ? item.free : !item.free),
        );
        const groups = new Map<string, InventoryItem[]>();
        for (const item of shown) {
          const key = groupTitle(item);
          groups.set(key, [...(groups.get(key) ?? []), item]);
        }
        summary.textContent = `${shown.length} peças · ${shown.filter((i) => i.free).length} com licença livre · ${shown.filter((i) => i.free && i.thumb).length} com prévia`;
        list.replaceChildren(
          ...[...groups].map(([title, group]) => {
            const details = h('details', 'inv-group');
            details.open = groups.size <= 3 || group.length <= 12;
            details.append(
              h('summary', '', title, h('span', 'meta', `${group.length} peças`)),
              h('div', 'inv-grid', ...group.map((item) => card(item, inGame))),
            );
            return details;
          }),
        );
      };

      const filters = h(
        'div',
        'inv-filters',
        choiceGroup<Filter>(
          [
            { value: 'all', label: 'Todas' },
            { value: 'free', label: 'Licença livre' },
            { value: 'blocked', label: 'Bloqueadas pela licença' },
          ],
          () => filter,
          (value) => {
            filter = value;
            render();
          },
        ),
        summary,
      );
      const license = h('div', 'license-banner');
      license.setAttribute('role', 'note');
      license.innerHTML =
        '<strong>Regra de licença:</strong> só entra peça cuja licença permite o uso sem copyleft: <strong>CC0</strong>, <strong>OGA-BY</strong> ou <strong>CC-BY</strong> (com crédito aos autores). Peça só <strong>CC-BY-SA</strong> ou <strong>GPL</strong> aparece como <strong>bloqueada</strong> e não deve ser usada. A miniatura mostra o corpo masculino de frente, só para dar ideia da peça.';

      host.append(
        h('h1', '', options.title),
        h('p', 'meta', options.intro),
        license,
        panel('Peças do gerador LPC', filters, list),
        ...(options.extra?.() ?? []),
      );
      render();
    },
  };
}

function card(item: InventoryItem, inGame: Set<string>): HTMLElement {
  const wrap = h('div', 'inv-card');
  wrap.dataset.free = String(item.free);
  const thumb = h('div', 'inv-thumb');
  if (item.thumb) {
    const img = document.createElement('img');
    img.src = `/lab/inventory/${item.thumb}`;
    img.alt = item.name;
    img.width = 128;
    img.height = 128;
    img.loading = 'lazy';
    thumb.append(img);
  } else {
    thumb.textContent = item.free ? 'sem prévia' : 'bloqueada';
  }
  const badges = h('div', 'chips');
  const license = h(
    'span',
    `badge ${item.free ? 'ok' : 'no'}`,
    item.free ? item.license.join(' + ') || 'livre' : 'só CC-BY-SA / GPL',
  );
  license.title = `Licenças da peça: ${item.license.join(', ')}`;
  badges.append(license);
  if (inGame.has(item.name)) badges.append(h('span', 'badge game', 'no jogo'));
  const authors = h('div', 'inv-authors', item.authors.join(', '));
  wrap.append(thumb, h('div', 'inv-name', item.name), badges, authors);
  return wrap;
}
