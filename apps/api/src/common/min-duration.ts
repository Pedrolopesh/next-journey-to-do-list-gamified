/**
 * Guarantees the operation takes AT LEAST `ms` to answer, on success or error. Used on the account
 * routes that answer the same for an existing and a missing email: the extra work of one case
 * (writing to the database, sending email) disappears inside that floor and the timing does not
 * reveal whether the account exists.
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
