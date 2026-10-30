import { Controller, Delete, Get, HttpCode, Inject, Param } from '@nestjs/common';
import type { SessionsResponse } from '@nextjourney/contracts';
import { z } from 'zod';

import { CurrentSessionId, CurrentUserId } from '../../common/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { SessionsService } from './sessions.service.js';

@Controller('me/sessions')
export class SessionsController {
  constructor(@Inject(SessionsService) private readonly sessions: SessionsService) {}

  @Get()
  async list(
    @CurrentUserId() userId: string,
    @CurrentSessionId() sessionId: string | undefined,
  ): Promise<SessionsResponse> {
    return { sessions: await this.sessions.list(userId, sessionId) };
  }

  @Delete()
  @HttpCode(204)
  async revokeAll(@CurrentUserId() userId: string): Promise<void> {
    await this.sessions.revokeAll(userId);
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @CurrentUserId() userId: string,
    @Param('id', new ZodValidationPipe(z.uuid())) id: string,
  ): Promise<void> {
    await this.sessions.revoke(userId, id);
  }
}
