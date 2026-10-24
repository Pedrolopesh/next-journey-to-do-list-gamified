import { Module } from '@nestjs/common';

import { AccountService } from '../account/account.service.js';
import { AchievementsModule } from '../achievements/achievements.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProgressionModule } from '../progression/progression.module.js';
import { StoriesModule } from '../stories/stories.module.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [AuthModule, ProgressionModule, StoriesModule, AchievementsModule],
  controllers: [MeController],
  providers: [AccountService],
})
export class MeModule {}
