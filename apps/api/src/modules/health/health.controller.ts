import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorService } from '@nestjs/terminus';

import { Public } from '../../common/public.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(HealthIndicatorService) private readonly indicators: HealthIndicatorService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  /** State of the API and the database. Public and with no sensitive data. */
  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () => {
        const indicator = this.indicators.check('database');
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return indicator.up();
        } catch {
          return indicator.down();
        }
      },
    ]);
  }
}
