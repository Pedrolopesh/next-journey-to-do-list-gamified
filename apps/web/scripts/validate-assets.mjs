// Validates the banner art (Phase 6): bundle weight, file sizes and palette per sprite.
// Runs after the build: `pnpm --filter @nextjourney/banner validate:assets`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Limits. Changing a limit requires recording the reason in ADR-0003. */
export const LIMITS = {
  bundleBytes: 1_500_000, // single index.html (everything embedded) that goes inside the app
  assetBytes: 60_000, // each art file in the source code
  maxColors: 16, // LPC palette: up to 16 colors per sprite
};

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

/** Distinct colors of an SVG, lowercase and with 6 digits. */
export function distinctColors(svg) {
  const colors = new Set();
  for (const raw of svg.match(HEX) ?? []) {
    let hex = raw.slice(1).toLowerCase();
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
    colors.add(hex.slice(0, 6));
  }
  return colors;
}

/** Reads a file or directory, returning null when it is missing (no check-then-use race). */
function attempt(read) {
  try {
    return read();
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

/** Returns the list of problems; empty when everything is within the limits. */
export function validate({ assetsDir, bundlePath, limits = LIMITS }) {
  const problems = [];

  for (const file of attempt(() => readdirSync(assetsDir)) ?? []) {
    // One read gives both the size and the content, so the file is not checked and then used
    const content = readFileSync(join(assetsDir, file));
    if (content.length > limits.assetBytes) {
      problems.push(`${file}: ${content.length} bytes is over ${limits.assetBytes}`);
    }
    if (file.endsWith('.svg')) {
      const colors = distinctColors(content.toString('utf8')).size;
      if (colors > limits.maxColors) {
        problems.push(`${file}: ${colors} colors is over ${limits.maxColors}`);
      }
    }
  }

  const bundle = attempt(() => statSync(bundlePath));
  if (!bundle) {
    problems.push('dist/index.html does not exist: run the build first');
  } else if (bundle.size > limits.bundleBytes) {
    problems.push(`banner: ${bundle.size} bytes is over the limit of ${limits.bundleBytes}`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = validate({
    assetsDir: join(root, 'src', 'assets'),
    bundlePath: join(root, 'dist', 'index.html'),
  });
  if (problems.length > 0) {
    console.error(`asset validation failed:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  const kb = Math.round(statSync(join(root, 'dist', 'index.html')).size / 1024);
  console.log(`assets ok (banner is ${kb} KB, limit ${Math.round(LIMITS.bundleBytes / 1024)} KB)`);
}
