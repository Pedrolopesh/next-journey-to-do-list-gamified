import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { from, lastValueFrom, type Observable } from 'rxjs';

import { ENV, type Env } from '../config/env.js';
import { withMinDuration } from './min-duration.js';

/** Dá um tempo mínimo de resposta à rota (AUTH_MIN_RESPONSE_MS), igual para quem existe e quem não existe. */
@Injectable()
export class ConstantTimeInterceptor implements NestInterceptor {
  constructor(@Inject(ENV) private readonly env: Env) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return from(withMinDuration(this.env.AUTH_MIN_RESPONSE_MS, () => lastValueFrom(next.handle())));
  }
}

/** Marca a rota que responde igual para conta existente e inexistente (sem enumeração por tempo). */
export const ConstantTime = () => UseInterceptors(ConstantTimeInterceptor);
