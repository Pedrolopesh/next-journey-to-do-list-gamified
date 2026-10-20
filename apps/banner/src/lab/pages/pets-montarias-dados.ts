/**
 * Pets, montarias e veículos: o que existe fora do gerador de personagens LPC e a situação de
 * cada um. Pesquisa em 2026-10-19 na OpenGameArt; as licenças vêm da página de cada obra e
 * precisam ser conferidas de novo antes de importar.
 */
export type PlannedStatus = 'viavel' | 'despriorizado' | 'bloqueado';

/** Uma animação de caminhada recortada de uma folha (`lab/pets/<sheet>`), em quadros de tamanho fixo. */
export type SpritePreview = {
  label: string;
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  sheetWidth: number;
  /** Linha e coluna do primeiro quadro, contadas em quadros. */
  row: number;
  col: number;
  frames: number;
  scale: number;
};

export type PlannedUtility = {
  group: string;
  name: string;
  status: PlannedStatus;
  license: string;
  author: string;
  url: string;
  note: string;
  previews?: SpritePreview[];
};

export const STATUS_LABEL: Record<PlannedStatus, string> = {
  viavel: 'Viável, a integrar',
  despriorizado: 'Despriorizado',
  bloqueado: 'Bloqueado pela licença',
};

/** Gatos e cães: quadros de 32 px, 16 colunas; cada cor ocupa 4 colunas (3 de caminhada). */
const catDog = (sheet: string, colors: string[]): SpritePreview[] =>
  colors.map((label, index) => ({
    label,
    sheet,
    frameWidth: 32,
    frameHeight: 32,
    sheetWidth: 512,
    row: 0,
    col: index * 4,
    frames: 3,
    scale: 3,
  }));

/** Cavalo: quadros de 128 px, linha 3 (galope para a direita), 4 quadros. */
const horse = (color: string, label: string): SpritePreview => ({
  label,
  sheet: `cavalo-${color}.png`,
  frameWidth: 128,
  frameHeight: 128,
  sheetWidth: 512,
  row: 3,
  col: 0,
  frames: 4,
  scale: 1,
});

