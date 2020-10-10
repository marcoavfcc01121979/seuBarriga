
exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('users').insert([
    {
      id: 10100, name: 'User #3', mail: 'user3@mail.com', passwd: '$2a$10$BKWBistO5ExZbFFMfS7hPusyJRon6ayOmNoGG25NezVZ1WVwZ8txu',
    },
    {
      id: 10101, name: 'User #4', mail: 'user4@mail.com', passwd: '$2a$10$BKWBistO5ExZbFFMfS7hPusyJRon6ayOmNoGG25NezVZ1WVwZ8txu',
    },
  ])
    .then(() => knex('accounts').insert([
      { id: 10100, name: 'Acc Saldo Principal', user_id: 10100 },
      { id: 10101, name: 'Acc Saldo Secundario', user_id: 10100 },
      { id: 10102, name: 'Acc Alternativa #1', user_id: 10101 },
      { id: 10103, name: 'Acc Alternativa #2', user_id: 10101 },
    ]));
};