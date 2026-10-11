import lpcCredits from './lpc-credits.json';

/** Créditos exibidos na tela "Créditos". Mantenha em sincronia com o CREDITS.md da raiz. */
export interface CreditEntry {
  asset: string;
  author: string;
  license: string;
  url?: string;
}

/** Só licenças que permitem uso comercial com crédito (sem CC-BY-SA nem GPL). */
export const ALLOWED_LICENSES = ['MIT', 'CC0', 'OGA-BY 3.0', 'CC-BY 3.0'] as const;

export const CREDITS: CreditEntry[] = [
  {
    asset: 'Camadas e personagem provisórios do banner',
    author: 'Projeto Next Journey',
    license: 'MIT',
  },
  {
    asset: 'Cenários, personagem e ambientes do QG: trono, cerca, helicóptero e demais props',
    author: 'Projeto Next Journey',
    license: 'MIT',
  },
  // Arte LPC de terceiros (gerada por apps/banner/scripts/export-credits.mjs)
  ...lpcCredits.map((credit): CreditEntry => ({
    asset: credit.asset,
    author: credit.author,
    license: credit.license,
    ...(credit.url ? { url: credit.url } : {}),
  })),
];
