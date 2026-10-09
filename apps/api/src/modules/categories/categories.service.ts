import { Inject, Injectable } from '@nestjs/common';
import {
  type Category,
  type CreateCategoryRequest,
  ERROR_CODES,
  MAX_CATEGORIES,
  type UpdateCategoryRequest,
} from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const toDto = (c: { id: string; name: string; color: string; position: number }): Category => ({
  id: c.id,
  name: c.name,
  color: c.color,
  position: c.position,
});

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
    return rows.map(toDto);
  }

  async create(userId: string, input: CreateCategoryRequest): Promise<Category> {
    const count = await this.prisma.category.count({ where: { userId, deletedAt: null } });
    if (count >= MAX_CATEGORIES) {
      throw new AppError(409, 'CATEGORY_LIMIT', `Limite de ${MAX_CATEGORIES} categorias`);
    }
    const created = await this.prisma.category.create({
      data: { userId, name: input.name, color: input.color, position: count },
    });
    return toDto(created);
  }

  async update(userId: string, id: string, input: UpdateCategoryRequest): Promise<Category> {
    const result = await this.prisma.category.updateMany({
      where: { id, userId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });
    if (result.count === 0)
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoria não encontrada');
    const row = await this.prisma.category.findUniqueOrThrow({ where: { id } });
    return toDto(row);
  }

  /** Excluir uma categoria com itens ativos exige a categoria de destino (`moveTo`). */
  async remove(userId: string, id: string, moveTo: string | undefined): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({ where: { id, userId, deletedAt: null } });
      if (!category) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoria não encontrada');

      const remaining = await tx.category.count({ where: { userId, deletedAt: null } });
      if (remaining <= 1) {
        throw new AppError(409, 'LAST_CATEGORY', 'É preciso manter pelo menos uma categoria');
      }

      const itemCount = await tx.item.count({ where: { categoryId: id, userId, deletedAt: null } });
      if (itemCount > 0) {
        if (!moveTo || moveTo === id) {
          throw new AppError(
            409,
            'CATEGORY_HAS_ITEMS',
            'Informe a categoria de destino dos itens (moveTo)',
          );
        }
        const target = await tx.category.findFirst({
          where: { id: moveTo, userId, deletedAt: null },
        });
        if (!target)
          throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoria de destino não encontrada');
        await tx.item.updateMany({
          where: { categoryId: id, userId },
          data: { categoryId: moveTo },
        });
      }
      await tx.category.update({ where: { id }, data: { deletedAt: new Date() } });
    });
  }
}
