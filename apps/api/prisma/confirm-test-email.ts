import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // sem .env
}

/**
 * Só desenvolvimento: marca o e-mail de uma conta de teste como confirmado, direto no banco local
 * (o script de testes de interface não lê a caixa de e-mail). Recusa banco que não seja local.
 * Uso: pnpm --filter @nextjourney/api exec tsx prisma/confirm-test-email.ts <email>
 */
const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.DATABASE_URL;
if (!email || !url) {
  process.stderr.write('Informe o e-mail e defina DATABASE_URL.\n');
  process.exit(1);
}
if (
  process.env.NODE_ENV === 'production' ||
  !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(url).hostname)
) {
  process.stderr.write('Recusado: só roda contra banco local e fora de produção.\n');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const result = await prisma.user.updateMany({
  where: { email, emailVerifiedAt: null },
  data: { emailVerifiedAt: new Date() },
});
await prisma.$disconnect();
process.stdout.write(`e-mail confirmado em ${result.count} conta(s)\n`);
