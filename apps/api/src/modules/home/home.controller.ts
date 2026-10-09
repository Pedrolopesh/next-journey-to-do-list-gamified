import { Controller, Get, Inject } from '@nestjs/common';
import type { HomeResponse, Item } from '@nextjourney/contracts';

import { Clock } from '../../common/clock.js';
import { CurrentUserId } from '../../common/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ItemsService } from '../items/items.service.js';
import { checksParaCapitulo, diaLocal } from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';
import { StoriesService } from '../stories/stories.service.js';

@Controller('home')
export class HomeController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ItemsService) private readonly items: ItemsService,
    @Inject(StoriesService) private readonly stories: StoriesService,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
  ) {}

  /** Um endpoint agregado para a Home não fazer 5 chamadas (RF-35). */
  @Get()
  async home(@CurrentUserId() userId: string): Promise<HomeResponse> {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    const now = this.clock.now();
    const hoje = diaLocal(now, user.timezone);

    const [dailies, todos, active, config] = await Promise.all([
      this.items.list(userId, 'daily', undefined),
      this.items.list(userId, 'todo', undefined),
      this.stories.active(this.prisma, userId),
      this.gameConfig.load(),
    ]);

    const pendingDailies = dailies.filter((item) => !item.doneToday);
    // Tarefa "para hoje": com prazo até o fim do dia local de hoje (inclui as atrasadas)
    const dueToday = todos.filter(
      (item): item is Item & { dueAt: string } =>
        item.dueAt !== null && diaLocal(item.dueAt, user.timezone) <= hoje,
    );

    let story: HomeResponse['story'] = null;
    if (active) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { storyId_number: { storyId: active.story.id, number: active.progress.chapter } },
        select: { title: true },
      });
      story = {
        slug: active.story.slug,
        name: active.story.name,
        chapter: active.progress.chapter,
        chapterTitle: chapter?.title ?? '',
        checksInChapter: active.progress.checksInChapter,
        requiredChecks: checksParaCapitulo(active.progress.chapter, config),
        completed: active.progress.completed,
      };
    }

    return {
      counters: {
        pendingDailies: pendingDailies.length,
        pendingTasks: todos.length,
        bestStreak: Math.max(0, ...dailies.map((item) => item.streak)),
      },
      story,
      today: [...pendingDailies, ...dueToday],
    };
  }
}
