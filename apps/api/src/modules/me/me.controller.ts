import { Controller, Get, Inject } from '@nestjs/common';
import { ERROR_CODES, type MeResponse } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { CurrentUserId } from '../../common/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { checksParaCapitulo, expParaNivel } from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';
import { toPlayerState } from '../progression/player-state.js';

@Controller('me')
export class MeController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
  ) {}

  /** Perfil e estado de jogo do usuário autenticado (sem hash de senha nem dados de terceiros). */
  @Get()
  async me(@CurrentUserId() userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, email: true, timezone: true, stats: true },
    });
    if (!user?.stats) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const config = await this.gameConfig.load();
    const player = toPlayerState(user.stats);
    return {
      user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
      player: {
        ...player,
        expForNextLevel: expParaNivel(player.level, config),
        requiredChecksInChapter: checksParaCapitulo(player.story.chapter, config),
      },
    };
  }
}
