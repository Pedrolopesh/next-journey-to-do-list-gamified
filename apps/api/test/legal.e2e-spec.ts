import { LEGAL_SLUGS, LEGAL_VERSION, legalDocumentSchema } from '@nextjourney/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestContext } from './helpers.js';

describe('legal documents', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('serves each document as structured text with no session', async () => {
    for (const slug of LEGAL_SLUGS) {
      const res = await ctx.http().get(`/v1/legal/documents/${slug}`).expect(200);
      const parsed = legalDocumentSchema.safeParse(res.body);
      expect(parsed.success, slug).toBe(true);
      expect(res.body.slug).toBe(slug);
      expect(res.body.version).toBe(LEGAL_VERSION);
    }
  });

  it('an unknown document is a 404 in the standard error format', async () => {
    const res = await ctx.http().get('/v1/legal/documents/cookies').expect(404);
    expect(res.body).toMatchObject({ code: 'NOT_FOUND' });
    expect(res.body.requestId).toBeTruthy();
  });

  it('serves the public HTML page outside /v1, with the title and without any script', async () => {
    const res = await ctx.http().get('/legal/privacy').expect(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<h1>Política de Privacidade</h1>');
    expect(res.text).toContain('WE TECH HUB TECHNOLOGIES LTDA');
    expect(res.text).not.toMatch(/<script/i);
    await ctx.http().get('/legal/terms').expect(200);
    await ctx.http().get('/legal/cookies').expect(404);
  });

  it('keeps the JSON under /v1 only and the page out of it', async () => {
    await ctx.http().get('/v1/legal/privacy').expect(404);
    await ctx.http().get('/legal/documents/privacy').expect(404);
  });
});
