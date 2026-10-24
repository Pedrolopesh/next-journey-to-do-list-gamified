import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { deleteAccount } from '@/api/endpoints';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { useToastStore } from '@/features/feedback/toast-store';

import DeleteAccountScreen from '../../app/settings/delete-account';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/api/endpoints', () => ({ deleteAccount: jest.fn() }));
jest.mock('@/api/queries', () => ({ useMe: jest.fn() }));
jest.mock('@/features/auth/social-id-token', () => ({
  configureGoogle: jest.fn(),
  getAppleIdToken: jest.fn(),
  getGoogleIdToken: jest.fn(),
  googleEnabled: true,
  isAppleAvailable: () => Promise.resolve(false),
}));

const meWith = (hasPassword: boolean) => ({
  data: { user: { hasPassword } },
  isError: false,
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
        <DeleteAccountScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ current: null });
  });

  it('conta com senha: senha vazia mostra erro de campo e toast, sem chamar a API', async () => {
    (useMe as jest.Mock).mockReturnValue(meWith(true));
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Excluir minha conta'));
    expect(screen.getByText('Digite sua senha para confirmar.')).toBeTruthy();
    expect(useToastStore.getState().current?.kind).toBe('error');
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it('conta com senha: envia a senha e encerra a sessão local', async () => {
    (useMe as jest.Mock).mockReturnValue(meWith(true));
    (deleteAccount as jest.Mock).mockResolvedValue(undefined);
    const clear = jest.spyOn(useSessionStore.getState(), 'clear').mockResolvedValue();
    await renderScreen();
    await fireEvent.changeText(
      screen.getByLabelText('Digite sua senha para confirmar'),
      'Teste#1234',
    ); // scan-allow: senha falsa
    await fireEvent.press(screen.getByLabelText('Excluir minha conta'));
    await waitFor(() => {
      expect(clear).toHaveBeenCalled();
    });
    expect(deleteAccount).toHaveBeenCalledWith({ password: 'Teste#1234' }); // scan-allow: senha falsa
    expect(useToastStore.getState().current?.message).toBe('Conta excluída.');
  });

  it('prova recusada (REAUTH_FAILED): avisa e não encerra a sessão', async () => {
    (useMe as jest.Mock).mockReturnValue(meWith(true));
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
    await fireEvent.changeText(
      screen.getByLabelText('Digite sua senha para confirmar'),
      'Errada#1234',
    ); // scan-allow: senha falsa
    await fireEvent.press(screen.getByLabelText('Excluir minha conta'));
    await waitFor(() => {
      expect(useToastStore.getState().current?.kind).toBe('error');
    });
    expect(useToastStore.getState().current?.message).toMatch(/confirmar sua identidade/);
    expect(clear).not.toHaveBeenCalled();
  });

  it('conta só social: pede o provedor em vez da senha', async () => {
    (useMe as jest.Mock).mockReturnValue(meWith(false));
    await renderScreen();
    expect(screen.queryByLabelText('Digite sua senha para confirmar')).toBeNull();
    expect(screen.getByLabelText('Confirmar com Google e excluir')).toBeTruthy();
  });

  it('se o /me falha, avisa e oferece tentar de novo (nunca fica girando)', async () => {
    const refetch = jest.fn();
    (useMe as jest.Mock).mockReturnValue({ data: undefined, isError: true, refetch });
    await renderScreen();
    expect(screen.getByText(/Não foi possível carregar sua conta/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(refetch).toHaveBeenCalled();
  });
});
