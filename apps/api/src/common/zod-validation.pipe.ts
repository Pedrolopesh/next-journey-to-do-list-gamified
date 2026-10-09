import { type PipeTransform } from '@nestjs/common';
import { ERROR_CODES } from '@nextjourney/contracts';
import type { z } from 'zod';

import { AppError } from './app-error.js';

/** Valida a entrada com o schema do contrato. O erro nunca devolve o valor recebido (senhas). */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Dados inválidos', {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
