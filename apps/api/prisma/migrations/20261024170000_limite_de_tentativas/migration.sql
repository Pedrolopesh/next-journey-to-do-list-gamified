-- Limite de tentativas por e-mail (e e-mail + IP): contadores compartilhados entre instâncias e deploys.
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");
