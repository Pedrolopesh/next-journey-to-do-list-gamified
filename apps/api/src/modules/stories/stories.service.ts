import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES, type StorySummary, type Timeline } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import type { Prisma, Story, StoryProgress } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { checksParaCapitulo } from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';

export type ActiveStory = { story: Story; progress: StoryProgress };

@Injectable()
export class StoriesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
  ) {}

  /** História ativa do usuário com o progresso dela (ou nulo se ainda não escolheu). */
  async active(tx: Prisma.TransactionClient, userId: string): Promise<ActiveStory | null> {
    const progress = await tx.storyProgress.findFirst({
      where: { userId, isActive: true },
      include: { story: true },
    });
    if (!progress) return null;
    const { story, ...rest } = progress;
    return { story, progress: rest };
  }

  /** Catálogo (RF-12) já com o que o usuário concluiu em cada história. */
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
      chaptersCompleted: completedByStory.get(story.id) ?? 0,
      isActive: progress.some((entry) => entry.storyId === story.id && entry.isActive),
    }));
  }

  /** Escolhe ou troca a história ativa. O progresso de cada história fica salvo (RF-30). */
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

  /** Minha história (RF-29). O texto só aparece nos capítulos já concluídos. */
  async timeline(userId: string): Promise<Timeline> {
    const active = await this.active(this.prisma, userId);
    if (!active) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Nenhuma história escolhida');
    const config = await this.gameConfig.load();
    const chapters = await this.prisma.chapter.findMany({
      where: { storyId: active.story.id },
      orderBy: { number: 'asc' },
    });
    const summary = (await this.list(userId)).find((entry) => entry.slug === active.story.slug);
    if (!summary) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'História não encontrada');

    return {
      story: summary,
      chapters: chapters.map((chapter) => {
        const completed = active.progress.completed || chapter.number < active.progress.chapter;
        const current = !active.progress.completed && chapter.number === active.progress.chapter;
        return {
          number: chapter.number,
          title: chapter.title,
          state: completed
            ? ('completed' as const)
            : current
              ? ('current' as const)
              : ('locked' as const),
          requiredChecks: checksParaCapitulo(chapter.number, config),
          checksInChapter: current ? active.progress.checksInChapter : null,
          text: completed ? chapter.text : null,
        };
      }),
    };
  }
}
