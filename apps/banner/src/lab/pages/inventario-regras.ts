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

/** Cabeça, rosto e pescoço (chapéus, capacetes, óculos, brincos, colares) e pulsos (braceletes). */
const isAccessory = (item: InventoryItem): boolean =>
  item.root === 'headwear' || (item.root === 'arms' && item.group === 'wrists');

/**
 * Qual página do laboratório mostra cada peça. Cada peça pertence a UMA página só:
 * o teste `inventario-regras.test.ts` confere que nenhuma ficou sem página nem em duas.
 */
export const PAGE_RULES: Record<string, (item: InventoryItem) => boolean> = {
  roupas: (item) => ['arms', 'torso', 'legs', 'feet'].includes(item.root) && !isAccessory(item),
  acessorios: isAccessory,
  cabelos: (item) => item.root === 'hair',
  modificadores: (item) => item.root === 'mods' || item.root === 'extras',
  armas: (item) => item.root === 'weapons' || item.root === 'tools',
};
