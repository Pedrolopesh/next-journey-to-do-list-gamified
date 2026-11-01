-- AlterTable
ALTER TABLE "users" ADD COLUMN "goal" VARCHAR(20),
ADD COLUMN "age_range" VARCHAR(10),
ADD COLUMN "gender" VARCHAR(10),
ADD COLUMN "reminders_opt_in" BOOLEAN;

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "character_class" VARCHAR(20);
