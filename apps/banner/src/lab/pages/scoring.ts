import './scoring.css';

import { DEFAULT_GAME_CONFIG } from '../../../../../packages/contracts/src/game-config';
import { h } from '../dom';
import type { LabPage } from '../page';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const LABEL: Record<Difficulty, string> = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' };

/** Regra de hoje, lida da configuração real do jogo. */
const NOW = DEFAULT_GAME_CONFIG;
const expAntes = (nivel: number): number => 75 * nivel - 25; // fórmula antiga
const OLD_CHAPTER_EXP = [1, 2, 3, 4, 5].map(expAntes);

/** PROPOSTA (ainda não vale no app): EXP de cada capítulo e moedas perdidas ao desmarcar. */
const CHAPTER_EXP = [...NOW.levelExpTable];
const UNDO_PENALTY = [...NOW.undoCoinPenalty];
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
            'EXP antes',
            'EXP agora',
            'Checks fáceis',
            'Médios',
            'Difíceis',
            'Perde ao desmarcar',
          ],
          CHAPTER_EXP.map((exp, i) => [
            `${i + 1}`,
            was(`${OLD_CHAPTER_EXP[i]}`),
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
      h('h2', '', 'Simulador'),
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
        'Como EXP e moedas funcionam hoje no app. Os campos de EXP e de moedas perdidas servem para simular outros valores: não gravam nada.',
      ),
      h(
        'section',
        'style',
        h('h2', '', 'Como está definido'),
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
            `EXP de cada capítulo (= nível): ${CHAPTER_EXP.join(', ')}. Do nível 5 em diante o nível continua subindo, com ${CHAPTER_EXP[CHAPTER_EXP.length - 1]} de EXP cada, e a história fica no cenário do capítulo 5.`,
          ),
          h(
            'li',
            '',
            `Cada capítulo concluído (${NOW.chaptersPerStory} por história) rende ${BONUS} moedas de bônus. Depois do capítulo 5 o bônus continua a cada nível.`,
          ),
          h(
            'li',
            '',
            'O personagem anda pela EXP dentro do capítulo e só chega ao portal ao concluí-lo. Com a história concluída ele fica no fim do cenário do capítulo 5, sem portal.',
          ),
          h(
            'li',
            '',
            'Diário: um check por dia (nos dias agendados). Tarefa: um check só. Hábito: sem limite por dia. Repetir o mesmo checkId não duplica nada.',
          ),
          h(
            'li',
            '',
            'Desmarcar: vale a qualquer momento, em qualquer capítulo. O EXP, o nível e o capítulo nunca voltam. Só as moedas diminuem, pela tabela abaixo, sem deixar o saldo negativo. O bônus de nível não volta.',
          ),
          h(
            'li',
            '',
            'EXP uma vez só: marcar de novo, no mesmo dia, um item que foi desmarcado rende as moedas, mas 0 de EXP.',
          ),
          h(
            'li',
            '',
            'Avisos: marcar mostra "+EXP · +moedas" (inclusive +0 EXP); desmarcar mostra um aviso amarelo com as moedas a menos. O personagem não se move.',
          ),
          h(
            'li',
            '',
            'Onde mora: os valores ficam na tabela game_config do servidor (ajustável sem publicar o app); as regras, em progression/domain da API. O app não calcula nada.',
          ),
        ),
      ),
      h('section', 'style', h('h2', '', 'EXP por capítulo'), chaptersBox, editor),
      h(
        'section',
        'style',
        h('h2', '', 'O que cada check rende'),
        perCheck,
        h('p', 'note', `Cada capítulo concluído dá ${BONUS} moedas de bônus.`),
      ),
      sim,
    );
  },
};
