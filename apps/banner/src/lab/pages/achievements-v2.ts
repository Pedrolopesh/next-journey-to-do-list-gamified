import './achievements-v2.css';

import { choiceGroup, h, panel } from '../dom';
import type { LabPage } from '../page';
import { insigniaSvg } from '../pixel';
import { PROPOSAL, type Proposal, type Source, TIERS, TRAILS } from './achievements-v2-data';
import { ritmoPanel } from './achievements-v2-ritmo';
import { ANTES } from './achievements-v2-rules';

const SOURCE_LABEL: Record<Source, string> = {
  pronto: 'Já medido hoje',
  consulta: 'Sai das tabelas atuais',
  novo: 'Precisa de dado novo',
};

/** Insígnia: insígnia em pixel art dentro da moldura da classe (bronze, prata, ouro, diamante). */
function badge(item: Pick<Proposal, 'glyph' | 'tier'>, locked: boolean, size = ''): HTMLElement {
  const box = h(
    'span',
    `insignia t${item.tier}${locked ? ' locked' : ''}${size ? ` ${size}` : ''}`,
  );
  box.innerHTML = insigniaSvg(item.glyph);
  return box;
}

type View = 'regras' | 'bloqueadas' | 'desbloqueadas';

/** O que mudou em relação às regras anteriores: nome e/ou critério de antes, se mudaram. */
function change(item: Proposal): { name?: string; desc?: string } | null {
  const before = ANTES[item.id];
  if (!before) return null;
  const name = before.name && before.name !== item.name ? before.name : undefined;
  const desc = before.desc !== item.desc ? before.desc : undefined;
  return name || desc ? { ...(name ? { name } : {}), ...(desc ? { desc } : {}) } : null;
}

function card(item: Proposal, view: View): HTMLElement {
  const tier = TIERS.find((t) => t.tier === item.tier);
  const rules = view === 'regras';
  const locked = view === 'bloqueadas';
  const hidden = item.secret && locked;
  const before = rules ? change(item) : null;

  const title = hidden
    ? h('strong', '', '???')
    : before?.name
      ? h('strong', '', h('span', 'was', before.name), ' ', h('span', 'new', item.name))
      : h('strong', '', item.name);
  const desc = hidden
    ? h('span', 'desc', 'Conquista surpresa: descubra fazendo.')
    : before?.desc
      ? h('span', 'desc', h('span', 'was', before.desc), h('span', 'new', item.desc))
      : h('span', 'desc', item.desc);

  return h(
    'article',
    `ach2${locked ? ' locked' : ''}${before ? ' changed' : ''}`,
    badge(item, locked),
    h('div', 'body', title, desc),
    h(
      'div',
      'meta',
      h('span', `tag tier t${item.tier}`, tier?.name ?? ''),
      h('span', `tag src ${item.source}`, SOURCE_LABEL[item.source]),
      ...(item.secret ? [h('span', 'tag secret', 'Surpresa')] : []),
      ...(before ? [h('span', 'tag changed', 'Mudou')] : []),
    ),
  );
}

