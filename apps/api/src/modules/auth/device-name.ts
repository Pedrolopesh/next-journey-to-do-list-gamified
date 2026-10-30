/** Shown when the app does not send a valid device name. */
export const UNKNOWN_DEVICE = 'Aparelho desconhecido';

const MAX_LENGTH = 80;

/** HTTP headers do not carry accents reliably: the app sends the name URL-encoded. */
function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Control character (0x00 to 0x1f and 0x7f), checked in code instead of a regular expression. */
const isControl = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
};

/**
 * Cleans the device name the client sends in the X-Device-Name header: decodes it, strips control
 * characters, collapses spaces and limits the length. It is client data: it only becomes text on
 * screen and is never interpreted.
 */
export function cleanDeviceName(raw: string | undefined): string | null {
  if (!raw) return null;
  const clean = [...decode(raw)]
    .map((char) => (isControl(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  // Cut by character, not by UTF-16 unit, so an emoji is never split in half.
  return clean ? [...clean].slice(0, MAX_LENGTH).join('') : null;
}
