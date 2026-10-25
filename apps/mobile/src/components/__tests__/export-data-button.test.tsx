import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { Share } from 'react-native';

import { fetchDataExport } from '@/api/endpoints';
import { useToastStore } from '@/features/feedback/toast-store';

import { ExportDataButton } from '../export-data-button';

jest.mock('@/api/endpoints', () => ({ fetchDataExport: jest.fn() }));

describe('ExportDataButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ current: null });
  });

  it('busca os dados, abre a folha de compartilhamento e avisa', async () => {
    (fetchDataExport as jest.Mock).mockResolvedValue({ account: { name: 'Pessoa' } });
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<ExportDataButton />);
    await fireEvent.press(screen.getByLabelText('Exportar meus dados'));
    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    const { message } = share.mock.calls[0]![0] as { message: string };
    expect(JSON.parse(message)).toEqual({ account: { name: 'Pessoa' } });
    expect(useToastStore.getState().current?.message).toBe(
      'Seus dados estão prontos para compartilhar.',
    );
  });

  it('muitos pedidos (429): avisa com a mensagem de limite e não abre a folha', async () => {
    (fetchDataExport as jest.Mock).mockRejectedValue(
      new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 429,
        data: { code: 'RATE_LIMITED', message: 'x' },
        statusText: '',
        headers: {},
        config: { headers: {} } as never,
      }),
    );
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<ExportDataButton />);
    await fireEvent.press(screen.getByLabelText('Exportar meus dados'));
    await waitFor(() => {
      expect(useToastStore.getState().current?.kind).toBe('error');
    });
    expect(useToastStore.getState().current?.message).toMatch(/Muitas tentativas/);
    expect(share).not.toHaveBeenCalled();
  });
});
