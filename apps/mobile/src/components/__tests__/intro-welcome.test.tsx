import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { IntroWelcome } from '../intro-welcome';
import { PixelTitle } from '../pixel-title';

jest.mock('@expo-google-fonts/pixelify-sans', () => ({
  PixelifySans_700Bold: 1,
  useFonts: () => [true, null],
}));

// With "reduce motion" on nothing animates, so no timer is left running after the test
beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});

describe('intro welcome', () => {
  it('shows the welcome and the three steps', async () => {
    await render(<IntroWelcome />);
    expect(screen.getByText(/cada tarefa que você conclui é um passo/)).toBeTruthy();
    expect(screen.queryByText('Bem-vindo ao Next Journey')).toBeNull();
    expect(screen.getByText('personagem')).toBeTruthy();
    expect(screen.getByText('história')).toBeTruthy();
    expect(screen.getByText('e evolua')).toBeTruthy();
  });

  it('the two-line title is read as a single sentence', async () => {
    await render(<PixelTitle lead="Seja Bem vindo, A sua" accent="próxima Jornada" />);
    expect(screen.getByLabelText('Seja Bem vindo, A sua próxima Jornada')).toBeTruthy();
  });
});
