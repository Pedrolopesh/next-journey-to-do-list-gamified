import { describe, expect, it } from 'vitest';

import { withMinDuration } from './min-duration.js';

const took = async (run: () => Promise<unknown>): Promise<number> => {
  const start = performance.now();
  await run().catch(() => undefined);
  return performance.now() - start;
};

describe('withMinDuration', () => {
  it('segura a resposta rápida até o piso', async () => {
    expect(
      await took(() => withMinDuration(120, () => Promise.resolve('ok'))),
    ).toBeGreaterThanOrEqual(115);
  });

  it('também segura quando a operação falha', async () => {
    const elapsed = await took(() => withMinDuration(120, () => Promise.reject(new Error('x'))));
    expect(elapsed).toBeGreaterThanOrEqual(115);
    await expect(withMinDuration(0, () => Promise.reject(new Error('x')))).rejects.toThrow('x');
  });

  it('não acrescenta tempo a uma operação que já passou do piso', async () => {
    const elapsed = await took(() =>
      withMinDuration(20, () => new Promise((resolve) => setTimeout(resolve, 80))),
    );
    expect(elapsed).toBeLessThan(150);
  });

  it('devolve o valor da operação', async () => {
    expect(await withMinDuration(0, () => Promise.resolve(42))).toBe(42);
  });
});
