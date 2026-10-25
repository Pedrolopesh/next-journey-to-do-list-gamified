-- Lista de sessões: nome do aparelho de cada sessão (família de refresh tokens).
ALTER TABLE "refresh_tokens" ADD COLUMN "device_name" VARCHAR(80);
