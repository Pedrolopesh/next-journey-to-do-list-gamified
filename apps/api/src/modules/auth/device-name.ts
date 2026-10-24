/** Nome mostrado quando o app não informa um nome de aparelho válido. */
export const UNKNOWN_DEVICE = 'Aparelho desconhecido';

const MAX_LENGTH = 80;

/** Cabeçalho HTTP não carrega acento de forma confiável: o app envia o nome codificado (URL-encode). */
function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Caractere de controle (0x00 a 0x1f e 0x7f), conferido por código em vez de expressão regular. */
const isControl = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
};

/**
 * Limpa o nome do aparelho vindo do cliente (cabeçalho X-Device-Name): decodifica, tira caracteres de
 * controle, junta espaços e limita o tamanho. É dado do cliente: só vira texto na tela, nunca é interpretado.
 */
export function cleanDeviceName(raw: string | undefined): string | null {
  if (!raw) return null;
  const clean = [...decode(raw)]
    .map((char) => (isControl(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  // Corta por caractere (não por unidade UTF-16), para não partir um emoji ao meio
  return clean ? [...clean].slice(0, MAX_LENGTH).join('') : null;
}
