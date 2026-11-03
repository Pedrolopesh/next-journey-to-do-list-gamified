const channel = (hex: string, start: number): number => parseInt(hex.slice(start, start + 2), 16);

const toHex = (value: number): string => Math.round(value).toString(16).padStart(2, '0');

/**
 * Color at `position` (0 to 1, wrapping around) on a loop through `stops` ("#rrggbb"), blended
 * between the two neighbouring stops so the change is smooth, with no jump at the end of the loop.
 */
export function gradientColor(stops: readonly string[], position: number): string {
  const first = stops[0];
  if (first === undefined) return '#000000';
  const wrapped = ((position % 1) + 1) % 1;
  const scaled = wrapped * stops.length;
  const index = Math.floor(scaled);
  const from = stops[index % stops.length] ?? first;
  const to = stops[(index + 1) % stops.length] ?? first;
  const mix = scaled - index;
  const blend = (start: number): string =>
    toHex(channel(from, start) + (channel(to, start) - channel(from, start)) * mix);
  return `#${blend(1)}${blend(3)}${blend(5)}`;
}
