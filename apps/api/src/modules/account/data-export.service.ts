import { Inject, Injectable } from '@nestjs/common';
import { type DataExport, ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RateLimitService } from '../auth/rate-limit.service.js';
import { SecurityEvents } from '../security/security-events.service.js';

/** Exportações por conta: 3 por hora. */
const EXPORT_LIMIT = { limit: 3, windowMs: 60 * 60_000 };

const iso = (date: Date): string => date.toISOString();
const isoOrNull = (date: Date | null): string | null => (date ? date.toISOString() : null);

/**
 * Exportação dos dados da própria conta (LGPD, direito de acesso). Cada tabela entra por lista de campos
 * permitidos (`select` explícito): nunca o model inteiro e nunca hash de senha, token, código ou id no provedor.
 * Tudo filtra pelo `userId` do token.
 */
@Injectable()
export class DataExportService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(SecurityEvents) private readonly events: SecurityEvents,
  ) {}

  async export(userId: string): Promise<DataExport> {
    await this.rateLimit.hit('data-export', userId, EXPORT_LIMIT);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        notifyAt: true,
        createdAt: true,
        termsAcceptedAt: true,
        termsVersion: true,
        tutorialSeenAt: true,
        emailVerifiedAt: true,
        passwordHash: true,
        identities: { select: { provider: true } },
        stats: true,
        character: true,
      },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const [categories, items, checks, achievements, cosmetics, stories] = await Promise.all([
      this.prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, color: true, position: true, deletedAt: true },
        orderBy: { position: 'asc' },
      }),
      this.prisma.item.findMany({
        where: { userId },
        select: {
          id: true,
          categoryId: true,
          type: true,
          title: true,
          notes: true,
          difficulty: true,
          scheduleDays: true,
          dueAt: true,
          completedAt: true,
          createdOn: true,
          lastCheckedOn: true,
          streakCurrent: true,
          streakBest: true,
          isExample: true,
          createdAt: true,
          deletedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.itemCheck.findMany({
        where: { userId },
        select: {
          id: true,
          itemId: true,
          checkedOn: true,
          checkedAt: true,
          exp: true,
          coins: true,
          revertedAt: true,
        },
        orderBy: { checkedAt: 'asc' },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementSlug: true, unlockedAt: true },
        orderBy: { unlockedAt: 'asc' },
      }),
      this.prisma.userCosmetic.findMany({
        where: { userId },
        select: { cosmeticKey: true, source: true, unlockedAt: true },
        orderBy: { unlockedAt: 'asc' },
      }),
      this.prisma.storyProgress.findMany({
        where: { userId },
        select: {
          chapter: true,
          checksInChapter: true,
          completed: true,
          isActive: true,
          story: { select: { slug: true } },
        },
      }),
    ]);

    this.events.record('data_exported', { userId });

    const stats = user.stats;
    const character = user.character;
    return {
      exportedAt: iso(this.clock.now()),
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        notifyAt: user.notifyAt,
        createdAt: iso(user.createdAt),
        termsAcceptedAt: iso(user.termsAcceptedAt),
        termsVersion: user.termsVersion,
        tutorialSeenAt: isoOrNull(user.tutorialSeenAt),
        emailVerifiedAt: isoOrNull(user.emailVerifiedAt),
        signInMethods: [
          ...(user.passwordHash ? (['password'] as const) : []),
          ...user.identities.map((identity) => identity.provider),
        ],
      },
      progress: {
        level: stats?.level ?? 1,
        expInLevel: stats?.expInLevel ?? 0,
        expTotal: stats?.expTotal ?? 0,
        coins: stats?.coins ?? 0,
        totalChecks: stats?.totalChecks ?? 0,
        itemsCreated: stats?.itemsCreated ?? 0,
        lookChanges: stats?.lookChanges ?? 0,
        categoriesCreated: stats?.categoriesCreated ?? 0,
      },
      character: character
        ? {
            name: character.name,
            title: character.title,
            skin: character.skin,
            hair: character.hair,
            outfit: character.outfit,
            accessory: character.accessory,
            look: character.look,
          }
        : null,
      categories: categories.map((row) => ({ ...row, deletedAt: isoOrNull(row.deletedAt) })),
      items: items.map((row) => ({
        ...row,
        dueAt: isoOrNull(row.dueAt),
        completedAt: isoOrNull(row.completedAt),
        createdAt: iso(row.createdAt),
        deletedAt: isoOrNull(row.deletedAt),
      })),
      checks: checks.map((row) => ({
        ...row,
        checkedAt: iso(row.checkedAt),
        revertedAt: isoOrNull(row.revertedAt),
      })),
      achievements: achievements.map((row) => ({
        slug: row.achievementSlug,
        unlockedAt: iso(row.unlockedAt),
      })),
      cosmetics: cosmetics.map((row) => ({
        key: row.cosmeticKey,
        source: row.source,
        unlockedAt: iso(row.unlockedAt),
      })),
      stories: stories.map((row) => ({
        slug: row.story.slug,
        chapter: row.chapter,
        checksInChapter: row.checksInChapter,
        completed: row.completed,
        isActive: row.isActive,
      })),
    };
  }
}
