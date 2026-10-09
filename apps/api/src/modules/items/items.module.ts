import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module.js';
import { ProgressionModule } from '../progression/progression.module.js';
import { StoriesModule } from '../stories/stories.module.js';
import { ChecksService } from './checks.service.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

@Module({
  imports: [ProgressionModule, StoriesModule, AchievementsModule],
  controllers: [ItemsController],
  providers: [ItemsService, ChecksService],
  exports: [ItemsService],
})
export class ItemsModule {}
