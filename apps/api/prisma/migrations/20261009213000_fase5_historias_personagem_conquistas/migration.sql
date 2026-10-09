-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notify_at" VARCHAR(5),
ADD COLUMN     "tutorial_seen_at" TIMESTAMPTZ,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_stats" DROP COLUMN "story_chapter",
DROP COLUMN "story_checks_in_chapter",
DROP COLUMN "story_completed";

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skin" TEXT NOT NULL,
    "hair" TEXT NOT NULL,
    "outfit" TEXT NOT NULL,
    "accessory" TEXT,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme_color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "scene_key" TEXT NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_progress" (
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "chapter" INTEGER NOT NULL DEFAULT 1,
    "checks_in_chapter" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_progress_pkey" PRIMARY KEY ("user_id","story_id")
);

-- CreateTable
CREATE TABLE "chapter_completions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key" TEXT NOT NULL,
    "reward_key" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "user_id" UUID NOT NULL,
    "achievement_slug" TEXT NOT NULL,
    "unlocked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id","achievement_slug")
);

-- CreateTable
CREATE TABLE "user_cosmetics" (
    "user_id" UUID NOT NULL,
    "cosmetic_key" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "unlocked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cosmetics_pkey" PRIMARY KEY ("user_id","cosmetic_key")
);

-- CreateIndex
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_provider_user_id_key" ON "auth_identities"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stories_slug_key" ON "stories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_story_id_number_key" ON "chapters"("story_id", "number");

-- CreateIndex
CREATE INDEX "story_progress_user_id_is_active_idx" ON "story_progress"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_completions_user_id_chapter_id_key" ON "chapter_completions"("user_id", "chapter_id");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_completions" ADD CONSTRAINT "chapter_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_completions" ADD CONSTRAINT "chapter_completions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_slug_fkey" FOREIGN KEY ("achievement_slug") REFERENCES "achievements"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cosmetics" ADD CONSTRAINT "user_cosmetics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

