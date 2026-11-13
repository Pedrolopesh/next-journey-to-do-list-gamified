import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Weapons, shields and tools of the LPC generator, with the license of each piece. */
export const weaponsPage: LabPage = inventoryPage({
  id: 'armas',
  label: 'Armas e ferramentas',
  section: 'Armas e pets',
  title: 'Armas e ferramentas do personagem',
  intro:
    'Armas, escudos e ferramentas que o gerador LPC oferece para o personagem carregar: espadas, arcos, machados, cajados, lanças, escudos, enxadas e outras. As peças marcadas "no jogo" já existem hoje.',
  rule: 'armas',
});
