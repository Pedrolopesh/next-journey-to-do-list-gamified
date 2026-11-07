import type { ItemType } from '@nextjourney/contracts';

/** A check made without network, waiting to be sent. The `checkId` makes the resend idempotent on the server. */
export type QueuedCheck = { itemId: string; type: ItemType; checkId: string; queuedAt: number };

export type FlushResult = {
  /** What stays in the queue (includes the item that failed and everything after it, to keep the order). */
  remaining: QueuedCheck[];
  sent: QueuedCheck[];
  /** Rejected for good by the server (e.g. already checked): the server decides, the queue discards. */
  dropped: QueuedCheck[];
};

/** Network down, timeout, rate limit or server error: worth trying again. Other 4xx, no. */
export function isRetryableStatus(status: number | undefined): boolean {
  if (status === undefined) return true; // no response = no network
  return status === 408 || status === 429 || status >= 500;
}

/** Wait before the next attempt: 1 s, 2 s, 4 s ... up to 60 s. */
export function backoffMs(attempt: number): number {
  return Math.min(60_000, 1000 * 2 ** Math.max(0, attempt));
}

export function enqueue(queue: QueuedCheck[], entry: QueuedCheck): QueuedCheck[] {
  // O mesmo checkId nunca entra duas vezes
  return queue.some((queued) => queued.checkId === entry.checkId) ? queue : [...queue, entry];
}

export function removeByCheckId(queue: QueuedCheck[], checkId: string): QueuedCheck[] {
  return queue.filter((queued) => queued.checkId !== checkId);
}

/**
 * Sends in order. Stops at the first error worth retrying (order matters: EXP and chapters
 * depend on the sequence); definitive errors discard only that item and carry on.
 */
export async function flushQueue(
  queue: QueuedCheck[],
  send: (entry: QueuedCheck) => Promise<void>,
  statusOf: (error: unknown) => number | undefined,
): Promise<FlushResult> {
  const sent: QueuedCheck[] = [];
  const dropped: QueuedCheck[] = [];
  for (const [index, entry] of queue.entries()) {
    try {
      await send(entry);
      sent.push(entry);
    } catch (error) {
      if (isRetryableStatus(statusOf(error))) {
        return { remaining: queue.slice(index), sent, dropped };
      }
      dropped.push(entry);
    }
  }
  return { remaining: [], sent, dropped };
}
