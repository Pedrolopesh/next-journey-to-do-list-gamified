import { Inject, Injectable, Logger } from '@nestjs/common';

import { ENV, type Env } from '../../config/env.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { diaLocal } from '../progression/domain/index.js';
import { STARTER_ITEMS } from './starter-items.js';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Starter items of a new account, created by the server in the transaction that makes it valid. */
@Injectable()
export class StarterItemsService {
  private readonly logger = new Logger(StarterItemsService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  /**
   * Creates the starter items, linked to the account's categories. They are marked `isExample`, so
   * `items_created` is untouched and no achievement is evaluated. Returns how many were created.
   */
  async seed(
    tx: Prisma.TransactionClient,
    input: { userId: string; timezone: string; now: Date },
  ): Promise<number> {
    if (!this.env.SEED_STARTER_ITEMS) return 0;
    // Only for an account with no items yet, so calling it again never duplicates
    if ((await tx.item.count({ where: { userId: input.userId } })) > 0) return 0;
    const categories = await tx.category.findMany({
      where: { userId: input.userId, deletedAt: null },
      orderBy: { position: 'asc' },
      select: { id: true, name: true },
    });
    const fallback = categories[0];
    if (!fallback) return 0;
    const createdOn = diaLocal(input.now, input.timezone);
    const { count } = await tx.item.createMany({
      data: STARTER_ITEMS.map((item, index) => ({
        userId: input.userId,
        categoryId:
          categories.find((category) => category.name === item.category)?.id ?? fallback.id,
        type: item.type,
        title: item.title,
        difficulty: item.difficulty,
        scheduleDays: item.type === 'daily' ? EVERY_DAY : [],
        createdOn,
        isExample: true,
        // One transaction means one database `now()`; the extra millisecond keeps the catalog order
        createdAt: new Date(input.now.getTime() + index),
      })),
    });
    this.logger.log(`itens de exemplo criados: ${count}`);
    return count;
  }
}
