import { Module } from '@nestjs/common';

import { AccountService } from '../account/account.service.js';
import { ProgressionModule } from '../progression/progression.module.js';
import { StoriesModule } from '../stories/stories.module.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [ProgressionModule, StoriesModule],
  controllers: [MeController],
  providers: [AccountService],
})
export class MeModule {}
