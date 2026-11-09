import { Body, Controller, Headers, HttpCode, Inject, Ip, Post } from '@nestjs/common';
import {
  type AuthResponse,
  type EmailConfirmRequest,
  emailConfirmRequestSchema,
  type EmailStartRequest,
  emailStartRequestSchema,
  type RefreshRequest,
  refreshRequestSchema,
  type SocialLoginRequest,
  socialLoginRequestSchema,
} from '@nextjourney/contracts';

import { ConstantTime } from '../../common/constant-time.interceptor.js';
import { Public } from '../../common/public.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  /** Passwordless entry: always 202 and no session; the code goes to the email. */
  @Public()
  @ConstantTime()
  @Post('email/start')
  @HttpCode(202)
  async emailStart(
    @Body(new ZodValidationPipe(emailStartRequestSchema)) body: EmailStartRequest,
    @Ip() ip: string,
  ): Promise<void> {
    await this.auth.emailStart(body, ip);
  }

  @Public()
  @Post('email/confirm')
  @HttpCode(200)
  emailConfirm(
    @Body(new ZodValidationPipe(emailConfirmRequestSchema)) body: EmailConfirmRequest,
    @Ip() ip: string,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<AuthResponse> {
    return this.auth.emailConfirm(body, ip, deviceName);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body(new ZodValidationPipe(refreshRequestSchema)) body: RefreshRequest,
  ): Promise<AuthResponse> {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Body(new ZodValidationPipe(refreshRequestSchema)) body: RefreshRequest,
  ): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  google(
    @Body(new ZodValidationPipe(socialLoginRequestSchema)) body: SocialLoginRequest,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<AuthResponse> {
    return this.auth.socialLogin('google', body, deviceName);
  }

  @Public()
  @Post('apple')
  @HttpCode(200)
  apple(
    @Body(new ZodValidationPipe(socialLoginRequestSchema)) body: SocialLoginRequest,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<AuthResponse> {
    return this.auth.socialLogin('apple', body, deviceName);
  }
}
