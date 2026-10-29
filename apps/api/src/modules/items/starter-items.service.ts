import { Inject, Injectable, Logger } from '@nestjs/common';

import { ENV, type Env } from '../../config/env.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { diaLocal } from '../progression/domain/index.js';
import { STARTER_ITEMS } from './starter-items.js';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Itens de exemplo de uma conta nova: criados pelo servidor, na transação que a faz valer. */
@Injectable()
export class StarterItemsService {
  private readonly logger = new Logger(StarterItemsService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  /**
   * Cria os exemplos da conta, ligados às categorias dela. Exemplo não conta como item criado pelo
   * usuário (`isExample`, sem mexer em `items_created`) e não avalia conquistas. Devolve quantos criou.
   */
  async seed(
    tx: Prisma.TransactionClient,
    input: { userId: string; timezone: string; now: Date },
  ): Promise<number> {
    if (!this.env.SEED_STARTER_ITEMS) return 0;
    // Só a conta que ainda não tem itens: chamar de novo (ou para quem já usa o app) não duplica
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
        // Mesma transação, mesmo `now()` do banco: o milissegundo a mais mantém a ordem do catálogo
        createdAt: new Date(input.now.getTime() + index),
      })),
    });
    this.logger.log(`itens de exemplo criados: ${count}`);
    return count;
  }
}
