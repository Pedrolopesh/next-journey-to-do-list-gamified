// Checks the test account player state on the API (what the server decided), without depending on
// transient on-screen notices. Variables: MAESTRO_API_URL, MAESTRO_EMAIL, MAESTRO_PASSWORD and,
// optionally, EXP_TOTAL and COINS (exact expected values).
const base = MAESTRO_API_URL + '/v1';
const login = http.post(base + '/auth/login', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: MAESTRO_EMAIL, password: MAESTRO_PASSWORD }),
});
const token = json(login.body).tokens.accessToken;
const me = json(http.get(base + '/me', { headers: { authorization: 'Bearer ' + token } }).body);
const player = me.player;
if (typeof EXP_TOTAL !== 'undefined' && player.expTotal !== Number(EXP_TOTAL)) {
  throw new Error('Expected total EXP ' + EXP_TOTAL + ', got ' + player.expTotal);
}
if (typeof COINS !== 'undefined' && player.coins !== Number(COINS)) {
  throw new Error('Expected coins ' + COINS + ', got ' + player.coins);
}
