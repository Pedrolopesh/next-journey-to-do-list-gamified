import './inventario.css';

import type { Catalog } from '../../qg/compose';
import { h, panel } from '../dom';
import { type InventoryItem, PAGE_RULES } from './inventario-regras';

export type { InventoryItem };

let labData: Promise<[InventoryItem[], Catalog]> | undefined;

/** Inventário e catálogo do laboratório, baixados uma única vez e compartilhados entre as páginas. */
export function loadLabData(): Promise<[InventoryItem[], Catalog]> {
  labData ??= Promise.all([
    fetch('/lab/inventario-lpc.json').then((r) => r.json() as Promise<InventoryItem[]>),
    fetch('/lab/catalog.json').then((r) => r.json() as Promise<Catalog>),
  ]).catch((error: unknown) => {
    // Falhou: a próxima página tenta de novo em vez de guardar o erro
    labData = undefined;
    throw error;
  });
  return labData;
}

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
  wings: 'Asas',
  'wings/dragonfly': 'Asas de libélula',
  'wings/monarch': 'Asas de borboleta',
  'wings/pixie': 'Asas de fada',
  tails: 'Caudas',
  prostheses: 'Próteses',
  appendages: 'Apêndices de cabeça',
  'furry_ears/side': 'Orelhas de bicho (lado)',
  'furry_ears/top': 'Orelhas de bicho (topo)',
  afro: 'Afro',
  bald: 'Calvo e entradas',
  bob: 'Chanel',
  braids: 'Tranças',
  curly: 'Cacheado',
  'extensions/bangs': 'Franjas',
  'extensions/ponytails': 'Rabos de cavalo',
  'extensions/ties': 'Amarrações',
  long: 'Longo',
  pigtails: 'Maria-chiquinha',
  short: 'Curto',
  spiky: 'Espetado',
  xlong: 'Extralongo',
  beards: 'Barbas',
  mustaches: 'Bigodes',
  ears: 'Orelhas',
  eyebrows: 'Sobrancelhas',
  eyes: 'Olhos',
  faces: 'Rostos',
  nose: 'Narizes',
  'heads/beast': 'Cabeças de fera',
  'heads/fantasy': 'Cabeças de fantasia',
  'heads/farm': 'Cabeças de bicho de fazenda',
  'heads/human': 'Cabeças humanas',
  'heads/reptile': 'Cabeças de réptil',
  'heads/undead': 'Cabeças de morto-vivo',
  lizard: 'Pele de lagarto',
  special: 'Corpo especial',
  wounds: 'Feridas e cicatrizes',
};

const ROOT_NAMES: Record<string, string> = {
  headwear: 'Cabeça e rosto',
  arms: 'Braços e mãos',
  torso: 'Tronco',
  legs: 'Pernas',
  feet: 'Pés',
  weapons: 'Armas e escudos',
  tools: 'Ferramentas',
  extras: 'Asas, caudas e orelhas',
  hair: 'Cabelo',
  mods: 'Modificadores',
};

/** Pasta (grupo) de cada peça: tira o prefixo `headwear/` etc. e usa o nome em português. */
const groupTitle = (item: InventoryItem): string =>
  `${ROOT_NAMES[item.root] ?? item.root} · ${GROUP_NAMES[item.group] ?? item.group}`;

export type InventoryPageOptions = {
  id: string;
  label: string;
  section?: string;
  title: string;
  intro: string;
  /** Chave de `PAGE_RULES`: decide quais peças a página mostra. */
  rule: keyof typeof PAGE_RULES;
  /** Conteúdo extra no fim da página (ex.: itens planejados). */
  extra?: () => HTMLElement[];
};

/** Página do laboratório que lista as peças do gerador LPC, com licença e miniatura. */
export function inventoryPage(options: InventoryPageOptions) {
  return {
    id: options.id,
    label: options.label,
    ...(options.section ? { section: options.section } : {}),
    async mount(host: HTMLElement): Promise<void> {
      const [all, catalog] = await loadLabData();
      const inGame = new Set(catalog.parts.map((part) => part.name));
      const items = all.filter(PAGE_RULES[options.rule] as (item: InventoryItem) => boolean);
      const free = items.filter((item) => item.free);
      const blocked = items.filter((item) => !item.free);

      const groups = new Map<string, InventoryItem[]>();
      for (const item of free) {
        const key = groupTitle(item);
        groups.set(key, [...(groups.get(key) ?? []), item]);
      }
      const summary = h(
        'p',
        'meta',
        `${free.length} peças com licença livre · ${free.filter((i) => i.thumb).length} com prévia · ${blocked.length} ficaram de fora (tabela no fim da página)`,
      );
      const list = h(
        'div',
        '',
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

      const license = h('div', 'license-banner');
      license.setAttribute('role', 'note');
      license.innerHTML =
        '<strong>Regra de licença:</strong> só entra peça cuja licença permite o uso sem copyleft: <strong>CC0</strong>, <strong>OGA-BY</strong> ou <strong>CC-BY</strong> (com crédito aos autores). Peça com licença que obriga a abrir ou licenciar igual (<strong>CC-BY-SA</strong>, <strong>GPL</strong>) foi removida da galeria e está listada na tabela no fim da página. A miniatura mostra o corpo masculino de frente, só para dar ideia da peça.';

      host.append(
        h('h1', '', options.title),
        h('p', 'meta', options.intro),
        license,
        panel('Peças do gerador LPC', summary, list),
        blockedTable(blocked),
        ...(options.extra?.() ?? []),
      );
    },
  };
}

/** Tabela simples das peças removidas da galeria: nome, pasta, licença e motivo. */
function blockedTable(blocked: InventoryItem[]): HTMLElement {
  const table = h('table', 'inv-table');
  table.append(
    h(
      'thead',
      '',
      h(
        'tr',
        '',
        h('th', '', 'Peça'),
        h('th', '', 'Grupo'),
        h('th', '', 'Licença'),
        h('th', '', 'Por que ficou de fora'),
      ),
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
          h('td', '', item.license.join(', ')),
          h(
            'td',
            '',
            'Nenhuma licença livre (CC0, OGA-BY, CC-BY): exige compartilhar igual (CC-BY-SA/GPL)',
          ),
        ),
      ),
    ),
  );
  return panel(
    `Peças que ficaram de fora (${blocked.length})`,
    h(
      'p',
      'meta',
      'Removidas da galeria porque ao menos uma parte da peça só permite uso com licença copyleft, incompatível com a regra do projeto. Sem prévia e sem arquivo no repositório.',
    ),
    table,
  );
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
    // Sem arquivo para mostrar: corpo base esmaecido e o motivo, em vez de um quadro vazio
    const body = document.createElement('img');
    body.src = '/lab/inventory/_corpo.png';
    body.alt = '';
    body.width = 128;
    body.height = 128;
    thumb.classList.add('empty');
    thumb.append(body, h('span', 'inv-reason', 'Sem animação para mostrar'));
  }
  const badges = h('div', 'chips');
  const license = h(
    'span',
    `badge ${item.free ? 'ok' : 'no'}`,
    item.license.join(' + ') || 'livre',
  );
  license.title = `Licenças da peça: ${item.license.join(', ')}`;
  badges.append(license);
  if (inGame.has(item.name)) badges.append(h('span', 'badge game', 'no jogo'));
  const authors = h('div', 'inv-authors', item.authors.join(', '));
  wrap.append(thumb, h('div', 'inv-name', item.name), badges, authors);
  return wrap;
}
