import {
  type AppToBannerMessage,
  type BannerToAppMessage,
  parseAppToBannerMessage,
} from '@nextjourney/contracts';

type ReactNativeWindow = Window & {
  ReactNativeWebView?: { postMessage: (data: string) => void };
};

/** Banner -> app. In the WebView it uses the React Native bridge; in the debug panel (iframe) it uses the parent. */
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
 * App -> banner. React Native delivers on `window` (iOS) or on `document` (Android).
 * An invalid message is discarded and reported by `onInvalid` (becomes ERROR).
 */
export function listenToApp(
  onMessage: (message: AppToBannerMessage) => void,
  onInvalid: (error: string) => void,
): () => void {
  const handler = (event: Event): void => {
    const { data, source } = event as MessageEvent<unknown>;
    // In debug (iframe) it only accepts the parent; in the WebView `source` is null.
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
