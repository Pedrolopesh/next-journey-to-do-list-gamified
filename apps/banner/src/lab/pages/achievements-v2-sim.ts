import { ACHIEVEMENT_CATALOG, DEFAULT_GAME_CONFIG } from '../../../../../packages/contracts/src';
import type { Criterion, Metric } from './achievements-v2-rules';

export type Kind = 'daily' | 'todo' | 'habit';
type Difficulty = 'easy' | 'medium' | 'hard';

type Step =
  | {
      day: number;
      label: string;
      do: 'create';
      kind: Kind;
      cat: number;
      note?: boolean;
      diff?: Difficulty;
    }
  | { day: number; label: string; do: 'check'; item: number }
  | { day: number; label: string; do: 'look' | 'category' | 'reminder' };

type Item = { kind: Kind; cat: number; diff: Difficulty; open: boolean };

export type Persona = { id: string; name: string; about: string; days: number; steps: Step[] };

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];
const EXP = DEFAULT_GAME_CONFIG.expByDifficulty;
const COINS = DEFAULT_GAME_CONFIG.coinsByDifficulty;

/** Monta os passos de uma pessoa: itens criados no dia 1 e uma rotina que se repete nos dias seguintes. */
function build(config: {
  dailies: number;
  habits: number;
  startTasks: number;
  days: number;
  extra?: (day: number, push: (s: Step) => void) => void;
}): Step[] {
  const steps: Step[] = [];
  const items: { kind: Kind; cat: number }[] = [];
  const add = (day: number, kind: Kind, cat: number, label: string, note = false): number => {
    items.push({ kind, cat });
    steps.push({ day, label: `Criou ${label}`, do: 'create', kind, cat, note });
    return items.length - 1;
  };
  const dailyIdx: number[] = [];
  const habitIdx: number[] = [];
  const open: number[] = [];
  for (let i = 0; i < config.dailies; i += 1)
    dailyIdx.push(add(1, 'daily', i % 5, `o diário ${i + 1}`, i % 2 === 0));
  for (let i = 0; i < config.habits; i += 1)
    habitIdx.push(add(1, 'habit', (i + config.dailies) % 5, `o hábito ${i + 1}`));
  for (let i = 0; i < config.startTasks; i += 1)
    open.push(add(1, 'todo', i % 5, `a tarefa ${i + 1}`, i % 3 === 0));
  for (let day = 1; day <= config.days; day += 1) {
    if (day > 1) open.push(add(day, 'todo', day % 5, `a tarefa do dia ${day}`, day % 2 === 0));
    config.extra?.(day, (s) => steps.push(s));
    for (const i of dailyIdx)
      steps.push({
        day,
        label: `Marcou o diário ${dailyIdx.indexOf(i) + 1}`,
        do: 'check',
        item: i,
      });
    for (const i of habitIdx)
      steps.push({
        day,
        label: `Marcou o hábito ${habitIdx.indexOf(i) + 1}`,
        do: 'check',
        item: i,
      });
    const todo = day === 1 ? open.splice(0, config.startTasks) : open.splice(0, 1);
    for (const i of todo)
      steps.push({ day, label: `Concluiu a tarefa ${i + 1}`, do: 'check', item: i });
  }
  return steps;
}

const events = (day: number, push: (s: Step) => void): void => {
  if ([2, 8, 12, 16, 20].includes(day)) push({ day, label: 'Mudou o visual', do: 'look' });
  if (day === 3) push({ day, label: 'Criou uma categoria', do: 'category' });
  if (day === 4) push({ day, label: 'Ativou o lembrete', do: 'reminder' });
};

export const PERSONAS: Persona[] = [
  {
    id: 'tipico',
    name: 'Usuário típico',
    about:
      '4 diários, 1 hábito e 1 tarefa por dia, em 5 categorias. Cria os itens no dia 1 e faz tudo todos os dias, por 30 dias.',
    days: 30,
    steps: build({ dailies: 4, habits: 1, startTasks: 1, days: 30, extra: events }),
  },
  {
    id: 'empolgado',
    name: 'Usuário empolgado',
    about:
      'No dia 1 cria 12 itens (5 diários, 3 hábitos, 4 tarefas) e marca tudo. Segue com 5 diários, 3 hábitos e 1 tarefa nova por dia, por 30 dias.',
    days: 30,
    steps: build({ dailies: 5, habits: 3, startTasks: 4, days: 30, extra: events }),
  },
];

