import { testDatabaseUrl } from './test-database.js';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_ACCESS_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres!'; // scan-allow: segredo falso só para testes
