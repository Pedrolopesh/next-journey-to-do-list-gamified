import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES, type LegalDocument, legalSlugSchema } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { ENV, type Env } from '../../config/env.js';
import { buildLegalDocuments } from './legal-documents.js';

@Injectable()
export class LegalService {
  private readonly documents: Record<'terms' | 'privacy', LegalDocument>;

  /** Public contact for data and support requests; only set through the environment. */
  readonly contactEmail: string | undefined;

  constructor(@Inject(ENV) env: Env) {
    this.contactEmail = env.LEGAL_CONTACT_EMAIL;
    this.documents = buildLegalDocuments({ contactEmail: env.LEGAL_CONTACT_EMAIL });
  }

  /** A legal text by slug; an unknown slug is a 404 (the list is closed). */
  get(slug: string): LegalDocument {
    const parsed = legalSlugSchema.safeParse(slug);
    if (!parsed.success) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Documento não encontrado');
    return this.documents[parsed.data];
  }
}
