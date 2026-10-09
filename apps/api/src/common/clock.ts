/** Relógio injetável: o domínio recebe o instante como argumento, nunca lê o relógio. */
export abstract class Clock {
  abstract now(): Date;
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
