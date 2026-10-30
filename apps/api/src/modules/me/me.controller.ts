import { Body, Controller, Delete, Get, HttpCode, Inject, Patch, Post, Put } from '@nestjs/common';
import {
  type AppEvent,
  appEventSchema,
  type Character,
  characterSchema,
  type DataExport,
  type DeleteAccountRequest,
  deleteAccountRequestSchema,
  ERROR_CODES,
  type LpcLook,
  lpcLookSchema,
  type MeResponse,
  type PatchMeRequest,
  patchMeRequestSchema,
} from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { CurrentUserId } from '../../common/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AccountService } from '../account/account.service.js';
import { DataExportService } from '../account/data-export.service.js';
import { AchievementsService } from '../achievements/achievements.service.js';
import { expParaNivel } from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';
import { NO_STORY, toPlayerState } from '../progression/player-state.js';
import { StoriesService } from '../stories/stories.service.js';

/** Reads the saved look; old or invalid data becomes "no look" instead of breaking /me. */
function lookOf(value: unknown): { look?: LpcLook } {
  const parsed = lpcLookSchema.safeParse(value);
  return parsed.success ? { look: parsed.data } : {};
}

/** The look changed when skin, hair, clothes, accessory or detailed appearance differ. */
function visualChanged(
  before: { skin: string; hair: string; outfit: string; accessory: string | null; look: unknown },
  after: Character,
): boolean {
  return (
    before.skin !== after.skin ||
    before.hair !== after.hair ||
    before.outfit !== after.outfit ||
    (before.accessory ?? undefined) !== after.accessory ||
    JSON.stringify(before.look ?? null) !== JSON.stringify(after.look ?? null)
  );
}

@Controller('me')
export class MeController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
    @Inject(StoriesService) private readonly stories: StoriesService,
    @Inject(AccountService) private readonly account: AccountService,
    @Inject(DataExportService) private readonly dataExport: DataExportService,
    @Inject(AchievementsService) private readonly achievements: AchievementsService,
  ) {}

  /** Profile and game state of the authenticated user (no password hash or third-party data). */
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
        passwordHash: true,
        tutorialSeenAt: true,
        stats: true,
        character: true,
      },
    });
    if (!user?.stats) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const config = await this.gameConfig.load();
    const active = await this.stories.active(this.prisma, userId);
    const progress = active
      ? { chapter: active.progress.chapter, completed: active.progress.completed }
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
        hasPassword: user.passwordHash !== null,
      },
      player: {
        ...player,
        expForNextLevel: expParaNivel(player.level, config),
      },
      character: user.character
        ? {
            name: user.character.name,
            title: user.character.title as Character['title'],
            skin: user.character.skin,
            hair: user.character.hair,
            outfit: user.character.outfit,
            ...(user.character.accessory ? { accessory: user.character.accessory } : {}),
            ...lookOf(user.character.look),
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

  /** Profile time zone, tutorial seen and reminder time. */
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

  /** Exports the account's own data (LGPD, right of access): JSON with allowed fields only. */
  @Get('export')
  export(@CurrentUserId() userId: string): Promise<DataExport> {
    return this.dataExport.export(userId);
  }

  /** Deletes the account: anonymizes now and deletes for good after the retention period. */
  @Delete()
  @HttpCode(204)
  async deleteAccount(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(deleteAccountRequestSchema)) body: DeleteAccountRequest,
  ): Promise<void> {
    await this.account.requestDeletion(userId, body);
  }

  /**
   * Creates or edits the character. Changing the look of an existing character counts for
   * achievements.
   */
  @Put('character')
  async putCharacter(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(characterSchema)) body: Character,
  ): Promise<Character> {
    const { look, ...rest } = body;
    const data = {
      ...rest,
      accessory: body.accessory ?? null,
      look: look ?? Prisma.JsonNull,
    };
    const before = await this.prisma.character.findUnique({ where: { userId } });
    await this.prisma.character.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    if (before && visualChanged(before, body)) {
      await this.prisma.userStats.update({
        where: { userId },
        data: { lookChanges: { increment: 1 } },
      });
      await this.achievements.evaluateFor(userId);
    }
    return body;
  }

  /** A device fact the server does not observe (e.g. daily reminder turned on). */
  @Post('events')
  @HttpCode(204)
  async event(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(appEventSchema)) body: AppEvent,
  ): Promise<void> {
    await this.achievements.registerEvent(userId, body);
  }

  /** Cosmetics unlocked by achievements. */
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
