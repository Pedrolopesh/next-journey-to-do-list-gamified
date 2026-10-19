// Regras de commit do projeto (AGENTS.md, "Não fazer"): Conventional Commits em minúscula, SEM corpo
// e SEM atribuição a ferramenta de IA ou co-autor.
// Só atribuição de verdade (trailer de co-autor, rodapé "Generated with", id de sessão), não a palavra solta:
// citar CLAUDE.md ou "copilot" como assunto de um commit é legítimo
const atribuicaoDeIa = /co-authored-by:|generated with|claude-session:|claude\.ai\/code\/session/i;

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
