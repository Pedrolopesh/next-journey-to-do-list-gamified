import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { toast } from '@/features/feedback/toast-store';
import { DEFAULT_LOOK } from '@/features/qg/options';

import { IntroCheckDemo } from '../intro-demos';

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
  it('marcar mostra o toast, soma as moedas e move o personagem; desmarcar tira moedas e mantém o EXP', async () => {
    const warn = jest.spyOn(toast, 'warning').mockImplementation(() => undefined);
    await render(<IntroCheckDemo look={DEFAULT_LOOK} />);

    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    expect(screen.getByText('+20 EXP · +4 moedas')).toBeTruthy();
    expect(screen.getByText('20/200 EXP')).toBeTruthy();
    expect(mockSend).toHaveBeenCalledWith({
      v: 1,
      type: 'ITEM_CHECKED',
      payload: { progress: 0.1 },
    });

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
    await render(<IntroCheckDemo look={DEFAULT_LOOK} />);
    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Desmarcar Estudar/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Marcar Estudar/ }));
    expect(screen.getByText('20/200 EXP')).toBeTruthy();
  });
});
