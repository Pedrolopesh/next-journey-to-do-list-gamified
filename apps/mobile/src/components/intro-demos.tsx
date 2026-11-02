import { DEFAULT_GAME_CONFIG, type Item, type LpcLook } from '@nextjourney/contracts';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  BannerView,
  type BannerViewHandle,
  type InitMessage,
  QG_ASPECT_RATIO,
} from '@/banner/banner-view';
import { toast } from '@/features/feedback/toast-store';
import { layersOfLook } from '@/features/onboarding/character-draft';
import { STORY_SCENARIOS, type StoryScenario } from '@/features/qg/options';
import { useTimeOfDay } from '@/features/qg/use-time-of-day';
import { radius, space } from '@/theme';

import { LookCards } from './character-sections';
import { ExpToast } from './exp-toast';
import { ItemRow } from './item-row';
import { Pills } from './pills';
import { StoryProgressView } from './story-progress-card';

/** The journey scene (the hero walking) for a look and a scenery: what the tabs show. */
function journeyInit(look: LpcLook, sceneKey: StoryScenario, progress: number, time: string) {
  return {
    v: 1,
    type: 'INIT',
    payload: {
      scene: 'journey',
      character: layersOfLook(look),
      sceneKey,
      progress,
      timeOfDay: time,
    },
  } as InitMessage;
}

type LookProps = { look: LpcLook };

/**
 * Intro slide 1: the hero walking, and the ready-made looks below to swap him. Only shows what the
 * app is about: nothing here is saved.
 */
export function IntroWalkingHero({
  look,
  onLookChange,
}: LookProps & { onLookChange: (look: LpcLook) => void }) {
  const time = useTimeOfDay('auto');
  const initMessage = useMemo(() => journeyInit(look, 'beach', 0.5, time), [look, time]);
  return (
    <View style={styles.stack}>
      <View style={styles.banner}>
        <BannerView initMessage={initMessage} aspectRatio={QG_ASPECT_RATIO} />
      </View>
      <LookCards look={look} onChange={onLookChange} />
    </View>
  );
}

/** The item of the demo is a hard to-do: the biggest EXP and coins, so the effect is easy to see. */
const DEMO_DIFFICULTY = 'hard' as const;

const demoItem = (title: string, checked: boolean): Item => ({
  id: 'intro-demo',
  type: 'todo',
  title,
  notes: null,
  categoryId: 'intro-demo',
  difficulty: DEMO_DIFFICULTY,
  scheduleDays: null,
  dueAt: null,
  doneToday: checked,
  overdue: false,
  streak: 0,
  checksToday: checked ? 1 : 0,
  checksThisWeek: checked ? 1 : 0,
  lastCheckId: checked ? 'intro-demo-check' : null,
});

/**
 * Intro slide 2: a real item row (the same component of the lists) that can be checked and
 * unchecked. Checking shows the EXP and coins toast, adds the coins to the card, fills the EXP bar
 * and moves the hero; unchecking takes some coins but keeps the EXP, as the real app does. Nothing
 * here touches the user's data or the API.
 */
export function IntroCheckDemo({ look }: LookProps) {
  const { t } = useTranslation();
  const time = useTimeOfDay('auto');
  const banner = useRef<BannerViewHandle>(null);
  const config = DEFAULT_GAME_CONFIG;
  const expForNext = config.levelExpTable[0] ?? 200;
  const [state, setState] = useState({ checked: false, exp: 0, coins: 0, undos: 0, earned: false });
  const [message, setMessage] = useState<string | null>(null);
  const initMessage = useMemo(() => journeyInit(look, 'beach', 0, time), [look, time]);

  const check = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // EXP counts once; the coins are earned again after an undo (same rule as the server)
    const expGained = state.earned ? 0 : config.expByDifficulty[DEMO_DIFFICULTY];
    const coinsGained = config.coinsByDifficulty[DEMO_DIFFICULTY];
    const exp = state.exp + expGained;
    setState({
      ...state,
      checked: true,
      exp,
      coins: state.coins + coinsGained,
      earned: true,
    });
    setMessage(t('feedback.expToast', { exp: expGained, coins: coinsGained }));
    banner.current?.send({
      v: 1,
      type: 'ITEM_CHECKED',
      payload: { progress: Math.min(1, exp / expForNext) },
    });
  };

  const uncheck = (): void => {
    const penalty =
      config.undoCoinPenalty[Math.min(state.undos, config.undoCoinPenalty.length - 1)] ?? 0;
    const lost = Math.min(state.coins, penalty);
    setState({ ...state, checked: false, coins: state.coins - lost, undos: state.undos + 1 });
    // The EXP never goes back: the hero stays where he is and only the coins go down
    if (lost > 0) toast.warning(t('feedback.undoneCoins', { coins: lost }));
    else toast.info(t('feedback.undoneNoCoins'));
  };

  return (
    <View style={styles.stack}>
      <View style={styles.banner}>
        <BannerView ref={banner} initMessage={initMessage} aspectRatio={QG_ASPECT_RATIO} />
      </View>
      <StoryProgressView
        name={t('qg.scenarios.beach')}
        subtitle={t('progress.chapter', { number: 1, title: t('tutorial.demoChapter') })}
        chapter={1}
        completed={false}
        level={1}
        coins={state.coins}
        expInLevel={state.exp}
        expForNextLevel={expForNext}
        ratio={state.exp / expForNext}
        showCoins
      />
      <ItemRow
        item={demoItem(t('tutorial.demoItem'), state.checked)}
        onCheck={check}
        onUndo={uncheck}
      />
      <ExpToast
        message={message}
        onHidden={() => {
          setMessage(null);
        }}
      />
    </View>
  );
}

/**
 * Intro slide 3: the sceneries of the stories. Picking one shows the hero walking in it, as in the
 * app. Nothing here is saved.
 */
export function IntroScenery({ look }: LookProps) {
  const { t } = useTranslation();
  const time = useTimeOfDay('auto');
  const [scene, setScene] = useState<StoryScenario>('beach');
  const initMessage = useMemo(() => journeyInit(look, scene, 0.5, time), [look, scene, time]);
  return (
    <View style={styles.stack}>
      <View style={styles.banner}>
        <BannerView initMessage={initMessage} aspectRatio={QG_ASPECT_RATIO} />
      </View>
      <Pills
        scroll
        label={t('qg.scenario')}
        value={scene}
        onChange={setScene}
        options={STORY_SCENARIOS.map((id) => ({ value: id, label: t(`qg.scenarios.${id}`) }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: space[12] },
  banner: { borderRadius: radius.lg, overflow: 'hidden' },
});
