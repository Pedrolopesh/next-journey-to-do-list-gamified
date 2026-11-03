import { render, screen } from '@testing-library/react-native';

import { IntroWelcome } from '../intro-welcome';
import { PixelTitle } from '../pixel-title';

jest.mock('@expo-google-fonts/pixelify-sans', () => ({
  PixelifySans_700Bold: 1,
  useFonts: () => [true, null],
}));

describe('intro welcome', () => {
  it('mostra a boas-vindas e os três passos', async () => {
    await render(<IntroWelcome />);
    expect(screen.getByText('Bem-vindo ao Next Journey')).toBeTruthy();
    expect(screen.getByText('personagem')).toBeTruthy();
    expect(screen.getByText('história')).toBeTruthy();
    expect(screen.getByText('e evolua')).toBeTruthy();
  });

  it('o título em duas linhas é lido como uma frase só', async () => {
    await render(<PixelTitle lead="Seja Bem vindo, A sua" accent="próxima Jornada" />);
    expect(screen.getByLabelText('Seja Bem vindo, A sua próxima Jornada')).toBeTruthy();
  });
});
