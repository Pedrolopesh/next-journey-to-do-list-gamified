import type { Session } from '@nextjourney/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { revokeAllSessions, revokeSession } from '@/api/endpoints';
import { useSessions } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { useToastStore } from '@/features/feedback/toast-store';

import SessionsScreen from '../../app/settings/sessions';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/api/endpoints', () => ({
  revokeSession: jest.fn(),
  revokeAllSessions: jest.fn(),
}));
jest.mock('@/api/queries', () => ({
  useSessions: jest.fn(),
  queryKeys: { sessions: ['sessions'] },
}));

const session = (over: Partial<Session>): Session => ({
  id: '5f0f4d4e-6b43-4f5e-9f55-0d1c1b8a8b11',
  deviceName: 'Pixel 8',
  createdAt: '2026-10-20T10:00:00.000Z',
  lastUsedAt: '2026-10-24T10:00:00.000Z',
  current: false,
  ...over,
});

const loaded = (sessions: Session[]) => ({
  data: sessions,
  isError: false,
  isLoading: false,
  refetch: jest.fn(),
});

const renderScreen = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 800 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <QueryClientProvider client={new QueryClient()}>
        <SessionsScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

describe('SessionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ current: null });
  });

  it('mostra os aparelhos e marca o atual', async () => {
    (useSessions as jest.Mock).mockReturnValue(
      loaded([
        session({ id: 'a', deviceName: 'iOS · iPhone', current: true }),
        session({ id: 'b', deviceName: 'Pixel 8' }),
      ]),
    );
    await renderScreen();
    expect(screen.getByText(/iOS · iPhone · este aparelho/)).toBeTruthy();
    expect(screen.getByText('Pixel 8')).toBeTruthy();
    expect(screen.getByLabelText('Sair deste aparelho')).toBeTruthy();
    expect(screen.getByLabelText('Encerrar sessão')).toBeTruthy();
  });

  it('encerrar outro aparelho chama a API, avisa e não derruba a sessão local', async () => {
    (useSessions as jest.Mock).mockReturnValue(
      loaded([session({ id: 'a', current: true }), session({ id: 'b', deviceName: 'Tablet' })]),
    );
    (revokeSession as jest.Mock).mockResolvedValue(undefined);
    const clear = jest.spyOn(useSessionStore.getState(), 'clear').mockResolvedValue();
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Encerrar sessão'));
    await waitFor(() => {
      expect(useToastStore.getState().current?.message).toBe('Sessão encerrada.');
    });
    expect(revokeSession).toHaveBeenCalledWith('b');
    expect(clear).not.toHaveBeenCalled();
  });

  it('sair de todos os aparelhos encerra tudo e a sessão local', async () => {
    (useSessions as jest.Mock).mockReturnValue(loaded([session({ id: 'a', current: true })]));
    (revokeAllSessions as jest.Mock).mockResolvedValue(undefined);
    const clear = jest.spyOn(useSessionStore.getState(), 'clear').mockResolvedValue();
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Sair de todos os aparelhos'));
    await waitFor(() => {
      expect(clear).toHaveBeenCalled();
    });
    expect(revokeAllSessions).toHaveBeenCalled();
    expect(useToastStore.getState().current?.message).toBe('Você saiu de todos os aparelhos.');
  });

  it('falha ao carregar mostra o aviso e deixa tentar de novo', async () => {
    const refetch = jest.fn();
    (useSessions as jest.Mock).mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch,
    });
    await renderScreen();
    expect(screen.getByText(/Não foi possível carregar os aparelhos/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(refetch).toHaveBeenCalled();
  });
});
