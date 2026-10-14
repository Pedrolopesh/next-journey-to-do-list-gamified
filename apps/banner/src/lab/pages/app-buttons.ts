import './app-buttons.css';

import type { PixelArtName } from '../../../../mobile/src/components/pixel-art-data';
import { h } from '../dom';
import type { LabPage } from '../page';
import { pixelSvg } from '../pixel';

/** Botões do app hoje: [classe, rótulo da linha, texto, desabilitado]. */
const EXISTING: [string, string, string, boolean][] = [
  ['primary', 'Principal', 'Entrar', false],
  ['secondary', 'Secundário', 'Criar conta', false],
  ['ghost', 'Texto', 'Esqueci minha senha', false],
  ['danger', 'Perigo', 'Sair', false],
  ['primary off', 'Desabilitado', 'Salvar', true],
];

/** Botões de ação da Home: [pixel art, título, descrição]. */
const ACTIONS: [PixelArtName, string, string][] = [
  ['character', 'Mudar personagem', 'Troque o visual do seu herói'],
  ['story', 'Mudar história principal', 'Escolha por qual aventura seguir'],
  ['scenery', 'Mudar cenário do QG', 'Altere o fundo e a hora do dia'],
];

function actionButton([art, title, description]: (typeof ACTIONS)[number], off = false) {
  const button = h('button', `act${off ? ' is-off' : ''}`);
  button.type = 'button';
  button.disabled = off;
  button.innerHTML = `${pixelSvg(art)}<span class="tx"><span class="tt">${title}</span><span class="ds">${description}</span></span>`;
  return button;
}

function phone(...children: Node[]): HTMLElement {
  return h('div', 'app-phone', ...children);
}

export const appButtonsPage: LabPage = {
  id: 'botoes-app',
  label: 'Botões do aplicativo',
  mount(host) {
    const existing = phone(
      ...EXISTING.map(([cls, label, text, off]) => {
        const button = h('button', `rn ${cls}`, text);
        button.type = 'button';
        button.disabled = off;
        return h('div', 'app-row', h('small', '', label), button);
      }),
    );
    const proposal = h('section', 'style');
    const heading = h('h2', '', 'Botão de ação com pixel art ');
    heading.append(h('span', 'tag', 'no app'));
    proposal.append(
      heading,
      h('p', 'note', 'Contornado, com brilho suave: pixel art ao lado, título e descrição curta.'),
      phone(...ACTIONS.map((a) => actionButton(a))),
      h('p', 'note', 'Estado desabilitado (exemplo):'),
      phone(actionButton(ACTIONS[0] as (typeof ACTIONS)[number], true)),
    );
    host.append(
      h('h1', '', 'Botões do aplicativo'),
      h(
        'p',
        'lead',
        'Os botões que existem no app hoje (roxo cheio, contornado, texto e vermelho cheio) e os botões de ação da Home, com pixel art, título e descrição.',
      ),
      h('section', 'style', h('h2', '', 'Botões base do app'), existing),
      proposal,
    );
  },
};
