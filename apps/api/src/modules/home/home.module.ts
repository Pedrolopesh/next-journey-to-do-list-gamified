import { Module } from '@nestjs/common';

import { ItemsModule } from '../items/items.module.js';
import { ProgressionModule } from '../progression/progression.module.js';
import { StoriesModule } from '../stories/stories.module.js';
import { HomeController } from './home.controller.js';

@Module({ imports: [ItemsModule, ProgressionModule, StoriesModule], controllers: [HomeController] })
export class HomeModule {}