export const achievementsV2Page: LabPage = {
  id: 'conquistas-v2',
  label: 'Conquistas v2',
  mount(host) {
    let trail = 'todas';
    let view: View = 'regras';
    let onlyChanged = false;
    const results = h('div', 'v2-results');

    const render = (): void => {
      const trails = TRAILS.filter((t) => trail === 'todas' || t.id === trail);
      results.replaceChildren(
        ...trails.map((t) => {
          const items = PROPOSAL.filter(
            (p) => p.trail === t.id && (!onlyChanged || change(p) !== null),
          );
          if (items.length === 0) return h('span');
          return h(
            'section',
            'v2-trail',
            h('h3', '', `${t.name} `, h('small', '', `${items.length} conquistas`)),
            h('p', 'goal', t.goal),
            h('div', 'v2-grid', ...items.map((p) => card(p, view))),
          );
        }),
      );
    };

    // Resumo: trilhas x classes
    const header = h(
      'tr',
      '',
      h('th', '', 'Trilha'),
      ...TIERS.map((t) => h('th', '', t.name)),
      h('th', '', 'Total'),
    );
    const rows = TRAILS.map((t) => {
      const mine = PROPOSAL.filter((p) => p.trail === t.id);
      return h(
        'tr',
        '',
        h('td', '', t.name),
        ...TIERS.map((tier) =>
          h('td', '', String(mine.filter((p) => p.tier === tier.tier).length || '–')),
        ),
        h('td', '', String(mine.length)),
      );
    });
    const changedCount = PROPOSAL.filter((p) => change(p) !== null).length;
    const count = (source: Source): number => PROPOSAL.filter((p) => p.source === source).length;
    const glyphs = [...new Set(PROPOSAL.map((p) => p.glyph))];

    host.append(
      h('h1', '', 'Conquistas v2'),
      h(
        'p',
        'lead',
        `Catálogo oficial: conquistas só de mérito (sem item nem acessório), ${PROPOSAL.length} no total, organizadas em ${TRAILS.length} trilhas e 4 classes. É a mesma lista que a API e o app usam. Esta página reúne tudo: o conceito, a arte, o catálogo com as regras de hoje e o ritmo das conquistas, antes e agora (${changedCount} critérios mudaram).`,
      ),
      panel(
        'Conceito',
        h(
          'ul',
          'v2-list',
          h(
            'li',
            '',
            h('strong', '', 'Só mérito. '),
            'A conquista é o reconhecimento de algo que a pessoa fez. Sem recompensa de item; se um dia houver, é outra camada.',
          ),
          h(
            'li',
            '',
            h('strong', '', 'Degraus curtos no começo. '),
            'As conquistas de estreia (criar e marcar cada tipo de item) dão vitórias na primeira semana e ensinam os três tipos de item.',
          ),
          h(
            'li',
            '',
            h('strong', '', 'Constância vale mais que volume. '),
            'Sequências, dias seguidos e dias diferentes premiam voltar ao app, não clicar muito.',
          ),
          h(
            'li',
            '',
            h('strong', '', 'Hábito conta dias, não cliques. '),
            'Hábito não tem limite de checks por dia. Se contássemos cliques, bastaria marcar o mesmo hábito sem parar. As conquistas de hábito contam dias com marcação.',
          ),
          h(
            'li',
            '',
            h('strong', '', 'Sem punição. '),
            'Nada é perdido: conquista desbloqueada nunca some, e a sequência parada só deixa de avançar.',
          ),
          h(
            'li',
            '',
            h('strong', '', 'Algumas surpresas. '),
            'Madrugador, Coruja, Resgate e Cofre aberto escondem a descrição até desbloquear, para dar gosto de descobrir.',
          ),
          h(
            'li',
            '',
            h('strong', '', 'Progresso visível. '),
            'Cada conquista com meta numérica mostra a barra (ex.: 18/100), como já acontece no app.',
          ),
        ),
      ),
      panel(
        'Arte: insígnia + moldura',
        h(
          'p',
          'lead',
          `Em vez de uma arte por conquista, cada família usa uma insígnia em pixel art e a classe vem da moldura. As ${glyphs.length} insígnias desta proposta cobrem as ${PROPOSAL.length} conquistas (desenhadas no Figma, em 24x24). Uma conquista nova da mesma família só precisa de uma moldura, sem arte nova.`,
        ),
        h(
          'div',
          'v2-demo',
          ...TIERS.map((t) =>
            h(
              'figure',
              '',
              badge({ glyph: 'chama', tier: t.tier }, false, 'big'),
              h('figcaption', '', t.name),
            ),
          ),
          h(
            'figure',
            '',
            badge({ glyph: 'chama', tier: 1 }, true, 'big'),
            h('figcaption', '', 'Bloqueada'),
          ),
        ),
        h('p', 'hint', 'Insígnias usadas (cada uma aparece em até 4 classes):'),
        h('div', 'v2-glyphs', ...glyphs.map((g) => badge({ glyph: g, tier: 1 }, false))),
      ),
      panel(
        'Resumo',
        h('table', 'v2-table', h('thead', '', header), h('tbody', '', ...rows)),
        h(
          'p',
          'hint',
          `Medição: ${count('pronto')} já são medidas pelo servidor hoje, ${count('consulta')} saem de tabelas que já existem (por tipo de item, dias distintos, sequência por item, prazo e dificuldade) e ${count('novo')} precisam de dado ou evento novo (mudar personagem, criar categoria, trocar de história).`,
        ),
      ),
      ritmoPanel(changedCount),
      panel(
        'Catálogo e regras',
        h(
          'div',
          'row',
          h('label', '', 'Trilha'),
          choiceGroup(
            [
              { value: 'todas', label: 'Todas' },
              ...TRAILS.map((t) => ({ value: t.id, label: t.name })),
            ],
            () => trail,
            (value) => {
              trail = value;
              render();
            },
          ),
        ),
        h(
          'div',
          'row',
          h('label', '', 'Ver como'),
          choiceGroup(
            [
              { value: 'regras', label: 'Regras (hoje e proposta)' },
              { value: 'bloqueadas', label: 'Bloqueadas' },
              { value: 'desbloqueadas', label: 'Desbloqueadas' },
            ],
            () => view,
            (value) => {
              view = value;
              render();
            },
          ),
        ),
        h(
          'div',
          'row',
          h('label', '', 'Mostrar'),
          choiceGroup(
            [
              { value: 'todas' as const, label: 'Todas' },
              { value: 'mudam' as const, label: `Só as ${changedCount} que mudaram` },
            ],
            () => (onlyChanged ? 'mudam' : 'todas'),
            (value) => {
              onlyChanged = value === 'mudam';
              render();
            },
          ),
        ),
        h(
          'p',
          'hint',
          'Em "Regras", o critério de antes aparece riscado e o de agora em verde; as surpresas mostram o critério para você revisar. As outras duas visões mostram como a galeria aparece no app.',
        ),
        results,
      ),
    );
    render();
  },
};
