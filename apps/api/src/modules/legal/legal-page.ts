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

const PAGE_STYLE =
  '<style>body{font-family:system-ui,sans-serif;line-height:1.55;max-width:44rem;margin:0 auto;padding:1.5rem 1rem;color:#1a1a2e}h1{font-size:1.6rem}h2{font-size:1.15rem;margin-top:1.8rem}.meta{color:#555;font-size:.9rem}</style>';

/**
 * The public support page (the support URL the app stores ask for). The contact comes from the
 * environment; without it the page still explains where to find help, with no address.
 */
export function renderSupportPage(contactEmail: string | undefined): string {
  const contact = contactEmail
    ? `<p>Fale com a gente pelo e-mail <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a>. Conte o que aconteceu e, se puder, a versão do app e o aparelho que você usa.</p>`
    : '<p>Em breve este canal terá um e-mail de contato.</p>';
  return [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Suporte · Next Journey</title>',
    PAGE_STYLE,
    '</head>',
    '<body>',
    '<h1>Suporte</h1>',
    '<section><h2>Precisa de ajuda?</h2>',
    contact,
    '</section>',
    '<section><h2>Sua conta e seus dados</h2>',
    '<p>Você pode excluir a sua conta e os seus dados a qualquer momento pelo próprio app. Os detalhes estão na <a href="/legal/privacy">Política de Privacidade</a> e nos <a href="/legal/terms">Termos de Uso</a>.</p>',
    '</section>',
    '</body>',
    '</html>',
  ].join('');
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
    PAGE_STYLE,
    '</head>',
    '<body>',
    `<h1>${title}</h1>`,
    `<p class="meta">Versão ${escapeHtml(document.version)} · atualizado em ${escapeHtml(document.updatedAt)}</p>`,
    sections,
    '</body>',
    '</html>',
  ].join('');
}
