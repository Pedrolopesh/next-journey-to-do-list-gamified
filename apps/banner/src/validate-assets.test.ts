import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { distinctColors, validate } from '../scripts/validate-assets.mjs';

const limits = { bundleBytes: 100, assetBytes: 200, maxColors: 2 };

function setup(files: Record<string, string>, bundle: string | null) {
  const dir = mkdtempSync(join(tmpdir(), 'assets-'));
  const assetsDir = join(dir, 'assets');
  mkdirSync(assetsDir);
  for (const [name, content] of Object.entries(files))
    writeFileSync(join(assetsDir, name), content);
  const bundlePath = join(dir, 'index.html');
  if (bundle !== null) writeFileSync(bundlePath, bundle);
  return { assetsDir, bundlePath, limits };
}

describe('validate-assets', () => {
  it('conta cores distintas, igualando #fff e #FFFFFF', () => {
    const svg = '<rect fill="#fff"/><rect fill="#FFFFFF"/><rect fill="#123456"/>';
    expect(distinctColors(svg).size).toBe(2);
  });

  it('aceita arte e bundle dentro dos limites', () => {
    const args = setup({ 'a.svg': '<rect fill="#111111"/>' }, 'ok');
    expect(validate(args)).toEqual([]);
  });

  it('acusa paleta grande, arquivo pesado e bundle acima do limite', () => {
    const svg = '<g fill="#111111"/><g fill="#222222"/><g fill="#333333"/>' + ' '.repeat(200);
    const problems = validate(setup({ 'big.svg': svg }, 'x'.repeat(101)));
    expect(problems).toHaveLength(3);
  });

  it('acusa bundle ausente', () => {
    expect(validate(setup({}, null))[0]).toMatch(/não existe/);
  });
});
