import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import {
  type AuthResponse,
  type ForgotPasswordRequest,
  forgotPasswordRequestSchema,
  type LoginRequest,
  loginRequestSchema,
  type RefreshRequest,
  refreshRequestSchema,
  type RegisterRequest,
  registerRequestSchema,
  type ResetPasswordRequest,
  resetPasswordRequestSchema,
  type SocialLoginRequest,
  socialLoginRequestSchema,
} from '@nextjourney/contracts';

import { Public } from '../../common/public.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
  ): Promise<AuthResponse> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
  ): Promise<AuthResponse> {
    return this.auth.login(body);
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

  /** Sempre 202, exista ou não o e-mail. */
  @Public()
  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordRequestSchema)) body: ForgotPasswordRequest,
  ): Promise<void> {
    await this.auth.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(204)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordRequestSchema)) body: ResetPasswordRequest,
  ): Promise<void> {
    await this.auth.resetPassword(body.token, body.newPassword);
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  google(
    @Body(new ZodValidationPipe(socialLoginRequestSchema)) body: SocialLoginRequest,
  ): Promise<AuthResponse> {
    return this.auth.socialLogin('google', body);
  }

  @Public()
  @Post('apple')
  @HttpCode(200)
  apple(
    @Body(new ZodValidationPipe(socialLoginRequestSchema)) body: SocialLoginRequest,
  ): Promise<AuthResponse> {
    return this.auth.socialLogin('apple', body);
  }
}
