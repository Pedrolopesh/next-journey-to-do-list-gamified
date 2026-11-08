/** A lab page: `mount` draws into `host` and may return the cleanup to run on exit. */
export type LabPage = {
  id: string;
  label: string;
  /** Menu section: pages with the same section become sub-items of a single item. */
  section?: string;
  mount: (host: HTMLElement) => void | (() => void) | Promise<void | (() => void)>;
};
