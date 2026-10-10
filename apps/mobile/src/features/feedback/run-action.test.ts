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
  it('mostra carregando, depois sucesso, e para de carregar', async () => {
    const { events, hooks } = setup();
    const ok = await runAction(() => Promise.resolve(1), { ...hooks, success: 'Salvo' });
    expect(ok).toBe(true);
    expect(events).toEqual(['loading:true', 'ok:Salvo', 'loading:false']);
  });

  it('mostra o erro e nunca lança', async () => {
    const { events, hooks } = setup();
    const ok = await runAction(() => Promise.reject(new Error('rede')), hooks);
    expect(ok).toBe(false);
    expect(events).toEqual(['loading:true', 'erro:falhou: rede', 'loading:false']);
  });

  it('sem mensagem de sucesso não dispara toast de sucesso', async () => {
    const { events, hooks } = setup();
    await runAction(() => Promise.resolve(), hooks);
    expect(events).toEqual(['loading:true', 'loading:false']);
  });
});
