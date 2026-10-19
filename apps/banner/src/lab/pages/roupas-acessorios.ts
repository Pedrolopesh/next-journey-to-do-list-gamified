import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Roupas e acessórios que podem entrar no personagem, com a licença de cada um. */
export const clothesPage: LabPage = inventoryPage({
  id: 'roupas',
  label: 'Roupas e acessórios',
  title: 'Roupas e acessórios do personagem',
  intro:
    'Tudo que o gerador LPC oferece para vestir o personagem além do que já está no jogo: chapéus, capacetes, óculos, luvas, capas, mochilas, camisas, calças e calçados. As peças marcadas "no jogo" já existem hoje.',
  roots: ['headwear', 'arms', 'torso', 'legs', 'feet'],
});
