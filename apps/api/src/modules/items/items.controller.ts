import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  type CheckRequest,
  checkRequestSchema,
  type CheckResult,
  type CreateItemRequest,
  createItemRequestSchema,
  type Item,
  itemTypeSchema,
  localDateSchema,
} from '@nextjourney/contracts';
import { z } from 'zod';

import { CurrentUserId } from '../../common/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { ChecksService } from './checks.service.js';
import { ItemsService } from './items.service.js';

const listQuerySchema = z.object({
  type: itemTypeSchema.optional(),
  date: localDateSchema.optional(),
});

@Controller('items')
export class ItemsController {
  constructor(
    @Inject(ItemsService) private readonly items: ItemsService,
    @Inject(ChecksService) private readonly checks: ChecksService,
  ) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(listQuerySchema)) query: z.infer<typeof listQuerySchema>,
  ): Promise<Item[]> {
    return this.items.list(userId, query.type, query.date);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createItemRequestSchema)) body: CreateItemRequest,
  ): Promise<Item> {
    return this.items.create(userId, body);
  }

  @Post(':id/checks')
  @HttpCode(200)
  check(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) itemId: string,
    @Body(new ZodValidationPipe(checkRequestSchema)) body: CheckRequest,
  ): Promise<CheckResult> {
    return this.checks.check(userId, itemId, body.checkId);
  }

  @Delete(':id/checks/:checkId')
  undo(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) itemId: string,
    @Param('checkId', new ParseUUIDPipe()) checkId: string,
  ): Promise<CheckResult> {
    return this.checks.undo(userId, itemId, checkId);
  }
}
