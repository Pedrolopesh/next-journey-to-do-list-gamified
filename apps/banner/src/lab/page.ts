/** Uma página do laboratório: `mount` desenha em `host` e pode devolver a limpeza ao sair. */
export type LabPage = {
  id: string;
  label: string;
  /** Seção do menu: páginas com a mesma seção ficam como sub-itens de um único item. */
  section?: string;
  mount: (host: HTMLElement) => void | (() => void) | Promise<void | (() => void)>;
};
