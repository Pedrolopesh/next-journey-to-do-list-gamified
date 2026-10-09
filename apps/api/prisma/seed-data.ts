import { ACHIEVEMENT_CATALOG } from '../src/modules/progression/domain/achievements.js';

/**
 * Conteúdo versionado das histórias (5 histórias x 5 capítulos). Os textos são curtos e provisórios:
 * o roteiro final entra na Fase 6. Nada de conteúdo digitado direto no banco de produção.
 */
export const STORIES = [
  {
    slug: 'empreendedor',
    name: 'Empreendedor',
    themeColor: '#f59e0b',
    description:
      'Do primeiro quiosque ao maior mercado da região: cada tarefa construída é um tijolo do seu império.',
    chapters: [
      [
        'O primeiro quiosque',
        'Você abre as portas do seu pequeno quiosque na feira. Poucos clientes, muita vontade.',
      ],
      [
        'A feira cresce',
        'O bairro começa a falar do seu trabalho. Chegou a hora de organizar o estoque.',
      ],
      [
        'Novos sócios',
        'Dois comerciantes oferecem parceria. Você precisa escolher bem em quem confiar.',
      ],
      ['A loja de esquina', 'O quiosque vira loja. A rotina fica puxada, mas o caixa sorri.'],
      [
        'O grande mercado',
        'Seu nome agora está na fachada do maior mercado da região. A jornada continua.',
      ],
    ],
  },
  {
    slug: 'estudante',
    name: 'Estudante',
    themeColor: '#3b82f6',
    description:
      'Uma academia de magia e muitos livros: estudar todo dia é o feitiço mais poderoso.',
    chapters: [
      [
        'A carta de admissão',
        'A carta chega numa manhã de chuva. A academia aceita você, mas as provas são duras.',
      ],
      [
        'A biblioteca antiga',
        'Entre estantes altas, você descobre um método para lembrar tudo que aprende.',
      ],
      [
        'O primeiro exame',
        'O salão fica em silêncio. Cada hora de estudo agora conta a seu favor.',
      ],
      [
        'O clube de debates',
        'Ideias contra ideias. Você aprende que perguntar é tão importante quanto responder.',
      ],
      ['A formatura', 'No palco da academia, você recebe o diploma. Mas aprender nunca termina.'],
    ],
  },
  {
    slug: 'guerreiro',
    name: 'Guerreiro',
    themeColor: '#ef4444',
    description:
      'Treino, disciplina e coragem: a cada dia um passo mais perto do campeão que você quer ser.',
    chapters: [
      ['O campo de treino', 'O mestre entrega uma espada de madeira. Todo guerreiro começa assim.'],
      ['A trilha de pedra', 'Correr na montanha dói, e é justamente por isso que funciona.'],
      [
        'O torneio da vila',
        'Pela primeira vez você enfrenta outros aprendizes diante de toda a vila.',
      ],
      ['A fortaleza norte', 'Uma missão difícil exige equipe, plano e paciência. Você lidera.'],
      ['O campeão', 'O estandarte é erguido em sua honra. A disciplina venceu mais uma batalha.'],
    ],
  },
  {
    slug: 'explorador',
    name: 'Explorador',
    themeColor: '#10b981',
    description:
      'Florestas, ruínas e mapas por completar: a curiosidade guia cada passo da sua rotina.',
    chapters: [
      [
        'O mapa rasgado',
        'Um mapa antigo, faltando pedaços, e uma trilha que ninguém seguiu até o fim.',
      ],
      ['A floresta densa', 'As árvores escondem o céu. Você avança marcando o caminho de volta.'],
      [
        'As ruínas esquecidas',
        'Símbolos nas paredes contam uma história que só você consegue ler.',
      ],
      ['O rio de cristal', 'A travessia é arriscada, mas a água revela o próximo trecho do mapa.'],
      [
        'O horizonte',
        'Do alto da última colina, o mundo todo se abre. Hora de desenhar o próximo mapa.',
      ],
    ],
  },
  {
    slug: 'lenda',
    name: 'Lenda',
    themeColor: '#7c3aed',
    description:
      'Reinos antigos e um destino grande demais para uma pessoa só. Você é a lenda em construção.',
    chapters: [
      [
        'O chamado',
        'Uma estrela cai perto da sua casa e, com ela, uma missão que ninguém mais pode cumprir.',
      ],
      [
        'O reino adormecido',
        'Torres cobertas de musgo aguardam alguém que ainda acredite no que foi prometido.',
      ],
      [
        'O guardião da ponte',
        'Ele só deixa passar quem provar constância. Você prova, dia após dia.',
      ],
      ['A noite sem lua', 'No momento mais escuro, uma pequena luz de rotina mantém você de pé.'],
      [
        'A coroa de luz',
        'O reino acorda. Seu nome vira canção, e a história ainda é sua para continuar.',
      ],
    ],
  },
] as const;

export const ACHIEVEMENTS = ACHIEVEMENT_CATALOG.map((achievement, position) => ({
  ...achievement,
  position,
}));
