/** Testes de componente (jest-expo + Testing Library). A lógica pura roda no Vitest (`*.test.ts`). */
module.exports = {
  preset: 'jest-expo',
  // O primeiro teste de cada arquivo compila o React Native: em runner de CI isso passa de 5 s
  testTimeout: 30000,
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
