-- Limpeza diária de tokens, links e códigos expirados filtra por "expires_at".
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");
