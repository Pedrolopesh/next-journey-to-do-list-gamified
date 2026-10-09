import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  type Category,
  type CreateCategoryRequest,
  createCategoryRequestSchema,
  deleteCategoryQuerySchema,
  type UpdateCategoryRequest,
  updateCategoryRequestSchema,
} from '@nextjourney/contracts';
import type { z } from 'zod';

import { CurrentUserId } from '../../common/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categories: CategoriesService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<Category[]> {
    return this.categories.list(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createCategoryRequestSchema)) body: CreateCategoryRequest,
  ): Promise<Category> {
    return this.categories.create(userId, body);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateCategoryRequestSchema)) body: UpdateCategoryRequest,
  ): Promise<Category> {
    return this.categories.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query(new ZodValidationPipe(deleteCategoryQuerySchema))
    query: z.infer<typeof deleteCategoryQuerySchema>,
  ): Promise<void> {
    await this.categories.remove(userId, id, query.moveTo);
  }
}
