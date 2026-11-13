import { Module } from '@nestjs/common';

import {
  LegalDocumentsController,
  LegalPageController,
  SupportPageController,
} from './legal.controller.js';
import { LegalService } from './legal.service.js';

@Module({
  controllers: [LegalDocumentsController, LegalPageController, SupportPageController],
  providers: [LegalService],
})
export class LegalModule {}
