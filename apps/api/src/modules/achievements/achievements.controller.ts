import { Controller, Get, Inject } from '@nestjs/common';
import type { Achievement } from '@nextjourney/contracts';

import { Clock } from '../../common/clock.js';
import { CurrentUserId } from '../../common/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { diaLocal } from '../progression/domain/index.js';
import { AchievementsService } from './achievements.service.js';

@Controller('achievements')
export class AchievementsController {
  constructor(
    @Inject(AchievementsService) private readonly achievements: AchievementsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  @Get()
  async list(@CurrentUserId() userId: string): Promise<Achievement[]> {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    const now = this.clock.now();
    return this.achievements.list(userId, user.timezone, now, diaLocal(now, user.timezone));
  }
}
