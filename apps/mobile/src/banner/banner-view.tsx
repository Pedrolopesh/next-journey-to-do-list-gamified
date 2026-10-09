import {
  type AppToBannerMessage,
  type BannerToAppMessage,
  parseBannerToAppMessage,
} from '@nextjourney/contracts';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, AppState, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors } from '@/theme';

import bannerAsset from '../../assets/banner/banner.html';
import { shouldPlay } from './playback';

/** Banner 390 x 180 (cena Mapa das abas) */
const ASPECT_RATIO = 390 / 180;
/** Se o banner não mandar READY neste prazo, o app mostra o fallback estático. */
const READY_TIMEOUT_MS = 2000;

export type InitMessage = Extract<AppToBannerMessage, { type: 'INIT' }>;

export type BannerViewHandle = {
  /** Envia uma mensagem tipada ao banner (já validada pelo tipo do contrato). */
  send: (message: AppToBannerMessage) => void;
};

type Props = {
  /** Enviada ao banner assim que ele avisa READY. */
  initMessage: InitMessage;
  /** Mensagens válidas vindas do banner (READY, CHAPTER_TRANSITION_DONE, ERROR). */
  onMessage?: (message: BannerToAppMessage) => void;
};

async function loadBannerHtml(): Promise<string> {
  const asset = Asset.fromModule(bannerAsset);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('banner.html sem localUri');
  return new File(asset.localUri).text();
}

export const BannerView = forwardRef<BannerViewHandle, Props>(function BannerView(
  { initMessage, onMessage },
  ref,
) {
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(false);
  const initRef = useRef(initMessage);
  initRef.current = initMessage;

  const send = useCallback((message: AppToBannerMessage) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  useImperativeHandle(ref, () => ({ send }), [send]);

  useEffect(() => {
    let cancelled = false;
    loadBannerHtml()
      .then((content) => {
        if (!cancelled) setHtml(content);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pausa o banner em segundo plano e quando o sistema pede para reduzir movimento
  const reduceMotionRef = useRef(false);
  const syncPlayback = useCallback(() => {
    if (!readyRef.current) return;
    const play = shouldPlay(AppState.currentState, reduceMotionRef.current);
    send({ v: 1, type: play ? 'RESUME' : 'PAUSE' });
  }, [send]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
      syncPlayback();
    });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reduceMotionRef.current = enabled;
      syncPlayback();
    });
    const appState = AppState.addEventListener('change', syncPlayback);
    return () => {
      motion.remove();
      appState.remove();
    };
  }, [syncPlayback]);

  // Se o INIT mudar depois do READY (ex.: o GET /me chegou), posiciona de novo, sem animação
  useEffect(() => {
    if (readyRef.current) send(initMessage);
  }, [initMessage, send]);

  // O WebView só começa a contar depois que o HTML foi lido
  useEffect(() => {
    if (html === null) return;
    const timer = setTimeout(() => {
      if (!readyRef.current) setFailed(true);
    }, READY_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [html]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const result = parseBannerToAppMessage(event.nativeEvent.data);
      if (!result.ok) return; // mensagem inválida do banner é descartada
      const { message } = result;
      if (message.type === 'READY') {
        readyRef.current = true;
        setFailed(false);
        // O app só envia INIT depois do READY
        send(initRef.current);
        syncPlayback();
      }
      onMessage?.(message);
    },
    [onMessage, send, syncPlayback],
  );

  return (
    <View style={styles.container} accessibilityElementsHidden importantForAccessibility="no">
      {html !== null && (
        <WebView
          ref={webViewRef}
          style={styles.webview}
          source={{ html }}
          originWhitelist={['about:blank']}
          onShouldStartLoadWithRequest={(request) => request.url === 'about:blank'}
          javaScriptEnabled
          domStorageEnabled={false}
          allowFileAccess={false}
          allowsLinkPreview={false}
          setSupportMultipleWindows={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          androidLayerType="hardware"
          onMessage={handleMessage}
          onError={() => {
            setFailed(true);
          }}
        />
      )}
      {failed && (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>{t('banner.fallback')}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: ASPECT_RATIO,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  fallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.sunken,
  },
  fallbackText: { color: colors.text.secondary, fontSize: 13 },
});
