// Checks the test account player state on the API (what the server decided), without depending on
// transient on-screen notices. Variables: MAESTRO_API_URL, MAESTRO_ACCESS_TOKEN (a session of the test
// account made by scripts/ui-tests.mjs, valid for the access token lifetime) and, optionally,
// EXP_TOTAL and COINS (exact expected values).
const base = MAESTRO_API_URL + '/v1';
const me = json(
  http.get(base + '/me', { headers: { authorization: 'Bearer ' + MAESTRO_ACCESS_TOKEN } }).body,
);
const player = me.player;
if (typeof EXP_TOTAL !== 'undefined' && player.expTotal !== Number(EXP_TOTAL)) {
  throw new Error('Expected total EXP ' + EXP_TOTAL + ', got ' + player.expTotal);
}
if (typeof COINS !== 'undefined' && player.coins !== Number(COINS)) {
  throw new Error('Expected coins ' + COINS + ', got ' + player.coins);
}
