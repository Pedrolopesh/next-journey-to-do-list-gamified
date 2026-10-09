import { fireEvent, render, screen } from '@testing-library/react-native';

import { Pills } from '../pills';
import { EmptyState, ErrorState } from '../states';

describe('Pills', () => {
  it('seleciona uma opção e ignora as bloqueadas', async () => {
    const onChange = jest.fn();
    await render(
      <Pills
        label="Roupa"
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Túnica' },
          { value: 'b', label: 'Capa', disabled: true },
          { value: 'c', label: 'Armadura' },
        ]}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Roupa: Armadura' }));
    expect(onChange).toHaveBeenCalledWith('c');
    await fireEvent.press(screen.getByRole('button', { name: 'Roupa: Capa' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('estados de lista', () => {
  it('vazio mostra título e dica; erro oferece tentar de novo', async () => {
    const onRetry = jest.fn();
    await render(
      <>
        <EmptyState title="Nenhum diário ainda" hint="Crie diários" />
        <ErrorState
          message="Não foi possível carregar."
          retryLabel="Tentar de novo"
          onRetry={onRetry}
        />
      </>,
    );
    expect(screen.getByText('Nenhum diário ainda')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
