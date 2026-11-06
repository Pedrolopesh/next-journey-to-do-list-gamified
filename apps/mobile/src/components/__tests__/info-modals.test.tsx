import { fireEvent, render, screen } from '@testing-library/react-native';

import { CoinsInfoModal, LevelInfoModal } from '../info-modals';

describe('info modals', () => {
  it('coins: shows the balance and the game rules and closes', async () => {
    const onClose = jest.fn();
    await render(<CoinsInfoModal visible coins={7} onClose={onClose} />);
    expect(screen.getByText('Você tem 7 moedas.')).toBeTruthy();
    expect(screen.getByText(/fácil 1, médio 2, difícil 4/)).toBeTruthy();
    expect(screen.getByText(/ganhe 10 moedas de bônus/i)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('level: shows the current experience and what the level unlocks', async () => {
    const onClose = jest.fn();
    await render(
      <LevelInfoModal
        visible
        level={2}
        expInLevel={50}
        expForNextLevel={400}
        chapter={2}
        storySlug="beach"
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Nível 2')).toBeTruthy();
    expect(screen.getByText('50 de 400 EXP para o nível 3')).toBeTruthy();
    expect(screen.getByText(/fácil 5, médio 10, difícil 20/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
