import { fireEvent, render, screen } from '@testing-library/react-native';

import { AchievementUnlockedModal } from '../achievement-unlocked-modal';

const base = {
  visible: true,
  name: 'Primeiro passo',
  description: 'Faça o seu primeiro check',
  glyph: 'pegada',
  tierColor: '#cd7f32',
};

describe('AchievementUnlockedModal', () => {
  it('shows the title, the achievement and the encouragement', async () => {
    await render(
      <AchievementUnlockedModal {...base} onContinue={jest.fn()} onSeeAll={jest.fn()} />,
    );
    expect(screen.getByText('Conquista desbloqueada!')).toBeTruthy();
    expect(screen.getByText('Primeiro passo')).toBeTruthy();
    expect(screen.getByText('Faça o seu primeiro check')).toBeTruthy();
    expect(screen.getByText(/ainda há muitas conquistas/)).toBeTruthy();
  });

  it('continue and close only close; see all opens the gallery', async () => {
    const onContinue = jest.fn();
    const onSeeAll = jest.fn();
    await render(
      <AchievementUnlockedModal {...base} onContinue={onContinue} onSeeAll={onSeeAll} />,
    );
    await fireEvent.press(screen.getByLabelText('Continuar'));
    await fireEvent.press(screen.getByLabelText('Fechar'));
    expect(onContinue).toHaveBeenCalledTimes(2);
    expect(onSeeAll).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Ver todas as conquistas'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('without a description, it does not show an empty line', async () => {
    await render(
      <AchievementUnlockedModal
        {...base}
        description={undefined}
        onContinue={jest.fn()}
        onSeeAll={jest.fn()}
      />,
    );
    expect(screen.queryByText('Faça o seu primeiro check')).toBeNull();
  });
});
