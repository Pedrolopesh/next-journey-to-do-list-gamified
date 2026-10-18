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
  it('mostra o título, a conquista e o incentivo', async () => {
    await render(
      <AchievementUnlockedModal {...base} onContinue={jest.fn()} onSeeAll={jest.fn()} />,
    );
    expect(screen.getByText('Conquista desbloqueada!')).toBeTruthy();
    expect(screen.getByText('Primeiro passo')).toBeTruthy();
    expect(screen.getByText('Faça o seu primeiro check')).toBeTruthy();
    expect(screen.getByText(/ainda há muitas conquistas/)).toBeTruthy();
  });

  it('continuar e fechar só fecham; ver todas abre a galeria', async () => {
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

  it('sem descrição, não mostra linha vazia', async () => {
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
