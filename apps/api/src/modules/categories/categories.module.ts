import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [AchievementsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
