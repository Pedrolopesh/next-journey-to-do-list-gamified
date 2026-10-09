import { describe, expect, it } from 'vitest';

import {
  apiErrorSchema,
  checkRequestSchema,
  checkResultSchema,
  createItemRequestSchema,
  DEFAULT_GAME_CONFIG,
  ERROR_CODES,
  gameConfigSchema,
  localDateSchema,
  loginRequestSchema,
  PASSWORD_RULES,
  playerStateSchema,
  registerRequestSchema,
  scheduleDaysSchema,
  timezoneSchema,
} from './index';

const categoryId = '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10';
const validRegister = {
  name: 'Pedro',
  email: 'pedro@exemplo.com',
  password: 'Senha#123', // scan-allow: senha falsa de teste
  confirmPassword: 'Senha#123', // scan-allow: senha falsa de teste
  acceptedTerms: true,
  termsVersion: '2026-10-01',
  timezone: 'America/Sao_Paulo',
};

describe('auth', () => {
  it('aceita um cadastro válido', () => {
    expect(registerRequestSchema.safeParse(validRegister).success).toBe(true);
  });

  it('rejeita senha sem maiúscula, número ou caractere especial, ou curta', () => {
    for (const password of ['senha#123', 'Senha#abc', 'Senha1234', 'Se#1']) {
      expect(
        registerRequestSchema.safeParse({ ...validRegister, password, confirmPassword: password })
          .success,
      ).toBe(false);
    }
    expect(PASSWORD_RULES).toHaveLength(4);
  });

  it('rejeita senhas diferentes, termos não aceitos e fuso inválido', () => {
    expect(
      registerRequestSchema.safeParse({
        ...validRegister,
        confirmPassword: 'Outra#123' /* scan-allow */,
      }).success,
    ).toBe(false);
    expect(
      registerRequestSchema.safeParse({ ...validRegister, acceptedTerms: false }).success,
    ).toBe(false);
    expect(
      registerRequestSchema.safeParse({ ...validRegister, timezone: 'Marte/Olympus' }).success,
    ).toBe(false);
  });

  it('login exige e-mail válido', () => {
    expect(loginRequestSchema.safeParse({ email: 'x', password: 'a' }).success).toBe(false);
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
      chapterProgress: { chapter: 1, checksInChapter: 4, requiredChecks: 10 },
      chapterCompleted: false,
      achievementsUnlocked: [{ slug: 'primeiro-passo', name: 'Primeiro passo' }],
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
      story: { chapter: 1, checksInChapter: 0, completed: false },
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
