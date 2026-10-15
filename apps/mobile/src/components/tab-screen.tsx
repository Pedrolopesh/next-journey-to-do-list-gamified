import type { BannerToAppMessage } from '@nextjourney/contracts';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chapterProgress, useMe } from '@/api/queries';
import {
  BannerView,
  type BannerViewHandle,
  type InitMessage,
  QG_ASPECT_RATIO,
} from '@/banner/banner-view';
import { characterLayers } from '@/features/qg/character-layers';
import { journeyView } from '@/features/qg/journey-progress';
import { useJourneyStore } from '@/features/qg/journey-store';
import { DEFAULT_STORY_SCENARIO, isStoryScenario } from '@/features/qg/options';
import { useQgPrefs } from '@/features/qg/qg-store';
import { useTimeOfDay } from '@/features/qg/use-time-of-day';
import { colors, radius, size, space } from '@/theme';

const CHECK_STEP = 0.2;

type Props = {
  title: string;
  /** Cena do banner: `journey` (personagem andando, nas abas) ou `qg` (cenário da Home). */
  scene?: 'journey' | 'qg';
  /** O dono da tela pode enviar mensagens ao banner (ex.: ITEM_CHECKED depois de um check). */
  bannerRef?: RefObject<BannerViewHandle | null>;
  /** Mensagens do banner (ex.: CHAPTER_TRANSITION_DONE abre o modal do capítulo). */
  onBannerMessage?: (message: BannerToAppMessage) => void;
  /** Texto pequeno em cima do banner (ex.: "QG"). */
  bannerLabel?: string;
  /** Texto discreto embaixo do banner. */
  bannerCaption?: string;
  /** Mostra um botão de voltar sobre o banner (telas empilhadas). */
  onBack?: () => void;
  /** Botões de simulação (só em desenvolvimento) para exercitar o banner sem a API. */
  debug?: boolean;
  children?: ReactNode;
};

/** Tela das abas: banner no topo (posição real do capítulo) e o conteúdo da aba embaixo. */
export function TabScreen({
  title,
  scene = 'journey',
  bannerRef,
  onBannerMessage,
  bannerLabel,
  bannerCaption,
  onBack,
  debug = true,
  children,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ownRef = useRef<BannerViewHandle>(null);
  const banner = bannerRef ?? ownRef;
  const { data: me } = useMe();
  const { scenario, timeMode } = useQgPrefs();
  // A jornada usa o cenário da história ativa (história = cenário)
  const storySlug = me?.story?.slug;
  const storyScenario = isStoryScenario(storySlug) ? storySlug : DEFAULT_STORY_SCENARIO;
  const qgTime = useTimeOfDay(timeMode);
  const userId = me?.user.id;
  const level = me?.player.level;
  const shownLevel = useJourneyStore((state) => (userId ? state.shownLevel[userId] : undefined));
  // Primeiro uso, ou nível que caiu: a cena exibida acompanha o nível atual
  useEffect(() => {
    if (userId && level !== undefined) useJourneyStore.getState().reconcile(userId, level);
  }, [userId, level]);
  // Aba fora de foco continua montada (troca instantânea), mas o banner fica parado
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
      };
    }, []),
  );
  const [simProgress, setSimProgress] = useState(0);
  const [lastEvent, setLastEvent] = useState('-');

  // INIT: o cenário (do QG ou da história principal), a hora escolhida e o personagem salvo
  const initMessage = useMemo<InitMessage>(
    () => ({
      v: 1,
      type: 'INIT',
      payload:
        scene === 'qg'
          ? {
              scene: 'qg',
              character: characterLayers(me?.character ?? null),
              sceneKey: scenario,
              progress: chapterProgress(me),
              timeOfDay: qgTime,
            }
          : {
              scene: 'journey',
              character: characterLayers(me?.character ?? null),
              sceneKey: storyScenario,
              progress: me ? journeyView(me.player, shownLevel).progress : 0,
              timeOfDay: qgTime,
            },
    }),
    [me, scene, scenario, storyScenario, qgTime, shownLevel],
  );

  const handleBannerMessage = useCallback(
    (message: BannerToAppMessage) => {
      setLastEvent(message.type);
      onBannerMessage?.(message);
    },
    [onBannerMessage],
  );

  const simulateCheck = (): void => {
    const next = Math.min(1, simProgress + CHECK_STEP);
    setSimProgress(next);
    banner.current?.send({ v: 1, type: 'ITEM_CHECKED', payload: { progress: next } });
  };

  const simulateChapter = (): void => {
    setSimProgress(0);
    banner.current?.send({
      v: 1,
      type: 'CHAPTER_COMPLETED',
      payload: { nextSceneKey: 'story-1-next' },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {bannerLabel ? (
        <Text style={styles.bannerLabel} accessibilityRole="header">
          {bannerLabel}
        </Text>
      ) : null}
      <View>
        <BannerView
          ref={banner}
          initMessage={initMessage}
          onMessage={handleBannerMessage}
          aspectRatio={QG_ASPECT_RATIO}
          focused={focused}
        />
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onBack}
            style={styles.back}
          >
            <IconChevronLeft size={22} color={colors.text.primary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      {bannerCaption ? <Text style={styles.bannerCaption}>{bannerCaption}</Text> : null}
      <View style={styles.body}>
        {children ?? (
          <>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.subtitle}>{t('placeholder.comingSoon')}</Text>
          </>
        )}

        {__DEV__ && debug && (
          <View style={styles.debug}>
            <Text style={styles.debugText}>{t('debug.lastEvent', { event: lastEvent })}</Text>
            <Pressable style={styles.button} accessibilityRole="button" onPress={simulateCheck}>
              <Text style={styles.buttonText}>{t('debug.simulateCheck')}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              accessibilityRole="button"
              onPress={simulateChapter}
            >
              <Text style={styles.buttonText}>{t('debug.simulateChapter')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  body: { flex: 1, padding: space.screenMargin, gap: space[8] },
  bannerLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: space[4],
  },
  bannerCaption: {
    color: colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: space.screenMargin,
    paddingTop: space[8],
  },
  back: {
    position: 'absolute',
    top: space[8],
    left: space[8],
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 25, 0.55)',
  },
  title: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: space[24],
  },
  subtitle: { color: colors.text.secondary, fontSize: 14, textAlign: 'center' },
  debug: { width: '100%', gap: space[8], marginTop: space[24] },
  debugText: { color: colors.text.muted, fontSize: 12, textAlign: 'center' },
  button: {
    minHeight: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.brand.primary,
  },
  buttonSecondary: { backgroundColor: colors.bg.raised },
  buttonText: { color: colors.text.onPrimary, fontSize: 14, fontWeight: '600' },
});
