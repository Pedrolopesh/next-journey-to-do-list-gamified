import {
  type AppToBannerMessage,
  type BannerToAppMessage,
  parseAppToBannerMessage,
} from '@nextjourney/contracts';

type ReactNativeWindow = Window & {
  ReactNativeWebView?: { postMessage: (data: string) => void };
};

/** Banner -> app. No WebView usa a ponte do React Native; no painel de debug (iframe) usa o pai. */
export function sendToApp(message: BannerToAppMessage): void {
  const data = JSON.stringify(message);
  const native = (window as ReactNativeWindow).ReactNativeWebView;
  if (native) {
    native.postMessage(data);
  } else if (window.parent !== window) {
    window.parent.postMessage(data, '*');
  }
}

/**
 * App -> banner. O React Native entrega no `window` (iOS) ou no `document` (Android).
 * Mensagem inválida é descartada e reportada por `onInvalid` (vira ERROR).
 */
export function listenToApp(
  onMessage: (message: AppToBannerMessage) => void,
  onInvalid: (error: string) => void,
): () => void {
  const handler = (event: Event): void => {
    const { data, source } = event as MessageEvent<unknown>;
    // No debug (iframe) só aceita o pai; no WebView o `source` é nulo.
    if (source && source !== window && source !== window.parent) return;
    const result = parseAppToBannerMessage(data);
    if (result.ok) onMessage(result.message);
    else onInvalid(result.error);
  };
  window.addEventListener('message', handler);
  document.addEventListener('message', handler);
  return () => {
    window.removeEventListener('message', handler);
    document.removeEventListener('message', handler);
  };
}
