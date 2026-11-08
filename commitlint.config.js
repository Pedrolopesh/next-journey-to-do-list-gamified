// Commit rules of the project (CONTRIBUTING.md, "Do not"): lowercase Conventional Commits, NO body
// and NO attribution to an AI tool or co-author.
// Only real attribution (co-author trailer, "Generated with" footer, session id), not the bare word:
// mentioning CLAUDE.md or "copilot" as a commit subject is legitimate
const aiAttribution = /co-authored-by:|generated with|claude-session:|claude\.ai\/code\/session/i;

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-ai-attribution': ({ raw }) => [
          !aiAttribution.test(raw ?? ''),
          'the commit must not mention an AI tool or a co-author',
        ],
      },
    },
  ],
  rules: {
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
    'header-max-length': [2, 'always', 100],
    'no-ai-attribution': [2, 'always'],
  },
};
