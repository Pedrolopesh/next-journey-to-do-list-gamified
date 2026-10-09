import { Module } from '@nestjs/common';

import { ProgressionModule } from '../progression/progression.module.js';
import { ChecksService } from './checks.service.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

@Module({
  imports: [ProgressionModule],
  controllers: [ItemsController],
  providers: [ItemsService, ChecksService],
})
export class ItemsModule {}
