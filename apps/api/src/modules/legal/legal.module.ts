import { Module } from '@nestjs/common';

import { LegalDocumentsController, LegalPageController } from './legal.controller.js';
import { LegalService } from './legal.service.js';

@Module({
  controllers: [LegalDocumentsController, LegalPageController],
  providers: [LegalService],
})
export class LegalModule {}
