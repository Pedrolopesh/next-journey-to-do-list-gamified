import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@nextjourney/contracts';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { AppError } from '../../common/app-error.js';
import { ENV, type Env } from '../../config/env.js';

export type SocialProvider = 'google' | 'apple';

export type VerifiedIdentity = {
  /** Stable user id at the provider (the `sub` claim). */
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  /** When the provider issued the token (`iat` claim, in seconds). Absent means unknown. */
  issuedAt?: number;
};

/** Validates the provider's ID token ON THE SERVER. Swappable in tests (no network). */
export abstract class IdTokenVerifier {
  abstract verify(provider: SocialProvider, idToken: string): Promise<VerifiedIdentity>;
}

const APPLE_ISSUER = 'https://appleid.apple.com';

@Injectable()
export class RemoteIdTokenVerifier extends IdTokenVerifier {
  private readonly google = new OAuth2Client();
  private readonly appleKeys = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

  constructor(@Inject(ENV) private readonly env: Env) {
    super();
  }

  async verify(provider: SocialProvider, idToken: string): Promise<VerifiedIdentity> {
    try {
      return provider === 'google'
        ? await this.verifyGoogle(idToken)
        : await this.verifyApple(idToken);
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Invalid, expired or wrong-audience token: never say why.
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Login social inválido');
    }
  }

  private async verifyGoogle(idToken: string): Promise<VerifiedIdentity> {
    const audience = this.env.GOOGLE_CLIENT_IDS.split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (audience.length === 0) {
      throw new AppError(503, 'SOCIAL_LOGIN_UNAVAILABLE', 'Login com Google indisponível');
    }
    const ticket = await this.google.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error('sem sub');
    return {
      subject: payload.sub,
      email: payload.email ?? null,
      emailVerified: payload.email_verified === true,
      name: payload.name ?? null,
      ...(payload.iat === undefined ? {} : { issuedAt: payload.iat }),
    };
  }

  private async verifyApple(idToken: string): Promise<VerifiedIdentity> {
    const audience = this.env.APPLE_CLIENT_ID;
    if (!audience)
      throw new AppError(503, 'SOCIAL_LOGIN_UNAVAILABLE', 'Login com Apple indisponível');
    const { payload } = await jwtVerify(idToken, this.appleKeys, {
      issuer: APPLE_ISSUER,
      audience,
    });
    if (!payload.sub) throw new Error('sem sub');
    return {
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      name: null,
      ...(typeof payload.iat === 'number' ? { issuedAt: payload.iat } : {}),
    };
  }
}
