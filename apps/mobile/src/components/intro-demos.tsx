import { DEFAULT_GAME_CONFIG, type Item, type LpcLook } from '@nextjourney/contracts';
import { IconLockOpen } from '@tabler/icons-react-native';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BannerView, type InitMessage, QG_ASPECT_RATIO } from '@/banner/banner-view';
import { toast } from '@/features/feedback/toast-store';
import { layersOfLook } from '@/features/onboarding/character-draft';
import { STORY_COLORS } from '@/features/onboarding/story-art';
import { STORY_SCENARIOS, type StoryScenario } from '@/features/qg/options';
import { useTimeOfDay } from '@/features/qg/use-time-of-day';
import { colors, fontSize, radius, space } from '@/theme';

import { ExpToast } from './exp-toast';
import { ItemRow } from './item-row';
import { PixelArt, type PixelArtName } from './pixel-art';
import { StoryChips } from './story-chips';
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

/** Intro slide 1: the hero walking, as in the app. Only shows what the app is about. */
export function IntroWalkingHero({ look }: LookProps) {
  const time = useTimeOfDay('auto');
  const initMessage = useMemo(() => journeyInit(look, 'beach', 0.5, time), [look, time]);
  return (
    <View style={styles.banner}>
      <BannerView initMessage={initMessage} aspectRatio={QG_ASPECT_RATIO} />
    </View>
  );
}

/** The three kinds of item, each with its icon, under the first slide. */
export function IntroItemTypes() {
  const { t } = useTranslation();
  return (
    <View style={styles.types}>
      {INTRO_TYPES.map((type) => (
        <View key={type.key} style={styles.typeRow}>
          <PixelArt name={type.art} size={32} />
          <Text style={styles.typeText}>
            <Text style={styles.typeName}>{t(`tutorial.slide1.types.${type.key}.name`)}</Text>
            {` · ${t(`tutorial.slide1.types.${type.key}.text`)}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const INTRO_TYPES: readonly { key: 'daily' | 'todo' | 'habit'; art: PixelArtName }[] = [
  { key: 'daily', art: 'dailies' },
  { key: 'todo', art: 'tasks' },
  { key: 'habit', art: 'streak' },
];

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
 * unchecked. Checking shows the EXP and coins toast, adds the coins to the card and fills the EXP
 * bar; unchecking takes some coins but keeps the EXP, as the real app does. Nothing
 * here touches the user's data or the API.
 */
export function IntroCheckDemo() {
  const { t } = useTranslation();
  const config = DEFAULT_GAME_CONFIG;
  const expForNext = config.levelExpTable[0] ?? 200;
  const [state, setState] = useState({ checked: false, exp: 0, coins: 0, undos: 0, earned: false });
  const [message, setMessage] = useState<string | null>(null);
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
      <StoryChips
        stories={STORY_SCENARIOS.map((id) => ({
          slug: id,
          name: t(`qg.scenarios.${id}`),
          color: STORY_COLORS[id] ?? colors.brand.primaryLight,
        }))}
        selected={scene}
        onSelect={(slug) => {
          const next = STORY_SCENARIOS.find((id) => id === slug);
          if (next) setScene(next);
        }}
      />
    </View>
  );
}

/**
 * The two rewards of a check, shown instead of explained: the EXP bar filling toward the next
 * level and chapter, and the coins falling. No text on purpose.
 */
export function IntroRewards() {
  const { t } = useTranslation();
  return (
    <View style={styles.rewards}>
      <View style={styles.reward} accessible accessibilityLabel={t('tutorial.slide2.expLabel')}>
        <View style={styles.levels}>
          <Text style={styles.level}>{t('tutorial.slide2.level', { number: 1 })}</Text>
          <Text style={styles.arrow}>›</Text>
          <Text style={styles.level}>{t('tutorial.slide2.level', { number: 2 })}</Text>
          <IconLockOpen size={18} color={colors.brand.gold} />
        </View>
        <View style={styles.segments}>
          {[1, 1, 0.5, 0, 0].map((fill, i) => (
            <View key={i} style={styles.segment}>
              <View style={[styles.segmentFill, { width: `${fill * 100}%` }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.reward} accessible accessibilityLabel={t('tutorial.slide2.coinsLabel')}>
        <View style={styles.coins}>
          <Text style={styles.plus}>+</Text>
          <PixelArt name="coin" size={18} />
          <PixelArt name="coin" size={34} />
          <PixelArt name="coin" size={24} />
          <Text style={styles.plus}>+</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: space[12] },
  banner: { borderRadius: radius.lg, overflow: 'hidden' },
  types: { alignSelf: 'stretch', gap: space[12] },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  typeText: { flex: 1, color: colors.text.secondary, fontSize: fontSize[13] },
  typeName: { color: colors.text.primary, fontWeight: '700' },
  rewards: { flexDirection: 'row', gap: space[8], alignSelf: 'stretch' },
  reward: {
    flex: 1,
    minHeight: 89,
    justifyContent: 'center',
    gap: space[12],
    padding: space[12],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
  },
  levels: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  level: {
    overflow: 'hidden',
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primaryDark,
    color: colors.text.primary,
    fontSize: fontSize[11],
    fontWeight: '700',
  },
  arrow: { color: colors.text.muted, fontSize: fontSize[14] },
  segments: { flexDirection: 'row', gap: space[4] },
  segment: {
    flex: 1,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
  },
  segmentFill: { height: '100%', backgroundColor: colors.brand.primary },
  coins: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
  plus: { color: colors.brand.gold, fontSize: fontSize[20], fontWeight: '700' },
});
