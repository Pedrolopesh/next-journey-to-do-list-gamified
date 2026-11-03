import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { toast } from '@/features/feedback/toast-store';

import { IntroCheckDemo, IntroItemTypes, IntroRewards } from '../intro-demos';

// The banner is a WebView: its behavior has its own tests, here only the messages matter
const mockSend = jest.fn();
jest.mock('@/banner/banner-view', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  return {
    QG_ASPECT_RATIO: 1.77,
    BannerView: react.forwardRef(function MockBannerView(_props: unknown, ref: React.Ref<unknown>) {
      react.useImperativeHandle(ref, () => ({ send: mockSend, reset: jest.fn() }));
      return null;
    }),
  };
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('IntroCheckDemo', () => {
  it('marcar mostra o toast e soma as moedas; desmarcar tira moedas e mantém o EXP', async () => {
    const warn = jest.spyOn(toast, 'warning').mockImplementation(() => undefined);
    await render(<IntroCheckDemo />);

    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    expect(screen.getByText('+20 EXP · +4 moedas')).toBeTruthy();
    expect(screen.getByText('20/200 EXP')).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByRole('checkbox', { name: /Desmarcar Estudar/ }));
    });
    // Coins go down, the EXP stays where it was
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('3 moedas'));
    expect(screen.getByText('20/200 EXP')).toBeTruthy();
    warn.mockRestore();
  });

  it('marcar de novo devolve as moedas, mas o EXP só conta uma vez', async () => {
    jest.spyOn(toast, 'warning').mockImplementation(() => undefined);
    await render(<IntroCheckDemo />);
    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Desmarcar Estudar/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    expect(screen.getByText('20/200 EXP')).toBeTruthy();
  });
});

describe('intro slides', () => {
  it('mostra os três tipos de item', async () => {
    await render(<IntroItemTypes />);
    expect(screen.getByText('Diários')).toBeTruthy();
    expect(screen.getByText('Tarefas')).toBeTruthy();
    expect(screen.getByText('Hábitos')).toBeTruthy();
  });

  it('mostra as recompensas só com imagem, sem os textos EXP e Moedas', async () => {
    await render(<IntroRewards />);
    expect(screen.getByLabelText(/EXP: a barra enche/)).toBeTruthy();
    expect(screen.getByLabelText(/Moedas: cada item/)).toBeTruthy();
    expect(screen.queryByText('EXP')).toBeNull();
    expect(screen.queryByText('Moedas')).toBeNull();
  });
});
