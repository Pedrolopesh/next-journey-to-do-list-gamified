import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { deleteAccount, emailStart } from '@/api/endpoints';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { useToastStore } from '@/features/feedback/toast-store';

import DeleteAccountScreen from '../../app/settings/delete-account';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/api/endpoints', () => ({ deleteAccount: jest.fn(), emailStart: jest.fn() }));
jest.mock('@/api/queries', () => ({ useMe: jest.fn() }));
jest.mock('@/features/auth/social-id-token', () => ({
  configureGoogle: jest.fn(),
  getAppleIdToken: jest.fn(),
  getGoogleIdToken: jest.fn(),
  googleEnabled: true,
  isAppleAvailable: () => Promise.resolve(false),
}));

const me = {
  data: { user: { email: 'pessoa@exemplo.com' } },
  isError: false,
  refetch: jest.fn(),
};

const renderScreen = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 800 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <QueryClientProvider client={new QueryClient()}>
        <DeleteAccountScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ current: null });
  });

  /** Asks for the code and types it, so the "delete" button can be pressed. */
  const requestAndTypeCode = async (code: string) => {
    (emailStart as jest.Mock).mockResolvedValue(undefined);
    await fireEvent.press(screen.getByLabelText('Enviar código'));
    await waitFor(() => {
      expect(emailStart).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'pessoa@exemplo.com' }),
      );
    });
    await fireEvent.changeText(await screen.findByDisplayValue(''), code);
  };

  it('every account sees the email code option and the provider button, and no password field', async () => {
    (useMe as jest.Mock).mockReturnValue(me);
    await renderScreen();
    expect(screen.getByLabelText('Enviar código')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar com Google e excluir')).toBeTruthy();
    expect(screen.queryByLabelText(/senha/i)).toBeNull();
  });

  it('sends the code, then deletes with it and ends the local session', async () => {
    (useMe as jest.Mock).mockReturnValue(me);
    (deleteAccount as jest.Mock).mockResolvedValue(undefined);
    const clear = jest.spyOn(useSessionStore.getState(), 'clear').mockResolvedValue();
    await renderScreen();
    await requestAndTypeCode('123456');
    await fireEvent.press(screen.getByLabelText('Excluir minha conta'));
    await waitFor(() => {
      expect(clear).toHaveBeenCalled();
    });
    expect(deleteAccount).toHaveBeenCalledWith({ emailCode: '123456' });
    expect(useToastStore.getState().current?.message).toBe('Conta excluída.');
  });

  it('proof refused (REAUTH_FAILED): warns and does not end the session', async () => {
    (useMe as jest.Mock).mockReturnValue(me);
    (deleteAccount as jest.Mock).mockRejectedValue(
      new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 403,
        data: { code: 'REAUTH_FAILED', message: 'x' },
        statusText: '',
        headers: {},
        config: { headers: {} } as never,
      }),
    );
    const clear = jest.spyOn(useSessionStore.getState(), 'clear').mockResolvedValue();
    await renderScreen();
    await requestAndTypeCode('000000');
    await fireEvent.press(screen.getByLabelText('Excluir minha conta'));
    await waitFor(() => {
      expect(useToastStore.getState().current?.kind).toBe('error');
    });
    expect(useToastStore.getState().current?.message).toMatch(/confirmar sua identidade/);
    expect(clear).not.toHaveBeenCalled();
  });

  it('if /me fails, warns and offers a retry (never keeps spinning)', async () => {
    const refetch = jest.fn();
    (useMe as jest.Mock).mockReturnValue({ data: undefined, isError: true, refetch });
    await renderScreen();
    expect(screen.getByText(/Não foi possível carregar sua conta/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(refetch).toHaveBeenCalled();
  });
});
