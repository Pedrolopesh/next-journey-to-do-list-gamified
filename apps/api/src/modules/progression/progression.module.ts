import { Module } from '@nestjs/common';

import { GameConfigService } from './game-config.service.js';

@Module({ providers: [GameConfigService], exports: [GameConfigService] })
export class ProgressionModule {}
