module.exports = {
  knex: {
    client: 'pg',
    version: '10.14',
    connection: {
      host: '127.0.0.1',
      user: 'tdd',
      password: '29121950',
      database: 'barriga',
    },
    migrations: { directory: 'src/migrations' },
    seeds: { directory: 'src/seeds' },
  },
};
