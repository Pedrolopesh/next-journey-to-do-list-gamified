import './scoring.css';

import { DEFAULT_GAME_CONFIG } from '../../../../../packages/contracts/src/game-config';
import { h } from '../dom';
import type { LabPage } from '../page';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const LABEL: Record<Difficulty, string> = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' };

/** Regra de hoje, lida da configuração real do jogo. */
const NOW = DEFAULT_GAME_CONFIG;
const expHoje = (nivel: number): number => NOW.levelExpSlope * nivel - NOW.levelExpOffset;
const NOW_CHAPTER_EXP = [1, 2, 3, 4, 5].map(expHoje);

/** PROPOSTA (ainda não vale no app): EXP de cada capítulo e moedas perdidas ao desmarcar. */
const CHAPTER_EXP = [200, 400, 600, 800, 1000];
const UNDO_PENALTY = [3, 5, 10, 15, 20];
const { expByDifficulty: EXP, coinsByDifficulty: COINS, levelUpBonusCoins: BONUS } = NOW;

type Item = { id: number; difficulty: Difficulty; checked: boolean; xpClaimed: boolean };

function table(head: string[], rows: (string | HTMLElement)[][]): HTMLTableElement {
  const t = h('table', 'sc-table');
  t.append(
    h('thead', '', h('tr', '', ...head.map((c) => h('th', '', c)))),
    h('tbody', '', ...rows.map((r) => h('tr', '', ...r.map((c) => h('td', '', c))))),
  );
  return t;
}

function was(value: string): HTMLElement {
  return h('span', 'was', value);
}

