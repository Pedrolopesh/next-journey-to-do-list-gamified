/** Fusos mais comuns para a lista de configurações; o fuso do aparelho é sempre incluído no topo. */
export const COMMON_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Fortaleza',
  'America/Noronha',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Africa/Johannesburg',
  'Asia/Tokyo',
  'UTC',
] as const;

export function timezoneOptions(deviceZone: string): string[] {
  return [deviceZone, ...COMMON_TIMEZONES.filter((zone) => zone !== deviceZone)];
}
