import type { Item } from '@nextjourney/contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ItemRow } from '../item-row';

const base: Item = {
  id: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  type: 'daily',
  title: 'Treinar',
  notes: null,
  categoryId: '4f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  difficulty: 'medium',
  scheduleDays: [0, 1, 2, 3, 4, 5, 6],
  dueAt: null,
  doneToday: false,
  overdue: false,
  streak: 0,
  checksToday: 0,
  checksThisWeek: 0,
};

describe('ItemRow', () => {
  it('toque no check chama onCheck com o item', async () => {
    const onCheck = jest.fn();
    await render(<ItemRow item={base} onCheck={onCheck} />);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Marcar Treinar' }));
    expect(onCheck).toHaveBeenCalledWith(base);
  });

  it('diário feito fica marcado e bloqueado; hábito feito continua marcável', async () => {
    const onCheck = jest.fn();
    const { rerender } = await render(
      <ItemRow item={{ ...base, doneToday: true }} onCheck={onCheck} />,
    );
    const done = screen.getByRole('checkbox', { name: 'Treinar concluído hoje' });
    expect(done.props.accessibilityState).toMatchObject({ checked: true, disabled: true });

    await rerender(
      <ItemRow
        item={{ ...base, type: 'habit', doneToday: true, checksToday: 2 }}
        onCheck={onCheck}
        counters
      />,
    );
    await fireEvent.press(screen.getByRole('checkbox'));
    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Hoje 2 · Semana 0')).toBeTruthy();
  });

  it('mostra atraso e sequência, e o Desfazer só quando há check de hoje', async () => {
    const onUndo = jest.fn();
    await render(
      <ItemRow item={{ ...base, overdue: true, streak: 3 }} onCheck={jest.fn()} onUndo={onUndo} />,
    );
    expect(screen.getByText('Atrasado')).toBeTruthy();
    expect(screen.getByLabelText('3 dias seguidos')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Desfazer' }));
    expect(onUndo).toHaveBeenCalledWith(expect.objectContaining({ title: 'Treinar' }));
  });
});
