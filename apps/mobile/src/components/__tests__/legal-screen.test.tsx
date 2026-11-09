import { LEGAL_VERSION, type LegalDocument } from '@nextjourney/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LegalScreen from '../../app/legal/[slug]';

const mockFetchLegalDocument = jest.fn();
let mockSlug = 'privacy';

jest.mock('@/api/endpoints', () => ({
  fetchLegalDocument: (...args: unknown[]): unknown => mockFetchLegalDocument(...args),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: mockSlug }),
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const DOCUMENT: LegalDocument = {
  slug: 'privacy',
  version: LEGAL_VERSION,
  title: 'Política de Privacidade',
  updatedAt: '2026-11-08',
  sections: [
    {
      heading: '1. Agente de tratamento',
      paragraphs: ['O controlador decide sobre o tratamento.'],
      bullets: ['Primeiro item da lista', 'Segundo item da lista'],
    },
    { heading: '2. Seus direitos', paragraphs: ['Você pode exercer os direitos.'], bullets: [] },
  ],
};

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LegalScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockFetchLegalDocument.mockReset();
  mockSlug = 'privacy';
});

describe('legal screen', () => {
  it('shows the text the API returned, with a heading per section', async () => {
    mockFetchLegalDocument.mockResolvedValue(DOCUMENT);
    await renderScreen();
    expect(await screen.findByText('O controlador decide sobre o tratamento.')).toBeTruthy();
    expect(mockFetchLegalDocument).toHaveBeenCalledWith('privacy');
    expect(screen.getByText(`Versão ${LEGAL_VERSION} · atualizado em 08/11/2026`)).toBeTruthy();
    expect(screen.getByText('Primeiro item da lista')).toBeTruthy();
    expect(screen.getByRole('header', { name: '1. Agente de tratamento' })).toBeTruthy();
    expect(screen.getByRole('header', { name: '2. Seus direitos' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Política de Privacidade' })).toBeTruthy();
  });

  it('shows an error with a retry button and loads the text on the retry', async () => {
    mockFetchLegalDocument.mockRejectedValueOnce(new Error('offline'));
    mockFetchLegalDocument.mockResolvedValueOnce(DOCUMENT);
    await renderScreen();
    expect(await screen.findByText(/Não foi possível carregar o texto/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Tentar de novo'));
    expect(await screen.findByText('Você pode exercer os direitos.')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText(/Não foi possível carregar o texto/)).toBeNull();
    });
  });

  it('an unknown document says so and never calls the API', async () => {
    mockSlug = 'cookies';
    await renderScreen();
    expect(screen.getByText('Documento não encontrado.')).toBeTruthy();
    expect(mockFetchLegalDocument).not.toHaveBeenCalled();
  });
});
