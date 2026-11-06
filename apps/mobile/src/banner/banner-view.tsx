import {
  type AppToBannerMessage,
  type BannerToAppMessage,
  parseBannerToAppMessage,
} from '@nextjourney/contracts';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors, fontSize } from '@/theme';

import bannerAsset from '../../assets/banner/banner.html';
import { shouldPlay } from './playback';

/** Banner 390 x 180 (tabs Map scene) */
const ASPECT_RATIO = 390 / 180;
/** Banner 390 x 220 (QG scene on the Home) */
export const QG_ASPECT_RATIO = 390 / 220;
/** If the banner does not send READY within this time, the app shows the static fallback. */
const READY_TIMEOUT_MS = 2000;
/** Banner fade-in time after INIT; only then does the loading indicator go away. */
const REVEAL_MS = 350;

export type InitMessage = Extract<AppToBannerMessage, { type: 'INIT' }>;

export type BannerViewHandle = {
  /** Sends a typed message to the banner (already validated by the contract type). */
  send: (message: AppToBannerMessage) => void;
  /** Resends the screen's current INIT: puts the banner back at the real position (e.g. a check that failed). */
  reset: () => void;
};

type Props = {
  /** Aspect ratio of the banner area (default: the Map scene). */
  aspectRatio?: number;
  /** Sent to the banner as soon as it reports READY. */
  initMessage: InitMessage;
  /** Screen in focus; out of focus the banner is paused (default: in focus). */
  focused?: boolean;
  /** Valid messages coming from the banner (READY, CHAPTER_TRANSITION_DONE, ERROR). */
  onMessage?: (message: BannerToAppMessage) => void;
};

async function loadBannerHtml(): Promise<string> {
  const asset = Asset.fromModule(bannerAsset);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('banner.html sem localUri');
  return new File(asset.localUri).text();
}

export const BannerView = forwardRef<BannerViewHandle, Props>(function BannerView(
  { initMessage, onMessage, aspectRatio = ASPECT_RATIO, focused = true },
  ref,
) {
  const { t } = useTranslation();
  const webViewRef = useRef<WebView<object>>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const readyRef = useRef(false);
  const initRef = useRef(initMessage);
  initRef.current = initMessage;

  const send = useCallback((message: AppToBannerMessage) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  const reset = useCallback(() => {
    send(initRef.current);
  }, [send]);

  useImperativeHandle(ref, () => ({ send, reset }), [send, reset]);

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

  // Pauses the banner in the background and when the system asks to reduce motion
  const reduceMotionRef = useRef(false);
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const syncPlayback = useCallback(() => {
    if (!readyRef.current) return;
    const play = shouldPlay(
      AppState.currentState ?? 'active',
      reduceMotionRef.current,
      focusedRef.current,
    );
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

  useEffect(() => {
    syncPlayback();
  }, [focused, syncPlayback]);

  // If INIT changes after READY (e.g. GET /me arrived), positions again, without animation
  useEffect(() => {
    if (readyRef.current) send(initMessage);
  }, [initMessage, send]);

  // The WebView only starts counting after the HTML has been read
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
      if (!result.ok) return; // an invalid banner message is discarded
      const { message } = result;
      if (message.type === 'READY') {
        readyRef.current = true;
        setFailed(false);
        // The app only sends INIT after READY
        send(initRef.current);
        syncPlayback();
        setTimeout(() => {
          setRevealed(true);
        }, REVEAL_MS);
      }
      onMessage?.(message);
    },
    [onMessage, send, syncPlayback],
  );

  return (
    <View
      style={[styles.container, { aspectRatio }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {html !== null && (
        // <object>: in 14.0.1 the default generic (undefined) wipes out the props in the types
        <WebView<object>
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
      {!revealed && !failed && (
        <View style={styles.fallback} pointerEvents="none">
          <ActivityIndicator color={colors.brand.primaryLight} />
        </View>
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
  fallbackText: { color: colors.text.secondary, fontSize: fontSize[13] },
});
