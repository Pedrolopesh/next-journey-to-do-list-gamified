import { beforeEach, describe, expect, it } from 'vitest';

import { lastUndoableCheck, useFeedbackStore } from './feedback-store';

describe('feedback store', () => {
  beforeEach(() => {
    useFeedbackStore.getState().clear();
  });

  it('a fila de modais é exibida um de cada vez, na ordem', () => {
    const store = useFeedbackStore.getState();
    store.enqueue([
      { kind: 'level', level: 2 },
      { kind: 'achievement', slug: 'a', name: 'A', tier: 1, glyph: 'pegada' },
    ]);
    expect(useFeedbackStore.getState().modals[0]).toEqual({ kind: 'level', level: 2 });
    store.dismiss();
    expect(useFeedbackStore.getState().modals[0]).toMatchObject({ kind: 'achievement' });
    store.dismiss();
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });

  it('uma conquista não entra duas vezes na fila, nem depois de já ter aberto o modal', () => {
    const store = useFeedbackStore.getState();
    const entry = { kind: 'achievement', slug: 'a', name: 'A', tier: 1, glyph: 'pegada' } as const;
    store.enqueue([entry, entry]);
    store.enqueue([entry]);
    expect(useFeedbackStore.getState().modals).toHaveLength(1);
    store.dismiss();
    store.enqueue([entry]); // o aviso ainda estava sendo confirmado no servidor
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });

  it('"Ver todas" fecha todas as conquistas da fila e mantém os outros modais', () => {
    const store = useFeedbackStore.getState();
    const achievement = (slug: string) =>
      ({ kind: 'achievement', slug, name: slug, tier: 1, glyph: 'pegada' }) as const;
    store.enqueue([achievement('a'), { kind: 'level', level: 2 }, achievement('b')]);
    expect(store.dismissAchievements()).toEqual(['a', 'b']);
    expect(useFeedbackStore.getState().modals).toEqual([{ kind: 'level', level: 2 }]);
    store.enqueue([achievement('a')]); // já confirmada: não volta
    expect(useFeedbackStore.getState().modals).toHaveLength(1);
  });

  it('lembra o último check do item para desfazer e esquece depois de desfazer', () => {
    const store = useFeedbackStore.getState();
    store.rememberCheck('item-1', 'c1');
    store.rememberCheck('item-1', 'c2');
    expect(lastUndoableCheck(useFeedbackStore.getState().checks, 'item-1')).toBe('c2');
    store.forgetCheck('item-1', 'c2');
    expect(lastUndoableCheck(useFeedbackStore.getState().checks, 'item-1')).toBe('c1');
    expect(lastUndoableCheck(useFeedbackStore.getState().checks, 'outro')).toBeNull();
  });
});
