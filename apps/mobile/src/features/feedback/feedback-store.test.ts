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
      { kind: 'achievement', slug: 'a', name: 'A', rewardKey: null },
    ]);
    expect(useFeedbackStore.getState().modals[0]).toEqual({ kind: 'level', level: 2 });
    store.dismiss();
    expect(useFeedbackStore.getState().modals[0]).toMatchObject({ kind: 'achievement' });
    store.dismiss();
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
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
