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
  it('checking shows the toast and adds the coins; unchecking removes coins and keeps the EXP', async () => {
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

  it('checking again gives the coins back, but the EXP only counts once', async () => {
    jest.spyOn(toast, 'warning').mockImplementation(() => undefined);
    await render(<IntroCheckDemo />);
    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Desmarcar Estudar/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    expect(screen.getByText('20/200 EXP')).toBeTruthy();
  });
});

describe('intro slides', () => {
  it('shows the three kinds of item', async () => {
    await render(<IntroItemTypes />);
    expect(screen.getByText('Diários')).toBeTruthy();
    expect(screen.getByText('Tarefas')).toBeTruthy();
    expect(screen.getByText('Hábitos')).toBeTruthy();
  });

  it('shows the rewards with images only, without the EXP and Moedas texts', async () => {
    await render(<IntroRewards />);
    expect(screen.getByLabelText(/EXP: a barra enche/)).toBeTruthy();
    expect(screen.getByLabelText(/Moedas: cada item/)).toBeTruthy();
    expect(screen.queryByText('EXP')).toBeNull();
    expect(screen.queryByText('Moedas')).toBeNull();
  });
});
