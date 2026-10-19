import './achievements-v2-ritmo.css';

import { h, panel } from '../dom';
import { AGORA, ANTES } from './achievements-v2-rules';
import { type Persona, PERSONAS, type SimReport, simulate } from './achievements-v2-sim';

function table(head: string[], rows: (string | HTMLElement)[][]): HTMLTableElement {
  const t = h('table', 'pace-table');
  t.append(
    h('thead', '', h('tr', '', ...head.map((c) => h('th', '', c)))),
    h('tbody', '', ...rows.map((r) => h('tr', '', ...r.map((c) => h('td', '', c))))),
  );
  return t;
}

/** Lista só as ações em que algo foi liberado; rajadas (2 ou mais de uma vez) ficam em vermelho. */
function unlockLog(report: SimReport): HTMLElement {
  const box = h('div', 'pace-days');
  const hits = report.actions.filter((a) => a.unlocked.length > 0);
  if (hits.length === 0) box.append(h('p', 'hint', 'Nada liberado neste período.'));
  for (const a of hits) {
    box.append(
      h(
        'div',
        `hit${a.unlocked.length > 1 ? ' multi' : ''}`,
        h('small', '', `Dia ${a.day} · ${a.label}: `),
        a.unlocked.map((u) => u.name).join(', '),
      ),
    );
  }
  return box;
}

/** Quanto menor, melhor: o lado melhor fica verde e o pior, vermelho. */
function compare(label: string, antes: number, agora: number, lowerIsBetter = true) {
  const better = lowerIsBetter ? agora < antes : agora > antes;
  const worse = lowerIsBetter ? antes > agora : false;
  return [
    label,
    h('span', worse ? 'bad' : '', String(antes)),
    h('span', better ? 'good' : '', String(agora)),
  ];
}

const PRINCIPLES: [string, string][] = [
  [
    'Um modal por ação.',
    'Se uma ação libera várias conquistas, aparece uma e as outras ficam pendentes, uma por vez nas ações seguintes. Todas já contam e aparecem na galeria. Isso acaba com a cadeia das coleções (Medalhista logo depois da 5ª).',
  ],
  [
    'Limites que não se repetem.',
    'Nenhum contador usa o mesmo número de outro (nada de 5, 5 e 5), para as conquistas não saírem na mesma ação.',
  ],
  [
    'Estreias só uma vez cada.',
    'O primeiro check continua. "Primeiro diário, tarefa e hábito marcados" viram 4 dias, 6 tarefas e 8 marcações.',
  ],
  [
    'Regras "no mesmo dia" pedem vários dias.',
    'Equilíbrio, Pódio, Dia perfeito e Vida em equilíbrio não saem todas no dia 1.',
  ],
  [
    'Níveis combinam com a pontuação nova.',
    'Depois do capítulo 5 cada nível pede 1000 de EXP; Veterano, Mestre e Lenda ficam nos níveis 8, 12 e 20.',
  ],
  [
    'Nomes seguem o número.',
    'Quando o limite muda, o nome acompanha (Chama de 5 dias, Hábito de 21 dias). Os identificadores internos não mudam.',
  ],
];

/** Painel de ritmo: princípios e simulação de 30 dias, regras de antes contra as de agora. */
export function ritmoPanel(changedCount: number): HTMLElement {
  const sim = h('div');
  let current: Persona = PERSONAS[0] as Persona;

  const render = (): void => {
    const antes = simulate(current, ANTES);
    const agora = simulate(current, AGORA);

    const people = h('div', 'pace-people');
    for (const p of PERSONAS) {
      const button = h('button', p === current ? 'on' : '', p.name);
      button.type = 'button';
      button.onclick = () => {
        current = p;
        render();
      };
      people.append(button);
    }

    sim.replaceChildren(
      people,
      h('p', 'hint', current.about),
      table(
        ['Em 30 dias', 'Antes', 'Agora'],
        [
          compare('Conquistas liberadas', antes.total, agora.total, false),
          compare('Liberadas no dia 1', antes.firstDay, agora.firstDay),
          compare('Liberadas na primeira semana', antes.firstWeek, agora.firstWeek),
          compare('Maior rajada (numa só ação)', antes.maxBurst, agora.maxBurst),
          compare('Ações com 2 ou mais de uma vez', antes.multiActions, agora.multiActions),
          compare(
            'Fila de espera, no máximo (com 1 modal por ação)',
            antes.backlogPeak,
            agora.backlogPeak,
          ),
          compare('Espera máxima, em ações (com 1 modal por ação)', antes.maxDelay, agora.maxDelay),
        ],
      ),
      h(
        'div',
        'pace-grid',
        h('div', '', h('h4', '', 'Antes: o que liberava e quando'), unlockLog(antes)),
        h('div', '', h('h4', '', 'Agora: o que libera e quando'), unlockLog(agora)),
      ),
    );
  };
  render();

  return panel(
    'Ritmo: menos conquistas de uma vez',
    h(
      'p',
      'lead',
      `Antes várias conquistas saíam juntas: limites iguais (5, 10, 25), regras "no mesmo dia" que saem no primeiro dia e coleções em cadeia. O ritmo novo espaça ${changedCount} critérios e limita a um modal por ação. Já está no app (branch de teste); a simulação compara com as regras de antes.`,
    ),
    h(
      'ul',
      'v2-list',
      ...PRINCIPLES.map(([title, text]) => h('li', '', h('strong', '', `${title} `), text)),
    ),
    h('h3', 'pace-sub', 'Simulação de 30 dias'),
    h(
      'p',
      'hint',
      'Madrugador, Coruja, Resgate, Coração valente e Lista zerada não entram: dependem de hora ou de atraso.',
    ),
    sim,
  );
}
