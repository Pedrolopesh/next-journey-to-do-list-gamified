import './indicators.css';

import type { PixelArtName } from '../../../../mobile/src/components/pixel-art-data';
import { h } from '../dom';
import type { LabPage } from '../page';
import { pixelSvg } from '../pixel';

const STATS: [PixelArtName, number, string, string][] = [
  ['dailies', 100, 'Diários pendentes', ''],
  ['tasks', 5, 'Tarefas abertas', ''],
  ['streak', 2, 'Maior sequência', 'flame'],
  ['coin', 199, 'Moedas', 'amber'],
];
const CHAPTERS = 5;

function statCard([art, value, label, tone]: (typeof STATS)[number]): HTMLElement {
  const card = h('div', `stat ${tone}`.trim());
  card.innerHTML = `<div class="info">${pixelSvg(art)}<span class="lb">${label}</span></div><span class="num">${value}</span>`;
  return card;
}

/** Card de história, o mesmo da Home e das abas (`StoryProgressCard`). */
function storyCard(chapter = 1, expInLevel = 145, expForNext = 350): HTMLElement {
  const ratio = Math.round((expInLevel / expForNext) * 100);
  const card = h('div', 'story');
  const segments = Array.from({ length: CHAPTERS }, (_, i) => {
    const fill = i + 1 < chapter ? 100 : i + 1 === chapter ? ratio : 0;
    return `<div class="seg"><i style="width:${fill}%"></i></div>`;
  }).join('');
  card.innerHTML = `
    <div class="top">
      ${pixelSvg('scenery')}
      <div><div class="name">Castelo</div><div class="chap">Capítulo ${chapter}: O portão do castelo</div></div>
      <span class="lvl">Nível 5</span>
    </div>
    <div class="segs">${segments}</div>
    <div class="foot"><span>Capítulo <b>${chapter}</b> de ${CHAPTERS}</span><span><b>${expInLevel}</b>/${expForNext} EXP</span></div>`;
  return card;
}

export const indicatorsPage: LabPage = {
  id: 'indicadores',
  label: 'Indicadores',
  mount(host) {
    host.append(
      h('h1', '', 'Indicadores da Home'),
      h(
        'p',
        'lead',
        'Os números da tela inicial (ícone com a descrição embaixo e o número ao lado) e o card de avanço da história.',
      ),
      h(
        'section',
        'style',
        h('h2', '', 'Indicadores com pixel art'),
        h('div', 'app-phone', h('div', 'stats', ...STATS.map(statCard)), storyCard()),
        h(
          'p',
          'note',
          'A barra da história tem 5 trechos, um por capítulo: o do capítulo atual enche conforme a EXP do nível. Nas abas o mesmo card mostra também o saldo de moedas.',
        ),
      ),
    );
  },
};
