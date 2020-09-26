/* eslint-disable quotes */
const request = require('supertest');
const app = require('../../src/app');

const mail = `${Date.now()}@mail.com`;

test('Deve listar todos os usuarios', () => {
  return request(app).get('/users')
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
});


test('Devo inserir usuario com sucesso', () => {
  return request(app).post('/users')
    .send({ name: 'Marco Ferreira', mail, passwd: "123456" })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Marco Ferreira');
    });
});

/* test('Não deve inserir usuario sem nome', () => {
  return request(app).post('/users')
    .send({ mail: 'marco@marco.com', passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Nome é um atributo obrigátorio.");
    });
});


test('Não deve inserir usuário sem email', async () => {
  const result = await request(app).post('/users')
    .send({ name: 'Marco Ferreira', passwd: '123456' });
  expect(result.status).toBe(400);
  expect(result.body.error).toBe("Email é um atributo obrigátorio.");
});

test("Não deve inserir usuario sem senha", (done) => {
  request(app).post('/users')
    .send({ name: 'Marco Ferreira', mail: 'marco@mail.com' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Senha é um atributo obrigátorio.");
      done();
    });
});

test('Não deve inserir usuário com email existente', () => {
  return request(app).post('/users')
    .send({ name: "Marco Ferreira", mail, passwd: "123456" })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Já existe um usuário com esse mail.");
    });
});
*/
