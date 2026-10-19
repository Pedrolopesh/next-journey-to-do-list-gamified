/**
 * Utilitários que não vêm do gerador LPC (pets, montarias, veículos) e a situação de cada um.
 * Pesquisa em 2026-10-19 na OpenGameArt; as licenças vêm da página de cada obra e precisam ser
 * conferidas de novo antes de importar.
 */
export type PlannedStatus = 'viavel' | 'despriorizado' | 'bloqueado';

export type PlannedUtility = {
  group: string;
  name: string;
  status: PlannedStatus;
  license: string;
  author: string;
  url: string;
  note: string;
};

export const STATUS_LABEL: Record<PlannedStatus, string> = {
  viavel: 'Viável, a integrar',
  despriorizado: 'Despriorizado',
  bloqueado: 'Bloqueado pela licença',
};

export const PLANNED: PlannedUtility[] = [
  {
    group: 'Pets',
    name: 'Cães e gatos [LPC]',
    status: 'viavel',
    license: 'OGA-BY 3.0 (também CC-BY 3.0; outras ofertas: CC-BY-SA, GPL)',
    author: 'bluecarrot16',
    url: 'https://opengameart.org/content/lpc-cats-and-dogs',
    note: 'Mesmo padrão do personagem: ciclo de caminhada nas 4 direções, comer e dormir, 4 cores. Daria um pet que anda junto do personagem. Falta confirmar o tamanho do quadro e importar.',
  },
  {
    group: 'Pets',
    name: 'Ursos, cervos, leões e outros [LPC]',
    status: 'viavel',
    license: 'CC-BY 4.0 (o autor diz que o que não deriva de Sevarihk é CC0; tratar como CC-BY)',
    author: 'tapatilorenzo',
    url: 'https://opengameart.org/node/137562',
    note: 'Pacote de animais do concurso LPC de 2022. Conferir sprite a sprite quais derivam da obra de Sevarihk (CC-BY 4.0).',
  },
  {
    group: 'Montarias',
    name: 'Cavalo [LPC] (sozinho)',
    status: 'viavel',
    license: 'OGA-BY 3.0 (também CC-BY 3.0; outras ofertas: CC-BY-SA, GPL)',
    author: 'bluecarrot16',
    url: 'https://opengameart.org/content/lpc-horses',
    note: 'Cavalo em 5 cores, caminhada e galope nas 4 direções. Serve como companheiro ao lado do personagem, não como montaria.',
  },
  {
    group: 'Montarias',
    name: 'Personagem montado no cavalo',
    status: 'despriorizado',
    license: '-',
    author: '-',
    url: 'https://opengameart.org/content/lpc-horses',
    note: 'Não foi encontrado asset pronto de cavaleiro sobre o cavalo no padrão LPC. Teria de ser montado à mão (cavalo mais personagem sentado).',
  },
  {
    group: 'Veículos',
    name: 'Moto',
    status: 'despriorizado',
    license: 'CC0 ("Bikes", moto com piloto)',
    author: 'mainsworthy',
    url: 'https://opengameart.org/content/bikes',
    note: 'Não foi encontrada moto no padrão LPC (visão de 3/4 de frente, 4 direções). A única livre é vista de cima, que não combina com o personagem e o mapa.',
  },
  {
    group: 'Veículos',
    name: 'Carro',
    status: 'bloqueado',
    license: 'CC-BY-SA 3.0 e GPL 3.0 (LPC Modern Car Additions, LPC Police Car, SciFi Sprite Pack)',
    author: 'MoonGirl00, Baŝto, Skorpio',
    url: 'https://opengameart.org/content/lpc-modern-car-additions',
    note: 'Os carros no padrão LPC só oferecem licença com copyleft, que não usamos. Os carros livres (Cliipso CC-BY 3.0, Unlucky Studio CC0) são vistos de cima e não combinam. Despriorizado até aparecer asset livre no padrão.',
  },
  {
    group: 'Veículos',
    name: 'Bicicleta, patinete e outros',
    status: 'despriorizado',
    license: '-',
    author: '-',
    url: 'https://opengameart.org/art-search-advanced?keys=lpc+bicycle',
    note: 'Nenhuma obra livre no padrão LPC encontrada nesta pesquisa.',
  },
];
