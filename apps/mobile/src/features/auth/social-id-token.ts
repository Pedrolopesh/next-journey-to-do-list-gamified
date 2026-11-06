import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Client ids are public (not secrets). Without them the Google button does not show.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

export const googleEnabled = GOOGLE_WEB_CLIENT_ID !== '';

/** Prepares Google (once per screen that uses it). Does nothing without a configured client id. */
export function configureGoogle(): void {
  if (!googleEnabled) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });
}

/** Apple only exists on iOS and when the device supports it. */
export async function isAppleAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

/** Opens the Google login and returns the ID token, or `null` if the person cancelled. */
export async function getGoogleIdToken(): Promise<string | null> {
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  return isSuccessResponse(result) ? (result.data.idToken ?? null) : null;
}

/** Opens the Apple login and returns the ID token, or `null` if the person cancelled. */
export async function getAppleIdToken(): Promise<string | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });
    return credential.identityToken ?? null;
  } catch (cause) {
    // Cancelling the Apple flow is not an error; any other failure bubbles up
    if ((cause as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw cause;
  }
}
