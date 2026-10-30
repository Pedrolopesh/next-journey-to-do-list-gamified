import { Body, Controller, Headers, HttpCode, Inject, Ip, Post } from '@nestjs/common';
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
  type RegisterResponse,
  type ResendVerificationRequest,
  resendVerificationRequestSchema,
  type ResetPasswordRequest,
  resetPasswordRequestSchema,
  type SocialLoginRequest,
  socialLoginRequestSchema,
  type VerifyEmailRequest,
  verifyEmailRequestSchema,
} from '@nextjourney/contracts';

import { ConstantTime } from '../../common/constant-time.interceptor.js';
import { Public } from '../../common/public.decorator.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  /** Always 202 and no session: the person confirms the email with the code before signing in. */
  @Public()
  @ConstantTime()
  @Post('register')
  @HttpCode(202)
  register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
    @Ip() ip: string,
  ): Promise<RegisterResponse> {
    return this.auth.register(body, ip);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailRequestSchema)) body: VerifyEmailRequest,
    @Ip() ip: string,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<AuthResponse> {
    return this.auth.verifyEmail(body, ip, deviceName);
  }

  /** Always 202, whether or not the account exists. */
  @Public()
  @ConstantTime()
  @Post('resend-verification')
  @HttpCode(202)
  async resendVerification(
    @Body(new ZodValidationPipe(resendVerificationRequestSchema)) body: ResendVerificationRequest,
    @Ip() ip: string,
  ): Promise<void> {
    await this.auth.resendVerification(body.email, ip);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Ip() ip: string,
    @Headers('x-device-name') deviceName?: string,
  ): Promise<AuthResponse> {
    return this.auth.login(body, ip, deviceName);
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

  /** Always 202, whether or not the email exists. */
  @Public()
  @ConstantTime()
  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordRequestSchema)) body: ForgotPasswordRequest,
    @Ip() ip: string,
  ): Promise<void> {
    await this.auth.forgotPassword(body.email, ip);
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
