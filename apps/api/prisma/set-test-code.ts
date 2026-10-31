import { createHash } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // sem .env
}

/**
 * Só desenvolvimento: grava um código de e-mail conhecido para uma conta de teste, direto no banco
 * local (os testes de interface não leem a caixa de e-mail). O envio do app não troca esse código:
 * a data do último envio vai para o futuro, dentro do intervalo mínimo entre e-mails. Recusa banco
 * que não seja local.
 * Uso: pnpm --filter @nextjourney/api exec tsx prisma/set-test-code.ts <email> <código de 6 dígitos>
 */
const email = process.argv[2]?.trim().toLowerCase();
const code = process.argv[3];
const url = process.env.DATABASE_URL;
if (!email || !code || !/^\d{6}$/.test(code) || !url) {
  process.stderr.write('Informe o e-mail, um código de 6 dígitos e defina DATABASE_URL.\n');
  process.exit(1);
}
const isLocal = (): boolean => {
  try {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(url).hostname);
  } catch {
    return false;
  }
};
if (process.env.NODE_ENV === 'production' || !isLocal()) {
  process.stderr.write('Recusado: só roda contra banco local e fora de produção.\n');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
if (!user) {
  process.stderr.write('Conta de teste não encontrada.\n');
  await prisma.$disconnect();
  process.exit(1);
}
const now = new Date();
await prisma.$transaction([
  prisma.emailVerification.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: now },
  }),
  prisma.emailVerification.create({
    data: {
      userId: user.id,
      codeHash: createHash('sha256').update(`${user.id}:${code}`).digest('hex'),
      expiresAt: new Date(now.getTime() + 60 * 60_000),
    },
  }),
  prisma.user.update({
    where: { id: user.id },
    data: { verificationMailSentAt: new Date(now.getTime() + 60 * 60_000) },
  }),
]);
await prisma.$disconnect();
process.stdout.write('código de teste gravado\n');
