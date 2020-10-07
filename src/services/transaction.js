const ValidationError = require('../errors/validationError');

module.exports = (app) => {
  const find = (userId, filter = {}) => {
    return app.db('transactions')
      .join('accounts', 'accounts.id', 'acc_id')
      .where(filter)
      .andWhere('accounts.user_id', '=', userId)
      .select();
  };

  const findOne = (filter) => {
    return app.db('transactions')
      .where(filter)
      .first();
  };

  const save = (transaction) => {
    if (!transaction.description) throw new ValidationError('Descrição é uma atributo obrigátorio.');
    if (!transaction.amount) throw new ValidationError('Valor é uma atributo obrigátorio.');
    if (!transaction.date) throw new ValidationError('Data é uma atributo obrigátorio.');
    if (!transaction.acc_id) throw new ValidationError('Conta é uma atributo obrigátorio.');
    if (!transaction.type) throw new ValidationError('Tipo é uma atributo obrigátorio.');

    // if (transaction.type !== 1 && transaction.type !== 0) throw new ValidationError('Tipo é atributo que tem que ser válido 1 ou 0.');

    const newTransaction = { ...transaction };
    if ((transaction.type === '1' && transaction.amount < 0)
      || (transaction.type === '0' && transaction.amount > 0)) {
      newTransaction.amount *= -1;
    }

    return app.db('transactions')
      .insert(newTransaction, '*');
  };

  const update = (id, transaction) => {
    return app.db('transactions')
      .where({ id })
      .update(transaction, '*');
  };

  const remove = (id) => {
    return app.db('transactions')
      .where({ id })
      .del();
  };

  return {
    find, save, findOne, update, remove,
  };
};
