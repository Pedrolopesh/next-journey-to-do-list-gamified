import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Barbas, bigodes, rosto, cabeça e corpo especial: o que muda o personagem além de roupa e cabelo. */
export const modifiersPage: LabPage = inventoryPage({
  id: 'modificadores',
  label: 'Modificadores do personagem',
  title: 'Modificadores do personagem',
  intro:
    'Barbas e bigodes, rostos, cabeças, orelhas, narizes, olhos, sobrancelhas, corpo especial (pele de lagarto) e feridas e cicatrizes. A prévia mostra o corpo masculino com a peça; cabeças inteiras (fera, réptil, morto-vivo) trocam o rosto do personagem.',
  roots: ['mods'],
});
