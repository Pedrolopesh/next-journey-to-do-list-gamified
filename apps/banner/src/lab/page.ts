/** Uma página do laboratório: `mount` desenha em `host` e pode devolver a limpeza ao sair. */
export type LabPage = {
  id: string;
  label: string;
  mount: (host: HTMLElement) => void | (() => void) | Promise<void | (() => void)>;
};
