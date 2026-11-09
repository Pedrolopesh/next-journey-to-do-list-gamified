import { describe, expect, it } from 'vitest';

import { LEGAL_SLUGS, LEGAL_VERSION, legalDocumentSchema, legalSlugSchema } from './legal';

describe('legal documents contract', () => {
  it('the version is a date', () => {
    expect(LEGAL_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('knows exactly the terms and the privacy policy', () => {
    expect([...LEGAL_SLUGS]).toEqual(['terms', 'privacy']);
    expect(legalSlugSchema.safeParse('cookies').success).toBe(false);
  });

  it('accepts a document with sections and rejects an empty or malformed one', () => {
    const valid = {
      slug: 'terms',
      version: LEGAL_VERSION,
      title: 'Termos',
      updatedAt: '2026-11-08',
      sections: [{ heading: '1. Objeto', paragraphs: ['Texto.'], bullets: [] }],
    };
    expect(legalDocumentSchema.safeParse(valid).success).toBe(true);
    expect(legalDocumentSchema.safeParse({ ...valid, sections: [] }).success).toBe(false);
    expect(legalDocumentSchema.safeParse({ ...valid, updatedAt: '08/11/2026' }).success).toBe(
      false,
    );
    expect(
      legalDocumentSchema.safeParse({
        ...valid,
        sections: [{ heading: '', paragraphs: [], bullets: [] }],
      }).success,
    ).toBe(false);
  });
});
