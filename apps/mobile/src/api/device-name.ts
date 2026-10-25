import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Nome do aparelho mostrado na lista de sessões (ex.: "iOS · iPhone do Pedro"). Vai no cabeçalho
 * X-Device-Name, codificado, porque cabeçalho HTTP não carrega acento de forma confiável.
 */
export function deviceName(): string {
  const system = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const name = Constants.deviceName?.trim();
  return name ? `${system} · ${name}` : system;
}
