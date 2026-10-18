-- AlterTable
ALTER TABLE "achievements" ADD COLUMN     "glyph" TEXT NOT NULL DEFAULT 'pegada',
ADD COLUMN     "secret" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "trail" TEXT NOT NULL DEFAULT 'inicio',
DROP COLUMN "icon_key",
DROP COLUMN "reward_key";

-- O catálogo é regravado pelo seed; sem valor padrão no banco
ALTER TABLE "achievements" ALTER COLUMN "glyph" DROP DEFAULT,
ALTER COLUMN "tier" DROP DEFAULT,
ALTER COLUMN "trail" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_achievements" ADD COLUMN     "notified_at" TIMESTAMPTZ;

-- As conquistas que já existem foram avisadas na época
UPDATE "user_achievements" SET "notified_at" = "unlocked_at";

-- AlterTable
ALTER TABLE "user_stats" ADD COLUMN     "categories_created" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "look_changes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminder_enabled_at" TIMESTAMPTZ;

-- Fim das recompensas de item (eram de teste): quem usava uma peça volta ao padrão
UPDATE "characters" SET "outfit" = 'tunic-purple' WHERE "outfit" IN ('outfit-special', 'outfit-cape');
UPDATE "characters" SET "accessory" = NULL
WHERE "accessory" IN ('accessory-bandana', 'weapon-silver-sword', 'accessory-shield');
DELETE FROM "user_cosmetics"
WHERE "cosmetic_key" IN ('outfit-special', 'outfit-cape', 'accessory-bandana', 'weapon-silver-sword', 'accessory-shield');
