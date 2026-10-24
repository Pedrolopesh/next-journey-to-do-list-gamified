/**
 * Garante que a operação leve PELO MENOS `ms` para responder, com sucesso ou erro. Usado nas rotas de
 * conta que respondem igual para e-mail existente e inexistente: o trabalho a mais de um caso
 * (gravar no banco, enviar e-mail) some dentro desse piso e o tempo não revela se a conta existe.
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
