import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { STARTER_ITEMS } from '../src/modules/items/starter-items.js';
import { StarterItemsService } from '../src/modules/items/starter-items.service.js';
import {
  bearer,
  check,
  createTestApp,
  FakeVerifier,
  PASSWORD,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const TOTAL = STARTER_ITEMS.length;

describe('starter items created by the server', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier, seedStarterItems: true });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const itemsOf = (userId: string) => ctx.prisma.item.findMany({ where: { userId } });
  const social = (email: string) => {
    verifier.identity = {
      subject: `g-${email}`,
      email,
      emailVerified: true,
      name: 'Pessoa Social',
    };
    return ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '2026-10-01', timezone: 'America/Sao_Paulo' });
  };

  it('email confirmation creates the starter items, marked as examples, in the default category', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    const items = await itemsOf(auth.user.id);
    expect(items).toHaveLength(TOTAL);
    expect(items.every((item) => item.isExample)).toBe(true);
    const categories = await ctx.prisma.category.findMany({ where: { userId: auth.user.id } });
    const water = items.find((item) => item.title === 'Beber 2 litros de água');
    expect(categories.find((c) => c.id === water?.categoryId)?.name).toBe('Saúde');
    expect(water?.scheduleDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(water?.createdOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const list = await ctx
      .http()
      .get('/v1/items?type=daily')
      .set('authorization', bearer(auth))
      .expect(200);
    expect((list.body as unknown[]).length).toBe(
      STARTER_ITEMS.filter((item) => item.type === 'daily').length,
    );
  });

  it('starter items do not count as created and unlock no creation achievement', async () => {
    const auth = await registerUser(ctx);
    const stats = await ctx.prisma.userStats.findUniqueOrThrow({ where: { userId: auth.user.id } });
    expect(stats.itemsCreated).toBe(0);
    const unlocked = await ctx.prisma.userAchievement.findMany({ where: { userId: auth.user.id } });
    expect(unlocked).toEqual([]);
  });

  it('the first check on a starter item unlocks only the check achievements', async () => {
    const auth = await registerUser(ctx);
    const habit = await ctx.prisma.item.findFirstOrThrow({
      where: { userId: auth.user.id, type: 'habit' },
    });
    await check(ctx, auth, habit.id).expect(200);
    const slugs = (
      await ctx.prisma.userAchievement.findMany({ where: { userId: auth.user.id } })
    ).map((row) => row.achievementSlug);
    expect(slugs).toContain('primeiro-passo');
    expect(slugs).not.toContain('primeiro-habito');
  });

  it('social login creates the account with the starter items and a second sign-in does not duplicate', async () => {
    const email = uniqueEmail('social');
    const first = await social(email).expect(200);
    expect(await itemsOf(first.body.user.id)).toHaveLength(TOTAL);
    await social(email).expect(200);
    expect(await itemsOf(first.body.user.id)).toHaveLength(TOTAL);
  });

  it('linking a social login to a pending account confirms it and seeds once', async () => {
    const email = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    const res = await social(email).expect(200);
    expect(await itemsOf(res.body.user.id)).toHaveLength(TOTAL);
  });

  it('seeding the same account again does not duplicate the starter items', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    const service = ctx.app.get(StarterItemsService);
    const created = await ctx.prisma.$transaction((tx) =>
      service.seed(tx, { userId: auth.user.id, timezone: 'UTC', now: ctx.clock.now() }),
    );
    expect(created).toBe(0);
    expect(await itemsOf(auth.user.id)).toHaveLength(TOTAL);
  });

  it('the starter items come back in catalog order', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    const list = await ctx
      .http()
      .get('/v1/items?type=daily')
      .set('authorization', bearer(auth))
      .expect(200);
    const titles = (list.body as { title: string }[]).map((item) => item.title);
    expect(titles).toEqual(
      STARTER_ITEMS.filter((item) => item.type === 'daily').map((item) => item.title),
    );
  });

  it('password login and linking to an already confirmed account do not seed', async () => {
    const email = uniqueEmail();
    const auth = await registerUser(ctx, email, { story: false });
    await ctx.prisma.item.deleteMany({ where: { userId: auth.user.id } });
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: PASSWORD }) // scan-allow: fake test password
      .expect(200);
    await social(email).expect(200);
    expect(await itemsOf(auth.user.id)).toHaveLength(0);
  });

  it('a wrong code seeds nothing and the account stays pending', async () => {
    const email = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    await ctx
      .http()
      .post('/v1/auth/verify-email')
      .send({ email, code: '000000', password: PASSWORD }) // scan-allow: fake test password
      .expect(400);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).toBeNull();
    expect(await itemsOf(user.id)).toHaveLength(0);
  });

  it('a seeding failure keeps the account pending and the same code valid', async () => {
    const email = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    const code = ctx.mailer.lastVerificationCode(email) ?? '';
    const body = { email, code, password: PASSWORD }; // scan-allow: fake test password
    const spy = vi
      .spyOn(ctx.app.get(StarterItemsService), 'seed')
      .mockRejectedValueOnce(new Error('simulated failure'));
    await ctx.http().post('/v1/auth/verify-email').send(body).expect(500);
    spy.mockRestore();
    const pending = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(pending.emailVerifiedAt).toBeNull();
    expect(await itemsOf(pending.id)).toHaveLength(0);

    await ctx.http().post('/v1/auth/verify-email').send(body).expect(200);
    expect(await itemsOf(pending.id)).toHaveLength(TOTAL);
  });
});

describe('starter items with the option off', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp({ seedStarterItems: false });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('the account is confirmed with no starter items', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    expect(await ctx.prisma.item.count({ where: { userId: auth.user.id } })).toBe(0);
  });
});
