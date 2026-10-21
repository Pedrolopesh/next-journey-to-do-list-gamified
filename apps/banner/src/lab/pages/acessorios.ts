import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Acessórios de cabeça e rosto do gerador LPC, com a licença de cada um. */
export const accessoriesPage: LabPage = inventoryPage({
  id: 'acessorios',
  label: 'Acessórios',
  section: 'Personagem',
  title: 'Acessórios do personagem',
  intro:
    'O que o personagem usa na cabeça e no rosto: chapéus, bonés, capacetes, viseiras, capuzes, bandanas, faixas, óculos, monóculos, tapa-olhos, máscaras e brincos, além de colares, amuletos e braceletes. As peças marcadas "no jogo" já existem hoje.',
  rule: 'acessorios',
});
