import type { BannerToAppMessage } from '@nextjourney/contracts';
import { type ReactNode, type RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chapterProgress, useMe } from '@/api/queries';
import { BannerView, type BannerViewHandle, type InitMessage } from '@/banner/banner-view';
import { colors, radius, size, space } from '@/theme';

const CHECK_STEP = 0.2;

type Props = {
  title: string;
  /** O dono da tela pode enviar mensagens ao banner (ex.: ITEM_CHECKED depois de um check). */
  bannerRef?: RefObject<BannerViewHandle | null>;
  /** Mensagens do banner (ex.: CHAPTER_TRANSITION_DONE abre o modal do capítulo). */
  onBannerMessage?: (message: BannerToAppMessage) => void;
  /** Botões de simulação (só em desenvolvimento) para exercitar o banner sem a API. */
  debug?: boolean;
  children?: ReactNode;
};

/** Tela das abas: banner no topo (posição real do capítulo) e o conteúdo da aba embaixo. */
export function TabScreen({ title, bannerRef, onBannerMessage, debug = true, children }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ownRef = useRef<BannerViewHandle>(null);
  const banner = bannerRef ?? ownRef;
  const { data: me } = useMe();
  const [simProgress, setSimProgress] = useState(0);
  const [lastEvent, setLastEvent] = useState('-');

  // INIT com a posição real do capítulo (cena Mapa); os dados de personagem são fixos até a Fase 5
  const initMessage = useMemo<InitMessage>(
    () => ({
      v: 1,
      type: 'INIT',
      payload: {
        scene: 'map',
        character: { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' },
        sceneKey: `story-1-chapter-${me?.player.story.chapter ?? 1}`,
        progress: chapterProgress(me),
        timeOfDay: 'night',
      },
    }),
    [me],
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
      <BannerView ref={banner} initMessage={initMessage} onMessage={handleBannerMessage} />
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
