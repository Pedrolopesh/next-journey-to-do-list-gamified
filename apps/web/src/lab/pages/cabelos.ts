import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** All the hairstyles of the LPC generator, with license and preview. */
export const hairPage: LabPage = inventoryPage({
  id: 'cabelos',
  label: 'Cabelos',
  section: 'Personagem',
  title: 'Cabelos do personagem',
  intro:
    'Penteados do gerador LPC: curtos, longos, tranças, cacheados, afro, franjas e rabos de cavalo. A prévia mostra o corpo masculino de frente com o cabelo na cor original da peça.',
  rule: 'cabelos',
});
