import type { ExpoConfig } from 'expo/config';

// APP_VARIANT=production vem do perfil `production` do EAS (eas.json). Qualquer outro valor é dev.
const IS_PROD = process.env.APP_VARIANT === 'production';

// Bundle id e package definidos em 2026-10-02. Imutáveis a partir do primeiro build iOS publicado.
const APP_ID = 'br.com.wetechhub.app';
const appId = IS_PROD ? APP_ID : `${APP_ID}.dev`;

// bg/base do design system (tema escuro nativo)
const BG_BASE = '#1A1A2E';

const config: ExpoConfig = {
  name: IS_PROD ? 'Next Journey' : 'Next Journey (dev)',
  slug: 'next-journey',
  scheme: 'nextjourney',
  version: '0.0.1',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/images/icon.png',
  ios: {
    bundleIdentifier: appId,
    icon: './assets/expo.icon',
    supportsTablet: false,
  },
  android: {
    package: appId,
    adaptiveIcon: {
      backgroundColor: BG_BASE,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: BG_BASE,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  // Só valores públicos. EXPO_PUBLIC_* é embutido no app: nunca coloque segredo aqui.
  extra: {
    appVariant: IS_PROD ? 'production' : 'development',
  },
};

export default config;
