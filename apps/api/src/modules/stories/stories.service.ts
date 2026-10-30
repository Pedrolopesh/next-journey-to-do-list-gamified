import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES, type StorySummary, type Timeline } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import type { Prisma, Story, StoryProgress } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { expParaNivel } from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';

export type ActiveStory = { story: Story; progress: StoryProgress };

@Injectable()
export class StoriesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
  ) {}

  async active(tx: Prisma.TransactionClient, userId: string): Promise<ActiveStory | null> {
    const progress = await tx.storyProgress.findFirst({
      where: { userId, isActive: true },
      include: { story: true },
    });
    if (!progress) return null;
    const { story, ...rest } = progress;
    return { story, progress: rest };
  }

  /** Catalog (RF-12) with what the user finished in each story. */
  async list(userId: string): Promise<StorySummary[]> {
    const [stories, progress, completions] = await Promise.all([
      this.prisma.story.findMany({
        orderBy: { position: 'asc' },
        include: { _count: { select: { chapters: true } } },
      }),
      this.prisma.storyProgress.findMany({ where: { userId } }),
      this.prisma.chapterCompletion.findMany({
        where: { userId },
        select: { chapter: { select: { storyId: true } } },
      }),
    ]);
    const completedByStory = new Map<string, number>();
    for (const completion of completions) {
      const id = completion.chapter.storyId;
      completedByStory.set(id, (completedByStory.get(id) ?? 0) + 1);
    }
    return stories.map((story) => ({
      slug: story.slug,
      name: story.name,
      themeColor: story.themeColor,
      description: story.description,
      chapterCount: story._count.chapters,
      currentChapter: progress.find((entry) => entry.storyId === story.id)?.chapter ?? 1,
      chaptersCompleted: completedByStory.get(story.id) ?? 0,
      isActive: progress.some((entry) => entry.storyId === story.id && entry.isActive),
    }));
  }

  /** Picks or switches the active story. The progress of each story stays saved (RF-30). */
  async activate(userId: string, slug: string): Promise<StorySummary> {
    const story = await this.prisma.story.findUnique({ where: { slug } });
    if (!story) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'História não encontrada');

    await this.prisma.$transaction(async (tx) => {
      await tx.storyProgress.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await tx.storyProgress.upsert({
        where: { userId_storyId: { userId, storyId: story.id } },
        create: { userId, storyId: story.id, isActive: true },
        update: { isActive: true },
      });
    });

    const summary = (await this.list(userId)).find((entry) => entry.slug === slug);
    if (!summary) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'História não encontrada');
    return summary;
  }

  /**
   * My story (RF-29). Without `slug`, the active story; with `slug`, any story in the catalog. The
   * text only shows in the finished chapters; the progress (EXP of the level) only in the current
   * chapter of the active story.
   */
  async timeline(userId: string, slug?: string): Promise<Timeline> {
    const active = await this.active(this.prisma, userId);
    const story = slug
      ? await this.prisma.story.findUnique({ where: { slug } })
      : (active?.story ?? null);
    if (!story) {
      throw new AppError(
        404,
        ERROR_CODES.NOT_FOUND,
        slug ? 'História não encontrada' : 'Nenhuma história escolhida',
      );
    }
    const isActive = active?.story.id === story.id;
    const progress = await this.prisma.storyProgress.findUnique({
      where: { userId_storyId: { userId, storyId: story.id } },
    });
    const [chapters, stats, config, summaries] = await Promise.all([
      this.prisma.chapter.findMany({ where: { storyId: story.id }, orderBy: { number: 'asc' } }),
      this.prisma.userStats.findUniqueOrThrow({ where: { userId } }),
      this.gameConfig.load(),
      this.list(userId),
    ]);
    const summary = summaries.find((entry) => entry.slug === story.slug);
    if (!summary) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'História não encontrada');
    const currentNumber = progress?.chapter ?? 1;

    return {
      story: summary,
      chapters: chapters.map((chapter) => {
        const completed = (progress?.completed ?? false) || chapter.number < currentNumber;
        const current = !completed && chapter.number === currentNumber;
        const showProgress = current && isActive;
        return {
          number: chapter.number,
          title: chapter.title,
          state: completed
            ? ('completed' as const)
            : current
              ? ('current' as const)
              : ('locked' as const),
          expInLevel: showProgress ? stats.expInLevel : null,
          expForNextLevel: showProgress ? expParaNivel(stats.level, config) : null,
          text: completed ? chapter.text : null,
        };
      }),
    };
  }
}
