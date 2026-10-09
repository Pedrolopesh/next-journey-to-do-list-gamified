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
    // Sign in with Apple (exigência da App Store quando há login social)
    usesAppleSignIn: true,
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
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        backgroundColor: BG_BASE,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  // (o plugin do Google entra abaixo, só se o client id iOS estiver configurado)
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  // Só valores públicos. EXPO_PUBLIC_* é embutido no app: nunca coloque segredo aqui.
  extra: {
    appVariant: IS_PROD ? 'production' : 'development',
  },
};

// O plugin do Google Sign-In precisa do esquema de URL do client id iOS (público, não é segredo).
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
if (googleIosUrlScheme) {
  config.plugins = [
    ...(config.plugins ?? []),
    ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }],
  ];
}

export default config;
