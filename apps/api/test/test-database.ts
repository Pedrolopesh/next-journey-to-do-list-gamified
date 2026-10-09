/** Banco dos testes e2e: TEST_DATABASE_URL, ou o DATABASE_URL do .env com o banco trocado por *_test. */
export function testDatabaseUrl(): string {
  try {
    process.loadEnvFile('.env');
  } catch {
    // sem .env: o CI define TEST_DATABASE_URL
  }
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('Defina TEST_DATABASE_URL ou DATABASE_URL para os testes e2e');
  const url = new URL(base);
  url.pathname = '/nextjourney_test';
  return url.toString();
}
