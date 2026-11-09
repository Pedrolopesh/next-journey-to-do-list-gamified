-- Password sign-in was removed: the reset links and the password hash are no longer used.
DROP TABLE "password_resets";

ALTER TABLE "users" DROP COLUMN "password_hash";
