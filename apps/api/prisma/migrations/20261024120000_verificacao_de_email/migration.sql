-- Verificação de e-mail no cadastro: estado na conta + códigos de confirmação.
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "verification_mail_sent_at" TIMESTAMPTZ;

-- Contas sociais ou sem senha já tiveram o e-mail verificado pelo provedor; as por senha ficam pendentes.
UPDATE "users" SET "email_verified_at" = "created_at"
WHERE "password_hash" IS NULL
   OR EXISTS (SELECT 1 FROM "auth_identities" WHERE "auth_identities"."user_id" = "users"."id");

CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications"("user_id");

ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