export type Unlock = { slug: string; name: string };
export type ActionResult = { index: number; day: number; label: string; unlocked: Unlock[] };

export type SimReport = {
  actions: ActionResult[];
  total: number;
  firstDay: number;
  maxBurst: number;
  burstAction: ActionResult | null;
  multiActions: number;
  firstWeek: number;
  /** Com "1 modal por ação": maior espera, em ações, até a conquista aparecer. */
  maxDelay: number;
  backlogPeak: number;
};

const NAMES = new Map(ACHIEVEMENT_CATALOG.map((a) => [a.slug as string, a.name as string]));
const TRAIL = new Map(ACHIEVEMENT_CATALOG.map((a) => [a.slug as string, a.trail as string]));
const SECRET = new Set(
  ACHIEVEMENT_CATALOG.filter((a) => 'secret' in a).map((a) => a.slug as string),
);

function expForLevel(level: number): number {
  const table = DEFAULT_GAME_CONFIG.levelExpTable;
  return table[Math.min(level, table.length) - 1] as number;
}

/** Roda uma pessoa contra um conjunto de critérios e conta o que libera a cada ação. */
export function simulate(persona: Persona, criteria: Record<string, Criterion>): SimReport {
  const items: Item[] = [];
  const s: Record<Metric, number> = Object.fromEntries(
    (
      [
        'checks',
        'dailyChecks',
        'dailyDays',
        'tasksDone',
        'habitChecks',
        'habitDays',
        'activeDays',
        'streakDays',
        'itemsCreated',
        'itemsActive',
        'notesItems',
        'maxItemsDay',
        'maxHabitsDay',
        'balanced3Days',
        'balanced5Days',
        'podiumDays',
        'perfectDays',
        'dailyStreak',
        'habitStreak',
        'hardTasks',
        'onTimeTasks',
        'level',
        'coins',
        'chapters',
        'stories',
        'dailiesCreated',
        'tasksCreated',
        'habitsCreated',
        'lookChanges',
        'categoriesCreated',
        'reminder',
        'achievements',
      ] as Metric[]
    ).map((m) => [m, 0]),
  ) as Record<Metric, number>;
  s.level = 1;
  let exp = 0;
  let day = 0;
  let today = {
    items: 0,
    habits: new Set<number>(),
    cats: new Set<number>(),
    kinds: new Set<Kind>(),
    dailies: 0,
    daily: false,
    habit: false,
    any: false,
    b3: false,
    b5: false,
    podium: false,
    perfect: false,
  };
  const unlocked = new Set<string>();
  const actions: ActionResult[] = [];
  const dailyTotal = (): number => items.filter((i) => i.kind === 'daily').length;

  const evaluate = (): Unlock[] => {
    const fresh: Unlock[] = [];
    let changed = true;
    while (changed) {
      changed = false;
      s.achievements = unlocked.size;
      for (const [slug, crit] of Object.entries(criteria)) {
        if (unlocked.has(slug)) continue;
        let ok = false;
        if (crit.m === 'manual') ok = false;
        else if (crit.m === 'trail') {
          const trails = new Set(TRAIL.values());
          ok = [...trails].some((t) =>
            [...TRAIL.entries()].filter(([, tr]) => tr === t).every(([sl]) => unlocked.has(sl)),
          );
        } else if (crit.m === 'secrets') ok = [...SECRET].every((sl) => unlocked.has(sl));
        else ok = s[crit.m] >= crit.t;
        if (ok) {
          unlocked.add(slug);
          fresh.push({ slug, name: crit.name ?? NAMES.get(slug) ?? slug });
          changed = true;
        }
      }
    }
    return fresh;
  };

  persona.steps.forEach((step, index) => {
    if (step.day !== day) {
      day = step.day;
      today = {
        items: 0,
        habits: new Set(),
        cats: new Set(),
        kinds: new Set(),
        dailies: 0,
        daily: false,
        habit: false,
        any: false,
        b3: false,
        b5: false,
        podium: false,
        perfect: false,
      };
      for (const it of items) if (it.kind === 'daily') it.open = true;
    }
    if (step.do === 'create') {
      items.push({
        kind: step.kind,
        cat: step.cat,
        diff: DIFFS[items.length % 3] as Difficulty,
        open: true,
      });
      s.itemsCreated += 1;
      if (step.note) s.notesItems += 1;
      if (step.kind === 'daily') s.dailiesCreated += 1;
      if (step.kind === 'todo') s.tasksCreated += 1;
      if (step.kind === 'habit') s.habitsCreated += 1;
      s.itemsActive = items.filter((i) => i.kind !== 'todo' || i.open).length;
    } else if (step.do === 'look') s.lookChanges += 1;
    else if (step.do === 'category') s.categoriesCreated += 1;
    else if (step.do === 'reminder') s.reminder = 1;
    else {
      const check = step as Extract<Step, { do: 'check' }>;
      const it = items[check.item] as Item;
      s.checks += 1;
      today.items += 1;
      s.maxItemsDay = Math.max(s.maxItemsDay, today.items);
      today.cats.add(it.cat);
      today.kinds.add(it.kind);
      if (!today.any) {
        today.any = true;
        s.activeDays += 1;
        s.streakDays += 1;
      }
      if (it.kind === 'daily') {
        s.dailyChecks += 1;
        today.dailies += 1;
        if (!today.daily) {
          today.daily = true;
          s.dailyDays += 1;
        }
        if (!today.perfect && today.dailies >= dailyTotal() && dailyTotal() >= 3) {
          today.perfect = true;
          s.perfectDays += 1;
          s.dailyStreak += 1;
        }
      } else if (it.kind === 'habit') {
        s.habitChecks += 1;
        today.habits.add(check.item);
        s.maxHabitsDay = Math.max(s.maxHabitsDay, today.habits.size);
        if (!today.habit) {
          today.habit = true;
          s.habitDays += 1;
          s.habitStreak += 1;
        }
      } else {
        s.tasksDone += 1;
        it.open = false;
        s.onTimeTasks += 1;
        if (it.diff === 'hard') s.hardTasks += 1;
        s.itemsActive = items.filter((i) => i.kind !== 'todo' || i.open).length;
      }
      if (!today.b3 && today.cats.size >= 3) {
        today.b3 = true;
        s.balanced3Days += 1;
      }
      if (!today.b5 && today.cats.size >= 5) {
        today.b5 = true;
        s.balanced5Days += 1;
      }
      if (!today.podium && today.kinds.size === 3) {
        today.podium = true;
        s.podiumDays += 1;
      }
      const diff =
        it.diff === 'hard' || it.kind === 'todo'
          ? it.diff
          : it.kind === 'daily'
            ? 'medium'
            : 'easy';
      exp += EXP[diff];
      s.coins += COINS[diff];
      while (exp >= expForLevel(s.level)) {
        exp -= expForLevel(s.level);
        s.level += 1;
        s.coins += DEFAULT_GAME_CONFIG.levelUpBonusCoins;
        s.chapters = Math.min(DEFAULT_GAME_CONFIG.chaptersPerStory, s.level - 1);
        s.stories = s.level - 1 >= DEFAULT_GAME_CONFIG.chaptersPerStory ? 1 : 0;
      }
    }
    actions.push({ index, day: step.day, label: step.label, unlocked: evaluate() });
  });

  // Com "1 modal por ação": a fila mostra a mais antiga, uma por ação
  let queue: number[] = [];
  let maxDelay = 0;
  let backlogPeak = 0;
  actions.forEach((a, i) => {
    queue = queue.concat(a.unlocked.map(() => i));
    backlogPeak = Math.max(backlogPeak, queue.length);
    const shown = queue.shift();
    if (shown !== undefined) maxDelay = Math.max(maxDelay, i - shown);
  });
  // o que sobrou aparece nas ações seguintes (uma por vez); conta o atraso até esvaziar
  let tail = 0;
  while (queue.length > 0) {
    tail += 1;
    const shown = queue.shift() as number;
    maxDelay = Math.max(maxDelay, actions.length - 1 + tail - shown);
  }

  const withUnlocks = actions.filter((a) => a.unlocked.length > 0);
  const burstAction = withUnlocks.reduce<ActionResult | null>(
    (best, a) => (best === null || a.unlocked.length > best.unlocked.length ? a : best),
    null,
  );
  return {
    actions,
    total: unlocked.size,
    firstDay: actions.filter((a) => a.day === 1).reduce((n, a) => n + a.unlocked.length, 0),
    maxBurst: burstAction?.unlocked.length ?? 0,
    burstAction,
    multiActions: withUnlocks.filter((a) => a.unlocked.length > 1).length,
    firstWeek: actions.filter((a) => a.day <= 7).reduce((n, a) => n + a.unlocked.length, 0),
    maxDelay,
    backlogPeak,
  };
}
