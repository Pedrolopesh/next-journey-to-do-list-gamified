import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { verifyEmail } from '@/api/endpoints';
import { usePendingVerificationStore } from '@/auth/pending-verification-store';
import { useSessionStore } from '@/auth/session-store';
import { useToastStore } from '@/features/feedback/toast-store';

import VerifyEmailScreen from '../../app/(auth)/verify-email';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{`redireciona:${href}`}</Text>;
  },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
jest.mock('@/api/endpoints', () => ({
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
}));

const auth = {
  tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
  user: {
    id: '5f0f4d4e-6b43-4f5e-9f55-0d1c1b8a8b11',
    name: 'Pessoa',
    email: 'pessoa@exemplo.com',
    timezone: 'UTC',
  },
};

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ current: null });
    usePendingVerificationStore.setState({
      pending: { email: 'pessoa@exemplo.com', password: 'Teste#1234' }, // scan-allow: senha falsa
    });
  });

  it('sem cadastro pendente na memória volta ao login', async () => {
    usePendingVerificationStore.setState({ pending: null });
    await render(<VerifyEmailScreen />);
    expect(screen.getByText('redireciona:/login')).toBeTruthy();
  });

  it('código incompleto mostra erro de campo e toast, sem chamar a API', async () => {
    await render(<VerifyEmailScreen />);
    await fireEvent.changeText(screen.getByLabelText('Código'), '123');
    await fireEvent.press(screen.getByLabelText('Confirmar'));
    expect(screen.getByText('Digite os 6 dígitos do código')).toBeTruthy();
    expect(useToastStore.getState().current?.kind).toBe('error');
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it('código certo confirma o e-mail, grava a sessão e limpa a memória', async () => {
    (verifyEmail as jest.Mock).mockResolvedValue(auth);
    const setSession = jest.spyOn(useSessionStore.getState(), 'setSession').mockResolvedValue();
    await render(<VerifyEmailScreen />);
    await fireEvent.changeText(screen.getByLabelText('Código'), '12a3456');
    await fireEvent.press(screen.getByLabelText('Confirmar'));
    await waitFor(() => {
      expect(setSession).toHaveBeenCalledWith(auth);
    });
    expect(verifyEmail).toHaveBeenCalledWith({
      email: 'pessoa@exemplo.com',
      code: '123456',
      password: 'Teste#1234', // scan-allow: senha falsa de teste
    });
    expect(usePendingVerificationStore.getState().pending).toBeNull();
  });

  it('reenvio começa bloqueado com contagem regressiva', async () => {
    await render(<VerifyEmailScreen />);
    expect(screen.getByLabelText('Reenviar código em 60s')).toBeTruthy();
  });
});
