import type { MeResponse } from '@nextjourney/contracts';
import { render, screen } from '@testing-library/react-native';

import { StoryProgressCard } from '../story-progress-card';

const base = {
  user: { id: 'u', name: 'P', email: 'p@exemplo.com', timezone: 'UTC', notifyAt: null },
  player: {
    level: 3,
    expInLevel: 50,
    expTotal: 300,
    coins: 42,
    totalChecks: 30,
    story: { chapter: 3, completed: false },
    expForNextLevel: 200,
  },
  character: null,
  story: { slug: 'beach', name: 'Praia', themeColor: '#0ea5e9', chapterTitle: 'O barco' },
  onboarding: { tutorialSeen: true, hasCharacter: true, hasStory: true },
} as unknown as MeResponse;

let mockMe: MeResponse | undefined = base;
jest.mock('@/api/queries', () => ({
  ...jest.requireActual<object>('@/api/queries'),
  useMe: () => ({ data: mockMe }),
}));

describe('StoryProgressCard', () => {
  it('mostra nome, capítulo, nível, moedas e a EXP do nível', async () => {
    mockMe = base;
    await render(<StoryProgressCard showCoins />);
    expect(screen.getByText('Praia')).toBeTruthy();
    expect(screen.getByText('Capítulo 3: O barco')).toBeTruthy();
    expect(screen.getByText('Nível 3')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('50/200 EXP')).toBeTruthy();
    expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 25 });
  });

  it('sem showCoins não mostra o saldo (a Home já tem o indicador)', async () => {
    mockMe = base;
    await render(<StoryProgressCard />);
    expect(screen.queryByText('42')).toBeNull();
  });

  it('história concluída mostra a barra cheia', async () => {
    mockMe = { ...base, player: { ...base.player, story: { chapter: 5, completed: true } } };
    await render(<StoryProgressCard />);
    expect(screen.getByText('História concluída')).toBeTruthy();
    expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 100 });
  });

  it('sem dados não desenha nada', async () => {
    mockMe = undefined;
    await render(<StoryProgressCard />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
