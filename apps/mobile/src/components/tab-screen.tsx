import type { BannerToAppMessage } from '@nextjourney/contracts';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerView, type BannerViewHandle, type InitMessage } from '@/banner/banner-view';
import { colors, radius, size, space } from '@/theme';

// Dados fixos do spike (Fase 2): herói + bioma. Os reais chegam da API a partir da Fase 4.
const INIT_MESSAGE: InitMessage = {
  v: 1,
  type: 'INIT',
  payload: {
    scene: 'map',
    character: { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' },
    sceneKey: 'empreendedor-1',
    progress: 0,
    timeOfDay: 'night',
  },
};

const CHECK_STEP = 0.2;

type Props = { title: string };

/** Tela das abas: banner no topo, título e (só em desenvolvimento) botões para simular eventos. */
export function TabScreen({ title }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const banner = useRef<BannerViewHandle>(null);
  const [progress, setProgress] = useState(0);
  const [lastEvent, setLastEvent] = useState('-');

  const handleBannerMessage = useCallback((message: BannerToAppMessage) => {
    setLastEvent(message.type);
  }, []);

  const simulateCheck = (): void => {
    const next = Math.min(1, progress + CHECK_STEP);
    setProgress(next);
    banner.current?.send({ v: 1, type: 'ITEM_CHECKED', payload: { progress: next } });
  };

  const simulateChapter = (): void => {
    setProgress(0);
    banner.current?.send({
      v: 1,
      type: 'CHAPTER_COMPLETED',
      payload: { nextSceneKey: 'empreendedor-2' },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BannerView ref={banner} initMessage={INIT_MESSAGE} onMessage={handleBannerMessage} />
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.subtitle}>{t('placeholder.comingSoon')}</Text>

        {__DEV__ && (
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
  body: { flex: 1, alignItems: 'center', padding: space.screenMargin, gap: space[8] },
  title: { color: colors.text.primary, fontSize: 22, fontWeight: '600', marginTop: space[24] },
  subtitle: { color: colors.text.secondary, fontSize: 14 },
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
