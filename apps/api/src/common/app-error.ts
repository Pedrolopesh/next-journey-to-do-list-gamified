import { HttpException } from '@nestjs/common';

/** Business rule error with a stable code (the app picks the message by `code`). */
export class AppError extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super({ code, message }, status);
  }
}
