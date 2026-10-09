import { describe, expect, it } from 'vitest';

import {
  backoffMs,
  enqueue,
  flushQueue,
  isRetryableStatus,
  type QueuedCheck,
  removeByCheckId,
} from './check-queue';

const entry = (checkId: string): QueuedCheck => ({
  itemId: `item-${checkId}`,
  type: 'habit',
  checkId,
  queuedAt: 0,
});
const statusOf = (error: unknown) => (error as { status?: number }).status;

describe('fila offline de checks', () => {
  it('não duplica o mesmo checkId e remove por checkId', () => {
    const queue = enqueue(enqueue([], entry('a')), entry('a'));
    expect(queue).toHaveLength(1);
    expect(removeByCheckId(enqueue(queue, entry('b')), 'a').map((q) => q.checkId)).toEqual(['b']);
  });

  it('classifica o que vale repetir', () => {
    expect(isRetryableStatus(undefined)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(409)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it('backoff dobra até o teto de 60 s', () => {
    expect([0, 1, 2, 3].map(backoffMs)).toEqual([1000, 2000, 4000, 8000]);
    expect(backoffMs(20)).toBe(60_000);
  });

  it('envia tudo em ordem quando há rede', async () => {
    const order: string[] = [];
    const result = await flushQueue(
      [entry('a'), entry('b')],
      (e) => {
        order.push(e.checkId);
        return Promise.resolve();
      },
      statusOf,
    );
    expect(order).toEqual(['a', 'b']);
    expect(result.remaining).toEqual([]);
    expect(result.sent).toHaveLength(2);
  });

  it('para no primeiro erro de rede e mantém a ordem do restante', async () => {
    const result = await flushQueue(
      [entry('a'), entry('b'), entry('c')],
      (e) => (e.checkId === 'b' ? Promise.reject({}) : Promise.resolve()),
      statusOf,
    );
    expect(result.sent.map((q) => q.checkId)).toEqual(['a']);
    expect(result.remaining.map((q) => q.checkId)).toEqual(['b', 'c']);
  });

  it('descarta o item que o servidor rejeitou de vez e continua', async () => {
    const result = await flushQueue(
      [entry('a'), entry('b')],
      (e) => (e.checkId === 'a' ? Promise.reject({ status: 409 }) : Promise.resolve()),
      statusOf,
    );
    expect(result.dropped.map((q) => q.checkId)).toEqual(['a']);
    expect(result.sent.map((q) => q.checkId)).toEqual(['b']);
    expect(result.remaining).toEqual([]);
  });
});
