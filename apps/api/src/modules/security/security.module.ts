import { Global, Module } from '@nestjs/common';

import { SecurityEvents } from './security-events.service.js';

@Global()
@Module({ providers: [SecurityEvents], exports: [SecurityEvents] })
export class SecurityModule {}
