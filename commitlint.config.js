// Regras de commit do projeto (AGENTS.md, "Não fazer"): Conventional Commits em minúscula, SEM corpo
// e SEM atribuição a ferramenta de IA ou co-autor.
const atribuicaoDeIa = /co-authored-by|generated with|claude|anthropic|chatgpt|copilot/i;

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'sem-atribuicao-de-ia': ({ raw }) => [
          !atribuicaoDeIa.test(raw ?? ''),
          'o commit não pode citar ferramenta de IA nem co-autor',
        ],
      },
    },
  ],
  rules: {
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
    'header-max-length': [2, 'always', 100],
    'sem-atribuicao-de-ia': [2, 'always'],
  },
};
