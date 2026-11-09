// App UI tests (Maestro) against the local API.
//
// 1) creates a NEW test account on the API (random email and codes, kept only in the memory of this process);
// 2) creates an initial item (the flows expect "Item inicial"): the account is confirmed straight in the database
//    before the first code is used, so it does not get the sample items from the server. The session of that step
//    is passed to the flows for the API checks (it lasts as long as an access token);
// 3) runs the `.maestro/` flows on the open device/emulator, passing the account through a variable.
//    UI_FLOW=.maestro/flows/00-sign-in-and-onboarding.yaml,.maestro/flows/01-create-and-check-task.yaml
//    runs only those flows, in order (the first must be the sign-in one, which logs into the new account).
//
// Prerequisites: API running (E2E_API_URL, default http://localhost:3010), Metro running, the development
// app installed on the emulator/simulator, and Maestro (docs/TESTES.md).
import { spawnSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
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

async function call(path, init = {}) {
  const response = await fetch(`${api}/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} responded ${response.status}`);
  // 202 and 204 answer without a body
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
/** Development-only utilities that write straight in the local database (they refuse any other database). */
function runDbUtility(script, ...args) {
  const result = spawnSync(
    'pnpm',
    ['--filter', '@nextjourney/api', 'exec', 'tsx', `prisma/${script}`, ...args],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error(`${script} failed`);
}

// Asking for a code creates the pending account
await call('/auth/email/start', {
  method: 'POST',
  body: JSON.stringify({ email, timezone: 'America/Sao_Paulo', termsVersion: '1' }),
});
runDbUtility('confirm-test-email.ts', email);
// The session for the setup and the API checks: a known code, used right away
const setupCode = newCode();
runDbUtility('set-test-code.ts', email, setupCode);
const session = await call('/auth/email/confirm', {
  method: 'POST',
  body: JSON.stringify({ email, code: setupCode }),
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
// The app signs in with an email code: stores another known code (the app sending does not replace it)
const code = newCode();
runDbUtility('set-test-code.ts', email, code);
process.stdout.write('test account created (email and codes only in this run)\n');

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
    `MAESTRO_ACCESS_TOKEN=${session.tokens.accessToken}`,
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
