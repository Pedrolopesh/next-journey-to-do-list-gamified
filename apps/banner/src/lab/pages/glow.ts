import './glow.css';

import { type Choice, choiceGroup, h } from '../dom';
import type { LabPage } from '../page';

const THEMES: Choice<string>[] = [
  { value: 'roxo', label: 'Roxo', color: '#7c3aed' },
  { value: 'azul', label: 'Azul', color: '#3b82f6' },
  { value: 'ciano', label: 'Ciano', color: '#22d3ee' },
  { value: 'verde', label: 'Verde', color: '#10b981' },
  { value: 'ambar', label: 'Âmbar', color: '#f59e0b' },
  { value: 'rosa', label: 'Rosa', color: '#ec4899' },
];
const STYLES: [string, string, string][] = [
  [
    'v-soft',
    '1. Brilho suave',
    'Gradiente com halo difuso. O mais discreto e o mais próximo do app atual.',
  ],
  [
    'v-soft-outline',
    '2. Brilho suave contornado',
    'O mesmo halo suave, só com a borda e um leve preenchimento. Para ações secundárias.',
  ],
  ['v-neon', '3. Neon', 'Contorno aceso e interior transparente, com luz mais forte.'],
  ['v-breathe', '4. Respirando', 'O halo pulsa devagar, chamando a atenção para a ação principal.'],
  ['v-orbit', '5. Órbita', 'Uma luz corre pela borda. Para destaque (ex.: "Começar história").'],
  ['v-sheen', '6. Varredura', 'Um brilho diagonal cruza o botão ao tocar.'],
  ['v-glass', '7. Vidro', 'Translúcido, com a luz seguindo o ponto de toque.'],
];
const STATES: [string, string][] = [
  ['', 'Normal'],
  ['is-hover', 'Hover / toque'],
  ['is-pressed', 'Pressionado'],
  ['is-focus', 'Foco'],
  ['is-loading', 'Carregando'],
  ['is-done', 'Sucesso'],
  ['is-disabled', 'Desabilitado'],
];
const LABELS: Record<string, string> = { 'is-done': 'Salvo', 'is-loading': 'Salvando' };

/** Rótulo com o espaço do girador/✓ (o span só aparece em carregando e sucesso). */
function setLabel(button: HTMLElement, state: string, text: string): void {
  const spinner = h('span', 'sp');
  spinner.setAttribute('aria-hidden', 'true');
  if (state === 'is-done') spinner.textContent = '✓';
  button.replaceChildren(spinner, LABELS[state] ?? text);
}

function sample(style: string, state: string, text: string, pill: boolean): HTMLButtonElement {
  const button = h('button', `gb ${style} ${state}`.trim());
  button.type = 'button';
  setLabel(button, state, text);
  if (state === 'is-disabled') button.disabled = true;
  if (pill) button.classList.add('is-pill');
  return button;
}

/** Botão vivo: toque -> carregando -> sucesso -> volta (a regra de feedback do app). */
function liveDemo(button: HTMLButtonElement): void {
  button.onclick = () => {
    button.classList.add('is-loading');
    setLabel(button, 'is-loading', '');
    setTimeout(() => {
      button.classList.replace('is-loading', 'is-done');
      setLabel(button, 'is-done', '');
      setTimeout(() => {
        button.classList.remove('is-done');
        setLabel(button, '', 'Salvar personagem');
      }, 1400);
    }, 1300);
  };
}

export const glowPage: LabPage = {
  id: 'botoes',
  label: 'Botões',
  mount(host) {
    const body = document.body;
    let pill = false;
    const styles = h('div');

    const toolbar = h(
      'div',
      'toolbar',
      h(
        'div',
        '',
        h('label', '', 'Cor'),
        choiceGroup(
          THEMES,
          () => body.dataset.theme ?? 'roxo',
          (v) => (body.dataset.theme = v),
        ),
      ),
      h(
        'div',
        '',
        h('label', '', 'Tamanho'),
        choiceGroup(
          [
            { value: 'm', label: 'Médio (48)' },
            { value: 'g', label: 'Grande (56)' },
          ],
          () => body.dataset.size ?? 'm',
          (v) => (body.dataset.size = v),
        ),
      ),
      h(
        'div',
        '',
        h('label', '', 'Formato'),
        choiceGroup(
          [
            { value: 'arredondado', label: 'Arredondado' },
            { value: 'pilula', label: 'Pílula' },
          ],
          () => (pill ? 'pilula' : 'arredondado'),
          (v) => {
            pill = v === 'pilula';
            styles.querySelectorAll('.gb').forEach((el) => el.classList.toggle('is-pill', pill));
          },
        ),
      ),
    );

    for (const [style, title, description] of STYLES) {
      const section = h('section', 'style', h('h2', '', title), h('p', 'note', description));
      const demo = sample(style, '', 'Salvar personagem', pill);
      liveDemo(demo);
      section.append(
        h('div', 'live', demo, h('small', 'hint', 'toque no botão: carrega, confirma e volta')),
      );
      const grid = h('div', 'states');
      for (const [state, label] of STATES) {
        grid.append(
          h('div', 'cell', h('small', '', label), sample(style, state, 'Continuar', pill)),
        );
      }
      section.append(grid);
      styles.append(section);
    }

    // Vidro: a luz segue o ponteiro
    const follow = (event: PointerEvent): void => {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('.v-glass') : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      target.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };
    document.addEventListener('pointermove', follow);

    host.append(
      h('h1', '', 'Botões com efeito de luz'),
      h(
        'p',
        'lead',
        'Sete formatos para escolher o estilo. Cada um mostra os estados que o app precisa: normal, hover (toque), pressionado, foco, carregando, sucesso e desabilitado. O botão da primeira coluna é interativo.',
      ),
      toolbar,
      styles,
      h(
        'p',
        'note',
        'No app (React Native) o halo difuso vira sombra colorida no iOS e uma camada com gradiente no Android (a sombra do Android não tem cor). Por isso este laboratório serve para escolher o formato; o efeito exato sai do que o aparelho suportar.',
      ),
    );

    return () => {
      document.removeEventListener('pointermove', follow);
      delete body.dataset.theme;
      delete body.dataset.size;
    };
  },
};
