import { QueryClient } from '@tanstack/react-query';

import { useFeedbackStore } from '@/features/feedback/feedback-store';

import { showNextPending } from '../queries';

const mockFetch = jest.fn();
jest.mock('../endpoints', () => ({ fetchAchievements: () => mockFetch() }));
jest.mock('@/auth/session-store', () => ({ useSessionStore: () => true }));

const item = (slug: string, unlockedAt: string, pending: boolean) => ({
  slug,
  name: slug,
  tier: 1,
  glyph: 'estrela',
  pending,
  unlockedAt,
  unlocked: true,
});

describe('showNextPending', () => {
  beforeEach(() => {
    useFeedbackStore.setState({ modals: [], shownAchievements: [] });
    mockFetch.mockReset();
  });

  it('põe na fila só a pendente mais antiga', async () => {
    mockFetch.mockResolvedValue([
      item('b', '2026-10-09T12:00:02Z', true),
      item('a', '2026-10-09T12:00:01Z', true),
      item('c', '2026-10-09T12:00:00Z', false),
    ]);
    await showNextPending(new QueryClient());
    expect(
      useFeedbackStore.getState().modals.map((m) => (m.kind === 'achievement' ? m.slug : '')),
    ).toEqual(['a']);
  });

  it('não abre outro modal se já há um aberto', async () => {
    useFeedbackStore.setState({ modals: [{ kind: 'level', level: 2 }] });
    mockFetch.mockResolvedValue([item('a', '2026-10-09T12:00:01Z', true)]);
    await showNextPending(new QueryClient());
    expect(useFeedbackStore.getState().modals).toHaveLength(1);
  });

  it('não repete uma conquista que já foi mostrada nesta sessão', async () => {
    useFeedbackStore.setState({ shownAchievements: ['a'] });
    mockFetch.mockResolvedValue([item('a', '2026-10-09T12:00:01Z', true)]);
    await showNextPending(new QueryClient());
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });

  it('sem rede, não quebra e não mostra nada', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    await expect(showNextPending(new QueryClient())).resolves.toBeUndefined();
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });
});
