import { Controller, Get, Inject } from '@nestjs/common';
import type { HomeResponse, Item } from '@nextjourney/contracts';

import { Clock } from '../../common/clock.js';
import { CurrentUserId } from '../../common/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ItemsService } from '../items/items.service.js';
import { diaLocal, expParaNivel } from '../progression/domain/index.js';
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

  /** One aggregated endpoint so the Home does not make 5 calls (RF-35). */
  @Get()
  async home(@CurrentUserId() userId: string): Promise<HomeResponse> {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    const now = this.clock.now();
    const hoje = diaLocal(now, user.timezone);

    const [dailies, todos, active, config, stats] = await Promise.all([
      this.items.list(userId, 'daily', undefined),
      this.items.list(userId, 'todo', undefined),
      this.stories.active(this.prisma, userId),
      this.gameConfig.load(),
      this.prisma.userStats.findUniqueOrThrow({ where: { userId } }),
    ]);

    const pendingDailies = dailies.filter((item) => !item.doneToday);
    // To-do "for today": due by the end of today's local day (includes the overdue ones).
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
        expInLevel: stats.expInLevel,
        expForNextLevel: expParaNivel(stats.level, config),
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
