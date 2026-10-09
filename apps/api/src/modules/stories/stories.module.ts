import { Module } from '@nestjs/common';

import { ProgressionModule } from '../progression/progression.module.js';
import { StoriesController } from './stories.controller.js';
import { StoriesService } from './stories.service.js';

@Module({
  imports: [ProgressionModule],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
