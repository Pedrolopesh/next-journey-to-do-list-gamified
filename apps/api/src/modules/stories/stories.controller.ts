import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import {
  type PutStoryRequest,
  putStoryRequestSchema,
  type StorySummary,
  type Timeline,
} from '@nextjourney/contracts';

import { CurrentUserId } from '../../common/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { StoriesService } from './stories.service.js';

@Controller()
export class StoriesController {
  constructor(@Inject(StoriesService) private readonly stories: StoriesService) {}

  @Get('stories')
  list(@CurrentUserId() userId: string): Promise<StorySummary[]> {
    return this.stories.list(userId);
  }

  @Put('me/story')
  choose(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(putStoryRequestSchema)) body: PutStoryRequest,
  ): Promise<StorySummary> {
    return this.stories.activate(userId, body.slug);
  }

  @Get('me/story/timeline')
  timeline(@CurrentUserId() userId: string): Promise<Timeline> {
    return this.stories.timeline(userId);
  }
}