export const PLANNED: PlannedUtility[] = [
  {
    group: 'Pets',
    name: 'Gatos [LPC]',
    status: 'viavel',
    license: 'OGA-BY 3.0 (também CC-BY 3.0; outras ofertas: CC-BY-SA, GPL)',
    author: 'bluecarrot16',
    url: 'https://opengameart.org/content/lpc-cats-and-dogs',
    note: 'Quadros de 32 px (metade do personagem), 4 cores, caminhada nas 4 direções, sentar e deitar. Daria um pet que anda junto do personagem. A prévia mostra a caminhada de lado.',
    previews: catDog('gatos.png', ['branco', 'dourado', 'marrom', 'preto']),
  },
  {
    group: 'Pets',
    name: 'Cães [LPC]',
    status: 'viavel',
    license: 'OGA-BY 3.0 (também CC-BY 3.0; outras ofertas: CC-BY-SA, GPL)',
    author: 'bluecarrot16',
    url: 'https://opengameart.org/content/lpc-cats-and-dogs',
    note: 'Mesma obra e mesma estrutura dos gatos: quadros de 32 px, 4 cores, caminhada nas 4 direções.',
    previews: catDog('caes.png', ['branco', 'marrom', 'dourado', 'preto']),
  },
  {
    group: 'Pets',
    name: 'Ursos, cervos, leões e outros [LPC]',
    status: 'viavel',
    license: 'CC-BY 4.0 (o autor diz que o que não deriva de Sevarihk é CC0; tratar como CC-BY)',
    author: 'tapatilorenzo',
    url: 'https://opengameart.org/node/137562',
    note: 'Pacote de animais do concurso LPC de 2022. Sem prévia aqui: ainda não foi baixado. Conferir sprite a sprite quais derivam da obra de Sevarihk (CC-BY 4.0).',
  },
  {
    group: 'Montarias',
    name: 'Cavalo [LPC] (sozinho)',
    status: 'viavel',
    license: 'OGA-BY 3.0 (também CC-BY 3.0; outras ofertas: CC-BY-SA, GPL)',
    author: 'bluecarrot16',
    url: 'https://opengameart.org/content/lpc-horses',
    note: 'Cavalo em 5 cores (4 na prévia), quadros de 128 px, caminhada e galope nas 4 direções. Serve como companheiro ao lado do personagem, não como montaria. A prévia mostra o galope.',
    previews: [
      horse('black', 'preto'),
      horse('brown', 'marrom'),
      horse('golden', 'dourado'),
      horse('gray', 'cinza'),
    ],
  },
  {
    group: 'Dragões e monstros',
    name: 'Dragão voador [LPC] (vermelho; há também um azul de duas cabeças)',
    status: 'viavel',
    license: 'CC-BY 3.0 (crédito: ZaPaper e Jordan Irwin, "Credits to buko-studios.com")',
    author: 'ZaPaper, AntumDeluge (Jordan Irwin)',
    url: 'https://opengameart.org/content/flying-dragon-rework',
    note: 'Dragão desenhado no ponto de vista LPC, voo em 4 direções (3 quadros cada). Quadro de 191 x 161 px: quase três vezes o personagem, então precisa ser reduzido. A prévia mostra o voo para a direita. A versão original, "red dragon" (ZaPaper, CC-BY 3.0), tem também ataque e dano.',
    previews: [
      {
        label: 'vermelho (metade do tamanho)',
        sheet: 'dragao-voador-vermelho.png',
        frameWidth: 191,
        frameHeight: 161,
        sheetWidth: 573,
        row: 1,
        col: 0,
        frames: 3,
        scale: 0.5,
      },
    ],
  },
  {
    group: 'Dragões e monstros',
    name: 'RPG Enemies: 11 Dragons',
    status: 'despriorizado',
    license: 'CC-BY 3.0',
    author: 'Redshrike, Blarumyrran, MrBeast, Sharm e outros',
    url: 'https://opengameart.org/node/13959',
    note: 'Licença permitida, mas são sprites de batalha estáticos, sem caminhada nem 4 direções. Só serviria como figura parada.',
  },
  {
    group: 'Dragões e monstros',
    name: '10 Fantasy RPG enemies (lesmas, cobras, goblins, lobos, dragões)',
    status: 'despriorizado',
    license: 'CC-BY 3.0 (também CC-BY-SA, GPL; crédito: buko-studios.com)',
    author: 'CharlesGabriel (arte de Antifarea)',
    url: 'https://opengameart.org/content/10-fantasy-rpg-enemies',
    note: 'Uma folha única com um quadro por monstro, de frente, sem animação e fora do padrão LPC. Licença serve, formato não.',
  },
  {
    group: 'Dragões e monstros',
    name: 'LPC Monsters (morcego, abelha, minhoca, olho, planta, lesma, fantasma)',
    status: 'bloqueado',
    license: 'CC-BY-SA 3.0 e GPL 3.0 (derivado de obras CC-BY-SA)',
    author: 'bluecarrot16',
    url: 'https://opengameart.org/content/lpc-monsters',
    note: 'Padrão LPC completo, com ataque, mas só com licença de copyleft. O próprio autor diz que o conjunto vira CC-BY-SA por derivar de originais CC-BY-SA.',
  },
  {
    group: 'Dragões e monstros',
    name: 'Lobisomem [LPC]',
    status: 'bloqueado',
    license: 'CC-BY-SA 3.0',
    author: 'AntumDeluge',
    url: 'https://opengameart.org/content/werewolf-lpc',
    note: 'Quadro de 48 x 64 px, caminhada de 3 quadros por direção. Só CC-BY-SA, então fica fora.',
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
