import type { AnimationName, Direction, Selection } from '../compose';

export type TimeOfDay = 'morning' | 'afternoon' | 'night';
export const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noite' },
];

export const SCENE_W = 390;
export const SCENE_H = 220;

/** Everything a scene needs to draw a frame. */
export type SceneEnv = {
  ctx: CanvasRenderingContext2D;
  time: TimeOfDay;
  /** Seconds since the start, for animations (flames, waves, stars). */
  t: number;
  /** Distance traveled (logical px) on the journey; the scenery shifts to the left. */
  scroll: number;
  tiles: Record<string, HTMLImageElement>;
  /** Scene drawn on the journey (character walking): the lights follow the scrolling scenery. */
  journey: boolean;
  /** Seconds since the character reached the end of the journey; `null` while still walking. */
  arrivedFor: number | null;
  /** Scenery level (1 to `SceneDef.levels`): the same place with more life at each level. */
  level: number;
};

export type Light = {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number];
  /** 0 to 1. */
  intensity: number;
  flicker?: boolean;
  /** Only lights up at these hours (default: night). */
  at?: TimeOfDay[];
};

export type ExtraCharacter = {
  x: number;
  /** Foot height. */
  feetY: number;
  anim: AnimationName;
  direction: Direction;
  selection: Partial<Selection>;
  /** Goes back and forth between two points (px) instead of standing still; `anim` says whether they walk or run. */
  patrol?: { from: number; to: number; speed: number };
  /** On the journey, `x` is in the world (which scrolls); `drift` is how much the extra walks in it (px/s, negative = to the left). */
  drift?: number;
  /** Own world cycle on the journey, for whoever passes from time to time (default: the scenery's). */
  period?: number;
  /**
   * On the journey, stays on screen with the character instead of in the world: `offset` px ahead of them
   * (negative = behind), swaying `sway` px at `rate` rad/s. Moves aside when the scenery stops.
   */
  follow?: { offset: number; sway: number; rate: number; phase: number };
};

export type Tint = { color: string; alpha: number };

/** Text of a scenery level, for the lab and for validating the drawing. */
export type LevelInfo = {
  name: string;
  blurb: string;
  /** What changes in this level, in short sentences. */
  changes: string[];
};

export type SceneDef = {
  id: string;
  name: string;
  blurb: string;
  /** Foot line of the main character. */
  groundY: number;
  back: (env: SceneEnv) => void;
  /** Journey version: the scenery scrolls with `env.scroll`. Without it, the journey uses `back` still. */
  journey?: (env: SceneEnv) => void;
  front?: (env: SceneEnv) => void;
  lights?: (env: SceneEnv) => Light[];
  extras?: ExtraCharacter[];
  /** How many levels the scenery has (default 1). */
  levels?: number;
  /** Name, description and changes of each level (same size as `levels`). */
  levelInfo?: LevelInfo[];
  /** Level objects with foot height (`y`): the engine mixes them with extras and the character. */
  levelItems?: (env: SceneEnv) => { y: number; draw: () => void }[];
  /** Lights of the level objects, added to the scenery's. */
  levelLights?: (env: SceneEnv) => Light[];
  /** Extras of each level; when it exists, it applies in place of `extras`. */
  extrasFor?: (level: number) => ExtraCharacter[];
  /** Journey extras of each level, in world positions. Without it, the journey has no extras. */
  journeyExtrasFor?: (level: number) => ExtraCharacter[];
  /** Size of the world cycle on the journey (px); must be the same as the scrolling scenery's. */
  journeyPeriod?: number;
  /** Color applied over the whole scene by time of day (multiply). */
  tint?: Partial<Record<TimeOfDay, Tint>>;
};
