import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateItemRequest,
  ERROR_CODES,
  type Item as ItemDto,
  type ItemType,
} from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import type { Item } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  addDays,
  calcularStreak,
  diaDaSemana,
  diaLocal,
  estaAtrasado,
} from '../progression/domain/index.js';

/** Segunda-feira da semana de uma data local (a semana vai de segunda a domingo). */
function inicioDaSemana(date: string): string {
  const dow = diaDaSemana(date);
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

@Injectable()
export class ItemsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  /** Lista os itens do usuário já com o estado do dia (feito, atrasado, sequência, contadores). */
  async list(
    userId: string,
    type: ItemType | undefined,
    date: string | undefined,
  ): Promise<ItemDto[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const hoje = date ?? diaLocal(this.clock.now(), user.timezone);
    const semana = inicioDaSemana(hoje);

    const items = await this.prisma.item.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(type ? { type } : {}),
        // tarefa marcada sai da lista e vai para o histórico
        OR: [{ type: { not: 'todo' } }, { completedAt: null }],
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    if (items.length === 0) return [];

    const checks = await this.prisma.itemCheck.findMany({
      where: { userId, itemId: { in: items.map((item) => item.id) }, revertedAt: null },
      select: { itemId: true, checkedOn: true },
    });
    const daysByItem = new Map<string, string[]>();
    for (const check of checks) {
      const list = daysByItem.get(check.itemId) ?? [];
      list.push(check.checkedOn);
      daysByItem.set(check.itemId, list);
    }

    return items.map((item) => this.toDto(item, daysByItem.get(item.id) ?? [], hoje, semana));
  }

  async create(userId: string, input: CreateItemRequest): Promise<ItemDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    // O usuário só pode usar as próprias categorias (IDOR)
    const category = await this.prisma.category.findFirst({
      where: { id: input.categoryId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoria não encontrada');

    const hoje = diaLocal(this.clock.now(), user.timezone);
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          userId,
          categoryId: input.categoryId,
          type: input.type,
          title: input.title,
          notes: input.notes ?? null,
          difficulty: input.difficulty,
          scheduleDays: input.type === 'daily' ? input.scheduleDays : [],
          dueAt: input.type === 'todo' && input.dueAt ? new Date(input.dueAt) : null,
          createdOn: hoje,
        },
      });
      await tx.userStats.update({ where: { userId }, data: { itemsCreated: { increment: 1 } } });
      return created;
    });
    return this.toDto(item, [], hoje, inicioDaSemana(hoje));
  }

  private toDto(item: Item, checkedDays: string[], hoje: string, semana: string): ItemDto {
    const checksToday = checkedDays.filter((day) => day === hoje).length;
    const checksThisWeek = checkedDays.filter((day) => day >= semana && day <= hoje).length;
    const isDaily = item.type === 'daily';

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      notes: item.notes,
      categoryId: item.categoryId,
      difficulty: item.difficulty,
      scheduleDays: isDaily ? item.scheduleDays : null,
      dueAt: item.dueAt ? item.dueAt.toISOString() : null,
      doneToday: item.type === 'todo' ? false : checksToday > 0,
      overdue: isDaily
        ? estaAtrasado(
            {
              scheduleDays: item.scheduleDays,
              createdOn: item.createdOn,
              lastCheckedOn: item.lastCheckedOn,
            },
            hoje,
          )
        : false,
      streak: isDaily
        ? calcularStreak(
            {
              scheduleDays: item.scheduleDays,
              createdOn: item.createdOn,
              diasMarcados: checkedDays,
            },
            hoje,
          )
        : 0,
      checksToday,
      checksThisWeek,
    };
  }
}
