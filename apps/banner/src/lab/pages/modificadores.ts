import type { LabPage } from '../page';
import { inventoryPage } from './inventario';

/** Barbas, bigodes, rosto, cabeça e corpo especial: o que muda o personagem além de roupa e cabelo. */
export const modifiersPage: LabPage = inventoryPage({
  id: 'modificadores',
  label: 'Modificadores do personagem',
  section: 'Personagem',
  title: 'Modificadores do personagem',
  intro:
    'Tudo que muda o corpo do personagem além de roupa, acessório e cabelo: barbas e bigodes, rostos, cabeças, orelhas, narizes, olhos, sobrancelhas, corpo especial (pele de lagarto), feridas e cicatrizes, e também asas, caudas, orelhas de bicho, apêndices e próteses. A prévia mostra o corpo masculino com a peça; cabeças inteiras (fera, réptil, morto-vivo) trocam o rosto do personagem.',
  rule: 'modificadores',
});
