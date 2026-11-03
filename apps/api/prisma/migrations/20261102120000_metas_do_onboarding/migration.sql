-- AlterTable
ALTER TABLE "users" ADD COLUMN "goals" VARCHAR(20)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(20)[];

-- Keep the single goal that people already answered
UPDATE "users" SET "goals" = ARRAY["goal"] WHERE "goal" IS NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "goal";
