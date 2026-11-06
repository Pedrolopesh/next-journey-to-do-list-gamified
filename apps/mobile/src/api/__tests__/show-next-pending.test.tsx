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

  it('queues only the oldest pending one', async () => {
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

  it('does not open another modal if one is already open', async () => {
    useFeedbackStore.setState({ modals: [{ kind: 'level', level: 2 }] });
    mockFetch.mockResolvedValue([item('a', '2026-10-09T12:00:01Z', true)]);
    await showNextPending(new QueryClient());
    expect(useFeedbackStore.getState().modals).toHaveLength(1);
  });

  it('does not repeat an achievement already shown in this session', async () => {
    useFeedbackStore.setState({ shownAchievements: ['a'] });
    mockFetch.mockResolvedValue([item('a', '2026-10-09T12:00:01Z', true)]);
    await showNextPending(new QueryClient());
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });

  it('without network, it does not break and shows nothing', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    await expect(showNextPending(new QueryClient())).resolves.toBeUndefined();
    expect(useFeedbackStore.getState().modals).toHaveLength(0);
  });
});
