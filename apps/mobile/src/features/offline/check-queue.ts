import type { ItemType } from '@nextjourney/contracts';

/** Um check feito sem rede, à espera de envio. O `checkId` torna o reenvio idempotente no servidor. */
export type QueuedCheck = { itemId: string; type: ItemType; checkId: string; queuedAt: number };

export type FlushResult = {
  /** O que continua na fila (inclui o item que falhou e todos depois dele, para manter a ordem). */
  remaining: QueuedCheck[];
  sent: QueuedCheck[];
  /** Rejeitados de vez pelo servidor (ex.: já marcado): o servidor decide, a fila descarta. */
  dropped: QueuedCheck[];
};

/** Rede fora, timeout, limite de taxa ou erro do servidor: vale tentar de novo. Outros 4xx, não. */
export function isRetryableStatus(status: number | undefined): boolean {
  if (status === undefined) return true; // sem resposta = sem rede
  return status === 408 || status === 429 || status >= 500;
}

/** Espera antes da próxima tentativa: 1 s, 2 s, 4 s ... até 60 s. */
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
 * Envia em ordem. Para no primeiro erro que vale repetir (a ordem importa: EXP e capítulos
 * dependem da sequência); erros definitivos descartam só aquele item e seguem.
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
