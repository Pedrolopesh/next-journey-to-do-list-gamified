// Tokens de cor do design system (tema escuro). Fonte: docs/FIGMA-INTERA.md, coleção `Color`.
export const colors = {
  bg: {
    base: '#1a1a2e',
    surface: '#16213e',
    raised: '#0f3460',
    sunken: '#12122a',
  },
  brand: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    gold: '#f59e0b',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#94a3b8',
    onPrimary: '#ffffff',
  },
  border: {
    subtle: '#1e293b',
    strong: '#334155',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
} as const;
