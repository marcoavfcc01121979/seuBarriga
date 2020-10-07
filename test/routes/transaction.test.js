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

test('Deve inserir uma transação com sucesso', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), amount: 100, type: '1', acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.amount).toBe('100.00');
    });
});

test('Transações de entradas deve ser positivas.', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), amount: -100, type: '1', acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.amount).toBe('100.00');
    });
});

test('Transações de saida deve ser negativas', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), amount: 100, type: '0', acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.amount).toBe('-100.00');
    });
});

test('Não deve inserir uma transação sem descrição', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      date: new Date(), amount: 100, type: '1', acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Descrição é uma atributo obrigátorio.');
    });
});

test('Não deve inserir uma transação sem valor', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), type: '1', acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Valor é uma atributo obrigátorio.');
    });
});

test('Não deve inserir uma transação sem data', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', amount: 200, type: '1', acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Data é uma atributo obrigátorio.');
    });
});

test('Não deve inserir uma transação sem conta', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), amount: 200, type: '1',
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Conta é uma atributo obrigátorio.');
    });
});

test('Não deve inserir uma transação sem tipo', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), amount: 200, acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Tipo é uma atributo obrigátorio.');
    });
});

test.skip('Não deve inserir uma transação com tipo inválido', () => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({
      description: 'New T', date: new Date(), amount: 200, type: 2, acc_id: accUser.id,
    })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Tipo é atributo que tem que ser válido 1 ou 0.');
    });
});

test('Deve retorna uma transação por Id', () => {
  return app.db('transactions').insert(
    {
      description: 'T ID', date: new Date(), amount: 100, type: '1', acc_id: accUser.id,
    }, ['id'],
  )
    .then(trans => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
      .set('authorization', `bearer ${user.token}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(trans[0].id);
        expect(res.body.description).toBe('T ID');
      }));
});

test('Deve alterar uma transação', () => {
  return app.db('transactions')
    .insert({
      description: 'T TO UPDATE', date: new Date(), amount: 100, type: '1', acc_id: accUser.id,
    }, ['id'])
    .then(trans => request(app).put(`${MAIN_ROUTE}/${trans[0].id}`)
      .send({ description: 'Acc Updated' }).set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Acc Updated');
    });
});

test('Deve remover uma transação', () => {
  return app.db('transactions')
    .insert({
      description: 'ADD TRANSACTION', date: new Date(), amount: 100, type: '1', acc_id: accUser.id,
    }, ['id'])
    .then(trans => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(204);
    });
});


test('Não deve remover uma transação de outro usuario.', () => {
  return app.db('transactions')
    .insert({
      description: 'ADD TRANSACTION', date: new Date(), amount: 100, type: '1', acc_id: accUser2.id,
    }, ['id'])
    .then(trans => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário.');
    });
});
