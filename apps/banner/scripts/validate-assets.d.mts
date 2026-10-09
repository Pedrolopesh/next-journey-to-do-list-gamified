export interface Limits {
  bundleBytes: number;
  assetBytes: number;
  maxColors: number;
}
export const LIMITS: Limits;
export function distinctColors(svg: string): Set<string>;
export function validate(args: {
  assetsDir: string;
  bundlePath: string;
  limits?: Limits;
}): string[];
