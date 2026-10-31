// Testes de interface do app (Maestro) contra a API local.
//
// 1) cria uma conta de teste NOVA na API (e-mail, senha e código aleatórios, só na memória deste
//    processo; a senha serve só para as conferências por API, o app entra pelo código);
// 2) cria um item inicial (os fluxos esperam "Item inicial"): a conta é confirmada direto no banco,
//    sem `verifyEmail`, então não recebe os itens de exemplo do servidor;
// 3) roda os fluxos de `.maestro/` no aparelho/emulador aberto, passando a conta por variável.
//    UI_FLOW=.maestro/flows/00-entrar-e-onboarding.yaml,.maestro/flows/01-criar-e-marcar-tarefa.yaml
//    roda só esses fluxos, em ordem (o primeiro precisa ser o de entrada, que loga na conta nova).
//
// Pré-requisitos: API no ar (E2E_API_URL, padrão http://localhost:3010), Metro rodando, o app de
// desenvolvimento instalado no emulador/simulador, e o Maestro (docs/TESTES.md).
import { spawnSync } from 'node:child_process';
import { randomBytes, randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const api = (process.env.E2E_API_URL ?? 'http://localhost:3010').replace(/\/$/, '');
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(api)) {
  process.stderr.write(
    'E2E_API_URL precisa ser local (localhost): o script cria uma conta de teste.\n',
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
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} respondeu ${response.status}`);
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
// O cadastro não devolve sessão: confirma o e-mail direto no banco local (utilitário só de desenvolvimento)
const confirm = spawnSync(
  'pnpm',
  ['--filter', '@nextjourney/api', 'exec', 'tsx', 'prisma/confirm-test-email.ts', email],
  { stdio: 'inherit' },
);
if (confirm.status !== 0) throw new Error('não foi possível confirmar o e-mail da conta de teste');
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
// O app entra por código de e-mail: grava um código conhecido (o envio do app não o troca)
const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
const setCode = spawnSync(
  'pnpm',
  ['--filter', '@nextjourney/api', 'exec', 'tsx', 'prisma/set-test-code.ts', email, code],
  { stdio: 'inherit' },
);
if (setCode.status !== 0) throw new Error('não foi possível gravar o código da conta de teste');
process.stdout.write('conta de teste criada (e-mail, senha e código só nesta execução)\n');

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
