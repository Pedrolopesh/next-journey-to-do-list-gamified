import type { AnimationName, Direction, Selection } from '../compose';

export type TimeOfDay = 'morning' | 'afternoon' | 'night';
export const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noite' },
];

export const SCENE_W = 390;
export const SCENE_H = 220;

/** Tudo que uma cena precisa para desenhar um quadro. */
export type SceneEnv = {
  ctx: CanvasRenderingContext2D;
  time: TimeOfDay;
  /** Segundos desde o início, para animações (chamas, ondas, estrelas). */
  t: number;
  /** Distância percorrida (px lógicos) na jornada; o cenário se desloca para a esquerda. */
  scroll: number;
  tiles: Record<string, HTMLImageElement>;
  /** Cena desenhada na jornada (personagem andando): as luzes seguem o cenário que rola. */
  journey: boolean;
  /** Segundos desde que o personagem chegou ao fim da jornada; `null` enquanto ainda anda. */
  arrivedFor: number | null;
  /** Nível do cenário (1 a `SceneDef.levels`): o mesmo lugar com mais vida a cada nível. */
  level: number;
};

export type Light = {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number];
  /** 0 a 1. */
  intensity: number;
  flicker?: boolean;
  /** Só acende nestas horas (padrão: noite). */
  at?: TimeOfDay[];
};

export type ExtraCharacter = {
  x: number;
  /** Altura dos pés. */
  feetY: number;
  anim: AnimationName;
  direction: Direction;
  selection: Partial<Selection>;
  /** Vai e volta entre dois pontos (px) em vez de ficar parado; `anim` diz se anda ou corre. */
  patrol?: { from: number; to: number; speed: number };
  /** Na jornada, `x` é do mundo (que rola); `drift` é quanto o figurante anda nele (px/s, negativo = para a esquerda). */
  drift?: number;
  /** Ciclo próprio do mundo na jornada, para quem passa de tempos em tempos (padrão: o do cenário). */
  period?: number;
};

export type Tint = { color: string; alpha: number };

/** Texto de um nível do cenário, para o laboratório e para validar o desenho. */
export type LevelInfo = {
  name: string;
  blurb: string;
  /** O que muda neste nível, em frases curtas. */
  changes: string[];
};

export type SceneDef = {
  id: string;
  name: string;
  blurb: string;
  /** Linha dos pés do personagem principal. */
  groundY: number;
  back: (env: SceneEnv) => void;
  /** Versão da jornada: o cenário rola com `env.scroll`. Sem ela, a jornada usa `back` parado. */
  journey?: (env: SceneEnv) => void;
  front?: (env: SceneEnv) => void;
  lights?: (env: SceneEnv) => Light[];
  extras?: ExtraCharacter[];
  /** Quantos níveis o cenário tem (padrão 1). */
  levels?: number;
  /** Nome, descrição e mudanças de cada nível (mesmo tamanho de `levels`). */
  levelInfo?: LevelInfo[];
  /** Objetos do nível com a altura dos pés (`y`): o motor os mistura com figurantes e personagem. */
  levelItems?: (env: SceneEnv) => { y: number; draw: () => void }[];
  /** Luzes dos objetos do nível, somadas às do cenário. */
  levelLights?: (env: SceneEnv) => Light[];
  /** Figurantes de cada nível; quando existe, vale no lugar de `extras`. */
  extrasFor?: (level: number) => ExtraCharacter[];
  /** Figurantes da jornada de cada nível, em posições do mundo. Sem isso, a jornada não tem figurantes. */
  journeyExtrasFor?: (level: number) => ExtraCharacter[];
  /** Tamanho do ciclo do mundo na jornada (px); precisa ser o mesmo do cenário que rola. */
  journeyPeriod?: number;
  /** Cor aplicada sobre toda a cena por hora do dia (multiplicação). */
  tint?: Partial<Record<TimeOfDay, Tint>>;
};
