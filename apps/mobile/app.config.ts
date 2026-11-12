import type { ExpoConfig } from 'expo/config';

// APP_VARIANT=production comes from the EAS `preview` and `production` profiles (eas.json). Any other value is dev.
const IS_PROD = process.env.APP_VARIANT === 'production';

// Bundle id and package set on 2026-10-02. Immutable from the first published iOS build.
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
    // Sign in with Apple (App Store requirement when there is social login)
    usesAppleSignIn: true,
  },
  android: {
    package: appId,
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
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
    'expo-notifications',
    './plugins/without-precompiled-modules',
    [
      'expo-splash-screen',
      {
        backgroundColor: BG_BASE,
        image: './assets/images/splash-icon.png',
        imageWidth: 128,
      },
    ],
  ],
  // (the Google plugin comes in below, only if the iOS client id is configured)
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  // Public values only. EXPO_PUBLIC_* is bundled into the app: never put a secret here.
  extra: {
    appVariant: IS_PROD ? 'production' : 'development',
    eas: { projectId: '630293eb-b098-4164-b3d1-03fa8eb2d70a' },
  },
  owner: 'infra_wetechhub',
};

// The Google Sign-In plugin needs the URL scheme of the iOS client id (public, not a secret).
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
if (googleIosUrlScheme) {
  config.plugins = [
    ...(config.plugins ?? []),
    ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }],
  ];
}

export default config;
