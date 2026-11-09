import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES, type LegalDocument, legalSlugSchema } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { ENV, type Env } from '../../config/env.js';
import { buildLegalDocuments } from './legal-documents.js';

@Injectable()
export class LegalService {
  private readonly documents: Record<'terms' | 'privacy', LegalDocument>;

  constructor(@Inject(ENV) env: Env) {
    this.documents = buildLegalDocuments({ contactEmail: env.LEGAL_CONTACT_EMAIL });
  }

  /** A legal text by slug; an unknown slug is a 404 (the list is closed). */
  get(slug: string): LegalDocument {
    const parsed = legalSlugSchema.safeParse(slug);
    if (!parsed.success) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Documento não encontrado');
    return this.documents[parsed.data];
  }
}
