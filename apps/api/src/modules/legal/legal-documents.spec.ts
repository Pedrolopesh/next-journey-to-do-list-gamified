import { LEGAL_SLUGS, LEGAL_VERSION, legalDocumentSchema } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { buildLegalDocuments } from './legal-documents.js';
import { escapeHtml, renderLegalPage } from './legal-page.js';

describe('legal documents', () => {
  const documents = buildLegalDocuments();

  it('has exactly the documents of the contract, and each one respects it', () => {
    expect(Object.keys(documents).sort()).toEqual([...LEGAL_SLUGS].sort());
    for (const slug of LEGAL_SLUGS) {
      const parsed = legalDocumentSchema.safeParse(documents[slug]);
      expect(parsed.success, slug).toBe(true);
      expect(documents[slug].slug).toBe(slug);
      expect(documents[slug].version).toBe(LEGAL_VERSION);
    }
  });

  it('names the controller and never leaves a placeholder or an infrastructure detail', () => {
    for (const slug of LEGAL_SLUGS) {
      const text = JSON.stringify(documents[slug]);
      expect(text, slug).toContain('WE TECH HUB TECHNOLOGIES LTDA');
      expect(text, slug).not.toMatch(/lorem|\[definir\]|\{\{|undefined/i);
      expect(text, slug).not.toMatch(/\b(\d{1,3}\.){3}\d{1,3}\b/);
    }
  });

  it('the privacy policy points to the app paths that exercise the rights', () => {
    const text = JSON.stringify(documents.privacy);
    expect(text).toContain('Exportar meus dados');
    expect(text).toContain('Excluir conta');
    expect(text).toContain('Aparelhos conectados');
  });

  it('the contact section only exists when the contact email is set', () => {
    for (const slug of LEGAL_SLUGS) {
      const headings = documents[slug].sections.map((section) => section.heading);
      expect(
        headings.some((heading) => heading.includes('Contato')),
        slug,
      ).toBe(false);
      expect(JSON.stringify(documents[slug])).not.toContain('@');
    }
    const withContact = buildLegalDocuments({ contactEmail: 'privacidade@example.com' });
    for (const slug of LEGAL_SLUGS) {
      const last = withContact[slug].sections.at(-1);
      expect(last?.heading, slug).toContain('Contato');
      expect(last?.paragraphs.join(' '), slug).toContain('privacidade@example.com');
      expect(legalDocumentSchema.safeParse(withContact[slug]).success).toBe(true);
    }
  });
});

describe('legal page', () => {
  it('escapes every special character of a text', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    );
  });

  it('renders the title, the sections and the bullets, with no script', () => {
    const html = renderLegalPage({
      slug: 'terms',
      version: '2026-11-08',
      title: 'Termos <b>',
      updatedAt: '2026-11-08',
      sections: [{ heading: '1. A & B', paragraphs: ['Texto <i>'], bullets: ['Item "um"'] }],
    });
    expect(html).toContain('<h1>Termos &lt;b&gt;</h1>');
    expect(html).toContain('<h2>1. A &amp; B</h2>');
    expect(html).toContain('<p>Texto &lt;i&gt;</p>');
    expect(html).toContain('<li>Item &quot;um&quot;</li>');
    expect(html).not.toMatch(/<script|<link|<img|src=/i);
  });
});
