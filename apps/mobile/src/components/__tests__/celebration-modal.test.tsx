import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CelebrationModal } from '../celebration-modal';

describe('CelebrationModal', () => {
  it('shows the texts, the extra content and calls the actions', async () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();
    const onClose = jest.fn();
    await render(
      <CelebrationModal
        visible
        tone="#7c3aed"
        art={<Text>troféu</Text>}
        headline="Nível 2!"
        title="Você subiu de nível!"
        description="Continue assim."
        primaryLabel="Continuar"
        onPrimary={onPrimary}
        secondaryLabel="Ver tudo"
        onSecondary={onSecondary}
        onClose={onClose}
      >
        <Text>extra</Text>
      </CelebrationModal>,
    );
    expect(screen.getByText('Nível 2!')).toBeTruthy();
    expect(screen.getByText('Você subiu de nível!')).toBeTruthy();
    expect(screen.getByText('extra')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ver tudo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('without a secondary action it shows only the main button', async () => {
    await render(
      <CelebrationModal
        visible
        tone="#7c3aed"
        art={<Text>troféu</Text>}
        headline="Capítulo 1 concluído"
        primaryLabel="Continuar"
        onPrimary={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Ver tudo' })).toBeNull();
  });
});
