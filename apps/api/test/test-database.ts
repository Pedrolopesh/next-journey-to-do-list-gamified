/** Database of the e2e tests: TEST_DATABASE_URL, or the .env DATABASE_URL with the database swapped for *_test. */
export function testDatabaseUrl(): string {
  try {
    process.loadEnvFile('.env');
  } catch {
    // without .env: CI sets TEST_DATABASE_URL
  }
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('Defina TEST_DATABASE_URL ou DATABASE_URL para os testes e2e');
  const url = new URL(base);
  url.pathname = '/nextjourney_test';
  return url.toString();
}
