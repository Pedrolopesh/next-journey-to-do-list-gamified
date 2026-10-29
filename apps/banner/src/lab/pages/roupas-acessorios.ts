import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Roupas do gerador LPC (tronco, braços, pernas e pés), com a licença de cada uma. */
export const clothesPage: LabPage = inventoryPage({
  id: 'roupas',
  label: 'Roupas',
  section: 'Personagem',
  title: 'Roupas do personagem',
  intro:
    'Roupas que o gerador LPC oferece para vestir o personagem: camisas, jaquetas, vestidos, capas, armaduras, mochilas, cintos, calças, saias, shorts, meias, botas e sapatos, além de luvas e ombreiras. As peças marcadas "no jogo" já existem hoje. Chapéus, óculos, brincos e colares ficam em Acessórios.',
  rule: 'roupas',
});
