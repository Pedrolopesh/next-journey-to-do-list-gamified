import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Device name shown in the session list (e.g. "iOS · Alex's iPhone"). Sent in the
 * X-Device-Name header, encoded, because HTTP headers do not carry accents reliably.
 */
export function deviceName(): string {
  const system = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const name = Constants.deviceName?.trim();
  return name ? `${system} · ${name}` : system;
}
