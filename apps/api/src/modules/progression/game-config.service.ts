import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_GAME_CONFIG, type GameConfig, gameConfigSchema } from '@nextjourney/contracts';

import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const CONFIG_KEY = 'game';

/**
 * Reads game_config from the database (adjustable without publishing the app); with no row, uses
 * the initial value.
 */
@Injectable()
export class GameConfigService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async load(tx?: Prisma.TransactionClient): Promise<GameConfig> {
    const client = tx ?? this.prisma;
    const row = await client.gameConfig.findUnique({ where: { key: CONFIG_KEY } });
    if (!row) return DEFAULT_GAME_CONFIG;
    return gameConfigSchema.parse(row.value);
  }
}
