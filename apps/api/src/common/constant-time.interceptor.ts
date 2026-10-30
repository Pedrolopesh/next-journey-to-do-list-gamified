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

/**
 * Gives the route a minimum response time (AUTH_MIN_RESPONSE_MS), the same whether the account
 * exists or not.
 */
@Injectable()
export class ConstantTimeInterceptor implements NestInterceptor {
  constructor(@Inject(ENV) private readonly env: Env) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return from(withMinDuration(this.env.AUTH_MIN_RESPONSE_MS, () => lastValueFrom(next.handle())));
  }
}

/**
 * Marks a route that answers the same for an existing and a missing account (no enumeration by
 * timing).
 */
export const ConstantTime = () => UseInterceptors(ConstantTimeInterceptor);
