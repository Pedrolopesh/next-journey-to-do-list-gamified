// Confere na API o estado do jogador da conta de teste (o que o servidor decidiu), sem depender de
// avisos passageiros da tela. Variáveis: MAESTRO_API_URL, MAESTRO_EMAIL, MAESTRO_PASSWORD e,
// opcionais, EXP_TOTAL e COINS (valores exatos esperados).
const base = MAESTRO_API_URL + '/v1';
const login = http.post(base + '/auth/login', {
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: MAESTRO_EMAIL, password: MAESTRO_PASSWORD }),
});
const token = json(login.body).tokens.accessToken;
const me = json(http.get(base + '/me', { headers: { authorization: 'Bearer ' + token } }).body);
const player = me.player;
if (typeof EXP_TOTAL !== 'undefined' && player.expTotal !== Number(EXP_TOTAL)) {
  throw new Error('EXP total esperado ' + EXP_TOTAL + ', veio ' + player.expTotal);
}
if (typeof COINS !== 'undefined' && player.coins !== Number(COINS)) {
  throw new Error('Moedas esperadas ' + COINS + ', vieram ' + player.coins);
}
