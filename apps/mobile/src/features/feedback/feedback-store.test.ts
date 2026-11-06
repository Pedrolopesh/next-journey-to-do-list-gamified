import { beforeEach, describe, expect, it } from 'vitest';

import { lastUndoableCheck, useFeedbackStore } from './feedback-store';

describe('feedback store', () => {
  beforeEach(() => {
    useFeedbackStore.getState().clear();
  });

  it('the modal queue is shown one at a time, in order', () => {
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

  it('an achievement does not enter the queue twice, not even after its modal already opened', () => {
    const store = useFeedbackStore.getState();
    const entry = { kind: 'achievement', slug: 'a', name: 'A', tier: 1, glyph: 'pegada' } as const;
    store.enqueue([entry, entry]);
    store.enqueue([entry]);
    expect(useFeedbackStore.getState().modals).toHaveLength(1);
    store.dismiss();
    store.enqueue([entry]); // the notice was still being confirmed on the server
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });

  it('"Ver todas" closes all queued achievements and keeps the other modals', () => {
    const store = useFeedbackStore.getState();
    const achievement = (slug: string) =>
      ({ kind: 'achievement', slug, name: slug, tier: 1, glyph: 'pegada' }) as const;
    store.enqueue([achievement('a'), { kind: 'level', level: 2 }, achievement('b')]);
    expect(store.dismissAchievements()).toEqual(['a', 'b']);
    expect(useFeedbackStore.getState().modals).toEqual([{ kind: 'level', level: 2 }]);
    store.enqueue([achievement('a')]); // already confirmed: does not come back
    expect(useFeedbackStore.getState().modals).toHaveLength(1);
  });

  it('remembers the last check of the item to undo and forgets it after the undo', () => {
    const store = useFeedbackStore.getState();
    store.rememberCheck('item-1', 'c1');
    store.rememberCheck('item-1', 'c2');
    expect(lastUndoableCheck(useFeedbackStore.getState().checks, 'item-1')).toBe('c2');
    store.forgetCheck('item-1', 'c2');
    expect(lastUndoableCheck(useFeedbackStore.getState().checks, 'item-1')).toBe('c1');
    expect(lastUndoableCheck(useFeedbackStore.getState().checks, 'outro')).toBeNull();
  });
});
