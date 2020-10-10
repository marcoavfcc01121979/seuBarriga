const request = require('supertest');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwIiwibmFtZSI6IlVzZXIgIzEiLCJtYWlsIjoidXNlckBtYWlsLmNvbSJ9.jajZpJXmAcoam5YPwR3q3H9Im9FHbBrUiKgO50ygIRI';

beforeAll(async () => {
  // await app.db.migrate.rollback();
  // await app.db.migrate.latest();
  return app.db.seed.run();
});

test('Deve listar apenas as transferências do usuário', () => {
  request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      // console.log(res.body);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('Transfer #1');
    });
});

test('Deve inserir uma transferência com sucesso', () => {
  return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date(),
    })
    .then(async (res) => {
      // console.log(res.body);
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Regular Transfer');

      const transactions = await app.db('transactions').where({ transfer_id: res.body.id });
      expect(transactions).toHaveLength(2);
      expect(transactions[0].description).toBe('Transfer to acc #10001');
      expect(transactions[1].description).toBe('Transfer from acc #10000');
      expect(transactions[0].amount).toBe('-100.00');
      expect(transactions[1].amount).toBe('100.00');
      expect(transactions[0].acc_id).toBe(10000);
      expect(transactions[1].acc_id).toBe(10001);
    });
});

describe('Ao salvar uma transferência válida...', () => {
  let transferId;
  let income;
  let outcome;

  test('Deve retornar o status 201 e os dados da transferencia', () => {
    return request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date(),
      })
      .then(async (res) => {
      // console.log(res.body);
        expect(res.status).toBe(201);
        expect(res.body.description).toBe('Regular Transfer');
        transferId = res.body.id;
      });
  });

  test('As transações equivalentes devem ter sido geradas', async () => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('amount');
    expect(transactions).toHaveLength(2);
    [outcome, income] = transactions;
  });

  test('A transação de saida deve ser negativa', () => {
    expect(outcome.description).toBe('Transfer to acc #10001');
    expect(outcome.amount).toBe('-100.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('0');
  });

  test('A transação de entrada deve ser positiva', () => {
    expect(income.description).toBe('Transfer from acc #10000');
    expect(income.amount).toBe('100.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('1');
  });

  test('Ambas devem referencias a transferencias que as originou', () => {
    expect(income.transfer_id).toBe(transferId);
    expect(outcome.transfer_id).toBe(transferId);
  });
});

describe('Ao tentar salvar uma transferencias inválida...', () => {
  const validTransfer = {
    description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date(),
  };

  const template = (newData, errorMessage) => {
    return request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ ...validTransfer, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };

  test('Não deve inserir sem descrição', () => template({ description: null }, 'Descrição é um atributo obrigátorio.'));
  test('Não deve inserir sem valor', () => template({ ammount: null }, 'Valor é um atributo obrigátorio.'));
  test('Não deve inserir sem data', () => template({ date: null }, 'Data é um atributo obrigátorio.'));
  test('Não deve inserir sem conta de origem', () => template({ acc_ori_id: null }, 'Conta de origem é um atributo obrigátorio.'));
  test('Não deve inserir sem conta de destino', () => template({ acc_dest_id: null }, 'Conta de destino é um atributo obrigátorio.'));
  test('Não deve inserir se as contas de origem e destino forem as mesmas', () => template({ acc_dest_id: 10000 }, 'Não é possivel transferir de uma conta para ela mesma.'));
  test('Não deve inserir se as contas pertecerem a outro usuários.', () => template({ acc_ori_id: 10002 }, 'Conta #10002 não pertence ao usuário'));
});

test('Deve retorna uma transferéncia por id', () => {
  return request(app).get(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Transfer #1');
    });
});

describe('Ao tentar alterar uma transferência válida...', () => {
  let transferId;
  let income;
  let outcome;

  test('Deve retornar o status 200 e os dados da transferencia', () => {
    return request(app).put(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'Transfer Updated', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 500, date: new Date(),
      })
      .then(async (res) => {
        expect(res.status).toBe(200);
        // console.log(res.body);
        expect(res.body.description).toBe('Transfer Updated');
        expect(res.body.ammount).toBe('500.00');
        transferId = res.body.id;
      });
  });

  test('As transações equivalentes devem ter sido geradas', async () => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('amount');
    expect(transactions).toHaveLength(2);
    [outcome, income] = transactions;
  });

  test('A transação de saida deve ser negativa', () => {
    expect(outcome.description).toBe('Transfer to acc #10001');
    expect(outcome.amount).toBe('-500.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('0');
  });

  test('A transação de entrada deve ser positiva', () => {
    expect(income.description).toBe('Transfer from acc #10000');
    expect(income.amount).toBe('500.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('1');
  });

  test('Ambas devem referencias a transferencias que as originou', () => {
    expect(income.transfer_id).toBe(transferId);
    expect(outcome.transfer_id).toBe(transferId);
  });
});

describe('Ao tentar alterar uma transferencias inválida...', () => {
  const validTransfer = {
    description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date(),
  };

  const template = (newData, errorMessage) => {
    return request(app).put(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ ...validTransfer, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };

  test('Não deve inserir sem descrição', () => template({ description: null }, 'Descrição é um atributo obrigátorio.'));
  test('Não deve inserir sem valor', () => template({ ammount: null }, 'Valor é um atributo obrigátorio.'));
  test('Não deve inserir sem data', () => template({ date: null }, 'Data é um atributo obrigátorio.'));
  test('Não deve inserir sem conta de origem', () => template({ acc_ori_id: null }, 'Conta de origem é um atributo obrigátorio.'));
  test('Não deve inserir sem conta de destino', () => template({ acc_dest_id: null }, 'Conta de destino é um atributo obrigátorio.'));
  test('Não deve inserir se as contas de origem e destino forem as mesmas', () => template({ acc_dest_id: 10000 }, 'Não é possivel transferir de uma conta para ela mesma.'));
  test('Não deve inserir se as contas pertecerem a outro usuários.', () => template({ acc_ori_id: 10002 }, 'Conta #10002 não pertence ao usuário'));
});

describe('Ao remover uma transfêrencia', () => {
  test('Deve retornar o status 204', () => {
    return request(app).delete(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(204);
      });
  });

  test('O registro deve ter sido removido do banco', () => {
    return app.db('transfers').where({ id: 10000 })
      .then((result) => {
        expect(result).toHaveLength(0);
      });
  });

  test('As transações associadas devem ter sido removidas', () => {
    return app.db('transactions').where({ transfer_id: 10000 })
      .then((result) => {
        expect(result).toHaveLength(0);
      });
  });
});

/* test('Não deve retornar transferencia de outro usuario', () => {
  return request(app).get(`${MAIN_ROUTE}/10001`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      // console.log(res.body);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário.');
    });
});
*/
