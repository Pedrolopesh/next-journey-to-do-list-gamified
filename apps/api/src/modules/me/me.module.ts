import { Module } from '@nestjs/common';

import { ProgressionModule } from '../progression/progression.module.js';
import { MeController } from './me.controller.js';

@Module({ imports: [ProgressionModule], controllers: [MeController] })
export class MeModule {}
