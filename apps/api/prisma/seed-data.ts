import { ACHIEVEMENT_CATALOG } from '../src/modules/progression/domain/achievements.js';

/**
 * Conteúdo versionado das histórias: uma por cenário do banner (slug = id do cenário), 5 capítulos
 * cada. Cada nível ganho conclui um capítulo da história ativa. Os textos são curtos e provisórios:
 * o roteiro final entra na Fase 6. Nada de conteúdo digitado direto no banco de produção.
 */
export const STORIES = [
  {
    slug: 'beach',
    name: 'Praia',
    themeColor: '#0ea5e9',
    description: 'Sol, areia e mar: uma viagem tranquila em que cada passo deixa o dia mais leve.',
    chapters: [
      ['A chegada', 'O mar aparece no fim da trilha. Você tira os sapatos e sente a areia morna.'],
      ['A canga vermelha', 'Entre cadeiras e coolers, você escolhe o melhor canto para recomeçar.'],
      [
        'O barco no horizonte',
        'Um barco pequeno cruza o mar. Alguém acena, e você acena de volta.',
      ],
      ['A fogueira', 'O sol desce e a primeira fogueira da noite acende. A conversa fica longa.'],
      ['A maré alta', 'A água sobe, a trilha continua. O que parecia fim era só o começo.'],
    ],
  },
  {
    slug: 'rooftop',
    name: 'Cidade',
    themeColor: '#6366f1',
    description:
      'Avenidas, luzes e o rio ao fundo: a rotina de quem constrói a vida na cidade grande.',
    chapters: [
      [
        'A primeira avenida',
        'Você sai de casa cedo. A cidade acorda junto, e o ponto de ônibus já tem fila.',
      ],
      [
        'O prédio mais alto',
        'Da calçada, a torre com a luz vermelha parece alta demais. Hoje você olha para cima.',
      ],
      [
        'A hora do rush',
        'Carros nos dois sentidos, pressa em todo canto. Você segue no seu passo.',
      ],
      ['As luzes da noite', 'As janelas acendem uma a uma. Cada uma guarda uma rotina como a sua.'],
      [
        'O rio da cidade',
        'No fim da avenida, o rio reflete tudo. Dali, a cidade inteira cabe no olhar.',
      ],
    ],
  },
  {
    slug: 'zombie',
    name: 'Apocalipse zumbi',
    themeColor: '#84cc16',
    description:
      'Deserto, uma base militar sitiada e uma estrada vazia: seguir adiante é sobreviver.',
    chapters: [
      [
        'A estrada vazia',
        'O deserto é silêncio e poeira. Na linha do horizonte, uma base com luzes acesas.',
      ],
      [
        'A cerca elétrica',
        'Os zumbis se encostam na cerca e não passam. Você passa longe, sem olhar para trás.',
      ],
      ['O helicóptero', 'Um helicóptero faz a ronda. Alguém ainda está vivo e vigiando.'],
      ['A noite no deserto', 'Sem lua e sem pressa, você caminha guiado pelo refletor da torre.'],
      [
        'O ponto de resgate',
        'Depois de tanta estrada, o ponto de resgate aparece. A jornada continua, agora acompanhada.',
      ],
    ],
  },
  {
    slug: 'castle',
    name: 'Castelo',
    themeColor: '#dc2626',
    description:
      'Salões de pedra, tapete real e cavaleiros de guarda: uma corte que testa a sua constância.',
    chapters: [
      [
        'O portão do castelo',
        'Os guardas abrem passagem. O tapete vermelho se estende por todo o salão.',
      ],
      ['Os cavaleiros', 'Lanças, escudos e espadas enfileirados. Todos observam, nenhum se move.'],
      ['A sala das armas', 'Espadas na parede contam batalhas antigas. Você aprende com cada uma.'],
      [
        'O baú esquecido',
        'Num canto do corredor, um baú guarda algo que só aparece para quem insiste.',
      ],
      [
        'O salão sem trono',
        'O trono está vazio, e o caminho segue. Quem governa é quem não desiste.',
      ],
    ],
  },
  {
    slug: 'paradise',
    name: 'Floresta',
    themeColor: '#16a34a',
    description:
      'Campos floridos, pinheiros e uma casa ao lado do lago: o caminho mais calmo da jornada.',
    chapters: [
      [
        'A trilha entre os pinheiros',
        'As árvores se abrem num campo cheio de flores. A trilha é de terra batida.',
      ],
      [
        'A casa do lago',
        'Uma casa de madeira, fumaça na chaminé e um lago com lótus. Vale a pausa.',
      ],
      ['O arco-íris', 'A chuva passou e o céu pintou um arco-íris por cima das montanhas.'],
      [
        'A noite dos vaga-lumes',
        'Quando escurece, a floresta se enche de pequenas luzes que guiam o caminho.',
      ],
      [
        'O campo aberto',
        'Passadas as árvores, o campo se abre inteiro. Hora de escolher o próximo destino.',
      ],
    ],
  },
  {
    slug: 'hell',
    name: 'Inferno',
    themeColor: '#f97316',
    description:
      'Rios de lava, vulcões e ossos pelo caminho: a prova mais difícil, para quem aguenta o calor.',
    chapters: [
      ['O portão de brasas', 'O ar queima e o chão racha. Mesmo assim, o primeiro passo é seu.'],
      ['O rio de lava', 'A lava corre ao fundo e de vez em quando um gêiser corta o céu.'],
      ['Os ossos do caminho', 'Caveiras, costelas e tridentes marcam quem desistiu. Você segue.'],
      ['O vulcão', 'A montanha cospe fumaça e fogo, e o caminho passa bem rente a ela.'],
      ['O fim das brasas', 'O calor cede. Atrás de você, só cinzas; à frente, o próximo mundo.'],
    ],
  },
] as const;

export const ACHIEVEMENTS = ACHIEVEMENT_CATALOG.map((achievement, position) => ({
  ...achievement,
  position,
}));
