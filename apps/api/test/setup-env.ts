import { testDatabaseUrl } from './test-database.js';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_ACCESS_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres!'; // scan-allow: segredo falso só para testes
// Os testes fazem muitas chamadas seguidas: o limite só é testado no throttle.e2e-spec
process.env.THROTTLE_LIMIT = '100000';
process.env.THROTTLE_AUTH_LIMIT = '100000';
