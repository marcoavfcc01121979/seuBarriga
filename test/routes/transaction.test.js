const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');


const MAIN_ROUTE = '/v1/transactions';
let user;
let user2;
let accUser;
let accUser2;


beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('accounts').del();
  await app.db('users').del();
  const users = await app.db('users').insert([
    { name: 'user #1', mail: 'user@mail.com', passwd: 'gsafkhdgfiaydstfadbfkgfashgfkasytfasdhfhgbadskhgf' },
    { name: 'user #2', mail: 'user2@mail.com', passwd: 'gsafkhdgfiaydstfadbfkgfashgfkasytfasdhfhgbadskhgf' },
  ], '*');
  [user, user2] = users;
  delete user.passwd;
  user.token = jwt.encode(user, 'Segredo!');
  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');
  [accUser, accUser2] = accs;
});

test('Devo listar apenas as transações de usuário', () => {
  // 2 usuários, 2 contas e 2 transações.
  return app.db('transactions').insert([
    {
      description: 't1', date: new Date(), amount: 100, type: '1', acc_id: accUser.id,
    },
    {
      description: 't2', date: new Date(), amount: 300, type: '0', acc_id: accUser2.id,
    },
  ]).then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('t1');
    }));
});
