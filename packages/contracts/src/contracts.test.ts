import { describe, expect, it } from 'vitest';

import {
  apiErrorSchema,
  checkRequestSchema,
  checkResultSchema,
  createCategoryRequestSchema,
  createItemRequestSchema,
  DEFAULT_GAME_CONFIG,
  deleteAccountRequestSchema,
  emailConfirmRequestSchema,
  emailStartRequestSchema,
  ERROR_CODES,
  gameConfigSchema,
  localDateSchema,
  patchMeRequestSchema,
  playerStateSchema,
  putStoryRequestSchema,
  scheduleDaysSchema,
  timezoneSchema,
} from './index';

const categoryId = '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10';
describe('auth', () => {
  it('o pedido de código exige e-mail válido; fuso e versão dos Termos são opcionais', () => {
    expect(emailStartRequestSchema.safeParse({ email: 'pedro@exemplo.com' }).success).toBe(true);
    expect(
      emailStartRequestSchema.safeParse({
        email: 'pedro@exemplo.com',
        timezone: 'America/Sao_Paulo',
        termsVersion: '2026-11-08',
      }).success,
    ).toBe(true);
    expect(emailStartRequestSchema.safeParse({ email: 'x' }).success).toBe(false);
    expect(
      emailStartRequestSchema.safeParse({ email: 'pedro@exemplo.com', timezone: 'Marte/Olympus' })
        .success,
    ).toBe(false);
  });

  it('confirmação do código: exatamente 6 dígitos', () => {
    const base = { email: 'a@exemplo.com' };
    expect(emailConfirmRequestSchema.safeParse({ ...base, code: '012345' }).success).toBe(true);
    for (const code of ['12345', '1234567', '12345a', '']) {
      expect(emailConfirmRequestSchema.safeParse({ ...base, code }).success).toBe(false);
    }
  });
});

describe('itens', () => {
  it('diário exige dias da semana; tarefa aceita prazo; hábito não tem prazo', () => {
    const common = { title: 'Treinar', categoryId, difficulty: 'medium' };
    expect(
      createItemRequestSchema.safeParse({ ...common, type: 'daily', scheduleDays: [1, 3, 5] })
        .success,
    ).toBe(true);
    expect(createItemRequestSchema.safeParse({ ...common, type: 'daily' }).success).toBe(false);
    expect(
      createItemRequestSchema.safeParse({
        ...common,
        type: 'todo',
        dueAt: '2026-10-10T12:00:00-03:00',
      }).success,
    ).toBe(true);
    expect(createItemRequestSchema.safeParse({ ...common, type: 'habit' }).success).toBe(true);
  });

  it('dias da semana: 0 a 6, sem repetição', () => {
    expect(scheduleDaysSchema.safeParse([0, 6]).success).toBe(true);
    expect(scheduleDaysSchema.safeParse([7]).success).toBe(false);
    expect(scheduleDaysSchema.safeParse([1, 1]).success).toBe(false);
    expect(scheduleDaysSchema.safeParse([]).success).toBe(false);
  });
});

