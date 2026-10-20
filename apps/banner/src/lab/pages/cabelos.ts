import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Todos os cabelos do gerador LPC, com licença e prévia. */
export const hairPage: LabPage = inventoryPage({
  id: 'cabelos',
  label: 'Cabelos',
  title: 'Cabelos do personagem',
  intro:
    'Penteados do gerador LPC: curtos, longos, tranças, cacheados, afro, franjas e rabos de cavalo. A prévia mostra o corpo masculino de frente com o cabelo na cor original da peça.',
  roots: ['hair'],
});
