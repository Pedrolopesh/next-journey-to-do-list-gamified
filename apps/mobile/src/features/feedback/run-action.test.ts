import { describe, expect, it } from 'vitest';

import { runAction } from './run-action';

function setup() {
  const events: string[] = [];
  return {
    events,
    hooks: {
      name: 'teste',
      error: (e: unknown) => `falhou: ${(e as Error).message}`,
      onSuccess: (m: string) => events.push(`ok:${m}`),
      onError: (m: string) => events.push(`erro:${m}`),
      onLoading: (l: boolean) => events.push(`loading:${l}`),
    },
  };
}

describe('runAction', () => {
  it('shows loading, then success, and stops loading', async () => {
    const { events, hooks } = setup();
    const ok = await runAction(() => Promise.resolve(1), { ...hooks, success: 'Salvo' });
    expect(ok).toBe(true);
    expect(events).toEqual(['loading:true', 'ok:Salvo', 'loading:false']);
  });

  it('shows the error and never throws', async () => {
    const { events, hooks } = setup();
    const ok = await runAction(() => Promise.reject(new Error('rede')), hooks);
    expect(ok).toBe(false);
    expect(events).toEqual(['loading:true', 'erro:falhou: rede', 'loading:false']);
  });

  it('without a success message it does not fire a success toast', async () => {
    const { events, hooks } = setup();
    await runAction(() => Promise.resolve(), hooks);
    expect(events).toEqual(['loading:true', 'loading:false']);
  });
});
