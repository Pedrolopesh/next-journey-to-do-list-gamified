import { defineConfig } from 'vitest/config';

// Só lógica pura em Node (cliente HTTP, regras de tela). Componentes entram com jest-expo (Fase 5).
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
