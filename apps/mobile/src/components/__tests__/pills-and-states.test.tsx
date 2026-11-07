import { IconCalendarCheck } from '@tabler/icons-react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Pills } from '../pills';
import { EmptyState, ErrorState } from '../states';

describe('Pills', () => {
  it('selects an option and ignores the locked ones', async () => {
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

describe('list states', () => {
  it('empty shows a title and a hint; error offers a retry', async () => {
    const onRetry = jest.fn();
    await render(
      <>
        <EmptyState title="Nenhum diário ainda" hint="Crie diários" icon={IconCalendarCheck} />
        <ErrorState
          message="Não foi possível carregar."
          retryLabel="Tentar de novo"
          onRetry={onRetry}
        />
      </>,
    );
    expect(screen.getByText('Nenhum diário ainda')).toBeTruthy();
    expect(screen.getByText('Crie diários')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