export const scoringPage: LabPage = {
  id: 'pontuacao',
  label: 'Moedas e EXP',
  mount(host) {
    const checksFor = (chapterExp: number, difficulty: Difficulty): string =>
      `${Math.ceil(chapterExp / EXP[difficulty])}`;

    const chaptersBox = h('div');
    const renderChapters = (): void => {
      chaptersBox.replaceChildren(
        table(
          [
            'Capítulo',
            'EXP hoje',
            'EXP proposto',
            'Checks fáceis',
            'Médios',
            'Difíceis',
            'Perde ao desmarcar',
          ],
          CHAPTER_EXP.map((exp, i) => [
            `${i + 1}`,
            was(`${NOW_CHAPTER_EXP[i]}`),
            `${exp}`,
            checksFor(exp, 'easy'),
            checksFor(exp, 'medium'),
            checksFor(exp, 'hard'),
            `${UNDO_PENALTY[i]} moedas`,
          ]),
        ),
      );
    };
    renderChapters();

    // Editor: mexa nos números e a tabela e o simulador acompanham
    const numberInput = (list: number[], index: number, after: () => void): HTMLInputElement => {
      const input = h('input');
      input.type = 'number';
      input.min = '1';
      input.value = String(list[index]);
      input.style.width = '72px';
      input.oninput = () => {
        list[index] = Math.max(1, Math.floor(Number(input.value) || 1));
        after();
      };
      return input;
    };
    const editor = h('div', 'sc-editor');

    const perCheck = table(
      ['Dificuldade', 'EXP por check', 'Moedas por check'],
      DIFFICULTIES.map((d) => [LABEL[d], `${EXP[d]}`, `${COINS[d]}`]),
    );

    // Simulador da proposta
    const state = { chapter: 0, exp: 0, coins: 0, nextId: 1, items: [] as Item[] };
    const bar = h('i');
    const stats = h('div', 'sc-stats');
    const list = h('div', 'sc-items');
    const toasts = h('div', 'sc-toasts');
    const toast = (kind: 'gain' | 'loss' | 'info', text: string): void => {
      toasts.prepend(h('div', `sc-toast ${kind}`, text));
      while (toasts.children.length > 4) toasts.lastElementChild?.remove();
    };
    const need = (): number => CHAPTER_EXP[state.chapter] ?? 0;

    const render = (): void => {
      const done = state.chapter >= CHAPTER_EXP.length;
      bar.style.width = done ? '100%' : `${Math.min(100, (state.exp / need()) * 100)}%`;
      stats.replaceChildren(
        h('span', '', done ? 'História concluída' : `Capítulo ${state.chapter + 1}`),
        h('span', '', done ? '' : `EXP ${state.exp}/${need()}`),
        h('span', '', `Moedas ${state.coins}`),
      );
      list.replaceChildren(
        ...state.items.map((item) => {
          const button = h(
            'button',
            item.checked ? 'undo' : '',
            item.checked ? 'Desmarcar' : 'Marcar',
          );
          button.type = 'button';
          button.onclick = () => (item.checked ? uncheck(item) : check(item));
          return h(
            'div',
            'sc-item',
            h('span', '', `Item ${item.id} · ${LABEL[item.difficulty]}`),
            button,
          );
        }),
      );
    };

    const check = (item: Item): void => {
      if (state.chapter >= CHAPTER_EXP.length) return;
      const exp = item.xpClaimed ? 0 : EXP[item.difficulty];
      const coins = COINS[item.difficulty];
      item.checked = true;
      item.xpClaimed = true;
      state.coins += coins;
      state.exp += exp;
      let bonus = 0;
      let opened = false;
      while (state.chapter < CHAPTER_EXP.length && state.exp >= need()) {
        state.exp -= need();
        state.chapter += 1;
        bonus += BONUS;
        opened = true;
      }
      state.coins += bonus;
      toast(
        'gain',
        exp > 0
          ? `+${exp} EXP · +${coins} moedas`
          : `+0 EXP (já contou neste item) · +${coins} moedas`,
      );
      if (opened) toast('info', `Portal! Capítulo concluído, bônus de +${bonus} moedas`);
      render();
    };

    const uncheck = (item: Item): void => {
      const penalty = UNDO_PENALTY[Math.min(state.chapter, UNDO_PENALTY.length - 1)] ?? 0;
      const lost = Math.min(penalty, state.coins);
      item.checked = false;
      state.coins -= lost;
      toast('loss', `−${lost} moedas · EXP continua`);
      render();
    };

    const addButtons = DIFFICULTIES.map((d) => {
      const button = h('button', '', `+ Item ${LABEL[d].toLowerCase()}`);
      button.type = 'button';
      button.onclick = () => {
        const item: Item = { id: state.nextId++, difficulty: d, checked: false, xpClaimed: false };
        state.items.push(item);
        check(item);
      };
      return button;
    });
    const reset = h('button', 'undo', 'Zerar simulador');
    reset.type = 'button';
    reset.onclick = () => {
      Object.assign(state, { chapter: 0, exp: 0, coins: 0, nextId: 1, items: [] });
      toasts.replaceChildren();
      render();
    };

    const sim = h(
      'section',
      'style sc-sim',
      h('h2', '', 'Simulador da proposta'),
      h(
        'p',
        'note',
        'Crie itens já marcados e desmarque para ver o aviso verde (ganho) e o amarelo (moedas a menos). O personagem fica parado ao desmarcar, porque o EXP não cai.',
      ),
      h('div', 'sc-bar', bar),
      stats,
      h('div', 'sc-actions', ...addButtons, reset),
      list,
      toasts,
    );
    render();
    editor.append(
      h(
        'p',
        'note',
        'Ajuste os valores para testar: a tabela acima e o simulador recalculam na hora.',
      ),
      table(
        ['Capítulo', 'EXP do capítulo', 'Moedas perdidas ao desmarcar'],
        CHAPTER_EXP.map((_, i) => [
          `${i + 1}`,
          numberInput(CHAPTER_EXP, i, () => {
            renderChapters();
            render();
          }),
          numberInput(UNDO_PENALTY, i, renderChapters),
        ]),
      ),
    );

    host.append(
      h('h1', '', 'Moedas e EXP'),
      h(
        'p',
        'lead',
        'Primeiro, como EXP e moedas estão definidos hoje no app. Depois, a proposta de EXP por capítulo e de moedas ao desmarcar, que você pode ajustar aqui. A proposta ainda não está no app.',
      ),
      h(
        'section',
        'style',
        h('h2', '', 'Como está definido hoje'),
        h(
          'ul',
          'sc-open',
          h(
            'li',
            '',
            `EXP por check: fácil ${EXP.easy}, média ${EXP.medium}, difícil ${EXP.hard}. Moedas por check: ${COINS.easy}, ${COINS.medium} e ${COINS.hard}.`,
          ),
          h(
            'li',
            '',
            `EXP para ir do nível n ao n+1: ${NOW.levelExpSlope} × n − ${NOW.levelExpOffset} (50, 125, 200, 275, 350...). O EXP que sobra ao subir é carregado.`,
          ),
          h(
            'li',
            '',
            `Cada nível ganho conclui um capítulo da história (${NOW.chaptersPerStory} capítulos por história) e rende ${BONUS} moedas de bônus. Um check grande pode subir mais de um nível.`,
          ),
          h(
            'li',
            '',
            'O personagem anda pela EXP dentro do nível e chega ao portal quando sobe de nível; a troca de cena acontece no check seguinte.',
          ),
          h(
            'li',
            '',
            'Diário: um check por dia (só nos dias agendados). Tarefa: um check só. Hábito: sem limite por dia. Repetir o mesmo checkId não duplica EXP.',
          ),
          h(
            'li',
            '',
            'Desmarcar hoje: só no mesmo dia do check. Devolve o EXP e as moedas daquele check (o EXP nunca passa do início do nível, e o nível não cai). O bônus de nível não volta, e o check que fechou um capítulo não pode ser desfeito.',
          ),
          h(
            'li',
            '',
            'Avisos de hoje: marcar mostra "+EXP e +moedas"; desmarcar mostra só "check desfeito", sem os valores.',
          ),
          h(
            'li',
            '',
            'Onde mora: valores na tabela game_config do servidor (ajustável sem publicar o app); regras em progression/domain da API. O app não calcula nada.',
          ),
        ),
        h('h3', '', 'Níveis de hoje, com checks necessários'),
        table(
          ['Nível', 'EXP do nível', 'EXP acumulado', 'Fácil', 'Média', 'Difícil'],
          [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const exp = expHoje(n);
            const total = [...Array(n).keys()].reduce((sum, i) => sum + expHoje(i + 1), 0);
            return [
              `${n}`,
              `${exp}`,
              `${total}`,
              checksFor(exp, 'easy'),
              checksFor(exp, 'medium'),
              checksFor(exp, 'hard'),
            ];
          }),
        ),
      ),
      h('section', 'style', h('h2', '', 'EXP por capítulo'), chaptersBox, editor),
      h(
        'section',
        'style',
        h('h2', '', 'O que cada check rende (não muda)'),
        perCheck,
        h('p', 'note', `Cada capítulo concluído dá ${BONUS} moedas de bônus.`),
      ),
      h(
        'section',
        'style',
        h('h2', '', 'Regra de desmarcar (proposta)'),
        h(
          'ul',
          'sc-open',
          h('li', '', 'O EXP nunca se perde, nem o nível, nem o capítulo.'),
          h(
            'li',
            '',
            'Perde moedas, até o valor da tabela do capítulo atual (nunca deixa o saldo negativo).',
          ),
          h('li', '', 'O personagem não anda para trás: a posição acompanha o EXP.'),
          h('li', '', 'Aviso amarelo mostra as moedas a menos; marcar mostra EXP e moedas ganhos.'),
        ),
      ),
      sim,
      h(
        'section',
        'style',
        h('h2', '', 'Pontos para decidir'),
        h(
          'ul',
          'sc-open',
          h(
            'li',
            '',
            'Marcar, desmarcar e marcar de novo: como o EXP não cai, o mesmo item daria EXP várias vezes. Proposta: o item só rende EXP uma vez (no simulador, marque de novo e veja "+0 EXP"). As moedas voltam a ser dadas, mas o desmarcar tira mais do que o item rende nos capítulos 2 em diante.',
          ),
          h(
            'li',
            '',
            'Hoje desfazer só vale no mesmo dia e não vale depois que o capítulo fecha. Manter?',
          ),
          h(
            'li',
            '',
            'Com 5 capítulos de EXP, o que acontece depois do capítulo 5? Hoje o nível continua subindo.',
          ),
        ),
      ),
    );
  },
};
