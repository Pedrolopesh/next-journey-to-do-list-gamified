import { render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import { OnboardingScreen } from '../onboarding-screen';

const mockSetOptions = jest.fn();

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect } = require('react') as typeof import('react');
  return {
    useRouter: () => ({ canGoBack: () => true, back: jest.fn() }),
    useNavigation: () => ({ setOptions: mockSetOptions }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      useEffect(effect, [effect]);
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  mockSetOptions.mockClear();
});

describe('OnboardingScreen back handling', () => {
  it('shows the back button and leaves the navigation alone by default', async () => {
    const add = jest.spyOn(BackHandler, 'addEventListener');
    await render(<OnboardingScreen title="Passo" />);
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();
    expect(mockSetOptions).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('hideBack only hides the button', async () => {
    const add = jest.spyOn(BackHandler, 'addEventListener');
    await render(<OnboardingScreen title="Passo" hideBack />);
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    expect(mockSetOptions).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('noReturn hides the button, turns the swipe off and swallows the Android back button', async () => {
    const remove = jest.fn();
    const add = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockReturnValue({ remove } as unknown as ReturnType<typeof BackHandler.addEventListener>);
    const { unmount } = await render(<OnboardingScreen title="Passo" noReturn />);
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    expect(mockSetOptions).toHaveBeenCalledWith({ gestureEnabled: false });
    expect(add).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    const handler = add.mock.calls[0]?.[1] as () => boolean;
    expect(handler()).toBe(true);
    await unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('the title is a heading for screen readers', async () => {
    await render(<OnboardingScreen title="Passo" />);
    expect(screen.getByRole('header', { name: 'Passo' })).toBeTruthy();
  });
});
