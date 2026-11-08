import { testDatabaseUrl } from './test-database.js';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_ACCESS_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres!'; // scan-allow: fake secret for tests only
// Tests make many calls in a row: the limit is only tested in throttle.e2e-spec
process.env.THROTTLE_LIMIT = '100000';
process.env.THROTTLE_AUTH_LIMIT = '100000';
// The time floor of the account routes is only tested in test/constant-time.e2e-spec
process.env.AUTH_MIN_RESPONSE_MS = '0';
process.env.SEED_STARTER_ITEMS = 'false';
