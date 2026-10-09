/** Créditos exibidos na tela "Créditos". Mantenha em sincronia com o CREDITS.md da raiz. */
export interface CreditEntry {
  asset: string;
  author: string;
  license: string;
  url?: string;
}

export const CREDITS: CreditEntry[] = [
  {
    asset: 'Camadas e personagem provisórios do banner',
    author: 'Projeto Next Journey',
    license: 'MIT',
  },
];
