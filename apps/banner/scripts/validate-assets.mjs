// Valida a arte do banner (Fase 6): peso do bundle, tamanho dos arquivos e paleta por sprite.
// Roda depois do build: `pnpm --filter @nextjourney/banner validate:assets`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Limites. Mudar um limite exige registrar o motivo no ADR-0003. */
export const LIMITS = {
  bundleBytes: 1_500_000, // index.html único (tudo embutido) que vai dentro do app
  assetBytes: 60_000, // cada arquivo de arte no código-fonte
  maxColors: 16, // paleta LPC: até 16 cores por sprite
};

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

/** Cores distintas de um SVG, em minúsculas e com 6 dígitos. */
export function distinctColors(svg) {
  const colors = new Set();
  for (const raw of svg.match(HEX) ?? []) {
    let hex = raw.slice(1).toLowerCase();
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
    colors.add(hex.slice(0, 6));
  }
  return colors;
}

/** Retorna a lista de problemas; vazia quando tudo está dentro dos limites. */
export function validate({ assetsDir, bundlePath, limits = LIMITS }) {
  const problems = [];

  if (existsSync(assetsDir)) {
    for (const file of readdirSync(assetsDir)) {
      const path = join(assetsDir, file);
      const size = statSync(path).size;
      if (size > limits.assetBytes) {
        problems.push(`${file}: ${size} bytes passa de ${limits.assetBytes}`);
      }
      if (file.endsWith('.svg')) {
        const colors = distinctColors(readFileSync(path, 'utf8')).size;
        if (colors > limits.maxColors) {
          problems.push(`${file}: ${colors} cores passa de ${limits.maxColors}`);
        }
      }
    }
  }

  if (!existsSync(bundlePath)) {
    problems.push('dist/index.html não existe: rode o build antes');
  } else {
    const size = statSync(bundlePath).size;
    if (size > limits.bundleBytes) {
      problems.push(`banner: ${size} bytes passa do limite de ${limits.bundleBytes}`);
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = validate({
    assetsDir: join(root, 'src', 'assets'),
    bundlePath: join(root, 'dist', 'index.html'),
  });
  if (problems.length > 0) {
    console.error(`validação de assets falhou:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  const kb = Math.round(statSync(join(root, 'dist', 'index.html')).size / 1024);
  console.log(
    `assets ok (banner com ${kb} KB, limite ${Math.round(LIMITS.bundleBytes / 1024)} KB)`,
  );
}
