import type { LegalDocument } from '@nextjourney/contracts';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for an HTML body or attribute. Every text of a document goes through here. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/**
 * The public page of a legal text: plain HTML with a small inline style, no script and no external
 * resource, so it can be the public URL the app stores ask for.
 */
export function renderLegalPage(document: LegalDocument): string {
  const sections = document.sections
    .map((section) => {
      const paragraphs = section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
      const bullets =
        section.bullets.length > 0
          ? `<ul>${section.bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>`
          : '';
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`;
    })
    .join('');
  const title = escapeHtml(document.title);
  return [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title} · Next Journey</title>`,
    '<style>body{font-family:system-ui,sans-serif;line-height:1.55;max-width:44rem;margin:0 auto;padding:1.5rem 1rem;color:#1a1a2e}h1{font-size:1.6rem}h2{font-size:1.15rem;margin-top:1.8rem}.meta{color:#555;font-size:.9rem}</style>',
    '</head>',
    '<body>',
    `<h1>${title}</h1>`,
    `<p class="meta">Versão ${escapeHtml(document.version)} · atualizado em ${escapeHtml(document.updatedAt)}</p>`,
    sections,
    '</body>',
    '</html>',
  ].join('');
}
