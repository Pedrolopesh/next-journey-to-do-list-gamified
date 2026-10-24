import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Client ids são públicos (não são segredos). Sem eles o botão do Google não aparece.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

export const googleEnabled = GOOGLE_WEB_CLIENT_ID !== '';

/** Prepara o Google (uma vez por tela que o usa). Sem client id configurado não faz nada. */
export function configureGoogle(): void {
  if (!googleEnabled) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });
}

/** Apple só existe no iOS e quando o aparelho suporta. */
export async function isAppleAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

/** Abre o login do Google e devolve o ID token, ou `null` se a pessoa cancelou. */
export async function getGoogleIdToken(): Promise<string | null> {
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  return isSuccessResponse(result) ? (result.data.idToken ?? null) : null;
}

/** Abre o login da Apple e devolve o ID token, ou `null` se a pessoa cancelou. */
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
    // Cancelar o fluxo da Apple não é erro; qualquer outra falha sobe
    if ((cause as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw cause;
  }
}
