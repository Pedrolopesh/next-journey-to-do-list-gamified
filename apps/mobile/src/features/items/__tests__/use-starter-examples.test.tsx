import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createItem } from '@/api/endpoints';
import { refreshGameData, showNextPending } from '@/api/queries';
import { useToastStore } from '@/features/feedback/toast-store';

import { buildExampleRequests } from '../examples';
import { useStarterExamples } from '../use-starter-examples';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('@/api/endpoints', () => ({ createItem: jest.fn() }));
jest.mock('@/api/queries', () => {
  const empty = { isSuccess: true, data: [] };
  return {
    refreshGameData: jest.fn(),
    showNextPending: jest.fn().mockResolvedValue(undefined),
    useMe: () => ({ data: { user: { id: 'u1' } } }),
    useCategories: () => ({ data: [{ id: 'c1', name: 'Saúde' }] }),
    useItems: () => empty,
  };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);
const run = () =>
  renderHook(
    () => {
      useStarterExamples();
    },
    { wrapper },
  );

describe('useStarterExamples', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (createItem as jest.Mock).mockResolvedValue({});
    useToastStore.setState({ current: null });
  });

  it('cria todos os exemplos e recarrega os dados uma única vez, no fim', async () => {
    const total = buildExampleRequests([{ id: 'c1', name: 'Saúde' }], () => 'x').length;
    await run();
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('nextjourney.examples.v1.u1', '1');
    });
    expect(createItem).toHaveBeenCalledTimes(total);
    expect(refreshGameData).toHaveBeenCalledTimes(1);
    expect(showNextPending).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().current?.kind).toBe('success');
  });

  it('falha no meio: recarrega o que foi criado, avisa o erro e não marca como feito', async () => {
    (createItem as jest.Mock)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockRejectedValue(new Error('falhou'));
    await run();
    await waitFor(() => {
      expect(useToastStore.getState().current?.kind).toBe('error');
    });
    expect(refreshGameData).toHaveBeenCalledTimes(1);
    expect(showNextPending).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
