import { HttpException } from '@nestjs/common';

/** Erro de regra de negócio com código estável (o app decide a mensagem pelo `code`). */
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
