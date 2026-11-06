// App UI tests (Maestro) against the local API.
//
// 1) creates a NEW test account on the API (random email, password and code, kept only in the memory of this
//    process; the password is only used for API checks, the app signs in with the code);
// 2) creates an initial item (the flows expect "Item inicial"): the account is confirmed straight in the database,
//    without `verifyEmail`, so it does not get the sample items from the server;
// 3) runs the `.maestro/` flows on the open device/emulator, passing the account through a variable.
//    UI_FLOW=.maestro/flows/00-sign-in-and-onboarding.yaml,.maestro/flows/01-create-and-check-task.yaml
//    runs only those flows, in order (the first must be the sign-in one, which logs into the new account).
//
// Prerequisites: API running (E2E_API_URL, default http://localhost:3010), Metro running, the development
// app installed on the emulator/simulator, and Maestro (docs/TESTES.md).
import { spawnSync } from 'node:child_process';
import { randomBytes, randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const api = (process.env.E2E_API_URL ?? 'http://localhost:3010').replace(/\/$/, '');
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(api)) {
  process.stderr.write(
    'E2E_API_URL must be local (localhost): the script creates a test account.\n',
  );
  process.exit(1);
}
const email = `ui-${Date.now()}@exemplo.com`;
const password = `Aa1#${randomBytes(9).toString('base64url')}`;

async function call(path, init = {}) {
  const response = await fetch(`${api}/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} responded ${response.status}`);
  return response.status === 204 ? null : response.json();
}

await call('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Teste de interface',
    email,
    password,
    confirmPassword: password,
    acceptedTerms: true,
    termsVersion: '1',
    timezone: 'America/Sao_Paulo',
  }),
});
// Sign-up does not return a session: confirms the email straight in the local database (development-only utility)
const confirm = spawnSync(
  'pnpm',
  ['--filter', '@nextjourney/api', 'exec', 'tsx', 'prisma/confirm-test-email.ts', email],
  { stdio: 'inherit' },
);
if (confirm.status !== 0) throw new Error('could not confirm the test account email');
const session = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const auth = { authorization: `Bearer ${session.tokens.accessToken}` };
const categories = await call('/categories', { headers: auth });
await call('/items', {
  method: 'POST',
  headers: auth,
  body: JSON.stringify({
    type: 'habit',
    title: 'Item inicial',
    categoryId: categories[0].id,
    difficulty: 'easy',
  }),
});
// The app signs in with an email code: stores a known code (the app sending does not replace it)
const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
const setCode = spawnSync(
  'pnpm',
  ['--filter', '@nextjourney/api', 'exec', 'tsx', 'prisma/set-test-code.ts', email, code],
  { stdio: 'inherit' },
);
if (setCode.status !== 0) throw new Error('could not store the test account code');
process.stdout.write('test account created (email, password and code only in this run)\n');

const local = join(homedir(), '.maestro', 'bin', 'maestro');
const maestro = process.env.MAESTRO_BIN ?? (existsSync(local) ? local : 'maestro');
const run = spawnSync(
  maestro,
  [
    'test',
    '--format',
    'junit',
    '--output',
    join('.maestro', 'relatorio.xml'),
    '-e',
    `MAESTRO_EMAIL=${email}`,
    '-e',
    `MAESTRO_PASSWORD=${password}`,
    '-e',
    `MAESTRO_CODE=${code}`,
    '-e',
    `MAESTRO_API_URL=${api}`,
    ...process.argv.slice(2),
    ...(process.env.UI_FLOW?.split(',') ?? ['.maestro']),
  ],
  { stdio: 'inherit' },
);
process.exit(run.status ?? 1);
