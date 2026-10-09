import { Body, Controller, Delete, Get, HttpCode, Inject, Patch, Put } from '@nestjs/common';
import {
  type Character,
  characterSchema,
  ERROR_CODES,
  type MeResponse,
  type PatchMeRequest,
  patchMeRequestSchema,
} from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { CurrentUserId } from '../../common/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AccountService } from '../account/account.service.js';
import {
  ACHIEVEMENT_CATALOG,
  checksParaCapitulo,
  expParaNivel,
} from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';
import { NO_STORY, toPlayerState } from '../progression/player-state.js';
import { StoriesService } from '../stories/stories.service.js';

/** Chaves de cosmético que só existem como recompensa de conquista. */
const REWARD_KEYS: ReadonlySet<string> = new Set(
  ACHIEVEMENT_CATALOG.flatMap((achievement) =>
    achievement.rewardKey ? [achievement.rewardKey] : [],
  ),
);

@Controller('me')
export class MeController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
    @Inject(StoriesService) private readonly stories: StoriesService,
    @Inject(AccountService) private readonly account: AccountService,
  ) {}

  /** Perfil e estado de jogo do usuário autenticado (sem hash de senha nem dados de terceiros). */
  @Get()
  async me(@CurrentUserId() userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        notifyAt: true,
        tutorialSeenAt: true,
        stats: true,
        character: true,
      },
    });
    if (!user?.stats) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const config = await this.gameConfig.load();
    const active = await this.stories.active(this.prisma, userId);
    const progress = active
      ? {
          chapter: active.progress.chapter,
          checksInChapter: active.progress.checksInChapter,
          completed: active.progress.completed,
        }
      : NO_STORY;
    const player = toPlayerState(user.stats, progress);

    let chapterTitle = '';
    if (active) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { storyId_number: { storyId: active.story.id, number: progress.chapter } },
        select: { title: true },
      });
      chapterTitle = chapter?.title ?? '';
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        notifyAt: user.notifyAt,
      },
      player: {
        ...player,
        expForNextLevel: expParaNivel(player.level, config),
        requiredChecksInChapter: checksParaCapitulo(progress.chapter, config),
      },
      character: user.character
        ? {
            name: user.character.name,
            title: user.character.title as Character['title'],
            skin: user.character.skin,
            hair: user.character.hair,
            outfit: user.character.outfit,
            ...(user.character.accessory ? { accessory: user.character.accessory } : {}),
          }
        : null,
      story: active
        ? {
            slug: active.story.slug,
            name: active.story.name,
            themeColor: active.story.themeColor,
            chapterTitle,
          }
        : null,
      onboarding: {
        tutorialSeen: user.tutorialSeenAt !== null,
        hasCharacter: user.character !== null,
        hasStory: active !== null,
      },
    };
  }

  /** Fuso do perfil, tutorial visto e horário do lembrete. */
  @Patch()
  async patch(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(patchMeRequestSchema)) body: PatchMeRequest,
  ): Promise<MeResponse> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        ...(body.notifyAt !== undefined ? { notifyAt: body.notifyAt } : {}),
        ...(body.tutorialSeen ? { tutorialSeenAt: new Date() } : {}),
      },
    });
    return this.me(userId);
  }

  /** Exclui a conta: anonimiza agora e apaga de vez depois do prazo de retenção. */
  @Delete()
  @HttpCode(204)
  async deleteAccount(@CurrentUserId() userId: string): Promise<void> {
    await this.account.requestDeletion(userId);
  }

  /** Cria ou edita o personagem. Cosméticos de conquista só podem ser usados se liberados. */
  @Put('character')
  async putCharacter(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(characterSchema)) body: Character,
  ): Promise<Character> {
    const used = [body.skin, body.hair, body.outfit, body.accessory].filter(
      (key): key is string => key !== undefined && REWARD_KEYS.has(key),
    );
    if (used.length > 0) {
      const owned = await this.prisma.userCosmetic.findMany({
        where: { userId, cosmeticKey: { in: used } },
        select: { cosmeticKey: true },
      });
      const ownedKeys = new Set(owned.map((cosmetic) => cosmetic.cosmeticKey));
      if (used.some((key) => !ownedKeys.has(key))) {
        throw new AppError(403, 'COSMETIC_LOCKED', 'Este item ainda não foi desbloqueado');
      }
    }
    await this.prisma.character.upsert({
      where: { userId },
      create: { userId, ...body, accessory: body.accessory ?? null },
      update: { ...body, accessory: body.accessory ?? null },
    });
    return body;
  }

  /** Cosméticos liberados por conquistas. */
  @Get('cosmetics')
  async cosmetics(@CurrentUserId() userId: string): Promise<{ cosmetics: string[] }> {
    const rows = await this.prisma.userCosmetic.findMany({
      where: { userId },
      select: { cosmeticKey: true },
      orderBy: { unlockedAt: 'asc' },
    });
    return { cosmetics: rows.map((row) => row.cosmeticKey) };
  }
}
