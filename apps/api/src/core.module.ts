import { Global, Module } from '@nestjs/common';

import { Clock, SystemClock } from './common/clock.js';
import { ENV, loadEnv } from './config/env.js';

/** Dependências globais: ambiente validado e relógio. */
@Global()
@Module({
  providers: [
    { provide: ENV, useFactory: () => loadEnv() },
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [ENV, Clock],
})
export class CoreModule {}
