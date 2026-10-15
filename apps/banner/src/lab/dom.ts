/** Ajudantes de DOM do laboratório (só desenvolvimento). */

export type Choice<T extends string> = { value: T; label: string; color?: string };

/** Cria um elemento com classe, texto e filhos. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

/** Cria uma seção `.panel` com título. */
export function panel(title: string, ...children: Node[]): HTMLElement {
  const section = h('section', 'panel');
  section.append(h('h2', '', title), ...children);
  return section;
}

/** Linha "rótulo + controles" dos painéis. */
export function row(label: string, ...children: Node[]): HTMLElement {
  return h('div', 'row', h('label', '', label), ...children);
}

/**
 * Grupo de botões de escolha (um marcado por vez). `current` é lido a cada clique, então o estado
 * pode morar fora do grupo. Devolve o `span` com os botões.
 */
export function choiceGroup<T extends string>(
  choices: Choice<T>[],
  current: () => T,
  onPick: (value: T) => void,
): HTMLElement {
  const host = h('span', 'chips');
  const render = (): void => {
    host.replaceChildren(
      ...choices.map(({ value, label, color }) => {
        const button = h('button', 'chip');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(current() === value));
        if (color) {
          const dot = h('span', 'dot');
          dot.style.background = color;
          button.append(dot);
        }
        button.append(label);
        button.onclick = () => {
          onPick(value);
          render();
        };
        return button;
      }),
    );
  };
  render();
  return host;
}

/** Seletor `<select>` com a opção "Nenhum". */
export function select(
  options: { id: string; name: string }[],
  current: string | null,
  onPick: (id: string | null) => void,
): HTMLSelectElement {
  const element = document.createElement('select');
  element.replaceChildren(
    new Option('Nenhum', ''),
    ...options.map((o) => new Option(o.name, o.id)),
  );
  element.value = current ?? '';
  element.onchange = () => {
    onPick(element.value === '' ? null : element.value);
  };
  return element;
}
