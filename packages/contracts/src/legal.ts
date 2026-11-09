import { z } from 'zod';

/**
 * Version of the Terms of Use and the Privacy Policy. It is the `termsVersion` the app sends on
 * sign-in, so the version saved on an account is always the one of the texts the API serves.
 * Bump it (and the `updatedAt` of the changed document) whenever a text changes.
 */
export const LEGAL_VERSION = '2026-11-08';

export const LEGAL_SLUGS = ['terms', 'privacy'] as const;
export const legalSlugSchema = z.enum(LEGAL_SLUGS);
export type LegalSlug = z.infer<typeof legalSlugSchema>;

export const legalSectionSchema = z.object({
  heading: z.string().min(1),
  paragraphs: z.array(z.string().min(1)),
  bullets: z.array(z.string().min(1)),
});
export type LegalSection = z.infer<typeof legalSectionSchema>;

/** GET /legal/documents/:slug: a legal text as plain structured text, rendered by the app. */
export const legalDocumentSchema = z.object({
  slug: legalSlugSchema,
  version: z.string().min(1),
  title: z.string().min(1),
  /** Date of the last change of the text (YYYY-MM-DD). */
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sections: z.array(legalSectionSchema).min(1),
});
export type LegalDocument = z.infer<typeof legalDocumentSchema>;
