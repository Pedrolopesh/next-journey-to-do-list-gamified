import { Controller, Get, Header, Inject, Param } from '@nestjs/common';
import type { LegalDocument } from '@nextjourney/contracts';

import { Public } from '../../common/public.decorator.js';
import { LegalService } from './legal.service.js';
import { renderLegalPage, renderSupportPage } from './legal-page.js';

/** The legal texts as structured text, for the app to render (`/v1/legal/documents/:slug`). */
@Public()
@Controller('legal/documents')
export class LegalDocumentsController {
  constructor(@Inject(LegalService) private readonly legal: LegalService) {}

  @Get(':slug')
  get(@Param('slug') slug: string): LegalDocument {
    return this.legal.get(slug);
  }
}

/**
 * The same texts as a public HTML page (`/legal/:slug`, outside `/v1` so the URL stays stable). It is
 * the public URL of the privacy policy that the app stores ask for.
 */
@Public()
@Controller('legal')
export class LegalPageController {
  constructor(@Inject(LegalService) private readonly legal: LegalService) {}

  @Get(':slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(@Param('slug') slug: string): string {
    return renderLegalPage(this.legal.get(slug));
  }
}

/** The public support page (`/support`, outside `/v1`): the support URL the app stores ask for. */
@Public()
@Controller('support')
export class SupportPageController {
  constructor(@Inject(LegalService) private readonly legal: LegalService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(): string {
    return renderSupportPage(this.legal.contactEmail);
  }
}
