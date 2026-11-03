import { useItemDraftStore } from './item-draft-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const draft = {
  type: 'todo' as const,
  title: 'Buy milk',
  notes: '',
  difficulty: 'medium' as const,
  categoryId: null,
  days: [1, 2, 3, 4, 5],
  due: 'none' as const,
  dueTouched: false,
};

describe('item draft store', () => {
  beforeEach(() => {
    useItemDraftStore.getState().clear();
  });

  it('keeps what the person is writing for that account', () => {
    useItemDraftStore.getState().save('user-1', draft);
    expect(useItemDraftStore.getState()).toMatchObject({ userId: 'user-1', draft });
  });

  it('drops the draft once the title and the notes are empty', () => {
    useItemDraftStore.getState().save('user-1', draft);
    useItemDraftStore.getState().save('user-1', { ...draft, title: '  ' });
    expect(useItemDraftStore.getState().draft).toBeNull();
  });

  it('clears the draft after the item is saved', () => {
    useItemDraftStore.getState().save('user-1', draft);
    useItemDraftStore.getState().clear();
    expect(useItemDraftStore.getState()).toMatchObject({ userId: null, draft: null });
  });
});
