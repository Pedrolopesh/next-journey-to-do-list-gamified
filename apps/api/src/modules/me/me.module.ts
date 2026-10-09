import { Module } from '@nestjs/common';

import { ProgressionModule } from '../progression/progression.module.js';
import { StoriesModule } from '../stories/stories.module.js';
import { MeController } from './me.controller.js';

@Module({ imports: [ProgressionModule, StoriesModule], controllers: [MeController] })
export class MeModule {}
