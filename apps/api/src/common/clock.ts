/** Injectable clock: the domain receives the instant as an argument and never reads the clock. */
export abstract class Clock {
  abstract now(): Date;
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
