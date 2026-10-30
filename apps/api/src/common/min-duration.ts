/**
 * Guarantees the operation takes at least `ms`, so timing does not reveal whether an account
 * exists. Rules: docs/api/autenticacao-e-sessoes.md.
 */
export async function withMinDuration<T>(ms: number, operation: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const wait = async (): Promise<void> => {
    const remaining = ms - (performance.now() - start);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  };
  try {
    return await operation();
  } finally {
    await wait();
  }
}