describe('check, jogo e erros', () => {
  it('checkId precisa ser UUID', () => {
    expect(
      checkRequestSchema.safeParse({ checkId: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10' }).success,
    ).toBe(true);
    expect(checkRequestSchema.safeParse({ checkId: 'abc' }).success).toBe(false);
  });

  it('CheckResult completo', () => {
    const result = {
      expGained: 10,
      coinsGained: 2,
      level: 3,
      leveledUp: false,
      chapterProgress: { chapter: 1, expInLevel: 20, expForNextLevel: 50 },
      chapterCompleted: false,
      completedChapter: null,
      achievementsUnlocked: [
        { slug: 'primeiro-passo', name: 'Primeiro passo', tier: 1, glyph: 'pegada' },
      ],
    };
    expect(checkResultSchema.safeParse(result).success).toBe(true);
  });

  it('o game_config inicial segue a especificação', () => {
    expect(gameConfigSchema.parse(DEFAULT_GAME_CONFIG)).toEqual(DEFAULT_GAME_CONFIG);
    expect(DEFAULT_GAME_CONFIG.expByDifficulty).toEqual({ easy: 5, medium: 10, hard: 20 });
    expect(DEFAULT_GAME_CONFIG.coinsByDifficulty).toEqual({ easy: 1, medium: 2, hard: 4 });
  });

  it('estado do jogador e formato de erro', () => {
    const state = {
      level: 1,
      expInLevel: 0,
      expTotal: 0,
      coins: 0,
      totalChecks: 0,
      story: { chapter: 1, completed: false },
    };
    expect(playerStateSchema.safeParse(state).success).toBe(true);
    expect(
      apiErrorSchema.safeParse({ code: ERROR_CODES.CHECK_LOCKED, message: 'x', requestId: 'r1' })
        .success,
    ).toBe(true);
  });

  it('datas e fusos', () => {
    expect(localDateSchema.safeParse('2026-10-09').success).toBe(true);
    expect(localDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(localDateSchema.safeParse('09/10/2026').success).toBe(false);
    expect(timezoneSchema.safeParse('America/Sao_Paulo').success).toBe(true);
  });
});

describe('fase 5: categorias, perfil e histórias', () => {
  it('categoria: nome de 1 a 30 caracteres e cor da paleta', () => {
    expect(createCategoryRequestSchema.safeParse({ name: 'Casa', color: '#10b981' }).success).toBe(
      true,
    );
    expect(createCategoryRequestSchema.safeParse({ name: '', color: '#10b981' }).success).toBe(
      false,
    );
    expect(
      createCategoryRequestSchema.safeParse({ name: 'x'.repeat(31), color: '#10b981' }).success,
    ).toBe(false);
    expect(createCategoryRequestSchema.safeParse({ name: 'Casa', color: '#123456' }).success).toBe(
      false,
    );
  });

  it('PATCH /me: fuso válido, tutorial visto e horário HH:MM', () => {
    expect(patchMeRequestSchema.safeParse({ timezone: 'America/Sao_Paulo' }).success).toBe(true);
    expect(patchMeRequestSchema.safeParse({ tutorialSeen: true, notifyAt: '08:30' }).success).toBe(
      true,
    );
    expect(patchMeRequestSchema.safeParse({ notifyAt: null }).success).toBe(true);
    expect(patchMeRequestSchema.safeParse({ notifyAt: '25:00' }).success).toBe(false);
    expect(patchMeRequestSchema.safeParse({ timezone: 'Marte/Olympus' }).success).toBe(false);
    expect(patchMeRequestSchema.safeParse({ tutorialSeen: false }).success).toBe(false);
  });

  it('escolher história exige o slug', () => {
    expect(putStoryRequestSchema.safeParse({ slug: 'empreendedor' }).success).toBe(true);
    expect(putStoryRequestSchema.safeParse({ slug: '' }).success).toBe(false);
  });

  it('exclusão de conta: código de e-mail ou provedor com ID token, nunca senha, vazio nem misturado', () => {
    expect(deleteAccountRequestSchema.safeParse({ emailCode: '012345' }).success).toBe(true);
    expect(
      deleteAccountRequestSchema.safeParse({ provider: 'google', idToken: 'token' }).success,
    ).toBe(true);
    for (const body of [
      {},
      { password: 'Teste#1234' }, // scan-allow: senha falsa de teste
      { emailCode: '12345' },
      { provider: 'github', idToken: 'x' },
      { provider: 'apple' },
    ]) {
      expect(deleteAccountRequestSchema.safeParse(body).success).toBe(false);
    }
  });
});

describe('create item', () => {
  it('no longer accepts marking an item as an example: the server creates them', () => {
    const parsed = createItemRequestSchema.parse({
      type: 'habit',
      title: 'Beber água',
      categoryId: '11111111-1111-4111-8111-111111111111',
      difficulty: 'easy',
      example: true,
    });
    expect('example' in parsed).toBe(false);
  });
});
