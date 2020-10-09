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
