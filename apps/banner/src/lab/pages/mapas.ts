import type { LabPage } from '../page';
import { sceneryPage } from './cenarios';

/** Lab pages of the "Cenários e mapas" menu item: one per kind of scenery piece. */
export const SCENERY_PAGES: LabPage[] = [
  sceneryPage({
    id: 'mapa-terrenos',
    label: 'Terrenos e água',
    title: 'Terrenos, penhascos e água',
    intro:
      'Grama, terra, areia, penhascos, rochas, neve e gelo nas quatro estações, mais água, cachoeira, lava e buracos do chão. São as folhas de terreno do LPC, prontas para montar mapas.',
    rule: 'terrenos',
  }),
  sceneryPage({
    id: 'mapa-plantas',
    label: 'Árvores e plantas',
    title: 'Árvores, plantas e flores',
    intro:
      'Árvores nas quatro estações, copas e troncos, arbustos, flores, flores silvestres e cogumelos.',
    rule: 'plantas',
  }),
  sceneryPage({
    id: 'mapa-casas',
    label: 'Casas e paredes',
    title: 'Casas, paredes, telhados e janelas',
    intro:
      'Casas prontas, paredes e bordas, telhados, chaminés e janelas para construir fachadas e interiores.',
    rule: 'casas',
  }),
  sceneryPage({
    id: 'mapa-passagens',
    label: 'Portas, pontes e cercas',
    title: 'Portas, escadas, pontes, cercas e placas',
    intro:
      'Portas, escadas, pontes, plataformas, pilares, cercas, placas, fontes e peças de masmorra e esgoto.',
    rule: 'passagens',
  }),
  sceneryPage({
    id: 'mapa-pisos',
    label: 'Pisos e interiores',
    title: 'Pisos, tapetes e interiores',
    intro: 'Pisos de madeira, ladrilho e terra, tapetes e os tiles de interior do LPC original.',
    rule: 'pisos',
  }),
  sceneryPage({
    id: 'mapa-mobilia',
    label: 'Mobília',
    title: 'Mobília e objetos grandes',
    intro:
      'Camas, assentos, mesas, armários, lareiras, bancadas de ferraria, estantes e outros móveis.',
    rule: 'mobilia',
  }),
  sceneryPage({
    id: 'mapa-itens',
    label: 'Itens pequenos',
    title: 'Itens pequenos',
    intro:
      'Cestas, caixas, baldes, comida, minérios, fogueiras, ferramentas, tecidos e outros objetos de cena.',
    rule: 'itens',
  }),
  sceneryPage({
    id: 'mapa-parede',
    label: 'Itens de parede',
    title: 'Itens de parede',
    intro: 'Quadros, cortinas, espelhos, pôsteres, luminárias de parede e caixas de correio.',
    rule: 'parede',
  }),
  sceneryPage({
    id: 'mapa-efeitos',
    label: 'Efeitos',
    title: 'Efeitos de água e sombras',
    intro: 'Respingos, ondulações, reflexos na água e sombras.',
    rule: 'efeitos',
  }),
];
