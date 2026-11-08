import { describe, expect, it } from 'vitest';

import { withMinDuration } from './min-duration.js';

const took = async (run: () => Promise<unknown>): Promise<number> => {
  const start = performance.now();
  await run().catch(() => undefined);
  return performance.now() - start;
};

describe('withMinDuration', () => {
  it('holds a fast response until the floor', async () => {
    expect(
      await took(() => withMinDuration(120, () => Promise.resolve('ok'))),
    ).toBeGreaterThanOrEqual(100);
  });

  it('also holds when the operation fails', async () => {
    const elapsed = await took(() => withMinDuration(120, () => Promise.reject(new Error('x'))));
    expect(elapsed).toBeGreaterThanOrEqual(100);
    await expect(withMinDuration(0, () => Promise.reject(new Error('x')))).rejects.toThrow('x');
  });

  it('adds no time to an operation that already passed the floor', async () => {
    const elapsed = await took(() =>
      withMinDuration(20, () => new Promise((resolve) => setTimeout(resolve, 80))),
    );
    expect(elapsed).toBeLessThan(400);
  });

  it('returns the value of the operation', async () => {
    expect(await withMinDuration(0, () => Promise.resolve(42))).toBe(42);
  });
});
